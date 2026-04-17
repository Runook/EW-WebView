/**
 * Migration: Add 'accountant' role to the employee system
 * - Adds 'accountant' to employee_role enums on users and employee_role_permissions
 * - Adds 'credits.manage' permission
 * - Grants accountant role appropriate permissions (manager-level + credits + system settings)
 * - Grants credits.manage to admin as well
 */

exports.up = async function(knex) {
  // Columns use text + CHECK constraints (not Postgres enum types).

  // 1. Update CHECK constraints to include 'accountant'
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT users_employee_role_check`);
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_employee_role_check CHECK (employee_role = ANY (ARRAY['employee'::text, 'manager'::text, 'accountant'::text, 'admin'::text]))`);
  await knex.raw(`ALTER TABLE employee_role_permissions DROP CONSTRAINT employee_role_permissions_role_check`);
  await knex.raw(`ALTER TABLE employee_role_permissions ADD CONSTRAINT employee_role_permissions_role_check CHECK (role = ANY (ARRAY['employee'::text, 'manager'::text, 'accountant'::text, 'admin'::text]))`);

  // 2. Insert new 'credits.manage' permission
  await knex('employee_permissions').insert({
    permission_key: 'credits.manage',
    permission_name: '管理用户积分',
    category: 'system',
    description: '可以查看和调整任意用户的积分余额'
  });

  // 4. Get all permission IDs we need
  const allPerms = await knex('employee_permissions').select('id', 'permission_key');
  const permMap = {};
  allPerms.forEach(p => { permMap[p.permission_key] = p.id; });

  // 5. Define accountant permissions (manager-level + credits.manage + system.settings)
  const accountantPermKeys = [
    // Same as manager
    'order.view.own', 'order.create', 'order.edit.own', 'order.delete.own',
    'customer.view', 'report.view.own',
    'order.view.all', 'order.edit.all', 'order.assign', 'order.export',
    'customer.edit', 'employee.view', 'report.view.all',
    // Additional for accountant
    'credits.manage', 'system.settings'
  ];

  const accountantRows = accountantPermKeys
    .filter(key => permMap[key])
    .map(key => ({ role: 'accountant', permission_id: permMap[key] }));

  if (accountantRows.length > 0) {
    await knex('employee_role_permissions').insert(accountantRows);
  }

  // 6. Grant credits.manage to admin too
  if (permMap['credits.manage']) {
    await knex('employee_role_permissions').insert({
      role: 'admin',
      permission_id: permMap['credits.manage']
    });
  }
};

exports.down = async function(knex) {
  // Remove accountant role permissions
  await knex('employee_role_permissions').where('role', 'accountant').del();

  // Remove credits.manage from admin
  const creditsPerm = await knex('employee_permissions').where('permission_key', 'credits.manage').first();
  if (creditsPerm) {
    await knex('employee_role_permissions')
      .where({ role: 'admin', permission_id: creditsPerm.id })
      .del();
    await knex('employee_permissions').where('id', creditsPerm.id).del();
  }

  // Note: Postgres does not support removing values from enums easily.
  // The 'accountant' value will remain in the enum but won't be used.
};
