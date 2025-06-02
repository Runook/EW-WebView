# EW Logistics Platform - Makefile

.PHONY: help build up down logs clean install dev dev-local local-up local-down prod test

# 默认目标
help:
	@echo "EW Logistics Platform - 可用命令:"
	@echo ""
	@echo "本地开发 (推荐):"
	@echo "  make local-up   - 启动本地开发环境 (Node.js)"
	@echo "  make local-down - 停止本地开发环境"
	@echo "  make install    - 安装所有依赖"
	@echo ""
	@echo "Docker开发环境:"
	@echo "  make dev        - 启动Docker开发环境"
	@echo "  make build      - 构建所有服务"
	@echo "  make up         - 启动所有服务"
	@echo "  make down       - 停止所有服务"
	@echo "  make logs       - 查看服务日志"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod       - 启动生产环境"
	@echo "  make prod-build - 构建生产镜像"
	@echo ""
	@echo "测试和维护:"
	@echo "  make test       - 运行测试"
	@echo "  make clean      - 清理容器和卷"
	@echo "  make reset      - 完全重置环境"

# 安装依赖
install:
	@echo "📦 安装前端依赖..."
	cd frontend && npm install
	@echo "📦 安装后端依赖..."
	cd backend && npm install
	@echo "✅ 依赖安装完成"

# 本地开发环境 (推荐)
local-up:
	@echo "🚀 启动本地开发环境..."
	./start-local.sh

local-down:
	@echo "🛑 停止本地开发环境..."
	./stop-local.sh

# Docker开发环境
dev:
	@echo "🚀 启动Docker开发环境..."
	docker-compose up --build

# 构建服务
build:
	@echo "🔨 构建所有服务..."
	docker-compose build

# 启动服务
up:
	@echo "▶️  启动所有服务..."
	docker-compose up -d

# 停止服务
down:
	@echo "⏹️  停止所有服务..."
	docker-compose down

# 查看日志
logs:
	@echo "📋 查看服务日志..."
	docker-compose logs -f

# 生产环境
prod:
	@echo "🚀 启动生产环境..."
	docker-compose --profile production up -d

# 构建生产镜像
prod-build:
	@echo "🔨 构建生产镜像..."
	docker-compose --profile production build

# 运行测试
test:
	@echo "🧪 运行前端测试..."
	cd frontend && npm test -- --watchAll=false
	@echo "🧪 运行后端测试..."
	cd backend && npm test

# 清理容器和卷
clean:
	@echo "🧹 清理 Docker 资源..."
	docker-compose down -v
	docker system prune -f

# 完全重置
reset: clean
	@echo "🔄 完全重置环境..."
	docker-compose down -v --remove-orphans
	docker system prune -a -f
	@echo "✅ 环境重置完成"

# 数据库操作
db-migrate:
	@echo "📊 运行数据库迁移..."
	cd backend && npm run migration:run

db-seed:
	@echo "🌱 运行数据库种子..."
	cd backend && npm run seed:run

# 部署到 AWS
deploy-aws:
	@echo "☁️  部署到 AWS..."
	./deployment/scripts/deploy.sh

# 健康检查
health:
	@echo "🏥 检查服务健康状态..."
	curl -f http://localhost:5001/health || echo "❌ 后端服务不可用"
	curl -f http://localhost:3000 || echo "❌ 前端服务不可用" 