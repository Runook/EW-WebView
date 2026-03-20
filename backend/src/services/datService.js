/**
 * DAT Freight Service — Authentication & RateView
 *
 * Authentication: DAT uses a two-step JWT flow:
 *   1. POST /access/v1/token/organization — Service Account credentials → Org Token
 *   2. POST /access/v1/token/user — Org Token + Individual User email → User Token
 *   3. Use User Token to call RateView, Freight Posting, Search, etc.
 *
 * Tokens expire after 30 minutes. Both are cached and auto-refreshed.
 * User tokens are cached per-email to support seat-based licensing (DAT requires
 * unique credentials per user — sharing is not permitted).
 *
 * Environment variables:
 *   DAT_SERVICE_EMAIL    — Service Account email (provisioned by DAT)
 *   DAT_SERVICE_PASSWORD — Service Account password
 *   DAT_USER_EMAIL       — Default / fallback user email (DAT One login)
 *   DAT_API_ENV          — "production" | "staging" | "nprod" (default: production)
 *
 * When credentials are not configured, returns mock data for development/testing.
 */

const axios = require('axios');

const DAT_SERVICE_EMAIL = process.env.DAT_SERVICE_EMAIL;
const DAT_SERVICE_PASSWORD = process.env.DAT_SERVICE_PASSWORD;
const DAT_USER_EMAIL = process.env.DAT_USER_EMAIL;
const DAT_API_ENV = process.env.DAT_API_ENV || 'production';

const IDENTITY_HOSTS = {
  production: 'https://identity.api.dat.com',
  staging: 'https://identity.api.staging.dat.com',
  nprod: 'https://identity.api.nprod.dat.com'
};

const POSTING_HOSTS = {
  production: 'https://freight.api.dat.com/posting',
  staging: 'https://freight.api.staging.dat.com/posting',
  nprod: 'https://freight.api.nprod.dat.com/posting'
};

const SEARCH_HOSTS = {
  production: 'https://freight.api.prod.dat.com',
  staging: 'https://freight.api.staging.dat.com',
  nprod: 'https://freight.api.nprod.dat.com'
};

const ANALYTICS_HOSTS = {
  production: 'https://freight.api.dat.com',
  staging: 'https://freight.api.staging.dat.com',
  nprod: 'https://freight.api.nprod.dat.com'
};

const IDENTITY_BASE = IDENTITY_HOSTS[DAT_API_ENV] || IDENTITY_HOSTS.production;
const POSTING_BASE = POSTING_HOSTS[DAT_API_ENV] || POSTING_HOSTS.production;
const SEARCH_BASE = SEARCH_HOSTS[DAT_API_ENV] || SEARCH_HOSTS.production;
const API_BASE = ANALYTICS_HOSTS[DAT_API_ENV] || ANALYTICS_HOSTS.production;

let orgTokenCache = { token: null, expiresAt: 0 };

// Per-user token cache: Map<datEmail, {token, expiresAt}>
const userTokenCacheMap = new Map();

function isConfigured() {
  return !!(DAT_SERVICE_EMAIL && DAT_SERVICE_PASSWORD && DAT_USER_EMAIL);
}

/**
 * Step 1: Get Organization Access Token using Service Account credentials.
 */
async function getOrgToken() {
  if (orgTokenCache.token && Date.now() < orgTokenCache.expiresAt) {
    return orgTokenCache.token;
  }

  console.log('DAT: Requesting org token...');
  const res = await axios.post(`${IDENTITY_BASE}/access/v1/token/organization`, {
    username: DAT_SERVICE_EMAIL,
    password: DAT_SERVICE_PASSWORD
  });

  const token = res.data.accessToken;
  orgTokenCache = {
    token,
    expiresAt: Date.now() + 25 * 60 * 1000
  };

  console.log('DAT: Org token obtained');
  return token;
}

/**
 * Step 2: Get Individual User Access Token.
 * Supports per-user tokens keyed by email for seat-based licensing.
 * Falls back to DAT_USER_EMAIL when no specific email is provided.
 */
async function getUserToken(datEmail) {
  const email = datEmail || DAT_USER_EMAIL;
  if (!email) {
    throw new Error('No DAT user email provided and DAT_USER_EMAIL is not set');
  }

  const cached = userTokenCacheMap.get(email);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const orgToken = await getOrgToken();

  console.log(`DAT: Requesting user token for ${email}...`);
  const res = await axios.post(
    `${IDENTITY_BASE}/access/v1/token/user`,
    { username: email },
    { headers: { Authorization: `Bearer ${orgToken}` } }
  );

  const token = res.data.accessToken;
  userTokenCacheMap.set(email, {
    token,
    expiresAt: Date.now() + 25 * 60 * 1000
  });

  console.log(`DAT: User token obtained for ${email}`);
  return token;
}

/**
 * Invalidate cached tokens for a specific user (or all users on org-level failure).
 */
