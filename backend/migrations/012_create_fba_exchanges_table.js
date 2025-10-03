/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('fba_exchanges', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().comment('用户ID');
    table.integer('fba_location_id').unsigned().nullable().comment('关联的FBA位置ID');
    table.string('fba_code', 20).notNullable().comment('FBA仓库代码');
    table.enum('exchange_type', ['出让预约', '寻求预约']).notNullable().comment('交换类型');
    table.string('pricing_strategy', 50).notNullable().defaultTo('普通').comment('策略：普通、急需');
    table.string('contact_person', 100).notNullable().comment('联系人');
    table.string('contact_phone', 50).notNullable().comment('联系电话');
    table.date('appointment_date').notNullable().comment('预约日期');
    table.time('appointment_time').notNullable().comment('预约时间');
    table.string('time_zone', 10).notNullable().defaultTo('PDT').comment('时区');
    table.enum('cargo_type', ['地板', '卡板']).notNullable().comment('货物类型');
    table.text('description').nullable().comment('详细描述');
    table.boolean('is_urgent').notNullable().defaultTo(false).comment('是否紧急');
    table.integer('view_count').notNullable().defaultTo(0).comment('浏览次数');
    table.timestamp('expires_at').nullable().comment('过期时间');
    table.timestamps(true, true);
    
    // 外键约束
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('fba_location_id').references('fba_locations.id').onDelete('SET NULL');
    
    // 索引
    table.index(['user_id']);
    table.index(['fba_code']);
    table.index(['exchange_type']);
    table.index(['pricing_strategy']);
    table.index(['appointment_date']);
    table.index(['cargo_type']);
    table.index(['expires_at']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('fba_exchanges');
};