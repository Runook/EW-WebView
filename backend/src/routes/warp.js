/**
 * Warp Freight API 代理路由
 * 解决前端 CORS 跨域问题
 * 
 * 前端调用: /api/warp/quote
 * 后端转发: https://gw.wearewarp.com/api/v1/freights/quote
 */

const express = require('express');
const router = express.Router();

// Warp API 配置
const WARP_API_BASE_URL = 'https://gw.wearewarp.com/api/v1';
const WARP_API_KEY = process.env.WARP_API_KEY;

/**
 * POST /api/warp/quote
 * 获取 LTL 运输报价
 */
router.post('/quote', async (req, res) => {
  try {
    console.log('🚚 Warp Quote Request:', JSON.stringify(req.body, null, 2));
    
    const response = await fetch(`${WARP_API_BASE_URL}/freights/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': WARP_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log('📦 Warp Quote Response:', response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Warp API Error',
        message: data.message || 'Failed to get quote',
        code: data.code,
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Warp Quote Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/warp/booking
 * 预订运输
 */
router.post('/booking', async (req, res) => {
  try {
    console.log('🚚 Warp Booking Request:', JSON.stringify(req.body, null, 2));
    
    const response = await fetch(`${WARP_API_BASE_URL}/freights/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': WARP_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log('📦 Warp Booking Response:', response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Warp API Error',
        message: data.message || 'Failed to book shipment',
        code: data.code,
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Warp Booking Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/warp/tracking
 * 追踪运输
 */
router.post('/tracking', async (req, res) => {
  try {
    console.log('🚚 Warp Tracking Request:', JSON.stringify(req.body, null, 2));
    
    const response = await fetch(`${WARP_API_BASE_URL}/freights/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': WARP_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log('📦 Warp Tracking Response:', response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Warp API Error',
        message: data.message || 'Failed to track shipment',
        code: data.code,
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Warp Tracking Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;

