exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('customers', 'billing_address2');
  if (!hasColumn) {
    await knex.schema.alterTable('customers', function(table) {
      table.string('billing_address2', 500).nullable().after('billing_address');
    });
    console.log('Added billing_address2 column to customers table');
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('customers', 'billing_address2');
  if (hasColumn) {
    await knex.schema.alterTable('customers', function(table) {
      table.dropColumn('billing_address2');
    });
  }
};
