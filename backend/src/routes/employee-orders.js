const express = require('express');
const router = express.Router();
const Order = require('../models/EmployeeOrder');
const Employee = require('../models/Employee');
const { auth, requireEmployee, requirePermission } = require('../middleware/auth');
const datPostingService = require('../services/datPostingService');

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
    
    // "我的订单" 筛选：即使有查看所有权限，也只看自己的
    const employeeFilter = req.query.employee;
    const effectiveViewAll = employeeFilter === 'mine' ? false : canViewAll;
    
    const result = await Order.getOrders(
      filters,
      req.user.id,
      effectiveViewAll
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
 * GET /api/orders/my
 * User-facing: get the logged-in customer's own orders by email.
 */
router.get('/my', auth, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(400).json({ success: false, message: 'User email not found' });

    const { db } = require('../config/database');
    const orders = await db('employee_orders')
      .where('is_deleted', false)
      .where(function() {
        this.where('customer_email', email)
          .orWhere('customer_email', email.toUpperCase())
          .orWhere('customer_email', email.toLowerCase())
          .orWhere('customer_name', email)
          .orWhere('customer_name', email.toLowerCase());
      })
      .orderBy('created_at', 'desc')
      .select(
        'id', 'order_number', 'status', 'sub_status', 'workflow_stage',
        'customer_name', 'inquiry_company',
        'origin_city', 'origin_state', 'origin_zipcode', 'origin_address',
        'destination_city', 'destination_state', 'destination_zipcode', 'destination_address',
        'cargo_description_detailed', 'total_weight_lbs', 'actual_pallets',
        'transport_distance', 'ew_quote_price', 'ew_final_price',
        'truck_company_name', 'driver_name', 'driver_phone',
        'pickup_date', 'delivery_date',
        'delivered_at', 'invoiced_at', 'settled_at', 'cancelled_at', 'cancel_reason',
        'consignee_contact', 'bol_number', 'notes',
        'created_at', 'updated_at'
      );

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Failed to get user orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/orders/my/:id
 * User-facing: get a single order detail (only if it belongs to the user).
 */
router.get('/my/:id', auth, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) return res.status(400).json({ success: false, message: 'User email not found' });

    const { db } = require('../config/database');
    const order = await db('employee_orders')
      .where('id', parseInt(req.params.id))
      .where('is_deleted', false)
      .where(function() {
        this.where('customer_email', email)
          .orWhere('customer_email', email.toUpperCase())
          .orWhere('customer_email', email.toLowerCase())
          .orWhere('customer_name', email)
          .orWhere('customer_name', email.toLowerCase());
      })
      .first();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let loads = [];
    try {
      loads = await db('order_loads').where('order_id', order.id).orderBy('load_number', 'asc');
    } catch { /* table may not exist */ }

    res.json({ success: true, data: { ...order, loads } });
  } catch (error) {
    console.error('Failed to get user order detail:', error);
    res.status(500).json({ success: false, message: error.message });
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
    
    // Auto-delete any active DAT posts linked to this order (certification requirement)
    try {
      const datResults = await datPostingService.deletePostsForOrder(req.user.id, parseInt(id));
      if (datResults.length > 0) {
        console.log(`DAT: Auto-deleted ${datResults.length} post(s) for confirmed order ${id}`);
      }
    } catch (datError) {
      console.error(`DAT: Auto-delete failed for order ${id}:`, datError.message);
    }
    
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

/**
 * POST /api/orders/:id/invoice-number
 * 生成或返回 Invoice 编号（从1开始递增）
 */
router.post('/:id/invoice-number', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('../config/database');

    // 检查是否已有 invoice_number
    const order = await db('employee_orders').where('id', id).first();
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    if (order.invoice_number) {
      return res.json({ success: true, data: { invoice_number: order.invoice_number } });
    }

    // 生成新的 invoice number
    const [result] = await db.raw("SELECT nextval('invoice_number_seq') as num");
    const num = parseInt(result.num);
    const invoiceNumber = `INV-${String(num).padStart(4, '0')}`;

    // 保存到订单
    await db('employee_orders').where('id', id).update({
      invoice_number: invoiceNumber,
      invoice_date: new Date()
    });

    res.json({ success: true, data: { invoice_number: invoiceNumber } });
  } catch (error) {
    console.error('生成发票编号失败:', error);
    res.status(500).json({ success: false, message: '生成发票编号失败', error: error.message });
  }
});

/**
 * POST /api/orders/:id/mark-paid
 * 快速标记订单付款状态
 */
