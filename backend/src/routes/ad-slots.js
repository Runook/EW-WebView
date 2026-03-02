const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth, optionalAuth, requireEmployee } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/cache');

/**
 * GET /api/ads?position=forum-sidebar
 * 获取某个位置的广告（公开接口）
 */
router.get('/', cacheResponse(300, 'ads'), optionalAuth, async (req, res) => {
  try {
    const { position } = req.query;
    let query = db('ad_slots')
      .where('is_active', true)
      .where(function() {
        this.whereNull('start_date').orWhere('start_date', '<=', new Date());
      })
      .where(function() {
        this.whereNull('end_date').orWhere('end_date', '>=', new Date());
      })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc');

    if (position) {
      query = query.where('slot_position', position);
    }

    const ads = await query.select('id', 'slot_position', 'title', 'image_url', 'link_url', 'description');

    // 批量增加浏览量
    if (ads.length > 0) {
      const ids = ads.map(a => a.id);
      await db('ad_slots').whereIn('id', ids).increment('view_count', 1);
    }

    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取广告失败', error: error.message });
  }
});

/**
 * POST /api/ads/:id/click
 * 记录广告点击
 */
router.post('/:id/click', async (req, res) => {
  try {
    await db('ad_slots').where('id', req.params.id).increment('click_count', 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ====== 员工管理接口 ======

/**
 * GET /api/ads/manage
 * 获取所有广告（含统计，仅员工）
 */
router.get('/manage', auth, requireEmployee, async (req, res) => {
  try {
    const ads = await db('ad_slots')
      .leftJoin('users', 'ad_slots.created_by', 'users.id')
      .select(
        'ad_slots.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as creator_name")
      )
      .orderBy('ad_slots.sort_order', 'asc')
      .orderBy('ad_slots.created_at', 'desc');

    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取广告列表失败', error: error.message });
  }
});

/**
 * POST /api/ads/manage
 * 创建广告（仅员工）
 */
router.post('/manage', auth, requireEmployee, async (req, res) => {
  try {
    const { slot_position, title, image_url, link_url, description, is_active, sort_order, start_date, end_date } = req.body;

    if (!slot_position || !title) {
      return res.status(400).json({ success: false, message: '位置和标题必填' });
    }

    const [ad] = await db('ad_slots').insert({
      slot_position,
      title,
      image_url: image_url || null,
      link_url: link_url || null,
      description: description || null,
      is_active: is_active !== false,
      sort_order: sort_order || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: req.user.id
    }).returning('*');

    res.status(201).json({ success: true, data: ad, message: '广告创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建广告失败', error: error.message });
  }
});

/**
 * PUT /api/ads/manage/:id
 * 编辑广告（仅员工）
 */
router.put('/manage/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { slot_position, title, image_url, link_url, description, is_active, sort_order, start_date, end_date } = req.body;

    const updateData = { updated_at: new Date() };
    if (slot_position !== undefined) updateData.slot_position = slot_position;
    if (title !== undefined) updateData.title = title;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const [ad] = await db('ad_slots').where('id', id).update(updateData).returning('*');
    if (!ad) return res.status(404).json({ success: false, message: '广告不存在' });

    res.json({ success: true, data: ad, message: '广告更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新广告失败', error: error.message });
  }
});

/**
 * DELETE /api/ads/manage/:id
 * 删除广告（仅员工）
 */
router.delete('/manage/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('ad_slots').where('id', id).delete();
    if (!deleted) return res.status(404).json({ success: false, message: '广告不存在' });
    res.json({ success: true, message: '广告已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除广告失败', error: error.message });
  }
});

module.exports = router;
