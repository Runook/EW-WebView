# Warp Freight API 集成指南

## 概述
已成功集成Warp Freight API以获取真实的LTL运输报价。

## API 配置

### 1. API Key 设置
API Key 已配置在 `/frontend/src/config/warpApi.js` 文件中。

如需更改，请在项目根目录创建 `.env.local` 文件：
```bash
REACT_APP_WARP_API_KEY=你的API密钥
```

### 2. API 端点
- **Base URL**: `https://gw.wearewarp.com/api/v1`
- **获取报价**: `POST /freight/ltl/quote`
- **预订运输**: `POST /freight/ltl/book`
- **追踪运输**: `GET /freight/ltl/track/:trackingNumber`

## 功能说明

### 📦 获取LTL报价 (getLTLQuote)

**请求数据结构：**
```javascript
{
  origin: {
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US",
    locationType: "commercial"
  },
  destination: {
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US",
    locationType: "commercial"
  },
  pickupDate: "2025-11-26",
  items: [{
    description: "Electronics",
    weight: 500,
    weightUnit: "lbs",
    length: 48,
    width: 40,
    height: 48,
    dimensionUnit: "in",
    quantity: 3,
    freightClass: "100",
    stackable: true,
    hazmat: false
  }],
  accessorials: {
    pickup: ["inside_pickup", "lift_gate"],
    delivery: ["inside_delivery"]
  }
}
```

**返回数据格式：**
```javascript
{
  quotes: [{
    carrier: { name: "XPO Logistics", logo: "..." },
    totalCharges: 837.44,
    serviceLevel: "Standard LTL",
    serviceType: "Guaranteed 5 PM",
    transitTime: "5 Days",
    pickupTerminal: {...},
    deliveryTerminal: {...},
    expirationDate: "11/28/2025",
    quoteId: "WRP-123456"
  }]
}
```

### 🚚 预订运输 (bookLTLShipment)

在用户填写完发货详情并提交后调用，包含完整的shipper和consignee信息。

### 📍 追踪运输 (trackShipment)

使用tracking number查询运输状态。

## 使用流程

### 步骤1: 用户填写运输信息
- 起点和终点地址（通过Google Maps获取准确的城市、州、邮编）
- 货物详情（重量、尺寸、等级等）
- 附加服务选择

### 步骤2: 获取承运商报价
```javascript
// 在 GetQuoteLTL.js 的 handleSubmit 中
const quotes = await warpApi.getLTLQuote(warpQuoteData);
```

系统会：
1. 从Google Maps的addressComponents提取准确的城市、州、邮编
2. 调用Warp API获取报价
3. 转换Warp的响应格式为本地格式
4. 显示报价列表供用户选择

### 步骤3: 用户填写详细信息并预订
```javascript
// 用户提交最终订单时
const booking = await warpApi.bookLTLShipment(bookingData);
```

## 错误处理

### 降级策略
如果Warp API调用失败，系统会自动降级使用Mock数据，确保用户体验不中断。

```javascript
try {
  const quotes = await warpApi.getLTLQuote(data);
  // 使用真实报价
} catch (error) {
  console.error('Warp API failed, using mock data');
  // 降级到Mock数据
}
```

### 日志记录
所有API调用都有详细的console日志：
- 🚚 请求发送
- 📦 响应状态
- ✅ 成功数据
- ❌ 错误信息

## 测试

### 测试流程
1. 启动前端: `cd frontend && npm start`
2. 访问: `http://localhost:3000/get-quote-ltl`
3. 填写运输信息
4. 点击"获取LTL报价"
5. 查看浏览器控制台的API调用日志

### 验证要点
- ✅ API请求格式正确
- ✅ 响应数据正确解析
- ✅ 报价卡片正确显示
- ✅ 错误时降级到Mock数据

## 注意事项

⚠️ **重要提示：**
1. API Key 不应提交到Git仓库
2. 生产环境请使用环境变量
3. 确保API Key有足够的配额
4. 监控API调用成本

## 下一步开发

- [ ] 完善错误处理和用户提示
- [ ] 实现预订功能的完整流程
- [ ] 添加运输追踪功能
- [ ] 保存报价到后端数据库
- [ ] 实现报价历史查询

## 相关文件

- `/frontend/src/config/warpApi.js` - Warp API集成
- `/frontend/src/pages/GetQuoteLTL.js` - LTL报价页面
- `/frontend/src/components/ltl/ShipmentDetailsForm.js` - 发货详情表单

---
**API 文档**: https://developer.wearewarp.com/docs/freight/#/

