/**
 * 033 — FTL (Full Truckload) Management
 *
 * Adds FTL support to the employee_orders table so the existing LTL散板
 * broker workflow can coexist with FTL整车 management.
 *
 * Strategy:
 *   - Reuse the same employee_orders table to share workflow, customer,
 *     carrier, payment, document, shipments, order_loads infrastructure.
 *   - Discriminate by `freight_mode` ENUM('LTL','FTL'); backfill legacy
 *     rows to 'LTL'.
 *   - Add FTL-specific columns mirroring the DAT Freight Posting v8.5 spec:
 *     equipment_type, truck_length_ft, hazmat, team_required, oversize,
 *     tarp_required, commodity, temperature_min/max, pickup/delivery time
 *     windows + appointment flags + reference numbers, and customer/carrier
 *     two-sided rate breakdown (line_haul + FSC + accessorials) plus RPM.
 *
 * Idempotent: all hasColumn checks; safe to run repeatedly.
 */

exports.up = async function (knex) {
  const hasEO = await knex.schema.hasTable('employee_orders');
  if (!hasEO) {
    console.warn('⚠️ employee_orders table missing — skip 033');
    return;
  }

  // Columns to add. Each entry uses knex column helpers.
  const cols = [
    // Discriminator
    { name: 'freight_mode', fn: (t) => t.string('freight_mode', 10).notNullable().defaultTo('LTL') },

    // Equipment / vehicle
    { name: 'equipment_type', fn: (t) => t.string('equipment_type', 10).nullable() },
    { name: 'truck_length_ft', fn: (t) => t.integer('truck_length_ft').nullable() },
    { name: 'team_required', fn: (t) => t.boolean('team_required').defaultTo(false) },
    { name: 'hazmat', fn: (t) => t.boolean('hazmat').defaultTo(false) },
    { name: 'oversize', fn: (t) => t.boolean('oversize').defaultTo(false) },
    { name: 'tarp_required', fn: (t) => t.boolean('tarp_required').defaultTo(false) },
    { name: 'trailer_vin', fn: (t) => t.string('trailer_vin', 50).nullable() },

    // Cargo (single-unit for FTL)
    { name: 'commodity', fn: (t) => t.string('commodity', 255).nullable() },
    { name: 'palletized', fn: (t) => t.boolean('palletized').defaultTo(false) },
    { name: 'pieces_total', fn: (t) => t.integer('pieces_total').nullable() },
    { name: 'temperature_min', fn: (t) => t.integer('temperature_min').nullable() },
    { name: 'temperature_max', fn: (t) => t.integer('temperature_max').nullable() },

    // Time windows + reference numbers
    { name: 'pickup_window_start', fn: (t) => t.timestamp('pickup_window_start').nullable() },
    { name: 'pickup_window_end', fn: (t) => t.timestamp('pickup_window_end').nullable() },
    { name: 'delivery_window_start', fn: (t) => t.timestamp('delivery_window_start').nullable() },
    { name: 'delivery_window_end', fn: (t) => t.timestamp('delivery_window_end').nullable() },
    { name: 'pickup_appointment_required', fn: (t) => t.boolean('pickup_appointment_required').defaultTo(false) },
    { name: 'delivery_appointment_required', fn: (t) => t.boolean('delivery_appointment_required').defaultTo(false) },
    { name: 'pickup_reference', fn: (t) => t.string('pickup_reference', 100).nullable() },
    { name: 'delivery_reference', fn: (t) => t.string('delivery_reference', 100).nullable() },

    // Pricing (FTL two-sided: customer + carrier)
    { name: 'line_haul_rate', fn: (t) => t.decimal('line_haul_rate', 12, 2).nullable() },
    { name: 'fuel_surcharge', fn: (t) => t.decimal('fuel_surcharge', 12, 2).nullable() },
    { name: 'customer_accessorials', fn: (t) => t.decimal('customer_accessorials', 12, 2).nullable() },
    { name: 'rate_per_mile', fn: (t) => t.decimal('rate_per_mile', 8, 3).nullable() },
    { name: 'carrier_line_haul', fn: (t) => t.decimal('carrier_line_haul', 12, 2).nullable() },
    { name: 'carrier_fuel_surcharge', fn: (t) => t.decimal('carrier_fuel_surcharge', 12, 2).nullable() },
    { name: 'carrier_accessorials', fn: (t) => t.decimal('carrier_accessorials', 12, 2).nullable() },
  ];

  const missing = [];
  for (const col of cols) {
    const exists = await knex.schema.hasColumn('employee_orders', col.name);
    if (!exists) missing.push(col);
  }

  if (missing.length > 0) {
    await knex.schema.alterTable('employee_orders', (table) => {
      for (const col of missing) col.fn(table);
    });
    console.log(`✅ 033: added ${missing.length} FTL column(s): ${missing.map((c) => c.name).join(', ')}`);
  } else {
    console.log('ℹ️ 033: all FTL columns already exist');
  }

  // Backfill freight_mode = 'LTL' for any rows that don't have it set.
  // (NOT NULL DEFAULT 'LTL' already handles new rows; this is for safety.)
  try {
    const updated = await knex('employee_orders')
      .whereNull('freight_mode')
      .orWhere('freight_mode', '')
      .update({ freight_mode: 'LTL' });
    if (updated > 0) console.log(`✅ 033: backfilled freight_mode='LTL' on ${updated} rows`);
  } catch (e) {
    console.warn('⚠️ 033 backfill skipped:', e.message);
  }

  // Add an index on freight_mode for fast list filtering.
  try {
    await knex.schema.alterTable('employee_orders', (table) => {
      table.index('freight_mode');
    });
    console.log('✅ 033: indexed freight_mode');
  } catch (e) {
    // Index may already exist (idempotent)
    if (!String(e.message).includes('already exists')) {
      console.warn('⚠️ 033 index skipped:', e.message);
    }
  }
};

exports.down = async function (knex) {
  const hasEO = await knex.schema.hasTable('employee_orders');
  if (!hasEO) return;

  const colsToDrop = [
    'freight_mode',
    'equipment_type', 'truck_length_ft', 'team_required', 'hazmat',
    'oversize', 'tarp_required', 'trailer_vin',
    'commodity', 'palletized', 'pieces_total',
    'temperature_min', 'temperature_max',
    'pickup_window_start', 'pickup_window_end',
    'delivery_window_start', 'delivery_window_end',
    'pickup_appointment_required', 'delivery_appointment_required',
    'pickup_reference', 'delivery_reference',
    'line_haul_rate', 'fuel_surcharge', 'customer_accessorials',
    'rate_per_mile', 'carrier_line_haul', 'carrier_fuel_surcharge',
    'carrier_accessorials',
  ];

  const present = [];
  for (const c of colsToDrop) {
    const exists = await knex.schema.hasColumn('employee_orders', c);
    if (exists) present.push(c);
  }

  if (present.length > 0) {
    await knex.schema.alterTable('employee_orders', (table) => {
      for (const c of present) table.dropColumn(c);
    });
  }
};
