/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    
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
    
    // 验证和状态
    table.boolean('verified').notNullable().defaultTo(false); // 是否已验证
    table.boolean('is_active').notNullable().defaultTo(true); // 是否激活
    table.boolean('is_featured').notNullable().defaultTo(false); // 是否推荐
    
    // 统计信息
    table.integer('views').notNullable().defaultTo(0); // 查看次数
    
    // 其他信息
    table.text('notes'); // 备注
    table.json('services'); // 提供的服务列表 (JSON)
    table.json('business_hours'); // 营业时间 (JSON)
    
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['category']);
    table.index(['subcategory']);
    table.index(['is_active']);
    table.index(['verified']);
    table.index(['is_featured']);
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