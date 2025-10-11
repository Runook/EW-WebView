# EW Employee Service (员工管理微服务)

独立的员工管理和订单系统微服务，与主系统共享AWS Cognito认证。

## 🏗️ 架构说明

这是一个独立的微服务，具有以下特点：

- **独立端口**: 运行在3001端口
- **共享认证**: 使用主系统的AWS Cognito进行身份认证
- **共享数据库**: 与主系统共享PostgreSQL数据库，但使用独立的表
- **权限管理**: 基于角色的权限控制系统（RBAC）

## 📋 功能模块

### 1. 员工管理
- 设置用户为员工（管理员功能）
- 员工角色管理（员工/经理/管理员）
- 员工信息查看和编辑
- 员工统计和业绩查看

### 2. 订单管理
- 订单创建、查看、编辑、删除
- 订单状态管理
- 订单分配给员工
- 订单评论和备注
- 订单统计和报表

### 3. 权限系统
- 基于角色的权限控制
- 细粒度权限管理
- 三种角色：
  - **employee**: 普通员工，管理自己的订单
  - **manager**: 经理，查看和管理所有订单
  - **admin**: 管理员，完全控制权限

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL数据库
- 主系统已配置AWS Cognito

### 安装依赖

```bash
cd employee-service
npm install
```

### 环境配置

创建 `.env` 文件：

```bash
# 员工服务端口
PORT=3001

# 数据库配置（与主系统共享）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ewltl
DB_USER=postgres
DB_PASSWORD=postgres

# Cognito配置（与主系统共享）
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_HU9W7uLQA

# 环境
NODE_ENV=development

# CORS配置
CORS_ORIGIN=http://localhost:3000
```

### 数据库迁移

```bash
# 在主项目backend目录运行迁移
cd ../backend
npx knex migrate:latest
```

这将创建以下表：
- `employee_orders` - 订单表
- `employee_order_logs` - 订单操作日志
- `employee_order_comments` - 订单评论
- `employee_permissions` - 权限定义
- `employee_role_permissions` - 角色权限关联
- `employee_statistics` - 员工统计

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 http://localhost:3001 启动

## 📡 API文档

### 认证

所有API都需要在请求头中包含JWT Token：

```
Authorization: Bearer <token>
```

### 员工管理 API

#### GET /api/employees
获取所有员工列表（需要employee.view权限）

**查询参数**:
- `role`: 角色过滤 (employee/manager/admin)
- `isActive`: 是否激活
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "employee@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "employee_id": "EW240001",
      "employee_role": "employee",
      "stats": {
        "totalOrders": 10,
        "completedOrders": 8,
        "totalRevenue": 50000
      }
    }
  ]
}
```

#### POST /api/employees/set
设置用户为员工（需要employee.manage权限）

**请求体**:
```json
{
  "userId": 1,
  "role": "employee",
  "employeeId": "EW240001"
}
```

#### GET /api/employees/me/info
获取当前登录员工信息

#### GET /api/employees/:id/stats
获取员工统计信息

### 订单管理 API

#### GET /api/orders
获取订单列表

**查询参数**:
- `status`: 状态过滤
- `order_type`: 订单类型
- `priority`: 优先级
- `search`: 搜索关键词
- `page`: 页码
- `limit`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### POST /api/orders
创建新订单（需要order.create权限）

**请求体**:
```json
{
  "customer_name": "ABC Company",
  "customer_email": "contact@abc.com",
  "customer_phone": "+1234567890",
  "order_type": "land_freight",
  "status": "draft",
  "priority": "normal",
  "cargo_description": "Electronics",
  "cargo_weight": 1000,
  "origin_city": "Los Angeles",
  "destination_city": "New York",
  "pickup_date": "2024-01-15",
  "quoted_price": 5000
}
```

#### GET /api/orders/:id
获取订单详情

#### PUT /api/orders/:id
更新订单

#### DELETE /api/orders/:id
删除订单（软删除）

#### POST /api/orders/:id/comments
添加订单评论

**请求体**:
```json
{
  "comment": "已联系客户确认取货时间",
  "isInternal": true
}
```

#### POST /api/orders/:id/assign
分配订单给员工（需要order.assign权限）

**请求体**:
```json
{
  "assignedTo": 2
}
```

#### GET /api/orders/statistics
获取订单统计信息

## 🔐 权限系统

### 权限列表

**订单权限**:
- `order.view.own` - 查看自己的订单
- `order.view.all` - 查看所有订单
- `order.create` - 创建订单
- `order.edit.own` - 编辑自己的订单
- `order.edit.all` - 编辑所有订单
- `order.delete.own` - 删除自己的订单
- `order.delete.all` - 删除所有订单
- `order.assign` - 分配订单

**员工权限**:
- `employee.view` - 查看员工列表
- `employee.manage` - 管理员工

**报表权限**:
- `report.view.own` - 查看个人报表
- `report.view.all` - 查看所有报表

### 角色权限矩阵

| 权限 | employee | manager | admin |
|------|----------|---------|-------|
| order.view.own | ✅ | ✅ | ✅ |
| order.view.all | ❌ | ✅ | ✅ |
| order.create | ✅ | ✅ | ✅ |
| order.edit.own | ✅ | ✅ | ✅ |
| order.edit.all | ❌ | ✅ | ✅ |
| order.delete.own | ✅ | ✅ | ✅ |
| order.delete.all | ❌ | ❌ | ✅ |
| order.assign | ❌ | ✅ | ✅ |
| employee.manage | ❌ | ❌ | ✅ |

## 🐳 Docker部署

```bash
# 构建镜像
docker build -t ew-employee-service .

