/**
 * 多承运商 LTL 报价 API 集成
 * 
 * 支持的承运商:
 *   - Warp Freight (gw.wearewarp.com)
 *   - RRTS / Roadrunner (webservices.rrts.com)
 *   - R+L Carriers (RLC)
 *   - Saia LTL Freight
 *   - TForce Freight
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

// 承运商 Logo 映射
const CARRIER_LOGOS = {
  'WARP': '/images/carriers/warp.svg',
  'RRTS': '/images/carriers/roadrunner.svg',
  'RLC': '/images/carriers/rlc.svg',
  'SAIA': '/images/carriers/saia.svg',
  'TFORCE': '/images/carriers/tforce.svg',
  'EDIEXPRESS': '/images/carriers/ediexpress.svg',
  'STG': '/images/carriers/stg.svg',
  'WELOGX': '/images/carriers/welogx.png',
  'AACT': '/images/carriers/aact.png'
};

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
      listItems: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseFloat(item.weight) || 500;
        return {
          name: item.description || 'Freight Item',
          height: parseFloat(item.height) || 48,
          length: parseFloat(item.length) || 48,
          width: parseFloat(item.width) || 40,
          sizeUnit: 'IN',
          quantity: pallets,
          totalWeight: totalWeight,
          weightUnit: 'lbs',
          stackable: item.stackable || false
        };
      }),
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
      // Warp 可能返回多种服务等级
      const serviceOptions = [];
      
      // 如果有多个报价选项
      if (response.quotes && Array.isArray(response.quotes)) {
        response.quotes.forEach((q, idx) => {
          serviceOptions.push({
            serviceCode: q.service_code || `OPT${idx}`,
            serviceName: q.service_name || `Warp ${q.service_type || 'LTL'}`,
            price: parseFloat(q.price?.amount || q.amount || 0),
            transitDays: q.transit_time || null,
            isGuaranteed: q.guaranteed || false
          });
        });
      }
      
      // 标准服务
      if (serviceOptions.length === 0) {
        serviceOptions.push({
          serviceCode: 'STD',
          serviceName: 'Warp Standard LTL',
          price: parseFloat(response.price?.amount || 0),
          transitDays: response.transit_time ? parseInt(response.transit_time) : null,
          isGuaranteed: false
        });
      }
      
      return {
        carrier: 'Warp Freight',
        carrierCode: 'WARP',
        logo: CARRIER_LOGOS['WARP'],
        quoteId: response.quote_id,
        price: parseFloat(response.price?.amount || 0),
        currency: response.price?.currency_code || 'USD',
        transitDays: response.transit_time || 'TBD',
        serviceType: 'Warp Standard LTL',
        guaranteedPrice: response.guaranteed_price || null,
        expDate: response.notes || new Date(response.expiration_time_utc * 1000).toLocaleDateString('en-US'),
        status: response.status,
        serviceOptions: serviceOptions.length > 1 ? serviceOptions : null,
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

    // 计算托盘总数和线性英尺
    const totalPallets = quoteData.items.reduce((sum, item) => sum + (parseInt(item.pallets) || 1), 0);
    const totalLinearFeet = quoteData.items.reduce((sum, item) => {
      const length = parseFloat(item.length) || 48;
      const pallets = parseInt(item.pallets) || 1;
      return sum + ((length / 12) * pallets); // 转换为英尺
    }, 0);
    const totalCubicFeet = quoteData.items.reduce((sum, item) => {
      const length = parseFloat(item.length) || 48;
      const width = parseFloat(item.width) || 40;
      const height = parseFloat(item.height) || 48;
      const pallets = parseInt(item.pallets) || 1;
      return sum + ((length * width * height / 1728) * pallets); // 立方英尺
    }, 0);

    // 构建 RRTS 请求
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      originType: 'O', // O=Shipper
      paymentType: 'P', // P=Prepaid
      shipmentDetails: quoteData.items.map(item => {
        const totalWeight = parseInt(item.weight) || 500;
        return {
          actualClass: calculateFreightClass(item),
          weight: totalWeight
        };
      }),
      // 添加托盘数和体积信息，提高报价准确性
      palletCount: totalPallets,
      linearFeet: Math.ceil(totalLinearFeet * 10) / 10, // 保留一位小数
      cubicFeet: Math.ceil(totalCubicFeet),
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
      // Roadrunner 可能返回标准和保证服务
      const serviceOptions = [];
      
      // 标准服务
      if (response.standardCharge || response.netCharge) {
        serviceOptions.push({
          serviceCode: 'STD',
          serviceName: 'Roadrunner Standard LTL',
          price: parseFloat(response.standardCharge || response.netCharge) || 0,
          transitDays: response.routingInfo?.estimatedTransitDays || null,
          isGuaranteed: false
        });
      }
      
      // 如果有 Guaranteed 服务
      if (response.guaranteed && response.guaranteed > 0) {
        serviceOptions.push({
          serviceCode: 'GRD',
          serviceName: 'Roadrunner Guaranteed',
          price: parseFloat(response.guaranteed),
          transitDays: response.routingInfo?.estimatedTransitDays || null,
          isGuaranteed: true
        });
      }
      
      return {
        carrier: 'Roadrunner',
        carrierCode: 'RRTS',
        logo: CARRIER_LOGOS['RRTS'],
        quoteId: `RRTS-${response.quoteNumber}`,
        quoteNumber: response.quoteNumber,
        price: response.standardCharge || response.netCharge || 0,
        guaranteedPrice: response.guaranteed > 0 ? response.guaranteed : null,
        currency: 'USD',
        transitDays: response.routingInfo?.estimatedTransitDays ? `${response.routingInfo.estimatedTransitDays} Days` : 'TBD',
        serviceType: 'Roadrunner Standard LTL',
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        serviceOptions: serviceOptions.length > 1 ? serviceOptions : null,
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

// ==================== R+L Carriers API ====================

/**
 * 获取 R+L Carriers LTL 报价
 */
