/**
 * 028 — Freight Broker Data Model Upgrade
 *
 * New tables:
 *   - sourcing_channels    (how carriers are found: DAT, TQL, etc.)
 *   - carrier_vehicles     (vehicles per truck_contact)
 *   - shipments            (driver trip grouping multiple loads)
 *   - order_loads          (individual cargo items, broken out from JSON)
 *
 * Altered tables:
 *   - contact_drivers      + role, email
 *   - customers            + aliases
 *   - employee_orders      + workflow_stage, bol_number, sourcing, cancel/delivery timestamps
 */

exports.up = async function (knex) {

  // ── 1. sourcing_channels (reference table, created first for FK) ───────
  const hasSC = await knex.schema.hasTable('sourcing_channels');
  if (!hasSC) {
    await knex.schema.createTable('sourcing_channels', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable().unique();
      table.text('description').nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });

    await knex('sourcing_channels').insert([
      { name: 'DAT',           description: 'DAT Load Board' },
      { name: 'PR1',           description: 'PR1 Platform' },
      { name: 'TQL',           description: 'TQL Logistics' },
      { name: 'CTC',           description: 'CTC Transportation' },
      { name: 'RapidDeals',    description: 'RapidDeals Platform' },
      { name: 'Hub',           description: 'Hub Platform' },
      { name: 'Company Truck', description: '公司车' },
      { name: 'WeChat',        description: '微信找车' },
      { name: 'Phone',         description: '电话找车' },
      { name: 'Other',         description: '其他渠道' },
    ]);
    console.log('✅ sourcing_channels created + seeded');
  }

  // ── 2. carrier_vehicles ────────────────────────────────────────────────
  const hasCV = await knex.schema.hasTable('carrier_vehicles');
  if (!hasCV) {
    await knex.schema.createTable('carrier_vehicles', (table) => {
      table.increments('id').primary();
      table.integer('truck_contact_id').unsigned().notNullable()
        .references('id').inTable('truck_contacts').onDelete('CASCADE');
      table.string('vin', 50).nullable();
      table.string('description', 255).nullable();
      table.string('vehicle_type', 50).nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.index('truck_contact_id');
    });
    console.log('✅ carrier_vehicles created');
  }

  // ── 3. shipments ──────────────────────────────────────────────────────
  const hasSH = await knex.schema.hasTable('shipments');
  if (!hasSH) {
    await knex.schema.createTable('shipments', (table) => {
      table.increments('id').primary();
      table.string('shipment_number', 50).notNullable().unique();
      table.integer('carrier_id').unsigned().nullable()
        .references('id').inTable('truck_contacts').onDelete('SET NULL');
      table.integer('sourcing_channel_id').unsigned().nullable()
        .references('id').inTable('sourcing_channels').onDelete('SET NULL');
      table.string('driver_name', 100).nullable();
      table.string('driver_phone', 50).nullable();
      table.decimal('total_driver_price', 12, 2).nullable();
      table.integer('load_count').defaultTo(0);
      table.string('status', 30).defaultTo('pending');
      table.date('pickup_date').nullable();
      table.date('delivery_date').nullable();
      table.text('notes').nullable();
      table.integer('created_by').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      table.index('carrier_id');
      table.index('status');
      table.index('shipment_number');
    });
    console.log('✅ shipments created');
  }

  // ── 4. order_loads ────────────────────────────────────────────────────
  const hasOL = await knex.schema.hasTable('order_loads');
  if (!hasOL) {
    await knex.schema.createTable('order_loads', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable()
        .references('id').inTable('employee_orders').onDelete('CASCADE');
      table.string('load_number', 20).nullable();

      // Cargo
      table.string('goods_name', 255).nullable();
      table.decimal('weight_lbs', 12, 2).nullable();
      table.decimal('length_in', 10, 2).nullable();
      table.decimal('width_in', 10, 2).nullable();
      table.decimal('height_in', 10, 2).nullable();
      table.integer('box_count').nullable();
      table.integer('pallet_count').nullable();
      table.string('freight_class', 20).nullable();
      table.decimal('cargo_value', 12, 2).nullable();
      table.boolean('stackable').defaultTo(false);
      table.boolean('hazmat').defaultTo(false);

      // Route overrides (nullable — defaults to parent order addresses)
      table.string('ship_from', 500).nullable();
      table.string('ship_to', 500).nullable();
      table.text('consignee_contact').nullable();

      // Transport
      table.string('pickup_type', 30).nullable();
      table.string('delivery_type', 30).nullable();
      table.boolean('needs_liftgate').defaultTo(false);
      table.string('vehicle_type', 50).nullable();

      // Per-load pricing
      table.decimal('customer_quote', 12, 2).nullable();
      table.decimal('driver_price', 12, 2).nullable();
      table.boolean('customer_paid').defaultTo(false);
      table.boolean('driver_paid').defaultTo(false);

      // Status
      table.string('status', 30).defaultTo('pending');

      // Shipment link
      table.integer('shipment_id').unsigned().nullable()
        .references('id').inTable('shipments').onDelete('SET NULL');

      table.timestamps(true, true);
      table.index('order_id');
      table.index('shipment_id');
      table.index('status');
    });
    console.log('✅ order_loads created');
  }

  // ── 5. contact_drivers: add role + email ──────────────────────────────
  const hasCD = await knex.schema.hasTable('contact_drivers');
  if (hasCD) {
    const hasRole = await knex.schema.hasColumn('contact_drivers', 'role');
    if (!hasRole) {
      await knex.schema.table('contact_drivers', (table) => {
        table.string('role', 50).defaultTo('driver');
        table.string('email', 200).nullable();
      });
      console.log('✅ contact_drivers: added role, email');
    }
  }

  // ── 6. customers: add aliases ─────────────────────────────────────────
  const hasCust = await knex.schema.hasTable('customers');
  if (hasCust) {
    const hasAliases = await knex.schema.hasColumn('customers', 'aliases');
    if (!hasAliases) {
      await knex.schema.table('customers', (table) => {
        table.jsonb('aliases').defaultTo('[]');
      });
      console.log('✅ customers: added aliases');
    }
  }

  // ── 7. employee_orders: workflow + sourcing + lifecycle timestamps ─────
  const hasEO = await knex.schema.hasTable('employee_orders');
  if (hasEO) {
    const colsToAdd = [
      { name: 'workflow_stage',       fn: t => t.string('workflow_stage', 50).defaultTo('inquiry') },
      { name: 'bol_number',           fn: t => t.string('bol_number', 100).nullable() },
      { name: 'sourcing_channel_id',  fn: t => t.integer('sourcing_channel_id').unsigned().nullable().references('id').inTable('sourcing_channels').onDelete('SET NULL') },
      { name: 'sourcing_notes',       fn: t => t.text('sourcing_notes').nullable() },
      { name: 'consignee_contact',    fn: t => t.text('consignee_contact').nullable() },
      { name: 'delivery_type_detail', fn: t => t.string('delivery_type_detail', 50).nullable() },
      { name: 'cancelled_at',         fn: t => t.timestamp('cancelled_at').nullable() },
      { name: 'cancelled_by',         fn: t => t.integer('cancelled_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL') },
      { name: 'cancel_reason',        fn: t => t.text('cancel_reason').nullable() },
      { name: 'cancel_cost',          fn: t => t.decimal('cancel_cost', 12, 2).nullable() },
      { name: 'delivered_at',         fn: t => t.timestamp('delivered_at').nullable() },
      { name: 'invoiced_at',          fn: t => t.timestamp('invoiced_at').nullable() },
      { name: 'settled_at',           fn: t => t.timestamp('settled_at').nullable() },
      { name: 'customer_paid_at',     fn: t => t.timestamp('customer_paid_at').nullable() },
      { name: 'driver_paid_at',       fn: t => t.timestamp('driver_paid_at').nullable() },
    ];

    const missing = [];
    for (const col of colsToAdd) {
      const exists = await knex.schema.hasColumn('employee_orders', col.name);
      if (!exists) missing.push(col);
    }

    if (missing.length > 0) {
      await knex.schema.table('employee_orders', (table) => {
        for (const col of missing) col.fn(table);
      });
      // Add indexes only if workflow_stage was just created
      if (missing.some(c => c.name === 'workflow_stage')) {
        try {
          await knex.schema.table('employee_orders', (table) => {
            table.index('workflow_stage');
            table.index('sourcing_channel_id');
          });
        } catch { /* indexes may already exist */ }
      }
      console.log(`✅ employee_orders: added ${missing.map(c => c.name).join(', ')}`);
    } else {
      console.log('ℹ️ employee_orders: all workflow columns already exist');
    }
  }

  // ── 8. Backfill workflow_stage from existing status/sub_status ─────────
  try {
    await knex.raw(`
      UPDATE employee_orders SET workflow_stage = CASE
        WHEN status = 'quote'     THEN 'inquiry'
        WHEN status = 'ordered'   AND sub_status = 'waiting_driver' THEN 'carrier_sourcing'
        WHEN status = 'ordered'   AND sub_status = 'driver_found'   THEN 'pickup'
        WHEN status = 'ordered'   AND sub_status = 'in_transit'     THEN 'in_transit'
        WHEN status = 'ordered'   THEN 'bol_issued'
        WHEN status = 'completed' THEN 'completed'
        ELSE 'inquiry'
      END
      WHERE workflow_stage = 'inquiry' OR workflow_stage IS NULL
    `);
    console.log('✅ employee_orders: backfilled workflow_stage');
  } catch (e) {
    console.warn('⚠️ workflow_stage backfill skipped:', e.message);
  }
};


