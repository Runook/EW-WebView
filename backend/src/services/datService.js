const axios = require('axios');

const DAT_API_BASE = process.env.DAT_API_BASE_URL || 'https://api.dat.com';
const DAT_CLIENT_ID = process.env.DAT_CLIENT_ID;
const DAT_CLIENT_SECRET = process.env.DAT_CLIENT_SECRET;
const DAT_USERNAME = process.env.DAT_USERNAME;
const DAT_PASSWORD = process.env.DAT_PASSWORD;

let datTokenCache = { token: null, expiresAt: 0 };

/**
 * Authenticate with DAT API and cache the token.
 */
async function getDATToken() {
  if (datTokenCache.token && Date.now() < datTokenCache.expiresAt) {
    return datTokenCache.token;
  }

  const res = await axios.post(`${DAT_API_BASE}/oauth/token`, {
    grant_type: 'client_credentials',
    client_id: DAT_CLIENT_ID,
    client_secret: DAT_CLIENT_SECRET,
    username: DAT_USERNAME,
    password: DAT_PASSWORD
  });

  datTokenCache = {
    token: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in - 300) * 1000
  };

  return datTokenCache.token;
}

/**
 * Look up DAT freight rates for a given lane.
 *
 * @param {Object} params
 * @param {string} params.originZip - Origin zip code
 * @param {string} params.destinationZip - Destination zip code
 * @param {string} [params.equipmentType='V'] - V=Van, F=Flatbed, R=Reefer
 * @param {number} [params.weight] - Shipment weight in lbs
 * @returns {Object} Rate data with spot, contract, and range values
 */
async function rateLookup({ originZip, destinationZip, equipmentType = 'V', weight }) {
  if (!DAT_CLIENT_ID || !DAT_CLIENT_SECRET) {
    return {
      available: false,
      message: 'DAT API credentials not configured. Set DAT_CLIENT_ID and DAT_CLIENT_SECRET environment variables.',
      fallback: true
    };
  }

  try {
    const token = await getDATToken();

    const res = await axios.get(`${DAT_API_BASE}/rateview/rates`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        origin_zip: originZip,
        destination_zip: destinationZip,
        equipment_type: equipmentType,
        weight: weight || undefined
      }
    });

    const data = res.data;

    return {
      available: true,
      spotRate: data.spot_rate || data.rate?.spot || null,
      contractRate: data.contract_rate || data.rate?.contract || null,
      low: data.low || data.range?.low || null,
      high: data.high || data.range?.high || null,
      average: data.average || data.rate?.average || null,
      perMile: data.per_mile || data.rate?.per_mile || null,
      mileage: data.mileage || null,
      rawResponse: data
    };
  } catch (error) {
    if (error.response?.status === 401) {
      datTokenCache = { token: null, expiresAt: 0 };
    }

    console.error('DAT rate lookup failed:', error.message);
    return {
      available: false,
      message: `DAT API error: ${error.response?.data?.message || error.message}`,
      fallback: true
    };
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

module.exports = {
  rateLookup,
  batchRateLookup,
  getDATToken
};
