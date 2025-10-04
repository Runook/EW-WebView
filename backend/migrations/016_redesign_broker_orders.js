/**
 * Migration: 重新设计订单表 - Broker专用字段
 * 添加陆运broker订单管理所需的所有字段
 */

exports.up = function(knex) {
  return knex.schema
    .table('employee_orders', function(table) {
      // 基础报价信息
      table.date('quote_date').comment('报价日期');
      table.string('inquiry_company', 200).comment('询价公司');
      table.string('ew_quote_number', 100).comment('EW报价单号');
      table.string('shipment_number', 100).comment('发货单号');
      
      // 替换原有的简单字段
      table.dropColumn('cargo_description');
      table.dropColumn('cargo_weight');
      table.dropColumn('cargo_volume');
      table.dropColumn('cargo_quantity');
      table.dropColumn('cargo_unit');
      
      // 货物详细信息
      table.text('cargo_description_detailed').comment('货物描述');
      table.text('weight_list').comment('重量列表（JSON数组，支持批量粘贴）');
      table.decimal('total_weight_lbs', 12, 2).comment('总重量（lbs）');
      table.text('dimensions_list').comment('尺寸列表（JSON数组，支持批量粘贴）');
      table.decimal('total_volume', 12, 2).comment('总体积');
      table.decimal('cargo_value', 12, 2).comment('货值');
      
      // 地址详细信息
      table.enum('address_type', ['Residential', 'Commercial', 'Warehouse'])
        .defaultTo('Commercial')
        .comment('地址类型');
      
      // 报价和成本信息
      table.decimal('ew_quote_price', 12, 2).comment('EW报价');
      table.integer('actual_pallets').comment('实际板数');
      table.decimal('total_dat', 12, 2).comment('TOTAL DAT');
      table.decimal('driver_payment', 12, 2).comment('支付司机价格');
      table.string('truck_size', 50).comment('车尺寸');
      
      // 平台报价
      table.decimal('platform_quote_1', 12, 2).comment('平台第一报价');
      table.decimal('platform_quote_2', 12, 2).comment('平台第二报价');
      table.decimal('pre_quote_price', 12, 2).comment('预报价格');
      table.decimal('ew_final_price', 12, 2).comment('EW价格');
      
      // DAT销售记录
      table.decimal('dat_sales_1', 12, 2).comment('DAT SALES 1');
      table.decimal('dat_sales_2', 12, 2).comment('DAT SALES 2');
      table.decimal('dat_sales_3', 12, 2).comment('DAT SALES 3');
      
      // 利润计算
      table.decimal('profit', 12, 2).comment('利润');
      
      // 订单状态重新定义
      // status: 'quote' | 'ordered' | 'completed'
      // sub_status: 'waiting_driver' | 'driver_found' | 'in_transit' (仅当status='ordered'时有效)
      table.dropColumn('status');
      table.enum('status', ['quote', 'ordered', 'completed'])
        .notNullable()
        .defaultTo('quote')
        .comment('主状态：报价单、已下单、已完成');
      
      table.enum('sub_status', ['waiting_driver', 'driver_found', 'in_transit'])
        .nullable()
        .comment('子状态（仅已下单时）：等待司机、找到司机、运输中');
      
      // 操作员工追踪
      table.integer('confirmed_by').unsigned().nullable().comment('确认下单的员工ID');
      table.timestamp('confirmed_at').nullable().comment('确认下单时间');
      table.integer('completed_by').unsigned().nullable().comment('标记完成的员工ID');
      table.timestamp('completed_at').nullable().comment('完成时间');
      
      // 添加外键
      table.foreign('confirmed_by').references('users.id').onDelete('SET NULL');
      table.foreign('completed_by').references('users.id').onDelete('SET NULL');
      
      // 添加索引
      table.index(['status', 'sub_status']);
      table.index(['ew_quote_number']);
      table.index(['shipment_number']);
      table.index(['quote_date']);
      table.index(['confirmed_by']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('employee_orders', function(table) {
      // 移除新增字段
      table.dropColumn('quote_date');
      table.dropColumn('inquiry_company');
      table.dropColumn('ew_quote_number');
      table.dropColumn('shipment_number');
      table.dropColumn('cargo_description_detailed');
      table.dropColumn('weight_list');
      table.dropColumn('total_weight_lbs');
      table.dropColumn('dimensions_list');
      table.dropColumn('total_volume');
      table.dropColumn('cargo_value');
      table.dropColumn('address_type');
      table.dropColumn('ew_quote_price');
      table.dropColumn('actual_pallets');
      table.dropColumn('total_dat');
      table.dropColumn('driver_payment');
      table.dropColumn('truck_size');
      table.dropColumn('platform_quote_1');
      table.dropColumn('platform_quote_2');
      table.dropColumn('pre_quote_price');
      table.dropColumn('ew_final_price');
      table.dropColumn('dat_sales_1');
      table.dropColumn('dat_sales_2');
      table.dropColumn('dat_sales_3');
      table.dropColumn('profit');
      table.dropColumn('sub_status');
      table.dropColumn('confirmed_by');
      table.dropColumn('confirmed_at');
      table.dropColumn('completed_by');
      table.dropColumn('completed_at');
      
      // 恢复原有字段
      table.text('cargo_description');
      table.decimal('cargo_weight', 10, 2);
      table.decimal('cargo_volume', 10, 2);
      table.integer('cargo_quantity');
      table.string('cargo_unit', 50);
      
      // 恢复原有status定义
      table.dropColumn('status');
      table.enum('status', ['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'on_hold'])
        .notNullable()
        .defaultTo('draft');
    });
};

