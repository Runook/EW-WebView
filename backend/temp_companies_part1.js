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
