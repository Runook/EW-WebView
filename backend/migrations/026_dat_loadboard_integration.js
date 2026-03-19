/**
 * DAT Load Board integration:
 *  - dat_posts: tracks posts synced to the DAT load board
 *  - users.dat_email: per-user DAT One email for seat-based licensing
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('dat_posts', function(table) {
      table.increments('id').primary();
      table.string('dat_post_id').notNullable().unique();
      table.enum('post_type', ['load', 'truck']).notNullable();
      table.integer('local_post_id').unsigned();
      table.integer('employee_order_id').unsigned()
        .references('id').inTable('employee_orders').onDelete('SET NULL');
      table.integer('employee_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.string('dat_equipment_type', 10);
      table.jsonb('dat_payload');
      table.enum('status', ['active', 'refreshed', 'deleted', 'matched'])
        .notNullable().defaultTo('active');
      table.timestamp('last_refreshed_at');
      table.timestamps(true, true);

      table.index(['dat_post_id']);
      table.index(['post_type']);
      table.index(['employee_order_id']);
      table.index(['employee_id']);
      table.index(['status']);
    }),

    knex.schema.alterTable('users', function(table) {
      table.string('dat_email', 255);
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('dat_posts'),
    knex.schema.alterTable('users', function(table) {
      table.dropColumn('dat_email');
    })
  ]);
};
