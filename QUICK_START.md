# 快速开始指南 🚀

## 📋 概述

本项目支持两种运行模式：
- **本地开发模式**：自动Mock登录，无需真实认证
- **生产部署模式**：AWS Cognito真实认证

---

## 🏠 本地开发（推荐开发时使用）

### 第一步：首次设置

```bash
# 添加Mock开发用户到本地数据库（仅需运行一次）
./SETUP_LOCAL_DEV.sh
```

### 第二步：启动开发环境

```bash
# 停止并清理
docker-compose down

# 启动开发环境
docker-compose up --build
```

### 第三步：访问应用

打开浏览器访问：**http://localhost:3000**

✅ **自动登录** - 无需输入任何凭据！
- 邮箱：`dev@ewltl.com`
- 角色：`admin`（管理员权限）
- 员工ID：`EW240001`

### 特性

- ✅ 自动员工登录
- ✅ 完整admin权限
- ✅ 实时代码重载
- ✅ 本地数据库
- ✅ 不影响生产环境

---

## 🚀 生产部署（上线到AWS）

### 部署前端

```bash
./DEPLOY_FRONTEND_ONLY.sh
```

### 部署后端

```bash
./DEPLOY_BACKEND_ONLY.sh
```

### 访问生产环境

访问：**https://www.ewltl.com**

❗ **需要真实登录** - 使用AWS Cognito认证

---

## 🔍 故障排除

### 问题1：本地运行出现401错误

**原因**：Mock用户未在数据库中

**解决方案**：
```bash
./SETUP_LOCAL_DEV.sh
```

### 问题2：端口被占用

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :5001
lsof -i :3001

# 停止进程
kill -9 <PID>

# 或者完全清理Docker
docker-compose down --rmi all --volumes --remove-orphans
```

### 问题3：Docker容器启动失败

**解决方案**：
```bash
# 完全清理
docker-compose down --rmi all --volumes --remove-orphans
docker system prune -a --volumes

# 重新启动
docker-compose up --build
```

### 问题4：数据库连接失败

**检查**：
- PostgreSQL是否运行？
- 数据库名称：`ew_logistics`
- 用户名：`ew-josh`（根据你的配置）

---

## 📝 常用命令

### 本地开发

```bash
# 启动（完整重建）
docker-compose down
docker-compose up --build

# 启动（不重建）
docker-compose up

# 停止
docker-compose down

# 查看日志
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f employee-service

# 重新构建特定服务
docker-compose up --build frontend
```

### 生产部署

```bash
# 仅部署前端
./DEPLOY_FRONTEND_ONLY.sh

# 仅部署后端
./DEPLOY_BACKEND_ONLY.sh

# 检查部署状态
aws ecs describe-services \
  --cluster ew-logistics-cluster \
  --services ew-logistics-frontend \
  --region us-east-1
```

---

## 📚 更多文档

- 📖 [本地开发指南](./LOCAL_DEVELOPMENT.md) - 详细的本地开发说明
- 📄 [文档生成功能](./DOCUMENT_GENERATOR_GUIDE.md) - BOL/RC文档生成
- 🧪 [测试脚本](./TEST_LOCAL_DEV.sh) - 验证本地配置

---

## ⚠️ 重要提示

### ✅ 安全性

1. **本地开发** 
   - Mock认证仅在 `localhost` 或配置了 `REACT_APP_AUTH_MODE=mock` 时生效
   - Mock用户仅存在于本地数据库

2. **生产环境**
   - 自动使用AWS Cognito认证
   - 完整的安全验证
   - Mock认证**不会**在生产环境生效

### ✅ 数据隔离

- **本地**: 使用本地PostgreSQL数据库
- **生产**: 使用AWS RDS数据库
- 两者完全隔离，互不影响

---

## 🎯 工作流程推荐

### 开发新功能

1. 启动本地环境
   ```bash
   docker-compose up --build
   ```

2. 开发代码（自动重载）

3. 测试功能（自动以admin身份登录）

4. 提交代码
   ```bash
   git add .
   git commit -m "feat: 新功能"
   git push
   ```

5. 部署到生产
   ```bash
   ./DEPLOY_FRONTEND_ONLY.sh
   ```

6. 验证生产环境（使用真实账号登录）

---

## 💡 提示

- 本地开发时修改代码会自动刷新浏览器
- 本地环境的更改不会影响生产环境
- 部署前建议在本地充分测试
- 生产部署后清除浏览器缓存（`Cmd+Shift+R` 或 `Ctrl+Shift+R`）

---

需要帮助？查看详细文档：[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

