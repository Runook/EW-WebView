const express = require('express');
const router = express.Router();
const UserManagement = require('../models/UserManagement');
const { auth } = require('../middleware');
const { requirePermission } = require('../middleware/auth');

/**
 * GET /api/user-management/profile
 * 获取当前用户的完整信息 (需要认证)
 */
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user已经包含了数据库中的完整信息（由auth中间件设置）
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

/**
 * GET /api/user-management/credits
 * 获取用户积分信息 (需要认证)
 */
router.get('/credits', auth, async (req, res) => {
  try {
    const credits = await UserManagement.getUserCredits(req.user.id);
    
    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    console.error('获取积分信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分信息失败',
      error: error.message
    });
  }
});

/**
 * GET /api/user-management/credits/history
 * 获取积分变动历史 (需要认证)
 */
router.get('/credits/history', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const history = await UserManagement.getCreditHistory(
      req.user.id, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取积分历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分历史失败',
      error: error.message
    });
  }
});

/**
 * GET /api/user-management/posts
 * 获取用户所有发布内容 (需要认证)
 */
router.get('/posts', auth, async (req, res) => {
  try {
    const posts = await UserManagement.getUserPosts(req.user.id);
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('获取用户发布内容失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户发布内容失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/user-management/posts/:type/:id/status
 * 更新发布内容状态 (需要认证)
 */
router.put('/posts/:type/:id/status', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;
    
    const validTypes = ['load', 'truck', 'company', 'job', 'resume', 'rental', 'sale'];
    const validStatuses = ['active', 'inactive', 'completed', 'cancelled', 'filled', 'hired', 'pending'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的内容类型'
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态'
      });
    }
    
    const result = await UserManagement.updatePostStatus(
      req.user.id, 
      type, 
      parseInt(id), 
      status
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '内容不存在或无权限修改'
      });
    }
    
    res.json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新内容状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/user-management/posts/:type/:id
 * 删除发布内容 (需要认证)
 */
router.delete('/posts/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    const validTypes = ['load', 'truck', 'company', 'job', 'resume', 'rental', 'sale'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的内容类型'
      });
    }
    
    const result = await UserManagement.deleteUserPost(
      req.user.id, 
      type, 
      parseInt(id)
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '内容不存在或无权限删除'
      });
    }
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除内容失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
});

/**
 * POST /api/user-management/posts/:type/:id/premium
 * 为内容添加置顶等高级功能 (需要认证)
 */
router.post('/posts/:type/:id/premium', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { premiumType, duration = 24 } = req.body;
    
    const validTypes = ['load', 'truck', 'company', 'job', 'resume', 'rental', 'sale'];
    const validPremiumTypes = ['top', 'highlight'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的内容类型'
      });
    }
    
    if (!validPremiumTypes.includes(premiumType)) {
      return res.status(400).json({
        success: false,
        message: '无效的高级功能类型'
      });
    }
    
    const result = await UserManagement.makePremium(
      req.user.id, 
      type, 
      parseInt(id), 
      premiumType, 
      parseInt(duration)
    );
    
    res.json({
      success: true,
      data: result,
      message: '高级功能开通成功'
    });
  } catch (error) {
    console.error('开通高级功能失败:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/user-management/system-config
 * 获取系统配置 (价格等)
 */
router.get('/system-config', async (req, res) => {
  try {
    const { keys } = req.query; // 可以指定特定的配置键
    
    let configs = {};
    
    if (keys) {
      const keyArray = keys.split(',');
      for (const key of keyArray) {
        configs[key] = await UserManagement.getSystemConfig(key);
      }
    } else {
      // 返回常用配置
      const commonKeys = [
        'post_costs.load',
        'post_costs.truck', 
        'post_costs.company',
        'post_costs.job',
        'post_costs.resume',
        'post_costs.article',
        'premium_costs.top_24h',
        'premium_costs.top_72h',
        'premium_costs.top_168h',
        'premium_costs.highlight',
        'premium_costs.urgent',
        'recharge_rates'
      ];
      
      for (const key of commonKeys) {
        configs[key] = await UserManagement.getSystemConfig(key);
      }
    }
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: error.message
    });
  }
});

