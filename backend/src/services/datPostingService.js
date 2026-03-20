/**
 * DAT Freight Posting Service
 *
 * Server: https://freight.api.dat.com/posting  (production)
 *         https://freight.api.nprod.dat.com/posting  (nprod/testing)
 *
 * Endpoints:
 *   POST   /v2/loads              — Create load post
 *   PATCH  /v2/loads/{id}         — Update load post
 *   POST   /v2/loads/{id}/refresh — Refresh (15-min minimum interval, 100 req/min)
 *   DELETE /v2/loads              — Delete load post (by id or referenceId query param)
 *   POST   /v2/trucks             — Create truck post
 *   PATCH  /v2/trucks/{id}        — Update truck post
 *   POST   /v2/trucks/{id}/refresh
 *   DELETE /v2/trucks/{id}        — Delete truck post
 *
 * Certification constraints:
 *   - Never bulk-delete and re-post to "refresh"
 *   - Never create duplicate posts
 *   - Delete individual posts only
 */

const axios = require('axios');
const datService = require('./datService');
const { mapToDATEquipmentCode } = require('./datEquipmentTypes');
const { db } = require('../config/database');

// ─── Load Posts ──────────────────────────────────────────────────────

async function createLoadPost(employeeId, loadData) {
  const token = await datService.getTokenForEmployee(employeeId);
  const equipmentCode = mapToDATEquipmentCode(loadData.equipmentType || loadData.truckType);
  const payload = buildLoadPayload(loadData, equipmentCode);

  const res = await postingRequest('POST', '/v2/loads', payload, token);
  const datPostId = res.data.id;

  await db('dat_posts').insert({
    dat_post_id: String(datPostId),
    post_type: 'load',
    local_post_id: loadData.localPostId || null,
    employee_order_id: loadData.employeeOrderId || null,
    employee_id: employeeId,
    dat_equipment_type: equipmentCode,
    dat_payload: JSON.stringify(payload),
    status: 'active',
  });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function updateLoadPost(employeeId, datPostId, loadData) {
  const token = await datService.getTokenForEmployee(employeeId);
  const equipmentCode = mapToDATEquipmentCode(loadData.equipmentType || loadData.truckType);
  const payload = buildLoadPayload(loadData, equipmentCode);

  const res = await postingRequest('PATCH', `/v2/loads/${datPostId}`, payload, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ dat_payload: JSON.stringify(payload), dat_equipment_type: equipmentCode, updated_at: db.fn.now() });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function refreshLoadPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);
  const res = await postingRequest('POST', `/v2/loads/${datPostId}/refresh`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ status: 'active', last_refreshed_at: db.fn.now(), updated_at: db.fn.now() });

  return { datPostId: String(datPostId), response: res.data };
}

async function deleteLoadPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);
  await postingRequest('DELETE', `/v2/loads?id=${encodeURIComponent(datPostId)}`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ status: 'deleted', updated_at: db.fn.now() });

  return { datPostId: String(datPostId), deleted: true };
}

// ─── Truck Posts ─────────────────────────────────────────────────────

async function createTruckPost(employeeId, truckData) {
  const token = await datService.getTokenForEmployee(employeeId);
  const equipmentCode = mapToDATEquipmentCode(truckData.equipmentType || truckData.truckType);
  const payload = buildTruckPayload(truckData, equipmentCode);

  const res = await postingRequest('POST', '/v2/trucks', payload, token);
  const datPostId = res.data.id;

  await db('dat_posts').insert({
    dat_post_id: String(datPostId),
    post_type: 'truck',
    local_post_id: truckData.localPostId || null,
    employee_order_id: null,
    employee_id: employeeId,
    dat_equipment_type: equipmentCode,
    dat_payload: JSON.stringify(payload),
    status: 'active',
  });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function updateTruckPost(employeeId, datPostId, truckData) {
  const token = await datService.getTokenForEmployee(employeeId);
  const equipmentCode = mapToDATEquipmentCode(truckData.equipmentType || truckData.truckType);
  const payload = buildTruckPayload(truckData, equipmentCode);

  const res = await postingRequest('PATCH', `/v2/trucks/${datPostId}`, payload, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ dat_payload: JSON.stringify(payload), dat_equipment_type: equipmentCode, updated_at: db.fn.now() });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function refreshTruckPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);
  const res = await postingRequest('POST', `/v2/trucks/${datPostId}/refresh`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ status: 'active', last_refreshed_at: db.fn.now(), updated_at: db.fn.now() });

  return { datPostId: String(datPostId), response: res.data };
}

async function deleteTruckPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);
  await postingRequest('DELETE', `/v2/trucks/${datPostId}`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({ status: 'deleted', updated_at: db.fn.now() });

  return { datPostId: String(datPostId), deleted: true };
}

