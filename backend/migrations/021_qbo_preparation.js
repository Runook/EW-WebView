/**
 * Migration: QBO集成准备 - 增强客户表、供应商表、订单表，新建付款表和服务项目表
 * 为将来连接QuickBooks Online做数据准备
 */

exports.up = async function(knex) {
  // 1. 增强客户表 customers - 添加账单地址和付款条款
  const hasCustomers = await knex.schema.hasTable('customers');
  if (hasCustomers) {
    const hasBillingAddress = await knex.schema.hasColumn('customers', 'billing_address');
    if (!hasBillingAddress) {
      await knex.schema.table('customers', function(table) {
        table.string('billing_address', 500).nullable().comment('账单地址');
        table.string('billing_city', 100).nullable().comment('账单城市');
        table.string('billing_state', 50).nullable().comment('账单州');
        table.string('billing_zipcode', 20).nullable().comment('账单邮编');
        table.string('billing_country', 100).defaultTo('USA').comment('账单国家');
        table.string('payment_terms', 50).defaultTo('Net 30').comment('付款条款');
        table.string('tax_id', 50).nullable().comment('税号');
        table.boolean('is_active').defaultTo(true).comment('是否启用');
        table.string('qb_customer_id', 100).nullable().comment('QBO客户ID-预留');
        table.datetime('qb_synced_at').nullable().comment('QBO同步时间');
      });
      console.log('✅ 客户表增强完成');
    }
  }

  // 2. 增强卡车联系人表 truck_contacts - 添加供应商付款信息
  const hasTruckContacts = await knex.schema.hasTable('truck_contacts');
  if (hasTruckContacts) {
    const hasCompanyAddress = await knex.schema.hasColumn('truck_contacts', 'company_address');
    if (!hasCompanyAddress) {
      await knex.schema.table('truck_contacts', function(table) {
        // 地址信息
        table.string('company_address', 500).nullable().comment('公司地址');
        table.string('company_city', 100).nullable().comment('公司城市');
        table.string('company_state', 50).nullable().comment('公司州');
        table.string('company_zipcode', 20).nullable().comment('公司邮编');
        table.string('company_country', 100).defaultTo('USA').comment('公司国家');
        
        // 付款信息
        table.string('payment_method', 50).nullable().comment('付款方式: check/ach/zelle/wire');
        table.string('bank_name', 200).nullable().comment('银行名称');
        table.string('account_number', 100).nullable().comment('银行账号');
        table.string('routing_number', 50).nullable().comment('路由号');
        table.string('zelle_info', 200).nullable().comment('Zelle邮箱或电话');
        table.string('check_payable_to', 200).nullable().comment('支票抬头');
        table.text('check_mailing_address').nullable().comment('支票邮寄地址');
        
        // 税务信息
        table.string('tax_id', 50).nullable().comment('Tax ID / EIN');
        table.boolean('w9_on_file').defaultTo(false).comment('是否有W9表格');
        
        // 状态
        table.boolean('is_active').defaultTo(true).comment('是否启用');
        
        // QBO预留
        table.string('qb_vendor_id', 100).nullable().comment('QBO供应商ID-预留');
        table.datetime('qb_synced_at').nullable().comment('QBO同步时间');
      });
      console.log('✅ 卡车联系人表(供应商)增强完成');
    }
  }

  // 3. 增强订单表 employee_orders - 添加发票和付款相关字段
  const hasEmployeeOrders = await knex.schema.hasTable('employee_orders');
  if (hasEmployeeOrders) {
    const hasInvoiceNumber = await knex.schema.hasColumn('employee_orders', 'invoice_number');
    if (!hasInvoiceNumber) {
      await knex.schema.table('employee_orders', function(table) {
        // 发票信息
        table.string('invoice_number', 50).nullable().comment('发票编号');
        table.date('invoice_date').nullable().comment('发票日期');
        table.date('due_date').nullable().comment('付款到期日');
        
        // 税务
        table.decimal('tax_rate', 5, 4).defaultTo(0).comment('税率');
        table.decimal('tax_amount', 12, 2).defaultTo(0).comment('税额');
        
        // 客户付款详情
        table.string('customer_payment_method', 50).nullable().comment('客户付款方式');
        table.date('customer_payment_date').nullable().comment('客户付款日期');
        table.string('customer_payment_reference', 100).nullable().comment('客户付款参考号');
        
        // 供应商关联
        table.integer('vendor_id').unsigned().nullable().comment('关联供应商ID');
        table.date('vendor_payment_date').nullable().comment('付供应商日期');
        table.string('vendor_payment_method', 50).nullable().comment('付供应商方式');
        table.string('vendor_payment_reference', 100).nullable().comment('付供应商参考号');
        
        // QBO同步状态（如果之前没有的话）
        // table.string('qb_invoice_id', 100).nullable().comment('QBO发票ID');
        // table.string('qb_bill_id', 100).nullable().comment('QBO账单ID');
        // table.string('qb_sync_status', 20).defaultTo('pending').comment('QBO同步状态');
        // table.datetime('qb_synced_at').nullable().comment('QBO同步时间');
      });
      console.log('✅ 订单表增强完成');
    }
  }

  // 4. 创建服务项目表 service_items
  const hasServiceItems = await knex.schema.hasTable('service_items');
  if (!hasServiceItems) {
    await knex.schema.createTable('service_items', function(table) {
      table.increments('id').primary();
      table.string('item_code', 50).notNullable().unique().comment('服务代码');
      table.string('item_name', 200).notNullable().comment('服务名称');
      table.string('item_name_cn', 200).nullable().comment('服务名称(中文)');
      table.string('item_type', 50).defaultTo('service').comment('类型: service/product');
      table.text('description').nullable().comment('描述');
      table.decimal('default_rate', 12, 2).nullable().comment('默认价格');
      table.string('unit', 20).defaultTo('EA').comment('单位');
      table.boolean('is_taxable').defaultTo(false).comment('是否含税');
      table.boolean('is_active').defaultTo(true).comment('是否启用');
      table.string('qb_item_id', 100).nullable().comment('QBO Item ID-预留');
      table.integer('created_by').unsigned().nullable();
      table.timestamps(true, true);
      
      table.index(['item_code']);
      table.index(['item_type']);
      table.index(['is_active']);
    });
    console.log('✅ 服务项目表创建成功');

    // 插入默认服务项目
    await knex('service_items').insert([
      { item_code: 'LTL', item_name: 'LTL Freight', item_name_cn: 'LTL零担运输', item_type: 'service', description: 'Less Than Truckload shipping service' },
      { item_code: 'FTL', item_name: 'FTL Freight', item_name_cn: 'FTL整车运输', item_type: 'service', description: 'Full Truckload shipping service' },
      { item_code: 'FUEL', item_name: 'Fuel Surcharge', item_name_cn: '燃油附加费', item_type: 'service', description: 'Fuel surcharge fee' },
      { item_code: 'LIFTGATE', item_name: 'Liftgate Service', item_name_cn: '升降尾板服务', item_type: 'service', description: 'Liftgate pickup/delivery service' },
      { item_code: 'INSIDE', item_name: 'Inside Delivery', item_name_cn: '室内配送', item_type: 'service', description: 'Inside pickup/delivery service' },
      { item_code: 'APPT', item_name: 'Appointment', item_name_cn: '预约送货', item_type: 'service', description: 'Scheduled appointment delivery' },
      { item_code: 'RESIDENTIAL', item_name: 'Residential Delivery', item_name_cn: '住宅配送', item_type: 'service', description: 'Residential area delivery' },
      { item_code: 'LIMITED', item_name: 'Limited Access', item_name_cn: '受限区域', item_type: 'service', description: 'Limited access location fee' },
      { item_code: 'DETENTION', item_name: 'Detention Fee', item_name_cn: '滞留费', item_type: 'service', description: 'Driver detention/waiting fee' },
      { item_code: 'REDELIVERY', item_name: 'Redelivery Fee', item_name_cn: '重新配送费', item_type: 'service', description: 'Redelivery attempt fee' }
    ]);
    console.log('✅ 默认服务项目已插入');
  }

  // 5. 创建付款记录表 payments
  const hasPayments = await knex.schema.hasTable('payments');
  if (!hasPayments) {
    await knex.schema.createTable('payments', function(table) {
      table.increments('id').primary();
      table.enum('payment_type', ['customer_payment', 'vendor_payment']).notNullable().comment('付款类型');
      
      // 关联
      table.integer('order_id').unsigned().nullable().comment('关联订单ID');
      table.integer('customer_id').unsigned().nullable().comment('关联客户ID');
      table.integer('vendor_id').unsigned().nullable().comment('关联供应商ID');
      
      // 付款详情
      table.decimal('amount', 12, 2).notNullable().comment('金额');
      table.string('currency', 10).defaultTo('USD').comment('货币');
      table.date('payment_date').notNullable().comment('付款日期');
      table.string('payment_method', 50).notNullable().comment('付款方式: check/ach/zelle/wire/credit_card/cash');
      table.string('reference_number', 100).nullable().comment('参考号(支票号/交易号)');
      table.text('memo').nullable().comment('备注');
      
      // 状态
      table.enum('status', ['pending', 'completed', 'cancelled', 'refunded']).defaultTo('completed').comment('状态');
      
      // QBO预留
      table.string('qb_payment_id', 100).nullable().comment('QBO Payment ID');
      table.datetime('qb_synced_at').nullable().comment('QBO同步时间');
      
      // 审计
      table.integer('created_by').unsigned().nullable();
      table.integer('updated_by').unsigned().nullable();
      table.timestamps(true, true);
      
      // 外键
      table.foreign('order_id').references('employee_orders.id').onDelete('SET NULL');
      table.foreign('customer_id').references('customers.id').onDelete('SET NULL');
      table.foreign('vendor_id').references('truck_contacts.id').onDelete('SET NULL');
      
      // 索引
      table.index(['payment_type']);
      table.index(['order_id']);
      table.index(['customer_id']);
      table.index(['vendor_id']);
      table.index(['payment_date']);
      table.index(['status']);
    });
    console.log('✅ 付款记录表创建成功');
  }

  // 6. 创建QBO连接配置表 qbo_connections (预留)
  const hasQboConnections = await knex.schema.hasTable('qbo_connections');
  if (!hasQboConnections) {
    await knex.schema.createTable('qbo_connections', function(table) {
      table.increments('id').primary();
      table.string('realm_id', 100).notNullable().unique().comment('QBO公司ID');
      table.string('company_name', 200).nullable().comment('QBO公司名称');
      table.text('access_token').nullable().comment('访问令牌');
      table.text('refresh_token').nullable().comment('刷新令牌');
      table.datetime('access_token_expires_at').nullable().comment('访问令牌过期时间');
      table.datetime('refresh_token_expires_at').nullable().comment('刷新令牌过期时间');
      table.boolean('is_active').defaultTo(true).comment('是否激活');
      table.integer('connected_by').unsigned().nullable().comment('连接者');
      table.datetime('connected_at').nullable().comment('连接时间');
      table.datetime('last_sync_at').nullable().comment('最后同步时间');
      table.timestamps(true, true);
      
      table.index(['realm_id']);
      table.index(['is_active']);
    });
    console.log('✅ QBO连接配置表创建成功(预留)');
  }

  console.log('');
  console.log('================================================');
  console.log('✅ QBO集成准备迁移完成!');
  console.log('================================================');
  console.log('已完成:');
  console.log('  - 客户表增强 (地址、付款条款)');
  console.log('  - 供应商表增强 (付款信息)');
  console.log('  - 订单表增强 (发票、付款字段)');
  console.log('  - 服务项目表 (预设10个常用服务)');
  console.log('  - 付款记录表');
  console.log('  - QBO连接配置表 (预留)');
  console.log('================================================');
};

