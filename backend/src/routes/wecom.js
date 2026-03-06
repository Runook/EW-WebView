/**
 * WeCom (企业微信) 回调路由
 * - 接收客户从微信群发送的文件消息
 * - 下载附件并触发 OpenClaw Agent 处理
 * - 将报价结果发送回群
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const wecomService = require('../services/wecomService');

const OPENCLAW_WEBHOOK_URL = process.env.OPENCLAW_WEBHOOK_URL;

/**
 * GET /api/wecom/callback
 * WeCom URL verification (echo test).
 * WeCom sends msg_signature, timestamp, nonce, echostr as query params.
 */
router.get('/callback', (req, res) => {
  try {
    const { msg_signature, timestamp, nonce, echostr } = req.query;

    if (!echostr) {
      return res.status(400).send('Missing echostr');
    }

    const computedSignature = wecomService.verifySignature(
      wecomService.CALLBACK_TOKEN, timestamp, nonce, echostr
    );

    if (computedSignature !== msg_signature) {
      console.error('WeCom callback verification failed: signature mismatch');
      return res.status(403).send('Signature mismatch');
    }

    const decrypted = wecomService.decryptMessage(echostr);
    res.status(200).send(decrypted);
  } catch (error) {
    console.error('WeCom callback verification error:', error);
    res.status(500).send('Internal error');
  }
});

/**
 * POST /api/wecom/callback
 * Receive WeCom message events (file messages from group chats).
 */
router.post('/callback', express.text({ type: '*/*' }), async (req, res) => {
  res.status(200).send('success');

  try {
    const { msg_signature, timestamp, nonce } = req.query;
    let body = req.body;

    if (typeof body === 'string' && body.includes('<Encrypt>')) {
      const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.+?)\]\]><\/Encrypt>/);
      if (encryptMatch) {
        body = wecomService.decryptMessage(encryptMatch[1]);
      }
    }

    const parsed = parseXmlMessage(body);
    if (!parsed) return;

    console.log(`📩 WeCom message received: type=${parsed.MsgType}, from=${parsed.FromUserName}`);

    if (parsed.MsgType === 'file' || parsed.MsgType === 'attachment') {
      await handleFileMessage(parsed);
    }

    if (parsed.MsgType === 'text') {
      await handleTextMessage(parsed);
    }
  } catch (error) {
    console.error('WeCom callback processing error:', error);
  }
});

/**
 * Handle incoming file messages: download and forward to OpenClaw.
 */
async function handleFileMessage(msg) {
  try {
    const mediaId = msg.MediaId;
    if (!mediaId) {
      console.error('File message missing MediaId');
      return;
    }

    console.log(`📎 Downloading file: mediaId=${mediaId}`);
    const file = await wecomService.downloadMedia(mediaId);
    console.log(`📎 Downloaded: ${file.filename} (${file.buffer.length} bytes)`);

    const ext = file.filename.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'pdf', 'csv'].includes(ext)) {
      console.log(`⏭ Skipping non-quote file: ${file.filename}`);
      return;
    }

    if (OPENCLAW_WEBHOOK_URL) {
      const formData = new (await import('form-data')).default();
      formData.append('file', file.buffer, { filename: file.filename });
      formData.append('chat_id', msg.FromUserName || '');
      formData.append('sender', msg.FromUserName || '');
      formData.append('source', 'wecom');

      await axios.post(OPENCLAW_WEBHOOK_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      console.log(`✅ File forwarded to OpenClaw: ${file.filename}`);
    } else {
      console.log('⚠️ OPENCLAW_WEBHOOK_URL not configured, file not forwarded');
    }
  } catch (error) {
    console.error('Error handling file message:', error.message);
  }
}

/**
 * Handle text messages (e.g., "查看报价状态" commands).
 */
async function handleTextMessage(msg) {
  const content = (msg.Content || '').trim();

  if (content.includes('报价') || content.includes('quote')) {
    try {
      await wecomService.sendTextMessage({
        chatId: msg.FromUserName,
        content: '[EW AI Agent] 收到您的报价查询，请稍候...'
      });
    } catch (error) {
      console.error('Error sending reply:', error.message);
    }
  }
}

/**
 * POST /api/wecom/send-quote
 * Internal API to send a quote result back to WeCom.
 */
router.post('/send-quote', auth, async (req, res) => {
  try {
    const { chatId, userId, message, fileBuffer, filename } = req.body;

    if (message) {
      await wecomService.sendTextMessage({ chatId, userId, content: message });
    }

    if (fileBuffer && filename) {
      const buf = Buffer.from(fileBuffer, 'base64');
      await wecomService.sendFileMessage({ chatId, userId, fileBuffer: buf, filename });
    }

    res.json({ success: true, message: 'Quote sent to WeCom' });
  } catch (error) {
    console.error('Error sending quote to WeCom:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wecom/status
 * Health check for WeCom integration.
 */
router.get('/status', async (req, res) => {
  const configured = !!(
    process.env.WECOM_CORP_ID &&
    process.env.WECOM_AGENT_SECRET
  );

  let tokenValid = false;
  if (configured) {
    try {
      await wecomService.getAccessToken();
      tokenValid = true;
    } catch (e) { /* token fetch failed */ }
  }

  res.json({
    success: true,
    wecom: {
      configured,
      tokenValid,
      openclawWebhook: !!OPENCLAW_WEBHOOK_URL
    }
  });
});

// --- Helpers ---

function parseXmlMessage(xml) {
  if (!xml || typeof xml !== 'string') return null;

  const extract = (tag) => {
    const match = xml.match(new RegExp(`<${tag}><\\!\\[CDATA\\[(.+?)\\]\\]><\\/${tag}>`))
      || xml.match(new RegExp(`<${tag}>(.+?)<\\/${tag}>`));
    return match ? match[1] : null;
  };

  return {
    ToUserName: extract('ToUserName'),
    FromUserName: extract('FromUserName'),
    CreateTime: extract('CreateTime'),
    MsgType: extract('MsgType'),
    Content: extract('Content'),
    MediaId: extract('MediaId'),
    MsgId: extract('MsgId'),
    AgentID: extract('AgentID')
  };
}

module.exports = router;
