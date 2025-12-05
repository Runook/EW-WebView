/**
 * Roadrunner Transportation Systems (RRTS) API 代理路由
 * SOAP Web Service: https://webservices.rrts.com/rating/ratequote.asmx
 * 
 * 文档: RRTS Rate Quote with Guaranteed Service Web Service Developer's Guide
 * 
 * 方法:
 *   - RateQuoteV2: 基于主账户的报价
 *   - RateQuoteWithGuarV2: 包含 Guaranteed Service 的报价
 */

const express = require('express');
const router = express.Router();

// RRTS API 配置
const RRTS_WSDL_URL = 'https://webservices.rrts.com/rating/ratequote.asmx?WSDL';
const RRTS_ENDPOINT = 'https://webservices.rrts.com/rating/ratequote.asmx';

// RRTS 认证信息
const RRTS_APP_ID = process.env.RRTS_APP_ID || 'f850d178-35e2-4c8a-9a92-7a688b37d032';
const RRTS_API_KEY = process.env.RRTS_API_KEY || 'xe0Bo+JC3Ez7AzFci9i5yA==';

// 用户名和密码 - 可能使用 API Key 或单独的凭证
const RRTS_USERNAME = process.env.RRTS_USERNAME || RRTS_APP_ID;
const RRTS_PASSWORD = process.env.RRTS_PASSWORD || RRTS_API_KEY;

// RRTS SOAP 命名空间 (从 WSDL 获取)
const RRTS_NAMESPACE = 'https://webservices.rrts.com/ratequote/';

/**
 * 构建 SOAP XML 请求体
 * @param {Object} quoteData - 报价请求数据
 * @param {string} method - SOAP 方法名 (RateQuoteV2, RateQuoteWithGuarV2, etc.)
 * @returns {string} - SOAP XML 请求
 */
