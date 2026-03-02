const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/customers
 * 获取客户列表
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const { search } = req.query;
    const customers = await Customer.getCustomers(search);
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败'
    });
  }
});

/**
 * GET /api/customers/search
 * 搜索客户（用于自动补全）
 */
router.get('/search', auth, requireEmployee, async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.json({ success: true, data: [] });
    }
    
    const customers = await Customer.searchCustomers(keyword);
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('搜索客户失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索客户失败'
    });
  }
});

/**
 * GET /api/customers/by-name/:name
 * Get full customer details by company name (for Invoice/Quote generation)
 */
router.get('/by-name/:name', auth, requireEmployee, async (req, res) => {
  try {
    const customer = await Customer.getByName(decodeURIComponent(req.params.name));
    if (!customer) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer by name failed:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer' });
  }
});

/**
 * POST /api/customers
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const customerData = req.body;
    
    if (!customerData.company_name) {
      return res.status(400).json({
        success: false,
        message: '公司名称不能为空'
      });
    }
    
    const customer = await Customer.createCustomer(customerData, req.user.id);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: '客户创建成功'
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(400).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/customers/:id
 * 更新客户
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const customerData = req.body;
    
    const customer = await Customer.updateCustomer(parseInt(id), customerData);
    
    res.json({
      success: true,
      data: customer,
      message: '客户更新成功'
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(400).json({
      success: false,
      message: '更新客户失败'
    });
  }
});

/**
 * DELETE /api/customers/:id
 * 删除客户
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Customer.deleteCustomer(parseInt(id));
    
    res.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(400).json({
      success: false,
      message: '删除客户失败'
    });
  }
});

module.exports = router;

