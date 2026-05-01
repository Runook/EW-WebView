/**
 * 032 — Add driver_reference_price (司机参考价) to employee_orders
 *
 * 在 employee_orders 表中新增"司机参考价"字段，由员工在 AI 解析询价文件后
 * 或手工填写，并显示在报价单 / 已下单 / 已完成 / 已取消 / 需索赔等所有
 * 状态卡的 WE报价 旁边。
 *
 * 与 truck_reference_price (卡车付款侧的承运商参考价) 是两个独立字段：
 *   - truck_reference_price : 给承运商/卡车公司参考的价格 (付款侧)
 *   - driver_reference_price: 给司机端参考的价格 (报价侧)
 */
exports.up = async function(knex) {
  const has = await knex.schema.hasColumn('employee_orders', 'driver_reference_price');
  if (!has) {
    await knex.schema.alterTable('employee_orders', (table) => {
      table.decimal('driver_reference_price', 12, 2).nullable();
    });
  }
};

exports.down = async function(knex) {
  const has = await knex.schema.hasColumn('employee_orders', 'driver_reference_price');
  if (has) {
    await knex.schema.alterTable('employee_orders', (table) => {
      table.dropColumn('driver_reference_price');
    });
  }
};
