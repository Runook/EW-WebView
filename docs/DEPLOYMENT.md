# EW Logistics Platform - 部署指南

本文档详细介绍了如何将 EW Logistics Platform 部署到 AWS 云环境。

## 📋 部署前准备

### 1. 环境要求
- AWS CLI 已配置
- Docker 已安装
- Node.js 18+ 已安装
- Git 已安装

### 2. AWS 服务准备
需要以下 AWS 服务：
- **ECS (Elastic Container Service)** - 容器编排
- **ECR (Elastic Container Registry)** - 镜像仓库
- **RDS (Relational Database Service)** - PostgreSQL 数据库
- **ElastiCache** - Redis 缓存
- **Application Load Balancer (ALB)** - 负载均衡
- **Route 53** - DNS 管理
- **CloudFront** - CDN (可选)
- **S3** - 静态文件存储
- **Secrets Manager** - 密钥管理
- **CloudWatch** - 监控和日志

## 🚀 部署方案选择

### 方案 1: ECS Fargate (推荐)
**适用场景**: 生产环境，自动扩缩容，无需管理服务器

**架构**:
```
Internet → Route 53 → CloudFront → ALB → ECS Fargate
                                        ├── Frontend Container
                                        └── Backend Container
                                              ├── RDS (PostgreSQL)
                                              └── ElastiCache (Redis)
```

**优势**:
- 完全托管，无服务器管理
- 自动扩缩容
- 高可用性
- 成本优化

### 方案 2: EC2 + Docker
**适用场景**: 需要更多控制权，成本敏感

**架构**:
```
Internet → Route 53 → ALB → EC2 实例 (Docker Compose)
                             ├── Frontend Container
                             ├── Backend Container
                             ├── PostgreSQL Container (或 RDS)
                             └── Redis Container
```

## 📦 ECS Fargate 部署步骤

### Step 1: 创建 ECR 仓库
```bash
# 创建前端镜像仓库
aws ecr create-repository --repository-name ew-logistics-frontend

# 创建后端镜像仓库
aws ecr create-repository --repository-name ew-logistics-backend

# 获取登录令牌
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: 构建并推送镜像
```bash
# 构建前端镜像
cd frontend
docker build -t ew-logistics-frontend .
docker tag ew-logistics-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-frontend:latest

# 构建后端镜像
cd ../backend
docker build -t ew-logistics-backend .
docker tag ew-logistics-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ew-logistics-backend:latest
```

### Step 3: 创建 RDS 数据库
```bash
# 创建 RDS PostgreSQL 实例
aws rds create-db-instance \
  --db-instance-identifier ew-logistics-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name ew-logistics-subnet-group \
  --publicly-accessible false
```

### Step 4: 创建 ElastiCache Redis
```bash
# 创建 Redis 集群
aws elasticache create-cache-cluster \
  --cache-cluster-id ew-logistics-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxx \
  --subnet-group-name ew-logistics-cache-subnet-group
```

### Step 5: 创建 ECS 集群
```bash
# 创建 ECS 集群
aws ecs create-cluster --cluster-name ew-logistics-cluster
```

### Step 6: 注册任务定义
```bash
# 注册任务定义
aws ecs register-task-definition --cli-input-json file://deployment/aws/ecs/task-definition.json
```

### Step 7: 创建 ECS 服务
```bash
# 创建 ECS 服务
aws ecs create-service \
  --cluster ew-logistics-cluster \
  --service-name ew-logistics-service \
  --task-definition ew-logistics-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-xxxxxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/ew-logistics-tg/50dc6c495c0c9188,containerName=ew-logistics-backend,containerPort=5000
```

## 🔧 环境变量配置

### 在 AWS Secrets Manager 中存储敏感信息:

```bash
# 数据库密码
aws secretsmanager create-secret \
  --name ew-logistics-db-password \
  --description "Database password for EW Logistics" \
  --secret-string "your-secure-password"

# JWT 密钥
aws secretsmanager create-secret \
  --name ew-logistics-jwt-secret \
  --description "JWT secret for EW Logistics" \
  --secret-string "your-jwt-secret-key"
```

## 📊 监控和日志

### CloudWatch 配置
```bash
# 创建日志组
aws logs create-log-group --log-group-name /ecs/ew-logistics

# 设置日志保留期
aws logs put-retention-policy \
  --log-group-name /ecs/ew-logistics \
  --retention-in-days 30
```

### 健康检查
- **应用负载均衡器**: `/health` 端点
- **ECS 容器**: Docker HEALTHCHECK
- **CloudWatch 告警**: CPU/内存使用率

## 🔄 CI/CD 流水线

### GitHub Actions 配置
文件位置: `.github/workflows/deploy.yml`

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push images
        run: |
          # 构建并推送镜像的脚本
          ./deployment/scripts/build-and-push.sh
      
      - name: Deploy to ECS
        run: |
          # 更新 ECS 服务
          aws ecs update-service \
            --cluster ew-logistics-cluster \
            --service ew-logistics-service \
            --force-new-deployment
```

## 💰 成本优化

### 1. 资源配置
- **ECS Fargate**: 使用最小资源配置 (0.25 vCPU, 0.5 GB)
- **RDS**: 使用 `db.t3.micro` 实例
- **ElastiCache**: 使用 `cache.t3.micro` 节点

### 2. 自动扩缩容
```bash
# 设置 ECS 服务自动扩缩容
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ew-logistics-cluster/ew-logistics-service \
  --min-capacity 1 \
  --max-capacity 10
```

### 3. 预留实例
对于生产环境，考虑购买 RDS 预留实例来节省成本。

## 🔒 安全最佳实践

### 1. 网络安全
- 使用 VPC 隔离网络
- 配置安全组限制访问
- 启用 AWS WAF 防护

### 2. 数据安全
- 启用 RDS 加密
- 使用 AWS Secrets Manager 管理密钥
- 启用 CloudTrail 审计

### 3. 应用安全
- 使用 HTTPS/TLS
- 实施 JWT 认证
- 启用请求限制

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
   - 检查 CloudWatch 日志
   - 验证环境变量配置
   - 确认镜像构建正确

2. **数据库连接失败**
   - 检查安全组配置
   - 验证数据库凭据
   - 确认网络连通性

3. **负载均衡器健康检查失败**
   - 验证健康检查端点
   - 检查容器端口配置
   - 确认应用正常启动

### 调试命令
```bash
# 查看 ECS 服务状态
aws ecs describe-services --cluster ew-logistics-cluster --services ew-logistics-service

# 查看任务日志
aws logs get-log-events --log-group-name /ecs/ew-logistics --log-stream-name <stream-name>

# 检查容器状态
aws ecs describe-tasks --cluster ew-logistics-cluster --tasks <task-arn>
```

## 📞 支持

如需部署支持，请联系：
- **邮箱**: devops@ewlogistics.com
- **文档**: 查看项目 README.md
- **问题**: 在 GitHub 创建 Issue 