/**
 * Welogx LTL Freight 报价路由
 * 自有定价模型 — 不依赖外部承运商 API
 */

const express = require('express');
const router = express.Router();
const welogxService = require('../services/welogxService');

/**
 * 获取 Welogx LTL 报价
 * POST /api/welogx/quote
 */
router.post('/quote', async (req, res) => {
  try {
    const {
      originZip,
      destinationZip,
      distanceMiles,
      items,
      pickupServices,
      deliveryServices,
      originType,
      destinationType,
    } = req.body;

    console.log('📤 Welogx 报价请求:', {
      originZip,
      destinationZip,
      distanceMiles,
      itemCount: items?.length,
      originType,
      destinationType,
    });

    if (!originZip || !destinationZip) {
      return res.status(400).json({
        success: false,
        error: 'originZip and destinationZip are required',
        carrier: 'Welogx',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required',
        carrier: 'Welogx',
      });
    }

    const result = await welogxService.calculateQuote({
      originZip,
      destinationZip,
      distanceMiles: distanceMiles || null,
      items,
      pickupServices: pickupServices || [],
      deliveryServices: deliveryServices || [],
      originType: originType || 'commercial',
      destinationType: destinationType || 'commercial',
    });

    console.log('✅ Welogx 报价结果:', {
      grandTotal: result.netCharge,
      freightClass: result.freightClass,
      distanceMiles: result.distanceMiles,
      transitDays: result.transitDays,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Welogx 报价失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      carrier: 'Welogx',
    });
  }
});

/**
 * 获取 Welogx 附加服务列表
 */
router.get('/accessorials', (req, res) => {
  const accessorials = [
    { code: 'residential_pickup', name: 'Residential Pickup', description: '住家取货' },
    { code: 'residential_delivery', name: 'Residential Delivery', description: '住家送货' },
    { code: 'liftgate_pickup', name: 'Liftgate Pickup', description: '升降机取货' },
    { code: 'liftgate_delivery', name: 'Liftgate Delivery', description: '升降机送货' },
    { code: 'inside_pickup', name: 'Inside Pickup', description: '室内取货' },
    { code: 'inside_delivery', name: 'Inside Delivery', description: '室内送货' },
    { code: 'limited_access_pickup', name: 'Limited Access Pickup', description: '受限取货' },
    { code: 'limited_access_delivery', name: 'Limited Access Delivery', description: '受限送货' },
    { code: 'appointment', name: 'Appointment / Notify', description: '预约/通知费' },
    { code: 'hazmat', name: 'Hazardous Materials', description: '危险品' },
    { code: 'notify', name: 'Notify Before Delivery', description: '送货前通知' },
    { code: 'construction_site', name: 'Construction Site', description: '建筑工地' },
    { code: 'trade_show', name: 'Trade Show', description: '展会送货' },
  ];

  res.json({ success: true, accessorials });
});

module.exports = router;
