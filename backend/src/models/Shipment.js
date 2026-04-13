const { db } = require('../config/database');

class Shipment {
  static async create(data, createdBy) {
    const shipmentNumber = await this._generateNumber();
    const [row] = await db('shipments')
      .insert({
        shipment_number: shipmentNumber,
        carrier_id: data.carrier_id || null,
        sourcing_channel_id: data.sourcing_channel_id || null,
        driver_name: data.driver_name || null,
        driver_phone: data.driver_phone || null,
        total_driver_price: data.total_driver_price || null,
        load_count: data.load_count || 0,
        status: data.status || 'pending',
        pickup_date: data.pickup_date || null,
        delivery_date: data.delivery_date || null,
        notes: data.notes || null,
        created_by: createdBy,
      })
      .returning('*');
    return row;
  }

  static async findById(id) {
    const shipment = await db('shipments as s')
      .leftJoin('truck_contacts as tc', 's.carrier_id', 'tc.id')
      .leftJoin('sourcing_channels as sc', 's.sourcing_channel_id', 'sc.id')
      .where('s.id', id)
      .select(
        's.*',
        'tc.mc_number', 'tc.truck_company_name',
        'sc.name as sourcing_channel_name',
      )
      .first();
    return shipment || null;
  }

  static async findAll(options = {}) {
    const { status, carrier_id, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    let query = db('shipments as s')
      .leftJoin('truck_contacts as tc', 's.carrier_id', 'tc.id')
      .leftJoin('sourcing_channels as sc', 's.sourcing_channel_id', 'sc.id');

    if (status) query = query.where('s.status', status);
    if (carrier_id) query = query.where('s.carrier_id', carrier_id);

    const total = await query.clone().count('* as count').first();
    const rows = await query.clone()
      .select(
        's.*',
        'tc.mc_number', 'tc.truck_company_name',
        'sc.name as sourcing_channel_name',
      )
      .orderBy('s.created_at', 'desc')
      .offset(offset)
      .limit(limit);

    return {
      shipments: rows,
      total: parseInt(total?.count || 0),
      page,
      limit,
    };
  }

  static async update(id, data) {
    const allowed = [
      'carrier_id', 'sourcing_channel_id', 'driver_name', 'driver_phone',
      'total_driver_price', 'load_count', 'status',
      'pickup_date', 'delivery_date', 'notes',
    ];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    updates.updated_at = new Date();

    const [row] = await db('shipments')
      .where('id', id)
      .update(updates)
      .returning('*');
    return row;
  }

  static async updateStatus(id, status) {
    const [row] = await db('shipments')
      .where('id', id)
      .update({ status, updated_at: new Date() })
      .returning('*');
    return row;
  }

  /**
   * Add a load to this shipment (updates order_loads.shipment_id).
   */
  static async addLoad(shipmentId, loadId) {
    await db('order_loads')
      .where('id', loadId)
      .update({ shipment_id: shipmentId, updated_at: new Date() });
    await this.recalcTotals(shipmentId);
  }

  /**
   * Remove a load from this shipment.
   */
  static async removeLoad(shipmentId, loadId) {
    await db('order_loads')
      .where('id', loadId)
      .where('shipment_id', shipmentId)
      .update({ shipment_id: null, updated_at: new Date() });
    await this.recalcTotals(shipmentId);
  }

  /**
   * Recalculate cached aggregates from order_loads.
   */
  static async recalcTotals(shipmentId) {
    const agg = await db('order_loads')
      .where('shipment_id', shipmentId)
      .select(
        db.raw('COUNT(*)::int as load_count'),
        db.raw('COALESCE(SUM(driver_price), 0) as total_driver_price'),
      )
      .first();

    await db('shipments')
      .where('id', shipmentId)
      .update({
        load_count: agg.load_count,
        total_driver_price: parseFloat(agg.total_driver_price) || 0,
        updated_at: new Date(),
      });
  }

  static async delete(id) {
    await db('order_loads')
      .where('shipment_id', id)
      .update({ shipment_id: null });
    return db('shipments').where('id', id).del();
  }

  // ─── private ──────────────────────────────────────────────────────────

  static async _generateNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latest = await db('shipments')
      .where('shipment_number', 'like', `SH-${dateStr}-%`)
      .orderBy('shipment_number', 'desc')
      .first();
    let seq = 1;
    if (latest) {
      const parts = latest.shipment_number.split('-');
      seq = parseInt(parts[2]) + 1;
    }
    return `SH-${dateStr}-${String(seq).padStart(3, '0')}`;
  }
}

module.exports = Shipment;
