/**
 * Warp Freight API 集成
 * API 文档: https://developer.wearewarp.com/docs/freight/#/
 * 
 * 通过后端代理调用，避免 CORS 跨域问题
 * 前端 -> 后端代理 (/api/warp/*) -> Warp API (gw.wearewarp.com)
 */

// 后端代理 URL
// REACT_APP_API_URL 可能是 'http://localhost:5001/api' 或 'http://localhost:5001'
// 为了避免重复，我们直接构建完整的 URL
const getWarpProxyUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  // 如果 baseUrl 已经以 /api 结尾，就不再添加
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/warp`;
  }
  return `${baseUrl}/api/warp`;
};
const WARP_PROXY_URL = getWarpProxyUrl();

// 统一的API请求函数 - 通过后端代理
const warpRequest = async (endpoint, options = {}) => {
  const url = `${WARP_PROXY_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  };
  
  console.log('🚚 Warp API Request (via proxy):', {
    url,
    method: config.method,
    body: options.body ? JSON.parse(options.body) : null
  });
  
  try {
    const response = await fetch(url, config);
    
    console.log('📦 Warp API Response Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Warp API Error:', errorData);
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Warp API Response Data:', data);
    return data;
  } catch (error) {
    console.error(`❌ Warp API Request Error [${config.method} ${url}]:`, error);
    throw error;
  }
};

/**
 * 获取LTL运输报价
 * @param {Object} quoteData - 报价请求数据
 * @returns {Promise<Array>} - 承运商报价列表
 * 
 * API文档格式:
 * - pickupDate: String (Required) - 取货日期
 * - pickupInfo: { zipcode: String } (Required) - 取货地址
 * - deliveryInfo: { zipcode: String } (Required) - 送货地址
 * - listItems: Array<Item> (Required) - 货物列表
 * - pickupServices: Array<PickupService> (Optional)
 * - deliveryServices: Array<DeliveryService> (Optional)
 * - shipmentType: "FTL" or "LTL" (Optional)
 */
