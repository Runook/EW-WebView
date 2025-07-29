/**
 * Migration: 插入系统默认配置
 * 为system_config表插入所有必要的默认配置项
 */

exports.up = function(knex) {
  return knex('system_config').insert([
    // 发布费用配置
    {
      config_key: 'post_costs.load',
      config_value: '10',
      description: '发布货源信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'post_costs.truck',
      config_value: '10',
      description: '发布车源信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'post_costs.company',
      config_value: '20',
      description: '发布企业信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'post_costs.job',
      config_value: '15',
      description: '发布职位信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'post_costs.resume',
      config_value: '5',
      description: '发布简历信息消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    
    // 高级功能费用配置
    {
      config_key: 'premium_costs.top_24h',
      config_value: '50',
      description: '置顶24小时消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'premium_costs.top_72h',
      config_value: '120',
      description: '置顶72小时消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'premium_costs.top_168h',
      config_value: '250',
      description: '置顶7天消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'premium_costs.highlight',
      config_value: '30',
      description: '高亮显示消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      config_key: 'premium_costs.urgent',
      config_value: '20',
      description: '紧急标记消费积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    
    // 用户奖励配置
    {
      config_key: 'user_registration_bonus',
      config_value: '500',
      description: '用户注册奖励积分',
      data_type: 'number',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    
    // 充值比例配置
    {
      config_key: 'recharge_rates',
      config_value: '{"100": 10, "500": 45, "1000": 85, "2000": 160, "5000": 380}',
      description: '充值积分比例 {积分数量: 价格}',
      data_type: 'json',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};

exports.down = function(knex) {
  // 删除插入的默认配置
  const configKeys = [
    'post_costs.load',
    'post_costs.truck', 
    'post_costs.company',
    'post_costs.job',
    'post_costs.resume',
    'premium_costs.top_24h',
    'premium_costs.top_72h',
    'premium_costs.top_168h',
    'premium_costs.highlight',
    'premium_costs.urgent',
    'user_registration_bonus',
    'recharge_rates'
  ];
  
  return knex('system_config')
    .whereIn('config_key', configKeys)
    .del();
}; 