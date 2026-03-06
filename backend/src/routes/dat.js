/**
 * DAT Freight Rate API 路由
 * 提供 DAT RateView 费率查询功能
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { auth } = require('../middleware');
const datService = require('../services/datService');

/**
 * POST /api/dat/rate-lookup
 * Look up DAT freight rates for a single lane.
 */
router.post('/rate-lookup', auth, [
  body('originZip').notEmpty().withMessage('Origin zip code is required'),
  body('destinationZip').notEmpty().withMessage('Destination zip code is required'),
  body('equipmentType').optional().isIn(['V', 'F', 'R']).withMessage('Equipment type must be V, F, or R'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { originZip, destinationZip, equipmentType, weight } = req.body;

    const rate = await datService.rateLookup({
      originZip,
      destinationZip,
      equipmentType,
      weight
    });

    res.json({ success: true, data: rate });
  } catch (error) {
    console.error('DAT rate lookup error:', error);
    res.status(500).json({ success: false, message: 'DAT rate lookup failed' });
  }
});

/**
 * POST /api/dat/batch-rate-lookup
 * Look up DAT rates for multiple lanes at once.
 */
router.post('/batch-rate-lookup', auth, [
  body('lanes').isArray({ min: 1 }).withMessage('Lanes array is required'),
  body('lanes.*.originZip').notEmpty().withMessage('Origin zip is required for each lane'),
  body('lanes.*.destinationZip').notEmpty().withMessage('Destination zip is required for each lane')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const results = await datService.batchRateLookup(req.body.lanes);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('DAT batch rate lookup error:', error);
    res.status(500).json({ success: false, message: 'DAT batch rate lookup failed' });
  }
});

/**
 * GET /api/dat/status
 * Check DAT API configuration and connectivity status.
 */
router.get('/status', auth, async (req, res) => {
  const configured = !!(process.env.DAT_CLIENT_ID && process.env.DAT_CLIENT_SECRET);

  let connected = false;
  if (configured) {
    try {
      await datService.getDATToken();
      connected = true;
    } catch (e) { /* token fetch failed */ }
  }

  res.json({
    success: true,
    data: {
      configured,
      connected,
      apiBase: process.env.DAT_API_BASE_URL || 'https://api.dat.com',
      message: configured
        ? (connected ? 'DAT API is connected' : 'DAT API configured but connection failed')
        : 'DAT API not configured. Set DAT_CLIENT_ID and DAT_CLIENT_SECRET in environment.'
    }
  });
});

module.exports = router;
