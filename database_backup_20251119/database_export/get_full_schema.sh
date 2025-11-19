#!/bin/bash

HOST="ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com"
USER="ewjosh"
DB="ewlogistics"
PORT="5432"
export PGPASSWORD="Ew95279527"

echo "获取完整数据库架构..."

# 导出所有DDL语句
psql -h $HOST -U $USER -d $DB -p $PORT > full_database_schema.sql << 'PSQLEOF'

-- ============================================
-- EW Logistics 完整数据库结构
-- ============================================

-- 获取所有表的详细信息
\dt+

-- 获取所有序列
\ds

-- 导出每个表的完整结构
\d companies
\d customers
\d employee_order_comments
\d employee_order_logs
\d employee_orders
\d employee_permissions
\d employee_role_permissions
\d employee_statistics
\d fba_comment_likes
\d fba_comments
\d fba_exchanges
\d fba_locations
\d fba_media_files
\d jobs
\d knex_migrations
\d knex_migrations_lock
\d land_loads
\d land_trucks
\d premium_posts
\d rentals
\d resumes
\d sales
\d system_config
\d user_credits_log
\d users
\d users_backup_20251003

PSQLEOF

echo "架构已导出到 full_database_schema.sql"