exports.down = async function (knex) {
  // Reverse order: drop FK-dependent tables first
  await knex.schema.dropTableIfExists('order_loads');
  await knex.schema.dropTableIfExists('shipments');
  await knex.schema.dropTableIfExists('carrier_vehicles');
  await knex.schema.dropTableIfExists('sourcing_channels');

  const hasCD = await knex.schema.hasTable('contact_drivers');
  if (hasCD) {
    const hasRole = await knex.schema.hasColumn('contact_drivers', 'role');
    if (hasRole) {
      await knex.schema.table('contact_drivers', (table) => {
        table.dropColumn('role');
        table.dropColumn('email');
      });
    }
  }

  const hasCust = await knex.schema.hasTable('customers');
  if (hasCust) {
    const hasAliases = await knex.schema.hasColumn('customers', 'aliases');
    if (hasAliases) {
      await knex.schema.table('customers', (table) => {
        table.dropColumn('aliases');
      });
    }
  }

  const hasEO = await knex.schema.hasTable('employee_orders');
  if (hasEO) {
    const hasWF = await knex.schema.hasColumn('employee_orders', 'workflow_stage');
    if (hasWF) {
      await knex.schema.table('employee_orders', (table) => {
        table.dropColumn('workflow_stage');
        table.dropColumn('bol_number');
        table.dropColumn('sourcing_channel_id');
        table.dropColumn('sourcing_notes');
        table.dropColumn('consignee_contact');
        table.dropColumn('delivery_type_detail');
        table.dropColumn('cancelled_at');
        table.dropColumn('cancelled_by');
        table.dropColumn('cancel_reason');
        table.dropColumn('cancel_cost');
        table.dropColumn('delivered_at');
        table.dropColumn('invoiced_at');
        table.dropColumn('settled_at');
        table.dropColumn('customer_paid_at');
        table.dropColumn('driver_paid_at');
      });
    }
  }
};
