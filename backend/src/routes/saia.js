/**
 * Saia LTL Freight API 代理路由
 * API文档: https://api.saia.com/rate-quote/public/api-docs/index
 * 
 * 前端调用: /api/saia/quote
 * 后端转发: Saia Rate Quote API
 */

const express = require('express');
const router = express.Router();

// Saia API 配置
// 文档: https://api.saia.com/rate-quote/public/api-docs/index
const SAIA_API_BASE_URL = 'https://api.saia.com/rate-quote';
const SAIA_USERNAME = process.env.SAIA_USERNAME;
const SAIA_PASSWORD = process.env.SAIA_PASSWORD;
// RQ-Key header (Subscription Primary Key)
const SAIA_RQ_KEY = process.env.SAIA_RQ_KEY;
// Account Code - 需要从 Saia 获取（数字账户代码）
// 默认使用已验证可用的 accountCode (HAUPPAUGE TRANSPORTATION)
const SAIA_ACCOUNT_CODE = process.env.SAIA_ACCOUNT_CODE || '1111558';

// 常用 Zipcode 到 City/State 映射（用于快速查找）
const COMMON_ZIPCODES = {
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '11101': { city: 'Long Island City', state: 'NY' },
  '11201': { city: 'Brooklyn', state: 'NY' },
  '11788': { city: 'Hauppauge', state: 'NY' },
  '11354': { city: 'Flushing', state: 'NY' },
  '90001': { city: 'Los Angeles', state: 'CA' },
  '90007': { city: 'Los Angeles', state: 'CA' },
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '60601': { city: 'Chicago', state: 'IL' },
  '77001': { city: 'Houston', state: 'TX' },
  '85001': { city: 'Phoenix', state: 'AZ' },
  '19101': { city: 'Philadelphia', state: 'PA' },
  '75201': { city: 'Dallas', state: 'TX' },
  '78201': { city: 'San Antonio', state: 'TX' },
  '92101': { city: 'San Diego', state: 'CA' },
  '08601': { city: 'Trenton', state: 'NJ' },
  '07001': { city: 'Newark', state: 'NJ' },
  '33101': { city: 'Miami', state: 'FL' },
  '30301': { city: 'Atlanta', state: 'GA' },
  '98101': { city: 'Seattle', state: 'WA' },
  '02101': { city: 'Boston', state: 'MA' }
};

// Zipcode 缓存
const zipCodeCache = {};

/**
 * 根据 Zipcode 获取 City 和 State
 * 优先使用本地映射，然后尝试 zippopotam.us API
 */
