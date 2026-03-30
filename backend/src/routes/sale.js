const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Sale = require('../models/Sale');
const UserManagement = require('../models/UserManagement');
const { auth } = require('../middleware/auth');
const router = express.Router();

// 获取所有销售项（带筛选）
router.get('/', [
  query('category').optional().isString(),
  query('sub_category').optional().isString(),
  query('location').optional().isString(),
  query('condition').optional().isString(),
  query('brand').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数错误',
        errors: errors.array()
      });
    }

    const filters = {
      category: req.query.category,
      sub_category: req.query.sub_category,
      location: req.query.location,
      condition: req.query.condition,
      brand: req.query.brand,
      search: req.query.search
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const sales = await Sale.getAllSales(filters);

    res.json({
      success: true,
      data: sales,
      total: sales.length
    });

  } catch (error) {
    console.error('GET /sales error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await Sale.getCategoryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('GET /sales/stats/categories error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 搜索销售项
router.get('/search', [
  query('q').notEmpty().withMessage('搜索关键词不能为空'),
  query('category').optional().isString(),
  query('sub_category').optional().isString(),
  query('location').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '搜索参数错误',
        errors: errors.array()
      });
    }

    const searchTerm = req.query.q;
    const filters = {
      category: req.query.category,
      sub_category: req.query.sub_category,
      location: req.query.location
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const sales = await Sale.searchSales(searchTerm, filters);

    res.json({
      success: true,
      data: sales,
      total: sales.length,
      searchTerm
    });

  } catch (error) {
    console.error('GET /sales/search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

// 获取用户发布的销售项
router.get('/my/posts', auth, async (req, res) => {
  try {
    const sales = await Sale.getUserSales(req.user.userId);
    
    res.json({
      success: true,
      data: sales,
      total: sales.length
    });
  } catch (error) {
    console.error('GET /sales/my/posts error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的销售项失败'
    });
  }
});

// 获取单个销售项详情
router.get('/:id', async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    
    if (isNaN(saleId)) {
      return res.status(400).json({
        success: false,
        message: '无效的销售项ID'
      });
    }

    const sale = await Sale.getSaleById(saleId);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: '销售项不存在'
      });
    }

    // 增加浏览量
    await Sale.incrementViews(saleId);

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error('GET /sales/:id error:', error);
    res.status(500).json({
      success: false,
      message: '获取销售项详情失败'
    });
  }
});

