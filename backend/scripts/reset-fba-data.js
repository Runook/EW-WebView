const knex = require('knex');
const path = require('path');

// 使用本地数据库配置
const config = {
  client: 'pg',
  connection: {
    database: 'ew_logistics',
    user: process.env.USER || 'ew-josh', // 使用当前系统用户
    host: 'localhost',
    port: 5432
  }
};

const db = knex(config);

async function resetFBAData() {
  console.log('🗑️  Starting FBA data reset...\n');

  try {
    // 1. 创建FBA表结构（如果不存在）
    console.log('1. Creating FBA tables structure...');
    
    // 创建fba_locations表
    const fbaLocationsExists = await db.schema.hasTable('fba_locations');
    if (!fbaLocationsExists) {
      await db.schema.createTable('fba_locations', function(table) {
        table.increments('id').primary();
        table.string('code', 20).notNullable().unique().comment('FBA仓库代码');
        table.string('name', 255).comment('仓库名称');
        table.string('type', 50).comment('仓库类型，如FC, DC, SC等');
        table.string('address', 500).comment('详细地址');
        table.string('city', 100).comment('城市');
        table.string('state', 50).comment('州');
        table.string('zip_code', 20).comment('邮政编码');
        table.string('country', 50).notNullable().defaultTo('US').comment('国家');
        table.decimal('latitude', 10, 8).comment('纬度');
        table.decimal('longitude', 11, 8).comment('经度');
        table.text('description').comment('仓库描述');
        table.boolean('is_active').notNullable().defaultTo(true).comment('是否激活');
        table.timestamps(true, true);
        
        // 索引
        table.index(['code']);
        table.index(['state']);
        table.index(['city']);
        table.index(['type']);
        table.index(['is_active']);
      });
      console.log('   Created fba_locations table');
    }

    // 创建fba_comments表
    const fbaCommentsExists = await db.schema.hasTable('fba_comments');
    if (!fbaCommentsExists) {
      await db.schema.createTable('fba_comments', function(table) {
        table.increments('id').primary();
        table.integer('fba_location_id').unsigned().notNullable().comment('关联的FBA位置ID');
        table.integer('user_id').unsigned().notNullable().comment('评论用户ID');
        table.integer('parent_id').unsigned().nullable().comment('父评论ID，用于回复');
        table.text('content').notNullable().comment('评论内容');
        table.json('media_files').nullable().comment('媒体文件信息，包括图片和视频');
        table.boolean('is_deleted').notNullable().defaultTo(false).comment('是否已删除');
        table.timestamp('deleted_at').nullable().comment('删除时间');
        table.timestamps(true, true);
        
        // 外键约束
        table.foreign('fba_location_id').references('fba_locations.id').onDelete('CASCADE');
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.foreign('parent_id').references('fba_comments.id').onDelete('CASCADE');
        
        // 索引
        table.index(['fba_location_id']);
        table.index(['user_id']);
        table.index(['parent_id']);
        table.index(['created_at']);
        table.index(['is_deleted']);
      });
      console.log('   Created fba_comments table');
    }
    
    // 2. 清空现有的FBA locations数据
    console.log('2. Clearing existing FBA locations data...');
    
    // 先删除相关的评论数据（外键约束）
    if (fbaCommentsExists) {
      const commentsDeleted = await db('fba_comments').del();
      console.log(`   Deleted ${commentsDeleted} FBA comments`);
    }
    
    // 删除FBA locations数据
    if (fbaLocationsExists) {
      const locationsDeleted = await db('fba_locations').del();
      console.log(`   Deleted ${locationsDeleted} FBA locations`);
    }
    
    console.log('✅ FBA data reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during FBA data reset:', error.message);
    throw error;
  }
}

async function reimportFBAData() {
  console.log('🔄 Starting FBA data reimport...\n');

  try {
    // 读取JSON数据文件
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
              type: location.type || 'FC',
              address: location.address || null,
              city: location.city || null,
              state: state,
              zip_code: location.zip || null,
              country: location.country || 'US',
              latitude: location.latitude || null,
              longitude: location.longitude || null,
              description: location.description || null,
              is_active: location.is_active !== false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }
    }

    // 去重处理 - 基于code字段
    const uniqueLocations = [];
    const seenCodes = new Set();
    let duplicates = 0;
    
    for (const location of locationsToInsert) {
      if (!seenCodes.has(location.code)) {
        seenCodes.add(location.code);
        uniqueLocations.push(location);
      } else {
        duplicates++;
        console.log(`   Skipping duplicate code: ${location.code} (${location.city}, ${location.state})`);
      }
    }
    
    console.log(`Prepared ${uniqueLocations.length} unique locations for import (skipped ${duplicates} duplicates)`);

    // 批量插入数据，使用ON CONFLICT处理可能的重复
    if (uniqueLocations.length > 0) {
      // 分批插入，避免一次性插入太多数据
      const batchSize = 50; // 减小批次大小
      let inserted = 0;
      
      for (let i = 0; i < uniqueLocations.length; i += batchSize) {
        const batch = uniqueLocations.slice(i, i + batchSize);
        
        // 使用upsert处理可能的重复
        for (const location of batch) {
          try {
            await db('fba_locations')
              .insert(location)
              .onConflict('code')
              .merge({
                name: location.name,
                address: location.address,
                city: location.city,
                state: location.state,
                zip_code: location.zip_code,
                type: location.type,
                updated_at: new Date().toISOString()
              });
            inserted++;
          } catch (error) {
            console.log(`   Error inserting ${location.code}: ${error.message}`);
          }
        }
        
        console.log(`   Processed batch ${Math.floor(i/batchSize) + 1}: ${inserted}/${uniqueLocations.length} locations`);
      }
      
      console.log(`✅ Successfully imported/updated ${inserted} FBA locations`);
    }
    
    // 重置序列到正确的值
    await db.raw('SELECT setval(\'fba_locations_id_seq\', (SELECT MAX(id) FROM fba_locations))');
    console.log('   Auto-increment sequence updated');

    console.log('\n✅ FBA data reimport completed successfully!');

  } catch (error) {
    console.error('❌ Error during FBA data reimport:', error.message);
    throw error;
  }
}

// 完整的重置和重新导入流程
async function fullReset() {
  try {
    console.log('🚀 Starting full FBA data reset and reimport...\n');
    
    await resetFBAData();
    console.log('\n' + '='.repeat(50));
    await reimportFBAData();
    
    console.log('\n🎉 Full FBA data reset and reimport completed successfully!');
    
  } catch (error) {
    console.error('❌ Full reset failed:', error.message);
    throw error;
  } finally {
    // 关闭数据库连接
    await db.destroy();
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'reset':
        await resetFBAData();
        break;
      case 'import':
        await reimportFBAData();
        break;
      case 'full':
      default:
        await fullReset();
        return; // fullReset已经处理了数据库连接关闭
    }
  } finally {
    // 对于单独的reset或import命令，关闭数据库连接
    if (command === 'reset' || command === 'import') {
      await db.destroy();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  resetFBAData,
  reimportFBAData,
  fullReset
};