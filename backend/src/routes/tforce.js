/**
 * TForce Freight API 代理路由
 * 使用 Microsoft Azure AD OAuth 2.0 认证
 * 
 * 前端调用: /api/tforce/quote
 * 后端转发: TForce Rate API
 */

const express = require('express');
const router = express.Router();

// TForce OAuth 配置 (从环境变量读取)
const TFORCE_TOKEN_ENDPOINT = 'https://login.microsoftonline.com/ca4f5969-c10f-40d4-8127-e74b691f95de/oauth2/v2.0/token';
const TFORCE_CLIENT_ID = process.env.TFORCE_CLIENT_ID;
const TFORCE_CLIENT_SECRET = process.env.TFORCE_CLIENT_SECRET;
const TFORCE_SCOPE = process.env.TFORCE_SCOPE;

// TForce API Base URL
// 文档: https://api.tforcefreight.com/rating
const TFORCE_API_BASE_URL = 'https://api.tforcefreight.com';
const TFORCE_API_VERSION = 'v1';

// Token 缓存
let cachedToken = null;
let tokenExpiry = null;

/**
 * 获取 OAuth 2.0 访问令牌
 */
const getAccessToken = async () => {
  // 检查缓存的令牌是否有效
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    console.log('🔑 Using cached TForce token');
    return cachedToken;
  }

  console.log('🔑 Requesting new TForce OAuth token...');

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', TFORCE_CLIENT_ID);
    params.append('client_secret', TFORCE_CLIENT_SECRET);
    params.append('scope', TFORCE_SCOPE);

    const response = await fetch(TFORCE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ TForce Token Error:', data);
      throw new Error(data.error_description || 'Failed to get access token');
    }

    // 缓存令牌
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    console.log('✅ TForce token obtained, expires in', data.expires_in, 'seconds');

    return cachedToken;
  } catch (error) {
    console.error('❌ TForce Token Request Error:', error);
    throw error;
  }
};

/**
 * POST /api/tforce/quote
 * 获取 TForce Freight LTL 运输报价
 * 
 * 请求体示例:
 * {
 *   "originZip": "90210",
 *   "destinationZip": "10001",
 *   "shipDate": "2026-01-20",
 *   "items": [
 *     {
 *       "class": "70",
 *       "weight": 500,
 *       "pieces": 1,
 *       "length": 48,
 *       "width": 40,
 *       "height": 48
 *     }
 *   ],
 *   "accessorials": ["LFTGP", "LFTGD"]
 * }
 */
