const express = require('express');
const router = express.Router();
const ServiceItem = require('../models/ServiceItem');
const { auth, requireEmployee, requirePermission } = require('../middleware/auth');

/**
 * GET /api/service-items
 * 获取服务项目列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const items = await ServiceItem.getAll({
      activeOnly: req.query.active_only === 'true',
      item_type: req.query.item_type,
      search: req.query.search
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('获取服务项目失败:', error);
    res.status(500).json({ success: false, message: '获取服务项目失败', error: error.message });
  }
});

/**
 * GET /api/service-items/:id
 * 获取服务项目详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const item = await ServiceItem.getById(req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('获取服务项目详情失败:', error);
    res.status(error.message === '服务项目不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * POST /api/service-items
 * 创建服务项目
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const item = await ServiceItem.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: item, message: '服务项目创建成功' });
  } catch (error) {
    console.error('创建服务项目失败:', error);
    res.status(error.message.includes('已存在') ? 400 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * PUT /api/service-items/:id
 * 更新服务项目
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const item = await ServiceItem.update(req.params.id, req.body);
    res.json({ success: true, data: item, message: '服务项目更新成功' });
  } catch (error) {
    console.error('更新服务项目失败:', error);
    res.status(error.message === '服务项目不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * DELETE /api/service-items/:id
 * 删除服务项目
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    await ServiceItem.delete(req.params.id);
    res.json({ success: true, message: '服务项目删除成功' });
  } catch (error) {
    console.error('删除服务项目失败:', error);
    res.status(error.message === '服务项目不存在' ? 404 : 500).json({
      success: false, message: error.message
    });
  }
});

/**
 * PATCH /api/service-items/:id/toggle
 * 切换服务项目状态
 */
router.patch('/:id/toggle', auth, requireEmployee, async (req, res) => {
  try {
    const item = await ServiceItem.toggleActive(req.params.id);
    res.json({ success: true, data: item, message: `服务项目已${item.is_active ? '启用' : '停用'}` });
  } catch (error) {
    console.error('切换服务项目状态失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

