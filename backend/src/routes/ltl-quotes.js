const express = require('express');
const router = express.Router();
const LTLQuoteSession = require('../models/LTLQuoteSession');
const { auth, requireEmployee } = require('../middleware/auth');
const Order = require('../models/EmployeeOrder');
const Customer = require('../models/Customer');
const { db } = require('../config/database');

/**
 * GET /api/ltl-quotes/sessions/guest
 * Get all guest quote sessions (no employee_order_id) for the employee dashboard.
 */
router.get('/sessions/guest', auth, requireEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await LTLQuoteSession.findGuestSessions({
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Failed to get guest sessions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ltl-quotes/sessions/:sessionId/import
 * Import a guest quote session into the employee order system.
 */
router.post('/sessions/:sessionId/import', auth, requireEmployee, async (req, res) => {
  try {
    const session = await LTLQuoteSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Quote session not found' });
    }
    if (session.employee_order_id) {
      return res.status(400).json({ success: false, message: '该报价已导入报价单' });
    }

    const items = session.items || [];
    const quoteResults = session.quote_results || [];
    const lowestQuote = quoteResults.length > 0
      ? quoteResults.reduce((min, q) => ((q.totalPrice || q.price || Infinity) < (min.totalPrice || min.price || Infinity)) ? q : min, quoteResults[0])
      : null;

    // Build weight_list and dimensions_list from item details
    const weights = items.map(i => Math.round(parseFloat(i.weight || 0)));
    const dimensions = items.map(i => ({
      length: Math.round(parseFloat(i.length || 0)),
      width: Math.round(parseFloat(i.width || 0)),
      height: Math.round(parseFloat(i.height || 0)),
      pieces: parseInt(i.pallets || 1),
      volume: (parseFloat(i.length || 0) * parseFloat(i.width || 0) * parseFloat(i.height || 0) / 1728)
    }));

    const cargoDesc = items.map((item, idx) =>
      `货物${idx + 1}: ${item.pallets || 1}托盘, ${item.weight || 0}lbs, ${item.length || 0}×${item.width || 0}×${item.height || 0}in${item.freightClass ? ' Class' + item.freightClass : ''}`
    ).join('; ') || 'LTL货物';

    // Look up user info for name, phone, company
    const userRecord = await db('users').where('email', session.user_email).first();
    const userName = userRecord
      ? [userRecord.first_name, userRecord.last_name].filter(Boolean).join(' ')
      : null;
    const userCompany = userRecord?.company_name || null;
    const userPhone = userRecord?.phone || null;

    // Auto-create customer record if company exists and not already in customers table
    if (userCompany) {
      try {
        const existing = await Customer.getByName(userCompany);
        if (!existing) {
          await Customer.createCustomer({
            company_name: userCompany,
            contact_person: userName || null,
            contact_email: session.user_email,
            contact_phone: userPhone || null,
          }, req.user.id);
          console.log(`✅ Auto-created customer: ${userCompany}`);
        }
      } catch (custErr) {
        console.warn('Auto-create customer skipped:', custErr.message);
      }
    }

    const lowestPrice = lowestQuote ? (lowestQuote.totalPrice || lowestQuote.price) : session.lowest_price;

    const orderData = {
      order_type: 'land_freight',
      status: 'quote',
      customer_name: userName || userCompany || session.user_email,
      customer_email: session.user_email,
      customer_phone: userPhone,
      inquiry_company: userCompany || session.user_email,
      cargo_description: `LTL报价(客人) - ${quoteResults.length}家运输商`,
      cargo_description_detailed: cargoDesc,
      weight_list: JSON.stringify(weights),
      dimensions_list: JSON.stringify(dimensions),
      total_weight_lbs: session.total_weight ? String(session.total_weight) : null,
      total_volume: dimensions.reduce((sum, d) => sum + (d.volume || 0), 0) || null,
      actual_pallets: session.total_pallets,
      origin_city: session.origin_city,
      origin_state: session.origin_state,
      origin_zipcode: session.origin_zip,
      destination_city: session.destination_city,
      destination_state: session.destination_state,
      destination_zipcode: session.destination_zip,
      address_type: session.destination_location_type || 'Commercial',
      transport_distance: session.distance_miles || null,
      pickup_date: session.pickup_date,
      delivery_date: session.delivery_date,
      quoted_price: session.lowest_price,
      ew_quote_price: lowestPrice,
      cargo_type: `LTL报价 - ${quoteResults.length}家运输商`,
      ew_quote_number: session.session_id,
      notes: `客人报价导入 | ${quoteResults.length} carriers | 最低 $${session.lowest_price}`,
      internal_notes: `来源: 客人LTL报价 ${session.session_id}\n邮箱: ${session.user_email}`,
      custom_fields: JSON.stringify({
        carrier_quotes: quoteResults.map(q => ({
          carrier: q.carrier || q.carrierCode,
          price: q.totalPrice || q.price,
          transitDays: q.transitDays,
          serviceType: q.serviceType || q.serviceLevel,
          isGuaranteed: q.isGuaranteed,
          quoteId: q.quoteId,
          expDate: q.expDate,
        })),
        quote_session_id: session.session_id,
      }),
    };

    const order = await Order.createOrder(orderData, req.user.id);

    await LTLQuoteSession.linkToOrder(req.params.sessionId, order.id);

    res.json({
      success: true,
      message: '已成功导入报价单',
      data: { orderId: order.id, orderNumber: order.order_number, sessionId: session.session_id }
    });
  } catch (error) {
    console.error('Failed to import guest session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

/**
 * DELETE /api/ltl-quotes/sessions/:sessionId
 * Delete a quote session.
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const deleted = await LTLQuoteSession.delete(req.params.sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Quote session not found'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete quote session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
