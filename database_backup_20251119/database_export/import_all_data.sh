#!/bin/bash

# ============================================
# EW Logistics 数据导入脚本
# ============================================

DB="ewlogistics"

echo "🚀 开始导入数据到数据库: $DB"
echo ""

# 定义表的导入顺序（按依赖关系）
declare -a tables=(
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
    file="${table}_data.csv"
    
    if [ -f "$file" ]; then
        echo "📦 导入表: $table"
        
        # 检查文件大小
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "   文件大小: $size"
        
        # 导入数据
        result=$(psql -d $DB -c "\COPY $table FROM '$file' WITH CSV HEADER;" 2>&1)
        
        if [ $? -eq 0 ]; then
            # 提取导入的行数
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
        echo ""
    else
        echo "⚠️  文件不存在: $file"
        echo ""
    fi
done

echo "============================================"
echo "导入完成！"
echo "成功: $success_count 个表"
echo "失败: $error_count 个表"
echo "============================================"

# 重置序列
echo ""
echo "🔄 重置所有序列..."
psql -d $DB << 'EOF'
DO $$
DECLARE
    seq_record RECORD;
    max_id INTEGER;
    seq_name TEXT;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        -- 从序列名中提取表名
        seq_name := seq_record.sequence_name;
        
        -- 只处理 _id_seq 结尾的序列
        IF seq_name LIKE '%_id_seq' THEN
            DECLARE
                table_name TEXT;
            BEGIN
                table_name := REPLACE(seq_name, '_id_seq', '');
                
                -- 检查表是否存在
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
                    -- 获取表中的最大 ID
                    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', table_name) INTO max_id;
                    
                    IF max_id > 0 THEN
                        -- 设置序列值
                        EXECUTE format('SELECT setval(%L, %s)', seq_name, max_id + 1);
                        RAISE NOTICE '重置序列 % 为 %', seq_name, max_id + 1;
                    END IF;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '跳过序列 %: %', seq_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;
EOF

echo "✅ 序列重置完成！"
echo ""

# 显示数据统计
echo "📊 数据库统计:"
psql -d $DB << 'EOF'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup as rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 15;
EOF

echo ""
echo "🎉 全部完成！数据库已准备就绪。"

