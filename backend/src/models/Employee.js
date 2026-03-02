const { db } = require('../config/database');

class Employee {
  /**
   * 获取所有员工列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 员工列表
   */
  static async getAllEmployees(filters = {}) {
    try {
      let query = db('users')
        .select(
          'id',
          'email',
          'first_name',
          'last_name',
          'phone',
          'employee_id',
          'employee_role',
          'is_employee',
          'employee_since',
          'is_active',
          'created_at'
        )
        .where('is_employee', true);
      
      // 应用过滤条件
      if (filters.role) {
        query = query.where('employee_role', filters.role);
      }
      
      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('email', 'ilike', `%${filters.search}%`)
            .orWhere('first_name', 'ilike', `%${filters.search}%`)
            .orWhere('last_name', 'ilike', `%${filters.search}%`)
            .orWhere('employee_id', 'ilike', `%${filters.search}%`);
        });
      }
      
      const employees = await query.orderBy('created_at', 'desc');
      
      // 获取每个员工的统计信息
      const employeesWithStats = await Promise.all(
        employees.map(async (employee) => {
          const stats = await this.getEmployeeStats(employee.id);
          return { ...employee, stats };
        })
      );
      
      return employeesWithStats;
    } catch (error) {
      console.error('获取员工列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过ID获取员工信息
   * @param {number} employeeId - 员工ID
   * @returns {Promise<Object>} 员工信息
   */
  static async getEmployeeById(employeeId) {
    try {
      const employee = await db('users')
        .select(
          'id',
          'email',
          'first_name',
          'last_name',
          'phone',
          'employee_id',
          'employee_role',
          'is_employee',
          'employee_since',
          'is_active',
          'created_at'
        )
        .where({ id: employeeId, is_employee: true })
        .first();
      
      if (!employee) {
        throw new Error('员工不存在');
      }
      
      // 获取统计信息
      const stats = await this.getEmployeeStats(employeeId);
      
      // 获取权限列表
      const permissions = await this.getEmployeePermissions(employee.employee_role);
      
      return {
        ...employee,
        stats,
        permissions
      };
    } catch (error) {
      console.error('获取员工信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 设置用户为员工
   * @param {number} userId - 用户ID
   * @param {string} role - 员工角色 (employee, manager, admin)
   * @param {string} employeeId - 员工ID（可选）
   * @returns {Promise<Object>} 更新结果
   */
  static async setUserAsEmployee(userId, role = 'employee', employeeId = null) {
    try {
      console.log(`🔄 开始设置用户 ${userId} 为员工...`);
      
      // 首先检查用户是否存在
      const existingUser = await db('users')
        .where('id', userId)
        .first();
      
      if (!existingUser) {
        throw new Error(`用户ID ${userId} 不存在`);
      }
      
      console.log(`📋 找到用户: ${existingUser.email}`);
      
      // 如果已经是员工，更新角色而不是报错
      if (existingUser.is_employee) {
        console.log(`⚠️ 用户 ${existingUser.email} 已经是员工，更新角色`);
        await db('users').where('id', userId).update({
          employee_role: role || existingUser.employee_role || 'employee',
        });
        const updated = await db('users').where('id', userId).first();
        return { success: true, employee: updated };
      }
      
      // 如果没有提供employeeId，自动生成
      if (!employeeId) {
        employeeId = await this.generateEmployeeId();
        console.log(`🔢 生成员工ID: ${employeeId}`);
      }
      
      // 检查employee_id是否已存在
      const existingEmployeeId = await db('users')
        .where('employee_id', employeeId)
        .whereNot('id', userId)
        .first();
      
      if (existingEmployeeId) {
        throw new Error(`员工ID ${employeeId} 已被使用`);
      }
      
      const updateData = {
        is_employee: true,
        employee_role: role,
        employee_id: employeeId,
        employee_since: new Date()
      };
      
      console.log(`📝 更新数据:`, updateData);
      
      const updateCount = await db('users')
        .where('id', userId)
        .update(updateData);
      
      if (updateCount === 0) {
        throw new Error('更新失败：没有记录被更新');
      }
      
      console.log(`✅ 更新成功，影响 ${updateCount} 条记录`);
      
      // 重新查询用户数据
      const updatedUser = await db('users')
        .where('id', userId)
        .first();
      
      console.log(`✅ 用户 ${updatedUser.email} 已设置为员工 (角色: ${role}, 员工ID: ${employeeId})`);
      
      return {
        success: true,
        employee: updatedUser
      };
    } catch (error) {
      console.error('❌ 设置员工失败:', error.message);
      console.error('错误详情:', error);
      throw error;
    }
  }
  
  /**
   * 更新员工信息
   * @param {number} employeeId - 员工ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  static async updateEmployee(employeeId, updateData) {
    try {
      const allowedFields = ['employee_role', 'phone', 'first_name', 'last_name'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
      
      if (Object.keys(filteredData).length === 0) {
        throw new Error('没有可更新的字段');
      }
      
      const [updatedEmployee] = await db('users')
        .where({ id: employeeId, is_employee: true })
        .update(filteredData)
        .returning('*');
      
      if (!updatedEmployee) {
        throw new Error('员工不存在');
      }
      
      return {
        success: true,
        employee: updatedEmployee
      };
    } catch (error) {
      console.error('更新员工信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 移除员工身份
   * @param {number} employeeId - 员工ID
   * @returns {Promise<Object>} 操作结果
   */
  static async removeEmployee(employeeId) {
    try {
      const [updatedUser] = await db('users')
        .where({ id: employeeId, is_employee: true })
        .update({
          is_employee: false,
          employee_role: null,
          employee_id: null,
          employee_since: null
        })
        .returning('*');
      
      if (!updatedUser) {
        throw new Error('员工不存在');
      }
      
      console.log(`✅ 用户 ${updatedUser.email} 的员工身份已移除`);
      
      return {
        success: true,
        message: '员工身份已移除'
      };
    } catch (error) {
      console.error('移除员工失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取员工统计信息
   * @param {number} employeeId - 员工ID
   * @returns {Promise<Object>} 统计信息
   */
  static async getEmployeeStats(employeeId, dateFrom = null, dateTo = null) {
    try {
      let query = db('employee_orders')
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders"),
          db.raw("COUNT(CASE WHEN status = 'ordered' THEN 1 END) as ordered_orders"),
          db.raw("COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders"),
          db.raw("COUNT(CASE WHEN status = 'quote' THEN 1 END) as quote_orders"),
          db.raw('COALESCE(SUM(COALESCE(ew_final_price, ew_quote_price, final_price, 0)), 0) as total_revenue'),
          db.raw('COALESCE(SUM(profit), 0) as total_profit'),
          db.raw("COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count"),
          db.raw("COUNT(CASE WHEN payment_status = 'unpaid' OR payment_status IS NULL THEN 1 END) as unpaid_count"),
          db.raw("COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_count")
        )
        .where(function() {
          this.where('created_by', employeeId)
            .orWhere('assigned_to', employeeId);
        })
        .where('is_deleted', false);

      if (dateFrom) query = query.where('created_at', '>=', dateFrom);
      if (dateTo) query = query.where('created_at', '<=', dateTo + ' 23:59:59');

      const stats = await query.first();

      return {
        totalOrders: parseInt(stats.total_orders) || 0,
        completedOrders: parseInt(stats.completed_orders) || 0,
        orderedOrders: parseInt(stats.ordered_orders) || 0,
        cancelledOrders: parseInt(stats.cancelled_orders) || 0,
        quoteOrders: parseInt(stats.quote_orders) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        totalProfit: parseFloat(stats.total_profit) || 0,
        paidCount: parseInt(stats.paid_count) || 0,
        unpaidCount: parseInt(stats.unpaid_count) || 0,
        partialCount: parseInt(stats.partial_count) || 0
      };
    } catch (error) {
      console.error('Failed to get employee stats:', error);
      return {
        totalOrders: 0, completedOrders: 0, orderedOrders: 0, cancelledOrders: 0, quoteOrders: 0,
        totalRevenue: 0, totalProfit: 0, paidCount: 0, unpaidCount: 0, partialCount: 0
      };
    }
  }

  static async getStatsByPeriod(employeeId, period = 'monthly', dateFrom = null, dateTo = null) {
    try {
      let dateTrunc;
      switch (period) {
        case 'daily': dateTrunc = 'day'; break;
        case 'weekly': dateTrunc = 'week'; break;
        case 'yearly': dateTrunc = 'year'; break;
        default: dateTrunc = 'month';
      }

      let query = db('employee_orders')
        .select(
          db.raw(`DATE_TRUNC('${dateTrunc}', created_at) as period`),
          db.raw('COUNT(*) as total_orders'),
          db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed"),
          db.raw('COALESCE(SUM(COALESCE(ew_final_price, ew_quote_price, final_price, 0)), 0) as revenue'),
          db.raw('COALESCE(SUM(profit), 0) as profit'),
          db.raw("COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid"),
          db.raw("COUNT(CASE WHEN payment_status = 'unpaid' OR payment_status IS NULL THEN 1 END) as unpaid")
        )
        .where(function() {
          this.where('created_by', employeeId)
            .orWhere('assigned_to', employeeId);
        })
        .where('is_deleted', false)
        .groupByRaw(`DATE_TRUNC('${dateTrunc}', created_at)`)
        .orderBy('period', 'desc');

      if (dateFrom) query = query.where('created_at', '>=', dateFrom);
      if (dateTo) query = query.where('created_at', '<=', dateTo + ' 23:59:59');

      const rows = await query.limit(50);
      return rows.map(r => ({
        period: r.period,
        totalOrders: parseInt(r.total_orders) || 0,
        completed: parseInt(r.completed) || 0,
        revenue: parseFloat(r.revenue) || 0,
        profit: parseFloat(r.profit) || 0,
        paid: parseInt(r.paid) || 0,
        unpaid: parseInt(r.unpaid) || 0
      }));
    } catch (error) {
      console.error('Failed to get stats by period:', error);
      return [];
    }
  }
  
  /**
   * 获取员工权限列表
   * @param {string} role - 员工角色
   * @returns {Promise<Array>} 权限列表
   */
  static async getEmployeePermissions(role) {
    try {
      if (!role) return [];
      
      const permissions = await db('employee_role_permissions as erp')
        .join('employee_permissions as ep', 'erp.permission_id', 'ep.id')
        .select('ep.permission_key', 'ep.permission_name', 'ep.description', 'ep.category')
        .where('erp.role', role);
      
      return permissions;
    } catch (error) {
      console.error('获取员工权限失败:', error);
      return [];
    }
  }
  
  /**
   * 生成员工ID
   * @returns {Promise<string>} 员工ID
   */
  static async generateEmployeeId() {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `EW${year}`;

      // Find the highest existing number across ALL users (not just active employees)
      const result = await db('users')
        .whereNotNull('employee_id')
        .where('employee_id', 'like', `${prefix}%`)
        .orderByRaw("CAST(SUBSTRING(employee_id FROM 5) AS INTEGER) DESC")
        .select('employee_id')
        .first();

      let newNumber = 1;
      if (result?.employee_id) {
        const numPart = parseInt(result.employee_id.substring(4)) || 0;
        newNumber = numPart + 1;
      }

      const employeeId = `${prefix}${newNumber.toString().padStart(4, '0')}`;
      return employeeId;
    } catch (error) {
      console.error('生成员工ID失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查用户是否有特定权限
   * @param {number} userId - 用户ID
   * @param {string} permissionKey - 权限键
   * @returns {Promise<boolean>} 是否有权限
   */
  static async hasPermission(userId, permissionKey) {
    try {
      const user = await db('users')
        .select('employee_role', 'is_employee')
        .where('id', userId)
        .first();
      
      if (!user || !user.is_employee) {
        return false;
      }
      
      const permission = await db('employee_role_permissions as erp')
        .join('employee_permissions as ep', 'erp.permission_id', 'ep.id')
        .where('erp.role', user.employee_role)
        .where('ep.permission_key', permissionKey)
        .first();
      
      return !!permission;
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  }
}

module.exports = Employee;

