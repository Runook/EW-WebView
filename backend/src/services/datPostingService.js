/**
 * DAT Freight Posting Service
 *
 * Wraps the DAT Freight Posting API v2 to create, update, refresh and delete
 * load and truck posts on the DAT load board.
 *
 * Every mutation is tracked in the local `dat_posts` table so the app knows
 * which DAT posts belong to which employee / order.
 *
 * IMPORTANT constraints from DAT certification:
 *  - Never bulk-delete and re-post to "refresh" — use the refresh endpoint.
 *  - Never create duplicates — update the existing post instead.
 *  - Delete individual posts, never mass-delete unless absolutely necessary.
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

  const res = await datApiRequest('POST', '/posting/v2/loads', payload, token);

  const datPostId = res.data.id || res.data.postId || res.data.loadPostId;

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

  const res = await datApiRequest('PUT', `/posting/v2/loads/${datPostId}`, payload, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      dat_payload: JSON.stringify(payload),
      dat_equipment_type: equipmentCode,
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function refreshLoadPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);

  const res = await datApiRequest('POST', `/posting/v2/loads/${datPostId}/refresh`, {}, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      status: 'active',
      last_refreshed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), response: res.data };
}

async function deleteLoadPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);

  await datApiRequest('DELETE', `/posting/v2/loads/${datPostId}`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      status: 'deleted',
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), deleted: true };
}

// ─── Truck Posts ─────────────────────────────────────────────────────

async function createTruckPost(employeeId, truckData) {
  const token = await datService.getTokenForEmployee(employeeId);
  const equipmentCode = mapToDATEquipmentCode(truckData.equipmentType || truckData.truckType);

  const payload = buildTruckPayload(truckData, equipmentCode);

  const res = await datApiRequest('POST', '/posting/v2/trucks', payload, token);

  const datPostId = res.data.id || res.data.postId || res.data.truckPostId;

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

  const res = await datApiRequest('PUT', `/posting/v2/trucks/${datPostId}`, payload, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      dat_payload: JSON.stringify(payload),
      dat_equipment_type: equipmentCode,
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), payload, response: res.data };
}

async function refreshTruckPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);

  const res = await datApiRequest('POST', `/posting/v2/trucks/${datPostId}/refresh`, {}, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      status: 'active',
      last_refreshed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), response: res.data };
}

async function deleteTruckPost(employeeId, datPostId) {
  const token = await datService.getTokenForEmployee(employeeId);

  await datApiRequest('DELETE', `/posting/v2/trucks/${datPostId}`, null, token);

  await db('dat_posts')
    .where('dat_post_id', String(datPostId))
    .update({
      status: 'deleted',
      updated_at: db.fn.now(),
    });

  return { datPostId: String(datPostId), deleted: true };
}

// ─── Auto-delete on order match ──────────────────────────────────────

/**
 * Delete all active DAT posts linked to a confirmed/matched employee order.
 * Called from the order confirmation flow.
 */
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

      await db('dat_posts')
        .where('id', post.id)
        .update({ status: 'matched', updated_at: db.fn.now() });

      results.push({ datPostId: post.dat_post_id, status: 'matched' });
    } catch (error) {
      console.error(`DAT: Failed to delete post ${post.dat_post_id} for order ${employeeOrderId}:`, error.message);
      results.push({ datPostId: post.dat_post_id, status: 'error', error: error.message });
    }
  }

  return results;
}

// ─── Payload Builders ────────────────────────────────────────────────

function buildLoadPayload(data, equipmentCode) {
  const payload = {
    equipmentType: equipmentCode,
    origin: {},
    destination: {},
  };

  if (data.originZip) {
    payload.origin.postalCode = String(data.originZip).padStart(5, '0');
  } else if (data.originCity && data.originState) {
    payload.origin.city = data.originCity;
    payload.origin.stateProvince = data.originState;
  } else if (data.origin) {
    payload.origin.open = data.origin;
  }

  if (data.destinationZip) {
    payload.destination.postalCode = String(data.destinationZip).padStart(5, '0');
  } else if (data.destinationCity && data.destinationState) {
    payload.destination.city = data.destinationCity;
    payload.destination.stateProvince = data.destinationState;
  } else if (data.destination) {
    payload.destination.open = data.destination;
  }

  if (data.pickupDate || data.earliestPickupDate) {
    payload.earliestAvailability = data.pickupDate || data.earliestPickupDate;
  }
  if (data.deliveryDate || data.latestAvailability) {
    payload.latestAvailability = data.deliveryDate || data.latestAvailability;
  }

  if (data.weight) payload.weight = parseFloat(data.weight) || undefined;
  if (data.length) payload.length = parseFloat(data.length) || undefined;
  if (data.rate) payload.rate = parseFloat(data.rate) || undefined;
  if (data.commodity) payload.commodity = data.commodity;
  if (data.comment) payload.comment = data.comment;
  if (data.referenceNumber) payload.referenceNumber = data.referenceNumber;

  return payload;
}

function buildTruckPayload(data, equipmentCode) {
  const payload = {
    equipmentType: equipmentCode,
    origin: {},
    destination: {},
  };

  if (data.originZip) {
    payload.origin.postalCode = String(data.originZip).padStart(5, '0');
  } else if (data.currentLocation) {
    payload.origin.open = data.currentLocation;
  } else if (data.originCity && data.originState) {
    payload.origin.city = data.originCity;
    payload.origin.stateProvince = data.originState;
  }

  if (data.destinationZip) {
    payload.destination.postalCode = String(data.destinationZip).padStart(5, '0');
  } else if (data.preferredDestination) {
    payload.destination.open = data.preferredDestination;
  } else if (data.destinationCity && data.destinationState) {
    payload.destination.city = data.destinationCity;
    payload.destination.stateProvince = data.destinationState;
  }

  if (data.availableDate || data.earliestAvailability) {
    payload.earliestAvailability = data.availableDate || data.earliestAvailability;
  }
  if (data.latestAvailability) {
    payload.latestAvailability = data.latestAvailability;
  }

  if (data.capacity) payload.weight = parseFloat(data.capacity) || undefined;
  if (data.length) payload.length = parseFloat(data.length) || undefined;
  if (data.comment) payload.comment = data.comment;

  return payload;
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
    const wrapped = new Error(`DAT Posting API ${method} ${path} failed: ${msg}`);
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
