const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth, requireEmployee, requireRole } = require('../middleware/auth');
// Note: requireRole defined in employee-service middleware

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
          .orWhere('tc.truck_contact', 'ilike', searchTerm)
          .orWhere('tc.dot_number', 'ilike', searchTerm);
      });
    }

    const contacts = await query.select('tc.*');

    const mcNumbers = contacts.map(c => c.mc_number).filter(Boolean);
    let orderStats = {};
    if (mcNumbers.length > 0) {
      const stats = await db.raw(`
        SELECT mc_number,
               COUNT(id)::int AS order_count,
               MAX(created_at) AS last_order_date,
               COALESCE(SUM(CASE WHEN ew_final_price ~ '^[0-9.]+$' THEN ew_final_price::numeric ELSE 0 END), 0) AS total_revenue
        FROM employee_orders
        WHERE mc_number = ANY(?) AND status != 'cancelled'
        GROUP BY mc_number
      `, [mcNumbers]).then(r => r.rows);
      stats.forEach(s => {
        orderStats[s.mc_number] = {
          order_count: parseInt(s.order_count),
          last_order_date: s.last_order_date,
          total_revenue: parseFloat(s.total_revenue) || 0
        };
      });
    }

    // Load drivers for each contact
    const contactIds = contacts.map(c => c.id);
    let driversMap = {};
    if (contactIds.length > 0) {
      try {
        const drivers = await db('contact_drivers').whereIn('truck_contact_id', contactIds).orderBy('id', 'asc');
        drivers.forEach(d => {
          if (!driversMap[d.truck_contact_id]) driversMap[d.truck_contact_id] = [];
          driversMap[d.truck_contact_id].push(d);
        });
      } catch { /* table might not exist yet */ }
    }

    const data = contacts.map(c => ({
      ...c,
      order_count: orderStats[c.mc_number]?.order_count || 0,
      last_order_date: orderStats[c.mc_number]?.last_order_date || null,
      total_revenue: orderStats[c.mc_number]?.total_revenue || 0,
      drivers: driversMap[c.id] || []
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
    else if (field === 'dot_number') query = query.where('dot_number', 'ilike', searchTerm);
    else {
      query = query.where(function () {
        this.where('mc_number', 'ilike', searchTerm)
          .orWhere('truck_company_name', 'ilike', searchTerm)
          .orWhere('truck_contact', 'ilike', searchTerm)
          .orWhere('dot_number', 'ilike', searchTerm);
      });
    }

    const contacts = await query.select('id', 'mc_number', 'dot_number', 'truck_company_name', 'truck_contact', 'carrier_email');
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
        'driver_name', 'driver_phone',
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
 * Auto-save on order confirm. Now also saves dot_number and carrier_email.
 */
router.post('/upsert', auth, requireEmployee, async (req, res) => {
  try {
    const { mc_number, truck_company_name, truck_contact, dot_number, carrier_email } = req.body;
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const existing = await db('truck_contacts').where('mc_number', mc_number.trim()).where('is_deleted', false).first();
    if (existing) {
      // Update dot_number and carrier_email if provided and currently empty
      const updates = {};
      if (dot_number && !existing.dot_number) updates.dot_number = dot_number.trim();
      if (carrier_email && !existing.carrier_email) updates.carrier_email = carrier_email.trim();
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date();
        await db('truck_contacts').where('id', existing.id).update(updates);
      }
      const updated = await db('truck_contacts').where('id', existing.id).first();
      return res.json({ success: true, data: updated, message: '联系人已存在，已更新' });
    }

    const insertData = {
      mc_number: mc_number.trim(),
      truck_company_name: truck_company_name.trim(),
      truck_contact: truck_contact.trim(),
      created_by: req.user.id
    };
    if (dot_number) insertData.dot_number = dot_number.trim();
    if (carrier_email) insertData.carrier_email = carrier_email.trim();

    const [newContact] = await db('truck_contacts').insert(insertData).returning('*');
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
    const { mc_number, truck_company_name, truck_contact, dot_number, carrier_email, notes } = req.body;
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({ success: false, message: 'MC#、卡车公司名、公司联络方式为必填项' });
    }

    const existing = await db('truck_contacts').where('mc_number', mc_number).where('is_deleted', false).first();
    if (existing) {
      return res.status(400).json({ success: false, message: `MC# "${mc_number}" 已存在于联系簿中` });
    }

    const insertData = {
      mc_number: mc_number.trim(),
      truck_company_name: truck_company_name.trim(),
      truck_contact: truck_contact.trim(),
      notes: notes?.trim() || null,
      created_by: req.user.id
    };
    if (dot_number) insertData.dot_number = dot_number.trim();
    if (carrier_email) insertData.carrier_email = carrier_email.trim();

    const [newContact] = await db('truck_contacts').insert(insertData).returning('*');
    res.status(201).json({ success: true, data: newContact, message: '联系人已保存到联系簿' });
  } catch (error) {
    console.error('保存联系人失败:', error);
    res.status(500).json({ success: false, message: '保存联系人失败', error: error.message });
  }
});

/**
 * PUT /api/truck-contacts/:id
 * Only truck_contact (公司电话), carrier_email, and notes can be updated.
 * mc_number, dot_number, truck_company_name are locked.
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { truck_contact, carrier_email, notes } = req.body;

    if (!truck_contact || !truck_contact.trim()) {
      return res.status(400).json({ success: false, message: '公司联络方式不能为空' });
    }

    const updateData = { truck_contact: truck_contact.trim(), updated_at: new Date() };
    if (carrier_email !== undefined) updateData.carrier_email = carrier_email?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const [updated] = await db('truck_contacts')
      .where('id', parseInt(id)).where('is_deleted', false)
      .update(updateData).returning('*');

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
      .where('id', parseInt(id)).where('is_deleted', false)
      .update({ is_deleted: true, updated_at: new Date() }).returning('*');

    if (!deleted) return res.status(404).json({ success: false, message: '联系人不存在' });
    res.json({ success: true, message: '联系人已删除' });
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({ success: false, message: '删除联系人失败', error: error.message });
  }
});

// ===== Contact Drivers (sub-resource) =====

/**
 * POST /api/truck-contacts/:id/drivers
 * Add a driver to a contact (all employees)
 */
router.post('/:id/drivers', auth, requireEmployee, async (req, res) => {
  try {
    const { driver_name, driver_phone } = req.body;
    if (!driver_name || !driver_name.trim()) {
      return res.status(400).json({ success: false, message: '司机姓名不能为空' });
    }
    const contact = await db('truck_contacts').where('id', parseInt(req.params.id)).where('is_deleted', false).first();
    if (!contact) return res.status(404).json({ success: false, message: '联系人不存在' });

    const [driver] = await db('contact_drivers')
      .insert({ truck_contact_id: contact.id, driver_name: driver_name.trim(), driver_phone: driver_phone?.trim() || null, created_by: req.user.id })
      .returning('*');

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    console.error('添加司机失败:', error);
    res.status(500).json({ success: false, message: '添加司机失败', error: error.message });
  }
});

/**
 * PUT /api/truck-contacts/:id/drivers/:driverId
 * Update a driver (admin only)
 */
router.put('/:id/drivers/:driverId', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { driver_name, driver_phone } = req.body;
    if (!driver_name || !driver_name.trim()) {
      return res.status(400).json({ success: false, message: '司机姓名不能为空' });
    }
    const [updated] = await db('contact_drivers')
      .where('id', parseInt(req.params.driverId))
      .where('truck_contact_id', parseInt(req.params.id))
      .update({ driver_name: driver_name.trim(), driver_phone: driver_phone?.trim() || null, updated_at: new Date() })
      .returning('*');

    if (!updated) return res.status(404).json({ success: false, message: '司机不存在' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新司机失败:', error);
    res.status(500).json({ success: false, message: '更新司机失败', error: error.message });
  }
});

/**
 * DELETE /api/truck-contacts/:id/drivers/:driverId
 * Delete a driver (admin only)
 */
router.delete('/:id/drivers/:driverId', auth, requireRole(['admin']), async (req, res) => {
  try {
    const deleted = await db('contact_drivers')
      .where('id', parseInt(req.params.driverId))
      .where('truck_contact_id', parseInt(req.params.id))
      .del();

    if (!deleted) return res.status(404).json({ success: false, message: '司机不存在' });
    res.json({ success: true, message: '司机已删除' });
  } catch (error) {
    console.error('删除司机失败:', error);
    res.status(500).json({ success: false, message: '删除司机失败', error: error.message });
  }
});

module.exports = router;
