# EW Logistics Platform

一个现代化的物流平台，灵感来源于 DAT (Digital Alchemy Technologies)，采用 Apple Messages 绿色风格设计。该平台连接货主和承运商，提供尖端技术和卓越服务。

## 🚀 功能特点

- **货运板块**: 类似 DAT 的货物匹配系统，实时货物和卡车可用性
- **现代化界面**: 清洁、Apple Messages 风格的绿色设计 (#34C759)
- **响应式设计**: 优化适配桌面、平板和移动设备
- **服务管理**: 综合物流服务，包括海运、陆运 FTL/LTL、FBA 配送和仓储
- **联系系统**: 先进的联系表单和客户沟通工具

## 🎨 Design System

- **Primary Color**: Apple Messages Green (#34C759)
- **Typography**: Inter font family with careful spacing and hierarchy
- **Components**: Reusable, accessible components with hover effects and animations
- **Icons**: Lucide React icon library for consistent iconography

## 🏗️ 项目结构

```
EW-WebView/
├── 📁 frontend/                    # React 前端应用
│   ├── 📁 public/                  # 静态资源
│   ├── 📁 src/                     # 源代码
│   │   ├── 📁 components/          # 可复用组件
│   │   ├── 📁 pages/               # 页面组件
│   │   ├── 📁 contexts/            # React Context
│   │   └── ...
│   ├── Dockerfile                  # 前端容器化配置
│   └── nginx.conf                  # Nginx 配置
│
├── 📁 backend/                     # Node.js 后端 API
│   ├── 📁 src/                     # 后端源代码
│   │   ├── 📁 controllers/         # 控制器
│   │   ├── 📁 models/              # 数据模型
│   │   ├── 📁 routes/              # 路由
│   │   └── app.js                  # 应用入口
│   ├── 📁 database/                # 数据库配置
│   ├── package.json
│   └── Dockerfile                  # 后端容器化配置
│
├── 📁 deployment/                  # 部署配置
│   ├── 📁 aws/                     # AWS 部署配置
│   └── 📁 scripts/                 # 部署脚本
│
├── 📁 docker/                      # Docker 配置
├── 📁 docs/                        # 项目文档
├── docker-compose.yml              # 容器编排
├── Makefile                        # 便捷命令
└── README.md
```

## 🛠️ 技术栈

### 前端
- **React 18** - 现代化前端框架
- **React Router DOM** - 客户端路由
- **CSS3** - 纯 CSS 样式，使用 CSS 变量
- **Lucide React** - 图标库
- **Framer Motion** - 动画库

### 后端
- **Node.js 18+** - 服务器运行时
- **Express.js** - Web 框架
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储
- **JWT** - 身份认证

### 基础设施
- **Docker** - 容器化
- **AWS ECS** - 容器编排
- **AWS RDS** - 托管数据库
- **AWS ElastiCache** - 托管 Redis
- **Nginx** - 反向代理

## 🚀 快速开始

### 1. 环境要求
- Node.js 18+
- Docker
- Docker Compose

### 2. 安装依赖
```bash
make install
```

### 3. 启动开发环境
```bash
make dev
```

### 4. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:5000
- 健康检查: http://localhost:5000/health

## 📦 部署

### 本地开发
```bash
# 安装依赖
make install

# 启动开发环境
make dev

# 查看日志
make logs
```

### 生产部署
```bash
# 构建生产镜像
make prod-build

# 启动生产环境
make prod

# 部署到 AWS
make deploy-aws
```

### AWS 部署
查看详细的 AWS 部署指南: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

**推荐架构:**
- **ECS Fargate** - 容器编排
- **RDS PostgreSQL** - 数据库
- **ElastiCache Redis** - 缓存
- **Application Load Balancer** - 负载均衡
- **Route 53** - DNS 管理

## 🔧 可用命令

| 命令 | 描述 |
|------|------|
| `make install` | 安装所有依赖 |
| `make dev` | 启动开发环境 |
| `make build` | 构建所有服务 |
| `make up` | 启动所有服务 |
| `make down` | 停止所有服务 |
| `make logs` | 查看服务日志 |
| `make test` | 运行测试 |
| `make clean` | 清理 Docker 资源 |
| `make health` | 检查服务健康状态 |

## 🎯 主要功能

### 货运板块
- **货物匹配**: 类似 DAT 的货运板，支持搜索和筛选
- **设备类型**: 支持干货车、冷藏车、平板车等
- **实时数据**: 显示可用货物和卡车的模拟数据
- **费率信息**: 每英里计算和总费率
- **公司评级**: 信任度和可靠性指标

### 服务类型
- **海运**: FCL/LCL 服务，包含清关
- **陆运**: FTL 和 LTL，具有竞争力的费率
- **FBA 配送**: Amazon 履行准备和配送
- **仓储**: 存储和分销服务
- **空运**: 快递交付解决方案
- **最后一公里**: 最终交付服务

## 🔒 安全特性

- **Helmet.js** - 安全头设置
- **CORS** - 跨域资源共享配置
- **Rate Limiting** - 请求频率限制
- **JWT Authentication** - 安全的身份验证
- **Environment Variables** - 敏感信息保护

## 📊 监控和日志

- **Morgan** - HTTP 请求日志
- **CloudWatch** - AWS 日志聚合
- **Health Checks** - 服务健康监控
- **Docker Health Checks** - 容器健康检查

## 🌟 特色设计

### Apple 风格界面
- **绿色主题**: Apple Messages 绿 (#34C759)
- **流畅动画**: CSS 和 Framer Motion 动画
- **移动优先**: 响应式设计，适配所有设备
- **无障碍**: 语义化 HTML 和 ARIA 标签

## 📝 许可证信息

- **MC #**: 1094635
- **Broker MC #**: 1281963  
- **UIIA SCAC**: EWLV

## 📞 联系方式

- **电话**: +1 (718) 386-7888
- **邮箱**: info@ewlogistics.com
- **地址**: Hauppauge, New York, USA

## 🔗 参考

本项目灵感来源于 [EW Logistics Service Inc.](https://ewftl.com/)，旨在提供现代化的、类似 DAT 的货运匹配平台，采用 Apple Messages 风格设计。

---

用 ❤️ 构建，使用 React 和现代 Web 技术。 