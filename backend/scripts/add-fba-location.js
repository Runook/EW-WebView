const knex = require('knex');

// 使用本地数据库配置
const config = {
  client: 'pg',
  connection: {
    database: 'ew_logistics',
    user: process.env.USER || 'ew-josh',
    host: 'localhost',
    port: 5432
  }
};

const db = knex(config);

async function addFBALocation() {
  console.log('📍 添加新的 FBA 位置: XPB2 - Apopka, FL\n');

  try {
    // 检查是否已存在
    const existing = await db('fba_locations')
      .where('code', 'XPB2')
      .first();

    if (existing) {
      console.log('⚠️  位置 XPB2 已经存在，正在更新...');
      
      await db('fba_locations')
        .where('code', 'XPB2')
        .update({
          name: 'XPB2 - Apopka',
          type: 'FC',
          address: '4661 Apopka Logistics Pkwy',
          city: 'Apopka',
          state: 'FL',
          zip_code: '32712',
          country: 'US',
          latitude: null,
          longitude: null,
          description: null,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      
      console.log('✅ 位置 XPB2 已更新！');
    } else {
      console.log('➕ 正在添加新位置...');
      
      await db('fba_locations').insert({
        code: 'XPB2',
        name: 'XPB2 - Apopka',
        type: 'FC',
        address: '4661 Apopka Logistics Pkwy',
        city: 'Apopka',
        state: 'FL',
        zip_code: '32712',
        country: 'US',
        latitude: null,
        longitude: null,
        description: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ 位置 XPB2 已成功添加！');
    }

    // 验证添加结果
    const result = await db('fba_locations')
      .where('code', 'XPB2')
      .first();

    console.log('\n📊 位置信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`代码: ${result.code}`);
    console.log(`名称: ${result.name}`);
    console.log(`地址: ${result.address}`);
    console.log(`城市: ${result.city}, ${result.state} ${result.zip_code}`);
    console.log(`类型: ${result.type}`);
    console.log(`状态: ${result.is_active ? '激活' : '未激活'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 操作完成！');
  } catch (error) {
    console.error('❌ 添加 FBA 位置失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// 运行脚本
addFBALocation();