exports.down = async function(knex) {
  // 删除新建的表
  await knex.schema.dropTableIfExists('qbo_connections');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('service_items');
  
  // 移除客户表新增字段
  const hasCustomers = await knex.schema.hasTable('customers');
  if (hasCustomers) {
    const hasBillingAddress = await knex.schema.hasColumn('customers', 'billing_address');
    if (hasBillingAddress) {
      await knex.schema.table('customers', function(table) {
        table.dropColumn('billing_address');
        table.dropColumn('billing_city');
        table.dropColumn('billing_state');
        table.dropColumn('billing_zipcode');
        table.dropColumn('billing_country');
        table.dropColumn('payment_terms');
        table.dropColumn('tax_id');
        table.dropColumn('is_active');
        table.dropColumn('qb_customer_id');
        table.dropColumn('qb_synced_at');
      });
    }
  }
  
  // 移除卡车联系人表新增字段
  const hasTruckContacts = await knex.schema.hasTable('truck_contacts');
  if (hasTruckContacts) {
    const hasCompanyAddress = await knex.schema.hasColumn('truck_contacts', 'company_address');
    if (hasCompanyAddress) {
      await knex.schema.table('truck_contacts', function(table) {
        table.dropColumn('company_address');
        table.dropColumn('company_city');
        table.dropColumn('company_state');
        table.dropColumn('company_zipcode');
        table.dropColumn('company_country');
        table.dropColumn('payment_method');
        table.dropColumn('bank_name');
        table.dropColumn('account_number');
        table.dropColumn('routing_number');
        table.dropColumn('zelle_info');
        table.dropColumn('check_payable_to');
        table.dropColumn('check_mailing_address');
        table.dropColumn('tax_id');
        table.dropColumn('w9_on_file');
        table.dropColumn('is_active');
        table.dropColumn('qb_vendor_id');
        table.dropColumn('qb_synced_at');
      });
    }
  }
  
  // 移除订单表新增字段
  const hasEmployeeOrders = await knex.schema.hasTable('employee_orders');
  if (hasEmployeeOrders) {
    const hasInvoiceNumber = await knex.schema.hasColumn('employee_orders', 'invoice_number');
    if (hasInvoiceNumber) {
      await knex.schema.table('employee_orders', function(table) {
        table.dropColumn('invoice_number');
        table.dropColumn('invoice_date');
        table.dropColumn('due_date');
        table.dropColumn('tax_rate');
        table.dropColumn('tax_amount');
        table.dropColumn('customer_payment_method');
        table.dropColumn('customer_payment_date');
        table.dropColumn('customer_payment_reference');
        table.dropColumn('vendor_id');
        table.dropColumn('vendor_payment_date');
        table.dropColumn('vendor_payment_method');
        table.dropColumn('vendor_payment_reference');
      });
    }
  }
  
  console.log('✅ QBO集成准备迁移已回滚');
};

