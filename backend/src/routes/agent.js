/**
 * AI Agent API 路由
 * - 批量解析文件并创建订单
 * - 触发 DAT + LTL 承运商报价
 * - AI 报价审核管理
 * - 报价文档生成
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, query, validationResult } = require('express-validator');
const { auth, requireEmployee, requirePermission } = require('../middleware/auth');
const agentService = require('../services/agentService');
const geminiService = require('../services/geminiService');
const datService = require('../services/datService');
const wecomService = require('../services/wecomService');
const { db } = require('../config/database');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype) ||
        file.originalname.match(/\.(pdf|png|jpg|jpeg|webp|gif|xlsx|xls|csv|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

/**
 * POST /api/agent/parse-file
 * Upload a file (PDF/Excel/image) and parse it with Gemini AI into structured shipment data.
 * Returns parsed shipments for review before creating orders.
 */
router.post('/parse-file', auth, requireEmployee, upload.single('file'), async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`📄 Agent parse-file: ${originalname} (${mimetype}, ${buffer.length} bytes)`);

    const result = await geminiService.parseFile(buffer, mimetype, originalname);

    res.json({
      success: true,
      message: `Parsed ${result.shipments.length} shipment(s) from ${originalname}`,
      data: {
        filename: originalname,
        shipments: result.shipments
      }
    });
  } catch (error) {
    console.error('Agent parse-file error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/parse-cargo
 * Cargo-only parser used by the in-row 货物明细 drop zone.
 * Accepts EITHER a multipart file upload OR a JSON body { text: "..." }.
 * Returns ONLY pallet line items (lbs/in), no addresses or recipient info.
 */
router.post('/parse-cargo', auth, requireEmployee, upload.single('file'), async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  try {
    if (req.file) {
      const { buffer, mimetype, originalname } = req.file;
      console.log(`📦 Agent parse-cargo (file): ${originalname} (${mimetype}, ${buffer.length} bytes)`);
      const result = await geminiService.parseCargoFile(buffer, mimetype, originalname);
      return res.json({ success: true, data: result });
    }

    // No file → expect JSON text body
    const text = req.body && (req.body.text || req.body.content);
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'No file or text provided' });
    }
    console.log(`📦 Agent parse-cargo (text): ${String(text).length} chars`);
    const result = await geminiService.parseCargoText(text);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Agent parse-cargo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/parse-and-create
 * Accept parsed shipment data (from OpenClaw or manual upload) and create orders.
 */
router.post('/parse-and-create', auth, requireEmployee, [
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.tracking_number').optional().isString(),
  body('items.*.product_name_en').optional().isString(),
  body('items.*.destination_zip').optional().isString(),
  body('sourceFile').optional().isString(),
  body('wecomChatId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { items, sourceFile, wecomChatId, autoApprove } = req.body;
    const createdBy = typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.userId) || 1;

    const normalized = agentService.normalizeShipmentItems(items);
    const orders = await agentService.batchCreateOrders(normalized, createdBy);
    const orderIds = orders.map(o => o.id);

    let reviewTask = null;
    if (!autoApprove) {
      reviewTask = await agentService.createReviewTask({
        sourceFile: sourceFile || 'unknown',
        parsedItems: normalized,
        orderIds,
        wecomChatId,
        createdBy
      });
    }

    res.status(201).json({
      success: true,
      message: `${orders.length} orders created from AI parsing`,
      data: {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          ewQuoteNumber: o.ew_quote_number,
          destinationZip: o.destination_zipcode,
          destinationCity: o.destination_city,
          cargoDescription: o.cargo_description
        })),
        reviewTaskId: reviewTask?.id || null,
        needsReview: !autoApprove
      }
    });
  } catch (error) {
    console.error('Agent parse-and-create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/enrich-quotes
 * Fetch DAT rates and enrich existing orders.
 */
router.post('/enrich-quotes', auth, requireEmployee, [
  body('orderIds').isArray({ min: 1 }).withMessage('Order IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const results = await agentService.enrichOrdersWithDATRates(req.body.orderIds);

    res.json({
      success: true,
      message: 'Orders enriched with DAT rates',
      data: results
    });
  } catch (error) {
    console.error('Agent enrich-quotes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agent/reviews
 * List AI quote review tasks.
 */
router.get('/reviews', auth, requireEmployee, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const tasks = await agentService.getReviewTasks({
      status: status || undefined,
      limit: parseInt(limit) || 50
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Agent reviews list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agent/reviews/:id
 * Get a single review task with its associated orders.
 */
router.get('/reviews/:id', auth, requireEmployee, async (req, res) => {
  try {
    const task = await db('ai_quote_reviews').where('id', req.params.id).first();
    if (!task) {
      return res.status(404).json({ success: false, message: 'Review task not found' });
    }

    const orderIds = JSON.parse(task.order_ids || '[]');
    const orders = orderIds.length > 0
      ? await db('employee_orders').whereIn('id', orderIds)
      : [];

    res.json({
      success: true,
      data: {
        ...task,
        parsed_data: JSON.parse(task.parsed_data || '[]'),
        order_ids: orderIds,
        orders
      }
    });
  } catch (error) {
    console.error('Agent review detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/reviews/:id/approve
 * Approve a review task and optionally trigger quote distribution.
 */
router.post('/reviews/:id/approve', auth, requireEmployee, async (req, res) => {
  try {
    const reviewedBy = req.user.employeeId || req.user.id;
    const task = await agentService.approveReviewTask(req.params.id, reviewedBy);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Review task not found' });
    }

    const orderIds = JSON.parse(task.order_ids || '[]');

    if (req.body.enrichWithDAT && orderIds.length > 0) {
      const datResults = await agentService.enrichOrdersWithDATRates(orderIds);
      return res.json({
        success: true,
        message: 'Review approved and DAT rates enriched',
        data: { task, datResults }
      });
    }

    res.json({ success: true, message: 'Review approved', data: { task } });
  } catch (error) {
    console.error('Agent review approve error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/reviews/:id/reject
 * Reject a review task.
 */
router.post('/reviews/:id/reject', auth, requireEmployee, [
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const reviewedBy = req.user.employeeId || req.user.id;
    const task = await agentService.rejectReviewTask(req.params.id, reviewedBy, req.body.reason);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Review task not found' });
    }

    res.json({ success: true, message: 'Review rejected', data: { task } });
  } catch (error) {
    console.error('Agent review reject error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/distribute-quote
 * Send approved quote back to WeCom group.
 */
router.post('/distribute-quote', auth, requireEmployee, [
  body('reviewTaskId').notEmpty().withMessage('Review task ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const task = await db('ai_quote_reviews').where('id', req.body.reviewTaskId).first();
    if (!task) {
      return res.status(404).json({ success: false, message: 'Review task not found' });
    }

    if (task.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Review task must be approved before distributing' });
    }

    const orderIds = JSON.parse(task.order_ids || '[]');
    const orders = orderIds.length > 0
      ? await db('employee_orders').whereIn('id', orderIds)
      : [];

    const quoteLines = orders.map(o => {
      const price = o.ew_quote_price || o.total_dat || 'TBD';
      return `📦 ${o.ew_quote_number || o.order_number} - ${o.cargo_description} -> ${o.destination_city || ''}, ${o.destination_state || ''} ${o.destination_zipcode || ''}\n   报价: $${price} (${o.address_type || 'Commercial'})`;
    });

    const message = [
      '[EW自动报价] 您好，以下是本次报价结果:',
      '',
      ...quoteLines,
      '',
      '详细报价单请查看附件。',
      '如有疑问请回复此群。'
    ].join('\n');

    if (task.wecom_chat_id) {
      try {
        await wecomService.sendTextMessage({
          chatId: task.wecom_chat_id,
          content: message
        });
      } catch (wecomError) {
        console.error('WeCom send failed:', wecomError.message);
      }
    }

    await db('ai_quote_reviews').where('id', task.id).update({
      status: 'distributed',
      distributed_at: new Date()
    });

    res.json({
      success: true,
      message: 'Quote distributed',
      data: { quoteMessage: message, orderCount: orders.length }
    });
  } catch (error) {
    console.error('Agent distribute-quote error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agent/webhook
 * Webhook endpoint for OpenClaw to send parsed file results.
 * This is called by OpenClaw after it processes a file.
 */
router.post('/webhook', async (req, res) => {
  try {
    const apiKey = req.headers['x-agent-api-key'];
    const expectedKey = process.env.AGENT_WEBHOOK_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    const { items, sourceFile, wecomChatId, agentUserId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const createdBy = agentUserId || 1;
    const normalized = agentService.normalizeShipmentItems(items);
    const orders = await agentService.batchCreateOrders(normalized, createdBy);
    const orderIds = orders.map(o => o.id);

    const reviewTask = await agentService.createReviewTask({
      sourceFile: sourceFile || 'openclaw_upload',
      parsedItems: normalized,
      orderIds,
      wecomChatId,
      createdBy
    });

    console.log(`✅ OpenClaw webhook: ${orders.length} orders created, review task ${reviewTask.id}`);

    res.status(201).json({
      success: true,
      data: {
        orderCount: orders.length,
        reviewTaskId: reviewTask.id,
        orderIds
      }
    });
  } catch (error) {
    console.error('Agent webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agent/status
 * Health check and configuration status for the AI agent system.
 */
router.get('/status', async (req, res) => {
  const wecomConfigured = !!(process.env.WECOM_CORP_ID && process.env.WECOM_AGENT_SECRET);
  const datConfigured = !!(process.env.DAT_CLIENT_ID && process.env.DAT_CLIENT_SECRET);
  const openclawConfigured = !!process.env.OPENCLAW_WEBHOOK_URL;
  const webhookKeyConfigured = !!process.env.AGENT_WEBHOOK_API_KEY;

  let reviewTableExists = false;
  try {
    reviewTableExists = await db.schema.hasTable('ai_quote_reviews');
  } catch (e) { /* ignore */ }

  res.json({
    success: true,
    data: {
      wecom: { configured: wecomConfigured },
      dat: { configured: datConfigured },
      openclaw: { configured: openclawConfigured },
      webhookAuth: { configured: webhookKeyConfigured },
      database: { reviewTableExists }
    }
  });
});

/**
 * GET /api/agent/carrier-rules
 * Return all carrier rules (public, no auth needed — used by quote UI).
 */
router.get('/carrier-rules', async (req, res) => {
  const { CARRIER_RULES, getCarrierRules } = require('../config/carrierRules');
  const { carrier } = req.query;
  if (carrier) {
    const rules = getCarrierRules(carrier);
    return res.json({ success: true, data: rules });
  }
  res.json({ success: true, data: CARRIER_RULES });
});

module.exports = router;
