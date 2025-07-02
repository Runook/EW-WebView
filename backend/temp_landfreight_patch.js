const UserManagement = require('../models/UserManagement');

// 在文件顶部添加 UserManagement 引用

// 修改 POST /loads 路由
router.post('/loads', auth, async (req, res) => {
  try {
    console.log('创建货源，用户ID:', req.user.id);
    console.log('货源数据:', req.body);

    // 清理和标准化数据格式
    const loadData = { ...req.body };
    
    // 确保pickup_date字段有值
    if (!loadData.pickupDate && !loadData.requiredDate && !loadData.pickup_date) {
      return res.status(400).json({
        success: false,
        message: '必须提供取货日期 (pickupDate/requiredDate)'
      });
    }
    
    // 标准化日期字段名
    if (!loadData.pickupDate && loadData.requiredDate) {
      loadData.pickupDate = loadData.requiredDate;
    }

    // 验证必填字段
    const requiredFields = ['origin', 'destination', 'weight', 'serviceType', 'companyName', 'contactPhone'];
    const missingFields = requiredFields.filter(field => !loadData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 检查用户积分是否足够
    const postCost = await UserManagement.getSystemConfig('post_costs.load');
    const userCredits = await UserManagement.getUserCredits(req.user.id);
    
    if (userCredits.current < postCost) {
      return res.status(400).json({
        success: false,
        message: `积分不足，发布货源需要 ${postCost} 积分，您当前有 ${userCredits.current} 积分`,
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    // 创建货源
    const newLoad = await LandFreight.createLoad(loadData, req.user.id);
    
    // 扣除积分
    try {
      await UserManagement.chargeForPost(req.user.id, 'load', newLoad.id);
    } catch (creditError) {
      console.error('扣费失败，但货源已创建:', creditError);
      // 这里可以考虑回滚货源创建，或者标记为待付费状态
    }
    
    res.status(201).json({
      success: true,
      data: newLoad,
      creditsSpent: postCost,
      message: '货源发布成功'
    });
  } catch (error) {
    console.error('创建货源失败:', error);
    res.status(500).json({
      success: false,
      message: '货源发布失败',
      error: error.message
    });
  }
});

// 修改 POST /trucks 路由
router.post('/trucks', auth, async (req, res) => {
  try {
    console.log('创建车源，用户ID:', req.user.id);
    console.log('车源数据:', req.body);

    // 验证必填字段
    const requiredFields = [ 
      'serviceType', 'currentLocation', 'truckType', 'length', 
      'capacity', 'volume', 'preferredOrigin', 'preferredDestination',
      'contactName', 'contactPhone'
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 手机号码格式验证 (美国格式 10位数)
    if (req.body.contactPhone && !/^\d{10}$/.test(req.body.contactPhone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: '手机号码格式不正确，请输入10位数字'
      });
    }

    // 检查用户积分是否足够
    const postCost = await UserManagement.getSystemConfig('post_costs.truck');
    const userCredits = await UserManagement.getUserCredits(req.user.id);
    
    if (userCredits.current < postCost) {
      return res.status(400).json({
        success: false,
        message: `积分不足，发布车源需要 ${postCost} 积分，您当前有 ${userCredits.current} 积分`,
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    // 创建车源
    const newTruck = await LandFreight.createTruck(req.body, req.user.id);
    
    // 扣除积分
    try {
      await UserManagement.chargeForPost(req.user.id, 'truck', newTruck.id);
    } catch (creditError) {
      console.error('扣费失败，但车源已创建:', creditError);
      // 这里可以考虑回滚车源创建，或者标记为待付费状态
    }
    
    res.status(201).json({
      success: true,
      data: newTruck,
      creditsSpent: postCost,
      message: '车源发布成功'
    });
  } catch (error) {
    console.error('创建车源失败:', error);
    res.status(500).json({
      success: false,
      message: '车源发布失败',
      error: error.message
    });
  }
});
