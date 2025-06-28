/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('resumes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // 基本信息
    table.string('name', 100).notNullable();
    table.string('position', 100).notNullable();
    table.string('experience', 50).notNullable();
    table.string('location', 100).notNullable();
    
    // 联系方式
    table.string('phone', 50).notNullable();
    table.string('email', 255).notNullable();
    
    // 技能专长
    table.text('skills').notNullable(); // JSON字符串存储技能数组
    
    // 个人简介
    table.text('summary').nullable();
    
    // 期望薪资
    table.string('expected_salary', 100).nullable();
    
    // 工作类型偏好
    table.string('work_type_preference', 50).nullable(); // 全职/兼职/合同工
    
    // 状态管理
    table.integer('views').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_featured').defaultTo(false);
    
    // 时间戳
    table.timestamps(true, true);
    
    // 索引
    table.index(['position']);
    table.index(['location']);
    table.index(['experience']);
    table.index(['is_active']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('resumes');
}; 