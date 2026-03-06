/**
 * AAA Cooper Transportation (AACT) API 代理路由
 * SOAP Web Service: http://wsportal.aaacooper.com:8188/wsGenRateEstimate.wsdl
 *
 * Rate Estimate — RateEstimateRequestVO
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const AACT_ENDPOINT = 'http://wsportal.aaacooper.com:8188/wsGenRateEstimate';
const AACT_TOKEN = process.env.AACT_API_TOKEN;

/**
 * Build SOAP XML for AAA Cooper Rate Estimate
 */
function buildSoapRequest(quoteData) {
  const linesXml = quoteData.items.map((item, idx) => `
          <RateEstimateRequestLine>
            <Weight>${Math.round(parseFloat(item.weight) || 500)}</Weight>
            <Class>${parseFloat(item.class || item.freightClass) || 70}</Class>
            <HandlingUnits>${parseInt(item.pieces || item.pallets) || 1}</HandlingUnits>
          </RateEstimateRequestLine>`).join('');

  let accXml = '';
  if (quoteData.accessorials && quoteData.accessorials.length > 0) {
    accXml = `
        <AccLines>
          ${quoteData.accessorials.map(code => `<AccLine><AccCode>${code}</AccCode></AccLine>`).join('\n          ')}
        </AccLines>`;
  }

  const billDate = quoteData.shipDate || new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ws="http://ws.aaacooper.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ws:getRateEstimate>
      <RateEstimateRequestVO>
        <Token>${AACT_TOKEN}</Token>
        <OriginCity>${quoteData.originCity || ''}</OriginCity>
        <OriginState>${quoteData.originState || ''}</OriginState>
        <OriginZip>${quoteData.originZip}</OriginZip>
        <OriginCountryCode>US</OriginCountryCode>
        <DestinationCity>${quoteData.destinationCity || ''}</DestinationCity>
        <DestinationState>${quoteData.destinationState || ''}</DestinationState>
        <DestinationZip>${quoteData.destinationZip}</DestinationZip>
        <DestCountryCode>US</DestCountryCode>
        <WhoAmI>S</WhoAmI>
        <BillDate>${billDate}</BillDate>
        <PrePaidCollect>P</PrePaidCollect>
        <TotalPalletCount>${quoteData.totalPallets || 0}</TotalPalletCount>
        <FullCoverage>N</FullCoverage>
        <FullCoverageAmount>0</FullCoverageAmount>
        <CODAmount>0</CODAmount>
        <CODPayType></CODPayType>
        <CODFeePaidBy></CODFeePaidBy>
        <RateEstimateRequestLines>${linesXml}
        </RateEstimateRequestLines>${accXml}
      </RateEstimateRequestVO>
    </ws:getRateEstimate>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parse SOAP XML response
 */
function parseSoapResponse(xml) {
  const extract = (tag) => {
    const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  };

  if (xml.includes('Fault') || xml.includes('fault')) {
    const faultString = extract('faultstring') || extract('Message') || 'Unknown SOAP Fault';
    throw new Error(faultString);
  }

  const totalCharge = parseFloat(extract('TotalCharges') || extract('TotalCharge') || extract('NetCharge') || extract('GrossCharge') || '0');
  const fuelSurcharge = parseFloat(extract('FuelSurcharge') || extract('FuelCharge') || '0');
  const transitDays = parseInt(extract('TransitDays') || extract('EstimatedTransitDays') || extract('ServiceDays') || '0') || null;
  const quoteNumber = extract('QuoteNumber') || extract('EstimateNumber') || '';

  const chargeRegex = /<(?:ChargeDetail|RateEstimateResponseLine)[^>]*>([\s\S]*?)<\/(?:ChargeDetail|RateEstimateResponseLine)>/gi;
  const charges = [];
  let match;
  while ((match = chargeRegex.exec(xml)) !== null) {
    const detail = match[1];
    const desc = extract.call(null, 'Description') || '';
    const amt = parseFloat((detail.match(/<(?:Charge|Amount)[^>]*>([^<]+)/i) || [])[1] || '0');
    if (amt > 0) charges.push({ description: desc, amount: amt });
  }

  let netCharge = totalCharge;
  if (!netCharge && charges.length > 0) {
    netCharge = charges.reduce((sum, c) => sum + c.amount, 0);
  }

  return {
    quoteNumber,
    netCharge,
    fuelSurcharge,
    transitDays,
    charges,
  };
}

/**
 * POST /api/aact/quote
 */
router.post('/quote', async (req, res) => {
  try {
    const {
      originZip, originCity, originState,
      destinationZip, destinationCity, destinationState,
      shipDate, items, accessorials = [],
      originType, destinationType
    } = req.body;

    if (!originZip || !destinationZip || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'originZip, destinationZip, and items are required',
        carrier: 'AAA Cooper'
      });
    }

    if (!AACT_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'AACT_API_TOKEN not configured',
        carrier: 'AAA Cooper'
      });
    }

    const accCodes = [...accessorials];
    if (originType === 'residential' || originType === 'Residential') accCodes.push('RESP');
    if (destinationType === 'residential' || destinationType === 'Residential') accCodes.push('RESD');

    const totalPallets = items.reduce((sum, item) => sum + (parseInt(item.pieces || item.pallets) || 1), 0);

    const quoteData = {
      originZip, originCity: originCity || '', originState: originState || '',
      destinationZip, destinationCity: destinationCity || '', destinationState: destinationState || '',
      shipDate: shipDate || new Date().toISOString().split('T')[0],
      items, accessorials: accCodes, totalPallets
    };

    console.log('🚛 AACT Quote Request:', { originZip, destinationZip, itemCount: items.length });

    const soapRequest = buildSoapRequest(quoteData);

    const response = await axios.post(AACT_ENDPOINT, soapRequest, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'getRateEstimate'
      },
      timeout: 30000
    });

    const parsed = parseSoapResponse(response.data);

    console.log('✅ AACT Quote Result:', { netCharge: parsed.netCharge, transit: parsed.transitDays });

    res.json({
      success: true,
      carrier: 'AAA Cooper Transportation',
      carrierCode: 'AACT',
      quoteId: parsed.quoteNumber || `AACT-${Date.now()}`,
      netCharge: parsed.netCharge,
      fuelSurcharge: parsed.fuelSurcharge,
      transitDays: parsed.transitDays,
      serviceType: 'Standard LTL',
      charges: parsed.charges,
      rawResponse: response.data.substring(0, 2000)
    });
  } catch (error) {
    console.error('❌ AACT Quote Error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.substring?.(0, 500) || error.message,
      carrier: 'AAA Cooper'
    });
  }
});

/**
 * GET /api/aact/accessorials
 */
router.get('/accessorials', (req, res) => {
  res.json({
    success: true,
    carrier: 'AAA Cooper Transportation',
    accessorials: [
      { code: 'LFTP', name: 'Liftgate Pickup', description: '升降机取货' },
      { code: 'LFTD', name: 'Liftgate Delivery', description: '升降机送货' },
      { code: 'RESP', name: 'Residential Pickup', description: '住家取货' },
      { code: 'RESD', name: 'Residential Delivery', description: '住家送货' },
      { code: 'INSP', name: 'Inside Pickup', description: '室内取货' },
      { code: 'INSD', name: 'Inside Delivery', description: '室内送货' },
      { code: 'LIMP', name: 'Limited Access Pickup', description: '受限取货' },
      { code: 'LIMD', name: 'Limited Access Delivery', description: '受限送货' },
      { code: 'NTFY', name: 'Notify Before Delivery', description: '送货前通知' },
      { code: 'APPT', name: 'Appointment Delivery', description: '预约送货' },
      { code: 'HAZM', name: 'Hazardous Materials', description: '危险品' },
      { code: 'CNST', name: 'Construction Site', description: '建筑工地' },
    ]
  });
});

module.exports = router;
