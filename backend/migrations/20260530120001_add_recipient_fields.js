/**
 * 收货人信息列：AI 解析询价文件时，把收货人(人名)/电话/邮箱单独存储，
 * 展示在订单详情的"详细地址"区，与 Company(询价公司) 区分开。
 */
exports.up = async function (knex) {
  const cols = [
    { name: 'recipient_name',  fn: (t) => t.string('recipient_name', 200).nullable() },
    { name: 'recipient_phone', fn: (t) => t.string('recipient_phone', 50).nullable() },
    { name: 'recipient_email', fn: (t) => t.string('recipient_email', 200).nullable() },
  ];
  const missing = [];
  for (const col of cols) {
    const exists = await knex.schema.hasColumn('employee_orders', col.name);
    if (!exists) missing.push(col);
  }
  if (missing.length > 0) {
    await knex.schema.alterTable('employee_orders', (table) => {
      for (const col of missing) col.fn(table);
    });
    console.log(`✅ employee_orders: added ${missing.map((c) => c.name).join(', ')}`);
  } else {
    console.log('ℹ️ employee_orders: recipient columns already exist');
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('employee_orders', (table) => {
    table.dropColumn('recipient_name');
    table.dropColumn('recipient_phone');
    table.dropColumn('recipient_email');
  });
};
