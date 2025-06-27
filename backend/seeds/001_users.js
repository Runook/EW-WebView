const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 清空现有数据
  await knex('users').del();
  
  // 创建测试用户
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const testPassword = await bcrypt.hash('test123', saltRounds);
  
  await knex('users').insert([
    {
      id: 1,
      username: 'test_shipper',
      email: 'shipper@example.com',
      password_hash: hashedPassword,
      company_name: '顺丰物流',
      contact_phone: '13800138001',
      contact_address: '广东省深圳市福田区',
      user_type: 'shipper',
      is_verified: true,
      is_active: true
    },
    {
      id: 2,
      username: 'test_carrier',
      email: 'carrier@example.com',
      password_hash: hashedPassword,
      company_name: '中通快递',
      contact_phone: '13800138002',
      contact_address: '浙江省杭州市滨江区',
      user_type: 'carrier',
      is_verified: true,
      is_active: true
    },
    {
      id: 3,
      username: 'demo_user',
      email: 'demo@example.com',
      password_hash: hashedPassword,
      company_name: '示例物流公司',
      contact_phone: '13800138003',
      contact_address: '北京市朝阳区',
      user_type: 'shipper',
      is_verified: true,
      is_active: true
    },
    {
      id: 4,
      username: 'test_shipper_main',
      email: 'shipper@test.com',
      password_hash: testPassword,
      company_name: '测试物流公司',
      contact_phone: '13800138004',
      contact_address: '上海市浦东新区',
      user_type: 'shipper',
      is_verified: true,
      is_active: true
    }
  ]);
}; 