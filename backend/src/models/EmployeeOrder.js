const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Order {
  /**
   * 创建新订单
   * @param {Object} orderData - 订单数据
   * @param {number} createdBy - 创建者员工ID
   * @returns {Promise<Object>} 创建的订单
   */
  static async createOrder(orderData, createdBy) {
    const trx = await db.transaction();
    
    try {
      // 生成订单编号
      const orderNumber = await this.generateOrderNumber();
      
      // 获取美东时间的今日日期 (YYYY-MM-DD格式) 作为默认报价日期
      const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      
      const insertData = {
        order_number: orderNumber,
        customer_id: orderData.customer_id || null,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        order_type: orderData.order_type,
        status: orderData.status || 'quote', // 默认为报价单
        sub_status: orderData.sub_status || null,
        priority: orderData.priority || 'normal',
        
        // 货物描述（必填字段）
        cargo_description: orderData.cargo_description || orderData.cargo_description_detailed || orderData.inquiry_company || '',
        
        // Broker专用字段 - 使用美东时间作为默认日期
        quote_date: orderData.quote_date || nyDate,
        inquiry_company: orderData.inquiry_company || null,
        ew_quote_number: orderData.ew_quote_number || null,
        shipment_number: orderData.shipment_number || null,
        cargo_description_detailed: orderData.cargo_description_detailed || orderData.cargo_description || null,
        weight_list: orderData.weight_list || null,
        total_weight_lbs: orderData.total_weight_lbs || null,
        dimensions_list: orderData.dimensions_list || null,
        total_volume: orderData.total_volume || null,
        cargo_value: orderData.cargo_value || null,
        address_type: orderData.address_type || 'Commercial',
        ew_quote_price: orderData.ew_quote_price || null,
        actual_pallets: orderData.actual_pallets || null,
        total_dat: orderData.total_dat || null,
        driver_payment: orderData.driver_payment || null,
        truck_size: orderData.truck_size || null,
        platform_quote_1: orderData.platform_quote_1 || null,
        platform_quote_2: orderData.platform_quote_2 || null,
        pre_quote_price: orderData.pre_quote_price || null,
        ew_final_price: orderData.ew_final_price || null,
        dat_sales_1: orderData.dat_sales_1 || null,
        dat_sales_2: orderData.dat_sales_2 || null,
        dat_sales_3: orderData.dat_sales_3 || null,
        profit: orderData.profit || null,
        
        // 地址信息
        origin_address: orderData.origin_address || null,
        origin_city: orderData.origin_city || null,
        origin_state: orderData.origin_state || null,
        origin_country: orderData.origin_country || null,
        origin_zipcode: orderData.origin_zipcode || null,
        destination_address: orderData.destination_address || null,
        destination_city: orderData.destination_city || null,
        destination_state: orderData.destination_state || null,
        destination_country: orderData.destination_country || null,
        destination_zipcode: orderData.destination_zipcode || null,
        
        // 其他
        pickup_date: orderData.pickup_date || null,
        delivery_date: orderData.delivery_date || null,
        estimated_delivery: orderData.estimated_delivery || null,
        quoted_price: orderData.quoted_price || null,
        final_price: orderData.final_price || null,
        currency: orderData.currency || 'USD',
        notes: orderData.notes || null,
        internal_notes: orderData.internal_notes || null,
        custom_fields: orderData.custom_fields ? JSON.stringify(orderData.custom_fields) : null,
        created_by: createdBy,
        assigned_to: orderData.assigned_to || createdBy
      };
      
      const [order] = await trx('employee_orders')
        .insert(insertData)
        .returning('*');
      
      // 记录创建日志
      await trx('employee_order_logs').insert({
        order_id: order.id,
        user_id: createdBy,
        action_type: 'created',
        description: `订单创建: ${orderNumber}`
      });
      
      await trx.commit();
      
      console.log(`✅ 订单创建成功: ${orderNumber}`);
      
      return order;
    } catch (error) {
      await trx.rollback();
      console.error('创建订单失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取订单列表（支持过滤和分页）
   * @param {Object} filters - 过滤条件
   * @param {number} employeeId - 员工ID (null表示查看所有)
   * @param {boolean} viewAll - 是否可以查看所有订单
   * @returns {Promise<Object>} 订单列表和分页信息
   */
  static async getOrders(filters = {}, employeeId = null, viewAll = false) {
    try {
      let query = db('employee_orders as eo')
        .leftJoin('users as creator', 'eo.created_by', 'creator.id')
        .leftJoin('users as assignee', 'eo.assigned_to', 'assignee.id')
        .leftJoin('users as confirmer', 'eo.confirmed_by', 'confirmer.id')
        .leftJoin('users as completer', 'eo.completed_by', 'completer.id')
        .leftJoin('users as canceller', 'eo.cancelled_by', 'canceller.id')
        .leftJoin('users as customer', 'eo.customer_id', 'customer.id')
        .select(
          'eo.*',
          db.raw('json_build_object(\'id\', creator.id, \'name\', CONCAT(creator.first_name, \' \', creator.last_name), \'email\', creator.email) as creator_info'),
          db.raw('json_build_object(\'id\', assignee.id, \'name\', CONCAT(assignee.first_name, \' \', assignee.last_name), \'email\', assignee.email) as assignee_info'),
          db.raw('CASE WHEN confirmer.id IS NOT NULL THEN json_build_object(\'id\', confirmer.id, \'name\', CONCAT(confirmer.first_name, \' \', confirmer.last_name), \'email\', confirmer.email) ELSE NULL END as confirmer_info'),
          db.raw('CASE WHEN completer.id IS NOT NULL THEN json_build_object(\'id\', completer.id, \'name\', CONCAT(completer.first_name, \' \', completer.last_name), \'email\', completer.email) ELSE NULL END as completer_info'),
          db.raw('CASE WHEN canceller.id IS NOT NULL THEN json_build_object(\'id\', canceller.id, \'name\', CONCAT(canceller.first_name, \' \', canceller.last_name), \'email\', canceller.email) ELSE NULL END as canceller_info'),
          db.raw('CASE WHEN customer.id IS NOT NULL THEN json_build_object(\'id\', customer.id, \'email\', customer.email) ELSE NULL END as customer_info')
        )
        .where('eo.is_deleted', false);
      
      // 权限过滤：如果不能查看所有订单，只显示自己的
      if (!viewAll && employeeId) {
        query = query.where(function() {
          this.where('eo.created_by', employeeId)
            .orWhere('eo.assigned_to', employeeId);
        });
      }
      
      // 应用过滤条件
      if (filters.status) {
        if (filters.status === 'claim') {
          // 索赔状态：需要索赔的订单
          query = query.where('eo.needs_claim', true);
        } else {
          query = query.where('eo.status', filters.status);
        }
      }
      
      if (filters.order_type) {
        query = query.where('eo.order_type', filters.order_type);
      }
      
      if (filters.priority) {
        query = query.where('eo.priority', filters.priority);
      }
      
      if (filters.payment_status) {
        query = query.where('eo.payment_status', filters.payment_status);
      }
      
      if (filters.assigned_to) {
        query = query.where('eo.assigned_to', filters.assigned_to);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('eo.order_number', 'ilike', `%${filters.search}%`)
            .orWhere('eo.customer_name', 'ilike', `%${filters.search}%`)
            .orWhere('eo.customer_email', 'ilike', `%${filters.search}%`)
            .orWhere('eo.cargo_description', 'ilike', `%${filters.search}%`);
        });
      }
      
      if (filters.date_from) {
        query = query.where('eo.created_at', '>=', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.where('eo.created_at', '<=', filters.date_to);
      }
      
      // 计算总数（使用简化的查询）
      let countQuery = db('employee_orders as eo')
        .where('eo.is_deleted', false);
      
      // 应用相同的过滤条件
      if (!viewAll && employeeId) {
        countQuery = countQuery.where(function() {
          this.where('eo.created_by', employeeId)
            .orWhere('eo.assigned_to', employeeId);
        });
      }
      
      if (filters.status) {
        if (filters.status === 'claim') {
          // 索赔状态：需要索赔的订单
          countQuery = countQuery.where('eo.needs_claim', true);
        } else {
          countQuery = countQuery.where('eo.status', filters.status);
        }
      }
      
      if (filters.order_type) {
        countQuery = countQuery.where('eo.order_type', filters.order_type);
      }
      
      if (filters.priority) {
        countQuery = countQuery.where('eo.priority', filters.priority);
      }
      
      if (filters.payment_status) {
        countQuery = countQuery.where('eo.payment_status', filters.payment_status);
      }
      
      if (filters.assigned_to) {
        countQuery = countQuery.where('eo.assigned_to', filters.assigned_to);
      }
      
      if (filters.search) {
        countQuery = countQuery.where(function() {
          this.where('eo.order_number', 'ilike', `%${filters.search}%`)
            .orWhere('eo.customer_name', 'ilike', `%${filters.search}%`)
            .orWhere('eo.customer_email', 'ilike', `%${filters.search}%`)
            .orWhere('eo.cargo_description_detailed', 'ilike', `%${filters.search}%`)
            .orWhere('eo.inquiry_company', 'ilike', `%${filters.search}%`);
        });
      }
      
      if (filters.date_from) {
        countQuery = countQuery.where('eo.created_at', '>=', filters.date_from);
      }
      
      if (filters.date_to) {
        countQuery = countQuery.where('eo.created_at', '<=', filters.date_to);
      }
      
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count) || 0;
      
      // 分页
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;
      
      // 排序（默认按报价日期降序，最新的在最上面）
      const sortBy = filters.sort_by || 'quote_date';
      const sortOrder = filters.sort_order || 'desc';
      
      if (sortBy === 'quote_date') {
        // 报价日期排序，NULL值放最后
        query = query.orderByRaw(`eo.quote_date ${sortOrder.toUpperCase()} NULLS LAST`);
      } else {
        query = query.orderBy(`eo.${sortBy}`, sortOrder);
      }
      
      // 次要排序：创建时间（确保一致性）
      query = query.orderBy('eo.created_at', 'desc');
      
      // 执行查询
      const orders = await query.limit(limit).offset(offset);
      
      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过ID获取订单详情
   * @param {number} orderId - 订单ID
   * @param {number} employeeId - 员工ID
   * @param {boolean} viewAll - 是否可以查看所有订单
   * @returns {Promise<Object>} 订单详情
   */
  static async getOrderById(orderId, employeeId = null, viewAll = false) {
    try {
      let query = db('employee_orders as eo')
        .leftJoin('users as creator', 'eo.created_by', 'creator.id')
        .leftJoin('users as assignee', 'eo.assigned_to', 'assignee.id')
        .select(
          'eo.*',
          db.raw('json_build_object(\'id\', creator.id, \'name\', CONCAT(creator.first_name, \' \', creator.last_name), \'email\', creator.email, \'employee_id\', creator.employee_id) as creator_info'),
          db.raw('json_build_object(\'id\', assignee.id, \'name\', CONCAT(assignee.first_name, \' \', assignee.last_name), \'email\', assignee.email, \'employee_id\', assignee.employee_id) as assignee_info')
        )
        .where('eo.id', orderId)
        .where('eo.is_deleted', false);
      
      // 权限检查
      if (!viewAll && employeeId) {
        query = query.where(function() {
          this.where('eo.created_by', employeeId)
            .orWhere('eo.assigned_to', employeeId);
        });
      }
      
      const order = await query.first();
      
      if (!order) {
        throw new Error('订单不存在或无权限查看');
      }
      
      // 获取订单日志
      const logs = await db('employee_order_logs as eol')
        .join('users as u', 'eol.user_id', 'u.id')
        .select(
          'eol.*',
          db.raw('json_build_object(\'id\', u.id, \'name\', CONCAT(u.first_name, \' \', u.last_name), \'email\', u.email) as user_info')
        )
        .where('eol.order_id', orderId)
        .orderBy('eol.created_at', 'desc');
      
      // 获取订单评论
      const comments = await db('employee_order_comments as eoc')
        .join('users as u', 'eoc.user_id', 'u.id')
        .select(
          'eoc.*',
          db.raw('json_build_object(\'id\', u.id, \'name\', CONCAT(u.first_name, \' \', u.last_name), \'email\', u.email) as user_info')
        )
        .where('eoc.order_id', orderId)
        .where('eoc.is_deleted', false)
        .orderBy('eoc.created_at', 'desc');
      
      return {
        ...order,
        logs,
        comments
      };
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新订单
   * @param {number} orderId - 订单ID
   * @param {Object} updateData - 更新数据
   * @param {number} updatedBy - 更新者员工ID
   * @param {boolean} canEditAll - 是否可以编辑所有订单
   * @returns {Promise<Object>} 更新后的订单
   */
  static async updateOrder(orderId, updateData, updatedBy, canEditAll = false, changeOperator = false) {
    const trx = await db.transaction();
    
    try {
      // 先获取订单和用户信息
      const existingOrder = await trx('employee_orders')
        .where('id', orderId)
        .where('is_deleted', false)
        .first();
      
      if (!existingOrder) {
        throw new Error('订单不存在');
      }
      
      // 获取用户角色
      const user = await trx('users')
        .select('employee_role', 'first_name', 'last_name')
        .where('id', updatedBy)
        .first();
      
      const isEmployee = user.employee_role === 'employee';
      const isOwnOrder = existingOrder.created_by === updatedBy || existingOrder.assigned_to === updatedBy;
      const isQuote = existingOrder.status === 'quote';
      
      // 权限检查逻辑
      if (isEmployee && !isQuote && !isOwnOrder && !changeOperator) {
        // 员工编辑非报价单的其他人订单，需要确认更换操作员
        const operator = await trx('users')
          .select('first_name', 'last_name', 'email')
          .where('id', existingOrder.created_by)
          .first();
        
        const error = new Error('订单权限确认');
        error.code = 'OPERATOR_CHANGE_REQUIRED';
        error.details = {
          orderId: orderId,
          currentOperator: {
            id: existingOrder.created_by,
            name: `${operator?.first_name || ''} ${operator?.last_name || ''}`.trim(),
            email: operator?.email
          },
          newOperator: {
            id: updatedBy,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
          },
          orderNumber: existingOrder.order_number,
          status: existingOrder.status
        };
        throw error;
      }
      
      // 如果不能编辑所有订单，检查权限
      if (!canEditAll && !isQuote && !changeOperator) {
        if (!isOwnOrder) {
          throw new Error('订单不存在或无权限修改');
        }
      }
      
      // 过滤允许更新的字段
      const allowedFields = [
        'customer_name', 'customer_email', 'customer_phone',
        'order_type', 'status', 'sub_status', 'priority',
        // Broker专用字段
        'quote_date', 'inquiry_company', 'ew_quote_number', 'shipment_number',
        'cargo_type', 'cargo_description_detailed', 'weight_list', 'total_weight_lbs',
        'dimensions_list', 'total_volume', 'cargo_value', 'address_type',
        'ew_quote_price', 'actual_pallets', 'total_area_pallets', 'total_dat', 'driver_payment', 'truck_size',
        'platform_quote_1', 'platform_quote_2', 'pre_quote_price', 'ew_final_price',
        'dat_sales_1', 'dat_sales_2', 'dat_sales_3', 'profit',
        'transport_distance', 'ideal_quote', 'truck_pallets', 
        'tql_price_1', 'tql_price_2', 'other_api_price',
        'quote_reference', 'quote_ref_10', 'quote_ref_20', 'quote_ref_30',
        'truck_payment', 'truck_reference_price', 'mc_number', 'truck_company_name', 'truck_contact',
        'dot_number', 'carrier_email', 'carrier_address', 'driver_name', 'driver_phone',
        // 备用司机信息
        'backup_driver_1_name', 'backup_driver_1_phone',
        'backup_driver_2_name', 'backup_driver_2_phone',
        'backup_driver_3_name', 'backup_driver_3_phone',
        // 地址
        'origin_address', 'origin_city', 'origin_state', 'origin_country', 'origin_zipcode',
        'destination_address', 'destination_city', 'destination_state', 'destination_country', 'destination_zipcode',
        // 其他
        'pickup_date', 'delivery_date', 'estimated_delivery',
        'quoted_price', 'final_price', 'currency', 'paid_amount', 'payment_status',
        'assigned_to', 'notes', 'internal_notes', 'tracking_info', 'custom_fields'
      ];
      
      const filteredData = {};
      const changes = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
          if (existingOrder[field] !== updateData[field]) {
            changes[field] = {
              old: existingOrder[field],
              new: updateData[field]
            };
          }
        }
      });
      
      if (Object.keys(filteredData).length === 0 && !changeOperator) {
        throw new Error('没有可更新的字段');
      }
      
      filteredData.updated_by = updatedBy;
      
      // 如果需要更换操作员，更新assigned_to
      if (changeOperator && !isOwnOrder) {
        filteredData.assigned_to = updatedBy;
        changes.assigned_to = {
          old: existingOrder.assigned_to,
          new: updatedBy
        };
      }
      
      const [updatedOrder] = await trx('employee_orders')
        .where('id', orderId)
        .update(filteredData)
        .returning('*');
      
      // 记录更新日志
      if (Object.keys(changes).length > 0) {
        await trx('employee_order_logs').insert({
          order_id: orderId,
          user_id: updatedBy,
          action_type: 'updated',
          changes: JSON.stringify(changes),
          description: `订单更新: ${Object.keys(changes).join(', ')}`
        });
      }
      
      // 如果状态改变，记录状态变更日志
      if (changes.status) {
        await trx('employee_order_logs').insert({
          order_id: orderId,
          user_id: updatedBy,
          action_type: 'status_changed',
          old_value: changes.status.old,
          new_value: changes.status.new,
          description: `状态变更: ${changes.status.old} → ${changes.status.new}`
        });
      }
      
      await trx.commit();
      
      console.log(`✅ 订单更新成功: ${existingOrder.order_number}`);
      
      return updatedOrder;
    } catch (error) {
      await trx.rollback();
      console.error('更新订单失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除订单（软删除）
   * @param {number} orderId - 订单ID
   * @param {number} deletedBy - 删除者员工ID
   * @param {boolean} canDeleteAll - 是否可以删除所有订单
   * @returns {Promise<Object>} 操作结果
   */
  static async deleteOrder(orderId, deletedBy, canDeleteAll = false) {
    const trx = await db.transaction();
    
    try {
      let orderQuery = trx('employee_orders')
        .where('id', orderId)
        .where('is_deleted', false);
      
      if (!canDeleteAll) {
        orderQuery = orderQuery.where('created_by', deletedBy);
      }
      
      const order = await orderQuery.first();
      
      if (!order) {
        throw new Error('订单不存在或无权限删除');
      }
      
      await trx('employee_orders')
        .where('id', orderId)
        .update({ is_deleted: true });
      
      // 记录删除日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: deletedBy,
        action_type: 'updated',
        description: `订单删除: ${order.order_number}`
      });
      
      await trx.commit();
      
      console.log(`✅ 订单删除成功: ${order.order_number}`);
      
      return {
        success: true,
        message: '订单删除成功'
      };
    } catch (error) {
      await trx.rollback();
      console.error('删除订单失败:', error);
      throw error;
    }
  }
  
  /**
   * 添加订单评论
   * @param {number} orderId - 订单ID
   * @param {number} userId - 用户ID
   * @param {string} comment - 评论内容
   * @param {boolean} isInternal - 是否为内部评论
   * @returns {Promise<Object>} 评论信息
   */
  static async addComment(orderId, userId, comment, isInternal = true) {
    const trx = await db.transaction();
    
    try {
      const [newComment] = await trx('employee_order_comments')
        .insert({
          order_id: orderId,
          user_id: userId,
          comment: comment,
          is_internal: isInternal
        })
        .returning('*');
      
      // 记录日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: userId,
        action_type: 'commented',
        description: '添加了评论'
      });
      
      await trx.commit();
      
      return newComment;
    } catch (error) {
      await trx.rollback();
      console.error('添加评论失败:', error);
      throw error;
    }
  }
  
  /**
   * 生成订单编号（WE单号格式：WE1, WE2, WE3...）
   * @returns {Promise<string>} 订单编号
   */
  static async generateOrderNumber() {
    try {
      // 格式: WE + 数字（不补零，十进制递增：WE1, WE2, WE3...）
      const prefix = 'WE';
      
      // 获取所有订单号（包括旧的EW和新的WE），提取数字部分找到最大值
      const results = await db('employee_orders')
        .where(function() {
          this.where('order_number', 'like', 'WE%')
              .orWhere('order_number', 'like', 'EW%');
        })
        .select('order_number');
      
      let maxNumber = 0;
      
      // 遍历所有订单号，找到最大的数字（支持旧的EW和新的WE）
      results.forEach(row => {
        const match = row.order_number.match(/^(?:WE|EW)(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      // 下一个编号
      const nextNumber = maxNumber + 1;
      
      // 生成新订单号：WE + 数字（不补零）
      const orderNumber = `${prefix}${nextNumber}`;
      
      console.log('✅ 生成WE单号:', orderNumber);
      return orderNumber;
    } catch (error) {
      console.error('生成订单编号失败:', error);
      // 如果失败，使用时间戳
      const timestamp = Date.now().toString().slice(-6);
      return `WE${timestamp}`;
    }
  }
  
  /**
   * 获取订单统计信息（支持新的状态系统）
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics(filters = {}) {
    try {
      let query = db('employee_orders')
        .where('is_deleted', false);
      
      // 应用过滤条件
      if (filters.employee_id) {
        query = query.where(function() {
          this.where('created_by', filters.employee_id)
            .orWhere('assigned_to', filters.employee_id);
        });
      }
      
      if (filters.date_from) {
        query = query.where('created_at', '>=', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.where('created_at', '<=', filters.date_to);
      }
      
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      
      const stats = await query
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw("COUNT(CASE WHEN status = 'quote' THEN 1 END) as quote_orders"),
          db.raw("COUNT(CASE WHEN status = 'ordered' THEN 1 END) as ordered_orders"),
          db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders"),
          db.raw("COUNT(CASE WHEN status = 'ordered' AND sub_status = 'waiting_driver' THEN 1 END) as waiting_driver_count"),
          db.raw("COUNT(CASE WHEN status = 'ordered' AND sub_status = 'driver_found' THEN 1 END) as driver_found_count"),
          db.raw("COUNT(CASE WHEN status = 'ordered' AND sub_status = 'in_transit' THEN 1 END) as in_transit_count"),
          db.raw("COUNT(CASE WHEN needs_claim = true THEN 1 END) as claim_orders"),
          db.raw('COALESCE(SUM(ew_final_price), 0) as total_revenue'),
          db.raw('COALESCE(SUM(profit), 0) as total_profit'),
          db.raw('COALESCE(AVG(ew_final_price), 0) as average_order_value')
        )
        .first();
      
      return {
        totalOrders: parseInt(stats.total_orders) || 0,
        quoteOrders: parseInt(stats.quote_orders) || 0,
        orderedOrders: parseInt(stats.ordered_orders) || 0,
        completedOrders: parseInt(stats.completed_orders) || 0,
        waitingDriverCount: parseInt(stats.waiting_driver_count) || 0,
        driverFoundCount: parseInt(stats.driver_found_count) || 0,
        inTransitCount: parseInt(stats.in_transit_count) || 0,
        claimOrders: parseInt(stats.claim_orders) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        totalProfit: parseFloat(stats.total_profit) || 0,
        averageOrderValue: parseFloat(stats.average_order_value) || 0
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 订单状态转换：报价单 → 已下单
   * @param {number} orderId - 订单ID
   * @param {number} confirmedBy - 确认员工ID
   * @param {string} subStatus - 子状态 (waiting_driver, driver_found, in_transit)
   * @returns {Promise<Object>} 更新结果
   */
  static async confirmOrder(orderId, confirmedBy, subStatus = 'waiting_driver') {
    const trx = await db.transaction();
    
    try {
      // 获取美东时间的今日日期 (YYYY-MM-DD格式)
      const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .where('status', 'quote')
        .where('is_deleted', false)
        .update({
          status: 'ordered',
          sub_status: subStatus,
          confirmed_by: confirmedBy,
          confirmed_at: new Date(),
          quote_date: nyDate  // 下单时更新为当天美东日期
        })
        .returning('*');
      
      if (!order) {
        throw new Error('订单不存在或状态不正确');
      }
      
      // 记录状态变更日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: confirmedBy,
        action_type: 'status_changed',
        old_value: 'quote',
        new_value: 'ordered',
        description: `确认下单：${subStatus}`
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('确认订单失败:', error);
      throw error;
    }
  }
  
  /**
   * 订单状态转换：已下单 → 已完成
   * @param {number} orderId - 订单ID
   * @param {number} completedBy - 完成员工ID
   * @returns {Promise<Object>} 更新结果
   */
  static async completeOrder(orderId, completedBy) {
    const trx = await db.transaction();
    
    try {
      const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .where('status', 'ordered')
        .where('is_deleted', false)
        .update({
          status: 'completed',
          sub_status: null,
          completed_by: completedBy,
          completed_at: new Date(),
          quote_date: nyDate
        })
        .returning('*');
      
      if (!order) {
        throw new Error('订单不存在或状态不正确');
      }
      
      // 记录状态变更日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: completedBy,
        action_type: 'status_changed',
        old_value: 'ordered',
        new_value: 'completed',
        description: '标记为已完成'
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('完成订单失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新子状态
   * @param {number} orderId - 订单ID
   * @param {string} subStatus - 子状态
   * @param {number} updatedBy - 更新员工ID
   * @returns {Promise<Object>} 更新结果
   */
  static async updateSubStatus(orderId, subStatus, updatedBy) {
    const trx = await db.transaction();
    
    try {
      const existingOrder = await trx('employee_orders')
        .where('id', orderId)
        .where('status', 'ordered')
        .first();
      
      if (!existingOrder) {
        throw new Error('只有已下单的订单可以更新子状态');
      }
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .update({
          sub_status: subStatus,
          updated_by: updatedBy
        })
        .returning('*');
      
      // 记录日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: updatedBy,
        action_type: 'status_changed',
        old_value: existingOrder.sub_status,
        new_value: subStatus,
        description: `子状态变更：${existingOrder.sub_status} → ${subStatus}`
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('更新子状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 申请索赔
   * @param {number} orderId - 订单ID
   * @param {string} claimReason - 索赔原因
   * @param {number} requestedBy - 申请人员工ID
   * @returns {Promise<Object>} 申请结果
   */
  static async requestClaim(orderId, claimReason, requestedBy) {
    const trx = await db.transaction();
    
    try {
      const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      
      const existingOrder = await trx('employee_orders')
        .where('id', orderId)
        .where('status', 'ordered')
        .first();
      
      if (!existingOrder) {
        throw new Error('只有已下单的订单可以申请索赔');
      }
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .update({
          needs_claim: true,
          claim_reason: claimReason,
          claim_requested_at: new Date(),
          claim_requested_by: requestedBy,
          updated_by: requestedBy,
          quote_date: nyDate
        })
        .returning('*');
      
      // 记录索赔申请日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: requestedBy,
        action_type: 'claim_requested',
        old_value: 'false',
        new_value: 'true',
        description: `申请索赔: ${claimReason}`
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('申请索赔失败:', error);
      throw error;
    }
  }
  
  /**
   * 解决索赔
   * @param {number} orderId - 订单ID
   * @param {string} resolution - 解决方案
   * @param {number} resolvedBy - 解决人员工ID
   * @returns {Promise<Object>} 解决结果
   */
  static async resolveClaim(orderId, resolution, resolvedBy) {
    const trx = await db.transaction();
    
    try {
      const existingOrder = await trx('employee_orders')
        .where('id', orderId)
        .where('needs_claim', true)
        .first();
      
      if (!existingOrder) {
        throw new Error('订单未申请索赔或索赔已解决');
      }
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .update({
          needs_claim: false,
          claim_resolution: resolution,
          claim_resolved_at: new Date(),
          claim_resolved_by: resolvedBy,
          updated_by: resolvedBy
        })
        .returning('*');
      
      // 记录索赔解决日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: resolvedBy,
        action_type: 'claim_resolved',
        old_value: 'true',
        new_value: 'false',
        description: `索赔已解决: ${resolution}`
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('解决索赔失败:', error);
      throw error;
    }
  }
  
  /**
   * 取消订单
   * @param {number} orderId - 订单ID
   * @param {number} cancelledBy - 取消员工ID
   * @returns {Promise<Object>} 取消结果
   */
  static async cancelOrder(orderId, cancelledBy) {
    const trx = await db.transaction();
    
    try {
      const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      
      const existingOrder = await trx('employee_orders')
        .where('id', orderId)
        .whereIn('status', ['quote', 'ordered'])
        .first();
      
      if (!existingOrder) {
        throw new Error('只有报价单或已下单的订单可以取消');
      }
      
      const [order] = await trx('employee_orders')
        .where('id', orderId)
        .update({
          status: 'cancelled',
          cancelled_by: cancelledBy,
          cancelled_at: new Date(),
          updated_by: cancelledBy,
          quote_date: nyDate
        })
        .returning('*');
      
      // 记录取消日志
      await trx('employee_order_logs').insert({
        order_id: orderId,
        user_id: cancelledBy,
        action_type: 'order_cancelled',
        old_value: existingOrder.status,
        new_value: 'cancelled',
        description: '订单已取消'
      });
      
      await trx.commit();
      return { success: true, order };
    } catch (error) {
      await trx.rollback();
      console.error('取消订单失败:', error);
      throw error;
    }
  }
}

module.exports = Order;

