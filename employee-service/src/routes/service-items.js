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
    const filters = {
      activeOnly: req.query.active_only === 'true',
      item_type: req.query.item_type,
      search: req.query.search
    };
    
    const items = await ServiceItem.getAll(filters);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('获取服务项目失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务项目失败',
      error: error.message
    });
  }
});

/**
 * GET /api/service-items/:id
 * 获取服务项目详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await ServiceItem.getById(parseInt(id));
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('获取服务项目详情失败:', error);
    res.status(404).json({
      success: false,
      message: error.message || '服务项目不存在',
      error: error.message
    });
  }
});

/**
 * POST /api/service-items
 * 创建服务项目 (需要管理员权限)
 */
router.post('/', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { item_code, item_name } = req.body;
    
    // 验证必填字段
    if (!item_code || !item_name) {
      return res.status(400).json({
        success: false,
        message: '服务代码和名称为必填项'
      });
    }
    
    const item = await ServiceItem.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: item,
      message: '服务项目创建成功'
    });
  } catch (error) {
    console.error('创建服务项目失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建服务项目失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/service-items/:id
 * 更新服务项目 (需要管理员权限)
 */
router.put('/:id', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await ServiceItem.update(parseInt(id), req.body);
    
    res.json({
      success: true,
      data: item,
      message: '服务项目更新成功'
    });
  } catch (error) {
    console.error('更新服务项目失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新服务项目失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/service-items/:id
 * 删除服务项目 (需要管理员权限)
 */
router.delete('/:id', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await ServiceItem.delete(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除服务项目失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除服务项目失败',
      error: error.message
    });
  }
});

/**
 * POST /api/service-items/:id/toggle
 * 切换服务项目状态 (需要管理员权限)
 */
router.post('/:id/toggle', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await ServiceItem.toggleActive(parseInt(id));
    
    res.json({
      success: true,
      data: item,
      message: `服务项目已${item.is_active ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('切换服务项目状态失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '操作失败',
      error: error.message
    });
  }
});

module.exports = router;

