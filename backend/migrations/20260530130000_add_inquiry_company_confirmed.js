/**
 * inquiry_company_confirmed：标记 Company(询价客户) 是否已由员工确认。
 * AI 解析自动填入的 Company 为未确认(false，前端灰色显示)，员工点击/编辑后转为已确认(true，黑色)。
 * 默认 true，保证既有/手动订单显示为正常黑色。
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasColumn('employee_orders', 'inquiry_company_confirmed');
  if (!exists) {
    await knex.schema.alterTable('employee_orders', (table) => {
      table.boolean('inquiry_company_confirmed').defaultTo(true);
    });
    console.log('✅ employee_orders: added inquiry_company_confirmed');
  } else {
    console.log('ℹ️ employee_orders: inquiry_company_confirmed already exists');
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('employee_orders', (table) => {
    table.dropColumn('inquiry_company_confirmed');
  });
};
