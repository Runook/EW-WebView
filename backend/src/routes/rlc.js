/**
 * R+L Carriers API 代理路由
 * API文档: https://www.rlcarriers.com/freight/shipping-software/api/rate-quote/soap-v1-0-3
 * 
 * 使用 SOAP XML 格式
 * 方法: GetRateQuote(string APIKey, RequestObjects.RateQuoteRequest request)
 */

const express = require('express');
const router = express.Router();

// RLC API 配置
// 文档: https://api.rlcarriers.com/1.0.3/RateQuoteService.asmx?op=GetRateQuote
const RLC_SOAP_URL = 'https://api.rlcarriers.com/1.0.3/RateQuoteService.asmx';
const RLC_API_KEY = process.env.RLC_API_KEY;

// SOAP 命名空间
const RLC_NAMESPACE = 'http://www.rlcarriers.com/';

/**
 * 构建 SOAP XML 请求体
 * 文档: https://api.rlcarriers.com/1.0.3/RateQuoteService.asmx?op=GetRateQuote
 */
const buildSoapRequest = (quoteData) => {
  // 构建 Items XML (根据官方文档格式)
  const itemsXml = quoteData.items.map(item => `
          <Item>
            <Class>${item.class || '70'}</Class>
            <Weight>${item.weight || 500}</Weight>
            <Width>${item.width || 48}</Width>
            <Height>${item.height || 48}</Height>
            <Length>${item.length || 48}</Length>
          </Item>`).join('');

  // 构建 Accessorials XML (根据官方文档格式)
  let accessorialsXml = '';
  if (quoteData.accessorials && quoteData.accessorials.length > 0) {
    accessorialsXml = `
        <Accessorials>
          ${quoteData.accessorials.map(acc => `<RQAccessorial>${acc}</RQAccessorial>`).join('\n          ')}
        </Accessorials>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetRateQuote xmlns="${RLC_NAMESPACE}">
      <APIKey>${RLC_API_KEY}</APIKey>
      <request>
        <QuoteType>Domestic</QuoteType>
        <CODAmount>0</CODAmount>
        <Origin>
          <City>${quoteData.originCity || ''}</City>
          <StateOrProvince>${quoteData.originState || ''}</StateOrProvince>
          <ZipOrPostalCode>${quoteData.originZip}</ZipOrPostalCode>
          <CountryCode>USA</CountryCode>
        </Origin>
        <Destination>
          <City>${quoteData.destinationCity || ''}</City>
          <StateOrProvince>${quoteData.destinationState || ''}</StateOrProvince>
          <ZipOrPostalCode>${quoteData.destinationZip}</ZipOrPostalCode>
          <CountryCode>USA</CountryCode>
        </Destination>
        <Items>${itemsXml}
        </Items>
        <DeclaredValue>${quoteData.declaredValue || 0}</DeclaredValue>${accessorialsXml}
      </request>
    </GetRateQuote>
  </soap:Body>
</soap:Envelope>`;
};

/**
 * 解析 SOAP XML 响应
 */
const parseSoapResponse = (xmlResponse) => {
  try {
    const extractValue = (xml, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1] : null;
    };

    // 检查是否有 SOAP Fault
    if (xmlResponse.includes('soap:Fault') || xmlResponse.includes('Fault')) {
      const faultString = extractValue(xmlResponse, 'faultstring') || 
                          extractValue(xmlResponse, 'Message') ||
                          'Unknown SOAP Fault';
      throw new Error(faultString);
    }

    // 检查是否成功
    const wasSuccess = extractValue(xmlResponse, 'WasSuccess');
    if (wasSuccess === 'false') {
      const errorMsg = extractValue(xmlResponse, 'string') || 'Quote failed';
      throw new Error(errorMsg);
    }

    // 提取报价信息
    // 从 ServiceLevels 提取报价号和价格
    const serviceLevelMatch = xmlResponse.match(/<ServiceLevel[^>]*>([\s\S]*?)<\/ServiceLevel>/i);
    let quoteNumber = null;
    let netCharge = null;
    let serviceDays = null;
    
    if (serviceLevelMatch) {
      const serviceLevelXml = serviceLevelMatch[1];
      quoteNumber = extractValue(serviceLevelXml, 'QuoteNumber');
      netCharge = extractValue(serviceLevelXml, 'NetCharge');
      serviceDays = extractValue(serviceLevelXml, 'ServiceDays');
    }

    // 如果没有从 ServiceLevel 获取，尝试其他位置
    // 先从 Charge 节点提取所有费用，计算总价
    const chargeMatches = xmlResponse.matchAll(/<Charge>[\s\S]*?<Type>([^<]*)<\/Type>[\s\S]*?<Amount>([^<]+)<\/Amount>[\s\S]*?<\/Charge>/gi);
    let discountedFreight = 0;
    let fuelSurcharge = 0;
    let otherCharges = 0;
    
    for (const match of chargeMatches) {
      const chargeType = match[1];
      const amount = parseFloat(match[2].replace(/[$,]/g, ''));
      
      if (chargeType === 'DISCNF') {
        discountedFreight = amount;
      } else if (chargeType === 'FUEL') {
        fuelSurcharge = amount;
      } else if (chargeType === 'NET') {
        netCharge = amount;
      } else if (chargeType !== 'GROSS' && chargeType !== 'DISCNT' && chargeType !== '' && amount > 0) {
        otherCharges += amount;
      }
    }
    
    // 如果没有 NET，用 DISCNF + FUEL + 其他费用计算
    if (!netCharge && discountedFreight > 0) {
      netCharge = discountedFreight + fuelSurcharge + otherCharges;
    }
    
    // 尝试其他方式获取 quoteNumber
    if (!quoteNumber) {
      const quoteMatch = xmlResponse.match(/QuoteNumber[^>]*>(\d+)</i);
      if (quoteMatch) {
        quoteNumber = quoteMatch[1];
      }
    }

    // 提取运输时间
    if (!serviceDays) {
      const transitMatch = xmlResponse.match(/ServiceDays[^>]*>(\d+)</i) || 
                          xmlResponse.match(/TransitDays[^>]*>(\d+)</i);
      if (transitMatch) {
        serviceDays = transitMatch[1];
      }
    }

    // 提取服务中心信息
    const originCenter = extractValue(xmlResponse, 'Location') || '';

    return {
      quoteNumber,
      netCharge: netCharge ? parseFloat(netCharge.toString().replace(/[$,]/g, '')) : null,
      transitDays: serviceDays ? parseInt(serviceDays) : null,
      serviceType: 'Standard LTL',
      originCenter,
      rawResponse: xmlResponse.substring(0, 2000)
    };
  } catch (error) {
    console.error('❌ RLC Response Parse Error:', error);
    throw error;
  }
};

