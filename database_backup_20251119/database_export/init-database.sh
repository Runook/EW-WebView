#!/bin/bash
set -e

echo "🚀 开始初始化 EW Logistics 数据库..."

# 数据库已经由 POSTGRES_DB 环境变量自动创建
echo "✅ 数据库 ewlogistics 已创建"

# 检查是否需要导入表结构
if [ -f /docker-entrypoint-initdb.d/create_full_schema.sql ]; then
    echo "📋 导入数据库结构（序列 + 表）..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/create_full_schema.sql
    echo "✅ 数据库结构导入完成"
else
    echo "⚠️  未找到结构文件，跳过..."
fi

# 导入数据（CSV文件）
if [ -d /docker-entrypoint-initdb.d/csv_data ]; then
    echo "📊 导入数据文件..."
    
    # 按顺序导入表数据
    tables=(
        "knex_migrations"
        "knex_migrations_lock"
        "system_config"
        "users"
        "companies"
        "customers"
        "employee_permissions"
        "employee_role_permissions"
        "employee_orders"
        "fba_locations"
        "jobs"
        "land_trucks"
        "sales"
        "rentals"
    )
    
    for table in "${tables[@]}"; do
        csv_file="/docker-entrypoint-initdb.d/csv_data/${table}_data.csv"
        if [ -f "$csv_file" ]; then
            echo "  导入 $table..."
            psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
                -c "\COPY $table FROM '$csv_file' WITH CSV HEADER;" 2>&1 | grep -v "COPY 0" || true
        fi
    done
    
    echo "✅ 数据导入完成"
else
    echo "ℹ️  未找到数据文件，数据库为空"
fi

echo "🎉 数据库初始化完成！"

