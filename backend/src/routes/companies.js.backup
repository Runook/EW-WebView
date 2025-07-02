const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');

/**
 * 商家黄页路由
 * 处理企业信息的CRUD操作
 */

// ===== 企业信息相关路由 =====

/**
 * GET /api/companies
 * 获取企业列表
 * 支持查询参数筛选
 */
router.get('/', async (req, res) => {
  try {
    console.log('获取企业列表，查询参数:', req.query);
    
    const filters = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      search: req.query.search,
      verified: req.query.verified
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    console.log('调用 Company.getAllCompanies...');
    const companies = await Company.getAllCompanies(filters);
    console.log('获取到企业数量:', companies.length);
    
    const response = {
      success: true,
      data: companies,
      total: companies.length,
      message: '企业列表获取成功'
    };
    
    res.json(response);
  } catch (error) {
    console.error('获取企业列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取企业列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/companies/subcategory/:subcategory
 * 根据子分类获取企业列表
 */
router.get('/subcategory/:subcategory', async (req, res) => {
  try {
    const { subcategory } = req.params;
    const { search } = req.query;
    
    console.log('根据子分类获取企业:', subcategory, '搜索:', search);
    
    const companies = await Company.getCompaniesBySubcategory(subcategory, {
      search: search
    });
    
    res.json({
      success: true,
      data: companies,
      total: companies.length,
      message: '企业列表获取成功'
    });
  } catch (error) {
    console.error('根据子分类获取企业失败:', error);
    res.status(500).json({
      success: false,
      message: '获取企业列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/companies/:id
 * 获取单个企业详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.getCompanyById(parseInt(id));
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '企业信息不存在'
      });
    }

    res.json({
      success: true,
      data: company,
      message: '企业详情获取成功'
    });
  } catch (error) {
    console.error('获取企业详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取企业详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/companies
 * 创建新企业 (需要认证)
 */
router.post('/', auth, async (req, res) => {
  try {
    console.log('创建企业，用户ID:', req.user.id);
    console.log('企业数据:', req.body);

    // 验证必填字段
    const requiredFields = ['name', 'description', 'category', 'subcategory', 'phone', 'email', 'address'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    const newCompany = await Company.createCompany(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: newCompany,
      message: '企业发布成功'
    });
  } catch (error) {
    console.error('创建企业失败:', error);
    res.status(500).json({
      success: false,
      message: '企业发布失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/companies/:id
 * 更新企业信息 (需要认证且为发布者)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('更新企业，ID:', id, '用户ID:', req.user.id);

    const updatedCompany = await Company.updateCompany(parseInt(id), req.body, req.user.id);
    
    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: '企业不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      data: updatedCompany,
      message: '企业更新成功'
    });
  } catch (error) {
    console.error('更新企业失败:', error);
    res.status(500).json({
      success: false,
      message: '企业更新失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/companies/:id
 * 删除企业 (需要认证且为发布者)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('删除企业，ID:', id, '用户ID:', req.user.id);

    const success = await Company.deleteCompany(parseInt(id), req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '企业不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '企业删除成功'
    });
  } catch (error) {
    console.error('删除企业失败:', error);
    res.status(500).json({
      success: false,
      message: '企业删除失败',
      error: error.message
    });
  }
});

// ===== 用户相关路由 =====

/**
 * GET /api/companies/my/posts
 * 获取当前用户发布的企业信息 (需要认证)
 */
router.get('/my/posts', auth, async (req, res) => {
  try {
    console.log('获取用户发布的企业信息，用户ID:', req.user.id);

    const companies = await Company.getUserCompanies(req.user.id);
    
    res.json({
      success: true,
      data: companies,
      total: companies.length,
      message: '用户企业信息获取成功'
    });
  } catch (error) {
    console.error('获取用户企业信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户企业信息失败',
      error: error.message
    });
  }
});

// ===== 统计和分类路由 =====

/**
 * GET /api/companies/stats/categories
 * 获取分类统计信息
 */
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await Company.getCategoryStats();
    
    res.json({
      success: true,
      data: stats,
      message: '分类统计获取成功'
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/companies/search
 * 搜索企业
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, subcategory } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const companies = await Company.getAllCompanies({
      search: q,
      category: category,
      subcategory: subcategory
    });
    
    res.json({
      success: true,
      data: companies,
      total: companies.length,
      message: '搜索完成'
    });
  } catch (error) {
    console.error('搜索企业失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message
    });
  }
});

module.exports = router; 