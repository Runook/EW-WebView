const express = require('express');
const router = express.Router();
const Order = require('../models/EmployeeOrder');
const Employee = require('../models/Employee');
const { auth, requireEmployee, requirePermission } = require('../middleware/auth');

/**
 * GET /api/orders
 * 获取订单列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      order_type: req.query.order_type,
      priority: req.query.priority,
      payment_status: req.query.payment_status,
      assigned_to: req.query.assigned_to,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      page: req.query.page,
      limit: req.query.limit,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    
    // 检查是否有查看所有订单的权限
    const canViewAll = await Employee.hasPermission(req.user.id, 'order.view.all');
    
    const result = await Order.getOrders(
      filters,
      req.user.id,
      canViewAll
    );
    
    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/statistics
 * 获取订单统计信息
 */
router.get('/statistics', auth, requireEmployee, async (req, res) => {
  try {
    const canViewAll = await Employee.hasPermission(req.user.id, 'order.view.all');
    
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    // 如果不能查看所有，只统计自己的
    if (!canViewAll) {
      filters.employee_id = req.user.id;
    }
    
    const stats = await Order.getStatistics(filters);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * 获取订单详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const canViewAll = await Employee.hasPermission(req.user.id, 'order.view.all');
    
    const order = await Order.getOrderById(
      parseInt(id),
      req.user.id,
      canViewAll
    );
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(404).json({
      success: false,
      message: error.message || '订单不存在',
      error: error.message
    });
  }
});

/**
 * POST /api/orders
 * 创建新订单
 */
router.post('/', auth, requirePermission('order.create'), async (req, res) => {
  try {
    const orderData = req.body;
    
    // 验证必填字段（兼容新旧字段）
    const customerName = orderData.customer_name || orderData.inquiry_company;
    const cargoDesc = orderData.cargo_description || orderData.cargo_description_detailed;
    
    if (!customerName || !orderData.order_type || !cargoDesc) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：客户名称、订单类型、货物描述',
        debug: {
          customer_name: !!customerName,
          order_type: !!orderData.order_type,
          cargo_description: !!cargoDesc
        }
      });
    }
    
    // 验证订单类型
    const validTypes = ['land_freight', 'sea_freight', 'air_freight', 'warehouse', 'customs', 'other'];
    if (!validTypes.includes(orderData.order_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单类型'
      });
    }
    
    const order = await Order.createOrder(orderData, req.user.id);
    
    res.status(201).json({
      success: true,
      data: order,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(400).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/orders/:id
 * 更新订单
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { changeOperator, ...updateData } = req.body;
    
    // 检查权限：能编辑所有还是只能编辑自己的
    const canEditAll = await Employee.hasPermission(req.user.id, 'order.edit.all');
    
    const order = await Order.updateOrder(
      parseInt(id),
      updateData,
      req.user.id,
      canEditAll,
      changeOperator === true
    );
    
    res.json({
      success: true,
      data: order,
      message: changeOperator ? '订单已更换操作员并更新' : '订单更新成功'
    });
  } catch (error) {
    console.error('更新订单失败:', error);
    
    // 处理需要确认更换操作员的情况
    if (error.code === 'OPERATOR_CHANGE_REQUIRED') {
      return res.status(403).json({
        success: false,
        code: 'OPERATOR_CHANGE_REQUIRED',
        message: error.message,
        details: error.details
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || '更新订单失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/orders/:id
 * 删除订单（软删除）
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查权限：能删除所有还是只能删除自己的
    const canDeleteAll = await Employee.hasPermission(req.user.id, 'order.delete.all');
    
    const result = await Order.deleteOrder(
      parseInt(id),
      req.user.id,
      canDeleteAll
    );
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除订单失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/comments
 * 添加订单评论
 */
router.post('/:id/comments', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal } = req.body;
    
    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }
    
    // 先检查是否有权限查看该订单
    const canViewAll = await Employee.hasPermission(req.user.id, 'order.view.all');
    const order = await Order.getOrderById(parseInt(id), req.user.id, canViewAll);
    
    const newComment = await Order.addComment(
      parseInt(id),
      req.user.id,
      comment,
      isInternal !== false // 默认为内部评论
    );
    
    res.status(201).json({
      success: true,
      data: newComment,
      message: '评论添加成功'
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '添加评论失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/confirm
 * 确认订单（报价单 → 已下单）
 */
router.post('/:id/confirm', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_status } = req.body;
    
    const validSubStatuses = ['waiting_driver', 'driver_found', 'sent_to_3pl', 'in_transit'];
    if (sub_status && !validSubStatuses.includes(sub_status)) {
      return res.status(400).json({
        success: false,
        message: '无效的子状态'
      });
    }
    
    const result = await Order.confirmOrder(
      parseInt(id),
      req.user.id,
      sub_status || 'waiting_driver'
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '订单已确认'
    });
  } catch (error) {
    console.error('确认订单失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '确认订单失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/complete
 * 完成订单（已下单 → 已完成）
 */
router.post('/:id/complete', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Order.completeOrder(
      parseInt(id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '订单已完成'
    });
  } catch (error) {
    console.error('完成订单失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '完成订单失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/orders/:id/sub-status
 * 更新子状态（等待司机/找到司机/运输中）
 */
router.put('/:id/sub-status', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_status } = req.body;
    
    const validSubStatuses = ['waiting_driver', 'driver_found', 'sent_to_3pl', 'in_transit'];
    if (!sub_status || !validSubStatuses.includes(sub_status)) {
      return res.status(400).json({
        success: false,
        message: '无效的子状态'
      });
    }
    
    const result = await Order.updateSubStatus(
      parseInt(id),
      sub_status,
      req.user.id
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新子状态失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新状态失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/assign
 * 分配订单给员工
 */
router.post('/:id/assign', auth, requirePermission('order.assign'), async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: '请指定要分配的员工'
      });
    }
    
    // 验证目标员工是否存在且是员工
    const targetEmployee = await Employee.getEmployeeById(parseInt(assignedTo));
    if (!targetEmployee) {
      return res.status(400).json({
        success: false,
        message: '目标员工不存在'
      });
    }
    
    const canEditAll = await Employee.hasPermission(req.user.id, 'order.edit.all');
    
    const order = await Order.updateOrder(
      parseInt(id),
      { assigned_to: parseInt(assignedTo) },
      req.user.id,
      canEditAll
    );
    
    res.json({
      success: true,
      data: order,
      message: '订单分配成功'
    });
  } catch (error) {
    console.error('分配订单失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '分配订单失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/claim
 * 申请索赔
 */
router.post('/:id/claim', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { claim_reason } = req.body;
    
    if (!claim_reason || claim_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '索赔原因不能为空'
      });
    }
    
    const result = await Order.requestClaim(
      parseInt(id),
      claim_reason,
      req.user.id
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '索赔申请已提交'
    });
  } catch (error) {
    console.error('申请索赔失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '申请索赔失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/resolve-claim
 * 解决索赔
 */
router.post('/:id/resolve-claim', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    if (!resolution || resolution.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '解决方案不能为空'
      });
    }
    
    const result = await Order.resolveClaim(
      parseInt(id),
      resolution,
      req.user.id
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '索赔已解决'
    });
  } catch (error) {
    console.error('解决索赔失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '解决索赔失败',
      error: error.message
    });
  }
});

/**
 * POST /api/orders/:id/cancel
 * 取消订单
 */
router.post('/:id/cancel', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Order.cancelOrder(
      parseInt(id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: result.order,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '取消订单失败',
      error: error.message
    });
  }
});

module.exports = router;