function invalidateTokens(datEmail) {
  if (datEmail) {
    userTokenCacheMap.delete(datEmail);
  } else {
    orgTokenCache = { token: null, expiresAt: 0 };
    userTokenCacheMap.clear();
  }
}

/**
 * Look up a DAT email for an employee by querying the employees/users table.
 * Returns null if the employee doesn't have a DAT email configured.
 */
async function getDATEmailForEmployee(employeeId) {
  try {
    const { db } = require('../config/database');
    const row = await db('users')
      .where('id', employeeId)
      .select('dat_email')
      .first();
    return row?.dat_email || null;
  } catch {
    return null;
  }
}

/**
 * Get a user token for a specific employee, falling back to default.
 */
async function getTokenForEmployee(employeeId) {
  const datEmail = await getDATEmailForEmployee(employeeId);
  return getUserToken(datEmail);
}

/**
 * Generate mock rate data based on distance estimate from zip codes.
 */
function generateMockRate(originZip, destinationZip, weight) {
  const oPrefix = parseInt(String(originZip).substring(0, 3)) || 900;
  const dPrefix = parseInt(String(destinationZip).substring(0, 3)) || 330;
  const estimatedMiles = Math.max(Math.abs(oPrefix - dPrefix) * 5, 100);

  const baseCPM = 2.50;
  const variance = 0.3;
  const perMile = baseCPM + (Math.random() - 0.5) * variance;
  const spotRate = Math.round(estimatedMiles * perMile);
  const contractRate = Math.round(spotRate * 0.92);

  return {
    available: true,
    mock: true,
    spotRate,
    contractRate,
    low: Math.round(spotRate * 0.85),
    high: Math.round(spotRate * 1.15),
    average: spotRate,
    perMile: Math.round(perMile * 100) / 100,
    mileage: estimatedMiles,
    message: 'Mock data — DAT API credentials not configured'
  };
}

/**
 * Look up DAT freight rates for a given lane.
 *
 * @param {Object} params
 * @param {string} params.originZip
 * @param {string} params.destinationZip
 * @param {string} [params.equipmentType='V'] - V=Van, F=Flatbed, R=Reefer
 * @param {number} [params.weight]
 * @returns {Object} Rate data
 */
async function rateLookup({ originZip, destinationZip, equipmentType = 'V', weight }) {
  if (!isConfigured()) {
    console.log('⚠️ DAT: Not configured, returning mock data');
    return generateMockRate(originZip, destinationZip, weight);
  }

  try {
    const token = await getUserToken();

    const res = await axios.post(
      `${API_BASE}/analytics/rateview/v2/rates`,
      {
        lane: {
          origin: { zip5: String(originZip).padStart(5, '0') },
          destination: { zip5: String(destinationZip).padStart(5, '0') }
        },
        equipmentType: equipmentType,
        rateType: 'SPOT'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = res.data;
    const rate = data.rate || data;

    return {
      available: true,
      mock: false,
      spotRate: rate.spotRate?.perTrip || rate.perTrip || null,
      contractRate: rate.contractRate?.perTrip || null,
      low: rate.spotRate?.lowRate || rate.lowRate || null,
      high: rate.spotRate?.highRate || rate.highRate || null,
      average: rate.spotRate?.perTrip || rate.averageRate || null,
      perMile: rate.spotRate?.perMile || rate.ratePerMile || null,
      mileage: rate.mileage || data.mileage || null,
      rawResponse: data
    };
  } catch (error) {
    if (error.response?.status === 401) {
      invalidateTokens();
    }

    console.error('DAT rate lookup failed:', error.response?.status, error.response?.data || error.message);
    console.log('DAT: Falling back to mock data');
    return generateMockRate(originZip, destinationZip, weight);
  }
}

/**
 * Batch rate lookup for multiple lanes.
 */
async function batchRateLookup(lanes) {
  const results = await Promise.allSettled(
    lanes.map(lane => rateLookup(lane))
  );

  return results.map((result, i) => ({
    lane: lanes[i],
    ...(result.status === 'fulfilled' ? result.value : { available: false, message: result.reason?.message })
  }));
}

/**
 * Test DAT API connectivity.
 */
async function testConnection() {
  if (!isConfigured()) {
    return { connected: false, mock: true, message: 'DAT credentials not configured — using mock mode' };
  }

  try {
    await getUserToken();
    return { connected: true, mock: false, message: 'DAT API connected successfully' };
  } catch (error) {
    return {
      connected: false,
      mock: false,
      message: `DAT connection failed: ${error.response?.data?.errors?.[0]?.message || error.message}`
    };
  }
}

module.exports = {
  rateLookup,
  batchRateLookup,
  testConnection,
  isConfigured,
  getUserToken,
  getTokenForEmployee,
  getDATEmailForEmployee,
  invalidateTokens,
  IDENTITY_BASE,
  POSTING_BASE,
  SEARCH_BASE,
  API_BASE,
  getDATToken: getUserToken
};
