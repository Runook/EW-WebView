#!/bin/bash

# ============================================
# 完整的数据库导入脚本 - 一键完成所有操作
# ============================================

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   EW Logistics 数据库完整导入脚本          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 检查是否在正确的目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 回到项目根目录
PROJECT_ROOT="../../"
cd "$PROJECT_ROOT"

echo "📍 项目目录: $(pwd)"
echo ""

# ============================================
# 第一步：启动 PostgreSQL 容器
# ============================================
echo "第1步: 启动 PostgreSQL 容器..."
echo "----------------------------------------"
docker-compose up -d postgres

echo "等待 PostgreSQL 启动..."
sleep 5

# 等待 PostgreSQL 就绪
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U ewadmin -d ewlogistics > /dev/null 2>&1; then
        echo "✅ PostgreSQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL 启动超时"
        exit 1
    fi
    echo "等待中... ($i/30)"
    sleep 2
done
echo ""

# ============================================
# 第二步：创建所有序列
# ============================================
echo "第2步: 创建所有序列..."
echo "----------------------------------------"

docker-compose exec -T postgres psql -U ewadmin -d ewlogistics << 'EOSQL'
-- 创建所有必需的序列
CREATE SEQUENCE IF NOT EXISTS companies_id_seq;
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_order_comments_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_order_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_permissions_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_role_permissions_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_statistics_id_seq;
CREATE SEQUENCE IF NOT EXISTS fba_comment_likes_id_seq;
CREATE SEQUENCE IF NOT EXISTS fba_comments_id_seq;
CREATE SEQUENCE IF NOT EXISTS fba_exchanges_id_seq;
CREATE SEQUENCE IF NOT EXISTS fba_locations_id_seq;
CREATE SEQUENCE IF NOT EXISTS fba_media_files_id_seq;
CREATE SEQUENCE IF NOT EXISTS jobs_id_seq;
CREATE SEQUENCE IF NOT EXISTS knex_migrations_id_seq;
CREATE SEQUENCE IF NOT EXISTS knex_migrations_lock_index_seq;
CREATE SEQUENCE IF NOT EXISTS land_loads_id_seq;
CREATE SEQUENCE IF NOT EXISTS land_trucks_id_seq;
CREATE SEQUENCE IF NOT EXISTS premium_posts_id_seq;
CREATE SEQUENCE IF NOT EXISTS rentals_id_seq;
CREATE SEQUENCE IF NOT EXISTS resumes_id_seq;
CREATE SEQUENCE IF NOT EXISTS sales_id_seq;
CREATE SEQUENCE IF NOT EXISTS system_config_id_seq;
CREATE SEQUENCE IF NOT EXISTS user_credits_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS users_id_seq;
CREATE SEQUENCE IF NOT EXISTS users_backup_20251003_id_seq;
EOSQL

seq_count=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -t -c "SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public';" | tr -d ' ')
echo "✅ 创建了 $seq_count 个序列"
echo ""

# ============================================
# 第三步：导入表结构
# ============================================
echo "第3步: 导入表结构..."
echo "----------------------------------------"

if [ -f "database_backup_20251119/database_export/complete_database_dump.sql" ]; then
    docker-compose exec -T postgres psql -U ewadmin -d ewlogistics < database_backup_20251119/database_export/complete_database_dump.sql 2>&1 | head -20
    
    table_count=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')
    echo "✅ 创建了 $table_count 个表"
else
    echo "❌ 找不到 complete_database_dump.sql"
    exit 1
fi
echo ""

# ============================================
# 第四步：导入数据
# ============================================
echo "第4步: 导入数据..."
echo "----------------------------------------"

# 定义表的导入顺序（按依赖关系）
tables=(
    "knex_migrations"
    "knex_migrations_lock"
    "system_config"
    "users"
    "users_backup_20251003"
    "companies"
    "customers"
    "employee_permissions"
    "employee_role_permissions"
    "employee_statistics"
    "employee_orders"
    "employee_order_comments"
    "employee_order_logs"
    "fba_locations"
    "fba_comments"
    "fba_comment_likes"
    "fba_exchanges"
    "fba_media_files"
    "jobs"
    "resumes"
    "land_trucks"
    "land_loads"
    "premium_posts"
    "rentals"
    "sales"
    "user_credits_log"
)

success_count=0
error_count=0

for table in "${tables[@]}"; do
    file="database_backup_20251119/database_export/${table}_data.csv"
    
    if [ -f "$file" ]; then
        echo "📦 导入表: $table"
        
        # 复制文件到容器
        docker cp "$file" ewlogistics-postgres:/tmp/import.csv > /dev/null 2>&1
        
        # 导入数据
        result=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -c "\COPY $table FROM '/tmp/import.csv' WITH CSV HEADER;" 2>&1)
        
        if echo "$result" | grep -q "COPY"; then
            rows=$(echo "$result" | grep -o "COPY [0-9]*" | awk '{print $2}')
            if [ -z "$rows" ] || [ "$rows" == "0" ]; then
                echo "   ⚠️  表为空"
            else
                echo "   ✅ 导入 $rows 行"
                ((success_count++))
            fi
        else
            echo "   ❌ 导入失败: $result"
            ((error_count++))
        fi
    else
        echo "⚠️  文件不存在: $file"
    fi
done

echo ""
echo "导入统计: 成功 $success_count 个表, 失败 $error_count 个表"
echo ""

# ============================================
# 第五步: 重置序列
# ============================================
echo "第5步: 重置所有序列..."
echo "----------------------------------------"

docker-compose exec -T postgres psql -U ewadmin -d ewlogistics << 'EOSQL'
DO $$
DECLARE
    seq_record RECORD;
    max_id INTEGER;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' AND sequence_name LIKE '%_id_seq'
    LOOP
        DECLARE
            table_name TEXT;
        BEGIN
            table_name := REPLACE(seq_record.sequence_name, '_id_seq', '');
            
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', table_name) INTO max_id;
                
                IF max_id > 0 THEN
                    EXECUTE format('SELECT setval(%L, %s)', seq_record.sequence_name, max_id + 1);
                    RAISE NOTICE '重置序列 % 为 %', seq_record.sequence_name, max_id + 1;
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;
EOSQL

echo "✅ 序列重置完成"
echo ""

# ============================================
# 第六步: 验证
# ============================================
echo "第6步: 验证数据库..."
echo "----------------------------------------"

echo "📊 数据库统计:"
docker-compose exec -T postgres psql -U ewadmin -d ewlogistics << 'EOSQL'
SELECT 
    schemaname,
    tablename,
    n_live_tup as rows
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY n_live_tup DESC
LIMIT 10;
EOSQL

echo ""

# 显示关键表的数据量
user_count=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
company_count=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | tr -d ' ')

echo "✅ 用户数量: $user_count"
echo "✅ 公司数量: $company_count"
echo ""

# ============================================
# 完成
# ============================================
echo "╔════════════════════════════════════════════╗"
echo "║           🎉 导入完成！                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "下一步:"
echo "  1. 回到项目根目录: cd ../.."
echo "  2. 启动所有服务: docker-compose up --build"
echo "  3. 访问应用: http://localhost:3000"
echo ""
