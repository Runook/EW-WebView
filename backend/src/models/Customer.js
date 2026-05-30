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
   * 模糊匹配客户：用于 AI 解析时把识别到的公司名/收货人名对应到 customer list。
   * 匹配优先级：
   *   1. 精确（含 alias，大小写不敏感）
   *   2. 客户名是输入文本的子串（如输入 "ABC Trading LLC" 命中客户 "ABC Trading"）
   *   3. 输入文本是客户名的子串（如输入 "ABC" 命中客户 "ABC Trading"）
   * 返回 customer 记录或 null（无相关匹配时由调用方决定直接用原始文本）。
   */
  static async matchByName(name) {
    if (!name || !String(name).trim()) return null;
    const n = String(name).trim();
    try {
      // 1. 精确 / alias
      const exact = await this.getByName(n);
      if (exact) return exact;

      // 2. 客户名是输入文本的子串（取最长匹配，避免误中很短的名字）
      let c = await db('customers')
        .whereRaw('LENGTH(company_name) >= 3 AND ? ILIKE (\'%\' || company_name || \'%\')', [n])
        .orderByRaw('LENGTH(company_name) DESC')
        .first();
      if (c) return c;

      // 3. 输入文本是客户名的子串（取最短客户名，最接近输入）
      if (n.length >= 3) {
        c = await db('customers')
          .whereRaw('company_name ILIKE ?', [`%${n}%`])
          .orderByRaw('LENGTH(company_name) ASC')
          .first();
        if (c) return c;
      }

      return null;
    } catch (error) {
      console.error('Failed to match customer by name:', error);
      return null;
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
      // 先动态检查列是否存在，避免在某些环境下（迁移未同步）整条 insert 崩
      const hasBillingAddr2 = await db.schema.hasColumn('customers', 'billing_address2');

      const payload = {
        company_name: customerData.company_name,
        wechat_group_name: customerData.wechat_group_name || null,
        contact_person: customerData.contact_person || null,
        contact_phone: customerData.contact_phone || null,
        contact_email: customerData.contact_email || null,
        billing_address: customerData.billing_address || null,
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
      };
      if (hasBillingAddr2) {
        payload.billing_address2 = customerData.billing_address2 || null;
      }

      const [customer] = await db('customers').insert(payload).returning('*');
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
