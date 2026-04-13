const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const OrderLoad = require('../models/OrderLoad');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/shipments
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const { status, carrier_id, page = 1, limit = 50 } = req.query;
    const result = await Shipment.findAll({
      status,
      carrier_id: carrier_id ? parseInt(carrier_id) : undefined,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Failed to get shipments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/shipments/:id
 */
router.get('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const shipment = await Shipment.findById(parseInt(req.params.id));
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const loads = await OrderLoad.findByShipmentId(shipment.id);
    res.json({ success: true, data: { ...shipment, loads } });
  } catch (error) {
    console.error('Failed to get shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/shipments
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const shipment = await Shipment.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    console.error('Failed to create shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/shipments/:id
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const shipment = await Shipment.update(parseInt(req.params.id), req.body);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Failed to update shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/shipments/:id/status
 */
router.patch('/:id/status', auth, requireEmployee, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'dispatched', 'in_transit', 'delivered', 'completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${valid.join(', ')}` });
    }
    const shipment = await Shipment.updateStatus(parseInt(req.params.id), status);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Failed to update shipment status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/shipments/:id/loads/:loadId
 * Add a load to this shipment.
 */
router.post('/:id/loads/:loadId', auth, requireEmployee, async (req, res) => {
  try {
    await Shipment.addLoad(parseInt(req.params.id), parseInt(req.params.loadId));
    const shipment = await Shipment.findById(parseInt(req.params.id));
    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Failed to add load to shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/shipments/:id/loads/:loadId
 * Remove a load from this shipment.
 */
router.delete('/:id/loads/:loadId', auth, requireEmployee, async (req, res) => {
  try {
    await Shipment.removeLoad(parseInt(req.params.id), parseInt(req.params.loadId));
    const shipment = await Shipment.findById(parseInt(req.params.id));
    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Failed to remove load from shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/shipments/:id
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    await Shipment.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Shipment deleted' });
  } catch (error) {
    console.error('Failed to delete shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