router.post('/:id/mark-paid', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, paid_amount, payment_method, reference_number } = req.body;
    const { db } = require('../config/database');

    const order = await db('employee_orders').where('id', id).first();
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    const total = parseFloat(order.ew_quote_price || order.final_price || 0);
    const newPaid = paid_amount !== undefined ? parseFloat(paid_amount) : total;

    let status = payment_status || 'paid';
    if (newPaid >= total) status = 'paid';
    else if (newPaid > 0) status = 'partial';

    await db('employee_orders').where('id', id).update({
      payment_status: status,
      paid_amount: newPaid,
      customer_payment_date: new Date(),
      customer_payment_method: payment_method || null,
      customer_payment_reference: reference_number || null,
      updated_by: req.user.id
    });

    res.json({ success: true, message: `付款状态已更新为: ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新付款失败', error: error.message });
  }
});

/**
 * GET /api/orders/overdue-check
 * 检查逾期订单
 */
router.get('/overdue-check', auth, requireEmployee, async (req, res) => {
  try {
    const { db } = require('../config/database');

    // Find completed orders with invoices that are past due
    const overdueOrders = await db('employee_orders as eo')
      .leftJoin('customers as c', db.raw("LOWER(eo.inquiry_company) = LOWER(c.company_name)"))
      .where('eo.status', 'completed')
      .where('eo.is_deleted', false)
      .whereNotNull('eo.invoice_date')
      .whereNot('eo.payment_status', 'paid')
      .whereRaw("eo.invoice_date + CAST(COALESCE(REGEXP_REPLACE(c.payment_terms, '[^0-9]', '', 'g'), '7') || ' days' AS INTERVAL) < NOW()")
      .select(
        'eo.id', 'eo.order_number', 'eo.ew_quote_number', 'eo.inquiry_company',
        'eo.ew_quote_price', 'eo.paid_amount', 'eo.payment_status',
        'eo.invoice_number', 'eo.invoice_date',
        'c.payment_terms', 'c.late_fee_rate', 'c.late_fee_fixed'
      )
      .orderBy('eo.invoice_date', 'asc');

    const results = overdueOrders.map(o => {
      const outstanding = parseFloat(o.ew_quote_price || 0) - parseFloat(o.paid_amount || 0);
      const rate = parseFloat(o.late_fee_rate || 0);
      const fixed = parseFloat(o.late_fee_fixed || 0);
      let lateFee = 0;
      if (rate > 0) lateFee = outstanding * (rate / 100);
      else if (fixed > 0) lateFee = fixed;

      const dueDate = new Date(o.invoice_date);
      const termDays = parseInt((o.payment_terms || 'Net 7').replace(/[^0-9]/g, '')) || 7;
      dueDate.setDate(dueDate.getDate() + termDays);
      const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / 86400000);

      return {
        ...o,
        outstanding,
        late_fee: Math.round(lateFee * 100) / 100,
        due_date: dueDate.toISOString().split('T')[0],
        days_overdue: daysOverdue
      };
    });

    res.json({ success: true, data: results, total_overdue: results.length });
  } catch (error) {
    console.error('逾期检查失败:', error);
    res.status(500).json({ success: false, message: '逾期检查失败', error: error.message });
  }
});

/**
 * GET /api/orders/customer-balance/:companyName
 * 获取客户余额
 */
router.get('/customer-balance/:companyName', auth, requireEmployee, async (req, res) => {
  try {
    const { db } = require('../config/database');
    const companyName = decodeURIComponent(req.params.companyName);

    const [result] = await db('employee_orders')
      .where('status', 'completed')
      .where('is_deleted', false)
      .whereRaw('LOWER(inquiry_company) = LOWER(?)', [companyName])
      .whereNot('payment_status', 'paid')
      .select(
        db.raw('COALESCE(SUM(COALESCE(ew_quote_price,0) - COALESCE(paid_amount,0)), 0) as balance'),
        db.raw('COUNT(*) as unpaid_orders')
      );

    res.json({
      success: true,
      data: {
        balance: parseFloat(result.balance) || 0,
        unpaid_orders: parseInt(result.unpaid_orders) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取余额失败', error: error.message });
  }
});

/**
 * PATCH /api/orders/:id/workflow-stage
 * Advance order through the 12-step lifecycle.
 */
router.patch('/:id/workflow-stage', auth, requireEmployee, async (req, res) => {
  try {
    const { stage, cancel_reason, cancel_cost } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'stage is required' });

    const result = await Order.advanceWorkflowStage(parseInt(req.params.id), stage, req.user.id);

    if (stage === 'cancelled' && (cancel_reason || cancel_cost)) {
      const updates = {};
      if (cancel_reason) updates.cancel_reason = cancel_reason;
      if (cancel_cost !== undefined) updates.cancel_cost = cancel_cost;
      await Order.updateOrder(parseInt(req.params.id), updates, req.user.id);
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to advance workflow stage:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
