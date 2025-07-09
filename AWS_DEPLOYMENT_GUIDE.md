# AWS 部署指南 - EW Logistics Platform

## 🚀 部署概览

本指南将帮助你将 EW Logistics Platform 部署到 AWS，使用以下架构：

- **前端**: ECS Fargate + Application Load Balancer
- **后端**: ECS Fargate + Application Load Balancer  
- **数据库**: RDS PostgreSQL
- **缓存**: ElastiCache Redis
- **容器**: ECR (Elastic Container Registry)

## 📋 前置要求

### 1. 本地工具
- [x] Docker Desktop
- [x] AWS CLI v2
- [x] 项目代码已准备完成

### 2. AWS 账户设置
- [x] AWS Root 账户
- [x] IAM 用户（推荐）
- [x] 适当的权限策略

## 🎯 部署步骤

### 阶段 1: AWS 基础设置 (你来操作)

#### 1.1 创建 IAM 用户
```bash
# 在AWS Console中操作：
1. 打开 IAM 控制台
2. 创建用户 "ew-logistics-deploy"
3. 附加以下策略：
   - AmazonECS_FullAccess
   - AmazonRDS_FullAccess
   - AmazonEC2ContainerRegistryFullAccess
   - AmazonVPCFullAccess
   - ElasticLoadBalancingFullAccess
   - AmazonElastiCacheFullAccess
   - CloudWatchFullAccess
4. 创建访问密钥并记录
```

#### 1.2 配置 AWS CLI
```bash
# 在终端中运行：
aws configure

# 输入：
# AWS Access Key ID: [你的访问密钥]
# AWS Secret Access Key: [你的秘密密钥]
# Default region name: us-east-1
# Default output format: json
```

#### 1.3 验证配置
```bash
# 测试连接
aws sts get-caller-identity
```

### 阶段 2: 创建 RDS 数据库 (你来操作)

#### 2.1 创建 RDS 实例
```bash
# 在AWS Console中操作：
1. 打开 RDS 控制台
2. 点击 "创建数据库"
3. 选择 "PostgreSQL"
4. 模板选择 "免费套餐" 或 "生产"
5. 设置：
   - 数据库实例标识符: ew-logistics-db
   - 主用户名: ewadmin
   - 密码: [设置强密码]
   - 实例类: db.t3.micro (免费套餐)
   - 存储: 20GB SSD
   - 启用自动备份
6. 连接设置：
   - VPC: 默认VPC
   - 子网组: 默认
   - 公共访问: 是 (临时设置，后续会改为否)
   - 安全组: 创建新的或选择现有的
7. 点击 "创建数据库"
```

#### 2.2 配置安全组
```bash
# 在EC2控制台中：
1. 找到RDS实例的安全组
2. 添加入站规则：
   - 类型: PostgreSQL
   - 协议: TCP
   - 端口: 5432
   - 源: 0.0.0.0/0 (临时设置)
```

### 阶段 3: 配置环境变量 (你来操作)

#### 3.1 创建环境配置文件
```bash
# 复制模板文件
cp .env.production.template .env.production

# 编辑文件，填写实际值：
# - AWS凭证
# - RDS端点信息
# - JWT密钥
# - 域名信息
```

### 阶段 4: 部署应用 (我来操作)

一旦你完成了上述步骤，我将：

1. 运行部署脚本
2. 创建ECR仓库
3. 构建并推送Docker镜像
4. 创建ECS集群和服务
5. 配置Load Balancer
6. 运行数据库迁移
7. 配置域名和SSL证书

## 📝 部署后配置

### 1. 数据库迁移
```bash
# 运行数据库迁移
npm run migrate
```

### 2. 创建初始数据
```bash
# 运行种子数据
npm run seed
```

### 3. 配置域名
- 购买域名或使用现有域名
- 配置Route 53 DNS记录
- 申请SSL证书

### 4. 生产环境优化
- 启用CloudWatch监控
- 配置日志聚合
- 设置自动扩展
- 配置备份策略

## 🔧 故障排除

### 常见问题
1. **RDS连接失败**: 检查安全组配置
2. **镜像推送失败**: 检查ECR权限
3. **ECS任务启动失败**: 检查环境变量

### 日志查看
```bash
# 查看ECS任务日志
aws logs tail /ecs/ew-logistics-backend --follow

# 查看RDS连接日志
aws rds describe-db-log-files --db-instance-identifier ew-logistics-db
```

## 📊 监控和维护

### 1. CloudWatch指标
- ECS任务健康状况
- RDS连接数
- Load Balancer响应时间
- 错误率

### 2. 自动扩展
- 基于CPU使用率
- 基于内存使用率
- 基于请求数量

### 3. 备份策略
- RDS自动备份
- 应用代码版本控制
- 配置文件备份

## 🎉 完成！

部署完成后，你的应用将在以下地址可用：
- 前端: https://your-domain.com
- 后端API: https://api.your-domain.com
- 健康检查: https://api.your-domain.com/health

---

**准备好开始了吗？请完成阶段1-3，然后我会帮你完成剩余的部署工作！**