/**
 * POST /api/user-management/recharge
 * 积分充值 (需要认证) - 这里是模拟，实际需要接入支付网关
 */
router.post('/recharge', auth, async (req, res) => {
  try {
    const { amount, paymentMethod = 'mock' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0'
      });
    }
    
    // 获取充值比例
    const rates = await UserManagement.getSystemConfig('recharge_rates');
    
    // 查找对应的积分数量 (配置中是 credits: price 格式)
    let credits = null;
    for (const [creditAmount, price] of Object.entries(rates)) {
      if (parseFloat(price) === parseFloat(amount)) {
        credits = parseInt(creditAmount);
        break;
      }
    }
    
    if (!credits) {
      return res.status(400).json({
        success: false,
        message: '无效的充值金额'
      });
    }
    
    // 模拟支付成功，实际应该调用支付接口
    if (paymentMethod === 'mock') {
      const result = await UserManagement.creditTransaction(
        req.user.id,
        'earn',
        credits,
        `充值 $${amount} 获得 ${credits} 积分`,
        'recharge',
        null
      );
      
      res.json({
        success: true,
        data: {
          ...result,
          amount: amount,
          credits: credits
        },
        message: '充值成功'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
  } catch (error) {
    console.error('充值失败:', error);
    res.status(500).json({
      success: false,
      message: '充值失败',
      error: error.message
    });
  }
});

// ============================================================
// Admin Credits Management (requires credits.manage permission)
// ============================================================

/**
 * GET /api/user-management/admin/credits/users
 * Search/list users with credit balances
 */
router.get('/admin/credits/users', auth, requirePermission('credits.manage'), async (req, res) => {
  try {
    const { db } = require('../config/database');
    const { search, limit = 50, offset = 0 } = req.query;

    let query = db('users')
      .select('id', 'email', 'first_name', 'last_name', 'company_name', 'credits', 'total_credits_earned', 'total_credits_spent', 'is_employee', 'employee_role', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(Math.min(parseInt(limit), 100))
      .offset(parseInt(offset));

    if (search) {
      query = query.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('company_name', 'ilike', `%${search}%`);
      });
    }

    const users = await query;
    const countQuery = db('users').count('* as total');
    if (search) {
      countQuery.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('company_name', 'ilike', `%${search}%`);
      });
    }
    const [{ total }] = await countQuery;

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
        company: u.company_name || '',
        credits: u.credits || 0,
        totalEarned: u.total_credits_earned || 0,
        totalSpent: u.total_credits_spent || 0,
        isEmployee: u.is_employee,
        employeeRole: u.employee_role,
        createdAt: u.created_at
      })),
      total: parseInt(total)
    });
  } catch (error) {
    console.error('Admin credits user list failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/user-management/admin/credits/users/:userId
 * Get specific user credits + history
 */
router.get('/admin/credits/users/:userId', auth, requirePermission('credits.manage'), async (req, res) => {
  try {
    const { db } = require('../config/database');
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'company_name', 'credits', 'total_credits_earned', 'total_credits_spent')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const history = await db('user_credits_log')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
          company: user.company_name || '',
          credits: user.credits || 0,
          totalEarned: user.total_credits_earned || 0,
          totalSpent: user.total_credits_spent || 0
        },
        history
      }
    });
  } catch (error) {
    console.error('Admin get user credits failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/user-management/admin/credits/adjust
 * Admin adjust user credits (add or deduct)
 */
router.post('/admin/credits/adjust', auth, requirePermission('credits.manage'), async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || amount === undefined || amount === 0) {
      return res.status(400).json({ success: false, message: 'userId, amount (non-zero), and description are required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'A description/reason is required for admin adjustments' });
    }

    const adminName = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ') || req.user.email;
    const fullDescription = `[Admin: ${adminName}] ${description.trim()}`;

    const result = await UserManagement.creditTransaction(
      parseInt(userId),
      'admin_adjust',
      parseFloat(amount),
      fullDescription,
      'admin_adjust',
      req.user.id
    );

    res.json({
      success: true,
      data: result,
      message: amount > 0 ? `Successfully added ${amount} credits` : `Successfully deducted ${Math.abs(amount)} credits`
    });
  } catch (error) {
    console.error('Admin credits adjust failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
