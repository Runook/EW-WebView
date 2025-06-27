/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // 基本企业信息
    table.string('name', 500).notNullable(); // 企业名称
    table.text('description').notNullable(); // 企业简介
    table.string('category', 100).notNullable(); // 主分类
    table.string('subcategory', 100).notNullable(); // 子分类
    
    // 联系信息
    table.string('phone', 50).notNullable(); // 联系电话
    table.string('email', 255).notNullable(); // 邮箱地址
    table.string('address', 500).notNullable(); // 企业地址
    table.string('website', 255); // 企业网站
    
    // 评价和验证
    table.decimal('rating', 3, 2).defaultTo(0); // 评分 (0-5)
    table.integer('reviews_count').defaultTo(0); // 评价数量
    table.boolean('verified').defaultTo(false); // 是否已验证
    
    // 统计信息
    table.integer('views').defaultTo(0); // 查看次数
    table.integer('favorites').defaultTo(0); // 收藏次数
    
    // 其他信息
    table.text('notes'); // 备注
    table.json('services'); // 提供的服务列表 (JSON)
    table.json('business_hours'); // 营业时间 (JSON)
    
    // 状态管理
    table.boolean('is_active').defaultTo(true); // 是否激活
    table.boolean('is_featured').defaultTo(false); // 是否推荐
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['category']);
    table.index(['subcategory']);
    table.index(['is_active']);
    table.index(['verified']);
    table.index(['rating']);
    table.index(['name']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('companies');
};
