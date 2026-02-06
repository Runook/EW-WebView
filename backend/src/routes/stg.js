/**
 * STG Logistics API 路由
 * XML Rate Quotes API
 * 文档: 图片提供的 XML Rate Quotes 文档
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');

// STG 配置
const STG_CLI_CODE = process.env.STG_CLI_CODE || 'FRO'; // 3-character CLI acronym
const STG_USERNAME = process.env.STG_USERNAME;
const STG_PASSWORD = process.env.STG_PASSWORD;

// STG API Base URL (SAAS customer format)
const STG_BASE_URL = `https://tracking.carrierlogistics.com/scripts/${STG_CLI_CODE}.pol`;

/**
 * 构建 STG 报价请求 URL
 */
function buildQuoteUrl(params) {
  const {
    originZip,
    destinationZip,
    items,
    shipDate,
    accessorials = []
  } = params;

  // 构建基础 URL 参数
  const urlParams = new URLSearchParams();
  urlParams.append('xmlv', 'yes');
  urlParams.append('xmluser', STG_USERNAME);
  urlParams.append('xmlpass', STG_PASSWORD);
  urlParams.append('vozip', originZip);
  urlParams.append('vdzip', destinationZip);
  
  // 添加发货日期 (可选)
  if (shipDate) {
    urlParams.append('shipdate', shipDate); // MM/DD/YYYY format
  }

  // 请求报价编号
  urlParams.append('quotenumber', 'yes');

  // 添加附加服务 (可选)
  if (accessorials.length > 0) {
    urlParams.append('RESDEL', 'Yes'); // 示例: 住宅送货
  }

  // 添加货物明细 (支持多个货物)
  items.forEach((item, index) => {
    const lineNum = index + 1;
    urlParams.append(`wpieces[${lineNum}]`, item.pieces || item.pallets || 1);
    urlParams.append(`wpallets[${lineNum}]`, item.pallets || 1);
    urlParams.append(`wweight[${lineNum}]`, Math.round(item.weight || item.totalWeight || 0));
    urlParams.append(`vclass[${lineNum}]`, item.class || item.freightClass || '70');
    
    // 可选尺寸信息
    if (item.length) urlParams.append(`wlength[${lineNum}]`, Math.round(item.length));
    if (item.width) urlParams.append(`wwidth[${lineNum}]`, Math.round(item.width));
    if (item.height) urlParams.append(`wheight[${lineNum}]`, Math.round(item.height));
  });

  return `${STG_BASE_URL}/ratequote.xml?${urlParams.toString()}`;
}

/**
 * 解析 STG XML 响应
 */
async function parseSTGResponse(xmlData) {
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xmlData);
  
  if (!result.ratequote) {
    throw new Error('Invalid STG response format');
  }

  const quote = result.ratequote;
  
  // 解析费用明细
  let totalCharge = 0;
  let fuelSurcharge = 0;
  const charges = [];
  
  // ratequoteline 可能是数组或单个对象
  const lines = Array.isArray(quote.ratequoteline) 
    ? quote.ratequoteline 
    : (quote.ratequoteline ? [quote.ratequoteline] : []);

  lines.forEach(line => {
    const chargeDesc = line.chargedesc || '';
    const chargeAmount = parseFloat((line.charge || '0').replace(/,/g, '')) || 0;
    
    charges.push({
      description: chargeDesc,
      amount: chargeAmount
    });

    if (chargeDesc.toUpperCase().includes('FUEL')) {
      fuelSurcharge += chargeAmount;
    }
  });

  // 获取总价
  totalCharge = parseFloat((quote.quotetotal || '0').replace(/,/g, '')) || 0;

  return {
    success: true,
    carrier: 'STG Logistics',
    carrierCode: 'STG',
    quoteId: quote.quoteversion || '',
    netCharge: totalCharge,
    fuelSurcharge: fuelSurcharge,
    transitDays: parseInt(quote.busdays) || null,
    totalPallets: parseInt(quote.totalpallets) || 0,
    totalPieces: parseInt(quote.totalpieces) || 0,
    totalWeight: parseInt(quote.totalweight) || 0,
    serviceType: 'Standard LTL',
    charges: charges,
    quoteDateTime: quote.quotedatetime || '',
    rawResponse: quote
  };
}

/**
 * 获取报价
 * POST /api/stg/quote
 */
router.post('/quote', async (req, res) => {
  try {
    const { originZip, destinationZip, items, shipDate, accessorials } = req.body;
    
    console.log('📤 STG 报价请求:', { originZip, destinationZip, items });

    // 构建请求 URL
    const requestUrl = buildQuoteUrl({
      originZip,
      destinationZip,
      items,
      shipDate,
      accessorials
    });

    console.log('📋 STG 请求 URL:', requestUrl);

    // 调用 API
    const response = await axios.get(requestUrl, {
      headers: {
        'Accept': 'application/xml'
      },
      timeout: 30000
    });

    console.log('📥 STG 原始响应:', response.data);

    // 解析 XML 响应
    const result = await parseSTGResponse(response.data);
    
    console.log('✅ STG 解析结果:', result);

    res.json(result);
  } catch (error) {
    console.error('❌ STG 报价失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      carrier: 'STG Logistics'
    });
  }
});

/**
 * 获取运输时间
 */
router.post('/transit', async (req, res) => {
  // STG 的运输时间包含在报价响应中 (busdays 字段)
  res.json({
    success: true,
    transitDays: null,
    message: 'STG 运输时间包含在报价响应中'
  });
});

/**
 * 获取附加服务列表
 */
router.get('/accessorials', async (req, res) => {
  // 根据文档提供的附加服务
  const accessorials = [
    { code: 'RESDEL', name: 'Residential Delivery', description: '住宅送货' },
    { code: 'LIFTP', name: 'Liftgate Pickup', description: '升降门取货' },
    { code: 'LIFTD', name: 'Liftgate Delivery', description: '升降门送货' },
    { code: 'INSD', name: 'Inside Delivery', description: '室内送货' },
    { code: 'NOTIF', name: 'Arrival Notification', description: '到达通知' }
  ];

  res.json({ success: true, accessorials });
});

module.exports = router;
