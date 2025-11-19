#!/bin/bash

# ============================================
# 数据库导入到 Docker PostgreSQL 容器脚本
# ============================================

echo "╔════════════════════════════════════════════╗"
echo "║   导入数据到 Docker PostgreSQL 容器       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 检查是否在正确的目录
if [ ! -f "complete_database_dump.sql" ]; then
    echo "❌ 错误: 找不到 complete_database_dump.sql"
    echo "请在 database_export 目录下运行此脚本"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "第一步: 启动 PostgreSQL 容器..."
echo "----------------------------------------"

# 回到项目根目录
cd ../..

# 只启动 PostgreSQL 容器
docker-compose up -d postgres

echo "等待 PostgreSQL 启动..."
sleep 10

# 检查 PostgreSQL 是否就绪
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U ewadmin -d ewlogistics > /dev/null 2>&1; then
        echo "✅ PostgreSQL 已就绪"
        break
    fi
    echo "等待 PostgreSQL... ($i/30)"
    sleep 2
done

echo ""
echo "第二步: 创建数据库结构..."
echo "----------------------------------------"

# 导入表结构
docker-compose exec -T postgres psql -U ewadmin -d ewlogistics < database_backup_20251119/database_export/complete_database_dump.sql 2>&1 | head -20

echo ""
echo "第三步: 导入数据..."
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
    "employee_orders"
    "employee_order_comments"
    "employee_order_logs"
    "employee_statistics"
    "fba_locations"
    "fba_comments"
    "fba_comment_likes"
    "fba_exchanges"
    "fba_media_files"
    "jobs"
    "land_trucks"
    "land_loads"
    "premium_posts"
    "rentals"
    "resumes"
    "sales"
    "user_credits_log"
)

success_count=0
error_count=0

for table in "${tables[@]}"; do
    file="database_backup_20251119/database_export/${table}_data.csv"
    
    if [ -f "$file" ]; then
        echo "📦 导入表: $table"
        
        # 使用 Docker 复制文件到容器并导入
        docker cp "$file" ewlogistics-postgres:/tmp/import.csv
        
        result=$(docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -c "\COPY $table FROM '/tmp/import.csv' WITH CSV HEADER;" 2>&1)
        
        if [ $? -eq 0 ]; then
            rows=$(echo "$result" | grep -o "COPY [0-9]*" | awk '{print $2}')
            if [ -z "$rows" ] || [ "$rows" == "0" ]; then
                echo "   ⚠️  没有数据被导入（表可能为空）"
            else
                echo "   ✅ 成功导入 $rows 行"
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
echo "第四步: 重置序列..."
echo "----------------------------------------"

docker-compose exec -T postgres psql -U ewadmin -d ewlogistics << 'EOF'
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
                RAISE NOTICE '跳过序列 %: %', seq_record.sequence_name, SQLERRM;
        END;
    END LOOP;
END $$;
EOF

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║           🎉 导入完成！                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "导入统计:"
echo "  成功: $success_count 个表"
echo "  失败: $error_count 个表"
echo ""
echo "📊 数据库统计:"
docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null | head -4 | tail -1
docker-compose exec -T postgres psql -U ewadmin -d ewlogistics -c "SELECT COUNT(*) as company_count FROM companies;" 2>/dev/null | head -4 | tail -1

echo ""
echo "下一步："
echo "  回到项目根目录: cd ../.."
echo "  启动所有服务: docker-compose up --build"
echo ""