router.post('/quote', async (req, res) => {
  try {
    const { 
      originZip, 
      originCity = '',
      originState = '',
      destinationZip, 
      destinationCity = '',
      destinationState = '',
      shipDate,
      items,
      accessorials = [],
      originType = 'Commercial',
      destinationType = 'Commercial',
      paymentTerms = 'Prepaid'
    } = req.body;

    // 验证必填字段
    if (!originZip || !destinationZip || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip, destinationZip, and items are required'
      });
    }

    // 获取访问令牌
    const accessToken = await getAccessToken();

    // 默认发货日期为今天
    const shipDateFormatted = shipDate || new Date().toISOString().split('T')[0];

    // 构建 TForce 请求格式 (根据官方 OpenAPI 规范)
    // 文档: https://api.tforcefreight.com/rating/openapi?api-version=v1
    
    // 构建附加服务
    const pickupServices = [];
    const deliveryServices = [];
    
    accessorials.forEach(code => {
      if (['INPU', 'RESP', 'LIFO', 'LAPU', 'TRPU'].includes(code)) {
        pickupServices.push(code);
      } else if (['NTFN', 'INDE', 'RESD', 'LADL', 'LIFD', 'TRDS'].includes(code)) {
        deliveryServices.push(code);
      }
    });
    
    // 添加地址类型相关的附加服务
    if (originType === 'Residential' || originType === 'residential') {
      pickupServices.push('RESP');
    }
    if (destinationType === 'Residential' || destinationType === 'residential') {
      deliveryServices.push('RESD');
    }
    
    // billingCode: 10=Prepaid, 30=Third Party, 40=Freight Collect
    const billingCode = paymentTerms === 'Collect' ? '40' : 
                        paymentTerms === 'ThirdParty' ? '30' : '10';
    
    const tforceRequest = {
      requestOptions: {
        serviceCode: '308', // TForce Freight LTL
        pickupDate: shipDateFormatted,
        type: 'L', // LTL only
        timeInTransit: true,
        quoteNumber: true
      },
      shipFrom: {
        address: {
          city: originCity || 'Unknown',
          stateProvinceCode: originState || 'NY',
          postalCode: originZip,
          country: 'US'
        }
      },
      shipTo: {
        address: {
          city: destinationCity || 'Unknown',
          stateProvinceCode: destinationState || 'CA',
          postalCode: destinationZip,
          country: 'US'
        }
      },
      payment: {
        payer: {
          address: {
            city: originCity || 'Unknown',
            stateProvinceCode: originState || 'NY',
            postalCode: originZip,
            country: 'US'
          }
        },
        billingCode: billingCode
      },
      commodities: items.map(item => ({
        class: String(item.class || '70'),
        pieces: item.pieces || 1,
        weight: {
          weight: item.weight || 500,
          weightUnit: 'LBS'
        },
        packagingType: item.packaging || 'PLT',
        dimensions: {
          length: item.length || 48,
          width: item.width || 48,
          height: item.height || 48,
          unit: 'IN'
        }
      }))
    };
    
    // 添加附加服务（如果有）
    if (pickupServices.length > 0 || deliveryServices.length > 0) {
      tforceRequest.serviceOptions = {};
      if (pickupServices.length > 0) {
        tforceRequest.serviceOptions.pickup = pickupServices;
      }
      if (deliveryServices.length > 0) {
        tforceRequest.serviceOptions.delivery = deliveryServices;
      }
    }

    console.log('🚚 TForce Quote Request:', JSON.stringify(tforceRequest, null, 2));

    const response = await fetch(`${TFORCE_API_BASE_URL}/rating/getRate?api-version=${TFORCE_API_VERSION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(tforceRequest)
    });

    const data = await response.json();
    
    console.log('📦 TForce Quote Response:', response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'TForce API Error',
        message: data.message || data.errorMessage || 'Failed to get quote',
        code: data.errorCode,
        details: data
      });
    }

    // 解析 TForce 响应格式
    // 响应包含 summary 和 detail 数组，每个 detail 是一个服务选项
    const quoteNumber = data.summary?.quoteNumber;
    const details = data.detail || [];
    
    // 找到标准 LTL 报价 (serviceCode: 308)
    const standardLTL = details.find(d => d.service?.code === '308');
    const guaranteedLTL = details.find(d => d.service?.code === '309');
    const acceleratedLTL = details.find(d => d.service?.code === '311');
    
    // 使用标准 LTL 作为主报价
    const primaryQuote = standardLTL || details[0];
    
    // Build charges breakdown from rate entries
    const charges = [];
    if (primaryQuote?.rate && Array.isArray(primaryQuote.rate)) {
      primaryQuote.rate.forEach(r => {
        if (r.value && parseFloat(r.value) !== 0) {
          charges.push({
            description: r.description || r.code || 'Charge',
            amount: parseFloat(r.value)
          });
        }
      });
    }

    // 标准化响应格式
    const standardizedResponse = {
      carrier: 'TForce Freight',
      carrierCode: 'TFORCE',
      quoteId: quoteNumber,
      netCharge: primaryQuote?.shipmentCharges?.total?.value ? parseFloat(primaryQuote.shipmentCharges.total.value) : null,
      transitDays: primaryQuote?.timeInTransit?.timeInTransit ? parseInt(primaryQuote.timeInTransit.timeInTransit) : null,
      serviceType: primaryQuote?.service?.description || 'TForce Freight LTL',
      guaranteed: guaranteedLTL?.shipmentCharges?.total?.value ? parseFloat(guaranteedLTL.shipmentCharges.total.value) : null,
      accelerated: acceleratedLTL?.shipmentCharges?.total?.value ? parseFloat(acceleratedLTL.shipmentCharges.total.value) : null,
      deliveryDate: null,
      fuelSurcharge: primaryQuote?.rate?.find(r => r.code === 'FUEL_SUR')?.value,
      accessorialCharges: null,
      charges,
      serviceOptions: details.map(d => ({
        serviceCode: d.service?.code,
        serviceName: d.service?.description,
        price: d.shipmentCharges?.total?.value ? parseFloat(d.shipmentCharges.total.value) : null,
        transitDays: d.timeInTransit?.timeInTransit ? parseInt(d.timeInTransit.timeInTransit) : null,
        isGuaranteed: d.isGuaranteed === 'true'
      })),
      details: data
    };

    res.json(standardizedResponse);
  } catch (error) {
    console.error('❌ TForce Quote Error:', error);
    res.status(500).json({
      error: 'TForce API Error',
      message: error.message
    });
  }
});

/**
 * POST /api/tforce/transit-time
 * 获取运输时间估算
 */
router.post('/transit-time', async (req, res) => {
  try {
    const { originZip, destinationZip, shipDate } = req.body;

    if (!originZip || !destinationZip) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip and destinationZip are required'
      });
    }

    const accessToken = await getAccessToken();
    const shipDateFormatted = shipDate || new Date().toISOString().split('T')[0];

    const response = await fetch(`${TFORCE_API_BASE_URL}/rating/transit-times?api-version=${TFORCE_API_VERSION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        originPostalCode: originZip,
        originCountry: 'US',
        destinationPostalCode: destinationZip,
        destinationCountry: 'US',
        shipDate: shipDateFormatted
      })
    });

    const data = await response.json();
    
    console.log('📦 TForce Transit Time Response:', response.status, JSON.stringify(data, null, 2));

    res.json({
      carrier: 'TForce Freight',
      carrierCode: 'TFORCE',
      originZip,
      destinationZip,
      transitDays: data.transitDays || data.serviceStandard?.transitDays,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      details: data
    });
  } catch (error) {
    console.error('❌ TForce Transit Time Error:', error);
    res.status(500).json({
      error: 'TForce API Error',
      message: error.message
    });
  }
});