export const getLTLQuote = async (quoteData) => {
  try {
    // 构建符合Warp API规范的请求体
    const requestBody = {
      // 取货日期 (Required)
      pickupDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      
      // 取货信息 (Required)
      pickupInfo: {
        zipcode: quoteData.originZip
      },
      
      // 送货信息 (Required)
      deliveryInfo: {
        zipcode: quoteData.destinationZip
      },
      
      // 货物列表 (Required)
      listItems: quoteData.items.map(item => ({
        name: item.description || 'Freight Item',
        height: parseFloat(item.height) || 48,
        length: parseFloat(item.length) || 48,
        width: parseFloat(item.width) || 40,
        sizeUnit: 'IN', // 英寸
        quantity: parseInt(item.pallets) || 1,
        totalWeight: parseFloat(item.weight) || 500,
        weightUnit: 'lbs',
        stackable: item.stackable || false,
        notes: item.description || ''
      })),
      
      // 运输类型 (Optional)
      shipmentType: 'LTL'
    };

    // 添加取货服务 (Optional)
    if (quoteData.pickupServices && quoteData.pickupServices.length > 0) {
      requestBody.pickupServices = quoteData.pickupServices;
    }

    // 添加送货服务 (Optional)
    if (quoteData.deliveryServices && quoteData.deliveryServices.length > 0) {
      requestBody.deliveryServices = quoteData.deliveryServices;
    }

    console.log('📤 Warp LTL Quote Request:', requestBody);

    // 调用后端代理获取报价 - 端点是 /quote
    const response = await warpRequest('/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    // Warp API 返回单个报价对象，转换为数组格式
    if (response && response.quote_id) {
      // 单个报价响应格式
      const quote = response;
      return [{
        id: 1,
        carrier: 'Warp Freight',
        logo: 'https://wearewarp.com/logo.png',
        serviceLevel: quote.shipmentType || 'LTL',
        price: parseFloat(quote.price?.amount || 0),
        currency: quote.price?.currency_code || 'USD',
        serviceType: 'Standard',
        transitDays: quote.transit_time || 'TBD',
        transitType: 'Direct',
        maxLiability: { new: 0, used: 0 },
        expDate: quote.notes || new Date(quote.expiration_time_utc * 1000).toLocaleDateString('en-US'),
        status: quote.status,
        pickupTerminal: {},
        dropTerminal: {},
        warpQuoteId: quote.quote_id,
        charges: quote.charges || []
      }];
    }

    // 如果响应包含 data 字段
    if (response && response.data) {
      const quotes = response.data.quotes || response.data || [];
      
      return Array.isArray(quotes) ? quotes.map((quote, index) => ({
        id: index + 1,
        carrier: quote.carrierName || quote.carrier?.name || 'Warp Carrier',
        logo: quote.carrierLogo || quote.carrier?.logo || 'https://wearewarp.com/logo.png',
        serviceLevel: quote.serviceLevel || 'Standard LTL',
        price: parseFloat(quote.totalPrice || quote.price || quote.totalCharges || 0),
        serviceType: quote.serviceType || 'Standard',
        transitDays: quote.transitDays || quote.transitTime || 'TBD',
        transitType: quote.transitType || 'Direct',
        maxLiability: {
          new: parseFloat(quote.maxLiability?.new || quote.liability?.new || 0),
          used: parseFloat(quote.maxLiability?.used || quote.liability?.used || 0)
        },
        expDate: quote.expirationDate || quote.expDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        pickupTerminal: quote.pickupTerminal || {},
        dropTerminal: quote.deliveryTerminal || quote.dropTerminal || {},
        warpQuoteId: quote.quoteId || quote.id || `WRP-${Date.now()}`
      })) : [];
    }

    // 如果响应是直接的数组
    if (Array.isArray(response)) {
      return response.map((quote, index) => ({
        id: index + 1,
        carrier: quote.carrierName || 'Warp Carrier',
        logo: 'https://wearewarp.com/logo.png',
        serviceLevel: quote.serviceLevel || 'Standard LTL',
        price: parseFloat(quote.totalPrice || quote.price || 0),
        serviceType: quote.serviceType || 'Standard',
        transitDays: quote.transitDays || 'TBD',
        transitType: 'Direct',
        maxLiability: { new: 0, used: 0 },
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        pickupTerminal: {},
        dropTerminal: {},
        warpQuoteId: quote.quoteId || `WRP-${Date.now()}`
      }));
    }

    console.log('⚠️ Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('❌ 获取Warp LTL报价失败:', error);
    throw new Error('获取报价失败: ' + error.message);
  }
};

/**
 * 预订运输（Book Shipment）
 * @param {Object} bookingData - 预订数据
 * @returns {Promise<Object>} - 预订确认信息
 * 
 * API端点: POST /booking
 */
export const bookLTLShipment = async (bookingData) => {
  try {
    const requestBody = {
      quoteId: bookingData.quoteId || bookingData.warpQuoteId,
      shipmentType: 'LTL',
      
      // Shipper/Pickup信息
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
      
      // Consignee/Delivery信息
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
      
      // 货物信息
      listItems: bookingData.items.map(item => ({
        name: item.description || 'Freight Item',
        height: parseFloat(item.height) || 48,
        length: parseFloat(item.length) || 48,
        width: parseFloat(item.width) || 40,
        sizeUnit: 'IN',
        quantity: parseInt(item.pallets) || 1,
        totalWeight: parseFloat(item.weight) || 500,
        weightUnit: 'lbs',
        stackable: item.stackable || false,
        notes: item.description || ''
      }))
    };

    // 添加服务
    if (bookingData.pickupServices && bookingData.pickupServices.length > 0) {
      requestBody.pickupServices = bookingData.pickupServices;
    }
    if (bookingData.deliveryServices && bookingData.deliveryServices.length > 0) {
      requestBody.deliveryServices = bookingData.deliveryServices;
    }

    console.log('📤 Warp Book Shipment Request:', requestBody);

    const response = await warpRequest('/booking', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    return response;
  } catch (error) {
    console.error('❌ Warp预订失败:', error);
    throw new Error('预订失败: ' + error.message);
  }
};

/**
 * 获取运输追踪信息
 * @param {Array<string>} trackingNumbers - 追踪号码数组
 * @returns {Promise<Object>} - 追踪信息
 * 
 * API端点: POST /tracking
 */
export const trackShipment = async (trackingNumbers) => {
  try {
    const requestBody = {
      trackingNumbers: Array.isArray(trackingNumbers) ? trackingNumbers : [trackingNumbers]
    };

    const response = await warpRequest('/tracking', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    return response;
  } catch (error) {
    console.error('❌ 追踪失败:', error);
    throw new Error('追踪失败: ' + error.message);
  }
};

export const warpApi = {
  getLTLQuote,
  bookLTLShipment,
  trackShipment
};

export default warpApi;
