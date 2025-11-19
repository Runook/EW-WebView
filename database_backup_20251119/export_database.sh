#!/bin/bash

HOST="ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com"
USER="ewjosh"
DB="ewlogistics"
PORT="5432"
export PGPASSWORD="Ew95279527"

# 创建输出目录
mkdir -p database_export

# 导出所有表结构
echo "正在导出表结构..."
psql -h $HOST -U $USER -d $DB -p $PORT -c "
SELECT 'CREATE TABLE ' || table_name || E';\n' ||
       array_to_string(
         array_agg(
           '  ' || column_name || ' ' || 
           CASE 
             WHEN data_type = 'USER-DEFINED' THEN udt_name
             WHEN character_maximum_length IS NOT NULL THEN data_type || '(' || character_maximum_length || ')'
             WHEN numeric_precision IS NOT NULL THEN data_type || '(' || numeric_precision || ',' || numeric_scale || ')'
             ELSE data_type
           END ||
           CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
         ), E',\n'
       )
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
" > database_export/table_structures_simple.txt

# 获取完整的表结构（使用 pg_dump 的替代方法）
echo "正在获取详细表信息..."
for table in companies customers employee_order_comments employee_order_logs employee_orders employee_permissions employee_role_permissions employee_statistics fba_comment_likes fba_comments fba_exchanges fba_locations fba_media_files jobs knex_migrations knex_migrations_lock land_loads land_trucks premium_posts rentals resumes sales system_config user_credits_log users users_backup_20251003
do
  echo "处理表: $table"
  psql -h $HOST -U $USER -d $DB -p $PORT -c "\d $table" > "database_export/${table}_structure.txt"
  psql -h $HOST -U $USER -d $DB -p $PORT -c "SELECT * FROM $table LIMIT 0;" -t > /dev/null 2>&1
  psql -h $HOST -U $USER -d $DB -p $PORT -c "COPY (SELECT * FROM $table) TO STDOUT WITH CSV HEADER;" > "database_export/${table}_data.csv" 2>&1
done

echo "导出完成！"