const getLocationFromZip = async (zipcode) => {
  if (!zipcode) return { city: 'Unknown', state: 'XX' };
  
  const zip = zipcode.toString().substring(0, 5);
  
  // 检查缓存
  if (zipCodeCache[zip]) {
    return zipCodeCache[zip];
  }
  
  // 检查本地映射
  if (COMMON_ZIPCODES[zip]) {
    zipCodeCache[zip] = COMMON_ZIPCODES[zip];
    return COMMON_ZIPCODES[zip];
  }
  
  // 根据 zipcode 前缀推断州
  const stateByPrefix = {
    '00': 'PR', '01': 'MA', '02': 'MA', '03': 'NH', '04': 'ME', '05': 'VT',
    '06': 'CT', '07': 'NJ', '08': 'NJ', '09': 'PR', '10': 'NY', '11': 'NY',
    '12': 'NY', '13': 'NY', '14': 'NY', '15': 'PA', '16': 'PA', '17': 'PA',
    '18': 'PA', '19': 'PA', '20': 'DC', '21': 'MD', '22': 'VA', '23': 'VA',
    '24': 'VA', '25': 'WV', '26': 'WV', '27': 'NC', '28': 'NC', '29': 'SC',
    '30': 'GA', '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL', '35': 'AL',
    '36': 'AL', '37': 'TN', '38': 'TN', '39': 'MS', '40': 'KY', '41': 'KY',
    '42': 'KY', '43': 'OH', '44': 'OH', '45': 'OH', '46': 'IN', '47': 'IN',
    '48': 'MI', '49': 'MI', '50': 'IA', '51': 'IA', '52': 'IA', '53': 'WI',
    '54': 'WI', '55': 'MN', '56': 'MN', '57': 'SD', '58': 'ND', '59': 'MT',
    '60': 'IL', '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'MO',
    '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE', '70': 'LA', '71': 'LA',
    '72': 'AR', '73': 'OK', '74': 'OK', '75': 'TX', '76': 'TX', '77': 'TX',
    '78': 'TX', '79': 'TX', '80': 'CO', '81': 'CO', '82': 'WY', '83': 'ID',
    '84': 'UT', '85': 'AZ', '86': 'AZ', '87': 'NM', '88': 'TX', '89': 'NV',
    '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA', '95': 'CA',
    '96': 'CA', '97': 'OR', '98': 'WA', '99': 'WA'
  };
  
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      timeout: 3000
    });
    if (response.ok) {
      const data = await response.json();
      if (data.places && data.places.length > 0) {
        const location = {
          city: data.places[0]['place name'] || 'Unknown',
          state: data.places[0]['state abbreviation'] || 'XX'
        };
        zipCodeCache[zip] = location;
        return location;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Zipcode API failed for ${zip}, using fallback:`, error.message);
  }
  
  // 使用前缀推断州作为后备
  const prefix = zip.substring(0, 2);
  const fallbackState = stateByPrefix[prefix] || 'NY';
  const fallback = { city: 'Unknown', state: fallbackState };
  zipCodeCache[zip] = fallback;
  return fallback;
};

/**
 * POST /api/saia/quote
 * 获取 Saia LTL 运输报价
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
 *   "accessorials": ["LFTO", "LFTP"]
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
      paymentTerms = 'Shipper' // Shipper, Consignee, ThirdParty
    } = req.body;

    // 验证必填字段
    if (!originZip || !destinationZip || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip, destinationZip, and items are required'
      });
    }

    // 如果没有提供 city/state，从 zipcode 查找
    let finalOriginCity = originCity;
    let finalOriginState = originState;
    let finalDestCity = destinationCity;
    let finalDestState = destinationState;

    if (!finalOriginCity || !finalOriginState) {
      const originLocation = await getLocationFromZip(originZip);
      finalOriginCity = finalOriginCity || originLocation.city;
      finalOriginState = finalOriginState || originLocation.state;
    }

    if (!finalDestCity || !finalDestState) {
      const destLocation = await getLocationFromZip(destinationZip);
      finalDestCity = finalDestCity || destLocation.city;
      finalDestState = finalDestState || destLocation.state;
    }

    console.log(`📍 Saia: Origin ${finalOriginCity}, ${finalOriginState} ${originZip}`);
    console.log(`📍 Saia: Dest ${finalDestCity}, ${finalDestState} ${destinationZip}`);

    // 默认发货日期为今天
    const shipDateFormatted = shipDate || new Date().toISOString().split('T')[0];

    // 使用配置的默认 accountCode，或尝试查询 origin zipcode 对应的 accountCode
    let originAccountCode = SAIA_ACCOUNT_CODE;
    
    // 尝试为该 zipcode 查找更合适的 accountCode（可选，失败时使用默认值）
    try {
      console.log(`🔍 Saia: 查询 ${originZip} 的 accountCode...`);
      const AUTH_HEADER = Buffer.from(`${SAIA_USERNAME}:${SAIA_PASSWORD}`).toString('base64');
      const accountsResponse = await fetch(
        `${SAIA_API_BASE_URL}/api/v1/accounts/zipcodes/${originZip}`,
        {
          method: 'GET',
          headers: {
            'RQ-Key': SAIA_RQ_KEY,
            'Authorization': `Basic ${AUTH_HEADER}`
          }
        }
      );
      
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        if (accounts && accounts.length > 0) {
          // 使用第一个可用的 accountCode
          originAccountCode = accounts[0].code;
          console.log(`✅ Saia: 找到 accountCode: ${originAccountCode} (${accounts[0].name})`);
        } else {
          console.log(`📋 Saia: ${originZip} 无专属 accountCode，使用默认: ${SAIA_ACCOUNT_CODE}`);
        }
      } else {
        console.log(`📋 Saia: 查询 ${originZip} 失败，使用默认 accountCode: ${SAIA_ACCOUNT_CODE}`);
      }
    } catch (err) {
      console.warn(`⚠️ Saia: 查询 accountCode 失败, 使用默认: ${SAIA_ACCOUNT_CODE}`, err.message);
    }

    // 构建 Saia API 请求格式（按照官方文档）
    // 文档: https://api.saia.com/rate-quote/public/api-docs/index
    // 注意: accountCode 必须放在 origin 对象里面！
    const saiaRequest = {
      userID: SAIA_USERNAME,
      password: SAIA_PASSWORD,
      payer: paymentTerms,
      origin: {
        city: finalOriginCity,
        state: finalOriginState,
        zipcode: originZip
      },
      destination: {
        city: finalDestCity,
        state: finalDestState,
        zipcode: destinationZip
      },
      weightUnits: 'LBS',
      measurementUnit: 'IN',
      details: items.map(item => ({
        width: Math.round(parseFloat(item.width) || 48),
        length: Math.round(parseFloat(item.length) || 48),
        height: Math.round(parseFloat(item.height) || 48),
        weight: Math.round(parseFloat(item.weight) || 500),
        class: parseFloat(item.class || item.freightClass) || 70, // Saia 支持小数 class 如 77.5, 92.5
        units: parseInt(item.pieces || item.pallets) || 1
      }))
    };

    // accountCode 必须放在 origin 对象里面（Saia API 要求）
    if (originAccountCode) {
      saiaRequest.origin.accountCode = originAccountCode;
    }

    // 添加附加服务
    const accessorialCodes = [...accessorials];
    if (originType === 'Residential' || originType === 'residential') {
      accessorialCodes.push('ResidentialPickup');
    }
    if (destinationType === 'Residential' || destinationType === 'residential') {
      accessorialCodes.push('ResidentialDelivery');
    }

    if (accessorialCodes.length > 0) {
      saiaRequest.accessorials = {
        code: accessorialCodes
      };
    }

    console.log('🚚 Saia Quote Request:', JSON.stringify(saiaRequest, null, 2));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // 如果有 RQ-Key，添加到 header
    if (SAIA_RQ_KEY) {
      headers['RQ-Key'] = SAIA_RQ_KEY;
    }

    const response = await fetch(`${SAIA_API_BASE_URL}/webservice/ratequote/customer-api`, {
      method: 'POST',
      headers,
      body: JSON.stringify(saiaRequest)
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('📦 Saia Raw Response:', text.substring(0, 500));
      data = { rawResponse: text, error: 'Non-JSON response' };
    }
    
    console.log('📦 Saia Quote Response:', response.status, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Saia API Error',
        message: data.message || data.errorMessage || data.error || 'Failed to get quote',
        code: data.errorCode,
        details: data
      });
    }

    // 检查返回状态
    if (data.status !== 'SUCCESS') {
      return res.status(400).json({
        error: 'Saia API Error',
        message: data.errors ? JSON.stringify(data.errors) : 'Quote request failed',
        details: data
      });
    }

    // 标准化响应格式
    const standardizedResponse = {
      carrier: 'Saia LTL Freight',
      carrierCode: 'SAIA',
      quoteId: String(data.quoteNumber || `SAIA-${Date.now()}`),
      netCharge: data.rateDetails?.totalInvoice || 0,
      transitDays: data.standardServiceDays || null,
      serviceType: 'Standard LTL',
      guaranteed: data.rateDetails?.totalInvoiceWithGss5 || null,
      guaranteedPremium: data.rateDetails?.totalInvoiceWithGss12 || null,
      deliveryDate: data.estimatedDeliveryDate || null,
      expirationDate: data.expirationDate || null,
      fuelSurcharge: data.surcharge?.fuelSurchargeAmount || null,
      fuelSurchargePercent: data.surcharge?.fuelSurchargePercent || null,
      accessorialCharges: data.rateAccessorials?.accessorials || [],
      terminals: data.terminals || {},
      // 多个服务选项
      serviceOptions: [
        {
          serviceCode: 'STD',
          serviceName: 'Saia Standard LTL',
          price: data.rateDetails?.totalInvoice || 0,
          transitDays: data.standardServiceDays || null,
          isGuaranteed: false
        }
      ],
      details: data
    };

    // 添加 Guaranteed 服务选项 (GSS 5-Day)
    if (data.rateDetails?.totalInvoiceWithGss5 && data.rateDetails.totalInvoiceWithGss5 > 0) {
      standardizedResponse.serviceOptions.push({
        serviceCode: 'GSS5',
        serviceName: 'Saia Guaranteed (5-Day)',
        price: data.rateDetails.totalInvoiceWithGss5,
        transitDays: 5,
        isGuaranteed: true
      });
    }

    // 添加 Guaranteed Premium 服务选项 (GSS 12)
    if (data.rateDetails?.totalInvoiceWithGss12 && data.rateDetails.totalInvoiceWithGss12 > 0) {
      standardizedResponse.serviceOptions.push({
        serviceCode: 'GSS12',
        serviceName: 'Saia Guaranteed Premium',
        price: data.rateDetails.totalInvoiceWithGss12,
        transitDays: data.standardServiceDays || null,
        isGuaranteed: true
      });
    }

    res.json(standardizedResponse);
  } catch (error) {
    console.error('❌ Saia Quote Error:', error);
    res.status(500).json({
      error: 'Saia API Error',
      message: error.message
    });
  }
});

/**
 * POST /api/saia/transit-time
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

    const shipDateFormatted = shipDate || new Date().toISOString().split('T')[0];

    const response = await fetch(`${SAIA_API_BASE_URL}/rate-quote/api/v3/transit-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': SAIA_AUTH_HEADER
      },
      body: JSON.stringify({
        originZip,
        destinationZip,
        pickupDate: shipDateFormatted
      })
    });

    const data = await response.json();
    
    console.log('📦 Saia Transit Time Response:', response.status, JSON.stringify(data, null, 2));

    res.json({
      carrier: 'Saia LTL Freight',
      carrierCode: 'SAIA',
      originZip,
      destinationZip,
      transitDays: data.transitDays,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      details: data
    });
  } catch (error) {
    console.error('❌ Saia Transit Time Error:', error);
    res.status(500).json({
      error: 'Saia API Error',
      message: error.message
    });
  }
});

