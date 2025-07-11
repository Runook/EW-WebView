/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // 创建货源表 (loads)
    knex.schema.createTable('land_loads', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('origin', 500).notNullable();
      table.string('destination', 500).notNullable();
      table.string('origin_display', 500);
      table.string('destination_display', 500);
      table.json('distance_info');
      table.date('pickup_date').notNullable();
      table.date('delivery_date');
      table.string('weight', 100).notNullable();
      table.string('commodity', 255);
      table.string('cargo_value', 100);
      table.integer('pallets');
      table.string('freight_class', 50);
      table.enum('service_type', ['FTL', 'LTL']).notNullable();
      table.string('truck_type', 255);
      table.string('equipment', 255);
      table.string('rate', 100);
      table.string('max_rate', 100);
      table.string('company_name', 255);
      table.string('contact_phone', 50);
      table.string('contact_email', 255);
      table.string('ewid', 100).unique();
      table.string('shipping_number', 255);
      table.text('notes');
      table.text('special_requirements');
      table.decimal('rating', 3, 2).notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);
      table.index(['user_id']);
      table.index(['pickup_date']);
      table.index(['service_type']);
      table.index(['is_active']);
      table.index(['ewid']);
      table.index(['origin']);
      table.index(['destination']);
    }),

    // 创建车源表 (trucks)
    knex.schema.createTable('land_trucks', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('current_location', 500).notNullable();
      table.string('preferred_destination', 500);
      table.string('preferred_origin', 500);
      table.date('available_date').notNullable();
      table.string('truck_type', 255).notNullable();
      table.string('equipment', 255);
      table.string('capacity', 100).notNullable();
      table.string('length', 100);
      table.string('volume', 100);
      table.string('truck_features', 500);
      table.string('driver_license', 100);
      table.enum('service_type', ['FTL', 'LTL']).notNullable();
      table.string('rate_range', 100);
      table.string('rate', 100);
      table.string('company_name', 255);
      table.string('contact_name', 100);
      table.string('contact_phone', 50);
      table.string('contact_email', 255);
      table.string('ewid', 100).unique();
      table.text('notes');
      table.decimal('rating', 3, 2).notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);
      table.index(['user_id']);
      table.index(['available_date']);
      table.index(['service_type']);
      table.index(['is_active']);
      table.index(['ewid']);
      table.index(['current_location']);
      table.index(['preferred_destination']);
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('land_trucks'),
    knex.schema.dropTableIfExists('land_loads')
  ]);
};