/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 先清除现有数据
  await knex('companies').del();

  // 查找测试用户
  const testUser = await knex('users').where('email', 'shipper@test.com').first();
  const userId = testUser ? testUser.id : null;

  console.log(`使用用户ID: ${userId || '无用户关联'}`);

  // 插入种子数据
  await knex('companies').insert([
    // 仓储货代
    {
      user_id: userId,
      name: '东方物流集团',
      description: '专业提供全国整车零担运输服务，拥有自营车队800台',
      category: '仓储货代',
      subcategory: '货代公司',
      phone: '021-12345678',
      email: 'info@eastlogistics.com',
      address: '上海市浦东新区张江高科技园区',
      website: 'www.eastlogistics.com',
      rating: 4.8,
      reviews_count: 125,
      verified: true,
      views: 1250,
      favorites: 89
    },
    {
      user_id: userId,
      name: '环球仓储中心',
      description: '专业仓储服务，提供温控、普通货物存储',
      category: '仓储货代',
      subcategory: '收货仓',
      phone: '0755-88888888',
      email: 'service@globalwarehouse.com',
      address: '深圳市南山区蛇口港物流园区',
      website: 'www.globalwarehouse.com',
      rating: 4.5,
      reviews_count: 89,
      verified: true,
      views: 890,
      favorites: 67
    },
    
    // 报关清关
    {
      user_id: userId,
      name: '美中通关服务',
      description: '专业中美清关服务，快速通关，安全可靠',
      category: '报关清关',
      subcategory: '中美清关行',
      phone: '+1-213-555-0123',
      email: 'info@uscnclearing.com',
      address: '洛杉矶市中心商业区',
      website: 'www.uscnclearing.com',
      rating: 4.6,
      reviews_count: 78,
      verified: true,
      views: 650,
      favorites: 45
    },
    
    // 卡车服务
    {
      user_id: userId,
      name: '金牌卡车维修中心',
      description: '专业卡车维修保养，24小时道路救援',
      category: '卡车服务',
      subcategory: '维修保养',
      phone: '+1-713-555-0456',
      email: 'service@goldtruck.com',
      address: '休斯顿市工业区',
      website: 'www.goldtruck.com',
      rating: 4.4,
      reviews_count: 92,
      verified: true,
      views: 780,
      favorites: 56
    },
    
    // 保险服务
    {
      user_id: userId,
      name: '太平洋保险经纪',
      description: '专业汽车保险服务，理赔快速，服务周到',
      category: '保险服务',
      subcategory: '汽车保险',
      phone: '+1-415-555-0789',
      email: 'info@pacificins.com',
      address: '旧金山市金融区',
      website: 'www.pacificins.com',
      rating: 4.3,
      reviews_count: 134,
      verified: true,
      views: 920,
      favorites: 78
    },
    
    // 金融服务
    {
      user_id: userId,
      name: '华美金融咨询',
      description: '专业税务会计服务，为华人企业提供全方位服务',
      category: '金融服务',
      subcategory: '税务会计',
      phone: '+1-212-555-0321',
      email: 'info@sinoamfinance.com',
      address: '纽约市曼哈顿唐人街',
      website: 'www.sinoamfinance.com',
      rating: 4.5,
      reviews_count: 67,
      verified: true,
      views: 560,
      favorites: 34
    },
    
    // 技术服务
    {
      user_id: userId,
      name: '智联物流科技',
      description: '专业物流管理软件开发，TMS、WMS系统定制',
      category: '技术服务',
      subcategory: '软件商',
      phone: '+1-206-555-0654',
      email: 'info@smartlogis.com',
      address: '西雅图市科技园区',
      website: 'www.smartlogis.com',
      rating: 4.8,
      reviews_count: 45,
      verified: true,
      views: 450,
      favorites: 28
    },
    
    // 律师服务
    {
      user_id: userId,
      name: '华人法律事务所',
      description: '专业华人律师团队，精通中美法律',
      category: '律师服务',
      subcategory: '华人事务所',
      phone: '+1-312-555-0987',
      email: 'info@chineselaw.com',
      address: '芝加哥市法律区',
      website: 'www.chineselaw.com',
      rating: 4.9,
      reviews_count: 89,
      verified: true,
      views: 790,
      favorites: 65
    }
  ]);

  console.log(`成功创建8个企业，关联用户ID: ${userId || '无用户关联'}`);
}; 