/**
 * GET /api/saia/accessorials
 * 获取可用的附加服务列表
 */
router.get('/accessorials', (req, res) => {
  res.json({
    carrier: 'Saia LTL Freight',
    accessorials: [
      // Pickup Services
      { code: 'LFTP', description: 'Liftgate Pickup', category: 'pickup' },
      { code: 'RESP', description: 'Residential Pickup', category: 'pickup' },
      { code: 'INSP', description: 'Inside Pickup', category: 'pickup' },
      { code: 'LIMP', description: 'Limited Access Pickup', category: 'pickup' },
      { code: 'CONP', description: 'Construction Site Pickup', category: 'pickup' },
      
      // Delivery Services
      { code: 'LFTO', description: 'Liftgate Delivery', category: 'delivery' },
      { code: 'RESD', description: 'Residential Delivery', category: 'delivery' },
      { code: 'INSD', description: 'Inside Delivery', category: 'delivery' },
      { code: 'LIMD', description: 'Limited Access Delivery', category: 'delivery' },
      { code: 'COND', description: 'Construction Site Delivery', category: 'delivery' },
      { code: 'APPT', description: 'Appointment Delivery', category: 'delivery' },
      { code: 'NOTF', description: 'Notification Before Delivery', category: 'delivery' },
      
      // Other Services
      { code: 'HAZM', description: 'Hazardous Materials', category: 'other' },
      { code: 'PROT', description: 'Protect From Freezing', category: 'other' },
      { code: 'SORT', description: 'Sort and Segregate', category: 'other' },
      { code: 'GUAR', description: 'Guaranteed Service', category: 'other' },
      { code: 'MARK', description: 'Marking/Tagging', category: 'other' }
    ]
  });
});

