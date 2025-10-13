#!/bin/bash
set -e

echo "🔧 部署后端（修复 cargo_description 必填字段）"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
echo "📅 时间戳: $TIMESTAMP"

# 登录ECR
echo "🔐 登录ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 470489279883.dkr.ecr.us-east-1.amazonaws.com

# 构建后端
echo "🏗️  构建后端镜像..."
cd backend
docker buildx build --platform linux/amd64 -t ew-logistics-backend:$TIMESTAMP . --load
docker tag ew-logistics-backend:$TIMESTAMP 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP

echo "📤 推送后端镜像..."
docker push 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP

cd ..

# 创建后端任务定义
echo "📋 创建后端任务定义..."
cat > backend-td-$TIMESTAMP.json << 'EOL'
{
  "containerDefinitions": [{
    "name": "ew-logistics-backend",
    "image": "PLACEHOLDER",
    "cpu": 0,
    "portMappings": [{"containerPort": 5001, "hostPort": 5001, "protocol": "tcp"}],
    "essential": true,
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "5001"},
      {"name": "RDS_ENDPOINT", "value": "ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com"},
      {"name": "RDS_PORT", "value": "5432"},
      {"name": "RDS_DATABASE", "value": "ewlogistics"},
      {"name": "RDS_USERNAME", "value": "ewjosh"},
      {"name": "RDS_PASSWORD", "value": "Ew95279527"},
      {"name": "JWT_SECRET", "value": "ew-logistics-jwt-secret-prod-2025"},
      {"name": "FRONTEND_URL", "value": "https://www.ewltl.com"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/ew-logistics-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }],
  "family": "ew-logistics-backend",
  "executionRoleArn": "arn:aws:iam::470489279883:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  }
}
EOL

sed -i '' "s|PLACEHOLDER|470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP|g" backend-td-$TIMESTAMP.json

echo "🔄 更新后端服务..."
BACKEND_TD_ARN=$(aws ecs register-task-definition --cli-input-json file://backend-td-$TIMESTAMP.json --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)
aws ecs update-service --cluster ew-logistics-cluster --service ew-logistics-backend --task-definition "$BACKEND_TD_ARN" --region us-east-1 --force-new-deployment

rm -f backend-td-$TIMESTAMP.json

echo ""
echo "✅ 后端部署完成！"
echo "📝 镜像: ew-logistics-backend:$TIMESTAMP"
echo "⏳ 等待 1-2 分钟让服务启动..."
echo ""
echo "💡 修复内容："
echo "  - 添加了 uuid 和 moment 依赖"
echo "  - 修复了 cargo_description 必填字段"
echo "  - 集成了员工系统路由到主后端"
