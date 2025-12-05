/**
 * 多承运商 LTL 报价 API 集成
 * 
 * 支持的承运商:
 *   - Warp Freight (gw.wearewarp.com)
 *   - RRTS / Roadrunner (webservices.rrts.com)
 * 
 * 通过后端代理调用，避免 CORS 跨域问题
 */

// 后端代理 URL
const getApiBaseUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * 通用 API 请求函数
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API Request Error [${config.method} ${url}]:`, error);
    throw error;
  }
};

// ==================== WARP API ====================

/**
 * 获取 Warp LTL 报价
 */
export const getWarpQuote = async (quoteData) => {
  try {
    const requestBody = {
      pickupDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      pickupInfo: { zipcode: quoteData.originZip },
      deliveryInfo: { zipcode: quoteData.destinationZip },
      listItems: quoteData.items.map(item => ({
        name: item.description || 'Freight Item',
        height: parseFloat(item.height) || 48,
        length: parseFloat(item.length) || 48,
        width: parseFloat(item.width) || 40,
        sizeUnit: 'IN',
        quantity: parseInt(item.pallets) || 1,
        totalWeight: parseFloat(item.weight) || 500,
        weightUnit: 'lbs',
        stackable: item.stackable || false
      })),
      shipmentType: 'LTL'
    };

    if (quoteData.pickupServices?.length > 0) {
      requestBody.pickupServices = quoteData.pickupServices;
    }
    if (quoteData.deliveryServices?.length > 0) {
      requestBody.deliveryServices = quoteData.deliveryServices;
    }

    console.log('🚚 Warp Quote Request:', requestBody);

    const response = await apiRequest('/warp/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    // 转换为统一格式
    if (response && response.quote_id) {
      return {
        carrier: 'Warp Freight',
        carrierCode: 'WARP',
        logo: '/images/carriers/warp.png',
        quoteId: response.quote_id,
        price: parseFloat(response.price?.amount || 0),
        currency: response.price?.currency_code || 'USD',
        transitDays: response.transit_time || 'TBD',
        serviceType: 'Standard LTL',
        guaranteedPrice: null,
        expDate: response.notes || new Date(response.expiration_time_utc * 1000).toLocaleDateString('en-US'),
        status: response.status,
        charges: response.charges || [],
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Warp Quote Error:', error);
    return null; // 返回 null 而不是抛出错误，允许其他承运商继续
  }
};

// ==================== RRTS API ====================

/**
 * 获取 RRTS (Roadrunner) LTL 报价
 */
export const getRRTSQuote = async (quoteData) => {
  try {
    // 计算货物的 Freight Class (简化版，实际应根据密度计算)
    const calculateFreightClass = (item) => {
      // 默认使用 class 100，如果有指定则使用指定值
      if (item.freightClass) return parseFloat(item.freightClass);
      
      // 简单的密度计算 (pcf = weight / cubic feet)
      const cubicFeet = (item.length * item.width * item.height) / 1728; // 转换为立方英尺
      const density = item.weight / cubicFeet;
      
      // 根据密度推算 class (简化版)
      if (density >= 50) return 50;
      if (density >= 35) return 55;
      if (density >= 30) return 60;
      if (density >= 22.5) return 65;
      if (density >= 15) return 70;
      if (density >= 13.5) return 77.5;
      if (density >= 12) return 85;
      if (density >= 10.5) return 92.5;
      if (density >= 9) return 100;
      if (density >= 8) return 110;
      if (density >= 7) return 125;
      if (density >= 6) return 150;
      if (density >= 5) return 175;
      if (density >= 4) return 200;
      if (density >= 3) return 250;
      if (density >= 2) return 300;
      if (density >= 1) return 400;
      return 500;
    };

    // 构建 RRTS 请求
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      originType: 'O', // O=Shipper
      paymentType: 'P', // P=Prepaid
      shipmentDetails: quoteData.items.map(item => ({
        actualClass: calculateFreightClass(item),
        weight: parseInt(item.weight) || 500
      })),
      serviceOptions: []
    };

    // 添加服务选项
    if (quoteData.pickupServices?.includes('liftgate') || quoteData.liftgatePickup) {
      requestBody.serviceOptions.push('LGP'); // Liftgate Pickup
    }
    if (quoteData.deliveryServices?.includes('liftgate') || quoteData.liftgateDelivery) {
      requestBody.serviceOptions.push('LGD'); // Liftgate Delivery
    }
    if (quoteData.pickupServices?.includes('residential') || quoteData.residentialPickup) {
      requestBody.serviceOptions.push('RSP'); // Residential Pickup
    }
    if (quoteData.deliveryServices?.includes('residential') || quoteData.residentialDelivery) {
      requestBody.serviceOptions.push('RSD'); // Residential Delivery
    }
    if (quoteData.insidePickup) {
      requestBody.serviceOptions.push('IP');
    }
    if (quoteData.insideDelivery) {
      requestBody.serviceOptions.push('ID');
    }
    if (quoteData.appointmentRequired) {
      requestBody.serviceOptions.push('APT');
    }

    console.log('🚛 RRTS Quote Request:', requestBody);

    const response = await apiRequest('/rrts/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 RRTS Quote Response:', response);

    // 转换为统一格式
    if (response && response.quoteNumber) {
      return {
        carrier: 'Roadrunner',
        carrierCode: 'RRTS',
        logo: '/images/carriers/roadrunner.png',
        quoteId: `RRTS-${response.quoteNumber}`,
        quoteNumber: response.quoteNumber,
        price: response.standardCharge || response.netCharge || 0,
        guaranteedPrice: response.guaranteed > 0 ? response.netCharge : null,
        currency: 'USD',
        transitDays: response.routingInfo?.estimatedTransitDays || 'TBD',
        serviceType: response.guaranteed > 0 ? 'Standard & Guaranteed' : 'Standard LTL',
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        charges: response.rateDetails || [],
        routingInfo: response.routingInfo || {},
        accountNumber: response.accountNumber
      };
    }
    return null;
  } catch (error) {
    console.error('❌ RRTS Quote Error:', error);
    return null;
  }
};

// ==================== 统一报价接口 ====================

/**
 * 获取所有承运商的 LTL 报价
 * @param {Object} quoteData - 报价请求数据
 * @returns {Promise<Array>} - 所有承运商的报价列表
 */
export const getAllLTLQuotes = async (quoteData) => {
  console.log('📤 Getting quotes from all carriers...', quoteData);
  
  // 并行请求所有承运商
  const [warpQuote, rrtsQuote] = await Promise.all([
    getWarpQuote(quoteData),
    getRRTSQuote(quoteData)
  ]);

  const quotes = [];
  let id = 1;

  // 添加 Warp 报价
  if (warpQuote) {
    quotes.push({
      id: id++,
      ...warpQuote,
      source: 'warp'
    });
  }

  // 添加 RRTS 报价
  if (rrtsQuote) {
    // 标准服务报价
    quotes.push({
      id: id++,
      ...rrtsQuote,
      serviceType: 'Standard LTL',
      price: rrtsQuote.price,
      source: 'rrts'
    });

    // 如果有 Guaranteed 服务，添加额外的报价选项
    if (rrtsQuote.guaranteedPrice && rrtsQuote.guaranteedPrice > 0) {
      quotes.push({
        id: id++,
        ...rrtsQuote,
        serviceType: 'Guaranteed Service',
        price: rrtsQuote.guaranteedPrice,
        source: 'rrts-guaranteed'
      });
    }
  }

  // 按价格排序
  quotes.sort((a, b) => a.price - b.price);

  console.log('✅ All quotes collected:', quotes);
  return quotes;
};

/**
 * 获取 LTL 报价 (兼容旧接口)
 * 同时请求 Warp 和 RRTS，返回所有可用报价
 */
export const getLTLQuote = async (quoteData) => {
  return getAllLTLQuotes(quoteData);
};

// ==================== 服务代码 ====================

/**
 * 获取 RRTS 服务代码列表
 */
export const getRRTSServiceCodes = async () => {
  try {
    return await apiRequest('/rrts/service-codes');
  } catch (error) {
    console.error('❌ Failed to get RRTS service codes:', error);
    return null;
  }
};

/**
 * 获取 RRTS Freight Classes
 */
export const getRRTSFreightClasses = async () => {
  try {
    return await apiRequest('/rrts/freight-classes');
  } catch (error) {
    console.error('❌ Failed to get RRTS freight classes:', error);
    return null;
  }
};

// ==================== 预订和追踪 ====================

/**
 * 预订 Warp 运输
 */
export const bookWarpShipment = async (bookingData) => {
  try {
    const requestBody = {
      quoteId: bookingData.quoteId || bookingData.warpQuoteId,
      shipmentType: 'LTL',
      pickupInfo: {
        locationName: bookingData.pickupContactName,
        contactName: bookingData.pickupContactPerson || bookingData.pickupContactName,
        contactPhone: bookingData.pickupContactPhone,
        contactEmail: bookingData.pickupContactEmail,
        address: {
          street: bookingData.pickupAddress,
          street2: bookingData.pickupAddress2 || '',
          city: bookingData.pickupCity,
          state: bookingData.pickupState,
          zipcode: bookingData.pickupZip
        },
        windowTime: {
          from: bookingData.pickupTimeFrom || new Date().toISOString(),
          to: bookingData.pickupTimeTo || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        },
        instructions: bookingData.pickupInstructions || ''
      },
      deliveryInfo: {
        locationName: bookingData.deliveryContactName,
        contactName: bookingData.deliveryContactPerson || bookingData.deliveryContactName,
        contactPhone: bookingData.deliveryContactPhone,
        contactEmail: bookingData.deliveryContactEmail,
        address: {
          street: bookingData.deliveryAddress,
          street2: bookingData.deliveryAddress2 || '',
          city: bookingData.deliveryCity,
          state: bookingData.deliveryState,
          zipcode: bookingData.deliveryZip
        },
        windowTime: {
          from: bookingData.deliveryTimeFrom || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          to: bookingData.deliveryTimeTo || new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString()
        },
        instructions: bookingData.deliveryInstructions || ''
      },
      listItems: bookingData.items.map(item => ({
        name: item.description || 'Freight Item',
        height: parseFloat(item.height) || 48,
        length: parseFloat(item.length) || 48,
        width: parseFloat(item.width) || 40,
        sizeUnit: 'IN',
        quantity: parseInt(item.pallets) || 1,
        totalWeight: parseFloat(item.weight) || 500,
        weightUnit: 'lbs',
        stackable: item.stackable || false
      }))
    };

    return await apiRequest('/warp/booking', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    console.error('❌ Warp Booking Error:', error);
    throw error;
  }
};

/**
 * 追踪 Warp 运输
 */
export const trackWarpShipment = async (trackingNumbers) => {
  try {
    return await apiRequest('/warp/tracking', {
      method: 'POST',
      body: JSON.stringify({
        trackingNumbers: Array.isArray(trackingNumbers) ? trackingNumbers : [trackingNumbers]
      })
    });
  } catch (error) {
    console.error('❌ Warp Tracking Error:', error);
    throw error;
  }
};

// ==================== 导出 ====================

export const freightApi = {
  // 统一接口
  getLTLQuote,
  getAllLTLQuotes,
  
  // Warp 专用
  getWarpQuote,
  bookWarpShipment,
  trackWarpShipment,
  
  // RRTS 专用
  getRRTSQuote,
  getRRTSServiceCodes,
  getRRTSFreightClasses
};

export default freightApi;

