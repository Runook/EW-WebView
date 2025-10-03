# 🚀 快速开始指南

## 一键启动本地开发环境

```bash
# 在项目根目录执行
./scripts/setup-local-dev.sh
```

就这么简单！脚本会自动：
- ✅ 配置Mock认证（无需AWS Cognito）
- ✅ 启动所有Docker服务
- ✅ 创建模拟用户（积分9999）
- ✅ 检查服务健康状态

## 访问应用

- 🌐 **前端页面**: http://localhost:3000
- 🔧 **后端API**: http://localhost:5001/api
- 💚 **健康检查**: http://localhost:5001/health

## Mock用户信息

在本地开发模式下，您会自动使用以下模拟用户：

```javascript
{
  email: 'dev@ewltl.com',
  name: '开发者',
  credits: 9999,  // 无限积分
  userType: 'shipper'
}
```

**无需登录**，直接访问所有功能！

## 常用命令

```bash
# 查看日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 重建并启动
docker-compose up -d --build
```

## 问题排查

### 容器启动失败？

```bash
# 完全清理并重启
docker-compose down
docker system prune -f
./scripts/setup-local-dev.sh
```

### 数据库连接失败？

```bash
# 检查PostgreSQL是否运行
psql -U ew-josh -d ew_logistics -c "SELECT 1"

# 运行数据库迁移
cd backend && npm run db:migrate
```

### API返回401？

检查后端日志，确认Mock认证已启用：
```bash
docker-compose logs backend | grep "认证模式"
# 应该看到: 🔐 认证模式: Mock (本地开发)
```

## 从开发到生产

### 1. 本地开发（Mock模式）
```bash
./scripts/setup-local-dev.sh
# AUTH_MODE=mock
```

### 2. 部署到AWS（Cognito模式）
```bash
./scripts/deploy-to-aws.sh
# AUTH_MODE=cognito
```

## 下一步

- 📖 阅读 [开发指南](./DEVELOPMENT_GUIDE.md) 了解详细配置
- 🏗️ 查看 [微服务规划](./company-management-service/README.md) 了解架构
- 🔐 配置 [AWS Cognito](./QUICK_FIX_COGNITO.md) 用于生产环境

---

**需要帮助？** 查看完整的 [开发环境配置指南](./DEVELOPMENT_GUIDE.md)

