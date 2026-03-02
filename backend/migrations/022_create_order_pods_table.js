/**
 * Migration: 创建订单 POD (Proof of Delivery) 文件存储表
 */
exports.up = function(knex) {
  return knex.schema.createTable('order_pods', function(table) {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('employee_orders').onDelete('CASCADE');
    table.string('original_filename', 500).notNullable();
    table.string('stored_filename', 500).notNullable();
    table.string('file_path', 1000).notNullable();
    table.string('mime_type', 100);
    table.bigInteger('file_size').defaultTo(0);
    table.integer('uploaded_by').unsigned()
      .references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // 索引
    table.index('order_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('order_pods');
};
