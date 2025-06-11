# Google Maps 集成指南

## 概述

陆运信息平台已成功集成 Google Maps API，用于地址自动完成和路线计算功能。本指南将说明如何使用新的Google Maps功能以及相关配置。

## API Key 配置

您的 Google Maps API Key: `AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE`

### 环境变量配置 (可选)

您可以在环境变量中设置 API Key：

```bash
# 在 .env 文件中添加
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE
```

## 功能特性

### 1. 地址自动完成
- 支持城市名、街道地址、ZIP代码输入
- 实时显示地址建议
- 自动获取详细地理信息（经纬度、地址组件等）

### 2. 路线计算和导航
- 显示两地之间的驾驶路线
- 计算距离和预计时间
- 提供详细的驾驶指引
- 支持在Google Maps中打开完整路线

### 3. 交互式地图
- 可拖拽路线调整
- 缩放和全屏控制
- 响应式设计，适配移动设备

## 已更新的组件

### 1. PostLoadModal.js
- 替换了原有的 zipCodes 数据库查询
- 使用 `GoogleMapsAddressInput` 组件处理起点和终点输入
- 添加了路线查看功能

### 2. PostTruckModal.js
- 更新了当前位置、常跑起点、常跑终点的输入方式
- 集成了常跑路线查看功能

### 3. 新增组件
- `GoogleMapsAddressInput.js` - 地址输入组件
- `GoogleMapsRoute.js` - 路线显示组件
- `GoogleMapsAddressInput.css` - 相关样式

## 使用方法

### 地址输入
1. 在起点或终点输入框中输入至少3个字符
2. 系统会自动显示Google Maps的地址建议
3. 点击选择合适的地址
4. 地址详细信息会自动保存

### 路线查看
1. 在发布货源/车源时，输入起点和终点
2. 当两个地址都选择后，会显示"查看导航路线"按钮
3. 点击按钮打开路线模态框
4. 查看距离、时间和详细导航指引
5. 可点击"在Google Maps中打开"查看完整路线

## Google Maps API 配置

### 必需的API服务
- Places API
- Directions API
- Maps JavaScript API
- Geocoding API

### 域名限制配置
确保在Google Cloud Console中配置了正确的域名限制：
- `localhost:3000` (开发环境)
- 您的生产域名

### 计费注意事项
- Places API: $17/1000次请求
- Directions API: $5/1000次请求
- Maps JavaScript API: $7/1000次地图加载

建议设置使用限额和预警。

## 故障排除

### 常见问题

1. **API Key 无效**
   - 检查API Key是否正确
   - 确认API服务已启用
   - 验证域名限制设置

2. **地址建议不显示**
   - 检查网络连接
   - 确认Places API已启用
   - 查看浏览器控制台是否有错误

3. **路线无法计算**
   - 确认Directions API已启用
   - 检查起点和终点是否有效
   - 验证API配额是否充足

### 开发者工具
使用浏览器开发者工具的Network标签查看API请求状态：
- 成功请求返回200状态码
- 失败请求会显示错误信息

## 性能优化建议

1. **缓存地址结果**
   - 在本地存储常用地址
   - 减少重复API调用

2. **限制请求频率**
   - 添加防抖动(debounce)机制
   - 设置最小输入字符数

3. **错误处理**
   - 提供降级方案
   - 显示友好的错误信息

## 未来扩展功能

1. **地址验证**
   - 集成地址标准化服务
   - 提供地址质量评分

2. **多语言支持**
   - 支持中英文地址输入
   - 本地化的地址格式

3. **高级路线选项**
   - 避开高速公路
   - 避开收费站
   - 货车专用路线

## 联系与支持

如果在使用过程中遇到问题，请参考：
- Google Maps Platform 文档
- 项目技术文档
- 开发团队支持

---

更新日期: 2024年12月
版本: 1.0 