export const getRLCQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          class: item.freightClass || '70',
          weight: totalWeight,
          pieces: pallets,
          length: parseInt(item.length) || 48,
          width: parseInt(item.width) || 40,
          height: parseInt(item.height) || 48
        };
      }),
      accessorials: []
    };

    // 添加附加服务
    if (quoteData.pickupServices?.includes('lift_gate') || quoteData.liftgatePickup) {
      requestBody.accessorials.push('LiftGatePickup');
    }
    if (quoteData.deliveryServices?.includes('lift_gate') || quoteData.liftgateDelivery) {
      requestBody.accessorials.push('LiftGateDelivery');
    }
    if (quoteData.originLocationType === 'residential') {
      requestBody.accessorials.push('ResidentialPickup');
    }
    if (quoteData.destinationLocationType === 'residential') {
      requestBody.accessorials.push('ResidentialDelivery');
    }

    console.log('🚛 RLC Quote Request:', requestBody);

    const response = await apiRequest('/rlc/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 RLC Quote Response:', response);

    if (response && (response.netCharge || response.quoteId)) {
      // R+L Carriers 可能返回多个服务等级
      const serviceOptions = [];
      
      // 标准服务
      if (response.netCharge) {
        serviceOptions.push({
          serviceCode: 'STD',
          serviceName: 'R+L Standard LTL',
          price: parseFloat(response.netCharge) || 0,
          transitDays: response.transitDays || null,
          isGuaranteed: false
        });
      }
      
      // 如果有 Guaranteed 服务
      if (response.guaranteed && response.guaranteed > 0) {
        serviceOptions.push({
          serviceCode: 'GRD',
          serviceName: 'R+L Guaranteed Service',
          price: parseFloat(response.guaranteed),
          transitDays: response.transitDays || null,
          isGuaranteed: true
        });
      }
      
      return {
        carrier: 'R+L Carriers',
        carrierCode: 'RLC',
        logo: CARRIER_LOGOS['RLC'],
        quoteId: response.quoteId || `RLC-${Date.now()}`,
        price: parseFloat(response.netCharge) || 0,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'TBD',
        serviceType: 'R+L Standard LTL',
        guaranteedPrice: response.guaranteed || null,
        fuelSurcharge: response.fuelSurcharge || null,
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        serviceOptions: serviceOptions.length > 1 ? serviceOptions : null,
        routingInfo: response.details?.routingInfo || {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ RLC Quote Error:', error);
    return null;
  }
};

// ==================== Saia API ====================

/**
 * 获取 Saia LTL 报价
 */
export const getSaiaQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          class: item.freightClass || '70',
          weight: totalWeight,
          pieces: pallets,
          length: parseInt(item.length) || 48,
          width: parseInt(item.width) || 40,
          height: parseInt(item.height) || 48
        };
      }),
      accessorials: [],
      originType: quoteData.originLocationType === 'residential' ? 'Residential' : 'Commercial',
      destinationType: quoteData.destinationLocationType === 'residential' ? 'Residential' : 'Commercial'
    };

    // 添加附加服务
    if (quoteData.pickupServices?.includes('lift_gate')) {
      requestBody.accessorials.push('LFTP');
    }
    if (quoteData.deliveryServices?.includes('lift_gate')) {
      requestBody.accessorials.push('LFTO');
    }
    if (quoteData.deliveryServices?.includes('inside_delivery')) {
      requestBody.accessorials.push('INSD');
    }
    if (quoteData.deliveryServices?.includes('appointment_delivery')) {
      requestBody.accessorials.push('APPT');
    }

    console.log('🚛 Saia Quote Request:', requestBody);

    const response = await apiRequest('/saia/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 Saia Quote Response:', response);

    if (response && (response.netCharge || response.quoteId)) {
      // Saia 可能返回多种服务等级
      const serviceOptions = [];
      
      // 标准服务
      if (response.netCharge) {
        serviceOptions.push({
          serviceCode: 'STD',
          serviceName: 'Saia Standard LTL',
          price: parseFloat(response.netCharge) || 0,
          transitDays: response.transitDays || null,
          isGuaranteed: false
        });
      }
      
      // 如果有 Guaranteed 服务
      if (response.guaranteed && response.guaranteed > 0) {
        serviceOptions.push({
          serviceCode: 'GRD',
          serviceName: 'Saia Guaranteed Service',
          price: parseFloat(response.guaranteed),
          transitDays: response.transitDays || null,
          isGuaranteed: true
        });
      }
      
      // 如果有 Expedited 服务
      if (response.expedited && response.expedited > 0) {
        serviceOptions.push({
          serviceCode: 'EXP',
          serviceName: 'Saia Expedited',
          price: parseFloat(response.expedited),
          transitDays: response.expeditedDays || null,
          isGuaranteed: false
        });
      }
      
      return {
        carrier: 'Saia LTL Freight',
        carrierCode: 'SAIA',
        logo: CARRIER_LOGOS['SAIA'],
        quoteId: response.quoteId || `SAIA-${Date.now()}`,
        price: parseFloat(response.netCharge) || 0,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'TBD',
        serviceType: 'Saia Standard LTL',
        guaranteedPrice: response.guaranteed || null,
        fuelSurcharge: response.fuelSurcharge || null,
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        serviceOptions: serviceOptions.length > 1 ? serviceOptions : null,
        deliveryDate: response.deliveryDate,
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Saia Quote Error:', error);
    return null;
  }
};

