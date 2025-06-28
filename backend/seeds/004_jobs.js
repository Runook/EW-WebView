/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 清空现有数据
  await knex('jobs').del();
  
  // 查找测试用户
  const testUser = await knex('users').where('email', 'shipper@test.com').first();
  const userId = testUser ? testUser.id : null;
  
  // 插入测试职位数据
  await knex('jobs').insert([
    {
      id: 1,
      user_id: userId,
      title: 'CLASS A 司机',
      category: 'CLASS A 司机',
      company: '顺丰速运',
      location: '洛杉矶',
      salary: '$4000-6000/月',
      work_type: '全职',
      experience: '1-3年',
      description: '负责长途货物运输，要求有CDL-A驾照，工作稳定，福利待遇好。具体要求：1. 持有有效CDL-A驾照；2. 无重大交通违规记录；3. 能够适应长途驾驶；4. 具备基本英语沟通能力。',
      contact_phone: '(323) 888-1001',
      contact_email: 'hr@sf-express.com',
      contact_person: '张经理',
      views: 15,
      is_active: true
    },
    {
      id: 2,
      user_id: userId,
      title: '仓库管理员',
      category: '文员OP',
      company: '亚马逊物流',
      location: '纽约',
      salary: '$3500-5000/月',
      work_type: '全职',
      experience: '经验不限',
      description: '负责仓库日常管理，货物入库出库，熟悉仓储系统优先。工作职责：1. 货物接收、检验、入库；2. 库存管理和盘点；3. 出库作业和配送协调；4. 仓储设备维护。',
      contact_phone: '(212) 888-2002',
      contact_email: 'warehouse@amazon-logistics.com',
      contact_person: '李主管',
      views: 23,
      is_active: true
    },
    {
      id: 3,
      user_id: userId,
      title: '客服专员',
      category: '跟单/客服',
      company: '联邦快递',
      location: '旧金山',
      salary: '$3000-4500/月',
      work_type: '全职',
      experience: '1年以内',
      description: '处理客户咨询，协调物流问题，中英文流利。岗位要求：1. 大学专科以上学历；2. 中英文流利，口语表达清晰；3. 熟悉办公软件操作；4. 具备良好的沟通协调能力。',
      contact_phone: '(415) 888-3003',
      contact_email: 'service@fedex.com',
      contact_person: '王女士',
      views: 31,
      is_active: true
    },
    {
      id: 4,
      user_id: userId,
      title: 'CLASS B 司机',
      category: 'CLASS B 司机',
      company: '优速快递',
      location: '芝加哥',
      salary: '$3000-4500/月',
      work_type: '全职',
      experience: '1-3年',
      description: '负责城市配送，要求有CDL-B驾照，熟悉当地路况。工作要求：1. 持有CDL-B驾照；2. 熟悉芝加哥市区道路；3. 身体健康，无色盲色弱；4. 责任心强，服务意识好。',
      contact_phone: '(312) 888-4004',
      contact_email: 'driver@uc-express.com',
      contact_person: '刘队长',
      views: 18,
      is_active: true
    },
    {
      id: 5,
      user_id: userId,
      title: '应收应付会计',
      category: '应收应付会计',
      company: '中通快运',
      location: '休斯顿',
      salary: '$4500-6000/月',
      work_type: '全职',
      experience: '3-5年',
      description: '负责公司应收应付账款管理，要求有会计证书。职位职责：1. 应收账款的核算和管理；2. 应付账款的审核和支付；3. 财务报表编制；4. 税务申报工作。',
      contact_phone: '(713) 888-5005',
      contact_email: 'finance@zto.com',
      contact_person: '陈会计',
      views: 27,
      is_active: true
    },
    {
      id: 6,
      user_id: userId,
      title: '货运代理',
      category: '货运代理',
      company: '德邦物流',
      location: '凤凰城',
      salary: '$3500-5500/月',
      work_type: '兼职',
      experience: '1-3年',
      description: '负责货运业务开发，客户维护，有相关经验优先。工作内容：1. 开发新客户，维护老客户关系；2. 制定运输方案，跟踪货物状态；3. 处理运输过程中的问题；4. 完成销售目标。',
      contact_phone: '(602) 888-6006',
      contact_email: 'sales@db-logistics.com',
      contact_person: '赵总',
      views: 12,
      is_active: true
    },
    {
      id: 7,
      user_id: userId,
      title: 'CLASS D 司机',
      category: 'CLASS D 司机',
      company: '韵达快递',
      location: '费城',
      salary: '$2500-3500/月',
      work_type: '兼职',
      experience: '经验不限',
      description: '负责小件包裹配送，时间灵活，适合兼职。工作特点：1. 时间灵活，可兼职；2. 负责小区域包裹配送；3. 按件计费，多劳多得；4. 提供配送车辆和设备。',
      contact_phone: '(215) 888-7007',
      contact_email: 'delivery@yunda.com',
      contact_person: '孙站长',
      views: 8,
      is_active: true
    },
    {
      id: 8,
      user_id: userId,
      title: '调度找召卡车',
      category: '调度找召卡车',
      company: '圆通速递',
      location: '圣安东尼奥',
      salary: '$3800-5200/月',
      work_type: '全职',
      experience: '3-5年',
      description: '负责车辆调度，货物配载，要求有丰富调度经验。岗位要求：1. 3年以上物流调度经验；2. 熟悉全美主要运输路线；3. 具备良好的沟通协调能力；4. 熟练使用TMS系统。',
      contact_phone: '(210) 888-8008',
      contact_email: 'dispatch@yt-express.com',
      contact_person: '马调度',
      views: 20,
      is_active: true
    },
    {
      id: 9,
      user_id: userId,
      title: '物流销售',
      category: '物流销售',
      company: '中远海运',
      location: '西雅图',
      salary: '$4000-7000/月',
      work_type: '全职',
      experience: '1-3年',
      description: '负责海运业务开发，客户关系维护。要求：1. 有销售经验，物流行业优先；2. 英语流利，能够与国外客户沟通；3. 熟悉海运操作流程；4. 具备良好的谈判技巧。',
      contact_phone: '(206) 888-9009',
      contact_email: 'sales@cosco.com',
      contact_person: '周经理',
      views: 35,
      is_active: true
    },
    {
      id: 10,
      user_id: userId,
      title: '卡车修理技工',
      category: '卡车修理技工',
      company: '美国卡车修理中心',
      location: '达拉斯',
      salary: '$4500-6500/月',
      work_type: '全职',
      experience: '3-5年',
      description: '负责大型卡车维修保养，要求有相关技术证书。技能要求：1. 熟悉柴油发动机维修；2. 具备电路维修技能；3. 有ASE认证优先；4. 能够使用各种维修工具和设备。',
      contact_phone: '(214) 888-1010',
      contact_email: 'mechanic@truck-repair.com',
      contact_person: '老王师傅',
      views: 16,
      is_active: true
    }
  ]);

  console.log('成功创建10个招聘职位，关联用户ID:', userId || '无用户关联');
}; 