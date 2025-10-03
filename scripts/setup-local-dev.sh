#!/bin/bash
# 本地开发环境设置脚本

set -e

echo "🚀 设置本地开发环境..."

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 创建本地环境配置
echo "📝 创建本地环境配置..."
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# 本地开发环境配置
NODE_ENV=development
ENV_MODE=local
AUTH_MODE=mock

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ew_logistics
DB_USER=ew-josh
DB_PASSWORD=

# 服务端口
BACKEND_PORT=5001
FRONTEND_PORT=3000

# JWT密钥
JWT_SECRET=dev-secret-key-change-in-production

# CORS配置
FRONTEND_URL=http://localhost:3000

# Mock用户配置
MOCK_USER_ID=1
MOCK_USER_EMAIL=dev@ewltl.com
MOCK_USER_CREDITS=9999
EOF
    echo "✅ 创建 .env.local 文件"
else
    echo "ℹ️  .env.local 已存在，跳过"
fi

# 2. 复制环境变量到backend
echo "📝 复制环境配置到backend..."
cp .env.local backend/.env.local || true

# 3. 停止现有容器
echo "🛑 停止现有Docker容器..."
docker-compose down || true

# 4. 清理缓存
echo "🧹 清理Docker缓存..."
docker system prune -f || true

# 5. 启动服务
echo "🐳 启动Docker服务..."
docker-compose --env-file .env.local up -d --build

# 6. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 7. 检查服务健康
echo "🔍 检查服务状态..."
echo ""
echo "后端健康检查:"
curl -f http://localhost:5001/health && echo "✅ 后端服务正常" || echo "❌ 后端服务异常"
echo ""
echo "前端服务:"
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ 前端服务正常" || echo "⏳ 前端正在启动..."

# 8. 显示日志
echo ""
echo "📊 Docker容器状态:"
docker-compose ps

echo ""
echo "✅ 本地开发环境设置完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:5001/api"
echo "   健康检查: http://localhost:5001/health"
echo ""
echo "🔧 当前模式: Mock认证 (无需AWS Cognito登录)"
echo ""
echo "📝 查看日志:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务:"
echo "   docker-compose down"