// ==================== TForce API ====================

/**
 * 获取 TForce Freight LTL 报价
 */
export const getTForceQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          class: item.freightClass || '70',
          weight: totalWeight,
          pieces: pallets,
          length: parseInt(item.length) || 48,
          width: parseInt(item.width) || 40,
          height: parseInt(item.height) || 48
        };
      }),
      accessorials: [],
      originType: quoteData.originLocationType === 'residential' ? 'Residential' : 'Commercial',
      destinationType: quoteData.destinationLocationType === 'residential' ? 'Residential' : 'Commercial'
    };

    // 添加附加服务
    if (quoteData.pickupServices?.includes('lift_gate')) {
      requestBody.accessorials.push('LFTGP');
    }
    if (quoteData.deliveryServices?.includes('lift_gate')) {
      requestBody.accessorials.push('LFTGD');
    }
    if (quoteData.deliveryServices?.includes('inside_delivery')) {
      requestBody.accessorials.push('INSD');
    }
    if (quoteData.deliveryServices?.includes('appointment_delivery')) {
      requestBody.accessorials.push('APPT');
    }

    console.log('🚛 TForce Quote Request:', requestBody);

    const response = await apiRequest('/tforce/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 TForce Quote Response:', response);

    if (response && (response.netCharge || response.quoteId || response.serviceOptions)) {
      return {
        carrier: 'TForce Freight',
        carrierCode: 'TFORCE',
        logo: CARRIER_LOGOS['TFORCE'],
        quoteId: response.quoteId || `TFORCE-${Date.now()}`,
        price: parseFloat(response.netCharge) || 0,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'TBD',
        serviceType: response.serviceType || 'TForce Freight LTL',
        guaranteedPrice: response.guaranteed || null,
        acceleratedPrice: response.accelerated || null,
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        deliveryDate: response.deliveryDate,
        fuelSurcharge: response.fuelSurcharge,
        serviceOptions: response.serviceOptions, // TForce 返回的多个服务选项
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ TForce Quote Error:', error);
    return null;
  }
};

