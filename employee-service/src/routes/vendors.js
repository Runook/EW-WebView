const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/vendors
 * 获取供应商列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      activeOnly: req.query.active_only === 'true',
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      limit: req.query.limit,
      offset: req.query.offset
    };
    
    const vendors = await Vendor.getAll(filters);
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/vendors/search
 * 搜索供应商(用于自动补全)
 */
router.get('/search', auth, requireEmployee, async (req, res) => {
  try {
    const { q, field } = req.query;
    
    const vendors = await Vendor.search(q, field);
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('搜索供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索供应商失败',
      error: error.message
    });
  }
});

/**
 * GET /api/vendors/:id
 * 获取供应商详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.getById(parseInt(id));
    const stats = await Vendor.getStats(parseInt(id));
    
    res.json({
      success: true,
      data: { ...vendor, stats }
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(404).json({
      success: false,
      message: error.message || '供应商不存在',
      error: error.message
    });
  }
});

/**
 * POST /api/vendors
 * 创建供应商
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const { mc_number, truck_company_name, truck_contact } = req.body;
    
    // 验证必填字段
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({
        success: false,
        message: 'MC Number、公司名称、联络方式为必填项'
      });
    }
    
    const vendor = await Vendor.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: vendor,
      message: '供应商创建成功'
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建供应商失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/vendors/:id
 * 更新供应商
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.update(parseInt(id), req.body);
    
    res.json({
      success: true,
      data: vendor,
      message: '供应商更新成功'
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新供应商失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/vendors/:id
 * 删除供应商(软删除)
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Vendor.delete(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除供应商失败',
      error: error.message
    });
  }
});

/**
 * GET /api/vendors/:id/stats
 * 获取供应商统计
 */
router.get('/:id/stats', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await Vendor.getStats(parseInt(id));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取供应商统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商统计失败',
      error: error.message
    });
  }
});

module.exports = router;

