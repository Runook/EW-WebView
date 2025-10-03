const express = require('express');
const router = express.Router();
const FBAExchange = require('../models/FBAExchange');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// 获取所有预约交换信息（支持筛选）
router.get('/', async (req, res) => {
  try {
    const filters = {
      fba_code: req.query.fba_code,
      exchange_type: req.query.exchange_type,
      cargo_type: req.query.cargo_type,
      pricing_strategy: req.query.pricing_strategy,
      search: req.query.search
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const exchanges = await FBAExchange.findAll(filters);
    
    // 处理返回数据，保护隐私信息
    const processedExchanges = exchanges.map(exchange => {
      // 隐藏完整电话号码，只显示部分
      const maskedPhone = exchange.contact_phone ? 
        exchange.contact_phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2') : '';
      
      return {
        ...exchange,
        contact_phone: maskedPhone,
        // 计算评级显示
        rating_display: exchange.rating ? `★${exchange.rating}` : '★4.5'
      };
    });

    res.json({
      success: true,
      data: processedExchanges,
      total: processedExchanges.length
    });
    
    logger.info(`获取FBA预约交换列表成功: ${processedExchanges.length}条记录`);
  } catch (error) {
    logger.error('获取FBA预约交换列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取预约交换列表失败',
      error: error.message 
    });
  }
});

// 获取单个预约交换详情
router.get('/:id', async (req, res) => {
  try {
    const exchange = await FBAExchange.findById(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '预约交换信息不存在'
      });
    }

    // 隐藏完整电话号码
    const maskedPhone = exchange.contact_phone ? 
      exchange.contact_phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2') : '';
    
    res.json({
      success: true,
      data: {
        ...exchange,
        contact_phone: maskedPhone,
        rating_display: exchange.rating ? `★${exchange.rating}` : '★4.5'
      }
    });
  } catch (error) {
    logger.error('获取FBA预约交换详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取预约交换详情失败',
      error: error.message 
    });
  }
});

// 创建新的预约交换信息（需要登录）
router.post('/', auth, async (req, res) => {
  try {
    const {
      fba_code,
      exchange_type,
      pricing_strategy,
      contact_person,
      contact_phone,
      appointment_date,
      appointment_time,
      time_zone,
      cargo_type,
      description,
      is_urgent
    } = req.body;

    // 验证必填字段
    if (!fba_code || !exchange_type || !contact_person || !contact_phone || 
        !appointment_date || !appointment_time || !pricing_strategy?.trim() || !cargo_type?.trim()) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 设置过期时间（默认7天后过期）
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    // 暂时不关联FBA位置表，直接设置为null
    const exchangeData = {
      user_id: req.user.id,
      fba_location_id: null,
      fba_code,
      exchange_type,
      pricing_strategy: pricing_strategy || '普通',
      contact_person,
      contact_phone,
      appointment_date,
      appointment_time,
      time_zone: time_zone || 'PDT',
      cargo_type: cargo_type || '地板',
      description: description || '', // 允许空描述
      is_urgent: is_urgent || false,
      expires_at
    };

    const newExchange = await FBAExchange.create(exchangeData);
    
    res.status(201).json({
      success: true,
      message: '预约交换信息发布成功',
      data: newExchange
    });
    
    logger.info(`创建FBA预约交换成功: ${newExchange.id}`);
  } catch (error) {
    logger.error('创建FBA预约交换失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '发布预约交换信息失败',
      error: error.message 
    });
  }
});

// 获取用户的预约交换信息（需要登录）
router.get('/user/my-exchanges', auth, async (req, res) => {
  try {
    const exchanges = await FBAExchange.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    logger.error('获取用户预约交换列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取我的预约交换列表失败',
      error: error.message 
    });
  }
});

// 更新预约交换信息（需要登录且是创建者）
router.put('/:id', auth, async (req, res) => {
  try {
    const exchange = await FBAExchange.findById(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '预约交换信息不存在'
      });
    }

    // 检查是否是创建者
    if (exchange.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此预约交换信息'
      });
    }

    const updateData = {};
    const allowedFields = [
      'exchange_type', 'pricing_strategy', 'contact_person', 'contact_phone',
      'appointment_date', 'appointment_time', 'time_zone', 'cargo_type',
      'description', 'is_urgent'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedExchange = await FBAExchange.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: '预约交换信息更新成功',
      data: updatedExchange
    });
  } catch (error) {
    logger.error('更新FBA预约交换失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新预约交换信息失败',
      error: error.message 
    });
  }
});

// 删除预约交换信息（需要登录且是创建者）
router.delete('/:id', auth, async (req, res) => {
  try {
    const exchange = await FBAExchange.findById(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '预约交换信息不存在'
      });
    }

    // 检查是否是创建者
    if (exchange.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此预约交换信息'
      });
    }

    await FBAExchange.delete(req.params.id);
    
    res.json({
      success: true,
      message: '预约交换信息删除成功'
    });
  } catch (error) {
    logger.error('删除FBA预约交换失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除预约交换信息失败',
      error: error.message 
    });
  }
});

// 获取统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await FBAExchange.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取FBA预约交换统计失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取统计信息失败',
      error: error.message 
    });
  }
});

// 联系TA功能 - 获取完整联系方式（需要登录）
router.post('/:id/contact', auth, async (req, res) => {
  try {
    const exchange = await FBAExchange.findById(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '预约交换信息不存在'
      });
    }

    // 防止自己联系自己
    if (exchange.user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能联系自己发布的信息'
      });
    }

    // 返回完整联系信息
    res.json({
      success: true,
      data: {
        contact_person: exchange.contact_person,
        contact_phone: exchange.contact_phone,
        user_phone: exchange.user_phone,
        company_name: exchange.company_name
      }
    });
  } catch (error) {
    logger.error('获取联系信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取联系信息失败',
      error: error.message 
    });
  }
});

module.exports = router;