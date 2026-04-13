const express = require('express');
const router = express.Router();
const OrderLoad = require('../models/OrderLoad');
const { auth, requireEmployee } = require('../middleware/auth');

/**
 * GET /api/orders/:orderId/loads
 */
router.get('/:orderId/loads', auth, requireEmployee, async (req, res) => {
  try {
    const loads = await OrderLoad.findByOrderId(parseInt(req.params.orderId));
    const summary = await OrderLoad.getOrderLoadSummary(parseInt(req.params.orderId));
    res.json({ success: true, data: loads, summary });
  } catch (error) {
    console.error('Failed to get order loads:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/orders/:orderId/loads
 */
router.post('/:orderId/loads', auth, requireEmployee, async (req, res) => {
  try {
    const load = await OrderLoad.create(parseInt(req.params.orderId), req.body);
    res.status(201).json({ success: true, data: load });
  } catch (error) {
    console.error('Failed to create load:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/orders/:orderId/loads/bulk
 * Bulk-create from legacy JSON items array.
 */
router.post('/:orderId/loads/bulk', auth, requireEmployee, async (req, res) => {
  try {
    const { items } = req.body;
    const loads = await OrderLoad.bulkCreateFromItems(parseInt(req.params.orderId), items);
    res.status(201).json({ success: true, data: loads, count: loads.length });
  } catch (error) {
    console.error('Failed to bulk create loads:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/orders/:orderId/loads/:loadId
 */
router.put('/:orderId/loads/:loadId', auth, requireEmployee, async (req, res) => {
  try {
    const load = await OrderLoad.update(parseInt(req.params.loadId), req.body);
    if (!load) return res.status(404).json({ success: false, message: 'Load not found' });
    res.json({ success: true, data: load });
  } catch (error) {
    console.error('Failed to update load:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/orders/:orderId/loads/:loadId/status
 */
router.patch('/:orderId/loads/:loadId/status', auth, requireEmployee, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'ready_for_pickup', 'in_transit', 'delivered', 'delayed', 'damaged', 'lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const load = await OrderLoad.updateStatus(parseInt(req.params.loadId), status);
    if (!load) return res.status(404).json({ success: false, message: 'Load not found' });
    res.json({ success: true, data: load });
  } catch (error) {
    console.error('Failed to update load status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/orders/:orderId/loads/:loadId/shipment
 * Assign or remove load from a shipment.
 */
router.patch('/:orderId/loads/:loadId/shipment', auth, requireEmployee, async (req, res) => {
  try {
    const { shipment_id } = req.body;
    const load = await OrderLoad.assignToShipment(parseInt(req.params.loadId), shipment_id || null);
    if (!load) return res.status(404).json({ success: false, message: 'Load not found' });
    res.json({ success: true, data: load });
  } catch (error) {
    console.error('Failed to assign load to shipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/orders/:orderId/loads/:loadId
 */
router.delete('/:orderId/loads/:loadId', auth, requireEmployee, async (req, res) => {
  try {
    await OrderLoad.delete(parseInt(req.params.loadId));
    res.json({ success: true, message: 'Load deleted' });
  } catch (error) {
    console.error('Failed to delete load:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
