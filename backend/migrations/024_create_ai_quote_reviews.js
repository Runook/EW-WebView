/**
 * Create the ai_quote_reviews table for AI Agent quote review workflow.
 */
exports.up = function(knex) {
  return knex.schema.createTable('ai_quote_reviews', (table) => {
    table.uuid('id').primary();
    table.string('source_filename');
    table.text('parsed_data');
    table.text('order_ids');
    table.string('wecom_chat_id');
    table.string('status').defaultTo('pending_review');
    table.text('review_notes');
    table.integer('created_by').references('id').inTable('users');
    table.integer('reviewed_by').references('id').inTable('users');
    table.timestamp('reviewed_at');
    table.timestamp('distributed_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ai_quote_reviews');
};
