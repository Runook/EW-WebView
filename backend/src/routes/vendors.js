const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { auth, requireEmployee, requirePermission } = require('../middleware/auth');

/**
 * GET /api/vendors
 * 获取供应商列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const vendors = await Vendor.getAll({
      activeOnly: req.query.active_only === 'true',
      search: req.query.search,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      limit: req.query.limit,
      offset: req.query.offset
    });
    
    res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({ success: false, message: '获取供应商列表失败', error: error.message });
  }
});

/**
 * GET /api/vendors/search
 * 搜索供应商
 */
router.get('/search', auth, requireEmployee, async (req, res) => {
  try {
    const vendors = await Vendor.search(req.query.q, req.query.field);
    res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('搜索供应商失败:', error);
    res.status(500).json({ success: false, message: '搜索供应商失败', error: error.message });
  }
});

/**
 * GET /api/vendors/:id
 * 获取供应商详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const vendor = await Vendor.getById(req.params.id);
    const stats = await Vendor.getStats(req.params.id);
    res.json({ success: true, data: { ...vendor, stats } });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(error.message === '供应商不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * POST /api/vendors
 * 创建供应商
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: vendor, message: '供应商创建成功' });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json({ success: false, message: '创建供应商失败', error: error.message });
  }
});

/**
 * PUT /api/vendors/:id
 * 更新供应商
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const vendor = await Vendor.update(req.params.id, req.body);
    res.json({ success: true, data: vendor, message: '供应商更新成功' });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(error.message === '供应商不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * DELETE /api/vendors/:id
 * 删除供应商（软删除）
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    await Vendor.delete(req.params.id);
    res.json({ success: true, message: '供应商删除成功' });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(error.message === '供应商不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

module.exports = router;