const buildSoapRequest = (quoteData, method = 'RateQuoteWithGuarV2') => {
  // 构建 ShipmentDetails XML - 注意使用 ShipmentDetail (单数) 作为子元素
  const shipmentDetailsXml = quoteData.shipmentDetails.map(detail => `
          <ShipmentDetail>
            <ActualClass>${detail.actualClass}</ActualClass>
            <Weight>${detail.weight}</Weight>
          </ShipmentDetail>`).join('');

  // 构建 ServiceOptions XML (可选)
  let serviceOptionsXml = '';
  if (quoteData.serviceOptions && quoteData.serviceOptions.length > 0) {
    serviceOptionsXml = `
        <ServiceDeliveryOptions>
          ${quoteData.serviceOptions.map(opt => `<ServiceOptions><ServiceCode>${opt}</ServiceCode></ServiceOptions>`).join('')}
        </ServiceDeliveryOptions>`;
  }

  // ShipDate 格式化为 ISO 8601 (YYYY-MM-DDTHH:MM:SS)
  const shipDateFormatted = quoteData.shipDate.includes('T') 
    ? quoteData.shipDate 
    : `${quoteData.shipDate}T00:00:00`;

  // 构建完整的 SOAP Envelope
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthenticationHeader xmlns="${RRTS_NAMESPACE}">
      <UserName>${RRTS_USERNAME}</UserName>
      <Password>${RRTS_PASSWORD}</Password>
    </AuthenticationHeader>
  </soap:Header>
  <soap:Body>
    <${method} xmlns="${RRTS_NAMESPACE}">
      <request>
        <OriginZip>${quoteData.originZip}</OriginZip>
        <DestinationZip>${quoteData.destinationZip}</DestinationZip>
        <ShipmentDetails>${shipmentDetailsXml}
        </ShipmentDetails>
        <OriginType>${quoteData.originType || 'O'}</OriginType>
        <PaymentType>${quoteData.paymentType || 'P'}</PaymentType>
        ${quoteData.palletCount ? `<PalletCount>${quoteData.palletCount}</PalletCount>` : ''}
        ${quoteData.linearFeet ? `<LinearFeet>${quoteData.linearFeet}</LinearFeet>` : ''}
        ${quoteData.cubicFeet ? `<CubicFeet>${quoteData.cubicFeet}</CubicFeet>` : ''}
        <Pieces>0</Pieces>
        ${serviceOptionsXml}
        <ShipDate>${shipDateFormatted}</ShipDate>
      </request>
    </${method}>
  </soap:Body>
</soap:Envelope>`;
};

/**
 * 解析 SOAP XML 响应
 * @param {string} xmlResponse - SOAP XML 响应
 * @returns {Object} - 解析后的报价数据
 */
const parseSoapResponse = (xmlResponse) => {
  try {
    // 简单的 XML 解析 (提取关键字段)
    const extractValue = (xml, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1] : null;
    };

    const extractAllValues = (xml, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
      const matches = [];
      let match;
      while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1]);
      }
      return matches;
    };

    // 检查是否有 SOAP Fault
    if (xmlResponse.includes('soap:Fault') || xmlResponse.includes('Fault')) {
      const faultString = extractValue(xmlResponse, 'faultstring') || 
                          extractValue(xmlResponse, 'Message') ||
                          'Unknown SOAP Fault';
      throw new Error(faultString);
    }

    // 提取报价响应
    const quoteNumber = extractValue(xmlResponse, 'QuoteNumber');
    const netCharge = extractValue(xmlResponse, 'NetCharge');
    const guaranteed = extractValue(xmlResponse, 'Guaranteed');
    const accountNumber = extractValue(xmlResponse, 'AccountNumber');
    
    // 提取路由信息
    const routingInfo = {
      originZip: extractValue(xmlResponse, 'OriginZip'),
      originState: extractValue(xmlResponse, 'OriginState'),
      originTerminal: extractValue(xmlResponse, 'OriginTerminal'),
      destinationZip: extractValue(xmlResponse, 'DestinationZip'),
      destinationState: extractValue(xmlResponse, 'DestinationState'),
      destinationTerminal: extractValue(xmlResponse, 'DestinationTerminal'),
      estimatedTransitDays: extractValue(xmlResponse, 'EstimatedTransitDays'),
      name: extractValue(xmlResponse, 'Name'),
      address1: extractValue(xmlResponse, 'Address1'),
      city: extractValue(xmlResponse, 'City'),
      state: extractValue(xmlResponse, 'State'),
      zipCode: extractValue(xmlResponse, 'ZipCode')
    };

    // 提取费用明细 (QuoteDetail)
    const rateDetails = [];
    const quoteDetailRegex = /<QuoteDetail>([\s\S]*?)<\/QuoteDetail>/gi;
    let detailMatch;
    while ((detailMatch = quoteDetailRegex.exec(xmlResponse)) !== null) {
      const detail = detailMatch[1];
      rateDetails.push({
        actualClass: extractValue(detail, 'ActualClass'),
        ratedClass: extractValue(detail, 'RatedClass'),
        code: extractValue(detail, 'Code'),
        description: extractValue(detail, 'Description'),
        rate: parseFloat(extractValue(detail, 'Rate') || 0),
        weight: parseInt(extractValue(detail, 'Weight') || 0),
        charge: parseFloat(extractValue(detail, 'Charge') || 0),
        extraMessages: extractValue(detail, 'ExtraMessages')
      });
    }

    return {
      quoteNumber: quoteNumber ? parseInt(quoteNumber) : null,
      netCharge: netCharge ? parseFloat(netCharge) : null,
      guaranteed: guaranteed ? parseFloat(guaranteed) : 0,
      standardCharge: netCharge && guaranteed ? parseFloat(netCharge) - parseFloat(guaranteed) : parseFloat(netCharge),
      accountNumber,
      routingInfo,
      rateDetails,
      carrier: 'Roadrunner',
      carrierCode: 'RRTS'
    };
  } catch (error) {
    console.error('❌ RRTS Response Parse Error:', error);
    throw error;
  }
};

/**
 * POST /api/rrts/quote
 * 获取 RRTS LTL 运输报价
 */
router.post('/quote', async (req, res) => {
  try {
    const { 
      originZip, 
      destinationZip, 
      shipDate,
      originType = 'O',  // O=Shipper, I=Consignee, B=Third Party
      paymentType = 'P', // P=Prepaid, C=Collect
      shipmentDetails,   // [{actualClass: 100, weight: 500}, ...]
      serviceOptions,    // ['LGD', 'RSD', ...] (可选的附加服务代码)
      palletCount,
      linearFeet,
      cubicFeet
    } = req.body;

    // 验证必填字段
    if (!originZip || !destinationZip || !shipmentDetails || shipmentDetails.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'originZip, destinationZip, and shipmentDetails are required'
      });
    }

    // 默认发货日期为今天
    const shipDateFormatted = shipDate || new Date().toISOString().split('T')[0];

    // 构建请求数据
    const quoteData = {
      originZip,
      destinationZip,
      originType,
      paymentType,
      shipDate: shipDateFormatted,
      shipmentDetails,
      serviceOptions,
      palletCount,
      linearFeet,
      cubicFeet
    };

    console.log('🚚 RRTS Quote Request:', JSON.stringify(quoteData, null, 2));

    // 构建 SOAP 请求
    const soapRequest = buildSoapRequest(quoteData, 'RateQuoteWithGuarV2');
    
    console.log('📤 RRTS SOAP Request:\n', soapRequest.substring(0, 500) + '...');

    // 发送 SOAP 请求 - SOAPAction 使用 https 和正确的命名空间
    const response = await fetch(RRTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${RRTS_NAMESPACE}RateQuoteWithGuarV2`
      },
      body: soapRequest
    });

    const xmlResponse = await response.text();
    
    console.log('📦 RRTS SOAP Response Status:', response.status);
    console.log('📦 RRTS SOAP Response:\n', xmlResponse.substring(0, 1000) + '...');

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'RRTS API Error',
        message: `HTTP ${response.status}`,
        details: xmlResponse
      });
    }

    // 解析响应
    const parsedResponse = parseSoapResponse(xmlResponse);
    
    console.log('✅ RRTS Parsed Response:', JSON.stringify(parsedResponse, null, 2));

    res.json(parsedResponse);
  } catch (error) {
    console.error('❌ RRTS Quote Error:', error);
    res.status(500).json({
      error: 'RRTS API Error',
      message: error.message
    });
  }
});