/**
 * GET /api/saia/freight-classes
 * 获取有效的货运分类
 */
router.get('/freight-classes', (req, res) => {
  res.json({
    carrier: 'Saia LTL Freight',
    classes: [
      { class: '50', description: 'Clean Freight - Low Density' },
      { class: '55', description: 'Bricks, cement, hardwood flooring' },
      { class: '60', description: 'Car accessories, bottled beverages' },
      { class: '65', description: 'Car accessories & parts, bottled beverages' },
      { class: '70', description: 'Automobile engines, food items' },
      { class: '77.5', description: 'Tires, bathroom fixtures' },
      { class: '85', description: 'Crated machinery, cast iron stoves' },
      { class: '92.5', description: 'Computers, monitors, refrigerators' },
      { class: '100', description: 'Car covers, canvas, boat covers' },
      { class: '110', description: 'Cabinets, framed artwork' },
      { class: '125', description: 'Small household appliances' },
      { class: '150', description: 'Auto sheet metal parts, bookcases' },
      { class: '175', description: 'Clothing, couches stuffed furniture' },
      { class: '200', description: 'Auto sheet metal parts, aluminum tables' },
      { class: '250', description: 'Bamboo furniture, mattresses' },
      { class: '300', description: 'Wood cabinets, tables, chairs' },
      { class: '400', description: 'Deer antlers' },
      { class: '500', description: 'Bags of gold dust, ping pong balls' }
    ]
  });
});

module.exports = router;
