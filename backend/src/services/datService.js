/**
 * DAT Freight Rate Service
 *
 * Authentication: DAT uses a two-step JWT flow:
 *   1. POST /access/v1/token/organization — Service Account credentials → Org Token
 *   2. POST /access/v1/token/user — Org Token + Individual User email → User Token
 *   3. Use User Token to call RateView and other DAT APIs
 *
 * Tokens expire after 30 minutes. Both are cached and auto-refreshed.
 *
 * Environment variables:
 *   DAT_SERVICE_EMAIL    — Service Account email (provisioned by DAT)
 *   DAT_SERVICE_PASSWORD — Service Account password
 *   DAT_USER_EMAIL       — Individual user email (DAT One login)
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

const API_HOSTS = {
  production: 'https://freight.api.dat.com',
  staging: 'https://freight.api.staging.dat.com',
  nprod: 'https://freight.api.nprod.dat.com'
};

const IDENTITY_BASE = IDENTITY_HOSTS[DAT_API_ENV] || IDENTITY_HOSTS.production;
const API_BASE = API_HOSTS[DAT_API_ENV] || API_HOSTS.production;

let orgTokenCache = { token: null, expiresAt: 0 };
let userTokenCache = { token: null, expiresAt: 0 };

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

  console.log('🔑 DAT: Requesting org token...');
  const res = await axios.post(`${IDENTITY_BASE}/access/v1/token/organization`, {
    username: DAT_SERVICE_EMAIL,
    password: DAT_SERVICE_PASSWORD
  });

  const token = res.data.accessToken;
  orgTokenCache = {
    token,
    expiresAt: Date.now() + 25 * 60 * 1000 // 25 min (tokens expire at 30)
  };

  console.log('✅ DAT: Org token obtained');
  return token;
}

/**
 * Step 2: Get Individual User Access Token using Org Token + user email.
 */
async function getUserToken() {
  if (userTokenCache.token && Date.now() < userTokenCache.expiresAt) {
    return userTokenCache.token;
  }

  const orgToken = await getOrgToken();

  console.log('🔑 DAT: Requesting user token...');
  const res = await axios.post(
    `${IDENTITY_BASE}/access/v1/token/user`,
    { username: DAT_USER_EMAIL },
    { headers: { Authorization: `Bearer ${orgToken}` } }
  );

  const token = res.data.accessToken;
  userTokenCache = {
    token,
    expiresAt: Date.now() + 25 * 60 * 1000
  };

  console.log('✅ DAT: User token obtained');
  return token;
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
      orgTokenCache = { token: null, expiresAt: 0 };
      userTokenCache = { token: null, expiresAt: 0 };
    }

    console.error('❌ DAT rate lookup failed:', error.response?.status, error.response?.data || error.message);

    // Fallback to mock when API fails
    console.log('⚠️ DAT: Falling back to mock data');
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
  getDATToken: getUserToken
};
