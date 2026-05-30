/**
 * 平台比价升级：移除 TQL Low1/Low2 的概念，改为 Priority1 + Quote# + 三家报价公司及价格。
 * 列均可空，不影响既有行。注意：旧的 tql_price_1 / tql_price_2 列保留不动（仅前端不再展示）。
 */
exports.up = async function (knex) {
  const cols = [
    { name: 'priority_1',            fn: (t) => t.decimal('priority_1', 12, 2).nullable() },
    { name: 'quote_no',              fn: (t) => t.string('quote_no', 100).nullable() },
    { name: 'quote_company_1',       fn: (t) => t.string('quote_company_1', 200).nullable() },
    { name: 'quote_company_1_price', fn: (t) => t.decimal('quote_company_1_price', 12, 2).nullable() },
    { name: 'quote_company_2',       fn: (t) => t.string('quote_company_2', 200).nullable() },
    { name: 'quote_company_2_price', fn: (t) => t.decimal('quote_company_2_price', 12, 2).nullable() },
    { name: 'quote_company_3',       fn: (t) => t.string('quote_company_3', 200).nullable() },
    { name: 'quote_company_3_price', fn: (t) => t.decimal('quote_company_3_price', 12, 2).nullable() },
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
    console.log('ℹ️ employee_orders: platform comparison columns already exist');
  }
};

exports.down = async function (knex) {
  const cols = [
    'priority_1', 'quote_no',
    'quote_company_1', 'quote_company_1_price',
    'quote_company_2', 'quote_company_2_price',
    'quote_company_3', 'quote_company_3_price',
  ];
  await knex.schema.alterTable('employee_orders', (table) => {
    for (const c of cols) table.dropColumn(c);
  });
};