/**
 * GET /api/tforce/accessorials
 * 获取可用的附加服务列表
 */
router.get('/accessorials', (req, res) => {
  res.json({
    carrier: 'TForce Freight',
    accessorials: [
      // Pickup Services
      { code: 'LFTGP', description: 'Liftgate Pickup', category: 'pickup' },
      { code: 'RESP', description: 'Residential Pickup', category: 'pickup' },
      { code: 'INSP', description: 'Inside Pickup', category: 'pickup' },
      { code: 'LIMAP', description: 'Limited Access Pickup', category: 'pickup' },
      { code: 'CONSP', description: 'Construction Site Pickup', category: 'pickup' },
      
      // Delivery Services
      { code: 'LFTGD', description: 'Liftgate Delivery', category: 'delivery' },
      { code: 'RESD', description: 'Residential Delivery', category: 'delivery' },
      { code: 'INSD', description: 'Inside Delivery', category: 'delivery' },
      { code: 'LIMAD', description: 'Limited Access Delivery', category: 'delivery' },
      { code: 'CONSD', description: 'Construction Site Delivery', category: 'delivery' },
      { code: 'APPT', description: 'Appointment Required', category: 'delivery' },
      { code: 'NTFY', description: 'Notify Before Delivery', category: 'delivery' },
      
      // Other Services
      { code: 'HAZM', description: 'Hazardous Materials', category: 'other' },
      { code: 'PFRZ', description: 'Protect From Freezing', category: 'other' },
      { code: 'SORT', description: 'Sort and Segregate', category: 'other' },
      { code: 'GUAR', description: 'Guaranteed Service', category: 'other' },
      { code: 'EXLN', description: 'Extreme Length', category: 'other' }
    ]
  });
});

/**
 * GET /api/tforce/token-status
 * 检查 OAuth token 状态（调试用）
 */
router.get('/token-status', (req, res) => {
  res.json({
    hasToken: !!cachedToken,
    tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
    isValid: cachedToken && tokenExpiry && Date.now() < tokenExpiry,
    expiresIn: tokenExpiry ? Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000)) : 0
  });
});

module.exports = router;
