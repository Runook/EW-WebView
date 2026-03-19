/**
 * DAT Freight Search Service
 *
 * Wraps the DAT Freight Search API v2 to search loads and trucks on the
 * DAT load board.
 *
 * IMPORTANT constraints from DAT certification:
 *  - Searches MUST originate from real-time user requests only.
 *  - Auto-generated / scheduled / automated searches are NOT permitted.
 *  - Do NOT use searches for large-set data analysis.
 *  - All results must be clearly attributed to the DAT load board.
 */

const axios = require('axios');
const datService = require('./datService');
const { mapToDATEquipmentCode } = require('./datEquipmentTypes');

/**
 * Search for loads on the DAT load board.
 *
 * @param {number} employeeId - The employee performing the search
 * @param {Object} criteria
 * @param {string} [criteria.originZip]
 * @param {string} [criteria.originCity]
 * @param {string} [criteria.originState]
 * @param {number} [criteria.originRadius] - miles
 * @param {string} [criteria.destinationZip]
 * @param {string} [criteria.destinationCity]
 * @param {string} [criteria.destinationState]
 * @param {number} [criteria.destinationRadius]
 * @param {string} [criteria.equipmentType] - EW or DAT code
 * @param {number} [criteria.limit]
 * @returns {Object} { results, source: 'DAT' }
 */
async function searchLoads(employeeId, criteria = {}) {
  const token = await datService.getTokenForEmployee(employeeId);
  const payload = buildSearchPayload(criteria);

  const res = await datApiRequest('POST', '/search/v2/loads', payload, token);

  return {
    results: normalizeSearchResults(res.data, 'load'),
    total: res.data.totalCount || res.data.results?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

/**
 * Search for trucks on the DAT load board.
 *
 * @param {number} employeeId
 * @param {Object} criteria - same shape as searchLoads
 * @returns {Object} { results, source: 'DAT' }
 */
async function searchTrucks(employeeId, criteria = {}) {
  const token = await datService.getTokenForEmployee(employeeId);
  const payload = buildSearchPayload(criteria);

  const res = await datApiRequest('POST', '/search/v2/trucks', payload, token);

  return {
    results: normalizeSearchResults(res.data, 'truck'),
    total: res.data.totalCount || res.data.results?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

// ─── Payload Builder ─────────────────────────────────────────────────

function buildSearchPayload(criteria) {
  const payload = {};

  // Origin
  if (criteria.originZip || criteria.originCity) {
    payload.origin = {};
    if (criteria.originZip) {
      payload.origin.postalCode = String(criteria.originZip).padStart(5, '0');
    } else {
      if (criteria.originCity) payload.origin.city = criteria.originCity;
      if (criteria.originState) payload.origin.stateProvince = criteria.originState;
    }
    if (criteria.originRadius) payload.origin.radius = criteria.originRadius;
  }

  // Destination
  if (criteria.destinationZip || criteria.destinationCity) {
    payload.destination = {};
    if (criteria.destinationZip) {
      payload.destination.postalCode = String(criteria.destinationZip).padStart(5, '0');
    } else {
      if (criteria.destinationCity) payload.destination.city = criteria.destinationCity;
      if (criteria.destinationState) payload.destination.stateProvince = criteria.destinationState;
    }
    if (criteria.destinationRadius) payload.destination.radius = criteria.destinationRadius;
  }

  if (criteria.equipmentType) {
    payload.equipmentType = mapToDATEquipmentCode(criteria.equipmentType);
  }

  if (criteria.limit) {
    payload.limit = Math.min(criteria.limit, 250);
  }

  return payload;
}

// ─── Result Normalizer ───────────────────────────────────────────────

function normalizeSearchResults(data, type) {
  const items = data.results || data.loads || data.trucks || data.items || [];
  return items.map(item => ({
    datId: item.id || item.postId,
    type,
    origin: item.origin || {},
    destination: item.destination || {},
    equipmentType: item.equipmentType,
    rate: item.rate || null,
    weight: item.weight || null,
    length: item.length || null,
    pickupDate: item.earliestAvailability || item.pickupDate || null,
    deliveryDate: item.latestAvailability || item.deliveryDate || null,
    age: item.age || null,
    company: item.company || item.posterCompanyName || null,
    contact: item.contact || item.posterContact || null,
    commodity: item.commodity || null,
    comment: item.comment || null,
    source: 'DAT',
    raw: item,
  }));
}

// ─── HTTP Helper ─────────────────────────────────────────────────────

async function datApiRequest(method, path, data, token) {
  try {
    const config = {
      method,
      url: `${datService.API_BASE}${path}`,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    return await axios(config);
  } catch (error) {
    if (error.response?.status === 401) {
      datService.invalidateTokens();
    }
    const msg = error.response?.data?.message
      || error.response?.data?.errors?.[0]?.message
      || error.message;
    const wrapped = new Error(`DAT Search API ${method} ${path} failed: ${msg}`);
    wrapped.statusCode = error.response?.status;
    wrapped.datErrors = error.response?.data;
    throw wrapped;
  }
}

module.exports = {
  searchLoads,
  searchTrucks,
};
