const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const datService = require('./datService');
const Customer = require('../models/Customer');

/**
 * Parse raw shipment items from an AI-extracted document into order-ready data.
 * Handles the "main row + sub-row" dimension pattern seen in customer Excel files.
 */
function normalizeShipmentItems(rawItems) {
  return rawItems.map(item => {
    // Dimensions from Gemini are already in inches/lbs
    const dims = (item.dimensions || []).map(d => ({
      length: Math.round(parseFloat(d.length) || 0),
      width: Math.round(parseFloat(d.width) || 0),
      height: Math.round(parseFloat(d.height) || 0),
      pieces: parseInt(d.pieces) || 1,
      weight: Math.round(parseFloat(d.weight) || 0),
      freightClass: d.freightClass || '',
      volume: parseFloat(d.volume) || 0
    }));

    const totalWeightLbs = dims.reduce((sum, d) => sum + d.weight * d.pieces, 0);
    const totalPallets = dims.reduce((sum, d) => sum + d.pieces, 0);
    const totalCubicFeet = dims.reduce((sum, d) => {
      return sum + ((d.length * d.width * d.height) / 1728) * d.pieces;
    }, 0);

    const addressTypeRaw = (item.address_type || '').toLowerCase();
    let addressType = 'Commercial';
    if (addressTypeRaw.includes('住宅') || addressTypeRaw.includes('residential')) {
      addressType = 'Residential';
    }

    let deliveryNotes = '';
    if (addressTypeRaw.includes('尾板') || addressTypeRaw.includes('liftgate')) {
      deliveryNotes = 'Liftgate required';
    }
    if (addressTypeRaw.includes('没有卸货平台') || addressTypeRaw.includes('no dock')) {
      deliveryNotes = deliveryNotes ? `${deliveryNotes}; No loading dock` : 'No loading dock';
    }

    return {
      tracking_number: item.tracking_number || null,
      packaging_type: item.packaging_type || null,
      product_name_cn: item.product_name_cn || null,
      product_name_en: item.product_name_en || null,
      cargo_value: parseFloat(item.cargo_value) || null,
      destination_country: item.destination_country || 'US',
      destination_zip: String(item.destination_zip || '').padStart(5, '0'),
      destination_city: item.destination_city || null,
      destination_state: item.destination_state || null,
      company_name: item.company_name || null,
      recipient_name: item.recipient_name || null,
      phone: item.phone || null,
      email: item.email || null,
      address: item.address || null,
      address_type: addressType,
      delivery_notes: deliveryNotes,
      total_pieces: totalPallets,
      dimensions: dims,
      total_weight_lbs: totalWeightLbs,
      total_cubic_feet: Math.round(totalCubicFeet * 100) / 100,
      delivery_method: item.delivery_method || null,
      notes: item.notes || null,
      origin_zip: item.origin_zip || null,
      origin_city: item.origin_city || null,
      origin_state: item.origin_state || null,
      confidence: item.confidence || null
    };
  });
}

/**
 * Create employee_orders in batch from parsed shipment data.
 * Returns created order records.
 */
