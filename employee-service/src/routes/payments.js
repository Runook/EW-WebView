const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/payments
 * 获取付款记录列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const filters = {
      payment_type: req.query.payment_type,
      order_id: req.query.order_id,
      customer_id: req.query.customer_id,
      vendor_id: req.query.vendor_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    
    const result = await Payment.getAll(filters);
    
    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取付款记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取付款记录失败',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/statistics
 * 获取付款统计
 */
router.get('/statistics', auth, requireEmployee, async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const stats = await Payment.getStatistics(filters);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取付款统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取付款统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/order/:orderId
 * 获取订单的付款记录
 */
router.get('/order/:orderId', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const payments = await Payment.getByOrderId(parseInt(orderId));
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('获取订单付款记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单付款记录失败',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/:id
 * 获取付款记录详情
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.getById(parseInt(id));
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('获取付款记录详情失败:', error);
    res.status(404).json({
      success: false,
      message: error.message || '付款记录不存在',
      error: error.message
    });
  }
});

/**
 * POST /api/payments
 * 创建付款记录
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const { payment_type, amount, payment_date, payment_method } = req.body;
    
    // 验证必填字段
    if (!payment_type || !amount || !payment_date || !payment_method) {
      return res.status(400).json({
        success: false,
        message: '付款类型、金额、日期、方式为必填项'
      });
    }
    
    // 验证付款类型
    if (!['customer_payment', 'vendor_payment'].includes(payment_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的付款类型'
      });
    }
    
    // 验证金额
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: '金额必须大于0'
      });
    }
    
    const payment = await Payment.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: '付款记录创建成功'
    });
  } catch (error) {
    console.error('创建付款记录失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建付款记录失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/payments/:id
 * 更新付款记录
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.update(parseInt(id), req.body, req.user.id);
    
    res.json({
      success: true,
      data: payment,
      message: '付款记录更新成功'
    });
  } catch (error) {
    console.error('更新付款记录失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新付款记录失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/payments/:id
 * 删除付款记录
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Payment.delete(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除付款记录失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '删除付款记录失败',
      error: error.message
    });
  }
});

module.exports = router;

