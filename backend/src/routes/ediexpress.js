/**
 * EDI Express API 路由
 * 文档: https://my.ediexpressinc.com/ediapi/docs/guide
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const EDI_BASE_URL = 'https://my.ediexpressinc.com/ediapi';
const EDI_USERNAME = process.env.EDI_USERNAME;
const EDI_PASSWORD = process.env.EDI_PASSWORD;

// Token 缓存
let cachedToken = null;
let tokenExpiry = null;

/**
 * 获取访问令牌
 */
async function getAccessToken() {
  // 检查缓存的 token 是否有效
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('📋 使用缓存的 EDI Express token');
    return cachedToken;
  }

  try {
    console.log('🔑 获取 EDI Express 访问令牌...');
    console.log('📋 用户名:', EDI_USERNAME);
    
    const response = await axios.post(
      `${EDI_BASE_URL}/token`,
      `grant_type=password&username=${encodeURIComponent(EDI_USERNAME)}&password=${encodeURIComponent(EDI_PASSWORD)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('📥 Token 响应:', JSON.stringify(response.data, null, 2));

    if (!response.data.access_token) {
      throw new Error('Token 响应中没有 access_token');
    }

    cachedToken = response.data.access_token;
    // Token 有效期为 86399 秒 (约24小时)，提前 1 小时刷新
    const expiresIn = response.data.expires_in || 86399;
    tokenExpiry = Date.now() + (expiresIn - 3600) * 1000;
    
    console.log('✅ EDI Express token 获取成功, 过期时间:', new Date(tokenExpiry).toISOString());
    return cachedToken;
  } catch (error) {
    console.error('❌ 获取 EDI Express token 失败:');
    console.error('  状态码:', error.response?.status);
    console.error('  响应数据:', error.response?.data);
    console.error('  错误消息:', error.message);
    
    // 清除缓存
    cachedToken = null;
    tokenExpiry = null;
    
    throw new Error(`无法获取 EDI Express 访问令牌: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * 获取报价
 * POST /api/ediexpress/quote
 */
router.post('/quote', async (req, res) => {
  try {
    const { originZip, destinationZip, items } = req.body;
    
    console.log('📤 EDI Express 报价请求:', { originZip, destinationZip, items });

    // 获取 token
    const token = await getAccessToken();

    // 构建请求体
    const quoteRequest = {
      quoteType: 'P', // P = Pallet
      originPostalCode: originZip,
      destPostalCode: destinationZip,
      items: items.map(item => ({
        weight: Math.round(parseFloat(item.weight) || parseFloat(item.totalWeight) || 0),
        freightClass: parseFloat(item.class || item.freightClass) || 70, // 支持小数 class 如 77.5
        pieces: parseInt(item.pieces || item.pallets) || 1,
        length: Math.round(parseFloat(item.length) || 48),
        width: Math.round(parseFloat(item.width) || 40),
        height: Math.round(parseFloat(item.height) || 48)
      })),
      charges: [] // 可选附加服务
    };

    console.log('📋 EDI Express 请求体:', JSON.stringify(quoteRequest, null, 2));

    // 调用 API
    const response = await axios.post(
      `${EDI_BASE_URL}/api/ratequote`,
      quoteRequest,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('📥 EDI Express 响应:', JSON.stringify(response.data, null, 2));

    // 检查是否有错误
    if (response.data.error || response.data.errors) {
      const errorMsg = response.data.error || JSON.stringify(response.data.errors);
      console.error('❌ EDI Express API 返回错误:', errorMsg);
      return res.status(400).json({
        success: false,
        error: errorMsg,
        carrier: 'EDI Express'
      });
    }

    // 解析响应
    const quote = response.data;
    const result = {
      success: true,
      carrier: 'EDI Express',
      carrierCode: 'EDIEXPRESS',
      quoteId: quote.rateQuoteID?.toString() || quote.quoteNumber || '',
      netCharge: parseFloat(quote.totalDue || quote.total || quote.netCharge) || 0,
      fuelSurcharge: parseFloat(quote.fuelSurcharge || quote.fuel) || 0,
      transitDays: quote.transitDays || quote.transitTime || null,
      serviceType: 'Standard LTL',
      notice: quote.notice || quote.message || '',
      rawResponse: quote
    };

    res.json(result);
  } catch (error) {
    console.error('❌ EDI Express 报价失败:');
    console.error('  状态码:', error.response?.status);
    console.error('  响应数据:', JSON.stringify(error.response?.data, null, 2));
    console.error('  错误消息:', error.message);
    
    const errorData = error.response?.data;
    const errorMsg = errorData?.message || errorData?.error || errorData?.error_description || error.message;
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMsg,
      details: errorData,
      carrier: 'EDI Express'
    });
  }
});

/**
 * 获取运输时间
 */
router.post('/transit', async (req, res) => {
  // EDI Express API 没有单独的运输时间接口
  res.json({
    success: true,
    transitDays: null,
    message: 'EDI Express API 不提供单独的运输时间查询'
  });
});

/**
 * 获取附加服务列表
 */
router.get('/accessorials', async (req, res) => {
  // 根据文档提供的附加服务列表
  const accessorials = [
    { code: 'INSP', name: 'Inside Pickup', description: '室内取货' },
    { code: 'INSD', name: 'Inside Delivery', description: '室内送货' },
    { code: 'HOTLD', name: 'Hotel Delivery', description: '酒店送货' },
    { code: 'RESD', name: 'Residential Delivery', description: '住宅送货' },
    { code: 'TRADD', name: 'Trade Show Delivery', description: '展会送货' },
    { code: 'CONSD', name: 'Construction Site Delivery', description: '工地送货' },
    { code: 'MILID', name: 'Military Delivery', description: '军事基地送货' },
    { code: 'PRISD', name: 'Prison Delivery', description: '监狱送货' },
    { code: 'SCHOD', name: 'School Delivery', description: '学校送货' },
    { code: 'CHURD', name: 'Church Delivery', description: '教堂送货' },
    { code: 'STORD', name: 'Storage Facility Delivery', description: '仓储设施送货' },
    { code: 'NOTIF', name: 'Arrival Notification', description: '到达通知' },
    { code: 'BLIND', name: 'Blind Shipment', description: '盲发货' },
    { code: 'LBING', name: 'Label Marking', description: '标签标记' },
    { code: 'SORT', name: 'Sort / Segregate', description: '分拣/分隔' },
    { code: 'COD', name: 'COD', description: '货到付款' },
    { code: 'LIFTP', name: 'Liftgate Pickup', description: '升降门取货' },
    { code: 'LIFTD', name: 'Liftgate Delivery', description: '升降门送货' },
    { code: 'LIMP', name: 'Limited Access Pickup', description: '受限访问取货' },
    { code: 'LIMD', name: 'Limited Access Delivery', description: '受限访问送货' },
    { code: 'APPT', name: 'Time Specific Delivery', description: '预约送货' }
  ];

  res.json({ success: true, accessorials });
});

module.exports = router;