async function batchCreateOrders(items, createdBy) {
  const trx = await db.transaction();

  try {
    const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const orders = [];

    const safeCreatedBy = typeof createdBy === 'number' ? createdBy : (parseInt(createdBy) || 1);

    for (const item of items) {
      const orderNumber = await generateOrderNumber(trx);

      // Weight list as JSON array of per-pallet weights (lbs)
      const weightListArr = item.dimensions.map(d => Math.round(d.weight));
      const weightList = JSON.stringify(weightListArr);

      // Dimensions list as JSON array matching existing system format
      const dimensionsListArr = item.dimensions.map(d => ({
        length: d.length,
        width: d.width,
        height: d.height,
        pieces: d.pieces,
        volume: Math.round((d.length * d.width * d.height) / 1728 * 100) / 100,
        freightClass: d.freightClass || ''
      }));
      const dimensionsList = JSON.stringify(dimensionsListArr);

      // 公司名解析：把 AI 识别到的公司名（或收货人名）尝试匹配到 customer list。
      //   - 命中客户 → 用客户列表里的规范公司名
      //   - 没命中 → 直接用 AI 识别的公司名（毫不相关时就放进 Company）
      // 注意：收货人是"人名"，绝不放进 Company；仅当没有公司名时才用人名去碰运气匹配客户。
      const matched = await Customer.matchByName(item.company_name || item.recipient_name);
      const resolvedCompany = matched
        ? matched.company_name
        : (item.company_name || null);

      // 把公司名同步到 customers 表（找不到就自动新建）。
      // 同上：不写 customer_id 到订单，employee_orders.customer_id 的 FK
      // 指向了 users 表（历史遗留），写 customers.id 会 FK 失败。
      if (resolvedCompany && !matched) {
        await Customer.ensureByName(resolvedCompany, {
          contact_person: item.recipient_name || null,
          contact_email: item.email || null,
          contact_phone: item.phone || null,
        }, safeCreatedBy);
      }

      const insertData = {
        order_number: orderNumber,
        // customer_name 作为 Company 列的兜底显示，存公司名（绝不存收货人名）
        customer_name: resolvedCompany || 'AI Import',
        customer_email: matched?.contact_email || null,
        customer_phone: matched?.contact_phone || null,
        // 收货人信息单独存，展示在"详细地址"区
        recipient_name: item.recipient_name || null,
        recipient_phone: item.phone || null,
        recipient_email: item.email || null,
        order_type: 'land_freight',
        status: 'quote',
        priority: 'normal',
        cargo_description: item.product_name_en || item.product_name_cn || '',
        quote_date: nyDate,
        inquiry_company: resolvedCompany || null,
        ew_quote_number: item.tracking_number || null,
        shipment_number: item.tracking_number || null,
        cargo_description_detailed: [
          item.product_name_cn,
          item.product_name_en,
          item.packaging_type ? `包装: ${item.packaging_type}` : null
        ].filter(Boolean).join(' | '),
        weight_list: weightList,
        total_weight_lbs: item.total_weight_lbs || null,
        dimensions_list: dimensionsList,
        total_volume: item.total_cubic_feet || null,
        cargo_value: item.cargo_value || null,
        address_type: item.address_type || 'Commercial',
        actual_pallets: item.total_pieces || null,
        destination_address: item.address || null,
        destination_city: item.destination_city || null,
        destination_state: item.destination_state || null,
        destination_country: item.destination_country || 'US',
        destination_zipcode: item.destination_zip || null,
        origin_address: null,
        origin_city: item.origin_city || null,
        origin_state: item.origin_state || null,
        origin_country: 'US',
        origin_zipcode: item.origin_zip || null,
        notes: [
          item.notes,
          item.delivery_notes,
          item.delivery_method ? `派送方式: ${item.delivery_method}` : null
        ].filter(Boolean).join(' | '),
        internal_notes: `Created by AI Agent | Tracking: ${item.tracking_number || 'N/A'}`,
        currency: 'USD',
        created_by: safeCreatedBy,
        assigned_to: safeCreatedBy
      };

      const [order] = await trx('employee_orders')
        .insert(insertData)
        .returning('*');

      await trx('employee_order_logs').insert({
        order_id: order.id,
        user_id: createdBy,
        action_type: 'created',
        description: `AI Agent 自动创建订单: ${orderNumber}`
      });

      orders.push(order);
    }

    await trx.commit();
    return orders;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

/**
 * Generate next order number (WE + incrementing integer, e.g. WE84, WE85).
 */
async function generateOrderNumber(trx) {
  const result = await trx('employee_orders')
    .whereRaw("order_number ~ '^WE[0-9]+$'")
    .select(trx.raw("MAX(CAST(SUBSTRING(order_number FROM 3) AS INTEGER)) as max_num"));
  const maxNum = result[0]?.max_num || 0;
  return `WE${maxNum + 1}`;
}

/**
 * Generate next WE quote number (WE + incrementing integer, e.g. WE84, WE85).
 */
async function generateWEQuoteNumber(trx) {
  const result = await trx('employee_orders')
    .whereRaw("ew_quote_number ~ '^WE[0-9]+$'")
    .select(trx.raw("MAX(CAST(SUBSTRING(ew_quote_number FROM 3) AS INTEGER)) as max_num"));
  const maxNum = result[0]?.max_num || 0;
  return `WE${maxNum + 1}`;
}

/**
 * Fetch DAT rates for a batch of orders and update them.
 */
async function enrichOrdersWithDATRates(orderIds) {
  const orders = await db('employee_orders')
    .whereIn('id', orderIds)
    .select('id', 'origin_zipcode', 'destination_zipcode', 'total_weight_lbs');

  const results = [];

  for (const order of orders) {
    if (!order.origin_zipcode || !order.destination_zipcode) {
      results.push({ orderId: order.id, status: 'skipped', reason: 'Missing origin or destination zip' });
      continue;
    }

    const rate = await datService.rateLookup({
      originZip: order.origin_zipcode,
      destinationZip: order.destination_zipcode,
      weight: order.total_weight_lbs
    });

    if (rate.available) {
      await db('employee_orders').where('id', order.id).update({
        total_dat: rate.spotRate || rate.average,
        dat_sales_1: rate.low,
        dat_sales_2: rate.average,
        dat_sales_3: rate.high
      });
      results.push({ orderId: order.id, status: 'updated', rate });
    } else {
      results.push({ orderId: order.id, status: 'unavailable', message: rate.message });
    }
  }

  return results;
}

/**
 * Create an AI quote review task for human verification.
 */
async function createReviewTask({ sourceFile, parsedItems, orderIds, wecomChatId, createdBy }) {
  const [task] = await db('ai_quote_reviews').insert({
    id: uuidv4(),
    source_filename: sourceFile,
    parsed_data: JSON.stringify(parsedItems),
    order_ids: JSON.stringify(orderIds),
    wecom_chat_id: wecomChatId || null,
    status: 'pending_review',
    created_by: createdBy,
    created_at: new Date()
  }).returning('*');

  return task;
}

/**
 * Get all pending review tasks.
 */
async function getReviewTasks(filters = {}) {
  let query = db('ai_quote_reviews').orderBy('created_at', 'desc');

  if (filters.status) {
    query = query.where('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

/**
 * Approve a review task, triggering quote distribution.
 */
async function approveReviewTask(taskId, reviewedBy) {
  const [task] = await db('ai_quote_reviews')
    .where('id', taskId)
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date()
    })
    .returning('*');

  return task;
}

/**
 * Reject a review task.
 */
async function rejectReviewTask(taskId, reviewedBy, reason) {
  const [task] = await db('ai_quote_reviews')
    .where('id', taskId)
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      review_notes: reason
    })
    .returning('*');

  return task;
}

module.exports = {
  normalizeShipmentItems,
  batchCreateOrders,
  enrichOrdersWithDATRates,
  createReviewTask,
  getReviewTasks,
  approveReviewTask,
  rejectReviewTask
};
