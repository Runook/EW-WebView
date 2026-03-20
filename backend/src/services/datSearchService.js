/**
 * DAT Freight Search Service (Search v4 — "Search Freight Marketplaces")
 *
 * Server: https://freight.api.prod.dat.com  (production)
 *         https://freight.api.nprod.dat.com  (nprod/testing)
 *
 * Endpoints:
 *   POST /marketplaces/v1/loads/search      — Search for load postings
 *   GET  /marketplaces/v1/loads/search/{id}  — Get load details
 *   POST /marketplaces/v1/equipment/search  — Search for truck/equipment postings
 *   GET  /marketplaces/v1/equipment/search/{id} — Get equipment details
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
  const payload = buildLoadSearchPayload(criteria);

  const res = await searchRequest('POST', '/marketplaces/v1/loads/search', payload, token);

  return {
    results: normalizeLoadResults(res.data),
    total: res.data.totalMatchCount || res.data.matches?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

async function searchTrucks(employeeId, criteria = {}) {
  const token = await datService.getTokenForEmployee(employeeId);
  const payload = buildEquipmentSearchPayload(criteria);

  const res = await searchRequest('POST', '/marketplaces/v1/equipment/search', payload, token);

  return {
    results: normalizeEquipmentResults(res.data),
    total: res.data.totalMatchCount || res.data.matches?.length || 0,
    source: 'DAT',
    rawResponse: res.data,
  };
}

// ─── Payload Builders ────────────────────────────────────────────────

function buildLoadSearchPayload(criteria) {
  const payload = {
    criteria: {
      lane: {},
    },
  };

  if (criteria.originZip || criteria.originCity) {
    payload.criteria.lane.origin = buildSearchLocation(criteria, 'origin');
  }
  if (criteria.destinationZip || criteria.destinationCity) {
    payload.criteria.lane.destination = buildSearchLocation(criteria, 'destination');
  }

  if (criteria.equipmentType) {
    payload.criteria.equipmentClasses = [mapToDATEquipmentCode(criteria.equipmentType)];
  }

  if (criteria.fullPartial) {
    payload.criteria.fullPartial = criteria.fullPartial;
  }

  return payload;
}

function buildEquipmentSearchPayload(criteria) {
  const payload = {
    criteria: {
      lane: {},
    },
  };

  if (criteria.originZip || criteria.originCity) {
    payload.criteria.lane.origin = buildSearchLocation(criteria, 'origin');
  }
  if (criteria.destinationZip || criteria.destinationCity) {
    payload.criteria.lane.destination = buildSearchLocation(criteria, 'destination');
  }

  if (criteria.equipmentType) {
    payload.criteria.equipmentClasses = [mapToDATEquipmentCode(criteria.equipmentType)];
  }

  return payload;
}

function buildSearchLocation(criteria, prefix) {
  const loc = {};
  const zip = criteria[`${prefix}Zip`];
  const city = criteria[`${prefix}City`];
  const state = criteria[`${prefix}State`];
  const radius = criteria[`${prefix}Radius`];

  if (zip) {
    loc.postalCode = String(zip).padStart(5, '0');
  } else if (city && state) {
    loc.city = city;
    loc.stateProv = state;
  }

  if (radius) {
    loc.radiusMiles = parseInt(radius) || 100;
  }

  return loc;
}

// ─── Result Normalizers ──────────────────────────────────────────────

function normalizeLoadResults(data) {
  const items = data.matches || data.results || [];
  return items.map(item => {
    const posting = item.posting || item;
    const lane = posting.lane || {};
    const freight = posting.freight || {};
    const exposure = posting.exposure || {};
    const poster = posting.posterInfo || {};

    return {
      datId: posting.id || item.matchId || item.resultId,
      type: 'load',
      origin: lane.origin || {},
      destination: lane.destination || {},
      equipmentType: freight.equipmentType || null,
      equipmentName: freight.equipmentName || null,
      fullPartial: freight.fullPartial || null,
      weight: freight.weightPounds || null,
      length: freight.lengthFeet || null,
      pickupDate: exposure.earliestAvailabilityWhen || null,
      deliveryDate: exposure.latestAvailabilityWhen || null,
      age: item.age || item.ageMinutes || null,
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

function normalizeEquipmentResults(data) {
  const items = data.matches || data.results || [];
  return items.map(item => {
    const posting = item.posting || item;
    const lane = posting.lane || {};
    const freight = posting.freight || posting.equipment || {};
    const exposure = posting.exposure || {};
    const poster = posting.posterInfo || {};

    return {
      datId: posting.id || item.matchId || item.resultId,
      type: 'truck',
      origin: lane.origin || {},
      destination: lane.destination || {},
      equipmentType: freight.equipmentType || null,
      equipmentName: freight.equipmentName || null,
      weight: freight.weightPounds || null,
      length: freight.lengthFeet || null,
      availableDate: exposure.earliestAvailabilityWhen || null,
      age: item.age || item.ageMinutes || null,
      company: poster.company?.name || null,
      contact: poster.contactMethods?.[0]?.value || null,
      comment: freight.comments?.[0]?.comment || null,
      source: 'DAT',
      raw: item,
    };
  });
}

// ─── HTTP Helper (uses SEARCH_BASE) ──────────────────────────────────

async function searchRequest(method, path, data, token) {
  try {
    const config = {
      method,
      url: `${datService.SEARCH_BASE}${path}`,
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
