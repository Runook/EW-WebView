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
            .orWhere('contact_phone', 'ilike', `%${search}%`);
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
            .orWhere('wechat_group_name', 'ilike', `%${keyword}%`);
        })
        .select('id', 'company_name', 'wechat_group_name', 'contact_phone', 'contact_email',
                'billing_address', 'billing_address2', 'billing_city', 'billing_state')
        .limit(10);
    } catch (error) {
      console.error('Failed to search customers:', error);
      throw error;
    }
  }

  static async getByName(companyName) {
    try {
      return await db('customers')
        .whereRaw('LOWER(company_name) = LOWER(?)', [companyName])
        .first();
    } catch (error) {
      console.error('Failed to get customer by name:', error);
      throw error;
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
