/**
 * DAT Freight Search Service
 *
 * Endpoints (base: https://freight.api.dat.com):
 *   POST /search/v2/loads   — Search loads on DAT load board
 *   POST /search/v2/trucks  — Search trucks on DAT load board
 *
 * Certification constraints:
 *   - Searches MUST originate from real-time user requests only
 *   - Auto-generated / scheduled searches are NOT permitted
 *   - Do NOT use for large-set data analysis
 *   - All results must be clearly attributed to DAT
 */

const axios = require('axios');
const datService = require('./datService');
const { mapToDATEquipmentCode } = require('./datEquipmentTypes');

async function searchLoads(employeeId, criteria = {}) {
  const token = await datService.getTokenForEmployee(employeeId);
  const payload = buildSearchPayload(criteria);

  const res = await datApiRequest('POST', '/search/v2/loads', payload, token);

  return {
    results: normalizeSearchResults(res.data, 'load'),
    total: res.data.totalCount || res.data.matches?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

async function searchTrucks(employeeId, criteria = {}) {
  const token = await datService.getTokenForEmployee(employeeId);
  const payload = buildSearchPayload(criteria);

  const res = await datApiRequest('POST', '/search/v2/trucks', payload, token);

  return {
    results: normalizeSearchResults(res.data, 'truck'),
    total: res.data.totalCount || res.data.matches?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

function buildSearchPayload(criteria) {
  const payload = { lane: {} };

  if (criteria.originZip || criteria.originCity) {
    payload.lane.origin = {};
    if (criteria.originZip) {
      payload.lane.origin.postalCode = String(criteria.originZip).padStart(5, '0');
    } else {
      if (criteria.originCity) payload.lane.origin.city = criteria.originCity;
      if (criteria.originState) payload.lane.origin.stateProv = criteria.originState;
    }
    if (criteria.originRadius) {
      payload.lane.origin.radiusMiles = parseInt(criteria.originRadius) || 100;
    }
  }

  if (criteria.destinationZip || criteria.destinationCity) {
    payload.lane.destination = {};
    if (criteria.destinationZip) {
      payload.lane.destination.postalCode = String(criteria.destinationZip).padStart(5, '0');
    } else {
      if (criteria.destinationCity) payload.lane.destination.city = criteria.destinationCity;
      if (criteria.destinationState) payload.lane.destination.stateProv = criteria.destinationState;
    }
    if (criteria.destinationRadius) {
      payload.lane.destination.radiusMiles = parseInt(criteria.destinationRadius) || 100;
    }
  }

  if (criteria.equipmentType) {
    payload.freight = { equipmentType: mapToDATEquipmentCode(criteria.equipmentType) };
  }

  if (criteria.limit) {
    payload.limit = Math.min(parseInt(criteria.limit), 250);
  }

  return payload;
}

function normalizeSearchResults(data, type) {
  const items = data.matches || data.results || data.loads || data.trucks || [];
  return items.map(item => {
    const posting = item.posting || item;
    const lane = posting.lane || {};
    const freight = posting.freight || {};
    const exposure = posting.exposure || {};
    const poster = posting.posterInfo || {};

    return {
      datId: posting.id || item.id,
      type,
      origin: lane.origin || {},
      destination: lane.destination || {},
      equipmentType: freight.equipmentType || null,
      equipmentName: freight.equipmentName || null,
      fullPartial: freight.fullPartial || null,
      rate: item.rate || null,
      weight: freight.weightPounds || null,
      length: freight.lengthFeet || null,
      pickupDate: exposure.earliestAvailabilityWhen || null,
      deliveryDate: exposure.latestAvailabilityWhen || null,
      age: item.age || null,
      company: poster.company?.name || null,
      contact: poster.contactMethods?.[0]?.value || null,
      commodity: freight.commodity?.details || null,
      comment: freight.comments?.[0]?.comment || null,
      referenceId: posting.referenceId || null,
      tripMiles: posting.tripLength?.miles || null,
      source: 'DAT',
      raw: item,
    };
  });
}

async function datApiRequest(method, path, data, token) {
  try {
    const config = {
      method,
      url: `${datService.API_BASE}${path}`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    return await axios(config);
  } catch (error) {
    if (error.response?.status === 401) {
      datService.invalidateTokens();
    }
    const msg = error.response?.data?.errors?.[0]?.message
      || error.response?.data?.message
      || error.message;
    const wrapped = new Error(`DAT Search API ${method} ${path}: ${msg}`);
    wrapped.statusCode = error.response?.status;
    wrapped.datErrors = error.response?.data;
    throw wrapped;
  }
}

module.exports = {
  searchLoads,
  searchTrucks,
};