/**
 * POST /api/rlc/quote
 * 获取 R+L Carriers LTL 运输报价
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
      declaredValue = 0
    } = req.body;

    // 验证必填字段
    if (!originZip || !destinationZip || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip, destinationZip, and items are required'
      });
    }

    // 构建请求数据
    const quoteData = {
      originZip,
      originCity,
      originState,
      destinationZip,
      destinationCity,
      destinationState,
      items,
      accessorials,
      declaredValue
    };

    console.log('🚚 RLC Quote Request:', JSON.stringify(quoteData, null, 2));

    // 构建 SOAP 请求
    const soapRequest = buildSoapRequest(quoteData);
    
    console.log('📤 RLC SOAP Request:\n', soapRequest.substring(0, 800) + '...');

    const response = await fetch(RLC_SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${RLC_NAMESPACE}GetRateQuote`
      },
      body: soapRequest
    });

    const xmlResponse = await response.text();
    
    console.log('📦 RLC SOAP Response Status:', response.status);
    console.log('📦 RLC SOAP Response:\n', xmlResponse.substring(0, 1000) + '...');

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'RLC API Error',
        message: `HTTP ${response.status}`,
        details: xmlResponse.substring(0, 500)
      });
    }

    // 解析响应
    const parsedResponse = parseSoapResponse(xmlResponse);
    
    console.log('✅ RLC Parsed Response:', JSON.stringify(parsedResponse, null, 2));

    // 标准化响应格式
    const standardizedResponse = {
      carrier: 'R+L Carriers',
      carrierCode: 'RLC',
      quoteId: parsedResponse.quoteNumber || `RLC-${Date.now()}`,
      netCharge: parsedResponse.netCharge,
      transitDays: parsedResponse.transitDays,
      serviceType: parsedResponse.serviceType,
      guaranteed: null,
      details: parsedResponse
    };

    res.json(standardizedResponse);
  } catch (error) {
    console.error('❌ RLC Quote Error:', error);
    res.status(500).json({
      error: 'RLC API Error',
      message: error.message
    });
  }
});

/**
 * POST /api/rlc/transit-time
 * 获取运输时间估算
 */
router.post('/transit-time', async (req, res) => {
  try {
    const { originZip, destinationZip } = req.body;

    if (!originZip || !destinationZip) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip and destinationZip are required'
      });
    }

    // 使用报价接口获取 transit time
    const quoteData = {
      originZip,
      destinationZip,
      items: [{ class: '70', weight: 500 }]
    };

    const soapRequest = buildSoapRequest(quoteData);

    const response = await fetch(RLC_SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${RLC_NAMESPACE}GetRateQuote`
      },
      body: soapRequest
    });

    const xmlResponse = await response.text();
    const parsedResponse = parseSoapResponse(xmlResponse);

    res.json({
      carrier: 'R+L Carriers',
      carrierCode: 'RLC',
      originZip,
      destinationZip,
      transitDays: parsedResponse.transitDays,
      details: parsedResponse
    });
  } catch (error) {
    console.error('❌ RLC Transit Time Error:', error);
    res.status(500).json({
      error: 'RLC API Error',
      message: error.message
    });
  }
});

/**
 * GET /api/rlc/accessorials
 * 获取可用的附加服务列表
 */
router.get('/accessorials', (req, res) => {
  res.json({
    carrier: 'R+L Carriers',
    accessorials: [
      { code: 'LiftGatePickup', description: 'Liftgate Service at Pickup' },
      { code: 'LiftGateDelivery', description: 'Liftgate Service at Delivery' },
      { code: 'ResidentialPickup', description: 'Residential Pickup' },
      { code: 'ResidentialDelivery', description: 'Residential Delivery' },
      { code: 'InsidePickup', description: 'Inside Pickup' },
      { code: 'InsideDelivery', description: 'Inside Delivery' },
      { code: 'LimitedAccessPickup', description: 'Limited Access Pickup' },
      { code: 'LimitedAccessDelivery', description: 'Limited Access Delivery' },
      { code: 'AppointmentDelivery', description: 'Appointment Delivery' },
      { code: 'NotifyBeforeDelivery', description: 'Notify Before Delivery' },
      { code: 'HazardousMaterial', description: 'Hazardous Materials' },
      { code: 'ProtectFromFreezing', description: 'Protect From Freezing' },
      { code: 'SortAndSegregate', description: 'Sort and Segregate' },
      { code: 'GuaranteedService', description: 'Guaranteed Service' }
    ]
  });
});

module.exports = router;
