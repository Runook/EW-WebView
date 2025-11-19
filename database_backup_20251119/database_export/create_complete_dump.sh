#!/bin/bash

HOST="ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com"
USER="ewjosh"
DB="ewlogistics"
PORT="5432"
export PGPASSWORD="Ew95279527"

# 创建完整的SQL导出文件
cat > complete_database_dump.sql << 'SQLEOF'
-- ============================================
-- EW Logistics 数据库完整导出
-- 生成时间: $(date)
-- ============================================

-- 设置客户端编码
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

SQLEOF

# 获取所有表的完整CREATE TABLE语句
echo "-- ============================================" >> complete_database_dump.sql
echo "-- 表结构定义" >> complete_database_dump.sql
echo "-- ============================================" >> complete_database_dump.sql
echo "" >> complete_database_dump.sql

# 使用 psql 的 pg_dump 功能来获取表结构
tables="companies customers employee_order_comments employee_order_logs employee_orders employee_permissions employee_role_permissions employee_statistics fba_comment_likes fba_comments fba_exchanges fba_locations fba_media_files jobs knex_migrations knex_migrations_lock land_loads land_trucks premium_posts rentals resumes sales system_config user_credits_log users users_backup_20251003"

for table in $tables; do
    echo "正在导出表结构: $table"
    echo "" >> complete_database_dump.sql
    echo "-- 表: $table" >> complete_database_dump.sql
    
    # 获取列定义
    psql -h $HOST -U $USER -d $DB -p $PORT -t -A -F" " << INNEREOF >> complete_database_dump.sql
SELECT 'CREATE TABLE IF NOT EXISTS $table (';
SELECT '    ' || string_agg(
    column_name || ' ' || 
    CASE 
        WHEN data_type = 'USER-DEFINED' THEN udt_name
        WHEN data_type = 'character varying' THEN 'VARCHAR' || COALESCE('(' || character_maximum_length || ')', '')
        WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
        WHEN data_type = 'numeric' THEN 'NUMERIC' || COALESCE('(' || numeric_precision || ',' || numeric_scale || ')', '')
        ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    E',\n    '
) FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = '$table'
GROUP BY table_name;
SELECT ');';
SELECT '';
INNEREOF

done

echo "" >> complete_database_dump.sql
echo "-- ============================================" >> complete_database_dump.sql
echo "-- 数据导入 (从CSV文件)" >> complete_database_dump.sql
echo "-- ============================================" >> complete_database_dump.sql
echo "-- 请使用以下命令导入数据：" >> complete_database_dump.sql

for table in $tables; do
    echo "-- COPY $table FROM '/path/to/database_export/${table}_data.csv' WITH CSV HEADER;" >> complete_database_dump.sql
done

echo "完整数据库导出脚本已创建: complete_database_dump.sql"
