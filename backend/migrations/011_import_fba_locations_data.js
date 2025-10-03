/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 从前端的FBA位置JSON文件导入数据
  const fbaLocationsData = require('../../frontend/src/data/fba-locations.json');
  
  const locationsToInsert = [];
  let idCounter = 1;

  // 处理JSON数据并转换为数据库格式
  for (const [state, locations] of Object.entries(fbaLocationsData)) {
    if (Array.isArray(locations)) {
      for (const location of locations) {
        if (location.code) {
          locationsToInsert.push({
            id: idCounter++,
            code: location.code,
            name: location.name || null,
            type: location.type || extractTypeFromCode(location.code),
            address: location.address || null,
            city: location.city || null,
            state: state,
            zip_code: location.zip || location.zipCode || null,
            country: 'US',
            latitude: location.lat || location.latitude || null,
            longitude: location.lng || location.longitude || null,
            description: location.description || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  }

  // 批量插入数据
  if (locationsToInsert.length > 0) {
    await knex('fba_locations').insert(locationsToInsert);
    console.log(`已导入 ${locationsToInsert.length} 个FBA位置数据`);
  }
  
  // 重置序列
  await knex.raw('SELECT setval(\'fba_locations_id_seq\', (SELECT MAX(id) FROM fba_locations))');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex('fba_locations').del();
};

// 辅助函数：从代码中提取类型
function extractTypeFromCode(code) {
  if (code.startsWith('FC') || code.includes('FC')) return 'FC';
  if (code.startsWith('DC') || code.includes('DC')) return 'DC';
  if (code.startsWith('SC') || code.includes('SC')) return 'SC';
  if (code.startsWith('DS') || code.includes('DS')) return 'DS';
  if (code.startsWith('IXD') || code.includes('IXD')) return 'IXD';
  if (code.startsWith('LGB') || code.includes('LGB')) return 'LGB';
  return 'FC'; // 默认为FC类型
}