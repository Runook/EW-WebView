# 开发环境配置指南

## 📋 目录
- [快速开始](#快速开始)
- [认证模式](#认证模式)
- [环境切换](#环境切换)
- [常见问题](#常见问题)
- [部署流程](#部署流程)

## 🚀 快速开始

### 1. 本地开发环境（推荐）

使用Mock认证，无需AWS Cognito，开发更便捷：

```bash
# 一键设置并启动本地开发环境
./scripts/setup-local-dev.sh
```

这将：
- ✅ 创建`.env.local`配置文件
- ✅ 启动Docker容器（backend + frontend + redis）
- ✅ 使用Mock认证（无需真实登录）
- ✅ 自动创建模拟用户（积分9999）

访问：
- 前端：http://localhost:3000
- 后端API：http://localhost:5001/api
- 健康检查：http://localhost:5001/health

### 2. 手动启动（传统方式）

```bash
# 停止现有容器
docker-compose down

# 启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔐 认证模式

本项目支持两种认证模式：

### Mock认证（本地开发）

**特点：**
- 🎯 无需真实登录
- 🎯 自动使用模拟用户
- 🎯 积分无限（9999）
- 🎯 快速开发测试

**配置：**
```bash
# .env.local
AUTH_MODE=mock
MOCK_USER_ID=1
MOCK_USER_EMAIL=dev@ewltl.com
MOCK_USER_CREDITS=9999
```

**工作原理：**
- 所有需要认证的接口自动使用模拟用户
- 前端可以直接访问需要登录的功能
- 无需配置AWS Cognito

### Cognito认证（生产环境）

**特点：**
- 🔒 真实AWS Cognito认证
- 🔒 用户注册/登录
- 🔒 Token验证
- 🔒 生产环境安全

**配置：**
```bash
# .env.production
AUTH_MODE=cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_HU9W7uLQA
COGNITO_CLIENT_ID=5mae63uesfb6dia5l06ju4j5m0
```

## 🔄 环境切换

### 切换到本地开发模式

```bash
# 方法1: 使用设置脚本（推荐）
./scripts/setup-local-dev.sh

# 方法2: 手动切换
cp env.local.example .env.local
docker-compose --env-file .env.local up -d --build
```

### 切换到生产模式

```bash
# 方法1: 使用部署脚本（推荐）
./scripts/deploy-to-aws.sh

# 方法2: 手动部署
# 1. 构建镜像
# 2. 推送到ECR
# 3. 更新ECS服务
```

## 🛠️ 常见问题

### Q1: Docker容器名称变了？

**症状：** 容器名称从`backend-1`变成`ew-webview-backend-1`

**原因：** Docker Compose根据项目目录名自动生成容器名

**解决：** 这是正常的，不影响使用。可以通过`docker-compose ps`查看实际容器名

### Q2: 无法登录AWS Cognito？

**症状：** 本地开发时Cognito登录失败

**解决方案：**
```bash
# 切换到Mock认证模式
echo "AUTH_MODE=mock" > .env.local
docker-compose down
docker-compose --env-file .env.local up -d
```

### Q3: 数据库表不存在？

**症状：** `relation "premium_posts" does not exist`

**解决：**
```bash
# 运行数据库迁移
cd backend
npm run db:migrate

# 或手动创建表（已在setup脚本中处理）
psql -U ew-josh -d ew_logistics -f migrations/006_add_user_management_system.js
```

### Q4: 前端可以访问但接口报错？

**检查：**
```bash
# 1. 检查后端服务状态
curl http://localhost:5001/health

# 2. 检查容器日志
docker-compose logs backend

# 3. 检查数据库连接
docker-compose exec backend npm run db:migrate
```

### Q5: 如何查看Mock用户信息？

**方法：**
```bash
# 查看环境变量
docker-compose exec backend env | grep MOCK

# 查看数据库中的用户
psql -U ew-josh -d ew_logistics -c "SELECT id, email, credits FROM users WHERE id=1;"
```

## 📦 部署流程

### 本地开发 → AWS生产环境

```bash
# 1. 本地开发和测试（Mock模式）
./scripts/setup-local-dev.sh

# 2. 测试功能
# 访问 http://localhost:3000 进行测试

# 3. 提交代码
git add .
git commit -m "feat: 新功能"
git push origin main

# 4. 部署到AWS（Cognito模式）
./scripts/deploy-to-aws.sh
```

### 部署检查清单

- [ ] 本地测试通过
- [ ] 数据库迁移已运行
- [ ] 环境变量已配置
- [ ] Docker镜像构建成功
- [ ] AWS Cognito配置正确
- [ ] RDS数据库可访问
- [ ] ECS服务正常运行
- [ ] ALB健康检查通过

## 🔧 高级配置

### 自定义Mock用户

编辑`.env.local`：
```bash
MOCK_USER_ID=99
MOCK_USER_EMAIL=admin@ewltl.com
MOCK_USER_CREDITS=99999
```

### 数据库调试

```bash
# 进入后端容器
docker-compose exec backend sh

# 连接数据库
psql -h host.docker.internal -U ew-josh -d ew_logistics

# 查看表结构
\dt

# 查看用户
SELECT * FROM users LIMIT 5;
```

### 日志查看

```bash
# 所有服务日志
docker-compose logs -f

# 只看后端
docker-compose logs -f backend

# 只看前端
docker-compose logs -f frontend

# 最近100行
docker-compose logs --tail=100 backend
```

## 📚 相关文档

- [Docker Compose文档](https://docs.docker.com/compose/)
- [AWS Cognito配置指南](./QUICK_FIX_COGNITO.md)
- [数据库迁移指南](./backend/migrations/README.md)
- [API文档](./API_DOCUMENTATION.md)

## 🆘 获取帮助

遇到问题？尝试以下步骤：

1. **查看日志**：`docker-compose logs -f backend`
2. **重启服务**：`docker-compose restart`
3. **完全重建**：`docker-compose down && docker-compose up -d --build`
4. **清理缓存**：`docker system prune -f`
5. **检查数据库**：确保PostgreSQL正在运行且可访问

---

**最后更新：** 2025-10-03
**维护者：** EW Logistics Team

