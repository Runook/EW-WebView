/**
 * 027 — Enhance truck_contacts & employee_orders for carrier details + contact drivers
 *
 * New columns on truck_contacts:  dot_number, carrier_email
 * New columns on employee_orders: dot_number, carrier_email, carrier_address, driver_name, driver_phone
 * New table:  contact_drivers  (multiple drivers per truck_contact)
 */

exports.up = async function (knex) {
  // 1. truck_contacts — add DOT# and carrier email
  const hasTruckContacts = await knex.schema.hasTable('truck_contacts');
  if (hasTruckContacts) {
    const hasDot = await knex.schema.hasColumn('truck_contacts', 'dot_number');
    if (!hasDot) {
      await knex.schema.table('truck_contacts', (table) => {
        table.string('dot_number', 50).nullable().comment('DOT Number');
        table.string('carrier_email', 200).nullable().comment('Carrier email');
      });
      console.log('✅ truck_contacts: added dot_number, carrier_email');
    }
  }

  // 2. employee_orders — add carrier fields + driver info
  const hasOrders = await knex.schema.hasTable('employee_orders');
  if (hasOrders) {
    const hasDotOrder = await knex.schema.hasColumn('employee_orders', 'dot_number');
    if (!hasDotOrder) {
      await knex.schema.table('employee_orders', (table) => {
        table.string('dot_number', 50).nullable().comment('DOT Number');
        table.string('carrier_email', 200).nullable().comment('Carrier email');
        table.string('carrier_address', 500).nullable().comment('Carrier address');
        table.string('driver_name', 100).nullable().comment('Driver name');
        table.string('driver_phone', 50).nullable().comment('Driver phone');
      });
      console.log('✅ employee_orders: added dot_number, carrier_email, carrier_address, driver_name, driver_phone');
    }
  }

  // 3. contact_drivers — multiple drivers per truck_contact
  const hasDrivers = await knex.schema.hasTable('contact_drivers');
  if (!hasDrivers) {
    await knex.schema.createTable('contact_drivers', (table) => {
      table.increments('id').primary();
      table.integer('truck_contact_id').unsigned().notNullable().references('id').inTable('truck_contacts').onDelete('CASCADE');
      table.string('driver_name', 100).notNullable();
      table.string('driver_phone', 50).nullable();
      table.integer('created_by').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ contact_drivers table created');
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('contact_drivers');

  const hasOrders = await knex.schema.hasTable('employee_orders');
  if (hasOrders) {
    const hasDotOrder = await knex.schema.hasColumn('employee_orders', 'dot_number');
    if (hasDotOrder) {
      await knex.schema.table('employee_orders', (table) => {
        table.dropColumn('dot_number');
        table.dropColumn('carrier_email');
        table.dropColumn('carrier_address');
        table.dropColumn('driver_name');
        table.dropColumn('driver_phone');
      });
    }
  }

  const hasTruckContacts = await knex.schema.hasTable('truck_contacts');
  if (hasTruckContacts) {
    const hasDot = await knex.schema.hasColumn('truck_contacts', 'dot_number');
    if (hasDot) {
      await knex.schema.table('truck_contacts', (table) => {
        table.dropColumn('dot_number');
        table.dropColumn('carrier_email');
      });
    }
  }
};
