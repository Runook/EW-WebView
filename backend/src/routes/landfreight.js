const express = require('express');
const router = express.Router();
const LandFreight = require('../models/LandFreight');
const UserManagement = require('../models/UserManagement');
const { auth } = require('../middleware/auth');

// 可选认证中间件（用于兼容现有测试）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return auth(req, res, next);
  }
  next();
};

// ===== 货源相关路由 =====

/**
 * GET /api/landfreight/loads
 * 获取货源列表
 * 支持查询参数筛选
 */
router.get('/loads', async (req, res) => {
  try {
    console.log('获取货源列表，查询参数:', req.query);
    
    const filters = {
      origin: req.query.origin,
      destination: req.query.destination,
      serviceType: req.query.serviceType,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const loads = await LandFreight.getAllLoads(filters);
    
    res.json({
      success: true,
      data: loads,
      total: loads.length,
      message: '货源列表获取成功'
    });
  } catch (error) {
    console.error('获取货源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取货源列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/landfreight/loads/:id
 * 获取单个货源详情
 */
router.get('/loads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const load = await LandFreight.getLoadById(parseInt(id));
    
    if (!load) {
      return res.status(404).json({
        success: false,
        message: '货源信息不存在'
      });
    }

    res.json({
      success: true,
      data: load,
      message: '货源详情获取成功'
    });
  } catch (error) {
    console.error('获取货源详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取货源详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/landfreight/loads
 * 创建新货源 (需要认证)
 */
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
        code: 'INSUFFICIENT_CREDITS',
        data: {
          required: postCost,
          current: userCredits.current,
          shortage: postCost - userCredits.current
        }
      });
    }

    // 创建货源
    const newLoad = await LandFreight.createLoad(loadData, req.user.id);
    
    let totalCreditsSpent = postCost;
    let premiumInfo = null;
    
    // 扣除基本发布积分
    try {
      await UserManagement.chargeForPost(req.user.id, 'load', newLoad.id);
    } catch (creditError) {
      console.error('扣费失败，但货源已创建:', creditError);
      // 这里可以考虑回滚货源创建，或者标记为待付费状态
    }
    
    // 处理Premium选项
    if (req.body.premium && req.body.premium.type) {
      try {
        console.log('🌟 处理Premium选项:', req.body.premium);
        
        const premiumType = req.body.premium.type;
        const duration = req.body.premium.duration || 24; // 默认24小时
        
        const premiumResult = await UserManagement.makePremium(
          req.user.id, 
          'load', 
          newLoad.id, 
          premiumType, 
          duration
        );
        
        console.log('✅ Premium功能开通成功:', premiumResult);
        totalCreditsSpent += premiumResult.cost;
        premiumInfo = {
          type: premiumType,
          duration: duration,
          cost: premiumResult.cost,
          endTime: premiumResult.endTime
        };
      } catch (premiumError) {
        console.error('❌ Premium功能开通失败:', premiumError);
        // 不影响主要发布流程，但要在响应中告知用户
      }
    }
    
    res.status(201).json({
      success: true,
      data: newLoad,
      creditsSpent: totalCreditsSpent,
      premium: premiumInfo,
      message: '货源发布成功' + (premiumInfo ? `，${premiumInfo.type === 'top' ? '置顶' : '高亮'}功能已开通` : '')
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

/**
 * PUT /api/landfreight/loads/:id
 * 更新货源信息 (需要认证且为发布者)
 */
router.put('/loads/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('更新货源，ID:', id, '用户ID:', req.user.id);

    const updatedLoad = await LandFreight.updateLoad(parseInt(id), req.body, req.user.id);
    
    if (!updatedLoad) {
      return res.status(404).json({
        success: false,
        message: '货源不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      data: updatedLoad,
      message: '货源更新成功'
    });
  } catch (error) {
    console.error('更新货源失败:', error);
    res.status(500).json({
      success: false,
      message: '货源更新失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/landfreight/loads/:id
 * 删除货源 (需要认证且为发布者)
 */
router.delete('/loads/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('删除货源，ID:', id, '用户ID:', req.user.id);

    const success = await LandFreight.deleteLoad(parseInt(id), req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '货源不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '货源删除成功'
    });
  } catch (error) {
    console.error('删除货源失败:', error);
    res.status(500).json({
      success: false,
      message: '货源删除失败',
      error: error.message
    });
  }
});

// ===== 车源相关路由 =====

/**
 * GET /api/landfreight/trucks
 * 获取车源列表
 * 支持查询参数筛选
 */
router.get('/trucks', async (req, res) => {
  try {
    console.log('获取车源列表，查询参数:', req.query);
    
    const filters = {
      location: req.query.location,
      destination: req.query.destination,
      serviceType: req.query.serviceType,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const trucks = await LandFreight.getAllTrucks(filters);
    
    res.json({
      success: true,
      data: trucks,
      total: trucks.length,
      message: '车源列表获取成功'
    });
  } catch (error) {
    console.error('获取车源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车源列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/landfreight/trucks/:id
 * 获取单个车源详情
 */
router.get('/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const truck = await LandFreight.getTruckById(parseInt(id));
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: '车源信息不存在'
      });
    }

    res.json({
      success: true,
      data: truck,
      message: '车源详情获取成功'
    });
  } catch (error) {
    console.error('获取车源详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车源详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/landfreight/trucks
 * 创建新车源 (需要认证)
 */
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
        code: 'INSUFFICIENT_CREDITS',
        data: {
          required: postCost,
          current: userCredits.current,
          shortage: postCost - userCredits.current
        }
      });
    }

    // 创建车源
    const newTruck = await LandFreight.createTruck(req.body, req.user.id);
    
    let totalCreditsSpent = postCost;
    let premiumInfo = null;
    
    // 扣除基本发布积分
    try {
      await UserManagement.chargeForPost(req.user.id, 'truck', newTruck.id);
    } catch (creditError) {
      console.error('扣费失败，但车源已创建:', creditError);
      // 这里可以考虑回滚车源创建，或者标记为待付费状态
    }
    
    // 处理Premium选项
    if (req.body.premium && req.body.premium.type) {
      try {
        console.log('🌟 处理Premium选项:', req.body.premium);
        
        const premiumType = req.body.premium.type;
        const duration = req.body.premium.duration || 24; // 默认24小时
        
        const premiumResult = await UserManagement.makePremium(
          req.user.id, 
          'truck', 
          newTruck.id, 
          premiumType, 
          duration
        );
        
        console.log('✅ Premium功能开通成功:', premiumResult);
        totalCreditsSpent += premiumResult.cost;
        premiumInfo = {
          type: premiumType,
          duration: duration,
          cost: premiumResult.cost,
          endTime: premiumResult.endTime
        };
      } catch (premiumError) {
        console.error('❌ Premium功能开通失败:', premiumError);
        // 不影响主要发布流程，但要在响应中告知用户
      }
    }
    
    res.status(201).json({
      success: true,
      data: newTruck,
      creditsSpent: totalCreditsSpent,
      premium: premiumInfo,
      message: '车源发布成功' + (premiumInfo ? `，${premiumInfo.type === 'top' ? '置顶' : '高亮'}功能已开通` : '')
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

/**
 * PUT /api/landfreight/trucks/:id
 * 更新车源信息 (需要认证且为发布者)
 */
router.put('/trucks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('更新车源，ID:', id, '用户ID:', req.user.id);

    const updatedTruck = await LandFreight.updateTruck(parseInt(id), req.body, req.user.id);
    
    if (!updatedTruck) {
      return res.status(404).json({
        success: false,
        message: '车源不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      data: updatedTruck,
      message: '车源更新成功'
    });
  } catch (error) {
    console.error('更新车源失败:', error);
    res.status(500).json({
      success: false,
      message: '车源更新失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/landfreight/trucks/:id
 * 删除车源 (需要认证且为发布者)
 */
router.delete('/trucks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('删除车源，ID:', id, '用户ID:', req.user.id);

    const success = await LandFreight.deleteTruck(parseInt(id), req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '车源不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '车源删除成功'
    });
  } catch (error) {
    console.error('删除车源失败:', error);
    res.status(500).json({
      success: false,
      message: '车源删除失败',
      error: error.message
    });
  }
});

// ===== 用户相关路由 =====

/**
 * GET /api/landfreight/my-posts
 * 获取当前用户发布的信息 (需要认证)
 */
router.get('/my-posts', auth, async (req, res) => {
  try {
    console.log('获取用户发布信息，用户ID:', req.user.id);

    const userPosts = await LandFreight.getUserPosts(req.user.id);
    
    res.json({
      success: true,
      data: userPosts,
      message: '用户发布信息获取成功'
    });
  } catch (error) {
    console.error('获取用户发布信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户发布信息失败',
      error: error.message
    });
  }
});

module.exports = router;
