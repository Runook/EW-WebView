#!/bin/bash

# Warp API 测试脚本
# 用于验证API连接和响应
# API文档: https://developer.wearewarp.com/docs/freight/#/

API_KEY="Fy1ur8h8psNFIkfNBqEdIPR4edGsYcsv/3p6yqGLFQbx7jp89j5lZ38Zg8Zm9gsWLfKrhWiwWBjBY9pcGS/FNc9KuwIDijYbGtWK4jmJJGQ="
API_BASE_URL="https://gw.wearewarp.com/api/v1"

echo "🚚 测试Warp Freight API连接..."
echo "================================"

# 计算下周一作为取货日期
PICKUP_DATE=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d)

# 测试数据 - 符合API文档的schema
TEST_DATA='{
  "pickupDate": "'$PICKUP_DATE'",
  "pickupInfo": {
    "zipcode": "10001"
  },
  "deliveryInfo": {
    "zipcode": "90001"
  },
  "listItems": [{
    "name": "Test Freight Item",
    "height": 48,
    "length": 48,
    "width": 40,
    "sizeUnit": "IN",
    "quantity": 3,
    "totalWeight": 500,
    "weightUnit": "lbs",
    "stackable": true,
    "notes": "Test shipment"
  }],
  "shipmentType": "LTL"
}'

echo "📤 发送测试请求到 /freights/quote..."
echo "📅 取货日期: $PICKUP_DATE"
echo ""

# 调用API - 使用 apikey header (不是Bearer token)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${TEST_DATA}" \
  "${API_BASE_URL}/freights/quote")

# 提取HTTP状态码和响应体
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📊 响应状态码: ${HTTP_CODE}"
echo ""
echo "📦 响应内容:"
echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API连接成功！"
elif [ "$HTTP_CODE" = "201" ]; then
  echo "✅ API请求成功！(201 Created)"
else
  echo "❌ API调用失败，状态码: ${HTTP_CODE}"
  echo ""
  echo "💡 可能的原因："
  echo "  1. API Key 不正确或已过期"
  echo "  2. 请求格式不符合要求"
  echo "  3. 网络连接问题"
fi

echo ""
echo "================================"
echo "测试完成"
