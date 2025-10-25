const { db } = require('../config/database');

class Customer {
  /**
   * 获取所有客户
   */
  static async getCustomers(search = '') {
    try {
      let query = db('customers').select('*').orderBy('created_at', 'desc');
      
      if (search) {
        query = query.where(function() {
          this.where('company_name', 'ilike', `%${search}%`)
            .orWhere('wechat_group_name', 'ilike', `%${search}%`);
        });
      }
      
      const customers = await query;
      return customers;
    } catch (error) {
      console.error('获取客户列表失败:', error);
      throw error;
    }
  }

  /**
   * 搜索客户（用于自动补全）
   */
  static async searchCustomers(keyword) {
    try {
      const customers = await db('customers')
        .where(function() {
          this.where('company_name', 'ilike', `%${keyword}%`)
            .orWhere('wechat_group_name', 'ilike', `%${keyword}%`);
        })
        .select('id', 'company_name', 'wechat_group_name')
        .limit(10);
      
      return customers;
    } catch (error) {
      console.error('搜索客户失败:', error);
      throw error;
    }
  }

  /**
   * 创建客户
   */
  static async createCustomer(customerData, createdBy) {
    try {
      const [customer] = await db('customers')
        .insert({
          company_name: customerData.company_name,
          wechat_group_name: customerData.wechat_group_name || null,
          contact_person: customerData.contact_person || null,
          contact_phone: customerData.contact_phone || null,
          contact_email: customerData.contact_email || null,
          notes: customerData.notes || null,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      console.log('✅ 客户创建成功:', customer);
      return customer;
    } catch (error) {
      console.error('创建客户失败:', error);
      throw error;
    }
  }

  /**
   * 更新客户
   */
  static async updateCustomer(id, customerData) {
    try {
      const [customer] = await db('customers')
        .where({ id })
        .update({
          ...customerData,
          updated_at: new Date()
        })
        .returning('*');
      
      return customer;
    } catch (error) {
      console.error('更新客户失败:', error);
      throw error;
    }
  }

  /**
   * 删除客户
   */
  static async deleteCustomer(id) {
    try {
      await db('customers').where({ id }).delete();
      return { success: true };
    } catch (error) {
      console.error('删除客户失败:', error);
      throw error;
    }
  }
}

module.exports = Customer;

