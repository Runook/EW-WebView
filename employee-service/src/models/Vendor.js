const { db } = require('../config/database');

/**
 * 供应商(卡车公司)模型 - 用于QBO的Vendor
 */
class Vendor {
  /**
   * 获取所有供应商列表
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 供应商列表
   */
  static async getAll(filters = {}) {
    try {
      let query = db('truck_contacts')
        .where('is_deleted', false);
      
      // 只显示启用的
      if (filters.activeOnly) {
        query = query.where('is_active', true);
      }
      
      // 搜索
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('mc_number', 'ilike', searchTerm)
            .orWhere('truck_company_name', 'ilike', searchTerm)
            .orWhere('truck_contact', 'ilike', searchTerm);
        });
      }
      
      // 排序
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.orderBy(sortBy, sortOrder);
      
      // 分页
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
        if (filters.offset) {
          query = query.offset(parseInt(filters.offset));
        }
      }
      
      const vendors = await query.select('*');
      return vendors;
    } catch (error) {
      console.error('获取供应商列表失败:', error);
      throw error;
    }
  }

  /**
   * 通过ID获取供应商
   * @param {number} id - 供应商ID
   * @returns {Promise<Object>} 供应商信息
   */
  static async getById(id) {
    try {
      const vendor = await db('truck_contacts')
        .where({ id, is_deleted: false })
        .first();
      
      if (!vendor) {
        throw new Error('供应商不存在');
      }
      
      return vendor;
    } catch (error) {
      console.error('获取供应商失败:', error);
      throw error;
    }
  }

  /**
   * 创建供应商
   * @param {Object} data - 供应商数据
   * @param {number} createdBy - 创建者ID
   * @returns {Promise<Object>} 创建的供应商
   */
  static async create(data, createdBy) {
    try {
      const insertData = {
        // 基本信息
        mc_number: data.mc_number?.trim(),
        truck_company_name: data.truck_company_name?.trim(),
        truck_contact: data.truck_contact?.trim(),
        notes: data.notes?.trim() || null,
        
        // 地址信息
        company_address: data.company_address?.trim() || null,
        company_city: data.company_city?.trim() || null,
        company_state: data.company_state?.trim() || null,
        company_zipcode: data.company_zipcode?.trim() || null,
        company_country: data.company_country || 'USA',
        
        // 付款信息
        payment_method: data.payment_method || null,
        bank_name: data.bank_name?.trim() || null,
        account_number: data.account_number?.trim() || null,
        routing_number: data.routing_number?.trim() || null,
        zelle_info: data.zelle_info?.trim() || null,
        check_payable_to: data.check_payable_to?.trim() || null,
        check_mailing_address: data.check_mailing_address?.trim() || null,
        
        // 税务信息
        tax_id: data.tax_id?.trim() || null,
        w9_on_file: data.w9_on_file || false,
        
        // 状态
        is_active: data.is_active !== false,
        
        // 审计
        created_by: createdBy
      };
      
      const [vendor] = await db('truck_contacts')
        .insert(insertData)
        .returning('*');
      
      console.log(`✅ 供应商创建成功: ${vendor.truck_company_name}`);
      return vendor;
    } catch (error) {
      console.error('创建供应商失败:', error);
      throw error;
    }
  }

  /**
   * 更新供应商
   * @param {number} id - 供应商ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新后的供应商
   */
  static async update(id, data) {
    try {
      const allowedFields = [
        'mc_number', 'truck_company_name', 'truck_contact', 'notes',
        'company_address', 'company_city', 'company_state', 'company_zipcode', 'company_country',
        'payment_method', 'bank_name', 'account_number', 'routing_number',
        'zelle_info', 'check_payable_to', 'check_mailing_address',
        'tax_id', 'w9_on_file', 'is_active'
      ];
      
      const updateData = { updated_at: new Date() };
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
        }
      });
      
      const [vendor] = await db('truck_contacts')
        .where({ id, is_deleted: false })
        .update(updateData)
        .returning('*');
      
      if (!vendor) {
        throw new Error('供应商不存在');
      }
      
      console.log(`✅ 供应商更新成功: ${vendor.truck_company_name}`);
      return vendor;
    } catch (error) {
      console.error('更新供应商失败:', error);
      throw error;
    }
  }

  /**
   * 删除供应商(软删除)
   * @param {number} id - 供应商ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    try {
      const [vendor] = await db('truck_contacts')
        .where({ id, is_deleted: false })
        .update({ is_deleted: true, updated_at: new Date() })
        .returning('*');
      
      if (!vendor) {
        throw new Error('供应商不存在');
      }
      
      console.log(`✅ 供应商删除成功: ${vendor.truck_company_name}`);
      return { success: true, message: '供应商已删除' };
    } catch (error) {
      console.error('删除供应商失败:', error);
      throw error;
    }
  }

  /**
   * 搜索供应商(用于自动补全)
   * @param {string} keyword - 搜索关键词
   * @param {string} field - 搜索字段
   * @returns {Promise<Array>} 搜索结果
   */
  static async search(keyword, field = null) {
    try {
      if (!keyword || keyword.trim().length < 1) {
        return [];
      }
      
      const searchTerm = `%${keyword.trim()}%`;
      
      let query = db('truck_contacts')
        .where('is_deleted', false)
        .where('is_active', true)
        .limit(10);
      
      if (field === 'mc_number') {
        query = query.where('mc_number', 'ilike', searchTerm);
      } else if (field === 'truck_company_name') {
        query = query.where('truck_company_name', 'ilike', searchTerm);
      } else {
        query = query.where(function() {
          this.where('mc_number', 'ilike', searchTerm)
            .orWhere('truck_company_name', 'ilike', searchTerm)
            .orWhere('truck_contact', 'ilike', searchTerm);
        });
      }
      
      const vendors = await query.select(
        'id', 'mc_number', 'truck_company_name', 'truck_contact',
        'payment_method', 'company_city', 'company_state'
      );
      
      return vendors;
    } catch (error) {
      console.error('搜索供应商失败:', error);
      throw error;
    }
  }

  /**
   * 获取供应商统计
   * @param {number} vendorId - 供应商ID
   * @returns {Promise<Object>} 统计信息
   */
  static async getStats(vendorId) {
    try {
      const stats = await db('employee_orders')
        .where('vendor_id', vendorId)
        .where('is_deleted', false)
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders"),
          db.raw('COALESCE(SUM(driver_payment), 0) as total_paid')
        )
        .first();
      
      return {
        totalOrders: parseInt(stats.total_orders) || 0,
        completedOrders: parseInt(stats.completed_orders) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0
      };
    } catch (error) {
      console.error('获取供应商统计失败:', error);
      return { totalOrders: 0, completedOrders: 0, totalPaid: 0 };
    }
  }
}

module.exports = Vendor;

