#!/bin/bash

# 生产环境启动脚本
echo "🚀 Starting EW Logistics Platform in production mode..."

# 设置环境变量
export NODE_ENV=production

# 检查必要的环境变量
if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is not set"
    exit 1
fi

if [ -z "$DB_HOST" ]; then
    echo "❌ Error: DB_HOST environment variable is not set"
    exit 1
fi

if [ -z "$DB_USER" ]; then
    echo "❌ Error: DB_USER environment variable is not set"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: DB_PASSWORD environment variable is not set"
    exit 1
fi

# 运行数据库迁移
echo "📊 Running database migrations..."
npm run db:migrate

# 启动应用
echo "🎯 Starting application..."
node src/app.js
