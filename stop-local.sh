#!/bin/bash

# EW物流平台 - 停止本地开发服务

echo "🛑 停止EW物流平台本地开发环境..."

# 读取进程ID并终止
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "  停止后端服务 (PID: $BACKEND_PID)"
        kill $BACKEND_PID
    fi
    rm backend.pid
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "  停止前端服务 (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID
    fi
    rm frontend.pid
fi

# 强制终止相关进程
echo "  清理所有相关进程..."
pkill -f "node.*src/app.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

echo "✅ 所有服务已停止" 