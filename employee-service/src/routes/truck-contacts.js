const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/truck-contacts
 * 获取联系簿列表（支持搜索）
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = db('truck_contacts')
      .where('is_deleted', false)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));
    
    // 如果有搜索关键字，搜索 MC Number、公司名、联络方式
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(function() {
        this.where('mc_number', 'ilike', searchTerm)
          .orWhere('truck_company_name', 'ilike', searchTerm)
          .orWhere('truck_contact', 'ilike', searchTerm);
      });
    }
    
    const contacts = await query.select('*');
    
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('获取联系簿失败:', error);
    res.status(500).json({
      success: false,
      message: '获取联系簿失败',
      error: error.message
    });
  }
});

/**
 * GET /api/truck-contacts/search
 * 搜索联系人（用于自动补全）
 */
router.get('/search', auth, requireEmployee, async (req, res) => {
  try {
    const { q, field } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    let query = db('truck_contacts')
      .where('is_deleted', false)
      .limit(10);
    
    // 根据指定字段搜索，或搜索所有字段
    if (field === 'mc_number') {
      query = query.where('mc_number', 'ilike', searchTerm);
    } else if (field === 'truck_company_name') {
      query = query.where('truck_company_name', 'ilike', searchTerm);
    } else if (field === 'truck_contact') {
      query = query.where('truck_contact', 'ilike', searchTerm);
    } else {
      // 搜索所有字段
      query = query.where(function() {
        this.where('mc_number', 'ilike', searchTerm)
          .orWhere('truck_company_name', 'ilike', searchTerm)
          .orWhere('truck_contact', 'ilike', searchTerm);
      });
    }
    
    const contacts = await query.select('id', 'mc_number', 'truck_company_name', 'truck_contact');
    
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('搜索联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索联系人失败',
      error: error.message
    });
  }
});

/**
 * POST /api/truck-contacts
 * 添加新联系人
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const { mc_number, truck_company_name, truck_contact, notes } = req.body;
    
    // 验证必填字段
    if (!mc_number || !truck_company_name || !truck_contact) {
      return res.status(400).json({
        success: false,
        message: 'MC Number、卡车公司名、联络方式为必填项'
      });
    }
    
    // 检查是否已存在相同的 MC Number（未删除的）
    const existing = await db('truck_contacts')
      .where('mc_number', mc_number)
      .where('is_deleted', false)
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `MC Number "${mc_number}" 已存在于联系簿中`
      });
    }
    
    const [newContact] = await db('truck_contacts')
      .insert({
        mc_number: mc_number.trim(),
        truck_company_name: truck_company_name.trim(),
        truck_contact: truck_contact.trim(),
        notes: notes ? notes.trim() : null,
        created_by: req.user.id
      })
      .returning('*');
    
    console.log('✅ 新联系人已保存:', newContact);
    
    res.status(201).json({
      success: true,
      data: newContact,
      message: '联系人已保存到联系簿'
    });
  } catch (error) {
    console.error('保存联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '保存联系人失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/truck-contacts/:id
 * 更新联系人
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { mc_number, truck_company_name, truck_contact, notes } = req.body;
    
    const [updated] = await db('truck_contacts')
      .where('id', parseInt(id))
      .where('is_deleted', false)
      .update({
        mc_number: mc_number?.trim(),
        truck_company_name: truck_company_name?.trim(),
        truck_contact: truck_contact?.trim(),
        notes: notes?.trim(),
        updated_at: new Date()
      })
      .returning('*');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }
    
    res.json({
      success: true,
      data: updated,
      message: '联系人已更新'
    });
  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '更新联系人失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/truck-contacts/:id
 * 删除联系人（软删除）
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deleted] = await db('truck_contacts')
      .where('id', parseInt(id))
      .where('is_deleted', false)
      .update({
        is_deleted: true,
        updated_at: new Date()
      })
      .returning('*');
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }
    
    res.json({
      success: true,
      message: '联系人已删除'
    });
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '删除联系人失败',
      error: error.message
    });
  }
});

module.exports = router;
