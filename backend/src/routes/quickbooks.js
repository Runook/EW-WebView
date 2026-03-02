const express = require('express');
const router = express.Router();
const { auth, requireEmployee } = require('../middleware/auth');
const { getOAuthClient, getActiveConnection, saveTokens } = require('../config/quickbooks');
const qboService = require('../services/qboService');
const { db } = require('../config/database');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://welogx.com';

const OAuthClient = require('intuit-oauth');

/**
 * GET /api/qbo/auth
 * Initiate OAuth 2.0 flow - redirects to Intuit's authorization page.
 * Accepts token as query param since this is a browser redirect (no Bearer header).
 */
router.get('/auth', async (req, res) => {
  try {
    // Verify employee auth via query param token
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token required' });
    }

    // Temporarily set auth header so the auth middleware-style check works
    const jwt = require('jsonwebtoken');
    const jwkToPem = require('jwk-to-pem');
    const axios = require('axios');
    const COGNITO_ISS = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_HU9W7uLQA';

    let isEmployee = false;
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded) {
        const jwksResponse = await axios.get(`${COGNITO_ISS}/.well-known/jwks.json`);
        const key = jwksResponse.data.keys.find(k => k.kid === decoded.header.kid);
        if (key) {
          const pem = jwkToPem(key);
          const payload = jwt.verify(token, pem, { issuer: COGNITO_ISS, algorithms: ['RS256'] });
          const dbUser = await db('users').where('cognito_sub', payload.sub).first();
          isEmployee = dbUser?.is_employee || false;
        }
      }
    } catch (e) {
      // Also try mock token
      if (token === 'mock-jwt-token-for-development') {
        isEmployee = true;
      }
    }

    if (!isEmployee) {
      return res.status(403).json({ success: false, message: 'Employee access required' });
    }

    const client = getOAuthClient();
    const authUri = client.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'qbo-connect',
    });
    res.redirect(authUri);
  } catch (error) {
    console.error('❌ QBO auth initiation failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/qbo/callback
 * OAuth callback - exchanges auth code for tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const client = getOAuthClient();
    const authResponse = await client.createToken(req.url);
    const tokenData = authResponse.getJson();
    const realmId = req.query.realmId;

    if (!realmId) {
      return res.redirect(`${FRONTEND_URL}/employee/orders?qbo=error&msg=no_realm_id`);
    }

    // Get company info from QBO
    let companyName = '';
    try {
      client.setToken({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: 'bearer',
      });
      const axios = require('axios');
      const baseUrl = process.env.QBO_ENVIRONMENT === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com'
        : 'https://quickbooks.api.intuit.com';
      const companyInfo = await axios.get(
        `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/json' } }
      );
      companyName = companyInfo.data?.CompanyInfo?.CompanyName || '';
    } catch (e) {
      console.warn('⚠️ Could not fetch QBO company name:', e.message);
    }

    await saveTokens(realmId, { ...tokenData, company_name: companyName });

    console.log(`✅ QBO connected: realm=${realmId}, company=${companyName}`);
    res.redirect(`${FRONTEND_URL}/employee/orders?qbo=connected&company=${encodeURIComponent(companyName)}`);
  } catch (error) {
    console.error('❌ QBO callback failed:', error.message);
    res.redirect(`${FRONTEND_URL}/employee/orders?qbo=error&msg=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/qbo/status
 * Check QBO connection status
 */
router.get('/status', auth, requireEmployee, async (req, res) => {
  try {
    const conn = await getActiveConnection();
    if (!conn) {
      return res.json({
        success: true,
        data: { connected: false },
      });
    }

    const now = new Date();
    const accessExpired = new Date(conn.access_token_expires_at) < now;
    const refreshExpired = new Date(conn.refresh_token_expires_at) < now;

    res.json({
      success: true,
      data: {
        connected: true,
        companyName: conn.company_name || conn.realm_id,
        realmId: conn.realm_id,
        connectedAt: conn.connected_at,
        lastSyncAt: conn.last_sync_at,
        tokenStatus: refreshExpired ? 'expired' : accessExpired ? 'needs_refresh' : 'valid',
      },
    });
  } catch (error) {
    console.error('❌ QBO status check failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/qbo/disconnect
 * Disconnect from QBO - revoke tokens and mark inactive
 */
router.post('/disconnect', auth, requireEmployee, async (req, res) => {
  try {
    const conn = await getActiveConnection();
    if (!conn) {
      return res.json({ success: true, message: 'Already disconnected' });
    }

    // Try to revoke the token
    try {
      const client = getOAuthClient();
      client.setToken({
        access_token: conn.access_token,
        refresh_token: conn.refresh_token,
        token_type: 'bearer',
      });
      await client.revoke({ token_type: 'access_token' });
    } catch (revokeErr) {
      console.warn('⚠️ Token revocation failed (may already be expired):', revokeErr.message);
    }

    await db('qbo_connections').where('realm_id', conn.realm_id).update({
      is_active: false,
      updated_at: new Date(),
    });

    console.log(`✅ QBO disconnected: realm=${conn.realm_id}`);
    res.json({ success: true, message: 'Disconnected from QuickBooks' });
  } catch (error) {
    console.error('❌ QBO disconnect failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/qbo/sync-invoice
 * Sync a generated invoice to QBO
 * Body: { orderIds: [1, 2, 3], orderFees: { orderId: [{name, amount}] }, invoiceNumber: 'INV-0001' }
 */
router.post('/sync-invoice', auth, requireEmployee, async (req, res) => {
  try {
    const { orderIds, orderFees, invoiceNumber } = req.body;

    if (!orderIds || !orderIds.length) {
      return res.status(400).json({ success: false, message: 'orderIds is required' });
    }
    if (!invoiceNumber) {
      return res.status(400).json({ success: false, message: 'invoiceNumber is required' });
    }

    // Fetch orders from DB
    const orders = await db('employee_orders').whereIn('id', orderIds);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    const customerName = orders[0].inquiry_company || orders[0].customer_name;

    const qboInvoice = await qboService.createInvoice({
      orders,
      orderFees: orderFees || {},
      invoiceNumber,
      customerName,
    });

    // Update last_sync_at on connection
    const conn = await getActiveConnection();
    if (conn) {
      await db('qbo_connections').where('realm_id', conn.realm_id).update({
        last_sync_at: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Invoice synced to QuickBooks',
      data: {
        qboInvoiceId: qboInvoice.Id,
        qboDocNumber: qboInvoice.DocNumber,
        totalAmt: qboInvoice.TotalAmt,
      },
    });
  } catch (error) {
    console.error('❌ QBO sync-invoice failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/qbo/sync-customer
 * Manually sync a customer to QBO
 * Body: { companyName: 'Acme Corp' }
 */
router.post('/sync-customer', auth, requireEmployee, async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'companyName is required' });
    }

    const qbCustomerId = await qboService.findOrCreateCustomer(companyName);
    res.json({
      success: true,
      message: 'Customer synced to QuickBooks',
      data: { qbCustomerId },
    });
  } catch (error) {
    console.error('❌ QBO sync-customer failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/qbo/sync-payments
 * Reverse sync: check QBO for payment status of all unpaid invoices
 * and update local order records accordingly.
 */
router.post('/sync-payments', auth, requireEmployee, async (req, res) => {
  try {
    const result = await qboService.syncPaymentStatuses();

    // Update last_sync_at
    const conn = await getActiveConnection();
    if (conn) {
      await db('qbo_connections').where('realm_id', conn.realm_id).update({
        last_sync_at: new Date(),
      });
    }

    res.json({
      success: true,
      message: `Checked ${result.checked} invoices, updated ${result.updated}`,
      data: result,
    });
  } catch (error) {
    console.error('❌ QBO sync-payments failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/qbo/sync-status/:orderId
 * Check if an order's invoice has been synced to QBO
 */
router.get('/sync-status/:orderId', auth, requireEmployee, async (req, res) => {
  try {
    const order = await db('employee_orders').where('id', req.params.orderId).first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if we have a QBO invoice for this order's invoice_number
    if (!order.invoice_number) {
      return res.json({ success: true, data: { synced: false, reason: 'no_invoice' } });
    }

    try {
      const safeName = order.invoice_number.replace(/'/g, "\\'");
      const query = `SELECT * FROM Invoice WHERE DocNumber = '${safeName}'`;
      const result = await require('../config/quickbooks').qboRequest(
        'GET', `/query?query=${encodeURIComponent(query)}`
      );
      const invoice = result?.QueryResponse?.Invoice?.[0];
      if (invoice) {
        return res.json({
          success: true,
          data: { synced: true, qboInvoiceId: invoice.Id, totalAmt: invoice.TotalAmt },
        });
      }
    } catch (qboErr) {
      // QBO not connected or query failed
    }

    res.json({ success: true, data: { synced: false } });
  } catch (error) {
    console.error('❌ QBO sync-status check failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
