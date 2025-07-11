/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('phone', 50);
    table.enum('user_type', ['shipper', 'carrier', 'broker', 'admin']).notNullable().defaultTo('shipper');
    table.string('company_name', 255);
    table.string('company_type', 100);
    table.string('address', 500);
    table.string('city', 100);
    table.string('state', 100);
    table.string('zip_code', 20);
    table.string('business_license', 100);
    table.string('mc_number', 50);
    table.string('dot_number', 50);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.timestamp('last_login_at');
    table.timestamps(true, true);
    // 只为非unique字段建索引
    table.index(['user_type']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};