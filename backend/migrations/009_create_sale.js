/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('sales', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().nullable();
      table.string('title', 255).notNullable();
      table.string('category', 100).notNullable();
      table.string('brand', 255).notNullable();
      table.string('sub_category', 100).notNullable(); 
      table.string('location', 100).notNullable();
      table.string('price', 100).notNullable();
      table.string('condition', 50).notNullable(); 
      table.text('description').notNullable();
      table.text('specifications').nullable();
      table.text('images').notNullable();
      table.string('contact_phone', 50).nullable();
      table.string('contact_email', 255).nullable();
      table.string('company', 255).nullable();
      table.string('contact_person', 100).nullable();
      table.integer('views').notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.boolean('is_featured').notNullable().defaultTo(false);
      table.timestamps(true, true);
      
      // 索引
      table.index(['sub_category']);
      table.index(['company']);
      table.index(['category']);
      table.index(['location']);
      table.index(['condition']);
      table.index(['is_active']);
      table.index(['created_at']);
      
      // 外键约束（如果users表存在）
      table.foreign('user_id').references('users.id').onDelete('SET NULL');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('sales');
  };