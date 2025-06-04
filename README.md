# EW物流平台 🚚

一站式多式联运物流服务平台，集成陆运、海运、空运三大运输方式，为货主和承运商提供高效便捷的物流信息对接服务。

## 🌟 项目特色

- **三大运输平台统一**: 陆运、海运、空运信息整合
- **响应式设计**: 完美适配桌面端和移动端
- **实时搜索筛选**: 智能匹配和快速查找
- **用户认证系统**: 安全的JWT身份验证
- **现代化架构**: React + Node.js + Express
- **容器化部署**: Docker支持，一键部署

## 📊 功能概览

### 陆运平台 🚛
- 货源信息发布与查找
- 车源信息发布与查找
- 整车(FTL)和零担(LTL)运输
- 智能路线匹配

### 海运平台 🚢
- 舱位信息发布与查找
- 货运需求发布与匹配
- 集装箱运输管理
- 航线和船期查询

### 空运平台 ✈️
- 航空舱位信息
- 紧急货运需求
- 航班信息查询
- 特殊货物运输

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **React Router** - 客户端路由
- **Lucide React** - 图标库
- **CSS Modules** - 样式管理
- **Responsive Design** - 响应式布局

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **JWT** - 身份验证
- **CORS** - 跨域资源共享
- **Helmet** - 安全中间件
- **Morgan** - 请求日志

### 开发工具
- **Docker** - 容器化
- **Nginx** - 反向代理
- **ESLint** - 代码规范
- **Git** - 版本控制

## 🚀 快速开始

### 前置要求
- Node.js 16+ 
- npm 8+
- Git

### 开发环境启动

```bash
# 克隆项目
git clone <repository-url>
cd EW-WebView

# 一键启动开发环境
./dev-start.sh
```

### 手动启动

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 启动后端服务
npm start

# 新开终端启动前端服务
cd ../frontend
npm start
```

### 访问地址
- 前端应用: http://localhost:3000
- 后端API: http://localhost:5001/api
- 健康检查: http://localhost:5001/health

## 🐳 Docker部署

### 开发环境
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境
```bash
# 使用生产配置启动
docker-compose --profile production up -d

# 包含数据库的完整部署
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📁 项目结构

```
EW-WebView/
├── frontend/                 # React前端应用
│   ├── public/              # 静态资源
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── config/          # 配置文件
│   │   ├── contexts/        # React Context
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── pages/           # 页面组件
│   │   ├── utils/           # 工具函数
│   │   └── App.js           # 应用入口
│   ├── Dockerfile           # 前端容器配置
│   └── nginx.conf           # Nginx配置
├── backend/                  # Node.js后端应用
│   ├── src/
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # API路由
│   │   └── app.js           # 应用入口
│   └── Dockerfile           # 后端容器配置
├── docker-compose.yml       # Docker编排配置
├── dev-start.sh            # 开发环境启动脚本
├── dev-stop.sh             # 开发环境停止脚本
└── README.md               # 项目文档
```

## 🔗 API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### 陆运接口
- `GET /api/landfreight/loads` - 获取货源信息
- `GET /api/landfreight/trucks` - 获取车源信息
- `POST /api/landfreight/loads` - 发布货源信息
- `POST /api/landfreight/trucks` - 发布车源信息

### 海运接口
- `GET /api/seafreight/cargo` - 获取舱位信息
- `GET /api/seafreight/demands` - 获取货运需求
- `POST /api/seafreight/cargo` - 发布舱位信息
- `POST /api/seafreight/demands` - 发布货运需求

### 空运接口
- `GET /api/airfreight/cargo` - 获取舱位信息
- `GET /api/airfreight/demands` - 获取货运需求
- `POST /api/airfreight/cargo` - 发布舱位信息
- `POST /api/airfreight/demands` - 发布货运需求

## 🎨 设计特色

### 响应式布局
- **桌面端** (>768px): 多列网格布局，最佳信息展示
- **平板端** (≤768px): 单列布局，优化触控体验
- **手机端** (≤480px): 垂直布局，简化操作流程

### 用户体验
- **统一设计语言**: 三个平台保持一致的视觉风格
- **智能搜索**: 实时搜索和多维度筛选
- **加载优化**: 骨架屏、懒加载等性能优化
- **错误处理**: 友好的错误提示和恢复机制

## 🧪 测试

```bash
# 运行前端测试
cd frontend
npm test

# 运行后端测试
cd backend
npm test

# 运行端到端测试
npm run test:e2e
```

## 📈 性能指标

- 首屏加载时间: < 2秒
- API响应时间: < 200ms
- 移动端适配: 95+ 分
- 系统可用性: 99.9%+

## 🔒 安全特性

- JWT身份验证
- CORS跨域保护
- 请求频率限制
- 输入数据验证
- XSS防护
- SQL注入防护

## 🌍 环境配置

### 前端环境变量
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_NAME=EW物流平台
REACT_APP_VERSION=1.0.0
```

### 后端环境变量
```env
NODE_ENV=development
PORT=5001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## 📝 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循React最佳实践
- 统一的注释和文档风格

### Git工作流
- `main` - 生产环境分支
- `develop` - 开发环境分支
- `feature/*` - 功能开发分支
- `hotfix/*` - 紧急修复分支

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建配置
```

## 🔮 未来规划

### 短期目标 (1-2周)
- [ ] 数据库集成 (PostgreSQL)
- [ ] 用户注册登录完善
- [ ] 单元测试覆盖
- [ ] 性能监控

### 中期目标 (1-2个月)
- [ ] 支付系统集成
- [ ] 消息通知系统
- [ ] 移动端APP
- [ ] 数据分析仪表板

### 长期目标 (3-6个月)
- [ ] 人工智能推荐
- [ ] 区块链技术集成
- [ ] 国际化支持
- [ ] 开放API平台

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目主页: [EW物流平台](https://github.com/your-org/ew-webview)
- 技术支持: support@ewlogistics.com
- 商务合作: business@ewlogistics.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**EW物流平台** - 让物流更简单，让世界更连接 🌍 