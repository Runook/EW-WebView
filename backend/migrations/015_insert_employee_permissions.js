/**
 * Migration: 插入员工系统默认权限
 */

exports.up = async function(knex) {
  // 1. 插入权限配置
  const permissions = [
    // 订单权限
    { permission_key: 'order.view.own', permission_name: '查看自己的订单', category: 'order', description: '员工可以查看自己创建或负责的订单' },
    { permission_key: 'order.view.all', permission_name: '查看所有订单', category: 'order', description: '可以查看系统中的所有订单' },
    { permission_key: 'order.create', permission_name: '创建订单', category: 'order', description: '可以创建新订单' },
    { permission_key: 'order.edit.own', permission_name: '编辑自己的订单', category: 'order', description: '可以编辑自己创建或负责的订单' },
    { permission_key: 'order.edit.all', permission_name: '编辑所有订单', category: 'order', description: '可以编辑任何订单' },
    { permission_key: 'order.delete.own', permission_name: '删除自己的订单', category: 'order', description: '可以删除自己创建的订单' },
    { permission_key: 'order.delete.all', permission_name: '删除所有订单', category: 'order', description: '可以删除任何订单' },
    { permission_key: 'order.assign', permission_name: '分配订单', category: 'order', description: '可以将订单分配给其他员工' },
    { permission_key: 'order.export', permission_name: '导出订单数据', category: 'order', description: '可以导出订单数据' },
    
    // 客户权限
    { permission_key: 'customer.view', permission_name: '查看客户信息', category: 'customer', description: '可以查看客户详细信息' },
    { permission_key: 'customer.edit', permission_name: '编辑客户信息', category: 'customer', description: '可以编辑客户资料' },
    
    // 员工管理权限
    { permission_key: 'employee.view', permission_name: '查看员工列表', category: 'employee', description: '可以查看员工信息' },
    { permission_key: 'employee.manage', permission_name: '管理员工', category: 'employee', description: '可以添加、编辑、删除员工及设置权限' },
    
    // 报表权限
    { permission_key: 'report.view.own', permission_name: '查看个人报表', category: 'report', description: '可以查看自己的业绩报表' },
    { permission_key: 'report.view.all', permission_name: '查看所有报表', category: 'report', description: '可以查看所有员工的报表' },
    
    // 系统权限
    { permission_key: 'system.settings', permission_name: '系统设置', category: 'system', description: '可以修改系统配置' },
    { permission_key: 'system.logs', permission_name: '查看系统日志', category: 'system', description: '可以查看系统操作日志' }
  ];
  
  await knex('employee_permissions').insert(permissions);
  
  // 2. 获取插入的权限ID
  const insertedPermissions = await knex('employee_permissions').select('id', 'permission_key');
  const permissionMap = {};
  insertedPermissions.forEach(p => {
    permissionMap[p.permission_key] = p.id;
  });
  
  // 3. 为不同角色分配权限
  const rolePermissions = [];
  
  // 普通员工权限 (employee)
  const employeePermissions = [
    'order.view.own',
    'order.create',
    'order.edit.own',
    'order.delete.own',
    'customer.view',
    'report.view.own'
  ];
  employeePermissions.forEach(key => {
    if (permissionMap[key]) {
      rolePermissions.push({ role: 'employee', permission_id: permissionMap[key] });
    }
  });
  
  // 经理权限 (manager) - 继承员工权限 + 额外权限
  const managerPermissions = [
    ...employeePermissions,
    'order.view.all',
    'order.edit.all',
    'order.assign',
    'order.export',
    'customer.edit',
    'employee.view',
    'report.view.all'
  ];
  managerPermissions.forEach(key => {
    if (permissionMap[key]) {
      rolePermissions.push({ role: 'manager', permission_id: permissionMap[key] });
    }
  });
  
  // 管理员权限 (admin) - 所有权限
  const adminPermissions = Object.keys(permissionMap);
  adminPermissions.forEach(key => {
    if (permissionMap[key]) {
      rolePermissions.push({ role: 'admin', permission_id: permissionMap[key] });
    }
  });
  
  // 插入角色权限关联
  await knex('employee_role_permissions').insert(rolePermissions);
};

exports.down = async function(knex) {
  await knex('employee_role_permissions').del();
  await knex('employee_permissions').del();
};

