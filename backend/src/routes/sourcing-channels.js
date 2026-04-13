const express = require('express');
const router = express.Router();
const SourcingChannel = require('../models/SourcingChannel');
const { auth, requireEmployee, requireRole } = require('../middleware/auth');

/**
 * GET /api/sourcing-channels
 */
router.get('/', auth, requireEmployee, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const channels = await SourcingChannel.getAll(includeInactive);
    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('Failed to get sourcing channels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/sourcing-channels
 */
router.post('/', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const channel = await SourcingChannel.create({ name: name.trim(), description });
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Channel name already exists' });
    }
    console.error('Failed to create sourcing channel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/sourcing-channels/:id
 */
router.put('/:id', auth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const channel = await SourcingChannel.update(parseInt(req.params.id), req.body);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('Failed to update sourcing channel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/sourcing-channels/:id
 */
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    await SourcingChannel.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    console.error('Failed to delete sourcing channel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
