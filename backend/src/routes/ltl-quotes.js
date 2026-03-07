const express = require('express');
const router = express.Router();
const LTLQuoteSession = require('../models/LTLQuoteSession');

/**
 * POST /api/ltl-quotes/sessions
 * Save a new LTL quote session with all carrier results.
 */
router.post('/sessions', async (req, res) => {
  try {
    const {
      userEmail,
      originCity, originState, originZip,
      destinationCity, destinationState, destinationZip,
      originLocationType, destinationLocationType,
      distanceMiles, pickupDate, deliveryDate,
      items, pickupServices, deliveryServices,
      totalWeight, totalPallets,
      quoteResults, lowestPrice,
      employeeOrderId
    } = req.body;

    if (!userEmail || !quoteResults || quoteResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userEmail and quoteResults are required'
      });
    }

    const session = await LTLQuoteSession.create({
      userEmail,
      originCity, originState, originZip,
      destinationCity, destinationState, destinationZip,
      originLocationType, destinationLocationType,
      distanceMiles, pickupDate, deliveryDate,
      items, pickupServices, deliveryServices,
      totalWeight, totalPallets,
      quoteResults, lowestPrice,
      employeeOrderId
    });

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Failed to save quote session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ltl-quotes/sessions
 * Get all quote sessions for a user.
 */
router.get('/sessions', async (req, res) => {
  try {
    const { email, page = 1, limit = 20, includeExpired = 'false' } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email query parameter is required'
      });
    }

    const result = await LTLQuoteSession.findByUser(email, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeExpired: includeExpired === 'true'
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Failed to get quote sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ltl-quotes/sessions/:sessionId
 * Get a single quote session by ID.
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await LTLQuoteSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quote session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Failed to get quote session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