// ─── Auto-delete on order match ──────────────────────────────────────

async function deletePostsForOrder(employeeId, employeeOrderId) {
  const activePosts = await db('dat_posts')
    .where('employee_order_id', employeeOrderId)
    .where('status', 'active');

  const results = [];
  for (const post of activePosts) {
    try {
      if (post.post_type === 'load') {
        await deleteLoadPost(employeeId, post.dat_post_id);
      } else {
        await deleteTruckPost(employeeId, post.dat_post_id);
      }
      await db('dat_posts').where('id', post.id).update({ status: 'matched', updated_at: db.fn.now() });
      results.push({ datPostId: post.dat_post_id, status: 'matched' });
    } catch (error) {
      console.error(`DAT: Failed to delete post ${post.dat_post_id} for order ${employeeOrderId}:`, error.message);
      results.push({ datPostId: post.dat_post_id, status: 'error', error: error.message });
    }
  }
  return results;
}

// ─── Payload Builders (DAT official spec) ────────────────────────────

function buildLoadPayload(data, equipmentCode) {
  const payload = {
    freight: {
      equipmentType: equipmentCode,
      fullPartial: data.fullPartial || 'FULL',
    },
    lane: {
      origin: buildLocation(data.originZip, data.originCity, data.originState),
      destination: buildLocation(data.destinationZip, data.destinationCity, data.destinationState),
    },
    exposure: {},
  };

  if (data.weight) payload.freight.weightPounds = parseInt(data.weight) || undefined;
  if (data.length) payload.freight.lengthFeet = parseInt(data.length) || undefined;
  if (data.commodity) {
    payload.freight.commodity = { details: data.commodity };
  }
  if (data.comment) {
    payload.freight.comments = [{ comment: data.comment }];
  }
  if (data.pickupHours) payload.freight.pickupHours = data.pickupHours;
  if (data.dropOffHours) payload.freight.dropOffHours = data.dropOffHours;

  if (data.pickupDate || data.earliestAvailabilityWhen) {
    payload.exposure.earliestAvailabilityWhen = toISODate(data.pickupDate || data.earliestAvailabilityWhen);
  }
  if (data.deliveryDate || data.latestAvailabilityWhen) {
    payload.exposure.latestAvailabilityWhen = toISODate(data.deliveryDate || data.latestAvailabilityWhen);
  }

  if (data.referenceId || data.referenceNumber) {
    payload.referenceId = data.referenceId || data.referenceNumber;
  }

  return payload;
}

function buildTruckPayload(data, equipmentCode) {
  const payload = {
    freight: {
      equipmentType: equipmentCode,
    },
    lane: {
      origin: buildLocation(data.originZip, data.originCity, data.originState),
      destination: buildLocation(data.destinationZip, data.destinationCity, data.destinationState),
    },
    exposure: {},
  };

  if (data.capacity) payload.freight.weightPounds = parseInt(data.capacity) || undefined;
  if (data.length) payload.freight.lengthFeet = parseInt(data.length) || undefined;
  if (data.comment) {
    payload.freight.comments = [{ comment: data.comment }];
  }

  if (data.availableDate || data.earliestAvailabilityWhen) {
    payload.exposure.earliestAvailabilityWhen = toISODate(data.availableDate || data.earliestAvailabilityWhen);
  }
  if (data.latestAvailabilityWhen) {
    payload.exposure.latestAvailabilityWhen = toISODate(data.latestAvailabilityWhen);
  }

  return payload;
}

function buildLocation(zip, city, state) {
  const loc = {};
  if (zip) {
    loc.postalCode = String(zip).padStart(5, '0');
  } else if (city && state) {
    loc.city = city;
    loc.stateProv = state;
  }
  return loc;
}

function toISODate(val) {
  if (!val) return undefined;
  if (typeof val === 'string' && val.includes('T')) return val;
  return new Date(val).toISOString();
}

// ─── HTTP Helper (uses POSTING_BASE) ─────────────────────────────────

async function postingRequest(method, path, data, token) {
  try {
    const config = {
      method,
      url: `${datService.POSTING_BASE}${path}`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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
    const wrapped = new Error(`DAT Posting API ${method} ${path}: ${msg}`);
    wrapped.statusCode = error.response?.status;
    wrapped.datErrors = error.response?.data;
    throw wrapped;
  }
}

module.exports = {
  createLoadPost,
  updateLoadPost,
  refreshLoadPost,
  deleteLoadPost,
  createTruckPost,
  updateTruckPost,
  refreshTruckPost,
  deleteTruckPost,
  deletePostsForOrder,
};
