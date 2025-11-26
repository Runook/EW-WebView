# 筛选功能调试指南

## 🔍 如何查看调试信息

我已经在FreightBoard.js中添加了详细的调试日志，帮助你找出筛选问题的根源。

### 步骤1：打开开发者工具

在浏览器中按 `F12` 或 `Cmd+Option+I` (Mac) 打开开发者工具，切换到 **Console** 标签页。

### 步骤2：重新加载页面

刷新陆运服务页面，你会看到类似这样的日志：

```
===== 货源数据调试 =====
总货源数量: 15
货源 #1: {
  id: 123,
  origin: "Los Angeles, CA",
  destination: "New York, NY",
  serviceType: "FTL",
  serviceTypeType: "string",
  service_type: undefined
}
货源 #2: {
  id: 124,
  origin: "Chicago, IL",
  destination: "Miami, FL",
  serviceType: "LTL",
  serviceTypeType: "string",
  service_type: undefined
}
...
```

### 步骤3：测试筛选功能

在筛选下拉菜单中选择"零担运输"(LTL)，控制台会输出：

```
===== 筛选开始 =====
数据类型: loads
原始数据数量: 15
当前筛选条件: {
  origin: "",
  destination: "",
  serviceType: "LTL",
  dateFrom: "",
  dateTo: "",
  sortBy: "date",
  distance: ""
}
筛选后数据数量: 5
===== 筛选结果ServiceType分布 =====
结果类型分布: { LTL: 5 }
前5个结果详情:
  1. ID:124, ServiceType:LTL, Origin:Chicago, IL
  2. ID:127, ServiceType:LTL, Origin:Seattle, WA
  ...
```

### 步骤4：检查问题

根据日志输出，检查以下几点：

#### 问题A：serviceType字段值不一致
如果看到：
```
Service type filter mismatch: {
  filter: "LTL",
  item: "ltl",  // ❌ 小写
  originalItem: "ltl",
  itemId: 125
}
```

说明数据库中存储的是小写"ltl"，而筛选器期望的是大写"LTL"。

#### 问题B：serviceType字段为空
如果看到：
```
货源 #3: {
  serviceType: undefined,  // ❌ 字段缺失
  service_type: "FTL"      // ✓ snake_case字段存在
}
```

说明后端的字段转换有问题，service_type没有正确转换为serviceType。

#### 问题C：筛选后仍包含错误类型
如果看到：
```
筛选后数据数量: 10
结果类型分布: { FTL: 3, LTL: 7 }  // ❌ 应该只有LTL
```

说明筛选逻辑本身有bug。

## 🔧 下一步操作

请在浏览器中执行上述步骤，然后：

1. **截图或复制控制台日志**
2. **告诉我看到了什么问题类型**（A、B、C或其他）
3. 我会根据具体情况修复代码

## 🎯 预期正常行为

当选择"零担运输"筛选时：
- 筛选后数据应该只包含 `serviceType: "LTL"` 的项目
- 结果类型分布应该是 `{ LTL: X }`（只有LTL）
- 页面显示的所有卡片都应该标记为"零担 LTL"

---

**注意**：测试完成后，我会移除这些调试日志，避免在生产环境中输出过多信息。

