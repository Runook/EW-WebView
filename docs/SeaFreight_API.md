# 海运信息平台 API 文档

## 概述

海运信息平台提供完整的海运物流信息发布和匹配服务，包括：
- **出现仓**：发布和浏览可用舱位信息
- **寻现仓**：发布和浏览货运需求信息

## 基础信息

- **Base URL**: `http://localhost:5001/api/seafreight`
- **认证方式**: JWT Token (部分接口需要)
- **数据格式**: JSON

## API 端点

### 1. 舱位信息管理 (出现仓)

#### 1.1 获取所有舱位信息
```http
GET /api/seafreight/cargo
```

**查询参数**:
- `origin` (string, optional): 起始港筛选
- `destination` (string, optional): 目的港筛选
- `cargoType` (string, optional): 货物类型筛选
- `vesselType` (string, optional): 船舶类型筛选
- `page` (number, optional): 页码，默认 1
- `limit` (number, optional): 每页数量，默认 10

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "origin": "上海港 (CNSHA)",
      "destination": "洛杉矶港 (USLAX)",
      "sailingDate": "2024-01-20",
      "vesselName": "中远海运宇宙",
      "shippingLine": "中远海运集装箱运输",
      "availableSpace": "200 TEU",
      "rate": "¥2,800/TEU",
      "transitTime": "15天",
      "cargoType": "普货/危险品",
      "company": "中远海运代理",
      "rating": 4.8,
      "phone": "(021) 1234-5678",
      "vesselType": "集装箱船",
      "cutOffDate": "2024-01-18",
      "specialService": "Door to Door"
    }
  ],
  "total": 4,
  "page": 1,
  "totalPages": 1
}
```

#### 1.2 获取特定舱位信息
```http
GET /api/seafreight/cargo/:id
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "origin": "上海港 (CNSHA)",
    "destination": "洛杉矶港 (USLAX)",
    // ... 其他字段
  }
}
```

#### 1.3 发布舱位信息 🔒 (需要认证)
```http
POST /api/seafreight/cargo
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "origin": "上海港 (CNSHA)",
  "destination": "洛杉矶港 (USLAX)",
  "sailingDate": "2024-01-20",
  "cutOffDate": "2024-01-18",
  "vesselName": "中远海运宇宙",
  "shippingLine": "中远海运集装箱运输",
  "vesselType": "集装箱船",
  "availableSpace": "200 TEU",
  "rate": "¥2,800/TEU",
  "transitTime": "15天",
  "cargoType": "普货",
  "containerTypes": "20GP,40GP",
  "specialService": "Door to Door",
  "companyName": "中远海运代理",
  "contactPhone": "(021) 1234-5678",
  "contactEmail": "info@cosco.com",
  "notes": "欢迎垂询"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "舱位信息发布成功",
  "data": {
    "id": 123,
    "origin": "上海港 (CNSHA)",
    // ... 其他字段
  }
}
```

#### 1.4 更新舱位信息 🔒 (需要认证和权限)
```http
PUT /api/seafreight/cargo/:id
```

#### 1.5 删除舱位信息 🔒 (需要认证和权限)
```http
DELETE /api/seafreight/cargo/:id
```

### 2. 货运需求管理 (寻现仓)

#### 2.1 获取所有货运需求
```http
GET /api/seafreight/demands
```

**查询参数**:
- `origin` (string, optional): 起始港筛选
- `destination` (string, optional): 目的港筛选
- `cargoType` (string, optional): 货物类型筛选
- `urgency` (string, optional): 紧急程度筛选
- `page` (number, optional): 页码，默认 1
- `limit` (number, optional): 每页数量，默认 10

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "origin": "广州南沙港 (CNCAN)",
      "destination": "新加坡港 (SGSIN)",
      "requiredDate": "2024-01-28",
      "weight": "20 TEU",
      "cargoType": "电子产品",
      "urgency": "紧急",
      "maxRate": "¥1,800/TEU",
      "company": "广州科技出口",
      "rating": 4.6,
      "phone": "(020) 1111-2222",
      "specialRequirements": "恒温干燥",
      "insurance": "高价值货物保险",
      "containerType": "20GP 干箱",
      "incoterms": "FOB"
    }
  ],
  "total": 3,
  "page": 1,
  "totalPages": 1
}
```

#### 2.2 获取特定货运需求
```http
GET /api/seafreight/demands/:id
```

#### 2.3 发布货运需求 🔒 (需要认证)
```http
POST /api/seafreight/demands
```

