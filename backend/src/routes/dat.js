/**
 * DAT API Routes
 *
 * Provides:
 *  - RateView rate lookup (existing)
 *  - Freight Posting CRUD for loads and trucks
 *  - Freight Search for loads and trucks
 *  - DAT post management (list active posts, equipment types)
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { auth } = require('../middleware');
const { requireEmployee } = require('../middleware/auth');
const datService = require('../services/datService');
const datPostingService = require('../services/datPostingService');
const datSearchService = require('../services/datSearchService');
const DATPost = require('../models/DATPost');
const { listEquipmentTypes, mapToDATEquipmentCode } = require('../services/datEquipmentTypes');

// ─── RateView (existing) ─────────────────────────────────────────────

/**
 * POST /api/dat/rate-lookup
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
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { originZip, destinationZip, equipmentType, weight } = req.body;
    const rate = await datService.rateLookup({ originZip, destinationZip, equipmentType, weight });
    res.json({ success: true, data: rate });
  } catch (error) {
    console.error('DAT rate lookup error:', error);
    res.status(500).json({ success: false, message: 'DAT rate lookup failed' });
  }
});

/**
 * POST /api/dat/batch-rate-lookup
 */
router.post('/batch-rate-lookup', auth, [
  body('lanes').isArray({ min: 1 }).withMessage('Lanes array is required'),
  body('lanes.*.originZip').notEmpty().withMessage('Origin zip is required for each lane'),
  body('lanes.*.destinationZip').notEmpty().withMessage('Destination zip is required for each lane')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
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
 */
router.get('/status', auth, async (req, res) => {
  try {
    const result = await datService.testConnection();
    res.json({
      success: true,
      data: {
        configured: datService.isConfigured(),
        ...result,
        env: process.env.DAT_API_ENV || 'production'
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        configured: false,
        connected: false,
        mock: true,
        message: 'DAT status check failed: ' + error.message
      }
    });
  }
});

// ─── Equipment Types ─────────────────────────────────────────────────

/**
 * GET /api/dat/equipment-types
 * List all DAT equipment types.
 */
router.get('/equipment-types', auth, (req, res) => {
  const types = listEquipmentTypes();
  res.json({ success: true, data: types });
});

// ─── Freight Posting: Loads ──────────────────────────────────────────

/**
 * POST /api/dat/posts/loads
 * Create a new load post on the DAT load board.
 */
router.post('/posts/loads', auth, requireEmployee, [
  body('originZip').optional().isString(),
  body('destinationZip').optional().isString(),
  body('equipmentType').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const result = await datPostingService.createLoadPost(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('DAT create load post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create DAT load post'
    });
  }
});

/**
 * PUT /api/dat/posts/loads/:datPostId
 * Update an existing load post.
 */
router.put('/posts/loads/:datPostId', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.updateLoadPost(
      req.user.id,
      req.params.datPostId,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT update load post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update DAT load post'
    });
  }
});

/**
 * POST /api/dat/posts/loads/:datPostId/refresh
 * Refresh an existing load post (without deleting and re-creating).
 */
router.post('/posts/loads/:datPostId/refresh', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.refreshLoadPost(
      req.user.id,
      req.params.datPostId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT refresh load post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to refresh DAT load post'
    });
  }
});

/**
 * DELETE /api/dat/posts/loads/:datPostId
 * Delete a load post from the DAT load board.
 */
router.delete('/posts/loads/:datPostId', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.deleteLoadPost(
      req.user.id,
      req.params.datPostId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT delete load post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete DAT load post'
    });
  }
});

/**
 * POST /api/dat/posts/loads/from-order/:orderId
 * Create a DAT load post directly from an employee_order row. Maps
 * FTL/LTL freight_mode → fullPartial=FULL/PARTIAL and pulls equipment,
 * length, weight, lane, dates and reference from the order.
 */
router.post('/posts/loads/from-order/:orderId', auth, requireEmployee, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const result = await datPostingService.postFromEmployeeOrder(req.user.id, orderId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('DAT post-from-order error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to post order to DAT'
    });
  }
});

// ─── Freight Posting: Trucks ─────────────────────────────────────────

/**
 * POST /api/dat/posts/trucks
 */
router.post('/posts/trucks', auth, requireEmployee, [
  body('originZip').optional().isString(),
  body('destinationZip').optional().isString(),
  body('equipmentType').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const result = await datPostingService.createTruckPost(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('DAT create truck post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create DAT truck post'
    });
  }
});

/**
 * PUT /api/dat/posts/trucks/:datPostId
 */
router.put('/posts/trucks/:datPostId', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.updateTruckPost(
      req.user.id,
      req.params.datPostId,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT update truck post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update DAT truck post'
    });
  }
});

/**
 * POST /api/dat/posts/trucks/:datPostId/refresh
 */
router.post('/posts/trucks/:datPostId/refresh', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.refreshTruckPost(
      req.user.id,
      req.params.datPostId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT refresh truck post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to refresh DAT truck post'
    });
  }
});

/**
 * DELETE /api/dat/posts/trucks/:datPostId
 */
router.delete('/posts/trucks/:datPostId', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datPostingService.deleteTruckPost(
      req.user.id,
      req.params.datPostId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT delete truck post error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete DAT truck post'
    });
  }
});

// ─── Post Management ─────────────────────────────────────────────────

/**
 * GET /api/dat/posts
 * List the current employee's DAT posts (tracked locally).
 * Query params: status, post_type
 */
router.get('/posts', auth, requireEmployee, async (req, res) => {
  try {
    const posts = await DATPost.getByEmployee(req.user.id, {
      status: req.query.status,
      post_type: req.query.post_type,
    });
    const stats = await DATPost.getStats(req.user.id);
    res.json({ success: true, data: { posts, stats } });
  } catch (error) {
    console.error('DAT get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch DAT posts' });
  }
});

/**
 * GET /api/dat/posts/order/:orderId
 * Get DAT posts linked to a specific employee order.
 */
router.get('/posts/order/:orderId', auth, requireEmployee, async (req, res) => {
  try {
    const posts = await DATPost.getByOrderId(parseInt(req.params.orderId));
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('DAT get posts for order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch DAT posts for order' });
  }
});

// ─── Freight Search ──────────────────────────────────────────────────

/**
 * POST /api/dat/search/loads
 * Search loads on the DAT load board.
 * Must be triggered by a real-time user request (no auto-generated searches).
 */
router.post('/search/loads', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datSearchService.searchLoads(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT search loads error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'DAT load search failed'
    });
  }
});

/**
 * POST /api/dat/search/trucks
 * Search trucks on the DAT load board.
 */
router.post('/search/trucks', auth, requireEmployee, async (req, res) => {
  try {
    const result = await datSearchService.searchTrucks(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DAT search trucks error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'DAT truck search failed'
    });
  }
});

module.exports = router;
