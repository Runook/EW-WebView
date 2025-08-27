const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 辅助函数：标准化地址用于比较
function normalizeAddress(address) {
  if (!address || typeof address !== 'string') return '';
  return address.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/\bst\b/g, 'street')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\brd\b/g, 'road')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bpkwy\b/g, 'parkway');
}

// 生成唯一标识符：地址 + 代码
function generateUniqueKey(location) {
  const normalizedAddr = normalizeAddress(location.address);
  const normalizedCode = location.code ? location.code.trim().toUpperCase() : '';
  return `${normalizedAddr}|||${normalizedCode}`;
}

// 主要的去重函数 - 只删除完全相同的重复项
function deduplicateExactOnly() {
  console.log('🔍 开始精确去重处理（保留同地址不同代码）...\n');
  
  try {
    // 读取当前的JSON数据
    const dataPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'fba-locations.json');
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('读取当前数据...');
    
    // 收集所有位置数据
    const allLocations = [];
    for (const [state, locations] of Object.entries(currentData)) {
      if (Array.isArray(locations)) {
        locations.forEach(loc => {
          allLocations.push({
            ...loc,
            originalState: state
          });
        });
      }
    }
    
    console.log(`原始数据: ${allLocations.length} 个位置`);
    
    // 使用地址+代码的组合作为唯一标识符
    const uniqueKeys = new Set();
    const keptLocations = [];
    const removedDuplicates = [];
    
    allLocations.forEach(loc => {
      const uniqueKey = generateUniqueKey(loc);
      
      if (uniqueKeys.has(uniqueKey)) {
        // 这是完全相同的重复项（相同地址 + 相同代码）
        removedDuplicates.push({
          ...loc,
          reason: '完全相同的地址和代码'
        });
      } else {
        // 这是唯一的记录（地址+代码组合唯一）
        uniqueKeys.add(uniqueKey);
        keptLocations.push(loc);
      }
    });
    
    console.log(`\n📊 精确去重统计:`);
    console.log(`  原始位置数: ${allLocations.length}`);
    console.log(`  保留位置数: ${keptLocations.length}`);
    console.log(`  移除完全重复项: ${removedDuplicates.length}`);
    
    // 显示被移除的完全重复项
    if (removedDuplicates.length > 0) {
      console.log(`\n❌ 移除的完全重复项:`);
      removedDuplicates.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.code} | ${item.city} | ${item.originalState}`);
        console.log(`     地址: ${item.address}`);
      });
    }
    
    // 分析同地址不同代码的情况
    const addressGroups = {};
    keptLocations.forEach(loc => {
      const normalizedAddr = normalizeAddress(loc.address);
      if (!addressGroups[normalizedAddr]) {
        addressGroups[normalizedAddr] = [];
      }
      addressGroups[normalizedAddr].push(loc);
    });
    
    const multiCodeAddresses = Object.values(addressGroups).filter(group => group.length > 1);
    if (multiCodeAddresses.length > 0) {
      console.log(`\n✅ 保留的同地址不同代码组合 (${multiCodeAddresses.length} 组):`);
      multiCodeAddresses.forEach((group, index) => {
        console.log(`  组 ${index + 1} - 地址: ${group[0].address}`);
        group.forEach(loc => {
          console.log(`    → ${loc.code} | ${loc.city} | ${loc.originalState}`);
        });
      });
    }
    
    // 重新按州分组
    const newData = {};
    keptLocations.forEach(loc => {
      const state = loc.originalState;
      if (!newData[state]) {
        newData[state] = [];
      }
      
      // 移除临时字段
      const cleanedLoc = { ...loc };
      delete cleanedLoc.originalState;
      
      newData[state].push(cleanedLoc);
    });
    
    // 对每个州的数据按代码排序
    Object.keys(newData).forEach(state => {
      newData[state].sort((a, b) => a.code.localeCompare(b.code));
    });
    
    // 备份当前文件
    const backupPath = dataPath + '.backup.' + Date.now();
    fs.copyFileSync(dataPath, backupPath);
    console.log(`\n📁 当前数据已备份至: ${backupPath}`);
    
    // 保存精确去重后的数据
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`✅ 精确去重后的数据已保存`);
    
    // 统计每个州的位置数
    console.log(`\n🗺️  各州位置统计:`);
    const sortedStates = Object.keys(newData).sort();
    sortedStates.forEach(state => {
      console.log(`  ${state}: ${newData[state].length} 个位置`);
    });
    
    return {
      originalCount: allLocations.length,
      exactDuplicatesRemoved: removedDuplicates.length,
      finalCount: keptLocations.length,
      multiCodeAddressGroups: multiCodeAddresses.length,
      stateBreakdown: Object.fromEntries(
        Object.keys(newData).map(state => [state, newData[state].length])
      )
    };
    
  } catch (error) {
    console.error('❌ 精确去重处理失败:', error.message);
    throw error;
  }
}

// 主函数
function main() {
  try {
    console.log('🚀 启动FBA数据精确去重工具...\n');
    console.log('策略: 只删除完全相同的记录（相同地址+相同代码）');
    console.log('保留: 同地址但不同代码的所有记录\n');
    
    const result = deduplicateExactOnly();
    
    console.log('\n🎉 FBA数据精确去重完成!');
    console.log('\n总结:');
    console.log(`• 保留了 ${result.multiCodeAddressGroups} 组同地址不同代码的位置`);
    console.log(`• 仅删除了 ${result.exactDuplicatesRemoved} 个完全相同的重复项`);
    console.log(`• 最终数据: ${result.finalCount} 个位置`);
    
    console.log('\n下一步:');
    console.log('1. 检查精确去重结果');
    console.log('2. 运行数据库更新脚本重新导入数据');
    
    return result;
    
  } catch (error) {
    console.error('\n💥 精确去重失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  deduplicateExactOnly,
  normalizeAddress,
  generateUniqueKey,
  main
};