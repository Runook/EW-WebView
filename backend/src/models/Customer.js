const { db } = require('../config/database');

class Customer {
  static async getCustomers(search = '') {
    try {
      let query = db('customers').select('*').orderBy('created_at', 'desc');
      if (search) {
        query = query.where(function() {
          this.where('company_name', 'ilike', `%${search}%`)
            .orWhere('wechat_group_name', 'ilike', `%${search}%`)
            .orWhere('contact_email', 'ilike', `%${search}%`)
            .orWhere('contact_phone', 'ilike', `%${search}%`)
            .orWhereRaw("aliases::text ILIKE ?", [`%${search}%`]);
        });
      }
      return await query;
    } catch (error) {
      console.error('Failed to get customers:', error);
      throw error;
    }
  }

  static async searchCustomers(keyword) {
    try {
      return await db('customers')
        .where(function() {
          this.where('company_name', 'ilike', `%${keyword}%`)
            .orWhere('wechat_group_name', 'ilike', `%${keyword}%`)
            .orWhereRaw("aliases::text ILIKE ?", [`%${keyword}%`]);
        })
        .select('id', 'company_name', 'wechat_group_name', 'contact_phone', 'contact_email',
                'billing_address', 'billing_address2', 'billing_city', 'billing_state', 'aliases')
        .limit(10);
    } catch (error) {
      console.error('Failed to search customers:', error);
      throw error;
    }
  }

  static async getByName(companyName) {
    try {
      let customer = await db('customers')
        .whereRaw('LOWER(company_name) = LOWER(?)', [companyName])
        .first();
      if (!customer) {
        customer = await db('customers')
          .whereRaw("EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(aliases, '[]'::jsonb)) a WHERE LOWER(a) = LOWER(?))", [companyName])
          .first();
      }
      return customer;
    } catch (error) {
      console.error('Failed to get customer by name:', error);
      throw error;
    }
  }

  /**
   * 确保客户存在：按公司名（大小写不敏感 + alias）查找，找不到就新建。
   * 用于订单创建/更新时把 inquiry_company 同步到 customers 表。
   *
   * @param {string} companyName   - 公司名
   * @param {Object} extras        - 新建时填充的额外字段（联系人/邮箱/电话等）
   * @param {number} createdBy     - 创建者 user id
   * @returns {Promise<Object|null>} customer 记录；输入为空/占位符时返回 null
   */
  static async ensureByName(companyName, extras = {}, createdBy = null) {
    if (!companyName) return null;
    const name = String(companyName).trim();
    if (!name) return null;
    // 员工系统常见的占位符 —— 不要当作真正的客户
    const PLACEHOLDERS = ['新建订单', 'AI Import', '待填写', '-', 'N/A', 'NA', 'Unknown', '未知'];
    if (PLACEHOLDERS.includes(name)) return null;

    try {
      const existing = await this.getByName(name);
      if (existing) return existing;
      const created = await this.createCustomer({
        company_name: name,
        contact_person: extras.contact_person || null,
        contact_email: extras.contact_email || null,
        contact_phone: extras.contact_phone || null,
        billing_address: extras.billing_address || null,
        billing_city: extras.billing_city || null,
        billing_state: extras.billing_state || null,
        billing_zipcode: extras.billing_zipcode || null,
        notes: extras.notes || '自动创建于订单流程',
      }, createdBy);
      console.log(`✅ Auto-created customer: ${name} (id=${created?.id})`);
      return created;
    } catch (err) {
      console.warn(`ensureByName skipped for "${name}":`, err.message);
      return null;
    }
  }

  static async createCustomer(customerData, createdBy) {
    try {
      const [customer] = await db('customers')
        .insert({
          company_name: customerData.company_name,
          wechat_group_name: customerData.wechat_group_name || null,
          contact_person: customerData.contact_person || null,
          contact_phone: customerData.contact_phone || null,
          contact_email: customerData.contact_email || null,
          billing_address: customerData.billing_address || null,
          billing_address2: customerData.billing_address2 || null,
          billing_city: customerData.billing_city || null,
          billing_state: customerData.billing_state || null,
          billing_zipcode: customerData.billing_zipcode || null,
          billing_country: customerData.billing_country || 'USA',
          payment_terms: customerData.payment_terms || 'Net 7',
          tax_id: customerData.tax_id || null,
          late_fee_rate: customerData.late_fee_rate || null,
          late_fee_fixed: customerData.late_fee_fixed || null,
          aliases: customerData.aliases ? JSON.stringify(customerData.aliases) : '[]',
          notes: customerData.notes || null,
          is_active: customerData.is_active !== false,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return customer;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  static async updateCustomer(id, customerData) {
    try {
      const [customer] = await db('customers')
        .where({ id })
        .update({ ...customerData, updated_at: new Date() })
        .returning('*');
      return customer;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  static async deleteCustomer(id) {
    try {
      await db('customers').where({ id }).delete();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }
}

module.exports = Customer;
