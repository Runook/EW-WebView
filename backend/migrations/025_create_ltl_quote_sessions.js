/**
 * Create ltl_quote_sessions table for storing full LTL quote results per user session.
 */
exports.up = function(knex) {
  return knex.schema.createTable('ltl_quote_sessions', (table) => {
    table.increments('id').primary();
    table.string('session_id').notNullable().unique();
    table.string('user_email').notNullable().index();

    // Route info
    table.string('origin_city');
    table.string('origin_state');
    table.string('origin_zip');
    table.string('destination_city');
    table.string('destination_state');
    table.string('destination_zip');
    table.string('origin_location_type');
    table.string('destination_location_type');
    table.integer('distance_miles');

    // Shipment info
    table.date('pickup_date');
    table.date('delivery_date');
    table.jsonb('items');
    table.jsonb('pickup_services');
    table.jsonb('delivery_services');
    table.decimal('total_weight', 12, 2);
    table.integer('total_pallets');

    // Quote results — all carriers
    table.jsonb('quote_results');
    table.integer('quote_count').defaultTo(0);
    table.decimal('lowest_price', 12, 2);

    // Expiration
    table.timestamp('expires_at');
    table.string('status').defaultTo('active'); // active | expired | booked

    // Link to employee_order if one was created
    table.integer('employee_order_id');

    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ltl_quote_sessions');
};
