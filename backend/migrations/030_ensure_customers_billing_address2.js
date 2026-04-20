/**
 * 023_add_billing_address2.js 在 knex_migrations 里标记为"已运行"，
 * 但生产 RDS 里实际没有这一列（可能是那次迁移失败但 migrations 表仍被写入，
 * 或 `.after('billing_address')` 在某些 PG 版本下抛过瞬时错）。
 *
 * 这里用 hasColumn 做幂等检测：缺则补，已有则跳过。
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('customers', 'billing_address2');
  if (!hasColumn) {
    await knex.schema.alterTable('customers', (table) => {
      table.string('billing_address2', 500).nullable();
    });
    console.log('030: Added customers.billing_address2 (was missing despite 023 marker)');
  } else {
    console.log('030: customers.billing_address2 already exists, nothing to do');
  }
};

exports.down = async function(/* knex */) {
  // 不回退：这列被应用代码需要
};
