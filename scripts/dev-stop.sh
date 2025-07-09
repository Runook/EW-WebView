#!/bin/bash

# EW物流平台开发环境停止脚本

echo "🛑 停止EW物流平台开发环境..."

# 停止通过PID文件记录的进程
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🔴 停止后端服务 (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🔴 停止前端服务 (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null
    fi
    rm -f .frontend.pid
fi

# 强制停止Node.js进程（端口占用情况）
echo "🔍 检查端口占用..."

# 停止占用3000端口的进程
PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000_PID" ]; then
    echo "🔴 停止占用3000端口的进程 (PID: $PORT_3000_PID)"
    kill $PORT_3000_PID 2>/dev/null
fi

# 停止占用5001端口的进程
PORT_5001_PID=$(lsof -ti:5001 2>/dev/null)
if [ ! -z "$PORT_5001_PID" ]; then
    echo "🔴 停止占用5001端口的进程 (PID: $PORT_5001_PID)"
    kill $PORT_5001_PID 2>/dev/null
fi

# 等待进程完全停止
sleep 2

# 再次检查是否还有进程在运行
REMAINING_3000=$(lsof -ti:3000 2>/dev/null)
REMAINING_5001=$(lsof -ti:5001 2>/dev/null)

if [ ! -z "$REMAINING_3000" ] || [ ! -z "$REMAINING_5001" ]; then
    echo "⚠️  有进程仍在运行，强制停止..."
    [ ! -z "$REMAINING_3000" ] && kill -9 $REMAINING_3000 2>/dev/null
    [ ! -z "$REMAINING_5001" ] && kill -9 $REMAINING_5001 2>/dev/null
fi

echo "✅ 开发环境已停止"

# 清理临时文件
echo "🧹 清理临时文件..."
rm -f .backend.pid .frontend.pid

echo "🎉 清理完成！" 