/**
 * Migration: 创建员工系统
 * 包括员工表、订单表、角色权限表
 */

exports.up = function(knex) {
  return knex.schema
    // 1. 为用户表添加员工相关字段
    .table('users', function(table) {
      table.boolean('is_employee').notNullable().defaultTo(false).comment('是否为员工');
      table.enum('employee_role', ['employee', 'manager', 'admin']).nullable().comment('员工角色');
      table.string('employee_id', 50).nullable().unique().comment('员工ID');
      table.datetime('employee_since').nullable().comment('成为员工的时间');
    })
    
    // 2. 创建订单表 (员工系统的核心表)
    .createTable('employee_orders', function(table) {
      table.increments('id').primary();
      table.string('order_number', 100).notNullable().unique().comment('订单编号');
      table.integer('customer_id').unsigned().nullable().comment('客户ID');
      table.string('customer_name', 200).notNullable().comment('客户名称');
      table.string('customer_email', 200).nullable().comment('客户邮箱');
      table.string('customer_phone', 50).nullable().comment('客户电话');
      
      // 订单基本信息
      table.enum('order_type', ['land_freight', 'sea_freight', 'air_freight', 'warehouse', 'customs', 'other'])
        .notNullable().comment('订单类型');
      table.enum('status', ['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'on_hold'])
        .notNullable().defaultTo('draft').comment('订单状态');
      table.enum('priority', ['low', 'normal', 'high', 'urgent'])
        .notNullable().defaultTo('normal').comment('优先级');
      
      // 货物信息
      table.text('cargo_description').notNullable().comment('货物描述');
      table.decimal('cargo_weight', 10, 2).nullable().comment('货物重量(kg)');
      table.decimal('cargo_volume', 10, 2).nullable().comment('货物体积(m³)');
      table.integer('cargo_quantity').nullable().comment('货物数量');
      table.string('cargo_unit', 50).nullable().comment('货物单位');
      
      // 地址信息
      table.string('origin_address', 500).nullable().comment('起始地址');
      table.string('origin_city', 100).nullable().comment('起始城市');
      table.string('origin_state', 100).nullable().comment('起始州/省');
      table.string('origin_country', 100).nullable().comment('起始国家');
      table.string('origin_zipcode', 20).nullable().comment('起始邮编');
      
      table.string('destination_address', 500).nullable().comment('目的地址');
      table.string('destination_city', 100).nullable().comment('目的地城市');
      table.string('destination_state', 100).nullable().comment('目的地州/省');
      table.string('destination_country', 100).nullable().comment('目的地国家');
      table.string('destination_zipcode', 20).nullable().comment('目的地邮编');
      
      // 时间信息
      table.datetime('pickup_date').nullable().comment('取货日期');
      table.datetime('delivery_date').nullable().comment('送达日期');
      table.datetime('estimated_delivery').nullable().comment('预计送达日期');
      
      // 价格信息
      table.decimal('quoted_price', 12, 2).nullable().comment('报价金额');
      table.decimal('final_price', 12, 2).nullable().comment('最终金额');
      table.string('currency', 10).defaultTo('USD').comment('货币类型');
      table.decimal('paid_amount', 12, 2).defaultTo(0).comment('已支付金额');
      table.enum('payment_status', ['unpaid', 'partial', 'paid', 'refunded'])
        .defaultTo('unpaid').comment('支付状态');
      
      // 员工信息
      table.integer('created_by').unsigned().notNullable().comment('创建员工ID');
      table.integer('assigned_to').unsigned().nullable().comment('负责员工ID');
      table.integer('updated_by').unsigned().nullable().comment('最后更新员工ID');
      
      // 备注和附件
      table.text('notes').nullable().comment('订单备注');
      table.text('internal_notes').nullable().comment('内部备注');
      table.json('attachments').nullable().comment('附件信息');
      table.json('tracking_info').nullable().comment('物流跟踪信息');
      
      // 其他信息
      table.json('custom_fields').nullable().comment('自定义字段');
      table.boolean('is_deleted').notNullable().defaultTo(false).comment('软删除标记');
      table.timestamps(true, true);
      
      // 外键
      table.foreign('customer_id').references('users.id').onDelete('SET NULL');
      table.foreign('created_by').references('users.id').onDelete('RESTRICT');
      table.foreign('assigned_to').references('users.id').onDelete('SET NULL');
      table.foreign('updated_by').references('users.id').onDelete('SET NULL');
      
      // 索引
      table.index(['order_number']);
      table.index(['customer_id']);
      table.index(['status', 'is_deleted']);
      table.index(['order_type', 'status']);
      table.index(['created_by', 'created_at']);
      table.index(['assigned_to', 'status']);
      table.index(['pickup_date']);
      table.index(['delivery_date']);
      table.index(['priority', 'status']);
    })
    
    // 3. 创建订单状态变更日志表
    .createTable('employee_order_logs', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable().comment('操作员工ID');
      table.enum('action_type', [
        'created', 'updated', 'status_changed', 'assigned', 
        'commented', 'attachment_added', 'attachment_removed'
      ]).notNullable().comment('操作类型');
      table.string('old_value', 500).nullable().comment('旧值');
      table.string('new_value', 500).nullable().comment('新值');
      table.text('description').nullable().comment('操作描述');
      table.json('changes').nullable().comment('详细变更信息');
      table.timestamps(true, true);
      
      // 外键
      table.foreign('order_id').references('employee_orders.id').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      
      // 索引
      table.index(['order_id', 'created_at']);
      table.index(['user_id']);
      table.index(['action_type']);
    })
    
    // 4. 创建订单评论表
    .createTable('employee_order_comments', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable().comment('评论员工ID');
      table.text('comment').notNullable().comment('评论内容');
      table.boolean('is_internal').notNullable().defaultTo(true).comment('是否为内部评论');
      table.json('attachments').nullable().comment('附件');
      table.boolean('is_deleted').notNullable().defaultTo(false);
      table.timestamps(true, true);
      
      // 外键
      table.foreign('order_id').references('employee_orders.id').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      
      // 索引
      table.index(['order_id', 'created_at']);
      table.index(['user_id']);
    })
    
    // 5. 创建员工权限配置表
    .createTable('employee_permissions', function(table) {
      table.increments('id').primary();
      table.string('permission_key', 100).notNullable().unique().comment('权限键');
      table.string('permission_name', 200).notNullable().comment('权限名称');
      table.string('description', 500).nullable().comment('权限描述');
      table.enum('category', ['order', 'customer', 'employee', 'report', 'system'])
        .notNullable().comment('权限类别');
      table.timestamps(true, true);
      
      table.index(['category']);
    })
    
    // 6. 创建角色权限关联表
    .createTable('employee_role_permissions', function(table) {
      table.increments('id').primary();
      table.enum('role', ['employee', 'manager', 'admin']).notNullable();
      table.integer('permission_id').unsigned().notNullable();
      table.timestamps(true, true);
      
      // 外键
      table.foreign('permission_id').references('employee_permissions.id').onDelete('CASCADE');
      
      // 唯一约束
      table.unique(['role', 'permission_id']);
      
      // 索引
      table.index(['role']);
    })
    
    // 7. 创建员工统计表
    .createTable('employee_statistics', function(table) {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().notNullable();
      table.date('stat_date').notNullable().comment('统计日期');
      table.integer('orders_created').notNullable().defaultTo(0).comment('创建订单数');
      table.integer('orders_completed').notNullable().defaultTo(0).comment('完成订单数');
      table.integer('orders_cancelled').notNullable().defaultTo(0).comment('取消订单数');
      table.decimal('total_revenue', 12, 2).defaultTo(0).comment('总收入');
      table.timestamps(true, true);
      
      // 外键
      table.foreign('employee_id').references('users.id').onDelete('CASCADE');
      
      // 唯一约束
      table.unique(['employee_id', 'stat_date']);
      
      // 索引
      table.index(['stat_date']);
      table.index(['employee_id', 'stat_date']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('employee_statistics')
    .dropTableIfExists('employee_role_permissions')
    .dropTableIfExists('employee_permissions')
    .dropTableIfExists('employee_order_comments')
    .dropTableIfExists('employee_order_logs')
    .dropTableIfExists('employee_orders')
    .table('users', function(table) {
      table.dropColumn('is_employee');
      table.dropColumn('employee_role');
      table.dropColumn('employee_id');
      table.dropColumn('employee_since');
    });
};

