#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取前端的FBA位置数据
const frontendDataPath = path.join(__dirname, '../frontend/src/data/fba-locations.json');
const backendFilePath = path.join(__dirname, '../backend/src/routes/fba-simple.js');

try {
  // 读取前端数据
  const frontendData = JSON.parse(fs.readFileSync(frontendDataPath, 'utf8'));
  
  // 转换数据格式
  const convertedLocations = frontendData.map(location => {
    // 解析地址信息
    let address = location.Address || '';
    let city = '';
    let state = location.State || '';
    let zipCode = '';
    
    // 尝试从地址中提取城市和ZIP码
    const addressParts = address.split(', ');
    if (addressParts.length >= 2) {
      address = addressParts[0]; // 街道地址
      const lastPart = addressParts[addressParts.length - 1];
      
      // 检查最后部分是否包含ZIP码
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
        const cityState = lastPart.replace(zipMatch[0], '').trim();
        const cityStateParts = cityState.split(' ');
        if (cityStateParts.length > 1) {
          city = cityStateParts.slice(0, -1).join(' ').trim();
          if (!state) {
            state = cityStateParts[cityStateParts.length - 1].trim();
          }
        }
      } else {
        // 没有ZIP码，尝试提取城市
        if (addressParts.length >= 3) {
          city = addressParts[1].trim();
        } else {
          // 简单情况：只有地址和州
          const parts = lastPart.split(' ');
          if (parts.length > 1) {
            city = parts.slice(0, -1).join(' ').trim();
            if (!state) {
              state = parts[parts.length - 1].trim();
            }
          }
        }
      }
    }
    
    // 如果没有提取到城市，尝试从地址中获取
    if (!city && addressParts.length > 1) {
      city = addressParts[addressParts.length - 2]?.trim() || '';
    }
    
    // 生成名称
    const name = city ? `${city} Fulfillment Center` : `${location.Code} Fulfillment Center`;
    
    return {
      id: location.Code,
      code: location.Code,
      name: name,
      type: location.FC || 'FC',
      address: address.trim(),
      city: city.trim(),
      state: state,
      zip_code: zipCode,
      country: 'US',
      description: 'Amazon FBA配送中心',
      is_active: true,
      comment_stats: { total_comments: 0 }
    };
  }).filter(loc => loc.code && loc.code.trim()); // 过滤掉没有Code的条目
  
  console.log(`转换了 ${convertedLocations.length} 个FBA位置`);
  
  // 读取后端文件
  let backendContent = fs.readFileSync(backendFilePath, 'utf8');
  
  // 查找并替换mockLocations数组
  const startMarker = 'const mockLocations = [';
  const endMarker = '];';
  
  const startIndex = backendContent.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error('找不到mockLocations数组的开始标记');
  }
  
  const endIndex = backendContent.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    throw new Error('找不到mockLocations数组的结束标记');
  }
  
  // 生成新的数组内容
  const newLocationsArray = `const mockLocations = [\n${convertedLocations.map(loc => 
    `  {\n    id: '${loc.id}',\n    code: '${loc.code}',\n    name: '${loc.name}',\n    type: '${loc.type}',\n    address: '${loc.address.replace(/'/g, "\\'")}',\n    city: '${loc.city}',\n    state: '${loc.state}',\n    zip_code: '${loc.zip_code}',\n    country: '${loc.country}',\n    description: '${loc.description}',\n    is_active: ${loc.is_active},\n    comment_stats: { total_comments: ${loc.comment_stats.total_comments} }\n  }`
  ).join(',\n')}\n];`;
  
  // 替换内容
  const newContent = backendContent.substring(0, startIndex) + newLocationsArray + backendContent.substring(endIndex + endMarker.length);
  
  // 写入文件
  fs.writeFileSync(backendFilePath, newContent, 'utf8');
  
  console.log('✅ 成功更新后端FBA位置数据！');
  console.log(`📍 总共添加了 ${convertedLocations.length} 个FBA位置`);
  
  // 显示一些示例位置
  console.log('\n📋 示例位置：');
  convertedLocations.slice(0, 10).forEach(loc => {
    console.log(`  - ${loc.code}: ${loc.name} (${loc.city}, ${loc.state})`);
  });
  
  // 查找SUHB位置
  const suhbLocation = convertedLocations.find(loc => loc.code === 'SUHB');
  if (suhbLocation) {
    console.log('\n🎯 找到用户访问的SUHB位置：');
    console.log(`   ${suhbLocation.code}: ${suhbLocation.name}`);
    console.log(`   地址: ${suhbLocation.address}, ${suhbLocation.city}, ${suhbLocation.state}`);
  }
  
} catch (error) {
  console.error('❌ 转换失败:', error.message);
  process.exit(1);
}