// ==================== EDI Express API ====================

/**
 * 获取 EDI Express LTL 报价
 * 文档: https://my.ediexpressinc.com/ediapi/docs/guide
 */
export const getEDIExpressQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          weight: totalWeight,
          freightClass: parseInt(item.freightClass || '70'),
          pieces: pallets,
          length: Math.round(parseFloat(item.length) || 48),
          width: Math.round(parseFloat(item.width) || 40),
          height: Math.round(parseFloat(item.height) || 48)
        };
      })
    };

    console.log('📤 EDI Express Request:', requestBody);

    const response = await apiRequest('/ediexpress/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📥 EDI Express Response:', response);

    if (response && response.success && response.netCharge > 0) {
      return {
        carrier: response.carrier || 'EDI Express',
        carrierCode: 'EDIEXPRESS',
        logo: CARRIER_LOGOS['EDIEXPRESS'],
        quoteId: response.quoteId || '',
        price: response.netCharge,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'Contact',
        serviceType: response.serviceType || 'Standard LTL',
        expDate: null,
        status: 'ACCEPT',
        fuelSurcharge: response.fuelSurcharge,
        notice: response.notice,
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ EDI Express Quote Error:', error);
    return null;
  }
};

// ==================== STG Logistics API ====================

/**
 * 获取 STG Logistics LTL 报价
 * XML Rate Quotes API
 */
export const getSTGQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      shipDate: quoteData.pickupDate,
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          pieces: pallets,
          pallets: pallets,
          weight: totalWeight,
          class: item.freightClass || '70',
          length: Math.round(parseFloat(item.length) || 48),
          width: Math.round(parseFloat(item.width) || 40),
          height: Math.round(parseFloat(item.height) || 48)
        };
      })
    };

    console.log('📤 STG Request:', requestBody);

    const response = await apiRequest('/stg/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📥 STG Response:', response);

    if (response && response.success && response.netCharge > 0) {
      return {
        carrier: response.carrier || 'STG Logistics',
        carrierCode: 'STG',
        logo: CARRIER_LOGOS['STG'],
        quoteId: response.quoteId || '',
        price: response.netCharge,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'Contact',
        serviceType: response.serviceType || 'Standard LTL',
        expDate: null,
        status: 'ACCEPT',
        fuelSurcharge: response.fuelSurcharge,
        totalPallets: response.totalPallets,
        totalPieces: response.totalPieces,
        totalWeight: response.totalWeight,
        charges: response.charges,
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ STG Quote Error:', error);
    return null;
  }
};

// ==================== AAA Cooper (AACT) API ====================

/**
 * 获取 AAA Cooper Transportation LTL 报价
 */
export const getAACTQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      originCity: quoteData.originCity || '',
      originState: quoteData.originState || '',
      destinationZip: quoteData.destinationZip,
      destinationCity: quoteData.destinationCity || '',
      destinationState: quoteData.destinationState || '',
      shipDate: quoteData.pickupDate || new Date().toISOString().split('T')[0],
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseInt(item.weight) || 500;
        return {
          class: item.freightClass || '70',
          weight: totalWeight,
          pieces: pallets,
        };
      }),
      accessorials: [],
      originType: quoteData.originLocationType === 'residential' ? 'residential' : 'commercial',
      destinationType: quoteData.destinationLocationType === 'residential' ? 'residential' : 'commercial'
    };

    if (quoteData.pickupServices?.includes('lift_gate')) requestBody.accessorials.push('LFTP');
    if (quoteData.deliveryServices?.includes('lift_gate')) requestBody.accessorials.push('LFTD');
    if (quoteData.deliveryServices?.includes('inside_delivery')) requestBody.accessorials.push('INSD');
    if (quoteData.deliveryServices?.includes('appointment_delivery')) requestBody.accessorials.push('APPT');

    console.log('📤 AACT Quote Request:', requestBody);

    const response = await apiRequest('/aact/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 AACT Quote Response:', response);

    if (response && response.success && response.netCharge > 0) {
      return {
        carrier: 'AAA Cooper Transportation',
        carrierCode: 'AACT',
        logo: CARRIER_LOGOS['AACT'],
        quoteId: response.quoteId || `AACT-${Date.now()}`,
        price: response.netCharge,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'TBD',
        serviceType: response.serviceType || 'Standard LTL',
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        fuelSurcharge: response.fuelSurcharge,
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ AACT Quote Error:', error);
    return null;
  }
};

