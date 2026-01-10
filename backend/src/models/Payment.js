const { db } = require('../config/database');

/**
 * 付款记录模型 - 跟踪客户付款和供应商付款
 */
class Payment {
  static async getAll(filters = {}) {
    try {
      let query = db('payments as p')
        .leftJoin('employee_orders as o', 'p.order_id', 'o.id')
        .leftJoin('customers as c', 'p.customer_id', 'c.id')
        .leftJoin('truck_contacts as v', 'p.vendor_id', 'v.id')
        .select(
          'p.*',
          'o.order_number',
          'o.customer_name as order_customer_name',
          'c.company_name as customer_name',
          'v.truck_company_name as vendor_name',
          'v.mc_number as vendor_mc'
        );
      
      if (filters.payment_type) query = query.where('p.payment_type', filters.payment_type);
      if (filters.order_id) query = query.where('p.order_id', filters.order_id);
      if (filters.customer_id) query = query.where('p.customer_id', filters.customer_id);
      if (filters.vendor_id) query = query.where('p.vendor_id', filters.vendor_id);
      if (filters.status) query = query.where('p.status', filters.status);
      if (filters.date_from) query = query.where('p.payment_date', '>=', filters.date_from);
      if (filters.date_to) query = query.where('p.payment_date', '<=', filters.date_to);
      
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('o.order_number', 'ilike', searchTerm)
            .orWhere('p.reference_number', 'ilike', searchTerm)
            .orWhere('c.company_name', 'ilike', searchTerm)
            .orWhere('v.truck_company_name', 'ilike', searchTerm);
        });
      }
      
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('p.id as count');
      const total = parseInt(count) || 0;
      
      const sortBy = filters.sort_by || 'payment_date';
      const sortOrder = filters.sort_order || 'desc';
      query = query.orderBy(`p.${sortBy}`, sortOrder);
      
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;
      
      const payments = await query.limit(limit).offset(offset);
      
      return {
        payments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('获取付款记录失败:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const payment = await db('payments as p')
        .leftJoin('employee_orders as o', 'p.order_id', 'o.id')
        .leftJoin('customers as c', 'p.customer_id', 'c.id')
        .leftJoin('truck_contacts as v', 'p.vendor_id', 'v.id')
        .leftJoin('users as u', 'p.created_by', 'u.id')
        .select(
          'p.*',
          'o.order_number',
          'o.customer_name as order_customer_name',
          'o.ew_final_price as order_amount',
          'c.company_name as customer_name',
          'v.truck_company_name as vendor_name',
          'v.mc_number as vendor_mc',
          db.raw("CONCAT(u.first_name, ' ', u.last_name) as created_by_name")
        )
        .where('p.id', id)
        .first();
      
      if (!payment) throw new Error('付款记录不存在');
      return payment;
    } catch (error) {
      console.error('获取付款记录失败:', error);
      throw error;
    }
  }

  static async create(data, createdBy) {
    const trx = await db.transaction();
    
    try {
      const insertData = {
        payment_type: data.payment_type,
        order_id: data.order_id || null,
        customer_id: data.customer_id || null,
        vendor_id: data.vendor_id || null,
        amount: data.amount,
        currency: data.currency || 'USD',
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number?.trim() || null,
        memo: data.memo?.trim() || null,
        status: data.status || 'completed',
        created_by: createdBy
      };
      
      const [payment] = await trx('payments').insert(insertData).returning('*');
      
      // 更新订单付款信息
      if (data.order_id) {
        if (data.payment_type === 'customer_payment') {
          const order = await trx('employee_orders').where('id', data.order_id).first();
          if (order) {
            const newPaidAmount = parseFloat(order.paid_amount || 0) + parseFloat(data.amount);
            const orderTotal = parseFloat(order.ew_final_price || order.final_price || 0);
            
            let paymentStatus = 'unpaid';
            if (newPaidAmount >= orderTotal) paymentStatus = 'paid';
            else if (newPaidAmount > 0) paymentStatus = 'partial';
            
            await trx('employee_orders').where('id', data.order_id).update({
              paid_amount: newPaidAmount,
              payment_status: paymentStatus,
              customer_payment_date: data.payment_date,
              customer_payment_method: data.payment_method,
              customer_payment_reference: data.reference_number
            });
          }
        } else if (data.payment_type === 'vendor_payment') {
          await trx('employee_orders').where('id', data.order_id).update({
            vendor_payment_date: data.payment_date,
            vendor_payment_method: data.payment_method,
            vendor_payment_reference: data.reference_number
          });
        }
      }
      
      await trx.commit();
      console.log(`✅ 付款记录创建成功: ${payment.payment_type} - $${payment.amount}`);
      return payment;
    } catch (error) {
      await trx.rollback();
      console.error('创建付款记录失败:', error);
      throw error;
    }
  }

  static async update(id, data, updatedBy) {
    try {
      const allowedFields = ['amount', 'payment_date', 'payment_method', 'reference_number', 'memo', 'status'];
      const updateData = { updated_at: new Date(), updated_by: updatedBy };
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
        }
      });
      
      const [payment] = await db('payments').where('id', id).update(updateData).returning('*');
      if (!payment) throw new Error('付款记录不存在');
      return payment;
    } catch (error) {
      console.error('更新付款记录失败:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const deleted = await db('payments').where('id', id).del();
      if (!deleted) throw new Error('付款记录不存在');
      return { success: true, message: '付款记录已删除' };
    } catch (error) {
      console.error('删除付款记录失败:', error);
      throw error;
    }
  }

  static async getByOrderId(orderId) {
    try {
      return await db('payments as p')
        .leftJoin('users as u', 'p.created_by', 'u.id')
        .select('p.*', db.raw("CONCAT(u.first_name, ' ', u.last_name) as created_by_name"))
        .where('p.order_id', orderId)
        .orderBy('p.payment_date', 'desc');
    } catch (error) {
      console.error('获取订单付款记录失败:', error);
      throw error;
    }
  }

  static async getStatistics(filters = {}) {
    try {
      let query = db('payments').where('status', 'completed');
      
      if (filters.date_from) query = query.where('payment_date', '>=', filters.date_from);
      if (filters.date_to) query = query.where('payment_date', '<=', filters.date_to);
      
      const stats = await query.select(
        db.raw("SUM(CASE WHEN payment_type = 'customer_payment' THEN amount ELSE 0 END) as total_received"),
        db.raw("SUM(CASE WHEN payment_type = 'vendor_payment' THEN amount ELSE 0 END) as total_paid"),
        db.raw("COUNT(CASE WHEN payment_type = 'customer_payment' THEN 1 END) as customer_payment_count"),
        db.raw("COUNT(CASE WHEN payment_type = 'vendor_payment' THEN 1 END) as vendor_payment_count")
      ).first();
      
      return {
        totalReceived: parseFloat(stats.total_received) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0,
        netAmount: (parseFloat(stats.total_received) || 0) - (parseFloat(stats.total_paid) || 0),
        customerPaymentCount: parseInt(stats.customer_payment_count) || 0,
        vendorPaymentCount: parseInt(stats.vendor_payment_count) || 0
      };
    } catch (error) {
      console.error('获取付款统计失败:', error);
      throw error;
    }
  }
}

module.exports = Payment;

