const { db } = require('../config/database');

class OrderLoad {
  /**
   * Create a single load for an order.
   */
  static async create(orderId, loadData) {
    const loadNumber = await this._nextLoadNumber(orderId);
    const [row] = await db('order_loads')
      .insert({
        order_id: orderId,
        load_number: loadNumber,
        goods_name: loadData.goods_name || null,
        weight_lbs: loadData.weight_lbs || null,
        length_in: loadData.length_in || null,
        width_in: loadData.width_in || null,
        height_in: loadData.height_in || null,
        box_count: loadData.box_count || null,
        pallet_count: loadData.pallet_count || null,
        freight_class: loadData.freight_class || null,
        cargo_value: loadData.cargo_value || null,
        stackable: loadData.stackable || false,
        hazmat: loadData.hazmat || false,
        ship_from: loadData.ship_from || null,
        ship_to: loadData.ship_to || null,
        consignee_contact: loadData.consignee_contact || null,
        pickup_type: loadData.pickup_type || null,
        delivery_type: loadData.delivery_type || null,
        needs_liftgate: loadData.needs_liftgate || false,
        vehicle_type: loadData.vehicle_type || null,
        customer_quote: loadData.customer_quote || null,
        driver_price: loadData.driver_price || null,
        status: loadData.status || 'pending',
      })
      .returning('*');
    return row;
  }

  /**
   * Bulk-create loads from the legacy JSON items array stored on an order.
   * items = [{ description, weight, length, width, height, pallets, freightClass, stackable, hazmat }]
   */
  static async bulkCreateFromItems(orderId, items) {
    if (!items || items.length === 0) return [];

    const existing = await db('order_loads').where('order_id', orderId).count('* as c').first();
    if (parseInt(existing.c) > 0) return [];

    const rows = items.map((item, idx) => ({
      order_id: orderId,
      load_number: `L-${String(idx + 1).padStart(3, '0')}`,
      goods_name: item.description || null,
      weight_lbs: parseFloat(item.weight) || null,
      length_in: parseFloat(item.length) || null,
      width_in: parseFloat(item.width) || null,
      height_in: parseFloat(item.height) || null,
      pallet_count: parseInt(item.pallets) || null,
      freight_class: item.freightClass || null,
      stackable: item.stackable || false,
      hazmat: item.hazmat || false,
      status: 'pending',
    }));

    return db('order_loads').insert(rows).returning('*');
  }

  static async findByOrderId(orderId) {
    return db('order_loads')
      .where('order_id', orderId)
      .orderBy('load_number', 'asc');
  }

  static async findByShipmentId(shipmentId) {
    return db('order_loads')
      .where('shipment_id', shipmentId)
      .orderBy('load_number', 'asc');
  }

  static async findById(id) {
    return db('order_loads').where('id', id).first();
  }

  static async update(id, data) {
    const allowed = [
      'goods_name', 'weight_lbs', 'length_in', 'width_in', 'height_in',
      'box_count', 'pallet_count', 'freight_class', 'cargo_value',
      'stackable', 'hazmat', 'ship_from', 'ship_to', 'consignee_contact',
      'pickup_type', 'delivery_type', 'needs_liftgate', 'vehicle_type',
      'customer_quote', 'driver_price', 'customer_paid', 'driver_paid',
      'status', 'shipment_id',
    ];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    updates.updated_at = new Date();

    const [row] = await db('order_loads')
      .where('id', id)
      .update(updates)
      .returning('*');
    return row;
  }

  static async updateStatus(id, status) {
    const [row] = await db('order_loads')
      .where('id', id)
      .update({ status, updated_at: new Date() })
      .returning('*');
    return row;
  }

  static async delete(id) {
    return db('order_loads').where('id', id).del();
  }

  static async deleteByOrderId(orderId) {
    return db('order_loads').where('order_id', orderId).del();
  }

  /**
   * Assign a load to a shipment.
   */
  static async assignToShipment(loadId, shipmentId) {
    const [row] = await db('order_loads')
      .where('id', loadId)
      .update({ shipment_id: shipmentId, updated_at: new Date() })
      .returning('*');
    return row;
  }

  /**
   * Get aggregate stats for loads under an order.
   */
  static async getOrderLoadSummary(orderId) {
    const result = await db('order_loads')
      .where('order_id', orderId)
      .select(
        db.raw('COUNT(*)::int as load_count'),
        db.raw('COALESCE(SUM(weight_lbs), 0) as total_weight'),
        db.raw('COALESCE(SUM(pallet_count), 0)::int as total_pallets'),
        db.raw('COALESCE(SUM(customer_quote), 0) as total_customer_quote'),
        db.raw('COALESCE(SUM(driver_price), 0) as total_driver_price'),
      )
      .first();
    return result;
  }

  // ─── private helpers ──────────────────────────────────────────────────

  static async _nextLoadNumber(orderId) {
    const last = await db('order_loads')
      .where('order_id', orderId)
      .orderBy('id', 'desc')
      .first();
    if (!last || !last.load_number) return 'L-001';
    const num = parseInt(last.load_number.replace('L-', '')) + 1;
    return `L-${String(num).padStart(3, '0')}`;
  }
}

module.exports = OrderLoad;
