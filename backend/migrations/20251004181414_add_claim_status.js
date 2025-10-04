/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('employee_orders', table => {
    // 添加索赔相关字段
    table.boolean('needs_claim').defaultTo(false).comment('是否需要索赔');
    table.text('claim_reason').nullable().comment('索赔原因');
    table.timestamp('claim_requested_at').nullable().comment('索赔申请时间');
    table.string('claim_requested_by').nullable().comment('索赔申请人');
    table.timestamp('claim_resolved_at').nullable().comment('索赔解决时间');
    table.string('claim_resolved_by').nullable().comment('索赔解决人');
    table.text('claim_resolution').nullable().comment('索赔解决方案');
    table.enum('claim_status', ['none', 'pending', 'resolved', 'rejected']).defaultTo('none').comment('索赔状态');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('employee_orders', table => {
    table.dropColumn('needs_claim');
    table.dropColumn('claim_reason');
    table.dropColumn('claim_requested_at');
    table.dropColumn('claim_requested_by');
    table.dropColumn('claim_resolved_at');
    table.dropColumn('claim_resolved_by');
    table.dropColumn('claim_resolution');
    table.dropColumn('claim_status');
  });
};