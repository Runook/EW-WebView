#!/bin/bash
# AWS生产环境部署脚本

set -e

echo "☁️  部署到AWS生产环境..."

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ 错误: 未找到AWS CLI，请先安装"
    exit 1
fi

# 配置
AWS_REGION="us-east-1"
ECR_BACKEND_REPO="ew-logistics-backend"
ECR_FRONTEND_REPO="ew-logistics-frontend"
ECS_CLUSTER="ew-logistics-cluster"
ECS_BACKEND_SERVICE="ew-logistics-backend-service"
ECS_FRONTEND_SERVICE="ew-logistics-frontend-service"

# 获取AWS账号ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS账号: $AWS_ACCOUNT_ID"

# 1. 登录ECR
echo "🔐 登录AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 2. 构建后端镜像
echo "🏗️  构建后端Docker镜像..."
cd backend
docker build -t $ECR_BACKEND_REPO:latest .
docker tag $ECR_BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
docker tag $ECR_BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

# 3. 推送后端镜像
echo "📤 推送后端镜像到ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

cd ..

# 4. 构建前端镜像
echo "🏗️  构建前端Docker镜像..."
cd frontend
docker build -f Dockerfile.prod -t $ECR_FRONTEND_REPO:latest .
docker tag $ECR_FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
docker tag $ECR_FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

# 5. 推送前端镜像
echo "📤 推送前端镜像到ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

cd ..

# 6. 运行数据库迁移（可选）
echo "🗄️  运行数据库迁移..."
# 注意：需要配置好RDS访问权限
# aws ecs run-task --cluster $ECS_CLUSTER --task-definition db-migration-task

# 7. 更新ECS服务
echo "🔄 更新ECS服务..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_BACKEND_SERVICE --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_FRONTEND_SERVICE --force-new-deployment

# 8. 等待部署完成
echo "⏳ 等待部署完成..."
aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_BACKEND_SERVICE $ECS_FRONTEND_SERVICE

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 生产环境地址:"
echo "   https://www.ewltl.com"
echo ""
echo "📊 检查ECS服务状态:"
echo "   aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_BACKEND_SERVICE $ECS_FRONTEND_SERVICE"