**请求体**:
```json
{
  "origin": "广州南沙港 (CNCAN)",
  "destination": "新加坡港 (SGSIN)",
  "requiredDate": "2024-01-28",
  "weight": "20 TEU",
  "cargoType": "电子产品",
  "containerType": "20GP 干箱",
  "urgency": "紧急",
  "maxRate": "¥1,800/TEU",
  "incoterms": "FOB",
  "specialRequirements": "恒温干燥",
  "insurance": "高价值货物保险",
  "companyName": "广州科技出口",
  "contactPhone": "(020) 1111-2222",
  "contactEmail": "export@tech.com",
  "notes": "急需运输"
}
```

#### 2.4 更新货运需求 🔒 (需要认证和权限)
```http
PUT /api/seafreight/demands/:id
```

#### 2.5 删除货运需求 🔒 (需要认证和权限)
```http
DELETE /api/seafreight/demands/:id
```

### 3. 用户管理

#### 3.1 获取用户发布的信息 🔒 (需要认证)
```http
GET /api/seafreight/my-posts
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cargo": [
      // 用户发布的舱位信息
    ],
    "demands": [
      // 用户发布的货运需求
    ],
    "total": 5
  }
}
```

### 4. 统计信息

#### 4.1 获取平台统计
```http
GET /api/seafreight/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalCargo": 50,
    "totalDemands": 30,
    "recentCargo": 10,
    "recentDemands": 8,
    "totalPosts": 80
  }
}
```

## 数据常量

### 货物类型
```javascript
[
  '普货', '危险品', '冷冻货物', '散货', '液体货物', '超重超限',
  '电子产品', '机械设备', '化工品', '食品原料', '纺织品', '汽车及配件'
]
```

### 船舶类型
```javascript
[
  '集装箱船', '散货船', '液货船', '滚装船', '多用途船', '超大型集装箱船'
]
```

### 集装箱类型
```javascript
[
  '20GP (干货集装箱)', '40GP (干货集装箱)', '40HC (高箱)',
  '20RF (冷冻箱)', '40RF (冷冻箱)', '20OT (开顶箱)', '40OT (开顶箱)',
  '20FR (框架箱)', '40FR (框架箱)', '20TK (罐箱)', 'LCL (散货拼箱)', '散货船'
]
```

### 紧急程度
```javascript
['普通', '加急', '紧急', '特急']
```

### 贸易条款 (Incoterms)
```javascript
[
  'EXW (工厂交货)', 'FCA (货交承运人)', 'FAS (船边交货)', 'FOB (船上交货)',
  'CFR (成本加运费)', 'CIF (成本保险费加运费)', 'CPT (运费付至)', 'CIP (运费保险费付至)',
  'DAP (目的地交货)', 'DPU (目的地卸货交货)', 'DDP (完税后交货)'
]
```

### 主要船公司
```javascript
[
  '中远海运集装箱运输', '东方海外货柜航运', '地中海航运', '马士基航运',
  '达飞轮船', '赫伯罗特', '阳明海运', '现代商船', '万海航运'
]
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 认证说明

需要认证的接口需要在请求头中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

Token 可以通过 `/api/auth/login` 接口获取。

## 数据验证

### 舱位信息必填字段
- origin, destination, sailingDate, vesselName, shippingLine
- availableSpace, rate, cargoType, vesselType, cutOffDate
- companyName, contactPhone

### 货运需求必填字段
- origin, destination, requiredDate, weight, cargoType
- urgency, maxRate, containerType, companyName, contactPhone

## 使用示例

### JavaScript (Fetch API)
```javascript
// 获取舱位信息
const response = await fetch('http://localhost:5001/api/seafreight/cargo');
const data = await response.json();

// 发布舱位信息 (需要认证)
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5001/api/seafreight/cargo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    origin: '上海港 (CNSHA)',
    destination: '洛杉矶港 (USLAX)',
    // ... 其他字段
  })
});
```

### cURL
```bash
# 获取舱位信息
curl -X GET http://localhost:5001/api/seafreight/cargo

# 发布舱位信息
curl -X POST http://localhost:5001/api/seafreight/cargo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "origin": "上海港 (CNSHA)",
    "destination": "洛杉矶港 (USLAX)",
    "sailingDate": "2024-01-20",
    "vesselName": "中远海运宇宙"
  }'
```

## 数据库集成准备

项目已预留数据库集成接口，包含：
- 完整的数据模型定义
- SQL 表结构创建脚本
- 数据验证函数
- 索引优化建议

可轻松集成 MySQL、PostgreSQL 等数据库系统。 