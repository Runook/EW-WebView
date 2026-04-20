/**
 * Add customer_extra_fee / driver_extra_fee numeric columns to employee_orders,
 * so profit = ew_quote_price + customer_extra_fee - truck_payment - driver_extra_fee.
 *
 * Both default to 0 so existing rows stay arithmetically identical.
 */
exports.up = async function(knex) {
  const hasCustomer = await knex.schema.hasColumn('employee_orders', 'customer_extra_fee');
  const hasDriver = await knex.schema.hasColumn('employee_orders', 'driver_extra_fee');

  await knex.schema.alterTable('employee_orders', (table) => {
    if (!hasCustomer) {
      table.decimal('customer_extra_fee', 12, 2).nullable().defaultTo(0);
    }
    if (!hasDriver) {
      table.decimal('driver_extra_fee', 12, 2).nullable().defaultTo(0);
    }
  });
};

exports.down = async function(knex) {
  const hasCustomer = await knex.schema.hasColumn('employee_orders', 'customer_extra_fee');
  const hasDriver = await knex.schema.hasColumn('employee_orders', 'driver_extra_fee');
  await knex.schema.alterTable('employee_orders', (table) => {
    if (hasCustomer) table.dropColumn('customer_extra_fee');
    if (hasDriver) table.dropColumn('driver_extra_fee');
  });
};
