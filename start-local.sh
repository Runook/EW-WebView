#!/bin/bash

# EW物流平台 - 本地开发启动脚本

echo "🚀 启动EW物流平台本地开发环境..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 检查并安装依赖..."

echo "  安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "  安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo "✅ 依赖检查完成"

# 启动后端
echo "🔧 启动后端服务..."
cd backend
npm start &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -f http://localhost:5001/health &> /dev/null; then
    echo "✅ 后端服务启动成功 (http://localhost:5001)"
else
    echo "⚠️  后端服务可能未完全启动，请检查日志"
fi

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend

# 检查端口3000是否被占用
if lsof -i :3000 &> /dev/null; then
    echo "⚠️  端口3000被占用，将使用其他端口"
    PORT=3001 npm start &
    FRONTEND_PID=$!
    echo "✅ 前端服务启动成功 (http://localhost:3001)"
else
    npm start &
    FRONTEND_PID=$!
    echo "✅ 前端服务启动成功 (http://localhost:3000)"
fi

# 保存进程ID
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo ""
echo "🎉 EW物流平台已启动！"
echo ""
echo "服务地址："
echo "  前端: http://localhost:3000 (或 3001)"
echo "  后端: http://localhost:5001"
echo "  API: http://localhost:5001/api"
echo "  健康检查: http://localhost:5001/health"
echo ""
echo "测试账户："
echo "  货主: shipper@test.com / test123"
echo "  承运商: carrier@test.com / test123"
echo ""
echo "按 Ctrl+C 停止服务，或运行 ./stop-local.sh"
echo ""

# 等待用户中断
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait 