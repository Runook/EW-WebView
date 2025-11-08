/**
 * Migration: 添加租赁和出售的发布费用配置
 */

exports.up = async function(knex) {
  // 检查配置是否已存在
  const rentalExists = await knex('system_config')
    .where('config_key', 'post_costs.rental')
    .first();
  
  const saleExists = await knex('system_config')
    .where('config_key', 'post_costs.sale')
    .first();

  const inserts = [];
  
  if (!rentalExists) {
    inserts.push({
      config_key: 'post_costs.rental',
      config_value: '10',
      description: '发布物流租赁信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  } else {
    console.log('ℹ️ post_costs.rental 配置已存在，跳过');
  }
  
  if (!saleExists) {
    inserts.push({
      config_key: 'post_costs.sale',
      config_value: '10',
      description: '发布物流出售信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  } else {
    console.log('ℹ️ post_costs.sale 配置已存在，跳过');
  }

  if (inserts.length > 0) {
    return knex('system_config').insert(inserts);
  }
};

exports.down = function(knex) {
  return knex('system_config')
    .whereIn('config_key', ['post_costs.rental', 'post_costs.sale'])
    .del();
};