// 创建新销售项（需要认证）
router.post('/', auth, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('category').optional().isString(),
  body('location').notEmpty().withMessage('地点不能为空'),
  body('price').notEmpty().withMessage('价格不能为空'),
  body('condition').notEmpty().withMessage('设备状态不能为空'),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('sub_category').optional().isString(),
  body('brand').optional().isString(),
  body('images').optional(),
  body('contactPhone').optional(),
  body('contactPerson').optional().isString(),
  body('company').optional().isString(),
  body('specifications').optional().isString(),
  body('contactPhoneCN').optional().isString()
], async (req, res) => {
  try {
    console.log('📥 接收到销售项发布请求:', {
      body: req.body,
      userId: req.user?.userId
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ 销售验证失败:', errors.array());
      return res.status(400).json({
        success: false,
        message: '输入信息有误',
        errors: errors.array()
      });
    }

    // 检查积分余额
    const postCost = await UserManagement.getSystemConfig('post_costs.sale');
    const userCredits = await UserManagement.getUserCredits(req.user.userId);
    
    if (userCredits.current < postCost) {
      return res.status(400).json({
        success: false,
        message: '积分余额不足',
        data: {
          requiredCredits: postCost,
          currentCredits: userCredits.current,
          shortfall: postCost - userCredits.current
        }
      });
    }

    const saleData = {
      userId: req.user.userId,
      title: req.body.title,
      category: req.body.category || null,
      sub_category: req.body.sub_category || null,
      brand: req.body.brand || null,
      location: req.body.location,
      price: req.body.price,
      condition: req.body.condition,
      description: req.body.description,
      images: req.body.images ? (Array.isArray(req.body.images) ? req.body.images.join('|||') : req.body.images) : null,
      contactPhone: req.body.contactPhone || null,
      contactPhoneCN: req.body.contactPhoneCN || null,
      contactPerson: req.body.contactPerson || null,
      company: req.body.company || null,
      specifications: req.body.specifications || null,
      contactEmail: req.user.email // 使用用户注册邮箱
    };

    const sale = await Sale.createSale(saleData);
    
    let totalCreditsSpent = postCost;
    let premiumInfo = null;
    
    // 扣除基本发布积分
    await UserManagement.chargeForPost(req.user.userId, 'sale', sale.id);

    // 处理Premium选项
    if (req.body.premium && req.body.premium.type) {
      try {
        console.log('🌟 处理Premium选项:', req.body.premium);
        
        const premiumType = req.body.premium.type;
        const duration = req.body.premium.duration || 24; // 默认24小时
        
        const premiumResult = await UserManagement.makePremium(
          req.user.userId, 
          'sale', 
          sale.id, 
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
      message: '销售项发布成功' + (premiumInfo ? `，${premiumInfo.type === 'top' ? '置顶' : '高亮'}功能已开通` : ''),
      data: sale,
      creditsSpent: totalCreditsSpent,
      premium: premiumInfo
    });

  } catch (error) {
    console.error('POST /sales error:', error);
    res.status(500).json({
      success: false,
      message: '发布销售项失败'
    });
  }
});

// 更新销售项（需要认证，只能更新自己的）
router.put('/:id', auth, [
  body('title').optional().notEmpty(),
  body('category').optional().notEmpty(),
  body('sub_category').optional().notEmpty(),
  body('brand').optional().notEmpty(),
  body('location').optional().notEmpty(),
  body('price').optional().notEmpty(),
  body('condition').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('images').optional().notEmpty(),
  body('contactPhone').optional(),
  body('contactPerson').optional().isString(),
  body('company').optional().isString(),
  body('specifications').optional().isString()
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入信息有误',
        errors: errors.array()
      });
    }

    const saleId = parseInt(req.params.id);
    
    if (isNaN(saleId)) {
      return res.status(400).json({
        success: false,
        message: '无效的销售项ID'
      });
    }

    const saleData = {
      title: req.body.title,
      category: req.body.category,
      sub_category: req.body.sub_category,
      brand: req.body.brand,
      location: req.body.location,
      price: req.body.price,
      condition: req.body.condition,
      description: req.body.description,
      images: req.body.images ? (Array.isArray(req.body.images) ? req.body.images.join(',') : req.body.images) : undefined,
      contactPhone: req.body.contactPhone,
      contactPerson: req.body.contactPerson,
      company: req.body.company,
      specifications: req.body.specifications
    };

    // 移除undefined值
    Object.keys(saleData).forEach(key => {
      if (saleData[key] === undefined) delete saleData[key];
    });

    const updatedSale = await Sale.updateSale(saleId, saleData, req.user.userId);

    if (!updatedSale) {
      return res.status(404).json({
        success: false,
        message: '销售项不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      message: '销售项更新成功',
      data: updatedSale
    });

  } catch (error) {
    console.error('PUT /sales/:id error:', error);
    res.status(500).json({
      success: false,
      message: '更新销售项失败'
    });
  }
});

// 删除销售项（需要认证，只能删除自己的）
router.delete('/:id', auth, async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    
    if (isNaN(saleId)) {
      return res.status(400).json({
        success: false,
        message: '无效的销售项ID'
      });
    }

    const deleted = await Sale.deleteSale(saleId, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '销售项不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '销售项删除成功'
    });

  } catch (error) {
    console.error('DELETE /sales/:id error:', error);
    res.status(500).json({
      success: false,
      message: '删除销售项失败'
    });
  }
});

module.exports = router;