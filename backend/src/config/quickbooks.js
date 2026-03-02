const OAuthClient = require('intuit-oauth');
const { db } = require('./database');

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID;
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET;
const QBO_REDIRECT_URI = process.env.QBO_REDIRECT_URI || 'https://welogx.com/api/qbo/callback';
const QBO_ENVIRONMENT = process.env.QBO_ENVIRONMENT || 'production';

const QBO_BASE_URL = QBO_ENVIRONMENT === 'sandbox'
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com';

let oauthClient = null;

function getOAuthClient() {
  if (!oauthClient) {
    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      throw new Error('QBO_CLIENT_ID and QBO_CLIENT_SECRET must be configured');
    }
    oauthClient = new OAuthClient({
      clientId: QBO_CLIENT_ID,
      clientSecret: QBO_CLIENT_SECRET,
      environment: QBO_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production',
      redirectUri: QBO_REDIRECT_URI,
    });
  }
  return oauthClient;
}

async function getActiveConnection() {
  const conn = await db('qbo_connections').where('is_active', true).first();
  return conn || null;
}

async function saveTokens(realmId, tokenData, connectedBy = null) {
  const now = new Date();
  const accessExpires = new Date(now.getTime() + (tokenData.expires_in || 3600) * 1000);
  const refreshExpires = new Date(now.getTime() + (tokenData.x_refresh_token_expires_in || 8726400) * 1000);

  const existing = await db('qbo_connections').where('realm_id', realmId).first();

  const data = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    access_token_expires_at: accessExpires,
    refresh_token_expires_at: refreshExpires,
    is_active: true,
    updated_at: now,
  };

  if (existing) {
    await db('qbo_connections').where('realm_id', realmId).update(data);
  } else {
    await db('qbo_connections').insert({
      ...data,
      realm_id: realmId,
      company_name: tokenData.company_name || null,
      connected_by: connectedBy,
      connected_at: now,
      created_at: now,
    });
  }
}

async function getValidAccessToken() {
  const conn = await getActiveConnection();
  if (!conn) throw new Error('No active QBO connection');

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // refresh 5 min before expiry

  if (new Date(conn.access_token_expires_at).getTime() - bufferMs > now.getTime()) {
    return { accessToken: conn.access_token, realmId: conn.realm_id };
  }

  // Access token expired or expiring, refresh it
  console.log('🔄 QBO access token expired, refreshing...');
  const client = getOAuthClient();
  client.setToken({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    token_type: 'bearer',
  });

  try {
    const authResponse = await client.refresh();
    const newTokens = authResponse.getJson();
    await saveTokens(conn.realm_id, newTokens);
    console.log('✅ QBO tokens refreshed');
    return { accessToken: newTokens.access_token, realmId: conn.realm_id };
  } catch (err) {
    console.error('❌ QBO token refresh failed:', err.message);
    await db('qbo_connections').where('realm_id', conn.realm_id).update({ is_active: false });
    throw new Error('QBO token refresh failed. Please reconnect.');
  }
}

async function qboRequest(method, path, body = null) {
  const { accessToken, realmId } = await getValidAccessToken();
  const url = `${QBO_BASE_URL}/v3/company/${realmId}${path}`;

  const axios = require('axios');
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body) config.data = body;

  try {
    const response = await axios(config);
    return response.data;
  } catch (err) {
    const errData = err.response?.data;
    console.error('❌ QBO API error:', JSON.stringify(errData, null, 2));
    const fault = errData?.Fault?.Error?.[0];
    throw new Error(fault?.Detail || fault?.Message || `QBO API error: ${err.message}`);
  }
}

module.exports = {
  getOAuthClient,
  getActiveConnection,
  saveTokens,
  getValidAccessToken,
  qboRequest,
  QBO_BASE_URL,
};
