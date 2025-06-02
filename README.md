# EW Logistics Platform

现代化的货运物流平台，基于React和Node.js构建，提供货主与承运商之间的高效连接服务。

## 🚀 功能特性

### 认证系统
- ✅ 用户注册/登录
- ✅ JWT认证
- ✅ 角色权限管理（货主/承运商）
- ✅ 密码加密存储

### 货运服务
- 🚛 陆运货运板
- ✈️ 空运货运
- 🚢 海运货运  
- 📦 多式联运
- 🏭 仓储查询

### 用户界面
- 🎨 现代化UI设计
- 📱 响应式布局
- 🌍 多语言支持
- 🎯 用户友好的交互

## 🛠️ 技术栈

### 前端
- React 18
- React Router DOM
- Lucide React (图标)
- CSS3 + CSS Variables

### 后端  
- Node.js + Express
- bcryptjs (密码加密)
- jsonwebtoken (JWT认证)
- express-validator (数据验证)

### 开发工具
- Concurrently (并发运行)
- Docker & Docker Compose
- Prettier (代码格式化)

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 1. 克隆项目
```bash
git clone https://github.com/ew-logistics/platform.git
cd ew-logistics-platform
```

### 2. 安装依赖
```bash
npm run install:all
# 或者
make install
```

### 3. 启动开发环境
```bash
# 本地开发 (推荐)
npm start
# 或者
make local-up

# Docker开发
make dev
```

### 4. 访问应用
- **前端**: http://localhost:3000
- **后端API**: http://localhost:5001/api  
- **健康检查**: http://localhost:5001/health

## 🔧 可用命令

### 开发命令
```bash
# 本地开发
npm start                  # 启动本地开发环境
npm stop                   # 停止本地开发环境
make local-up              # 启动本地开发环境  
make local-down            # 停止本地开发环境

# Docker开发
make dev                   # 启动Docker开发环境
make build                 # 构建所有服务
make up                    # 启动所有服务
make down                  # 停止所有服务
make logs                  # 查看服务日志
```

### 构建和测试
```bash
npm run build              # 构建前端项目
npm test                   # 运行所有测试
npm run lint               # 代码检查
npm run format             # 代码格式化
```

### 健康检查
```bash
make health                # 检查所有服务状态
```

## 👥 测试账户

开发环境预置测试账户：

- **货主账户**
  - 邮箱: shipper@test.com
  - 密码: test123

- **承运商账户**  
  - 邮箱: carrier@test.com
  - 密码: test123

## 📁 项目结构

```
ew-logistics-platform/
├── frontend/              # React前端应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── contexts/      # React Context
│   │   ├── pages/         # 页面组件
│   │   └── ...
│   └── public/            # 静态资源
├── backend/               # Node.js后端API
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   └── app.js         # 应用入口
│   └── ...
├── docs/                  # 项目文档
├── deployment/            # 部署配置
├── database/              # 数据库脚本
├── docker-compose.yml     # Docker配置
├── Makefile              # 构建命令
└── README.md             # 项目说明
```

## 🔐 环境配置

### 前端环境变量 (frontend/.env)
```bash
REACT_APP_API_URL=http://localhost:5001/api
```

### 后端环境变量 (backend/.env)
```bash
NODE_ENV=development
PORT=5001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## ❗ 常见问题

### 端口冲突
**问题**: Mac上AirPlay服务占用端口5000  
**解决**: 项目默认使用端口5001

### 注册失败
**问题**: 点击"创建账户"没有反应  
**解决**: 确保后端API地址正确配置

### Docker启动慢
**问题**: `make dev` 超时  
**解决**: 使用本地开发模式 `make local-up`

## 🚀 部署

### 生产环境
```bash
make prod                  # 启动生产环境
make prod-build            # 构建生产镜像
```

### AWS部署  
```bash
make deploy-aws            # 部署到AWS
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目地址: https://github.com/ew-logistics/platform
- 问题反馈: https://github.com/ew-logistics/platform/issues

---

**EW Logistics Platform** - 让货运更简单高效 🚚✨ 