const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class LTLQuoteSession {
  static async create(data) {
    const sessionId = `QS-${uuidv4().substring(0, 8).toUpperCase()}`;

    const earliest = this._earliestExpiration(data.quoteResults);
    const expiresAt = earliest || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [row] = await db('ltl_quote_sessions')
      .insert({
        session_id: sessionId,
        user_email: data.userEmail,
        origin_city: data.originCity,
        origin_state: data.originState,
        origin_zip: data.originZip,
        destination_city: data.destinationCity,
        destination_state: data.destinationState,
        destination_zip: data.destinationZip,
        origin_location_type: data.originLocationType,
        destination_location_type: data.destinationLocationType,
        distance_miles: data.distanceMiles,
        pickup_date: data.pickupDate || null,
        delivery_date: data.deliveryDate || null,
        items: JSON.stringify(data.items || []),
        pickup_services: JSON.stringify(data.pickupServices || []),
        delivery_services: JSON.stringify(data.deliveryServices || []),
        total_weight: data.totalWeight,
        total_pallets: data.totalPallets,
        quote_results: JSON.stringify(data.quoteResults || []),
        quote_count: (data.quoteResults || []).length,
        lowest_price: data.lowestPrice,
        expires_at: expiresAt,
        status: 'active',
        employee_order_id: data.employeeOrderId || null
      })
      .returning('*');

    return row;
  }

  static _earliestExpiration(quotes) {
    if (!quotes || quotes.length === 0) return null;
    let earliest = null;
    for (const q of quotes) {
      if (!q.expDate) continue;
      const d = new Date(q.expDate);
      if (!isNaN(d.getTime()) && (!earliest || d < earliest)) earliest = d;
    }
    return earliest;
  }

  static async findByUser(email, options = {}) {
    const { page = 1, limit = 20, includeExpired = false } = options;
    const offset = (page - 1) * limit;

    let query = db('ltl_quote_sessions')
      .where('user_email', email)
      .orderBy('created_at', 'desc');

    if (!includeExpired) {
      query = query.where(function() {
        this.where(function() {
          this.where('status', 'active')
            .andWhere('expires_at', '>', new Date());
        }).orWhere('status', 'booked');
      });
    }

    const total = await query.clone().count('* as count').first();
    const rows = await query.offset(offset).limit(limit);

    return {
      sessions: rows.map(r => ({
        ...r,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
        pickup_services: typeof r.pickup_services === 'string' ? JSON.parse(r.pickup_services) : r.pickup_services,
        delivery_services: typeof r.delivery_services === 'string' ? JSON.parse(r.delivery_services) : r.delivery_services,
        quote_results: typeof r.quote_results === 'string' ? JSON.parse(r.quote_results) : r.quote_results,
        is_expired: new Date(r.expires_at) < new Date()
      })),
      total: parseInt(total?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total?.count || 0) / limit)
    };
  }

  static async findById(sessionId) {
    const row = await db('ltl_quote_sessions')
      .where('session_id', sessionId)
      .first();

    if (!row) return null;

    return {
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      pickup_services: typeof row.pickup_services === 'string' ? JSON.parse(row.pickup_services) : row.pickup_services,
      delivery_services: typeof row.delivery_services === 'string' ? JSON.parse(row.delivery_services) : row.delivery_services,
      quote_results: typeof row.quote_results === 'string' ? JSON.parse(row.quote_results) : row.quote_results,
      is_expired: new Date(row.expires_at) < new Date()
    };
  }

  static async updateStatus(sessionId, status) {
    return db('ltl_quote_sessions')
      .where('session_id', sessionId)
      .update({ status, updated_at: new Date() });
  }

  static async delete(sessionId) {
    return db('ltl_quote_sessions')
      .where('session_id', sessionId)
      .del();
  }
}

module.exports = LTLQuoteSession;