/**
 * GET /api/rrts/freight-classes
 * 获取有效的 Freight Classes
 */
router.get('/freight-classes', (req, res) => {
  res.json({
    classes: [50, 55, 60, 65, 70, 77.5, 85, 92.5, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500],
    description: 'Valid NMFC freight classes for RRTS rating'
  });
});

/**
 * GET /api/rrts/service-codes
 * 获取有效的 Service Codes (附加服务)
 */
router.get('/service-codes', (req, res) => {
  res.json({
    pickup: [
      { code: 'AHP', description: 'Apartment Pickup' },
      { code: 'AIP', description: 'Airport Site Pickup' },
      { code: 'AMP', description: 'Amusement Park Pickup' },
      { code: 'CCP', description: 'Country Club Pickup' },
      { code: 'CFS', description: 'Container Station Pickup' },
      { code: 'CHP', description: 'Place of Worship Pickup' },
      { code: 'CPP', description: 'Camp/Park/Resort Pickup' },
      { code: 'CSP', description: 'Construction Pickup' },
      { code: 'FAP', description: 'Farm/Ranch Pickup' },
      { code: 'GWP', description: 'Grocery Distribution Pickup' },
      { code: 'HHP', description: 'Hotel Pickup' },
      { code: 'IP', description: 'Inside Pickup' },
      { code: 'IRP', description: 'Reservation Pickup' },
      { code: 'LGP', description: 'Liftgate Pickup' },
      { code: 'LTP', description: 'Limited Access Pickup' },
      { code: 'NHP', description: 'Nursing Home Pickup' },
      { code: 'PWP', description: 'Pier/Port/Wharf Pickup' },
      { code: 'RSP', description: 'Residential Pickup' },
      { code: 'SHP', description: 'School Site Pickup' },
      { code: 'STP', description: 'Storage Unit Pickup' },
      { code: 'USP', description: 'Utility Site Pickup' }
    ],
    delivery: [
      { code: 'AHD', description: 'Apartment Delivery' },
      { code: 'AID', description: 'Airport Site Delivery' },
      { code: 'AMD', description: 'Amusement Park Delivery' },
      { code: 'CCD', description: 'Country Club Delivery' },
      { code: 'CFD', description: 'Container Station Delivery' },
      { code: 'CHD', description: 'Place of Worship Delivery' },
      { code: 'CPD', description: 'Camp/Park/Resort Delivery' },
      { code: 'CSD', description: 'Construction Delivery' },
      { code: 'DCC', description: 'Distribution Center Delivery' },
      { code: 'ESD', description: 'Exhibition Site Delivery' },
      { code: 'FAD', description: 'Farm/Ranch Delivery' },
      { code: 'FAB', description: 'Floors Above Delivery' },
      { code: 'FSD', description: 'Forest Delivery' },
      { code: 'GSD', description: 'Government Site Delivery' },
      { code: 'GWD', description: 'Grocery Distribution Delivery' },
      { code: 'HHD', description: 'Hotel Delivery' },
      { code: 'ID', description: 'Inside Delivery' },
      { code: 'IRD', description: 'Reservation Delivery' },
      { code: 'LGD', description: 'Liftgate Delivery' },
      { code: 'LTD', description: 'Limited Access Delivery' },
      { code: 'MSD', description: 'Mine Site Delivery' },
      { code: 'NBD', description: 'Non-Business Hours Delivery' },
      { code: 'NHD', description: 'Nursing Home Delivery' },
      { code: 'PSD', description: 'Prison Delivery' },
      { code: 'PWD', description: 'Pier/Port/Wharf Delivery' },
      { code: 'RSD', description: 'Residential Delivery' },
      { code: 'SHD', description: 'School Site Delivery' },
      { code: 'STD', description: 'Storage Unit Delivery' },
      { code: 'USD', description: 'Utility Site Delivery' }
    ],
    other: [
      { code: 'APT', description: 'Appointment Charge' },
      { code: 'BSC', description: 'Blind Shipment Charge' },
      { code: 'ECC', description: 'Full Value Coverage' },
      { code: 'EXM', description: 'Excessive Length 8-12 ft' },
      { code: 'EXN', description: 'Excessive Length 12-16 ft' },
      { code: 'EXL', description: 'Excessive Length 16-20 ft' },
      { code: 'EXO', description: 'Excessive Length 20-27 ft' },
      { code: 'EXX', description: 'Excessive Length >27 ft' },
      { code: 'HAZ', description: 'Hazardous Materials' },
      { code: 'NC', description: 'Notification Charge' },
      { code: 'PP', description: 'Guaranteed Service' },
      { code: 'PSC', description: 'Protect from Cold' },
      { code: 'SRT', description: 'Sort and Segregate' },
      { code: 'WCL', description: 'Hawaiian Will Call' }
    ]
  });
});

module.exports = router;

