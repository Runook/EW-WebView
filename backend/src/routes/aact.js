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
      <RateEstimateRequestLine>
        <Weight>${Math.round(parseFloat(item.weight) || 500)}</Weight>
        <Class>${parseFloat(item.class || item.freightClass) || 70}</Class>
        <HandlingUnits>${parseInt(item.pieces || item.pallets) || 1}</HandlingUnits>
        <HandlingUnitType>SK</HandlingUnitType>
        <Hazmat>N</Hazmat>
        <CubeU>0</CubeU>
        <Length>${Math.round(parseFloat(item.length) || 48)}</Length>
        <Height>${Math.round(parseFloat(item.height) || 48)}</Height>
        <Width>${Math.round(parseFloat(item.width) || 40)}</Width>
        <NMFC>0</NMFC>
        <NMFCSub>0</NMFCSub>
      </RateEstimateRequestLine>`).join('');

  let accXml = '';
  if (quoteData.accessorials && quoteData.accessorials.length > 0) {
    accXml = quoteData.accessorials.map(code =>
      `\n      <AccLine><AccCode>${code}</AccCode></AccLine>`
    ).join('');
  }

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const billDate = `${mm}${dd}${yyyy}`;

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <RateEstimateRequestVO>
      <Token>${AACT_TOKEN}</Token>
      <CustomerNumber>${AACT_CUSTOMER_NUMBER}</CustomerNumber>
      <OriginCity>${quoteData.originCity || 'Unknown'}</OriginCity>
      <OriginState>${quoteData.originState || 'XX'}</OriginState>
      <OriginZip>${quoteData.originZip}</OriginZip>
      <OriginCountryCode>US</OriginCountryCode>
      <DestinationCity>${quoteData.destinationCity || 'Unknown'}</DestinationCity>
      <DestinationState>${quoteData.destinationState || 'XX'}</DestinationState>
      <DestinationZip>${quoteData.destinationZip}</DestinationZip>
      <DestinCountryCode>US</DestinCountryCode>
      <WhoAmI>S</WhoAmI>
      <BillDate>${billDate}</BillDate>
      <CODAmount>0</CODAmount>
      <CODPayType>N</CODPayType>
      <CODFeePaidBy>S</CODFeePaidBy>
      <FullCoverage>N</FullCoverage>
      <FullCoverageAmount>0</FullCoverageAmount>
      <PrePaidCollect>P</PrePaidCollect>
      <TotalPalletCount>${quoteData.totalPallets || 1}</TotalPalletCount>${accXml}${linesXml}
    </RateEstimateRequestVO>
  </soap:Body>
</soap:Envelope>`;
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
