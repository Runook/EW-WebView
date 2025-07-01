const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 清空现有数据
  await knex('users').del();
  
  // 创建测试用户
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const testPassword = await bcrypt.hash('test123', saltRounds);
  
  await knex('users').insert([
    {
      id: 1,
      email: 'shipper@test.com',
      password: testPassword,
      first_name: 'Test',
      last_name: 'Shipper',
      phone: '13800138001',
      company_name: '测试货主公司',
      company_type: 'logistics',
      user_type: 'shipper',
      address: '广东省深圳市福田区测试地址1号',
      city: '深圳',
      state: '广东',
      zip_code: '518000',
      business_license: 'BL123456789',
      is_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      email: 'carrier@test.com',
      password: testPassword,
      first_name: 'Test',
      last_name: 'Carrier',
      phone: '13800138002',
      company_name: '测试承运商公司',
      company_type: 'trucking',
      user_type: 'carrier',
      address: '浙江省杭州市滨江区测试地址2号',
      city: '杭州',
      state: '浙江',
      zip_code: '310000',
      business_license: 'BL987654321',
      mc_number: 'MC123456',
      dot_number: 'DOT123456',
      is_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      email: 'demo@example.com',
      password: hashedPassword,
      first_name: 'Demo',
      last_name: 'User',
      phone: '13800138003',
      company_name: '示例物流公司',
      company_type: 'logistics',
      user_type: 'shipper',
      address: '北京市朝阳区示例地址3号',
      city: '北京',
      state: '北京',
      zip_code: '100000',
      business_license: 'BL111222333',
      is_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}; 