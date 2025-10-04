const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, requireRole, requirePermission } = require('../middleware/auth');

/**
 * GET /api/employees
 * 获取所有员工列表 (需要员工查看权限)
 */
router.get('/', auth, requirePermission('employee.view'), async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    
    const employees = await Employee.getAllEmployees(filters);
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取员工列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/employees/:id
 * 获取员工详细信息
 */
router.get('/:id', auth, requirePermission('employee.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.getEmployeeById(parseInt(id));
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('获取员工信息失败:', error);
    res.status(404).json({
      success: false,
      message: '员工不存在或获取失败',
      error: error.message
    });
  }
});

/**
 * POST /api/employees/set
 * 设置用户为员工 (需要管理员权限)
 */
router.post('/set', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { userId, role, employeeId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }
    
    const validRoles = ['employee', 'manager', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的员工角色'
      });
    }
    
    const result = await Employee.setUserAsEmployee(
      parseInt(userId), 
      role || 'employee',
      employeeId
    );
    
    res.json({
      success: true,
      data: result.employee,
      message: '员工设置成功'
    });
  } catch (error) {
    console.error('设置员工失败:', error);
    res.status(400).json({
      success: false,
      message: '设置员工失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/employees/:id
 * 更新员工信息 (需要管理员权限)
 */
router.put('/:id', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await Employee.updateEmployee(parseInt(id), updateData);
    
    res.json({
      success: true,
      data: result.employee,
      message: '员工信息更新成功'
    });
  } catch (error) {
    console.error('更新员工失败:', error);
    res.status(400).json({
      success: false,
      message: '更新员工失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/employees/:id
 * 移除员工身份 (需要管理员权限)
 */
router.delete('/:id', auth, requirePermission('employee.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // 不能移除自己的员工身份
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能移除自己的员工身份'
      });
    }
    
    const result = await Employee.removeEmployee(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('移除员工失败:', error);
    res.status(400).json({
      success: false,
      message: '移除员工失败',
      error: error.message
    });
  }
});

/**
 * GET /api/employees/:id/stats
 * 获取员工统计信息
 */
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 员工只能查看自己的统计，管理员可以查看所有
    if (parseInt(id) !== req.user.id && !['manager', 'admin'].includes(req.user.employeeRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    const stats = await Employee.getEmployeeStats(parseInt(id));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取员工统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * GET /api/employees/:id/permissions
 * 获取员工权限列表
 */
router.get('/:id/permissions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 员工只能查看自己的权限，管理员可以查看所有
    if (parseInt(id) !== req.user.id && !['manager', 'admin'].includes(req.user.employeeRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    const employee = await Employee.getEmployeeById(parseInt(id));
    
    res.json({
      success: true,
      data: employee.permissions
    });
  } catch (error) {
    console.error('获取员工权限失败:', error);
    res.status(500).json({
      success: false,
      message: '获取权限列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/employees/me
 * 获取当前登录员工的信息
 */
router.get('/me/info', auth, async (req, res) => {
  try {
    if (!req.user.isEmployee) {
      return res.status(403).json({
        success: false,
        message: '您不是员工'
      });
    }
    
    const employee = await Employee.getEmployeeById(req.user.id);
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('获取当前员工信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取信息失败',
      error: error.message
    });
  }
});

module.exports = router;

