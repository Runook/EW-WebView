#!/bin/bash

# EW物流平台开发环境启动脚本

echo "🚀 启动EW物流平台开发环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js版本过低，需要16+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查并安装依赖
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo "📦 检查 $name 依赖..."
    cd $dir
    
    if [ ! -d "node_modules" ]; then
        echo "🔽 安装 $name 依赖..."
        npm install
    else
        echo "✅ $name 依赖已存在"
    fi
    
    cd ..
}

# 安装前端依赖
if [ -d "frontend" ]; then
    install_dependencies "frontend" "前端"
else
    echo "❌ frontend目录不存在"
    exit 1
fi

# 安装后端依赖
if [ -d "backend" ]; then
    install_dependencies "backend" "后端"
else
    echo "❌ backend目录不存在"
    exit 1
fi

# 创建环境配置文件
create_env_files() {
    echo "📝 创建环境配置文件..."
    
    # 前端环境配置
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_NAME=EW物流平台
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=true
EOF
        echo "✅ 创建前端环境配置"
    fi
    
    # 后端环境配置
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key-$(date +%s)
LOG_LEVEL=debug
EOF
        echo "✅ 创建后端环境配置"
    fi
}

create_env_files

# 启动服务
echo "🔧 启动服务..."

# 启动后端
echo "🚀 启动后端服务..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo "🚀 启动前端服务..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "🎉 开发环境启动完成！"
echo ""
echo "📊 服务地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:5001"
echo "   后端API: http://localhost:5001/api"
echo "   健康检查: http://localhost:5001/health"
echo ""
echo "📝 停止服务:"
echo "   使用 Ctrl+C 停止脚本"
echo "   或运行: ./dev-stop.sh"
echo ""

# 保存PID以便停止服务
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 等待用户中断
trap 'echo "🛑 停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; exit 0' INT

# 保持脚本运行
wait 