// ==================== Welogx API ====================

/**
 * 获取 Welogx 自有 LTL 报价
 */
export const getWelogxQuote = async (quoteData) => {
  try {
    const requestBody = {
      originZip: quoteData.originZip,
      destinationZip: quoteData.destinationZip,
      distanceMiles: quoteData.distanceMiles || null,
      items: quoteData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseFloat(item.weight) || 500;
        return {
          weight: totalWeight,
          length: parseFloat(item.length) || 48,
          width: parseFloat(item.width) || 40,
          height: parseFloat(item.height) || 48,
          freightClass: item.freightClass || '70',
          pallets: pallets
        };
      }),
      pickupServices: quoteData.pickupServices || [],
      deliveryServices: quoteData.deliveryServices || [],
      originType: quoteData.originLocationType === 'residential' ? 'residential' : 'commercial',
      destinationType: quoteData.destinationLocationType === 'residential' ? 'residential' : 'commercial'
    };

    console.log('📤 Welogx Quote Request:', requestBody);

    const response = await apiRequest('/welogx/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('📦 Welogx Quote Response:', response);

    if (response && response.success && response.netCharge > 0) {
      return {
        carrier: 'Welogx Freight',
        carrierCode: 'WELOGX',
        logo: CARRIER_LOGOS['WELOGX'],
        quoteId: response.quoteId || `WLX-${Date.now()}`,
        price: response.netCharge,
        currency: 'USD',
        transitDays: response.transitDays ? `${response.transitDays} Days` : 'TBD',
        serviceType: response.serviceType || 'Welogx Standard LTL',
        expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
        status: 'ACCEPT',
        fuelSurcharge: response.fuelSurcharge,
        distanceMiles: response.distanceMiles,
        breakdown: response.breakdown,
        routingInfo: {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Welogx Quote Error:', error);
    return null;
  }
};

// ==================== 统一报价接口 ====================

/**
 * 服务等级分类
 */
const SERVICE_LEVELS = {
  STANDARD: { name: 'Standard LTL', badge: 'standard', color: '#4CAF50' },
  GUARANTEED: { name: 'Guaranteed', badge: 'guaranteed', color: '#2196F3' },
  EXPEDITED: { name: 'Expedited', badge: 'expedited', color: '#FF9800' },
  ACCELERATED: { name: 'Accelerated', badge: 'accelerated', color: '#9C27B0' },
  ECONOMY: { name: 'Economy', badge: 'economy', color: '#607D8B' },
  PREMIUM: { name: 'Premium', badge: 'premium', color: '#E91E63' }
};

/**
 * 根据服务类型名称获取服务等级分类
 */
const getServiceLevel = (serviceType) => {
  const type = (serviceType || '').toLowerCase();
  if (type.includes('accelerat')) return SERVICE_LEVELS.ACCELERATED;
  if (type.includes('expedit') || type.includes('express')) return SERVICE_LEVELS.EXPEDITED;
  if (type.includes('guarant')) return SERVICE_LEVELS.GUARANTEED;
  if (type.includes('premium') || type.includes('priority')) return SERVICE_LEVELS.PREMIUM;
  if (type.includes('economy') || type.includes('value')) return SERVICE_LEVELS.ECONOMY;
  return SERVICE_LEVELS.STANDARD;
};

/**
 * 获取所有承运商的 LTL 报价
 * @param {Object} quoteData - 报价请求数据
 * @returns {Promise<Array>} - 所有承运商的报价列表（含多服务选项）
 */
export const getAllLTLQuotes = async (quoteData) => {
  console.log('📤 Getting quotes from ALL 9 carriers...', quoteData);
  
  // 并行请求所有 9 个承运商
  const results = await Promise.allSettled([
    getWarpQuote(quoteData),
    getRRTSQuote(quoteData),
    getRLCQuote(quoteData),
    getSaiaQuote(quoteData),
    getTForceQuote(quoteData),
    getEDIExpressQuote(quoteData),
    getSTGQuote(quoteData),
    getWelogxQuote(quoteData),
    getAACTQuote(quoteData)
  ]);

  const quotes = [];
  let id = 1;

  // 处理所有结果
  const carrierNames = ['Warp', 'RRTS', 'RLC', 'Saia', 'TForce', 'EDI Express', 'STG', 'Welogx', 'AAA Cooper'];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const quote = result.value;
      const carrierCode = quote.carrierCode;
      
      // 处理 TForce 的多个服务选项 (serviceOptions)
      if (quote.serviceOptions && Array.isArray(quote.serviceOptions) && quote.serviceOptions.length > 0) {
        quote.serviceOptions.forEach((option, optIndex) => {
          if (option.price && option.price > 0) {
            const serviceLevel = getServiceLevel(option.serviceName);
            quotes.push({
              id: id++,
              carrier: quote.carrier,
              carrierCode: carrierCode,
              logo: quote.logo,
              quoteId: `${quote.quoteId}-${option.serviceCode || optIndex}`,
              price: option.price,
              currency: quote.currency || 'USD',
              transitDays: option.transitDays ? `${option.transitDays} Days` : quote.transitDays,
              serviceType: option.serviceName || 'LTL Service',
              serviceLevel: serviceLevel.name,
              serviceBadge: serviceLevel.badge,
              serviceColor: serviceLevel.color,
              isGuaranteed: option.isGuaranteed || false,
              expDate: quote.expDate,
              status: quote.status || 'ACCEPT',
              fuelSurcharge: quote.fuelSurcharge,
              source: `${carrierCode.toLowerCase()}-${option.serviceCode || optIndex}`,
              pickupTerminal: quote.pickupTerminal,
              dropTerminal: quote.dropTerminal
            });
          }
        });
      } else {
        // 标准报价
        const serviceLevel = getServiceLevel(quote.serviceType);
        quotes.push({
          id: id++,
          ...quote,
          serviceLevel: serviceLevel.name,
          serviceBadge: serviceLevel.badge,
          serviceColor: serviceLevel.color,
          isGuaranteed: false,
          source: carrierCode.toLowerCase()
        });

        // 如果有 Guaranteed 服务价格，添加额外选项
        if (quote.guaranteedPrice && quote.guaranteedPrice > 0 && quote.guaranteedPrice !== quote.price) {
          quotes.push({
            id: id++,
            ...quote,
            serviceType: 'Guaranteed Service',
            serviceLevel: SERVICE_LEVELS.GUARANTEED.name,
            serviceBadge: SERVICE_LEVELS.GUARANTEED.badge,
            serviceColor: SERVICE_LEVELS.GUARANTEED.color,
            price: quote.guaranteedPrice,
            isGuaranteed: true,
            source: `${carrierCode.toLowerCase()}-guaranteed`
          });
        }

        // 如果有 Accelerated 服务价格
        if (quote.acceleratedPrice && quote.acceleratedPrice > 0 && quote.acceleratedPrice !== quote.price) {
          quotes.push({
            id: id++,
            ...quote,
            serviceType: 'Accelerated Service',
            serviceLevel: SERVICE_LEVELS.ACCELERATED.name,
            serviceBadge: SERVICE_LEVELS.ACCELERATED.badge,
            serviceColor: SERVICE_LEVELS.ACCELERATED.color,
            price: quote.acceleratedPrice,
            isGuaranteed: false,
            source: `${carrierCode.toLowerCase()}-accelerated`
          });
        }
      }
    } else {
      console.log(`⚠️ ${carrierNames[index]} quote failed or returned null:`, 
        result.status === 'rejected' ? result.reason : 'No quote');
    }
  });

  // 按价格排序（过滤掉 price 为 0 或无效的报价）
  const validQuotes = quotes.filter(q => q.price > 0);
  validQuotes.sort((a, b) => a.price - b.price);

  console.log(`✅ Total ${validQuotes.length} quotes collected from ${results.filter(r => r.status === 'fulfilled' && r.value).length} carriers`);
  return validQuotes;
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
      listItems: bookingData.items.map(item => {
        const pallets = parseInt(item.pallets) || 1;
        const totalWeight = parseFloat(item.weight) || 500;
        return {
          name: item.description || 'Freight Item',
          height: parseFloat(item.height) || 48,
          length: parseFloat(item.length) || 48,
          width: parseFloat(item.width) || 40,
          sizeUnit: 'IN',
          quantity: pallets,
          totalWeight: totalWeight,
          weightUnit: 'lbs',
          stackable: item.stackable || false
        };
      })
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
  getRRTSFreightClasses,
  
  // R+L Carriers 专用
  getRLCQuote,
  
  // Saia 专用
  getSaiaQuote,
  
  // TForce 专用
  getTForceQuote,
  
  // Welogx 自有报价
  getWelogxQuote,
  
  // AAA Cooper
  getAACTQuote
};

export default freightApi;

