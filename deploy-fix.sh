#!/bin/bash
set -e

# 生成时间戳标签
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
echo "🚀 开始更新前后端服务 - 标签: $TIMESTAMP"

# 登录ECR
echo "📝 登录ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 470489279883.dkr.ecr.us-east-1.amazonaws.com

# 构建并推送前端（使用时间戳标签）
echo "🏗️ 构建前端镜像..."
cd frontend
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t ew-logistics-frontend:$TIMESTAMP . --load
docker tag ew-logistics-frontend:$TIMESTAMP 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP
docker push 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP

# 构建并推送后端（使用时间戳标签）
echo "🏗️ 构建后端镜像..."
cd ../backend
docker buildx build --platform linux/amd64 -t ew-logistics-backend:$TIMESTAMP . --load
docker tag ew-logistics-backend:$TIMESTAMP 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP
docker push 470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP

cd ..

# 创建新的前端任务定义
echo "📋 创建前端任务定义..."
cat > frontend-td-$TIMESTAMP.json << EOL
{
  "containerDefinitions": [
    {
      "name": "ew-logistics-frontend",
      "image": "470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:$TIMESTAMP",
      "cpu": 0,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp",
          "name": "ew-logistics-frontend-80-tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "REACT_APP_GOOGLE_MAPS_API_KEY",
          "value": "AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE"
        },
        {
          "name": "REACT_APP_API_URL",
          "value": "https://www.ewltl.com/api"
        }
      ],
      "mountPoints": [],
      "volumesFrom": [],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ew-logistics-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        },
        "secretOptions": []
      },
      "systemControls": []
    }
  ],
  "family": "ew-logistics-frontend",
  "executionRoleArn": "arn:aws:iam::470489279883:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "volumes": [],
  "placementConstraints": [],
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
EOL

# 创建新的后端任务定义
echo "📋 创建后端任务定义..."
cat > backend-td-$TIMESTAMP.json << EOL
{
  "containerDefinitions": [
    {
      "name": "ew-logistics-backend",
      "image": "470489279883.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:$TIMESTAMP",
      "cpu": 0,
      "portMappings": [
        {
          "containerPort": 5001,
          "hostPort": 5001,
          "protocol": "tcp",
          "name": "ew-logistics-backend-5001-tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5001"
        },
        {
          "name": "RDS_ENDPOINT",
          "value": "ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com"
        },
        {
          "name": "RDS_PORT",
          "value": "5432"
        },
        {
          "name": "RDS_DB_NAME",
          "value": "ewlogistics"
        },
        {
          "name": "RDS_USERNAME",
          "value": "ewjosh"
        },
        {
          "name": "RDS_PASSWORD",
          "value": "Ew95279527"
        },
        {
          "name": "JWT_SECRET",
          "value": "your-jwt-secret-key-here"
        }
      ],
      "mountPoints": [],
      "volumesFrom": [],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ew-logistics-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        },
        "secretOptions": []
      },
      "systemControls": []
    }
  ],
  "family": "ew-logistics-backend",
  "executionRoleArn": "arn:aws:iam::470489279883:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "volumes": [],
  "placementConstraints": [],
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024"
}
EOL

# 注册任务定义并更新服务
echo "📝 注册前端任务定义..."
FRONTEND_TD_ARN=$(aws ecs register-task-definition --cli-input-json file://frontend-td-$TIMESTAMP.json --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)

echo "📝 注册后端任务定义..."
BACKEND_TD_ARN=$(aws ecs register-task-definition --cli-input-json file://backend-td-$TIMESTAMP.json --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)

echo "🔄 更新前端服务..."
aws ecs update-service --cluster ew-logistics-cluster --service ew-logistics-frontend --task-definition "$FRONTEND_TD_ARN" --region us-east-1

echo "🔄 更新后端服务..."
aws ecs update-service --cluster ew-logistics-cluster --service ew-logistics-backend --task-definition "$BACKEND_TD_ARN" --region us-east-1

echo "⏳ 等待服务更新..."
sleep 30

echo "🧹 清理临时文件..."
rm -f frontend-td-$TIMESTAMP.json backend-td-$TIMESTAMP.json

echo "✅ 更新完成！"
echo "📊 部署信息:"
echo "- 前端镜像: ew-logistics-frontend:$TIMESTAMP"
echo "- 后端镜像: ew-logistics-backend:$TIMESTAMP"
echo "- 前端任务定义: $FRONTEND_TD_ARN"
echo "- 后端任务定义: $BACKEND_TD_ARN"
echo ""
echo "🌐 访问地址: https://www.ewltl.com"
echo "📝 注意：服务完全启动需要1-2分钟"
