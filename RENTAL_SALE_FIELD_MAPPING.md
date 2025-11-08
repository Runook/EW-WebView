# 物流租售字段映射文档

## 修复总结

### 问题诊断
1. ❌ Sales表中 `brand`, `sub_category`, `images` 字段在数据库中设置为NOT NULL，但后端验证设为optional
2. ❌ 前端表单缺少 `subCategory` 输入字段
3. ❌ 字段名大小写不一致（前端用camelCase，数据库用snake_case）

### 修复内容
1. ✅ 修改数据库：将 `brand`, `sub_category`, `images` 改为nullable
2. ✅ 添加前端子分类输入字段
3. ✅ 优化前端数据处理：只发送非空字段
4. ✅ 添加详细日志帮助调试
5. ✅ 统一后端验证规则

---

## 字段映射对照表

### Rentals 表

| 前端表单字段名 | 前端传输字段名 | 数据库字段名 | 是否必填 | 数据类型 |
|--------------|---------------|-------------|---------|---------|
| title | title | title | ✅ YES | VARCHAR(255) |
| category | category | category | ✅ YES | VARCHAR(100) |
| subCategory | sub_category | sub_category | ❌ NO | VARCHAR(100) |
| location | location | location | ✅ YES | VARCHAR(100) |
| price | price | price | ✅ YES | VARCHAR(100) |
| condition | condition | condition | ✅ YES | VARCHAR(50) |
| brand | brand | brand | ❌ NO | VARCHAR(255) |
| description | description | description | ✅ YES | TEXT |
| phone | contactPhone | contact_phone | ❌ NO | VARCHAR(50) |
| contactName | contactPerson | contact_person | ❌ NO | VARCHAR(100) |
| company | company | company | ❌ NO | VARCHAR(255) |
| - | images | images | ❌ NO | TEXT (逗号分隔) |

### Sales 表

| 前端表单字段名 | 前端传输字段名 | 数据库字段名 | 是否必填 | 数据类型 |
|--------------|---------------|-------------|---------|---------|
| title | title | title | ✅ YES | VARCHAR(255) |
| category | category | category | ✅ YES | VARCHAR(100) |
| subCategory | sub_category | sub_category | ❌ NO | VARCHAR(100) |
| location | location | location | ✅ YES | VARCHAR(100) |
| price | price | price | ✅ YES | VARCHAR(100) |
| condition | condition | condition | ✅ YES | VARCHAR(50) |
| brand | brand | brand | ❌ NO | VARCHAR(255) |
| description | description | description | ✅ YES | TEXT |
| phone | contactPhone | contact_phone | ❌ NO | VARCHAR(50) |
| contactName | contactPerson | contact_person | ❌ NO | VARCHAR(100) |
| company | company | company | ❌ NO | VARCHAR(255) |
| - | images | images | ❌ NO | TEXT (逗号分隔) |

---

## 后端验证规则

### Rentals API (POST /api/rentals)

```javascript
// 必填字段
body('title').notEmpty()
body('category').notEmpty()
body('location').notEmpty()
body('price').notEmpty()
body('condition').notEmpty()
body('description').notEmpty()

// 可选字段
body('sub_category').optional().isString()
body('brand').optional().isString()
body('images').optional()
body('contactPhone').optional()
body('contactPerson').optional().isString()
body('company').optional().isString()
```

### Sales API (POST /api/sales)

```javascript
// 必填字段
body('title').notEmpty()
body('category').notEmpty()
body('location').notEmpty()
body('price').notEmpty()
body('condition').notEmpty()
body('description').notEmpty()

// 可选字段
body('sub_category').optional().isString()
body('brand').optional().isString()
body('images').optional()
body('contactPhone').optional()
body('contactPerson').optional().isString()
body('company').optional().isString()
```

---

## 前端数据处理逻辑

### handlePost 函数
```javascript
const postData = {
  // 必填字段
  title: formData.get('title'),
  category: formData.get('category'),
  location: formData.get('location'),
  price: formData.get('price'),
  condition: formData.get('condition'),
  description: formData.get('description'),
  contactPhone: formData.get('phone'),
  contactPerson: formData.get('contactName')
};

// 可选字段 - 只有非空时才添加
if (subCategory) postData.sub_category = subCategory;
if (brand) postData.brand = brand;
if (company) postData.company = company;
if (postForm.images.length > 0) postData.images = postForm.images.map(img => img.url);
```

---

## 数据库修改记录

### 执行的SQL命令

```sql
-- Sales表修改
ALTER TABLE sales ALTER COLUMN brand DROP NOT NULL;
ALTER TABLE sales ALTER COLUMN sub_category DROP NOT NULL;
ALTER TABLE sales ALTER COLUMN images DROP NOT NULL;

-- Rentals表修改（之前已执行）
ALTER TABLE rentals ALTER COLUMN brand DROP NOT NULL;
ALTER TABLE rentals ALTER COLUMN images DROP NOT NULL;
ALTER TABLE rentals ALTER COLUMN sub_category DROP NOT NULL;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS company VARCHAR(255);
```

---

## API端点

### Rentals
- `GET /api/rentals` - 获取所有租赁项
- `POST /api/rentals` - 创建租赁项（需认证）
- `GET /api/rentals/:id` - 获取单个租赁项
- `PUT /api/rentals/:id` - 更新租赁项（需认证）
- `DELETE /api/rentals/:id` - 删除租赁项（需认证）

### Sales
- `GET /api/sales` - 获取所有出售项
- `POST /api/sales` - 创建出售项（需认证）
- `GET /api/sales/:id` - 获取单个出售项
- `PUT /api/sales/:id` - 更新出售项（需认证）
- `DELETE /api/sales/:id` - 删除出售项（需认证）

---

## 调试日志

### 前端日志
- `📤 发布数据:` - 显示发送到后端的数据
- `✅ 发布结果:` - 显示后端返回的结果
- `❌ 发布失败详情:` - 显示错误详情

### 后端日志
- `📥 接收到租赁项发布请求:` - 显示接收到的租赁数据
- `📥 接收到销售项发布请求:` - 显示接收到的销售数据
- `❌ 租赁验证失败:` - 显示验证错误
- `❌ 销售验证失败:` - 显示验证错误

---

## 测试清单

- [ ] 物流出租 - 填写所有必填字段 - 可以发布
- [ ] 物流出租 - 不填品牌 - 可以发布
- [ ] 物流出租 - 不上传图片 - 可以发布
- [ ] 物流出售 - 填写所有必填字段 - 可以发布
- [ ] 物流出售 - 不填品牌 - 可以发布
- [ ] 物流出售 - 不上传图片 - 可以发布
- [ ] 发布后刷新页面 - 数据仍然存在
- [ ] Premium功能 - 置顶/高亮正常工作

---

更新时间: 2025-01-08

