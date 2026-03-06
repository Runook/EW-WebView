/**
 * AAA Cooper Transportation (AACT) API 代理路由
 * WSDL: http://wsportal.aaacooper.com:8188/wsGenRateEstimate.wsdl
 * Endpoint: https://api2.aaacooper.com:8200/sapi30/wsGenEst
 * Namespace: http://tempuri.org/wsGenRateEstimate/
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const AACT_ENDPOINT = 'https://api2.aaacooper.com:8200/sapi30/wsGenEst';
const AACT_NS = 'http://tempuri.org/wsGenRateEstimate/';
const AACT_TOKEN = process.env.AACT_API_TOKEN;
const AACT_CUSTOMER_NUMBER = process.env.AACT_CUSTOMER_NUMBER || '';

function buildSoapRequest(quoteData) {
  const linesXml = quoteData.items.map(item => `
      <tns:RateEstimateRequestLine>
        <tns:Weight>${Math.round(parseFloat(item.weight) || 500)}</tns:Weight>
        <tns:Class>${parseFloat(item.class || item.freightClass) || 70}</tns:Class>
        <tns:HandlingUnits>${parseInt(item.pieces || item.pallets) || 1}</tns:HandlingUnits>
        <tns:HandlingUnitType>SK</tns:HandlingUnitType>
        <tns:Hazmat>N</tns:Hazmat>
        <tns:CubeU>0</tns:CubeU>
        <tns:Length>${Math.round(parseFloat(item.length) || 0)}</tns:Length>
        <tns:Height>${Math.round(parseFloat(item.height) || 0)}</tns:Height>
        <tns:Width>${Math.round(parseFloat(item.width) || 0)}</tns:Width>
        <tns:NMFC></tns:NMFC>
        <tns:NMFCSub></tns:NMFCSub>
      </tns:RateEstimateRequestLine>`).join('');

  let accXml = '';
  if (quoteData.accessorials && quoteData.accessorials.length > 0) {
    accXml = quoteData.accessorials.map(code =>
      `\n      <tns:AccLine><tns:AccCode>${code}</tns:AccCode></tns:AccLine>`
    ).join('');
  }

  const now = new Date();
  const billDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tns="${AACT_NS}">
  <soapenv:Body>
    <tns:RateEstimateRequestVO>
      <tns:Token>${AACT_TOKEN}</tns:Token>
      <tns:CustomerNumber>${AACT_CUSTOMER_NUMBER}</tns:CustomerNumber>
      <tns:OriginCity>${quoteData.originCity || ''}</tns:OriginCity>
      <tns:OriginState>${quoteData.originState || ''}</tns:OriginState>
      <tns:OriginZip>${quoteData.originZip}</tns:OriginZip>
      <tns:OriginCountryCode>US</tns:OriginCountryCode>
      <tns:DestinationCity>${quoteData.destinationCity || ''}</tns:DestinationCity>
      <tns:DestinationState>${quoteData.destinationState || ''}</tns:DestinationState>
      <tns:DestinationZip>${quoteData.destinationZip}</tns:DestinationZip>
      <tns:DestinCountryCode>US</tns:DestinCountryCode>
      <tns:WhoAmI>S</tns:WhoAmI>
      <tns:BillDate>${billDate}</tns:BillDate>
      <tns:CODAmount>0</tns:CODAmount>
      <tns:CODPayType></tns:CODPayType>
      <tns:CODFeePaidBy></tns:CODFeePaidBy>
      <tns:FullCoverage>N</tns:FullCoverage>
      <tns:FullCoverageAmount>0</tns:FullCoverageAmount>
      <tns:PrePaidCollect>P</tns:PrePaidCollect>
      <tns:TotalPalletCount>${quoteData.totalPallets || 0}</tns:TotalPalletCount>${accXml}${linesXml}
    </tns:RateEstimateRequestVO>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseSoapResponse(xml) {
  const extract = (tag) => {
    const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  };

  if (xml.includes('<error')) {
    const codeMatch = xml.match(/code="([^"]+)"/);
    throw new Error(`AACT server error: ${codeMatch?.[1] || 'unknown'}`);
  }

  const errorMessage = extract('ErrorMessage');
  if (errorMessage && errorMessage.length > 0) {
    throw new Error(`AACT: ${errorMessage}`);
  }

  const totalCharges = parseFloat(extract('TotalCharges') || '0');
  const fuelPct = parseFloat(extract('FuelSurchargePercent') || '0');
  const transitDays = parseInt(extract('TotalTransit') || '0') || null;
  const estimateNumber = extract('EstimateNumber') || '';
  const discount = extract('Discount') || '';
  const density = extract('Density') || '';
  const totalWeight = extract('TotalActualWeight') || '';
  const minCharge = extract('MinimumCharge') || '';
  const guaranteedFee = parseFloat(extract('GuaranteedDeliveryFee') || '0');
  const totWithGuarantee = parseFloat(extract('TotChgWGuarDelFee') || '0');
  const originTerminal = extract('OriginTerminal') || '';
  const destTerminal = extract('DestinTerminal') || '';

  return {
    estimateNumber,
    totalCharges,
    fuelSurchargePercent: fuelPct,
    transitDays,
    discount,
    density,
    totalWeight,
    minimumCharge: minCharge,
    guaranteedFee,
    totWithGuarantee,
    originTerminal,
    destTerminal,
  };
}

router.post('/quote', async (req, res) => {
  try {
    const {
      originZip, originCity, originState,
      destinationZip, destinationCity, destinationState,
      items, accessorials = [],
      originType, destinationType
    } = req.body;

    if (!originZip || !destinationZip || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'originZip, destinationZip, and items are required', carrier: 'AAA Cooper' });
    }

    if (!AACT_TOKEN) {
      return res.status(500).json({ success: false, error: 'AACT_API_TOKEN not configured', carrier: 'AAA Cooper' });
    }

    const accCodes = [...accessorials];
    if (originType === 'residential' || originType === 'Residential') accCodes.push('RESP');
    if (destinationType === 'residential' || destinationType === 'Residential') accCodes.push('RESD');

    const totalPallets = items.reduce((sum, item) => sum + (parseInt(item.pieces || item.pallets) || 1), 0);

    const quoteData = {
      originZip, originCity: originCity || '', originState: originState || '',
      destinationZip, destinationCity: destinationCity || '', destinationState: destinationState || '',
      items, accessorials: accCodes, totalPallets
    };

    console.log('🚛 AACT Quote Request:', { originZip, destinationZip, itemCount: items.length });

    const soapXml = buildSoapRequest(quoteData);

    const response = await axios.post(AACT_ENDPOINT, soapXml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${AACT_NS}NewOperation"`
      },
      timeout: 30000
    });

    const parsed = parseSoapResponse(response.data);

    console.log('✅ AACT Result:', { total: parsed.totalCharges, transit: parsed.transitDays, estimate: parsed.estimateNumber });

    res.json({
      success: true,
      carrier: 'AAA Cooper Transportation',
      carrierCode: 'AACT',
      quoteId: parsed.estimateNumber || `AACT-${Date.now()}`,
      netCharge: parsed.totalCharges,
      fuelSurcharge: parsed.fuelSurchargePercent,
      transitDays: parsed.transitDays,
      serviceType: 'Standard LTL',
      guaranteed: parsed.totWithGuarantee > 0 ? parsed.totWithGuarantee : null,
      guaranteedFee: parsed.guaranteedFee,
      originTerminal: parsed.originTerminal,
      destTerminal: parsed.destTerminal,
    });
  } catch (error) {
    console.error('❌ AACT Quote Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      carrier: 'AAA Cooper'
    });
  }
});

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
