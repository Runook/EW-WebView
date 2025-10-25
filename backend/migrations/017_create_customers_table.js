/**
 * 创建客户表
 */
exports.up = function(knex) {
  return knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.string('company_name').notNullable().comment('询价公司名称');
    table.string('wechat_group_name').comment('微信群名称');
    table.string('contact_person').comment('联系人');
    table.string('contact_phone').comment('联系电话');
    table.string('contact_email').comment('联系邮箱');
    table.text('notes').comment('备注');
    table.integer('created_by').comment('创建者员工ID');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // 索引
    table.index('company_name');
    table.index('wechat_group_name');
  }).then(() => {
    console.log('✅ 客户表创建成功');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('customers');
};

