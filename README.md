# EW物流平台 🚚

> 一站式多式联运物流服务平台，集成陆运、海运、空运三大运输方式，为货主和承运商提供高效便捷的物流信息对接服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)

## 📚 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API 文档](#api-文档)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [集成服务](#集成服务)
- [贡献指南](#贡献指南)

## 📋 项目概述

EW物流平台是一个现代化的全栈物流管理系统，提供从报价、订单管理到运输追踪的完整物流解决方案。平台支持多种运输方式，集成第三方API服务，并具备完善的员工管理和客户管理系统。

### 主要特性

- ✅ **多式联运支持**: 陆运（FTL/LTL）、海运、空运统一平台
- ✅ **实时报价系统**: 集成 Warp Freight API 获取真实LTL报价
- ✅ **员工管理系统**: 完整的权限管理和订单处理系统
- ✅ **客户关系管理**: 客户信息、订单历史、信用管理
- ✅ **AWS Cognito 认证**: 生产环境使用AWS Cognito，开发环境支持Mock认证
- ✅ **响应式设计**: 完美适配桌面端、平板和移动端
- ✅ **容器化部署**: Docker + Docker Compose 一键部署
- ✅ **微服务架构**: 员工服务独立部署，支持水平扩展

## 🎯 核心功能

### 陆运服务 🚛

- **LTL报价系统**: 集成 Warp Freight API，获取实时零担运输报价
- **FBA仓库查询**: 查询和管理 Amazon FBA 仓库位置信息
- **货源车源匹配**: 智能匹配货源和车源信息
- **运输追踪**: 实时追踪货物运输状态

### 海运服务 🚢

- **集装箱运输管理**: 集装箱舱位信息发布与查找
- **船期查询**: 实时查询航线和船期信息
- **货运需求匹配**: 货主需求与承运商资源智能匹配
- **港口信息查询**: 全球主要港口信息数据库

### 空运服务 ✈️

- **航空舱位管理**: 航空货运舱位信息发布
- **紧急货运处理**: 快速处理紧急空运需求
- **航班信息查询**: 实时航班状态和时刻表
- **特殊货物运输**: 危险品、温控货物等特殊处理

### 多式联运 🌐

- **DDP服务**: 双清包服务（门到门，包含清关）
- **DDU服务**: 单清包服务（到港，进口清关由收货人负责）
- **LDP服务**: 港口货服务（港口到港口）

### 员工系统 👥

- **订单管理**: Broker订单创建、编辑、状态跟踪
- **客户管理**: 客户信息维护、信用管理
- **权限控制**: 基于角色的访问控制（RBAC）
- **数据统计**: 订单统计、业绩分析

### 信息服务 📊

- **物流黄页**: 物流企业、服务商、货运公司查询平台
- **工作招聘**: 物流行业职位发布与求职
- **物流论坛**: 行业交流与信息分享
- **工具集**: 运费计算器、单位转换器等实用工具

## 🏗️ 技术架构

### 前端技术栈

- **React 18.2.0** - 现代化UI框架
- **React Router 6** - 客户端路由管理
- **AWS Amplify** - Cognito身份认证集成
- **Lucide React** - 图标库
- **Google Maps API** - 地址自动补全和地图服务
- **CSS Modules** - 组件级样式管理
- **Responsive Design** - 移动端优先的响应式设计

### 后端技术栈

- **Node.js 18+** - JavaScript运行时
- **Express.js 4.18** - Web应用框架
- **PostgreSQL** - 关系型数据库
- **Knex.js** - SQL查询构建器和迁移工具
- **JWT** - JSON Web Token身份验证
- **Helmet** - 安全中间件
- **Morgan** - HTTP请求日志
- **Multer** - 文件上传处理

### 微服务

- **Employee Service** - 独立的员工管理微服务
  - 端口: 3001
  - 功能: 员工认证、订单管理、权限验证

### 基础设施

- **Docker & Docker Compose** - 容器化部署
- **Nginx** - 反向代理和静态资源服务
- **Redis** - 缓存服务（可选）
- **AWS ECS** - 生产环境容器编排
- **AWS RDS** - 生产环境数据库
- **AWS Cognito** - 用户身份认证服务

### 第三方集成

- **Warp Freight API** - LTL运输报价服务
- **Google Maps API** - 地理编码和地图服务
- **AWS Cognito** - 用户认证和授权

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 或 **yarn**
- **Docker** >= 20.10 (推荐)
- **Docker Compose** >= 2.0
- **Git**

### 一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd EW-WebView

# 首次设置（添加Mock开发用户）
./SETUP_LOCAL_DEV.sh

# 启动所有服务
docker-compose up --build
```

访问应用: **http://localhost:3000**

### 本地开发模式

本地开发环境支持自动Mock登录，无需真实认证：

- **邮箱**: `dev@ewltl.com`
- **角色**: `admin` (管理员权限)
- **员工ID**: `EW240001`

详细说明请查看 [快速开始指南](./QUICK_START.md)

### 手动启动（不使用Docker）

```bash
# 1. 安装依赖
cd frontend && npm install
cd ../backend && npm install
cd ../employee-service && npm install

# 2. 配置数据库
# 确保PostgreSQL运行在 localhost:5432
# 数据库名: ewlogistics
# 运行迁移
cd backend && npm run db:migrate

# 3. 启动后端服务
cd backend && npm start

# 4. 启动员工服务（新终端）
cd employee-service && npm start

# 5. 启动前端服务（新终端）
cd frontend && npm start
```

### 访问地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5001/api
- **员工服务API**: http://localhost:3001/api
- **健康检查**: http://localhost:5001/health
- **PostgreSQL**: localhost:5432

## 📁 项目结构

```
EW-WebView/
├── frontend/                    # React前端应用
│   ├── public/                 # 静态资源
│   │   ├── index.html         # HTML模板
│   │   └── videos/            # 视频资源
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   │   ├── common/        # 通用组件
│   │   │   ├── ltl/          # LTL相关组件
│   │   │   └── ...
│   │   ├── pages/            # 页面组件
│   │   │   ├── GetQuoteLTL.js
│   │   │   ├── BrokerOrdersNew.js
│   │   │   ├── Customers.js
│   │   │   └── ...
│   │   ├── config/           # 配置文件
│   │   │   ├── amplify.js    # AWS Amplify配置
│   │   │   ├── warpApi.js    # Warp API配置
│   │   │   └── googleMaps.js # Google Maps配置
│   │   ├── contexts/         # React Context
│   │   ├── hooks/            # 自定义Hooks
│   │   ├── utils/            # 工具函数
│   │   ├── App.js            # 应用入口
│   │   └── index.js          # 入口文件
│   ├── Dockerfile            # 前端容器配置
│   ├── Dockerfile.prod       # 生产环境配置
│   ├── nginx.conf            # Nginx配置
│   └── package.json
│
├── backend/                   # Node.js后端应用
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   │   ├── app.js        # 应用配置
│   │   │   ├── database.js   # 数据库配置
│   │   │   └── security.js   # 安全配置
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.js       # 认证中间件
│   │   │   └── mockAuth.js   # Mock认证（开发用）
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # API路由
│   │   │   ├── landfreight.js
│   │   │   ├── customers.js
│   │   │   ├── employee-orders.js
│   │   │   └── ...
│   │   ├── utils/            # 工具函数
│   │   └── app.js            # 应用入口
│   ├── migrations/           # 数据库迁移
│   ├── scripts/              # 脚本工具
│   ├── Dockerfile            # 后端容器配置
│   └── package.json
│
├── employee-service/          # 员工管理微服务
│   ├── src/
│   │   ├── config/           # 配置
│   │   ├── middleware/       # 中间件
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由
│   │   └── server.js         # 服务入口
│   ├── migrations/           # 数据库迁移
│   └── package.json
│
├── docker-compose.yml        # Docker编排配置
├── QUICK_START.md            # 快速开始指南
├── WARP_API_INTEGRATION.md   # Warp API集成文档
└── README.md                 # 项目文档
```

## 📡 API 文档

### 认证接口

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 陆运接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/landfreight/loads` | 获取货源列表 |
| GET | `/api/landfreight/trucks` | 获取车源列表 |
| POST | `/api/landfreight/loads` | 发布货源信息 |
| POST | `/api/landfreight/trucks` | 发布车源信息 |

### 客户管理接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/customers` | 获取客户列表 |
| GET | `/api/customers/:id` | 获取客户详情 |
| POST | `/api/customers` | 创建客户 |
| PUT | `/api/customers/:id` | 更新客户信息 |
| DELETE | `/api/customers/:id` | 删除客户 |

### 订单管理接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/employee-orders` | 获取订单列表 |
| GET | `/api/employee-orders/:id` | 获取订单详情 |
| POST | `/api/employee-orders` | 创建订单 |
| PUT | `/api/employee-orders/:id` | 更新订单 |
| PUT | `/api/employee-orders/:id/status` | 更新订单状态 |

### FBA接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/fba/locations` | 获取FBA仓库列表 |
| GET | `/api/fba/locations/:id` | 获取仓库详情 |
| GET | `/api/fba/exchanges` | 获取换标服务信息 |

### 员工服务接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/employees` | 获取员工列表 |
| GET | `/api/employees/:id` | 获取员工详情 |
| POST | `/api/employees` | 创建员工 |
| PUT | `/api/employees/:id` | 更新员工信息 |

## 🐳 部署指南

### Docker 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 完全清理（包括数据卷）
docker-compose down --rmi all --volumes --remove-orphans
```

### 生产环境部署

#### 部署前端

```bash
./DEPLOY_FRONTEND_ONLY.sh
```

#### 部署后端

```bash
./DEPLOY_BACKEND_ONLY.sh
```

#### 部署前端（无缓存）

```bash
./DEPLOY_FRONTEND_NO_CACHE.sh
```

### 环境变量配置

#### 前端环境变量

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_EMPLOYEE_API_URL=http://localhost:3001/api
REACT_APP_AUTH_MODE=mock  # 开发环境使用mock，生产环境使用cognito
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
REACT_APP_WARP_API_KEY=your-warp-api-key
```

#### 后端环境变量

```env
NODE_ENV=production
PORT=5001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ewlogistics
DB_USER=ewadmin
DB_PASSWORD=your-database-password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://www.ewltl.com
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
```

## 💻 开发指南

### 代码规范

- 使用 **ESLint** 进行代码检查
- 遵循 **React Hooks** 最佳实践
- 使用 **CSS Modules** 进行样式管理
- 统一的注释和文档风格

### Git 工作流

- `main` - 生产环境分支
- `develop` - 开发环境分支
- `feature/*` - 功能开发分支
- `hotfix/*` - 紧急修复分支

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建配置
perf: 性能优化
ci: CI/CD相关
```

### 数据库迁移

```bash
# 创建新迁移
cd backend
npx knex migrate:make migration_name

# 运行迁移
npm run db:migrate

# 回滚迁移
npm run db:rollback

# 重置数据库
npm run db:reset
```

### 开发工具

```bash
# 前端开发（热重载）
cd frontend && npm start

# 后端开发（nodemon自动重启）
cd backend && npm run dev

# 代码检查
npm run lint
npm run lint:fix
```

## 🔌 集成服务

### Warp Freight API

集成 Warp Freight API 获取真实LTL运输报价。

**配置位置**: `/frontend/src/config/warpApi.js`

**主要功能**:
- 获取LTL报价 (`getLTLQuote`)
- 预订运输 (`bookLTLShipment`)
- 追踪运输 (`trackShipment`)

详细文档: [WARP_API_INTEGRATION.md](./WARP_API_INTEGRATION.md)

### AWS Cognito

生产环境使用 AWS Cognito 进行用户认证和授权。

**配置位置**: `/frontend/src/config/amplify.js`

**功能**:
- 用户注册和登录
- 密码重置
- 多因素认证（MFA）
- 用户会话管理

### Google Maps API

用于地址自动补全和地图服务。

**功能**:
- 地址自动补全
- 地理编码（地址转坐标）
- 地图显示
- 距离计算

## 🧪 测试

```bash
# 运行前端测试
cd frontend && npm test

# 运行后端测试
cd backend && npm test

# 运行测试覆盖率
cd backend && npm run test:coverage
```

## 🔒 安全特性

- ✅ **JWT身份验证** - 安全的Token-based认证
- ✅ **CORS保护** - 跨域资源共享控制
- ✅ **请求频率限制** - 防止API滥用
- ✅ **输入验证** - 使用 express-validator
- ✅ **XSS防护** - Helmet安全头
- ✅ **SQL注入防护** - 参数化查询（Knex.js）
- ✅ **环境隔离** - 开发/生产环境完全隔离

## 📊 性能指标

- **首屏加载时间**: < 2秒
- **API响应时间**: < 200ms
- **移动端适配**: 95+ 分（Lighthouse）
- **系统可用性**: 99.9%+

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :5001
lsof -i :3001

# 停止进程
kill -9 <PID>
```

#### 2. Docker容器启动失败

```bash
# 完全清理
docker-compose down --rmi all --volumes --remove-orphans
docker system prune -a --volumes

# 重新启动
docker-compose up --build
```

#### 3. 数据库连接失败

检查：
- PostgreSQL是否运行
- 数据库配置是否正确
- 网络连接是否正常

#### 4. Mock认证不工作

运行设置脚本：
```bash
./SETUP_LOCAL_DEV.sh
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **Fork** 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 **Pull Request**

### 贡献类型

- 🐛 Bug修复
- ✨ 新功能
- 📝 文档改进
- 🎨 UI/UX改进
- ⚡ 性能优化
- 🧪 测试覆盖

## 📄 许可证

本项目采用 **MIT** 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- **项目主页**: [EW物流平台](https://www.ewltl.com)
- **技术支持**: support@ewlogistics.com
- **商务合作**: business@ewlogistics.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**EW物流平台** - 让物流更简单，让世界更连接 🌍

**最后更新**: 2025年1月
