#!/bin/bash

# ============================================
# EW Logistics 一键设置脚本
# 在新电脑上快速设置本地开发环境
# ============================================

set -e  # 遇到错误立即退出

DB_NAME="ewlogistics"
DB_USER="${DB_USER:-$USER}"  # 使用环境变量或当前用户

echo "╔════════════════════════════════════════════╗"
echo "║   EW Logistics 本地开发环境快速设置       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL 未安装！"
    echo ""
    echo "请先安装 PostgreSQL:"
    echo "  macOS:  brew install postgresql@17"
    echo "  Ubuntu: sudo apt install postgresql-17"
    echo "  Windows: 从 https://www.postgresql.org/download/ 下载"
    exit 1
fi

echo "✅ PostgreSQL 已安装"
PSQL_VERSION=$(psql --version | awk '{print $3}')
echo "   版本: $PSQL_VERSION"
echo ""

# 检查 PostgreSQL 服务是否运行
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL 服务未运行"
    echo "尝试启动服务..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@17 || brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql
    fi
    
    sleep 2
    
    if ! pg_isready &> /dev/null; then
        echo "❌ 无法启动 PostgreSQL 服务，请手动启动"
        exit 1
    fi
fi

echo "✅ PostgreSQL 服务运行中"
echo ""

# 步骤1: 创建数据库
echo "步骤 1/4: 创建数据库"
echo "----------------------------------------"

if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  数据库 '$DB_NAME' 已存在"
    read -p "是否删除并重新创建? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dropdb "$DB_NAME"
        echo "🗑️  已删除旧数据库"
        createdb "$DB_NAME"
        echo "✅ 数据库已创建"
    else
        echo "继续使用现有数据库..."
    fi
else
    createdb "$DB_NAME"
    echo "✅ 数据库 '$DB_NAME' 已创建"
fi
echo ""

# 步骤2: 导入数据库结构
echo "步骤 2/4: 导入数据库结构"
echo "----------------------------------------"

if [ -f "complete_database_dump.sql" ]; then
    echo "📋 使用 complete_database_dump.sql"
    psql -d "$DB_NAME" -f complete_database_dump.sql > /dev/null 2>&1
    echo "✅ 数据库结构已导入"
elif [ -f "full_database_schema.sql" ]; then
    echo "📋 使用 full_database_schema.sql"
    psql -d "$DB_NAME" -f full_database_schema.sql > /dev/null 2>&1
    echo "✅ 数据库结构已导入"
else
    echo "❌ 找不到结构文件！"
    exit 1
fi
echo ""

# 步骤3: 导入数据
echo "步骤 3/4: 导入数据"
echo "----------------------------------------"

if [ -f "import_all_data.sh" ]; then
    chmod +x import_all_data.sh
    ./import_all_data.sh
else
    echo "⚠️  找不到 import_all_data.sh，手动导入数据..."
    
    for file in *_data.csv; do
        if [ -f "$file" ]; then
            table=$(echo "$file" | sed 's/_data.csv//')
            echo "导入 $table..."
            psql -d "$DB_NAME" -c "\COPY $table FROM '$file' WITH CSV HEADER;" > /dev/null 2>&1 || true
        fi
    done
    
    echo "✅ 数据导入完成"
fi
echo ""

# 步骤4: 验证安装
echo "步骤 4/4: 验证安装"
echo "----------------------------------------"

table_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ 数据库表数量: $table_count"

user_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
echo "✅ 用户数量: $user_count"

company_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null || echo "0")
echo "✅ 公司数量: $company_count"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║           🎉 设置完成！                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📝 下一步操作:"
echo ""
echo "1️⃣  配置后端数据库连接"
echo "   编辑: backend/src/config/database.js"
echo "   或设置环境变量:"
echo ""
echo "   export DB_HOST=localhost"
echo "   export DB_PORT=5432"
echo "   export DB_NAME=ewlogistics"
echo "   export DB_USER=$DB_USER"
echo ""
echo "2️⃣  配置 Employee Service"
echo "   编辑: employee-service/src/config/database.js"
echo ""
echo "3️⃣  安装依赖并启动服务"
echo "   cd backend && npm install && npm start"
echo "   cd employee-service && npm install && npm start"
echo "   cd frontend && npm install && npm start"
echo ""
echo "4️⃣  测试数据库连接"
echo "   psql -d ewlogistics"
echo ""
echo "📚 完整文档请查看: LOCAL_SETUP_GUIDE.md"
echo ""