# 运行容器
docker run -p 3001:3001 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  ew-employee-service
```

## 🔗 与主系统集成

### 1. 在docker-compose.yml中添加服务

```yaml
services:
  employee-service:
    build: ./employee-service
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=postgres
      - DB_NAME=ewltl
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - COGNITO_REGION=us-east-1
      - COGNITO_USER_POOL_ID=us-east-1_HU9W7uLQA
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      - postgres
```

### 2. Nginx反向代理配置

```nginx
# 主系统
location /api/ {
    proxy_pass http://backend:3000;
}

# 员工系统
location /api/employees {
    proxy_pass http://employee-service:3001;
}

location /api/orders {
    proxy_pass http://employee-service:3001;
}
```

## 🧪 测试

### 健康检查

```bash
curl http://localhost:3001/health
```

### 测试流程

1. **设置员工**（需要admin权限）:
```bash
curl -X POST http://localhost:3001/api/employees/set \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "role": "employee"}'
```

2. **创建订单**:
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "order_type": "land_freight",
    "cargo_description": "Test cargo"
  }'
```

3. **查看订单列表**:
```bash
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 数据库表结构

### employee_orders (订单表)
- 订单基本信息
- 客户信息
- 货物信息
- 地址信息
- 价格信息
- 员工信息

### employee_order_logs (操作日志)
- 操作类型
- 操作员工
- 变更内容
- 时间戳

### employee_permissions (权限定义)
- 权限键
- 权限名称
- 权限类别

### employee_role_permissions (角色权限关联)
- 角色
- 权限ID

## 🛠️ 开发指南

### 添加新权限

1. 在数据库中添加权限：
```sql
INSERT INTO employee_permissions (permission_key, permission_name, category)
VALUES ('new.permission', '新权限', 'category');
```

2. 分配给角色：
```sql
INSERT INTO employee_role_permissions (role, permission_id)
SELECT 'admin', id FROM employee_permissions WHERE permission_key = 'new.permission';
```

### 添加新API

1. 在 `src/routes/` 创建新路由文件
2. 在 `src/server.js` 中注册路由
3. 使用权限中间件保护路由：
```javascript
router.get('/', auth, requirePermission('your.permission'), handler);
```

## 📝 注意事项

1. 所有API都需要认证（Bearer Token）
2. 权限检查在中间件层面进行
3. 订单删除是软删除（is_deleted标记）
4. 所有操作都会记录日志
5. 员工只能查看/编辑自己的订单，除非有相应权限

## 🤝 贡献

欢迎提交问题和功能请求！

## 📄 许可

ISC License

