const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/truck-contacts
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;

    let query = db('truck_contacts as tc')
      .where('tc.is_deleted', false)
      .orderBy('tc.created_at', 'desc')
      .limit(parseInt(limit));

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(function () {
        this.where('tc.mc_number', 'ilike', searchTerm)
          .orWhere('tc.truck_company_name', 'ilike', searchTerm)
          .orWhere('tc.truck_contact', 'ilike', searchTerm);
      });
    }

    const contacts = await query.select('tc.*');

    const mcNumbers = contacts.map(c => c.mc_number).filter(Boolean);
    let orderStats = {};
    if (mcNumbers.length > 0) {
      const stats = await db('employee_orders')
        .select('mc_number')
        .count('id as order_count')
        .max('created_at as last_order_date')
        .whereIn('mc_number', mcNumbers)
        .whereNot('status', 'cancelled')
        .groupBy('mc_number');
      stats.forEach(s => {
        orderStats[s.mc_number] = { order_count: parseInt(s.order_count), last_order_date: s.last_order_date };
      });
    }

    const data = contacts.map(c => ({
      ...c,
      order_count: orderStats[c.mc_number]?.order_count || 0,
      last_order_date: orderStats[c.mc_number]?.last_order_date || null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('获取联系簿失败:', error);
    res.status(500).json({ success: false, message: '获取联系簿失败', error: error.message });
  }
});

/**
 * GET /api/truck-contacts/search
 */
router.get('/search', auth, requireEmployee, async (req, res) => {
  try {
    const { q, field } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, data: [] });

    const searchTerm = `%${q.trim()}%`;
    let query = db('truck_contacts').where('is_deleted', false).limit(10);

    if (field === 'mc_number') query = query.where('mc_number', 'ilike', searchTerm);
    else if (field === 'truck_company_name') query = query.where('truck_company_name', 'ilike', searchTerm);
    else if (field === 'truck_contact') query = query.where('truck_contact', 'ilike', searchTerm);
    else {
      query = query.where(function () {
        this.where('mc_number', 'ilike', searchTerm)
          .orWhere('truck_company_name', 'ilike', searchTerm)
          .orWhere('truck_contact', 'ilike', searchTerm);
      });
    }

    const contacts = await query.select('id', 'mc_number', 'truck_company_name', 'truck_contact');
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('搜索联系人失败:', error);
    res.status(500).json({ success: false, message: '搜索联系人失败', error: error.message });
  }
});

/**
 * GET /api/truck-contacts/:id/orders
 */
router.get('/:id/orders', auth, requireEmployee, async (req, res) => {
  try {
    const contact = await db('truck_contacts').where('id', parseInt(req.params.id)).where('is_deleted', false).first();
    if (!contact) return res.status(404).json({ success: false, message: '联系人不存在' });

    const orders = await db('employee_orders')
      .where('mc_number', contact.mc_number)
      .whereNot('status', 'cancelled')
      .orderBy('created_at', 'desc')
      .select(
        'id', 'ew_quote_number', 'customer_name', 'status', 'sub_status',
        'origin_city', 'origin_state', 'destination_city', 'destination_state',
        'cargo_description_detailed', 'weight_list', 'total_weight_lbs',
        'dimensions_list', 'truck_size',
        'pickup_date', 'delivery_date', 'quote_date',
        'ew_quote_price', 'ew_final_price', 'truck_payment',
        'created_at'
      );

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('获取司机订单历史失败:', error);
    res.status(500).json({ success: false, message: '获取订单历史失败', error: error.message });
  }
});

/**
 * POST /api/truck-contacts/upsert
 */
router.post('/upsert', auth, requireEmployee, async (req, res) => {
  try {
    const { mc_number, truck_company_name, truck_contact } = req.body;
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const existing = await db('truck_contacts').where('mc_number', mc_number.trim()).where('is_deleted', false).first();
    if (existing) return res.json({ success: true, data: existing, message: '联系人已存在，跳过' });

    const [newContact] = await db('truck_contacts')
      .insert({ mc_number: mc_number.trim(), truck_company_name: truck_company_name.trim(), truck_contact: truck_contact.trim(), created_by: req.user.id })
      .returning('*');

    res.status(201).json({ success: true, data: newContact, message: '联系人已自动保存' });
  } catch (error) {
    console.error('Upsert联系人失败:', error);
    res.status(500).json({ success: false, message: 'Upsert联系人失败', error: error.message });
  }
});

/**
 * POST /api/truck-contacts
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const { mc_number, truck_company_name, truck_contact, notes } = req.body;
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({ success: false, message: 'MC Number、卡车公司名、联络方式为必填项' });
    }

    const existing = await db('truck_contacts').where('mc_number', mc_number).where('is_deleted', false).first();
    if (existing) {
      return res.status(400).json({ success: false, message: `MC Number "${mc_number}" 已存在于联系簿中` });
    }

    const [newContact] = await db('truck_contacts')
      .insert({ mc_number: mc_number.trim(), truck_company_name: truck_company_name.trim(), truck_contact: truck_contact.trim(), notes: notes?.trim() || null, created_by: req.user.id })
      .returning('*');

    res.status(201).json({ success: true, data: newContact, message: '联系人已保存到联系簿' });
  } catch (error) {
    console.error('保存联系人失败:', error);
    res.status(500).json({ success: false, message: '保存联系人失败', error: error.message });
  }
});

/**
 * PUT /api/truck-contacts/:id
 * Only truck_contact and notes can be updated (MC & company locked)
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { truck_contact, notes } = req.body;

    if (!truck_contact || !truck_contact.trim()) {
      return res.status(400).json({ success: false, message: '联络方式不能为空' });
    }

    const [updated] = await db('truck_contacts')
      .where('id', parseInt(id))
      .where('is_deleted', false)
      .update({ truck_contact: truck_contact.trim(), notes: notes?.trim() || null, updated_at: new Date() })
      .returning('*');

    if (!updated) return res.status(404).json({ success: false, message: '联系人不存在' });
    res.json({ success: true, data: updated, message: '联系人已更新' });
  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json({ success: false, message: '更新联系人失败', error: error.message });
  }
});

/**
 * DELETE /api/truck-contacts/:id
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db('truck_contacts')
      .where('id', parseInt(id))
      .where('is_deleted', false)
      .update({ is_deleted: true, updated_at: new Date() })
      .returning('*');

    if (!deleted) return res.status(404).json({ success: false, message: '联系人不存在' });
    res.json({ success: true, message: '联系人已删除' });
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({ success: false, message: '删除联系人失败', error: error.message });
  }
});

module.exports = router;
