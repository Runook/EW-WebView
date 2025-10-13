#!/bin/bash
set -e

echo "🔧 部署前端（无缓存，确保环境变量生效）"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
echo "📅 时间戳: $TIMESTAMP"

# 登录ECR
echo "🔐 登录ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 470489279883.dkr.ecr.us-east-1.amazonaws.com

# 清除Docker构建缓存
echo "🧹 清除Docker构建缓存..."
docker builder prune -f

# 构建前端（不使用缓存）
echo "🏗️  重新构建前端（--no-cache）..."
cd frontend
docker buildx build --no-cache --platform linux/amd64 -f Dockerfile.prod \
  --build-arg REACT_APP_API_URL=https://www.ewltl.com/api \
  --build-arg REACT_APP_EMPLOYEE_API_URL=https://www.ewltl.com/api \
  --build-arg REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE \
  -t ew-logistics-frontend:$TIMESTAMP . --load

echo "📤 推送前端镜像..."
docker tag ew-logistics-frontend:$TIMESTAMP 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP
docker push 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP

cd ..

# 创建前端任务定义
echo "📋 创建前端任务定义..."
cat > frontend-td-$TIMESTAMP.json << 'EOL'
{
  "containerDefinitions": [{
    "name": "ew-logistics-frontend",
    "image": "PLACEHOLDER",
    "cpu": 0,
    "portMappings": [{"containerPort": 80, "hostPort": 80, "protocol": "tcp"}],
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/ew-logistics-frontend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }],
  "family": "ew-logistics-frontend",
  "executionRoleArn": "arn:aws:iam::470489279883:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  }
}
EOL

sed -i '' "s|PLACEHOLDER|470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP|g" frontend-td-$TIMESTAMP.json

echo "🔄 更新前端服务..."
FRONTEND_TD_ARN=$(aws ecs register-task-definition --cli-input-json file://frontend-td-$TIMESTAMP.json --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)
aws ecs update-service --cluster ew-logistics-cluster --service ew-logistics-frontend --task-definition "$FRONTEND_TD_ARN" --region us-east-1 --force-new-deployment

rm -f frontend-td-$TIMESTAMP.json

echo ""
echo "✅ 前端部署完成！"
echo "📝 镜像: ew-logistics-frontend:$TIMESTAMP"
echo ""
echo "🔧 已嵌入的环境变量："
echo "  - REACT_APP_API_URL=https://www.ewltl.com/api"
echo "  - REACT_APP_EMPLOYEE_API_URL=https://www.ewltl.com/api"
echo "  - REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyB***"
echo ""
echo "⏳ 等待 1-2 分钟让服务启动..."
echo "🌐 然后访问: https://www.ewltl.com"
echo ""
echo "💡 记得清除浏览器缓存（Cmd+Shift+R 或 Ctrl+Shift+R）"

