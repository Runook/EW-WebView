const axios = require('axios');
const crypto = require('crypto');

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

const CORP_ID = process.env.WECOM_CORP_ID;
const AGENT_SECRET = process.env.WECOM_AGENT_SECRET;
const AGENT_ID = process.env.WECOM_AGENT_ID;
const CALLBACK_TOKEN = process.env.WECOM_CALLBACK_TOKEN;
const CALLBACK_ENCODING_AES_KEY = process.env.WECOM_CALLBACK_AES_KEY;

let accessTokenCache = { token: null, expiresAt: 0 };

/**
 * Get WeCom access token (cached, auto-refreshes).
 */
async function getAccessToken() {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  const res = await axios.get(`${WECOM_API_BASE}/gettoken`, {
    params: { corpid: CORP_ID, corpsecret: AGENT_SECRET }
  });

  if (res.data.errcode !== 0) {
    throw new Error(`WeCom gettoken failed: ${res.data.errmsg}`);
  }

  accessTokenCache = {
    token: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in - 300) * 1000
  };

  return accessTokenCache.token;
}

/**
 * Download a media file from WeCom by media_id.
 * Returns { buffer, filename, contentType }.
 */
async function downloadMedia(mediaId) {
  const token = await getAccessToken();
  const res = await axios.get(`${WECOM_API_BASE}/media/get`, {
    params: { access_token: token, media_id: mediaId },
    responseType: 'arraybuffer'
  });

  const contentDisposition = res.headers['content-disposition'] || '';
  const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
  const filename = filenameMatch ? filenameMatch[1] : `file_${mediaId}`;
  const contentType = res.headers['content-type'] || 'application/octet-stream';

  return { buffer: Buffer.from(res.data), filename, contentType };
}

/**
 * Send a text message to a WeCom chat/user.
 */
async function sendTextMessage({ chatId, userId, content }) {
  const token = await getAccessToken();

  if (chatId) {
    return axios.post(`${WECOM_API_BASE}/appchat/send?access_token=${token}`, {
      chatid: chatId,
      msgtype: 'text',
      text: { content }
    });
  }

  return axios.post(`${WECOM_API_BASE}/message/send?access_token=${token}`, {
    touser: userId,
    agentid: AGENT_ID,
    msgtype: 'text',
    text: { content }
  });
}

/**
 * Send a file to a WeCom chat/user.
 * First uploads the file as a temporary media, then sends it.
 */
async function sendFileMessage({ chatId, userId, fileBuffer, filename }) {
  const token = await getAccessToken();
  const FormData = (await import('form-data')).default;

  const form = new FormData();
  form.append('media', fileBuffer, { filename });

  const uploadRes = await axios.post(
    `${WECOM_API_BASE}/media/upload?access_token=${token}&type=file`,
    form,
    { headers: form.getHeaders() }
  );

  if (uploadRes.data.errcode !== 0) {
    throw new Error(`WeCom media upload failed: ${uploadRes.data.errmsg}`);
  }

  const mediaId = uploadRes.data.media_id;

  if (chatId) {
    return axios.post(`${WECOM_API_BASE}/appchat/send?access_token=${token}`, {
      chatid: chatId,
      msgtype: 'file',
      file: { media_id: mediaId }
    });
  }

  return axios.post(`${WECOM_API_BASE}/message/send?access_token=${token}`, {
    touser: userId,
    agentid: AGENT_ID,
    msgtype: 'file',
    file: { media_id: mediaId }
  });
}

// --- WeCom callback signature verification (AES decryption) ---

function decodeAESKey(encodingAESKey) {
  return Buffer.from(encodingAESKey + '=', 'base64');
}

/**
 * Verify the WeCom callback signature.
 */
function verifySignature(token, timestamp, nonce, echostr) {
  const parts = [token, timestamp, nonce, echostr].filter(Boolean).sort();
  const hash = crypto.createHash('sha1').update(parts.join('')).digest('hex');
  return hash;
}

/**
 * Decrypt WeCom AES-encrypted message body.
 */
function decryptMessage(encryptedMsg) {
  if (!CALLBACK_ENCODING_AES_KEY) return encryptedMsg;

  const aesKey = decodeAESKey(CALLBACK_ENCODING_AES_KEY);
  const iv = aesKey.slice(0, 16);

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  decipher.setAutoPadding(false);

  let decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedMsg, 'base64')),
    decipher.final()
  ]);

  // PKCS#7 un-padding
  const padLen = decrypted[decrypted.length - 1];
  decrypted = decrypted.slice(0, decrypted.length - padLen);

  // Skip random 16 bytes, then read msg_len (4 bytes big-endian)
  const msgLen = decrypted.readUInt32BE(16);
  const message = decrypted.slice(20, 20 + msgLen).toString('utf8');

  return message;
}

/**
 * Encrypt a reply message for WeCom callback verification.
 */
function encryptMessage(replyMsg) {
  if (!CALLBACK_ENCODING_AES_KEY) return replyMsg;

  const aesKey = decodeAESKey(CALLBACK_ENCODING_AES_KEY);
  const iv = aesKey.slice(0, 16);

  const randomBytes = crypto.randomBytes(16);
  const msgBuffer = Buffer.from(replyMsg, 'utf8');
  const msgLenBuffer = Buffer.alloc(4);
  msgLenBuffer.writeUInt32BE(msgBuffer.length, 0);
  const corpIdBuffer = Buffer.from(CORP_ID || '', 'utf8');

  let raw = Buffer.concat([randomBytes, msgLenBuffer, msgBuffer, corpIdBuffer]);

  // PKCS#7 padding
  const blockSize = 32;
  const padLen = blockSize - (raw.length % blockSize);
  const padding = Buffer.alloc(padLen, padLen);
  raw = Buffer.concat([raw, padding]);

  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  cipher.setAutoPadding(false);

  return Buffer.concat([cipher.update(raw), cipher.final()]).toString('base64');
}

module.exports = {
  getAccessToken,
  downloadMedia,
  sendTextMessage,
  sendFileMessage,
  verifySignature,
  decryptMessage,
  encryptMessage,
  CALLBACK_TOKEN,
  CORP_ID
};
