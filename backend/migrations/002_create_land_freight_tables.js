/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // 创建货源表 (loads)
    knex.schema.createTable('land_loads', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      
      // 基本运输信息
      table.string('origin', 500).notNullable();
      table.string('destination', 500).notNullable();
      table.string('origin_display', 500); // 格式化显示地址
      table.string('destination_display', 500); // 格式化显示地址
      table.json('distance_info'); // 距离信息
      
      // 日期信息
      table.date('pickup_date').notNullable();
      table.date('delivery_date');
      
      // 货物信息
      table.string('weight', 100).notNullable();
      table.string('commodity', 255); // 货物类型
      table.string('cargo_value', 100); // 货物价值
      table.integer('pallets'); // 托盘数量 (for LTL)
      table.string('freight_class', 50); // 货物等级
      
      // 运输要求
      table.enum('service_type', ['FTL', 'LTL']).notNullable();
      table.string('truck_type', 255); // 车型要求
      table.string('equipment', 255); // 设备要求
      
      // 价格信息
      table.string('rate', 100); // 运价
      table.string('max_rate', 100); // 最高运价
      
      // 联系信息
      table.string('company_name', 255).notNullable();
      table.string('contact_phone', 50).notNullable();
      table.string('contact_email', 255);
      
      // 其他信息
      table.string('ewid', 100).unique(); // EW单号
      table.string('shipping_number', 255); // 运单号
      table.text('notes'); // 备注
      table.text('special_requirements'); // 特殊要求
      table.decimal('rating', 3, 2).defaultTo(0); // 评分
      
      // 状态
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      // 索引
      table.index(['user_id']);
      table.index(['pickup_date']);
      table.index(['service_type']);
      table.index(['is_active']);
      table.index(['ewid']);
      table.index(['origin']);
      table.index(['destination']);
    }),

    // 创建车源表 (trucks)
    knex.schema.createTable('land_trucks', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      
      // 基本信息
      table.string('current_location', 500).notNullable(); // 当前位置
      table.string('preferred_destination', 500); // 偏好目的地
      table.date('available_date').notNullable(); // 可用日期
      
      // 车辆信息
      table.string('truck_type', 255).notNullable(); // 车型
      table.string('equipment', 255).notNullable(); // 设备类型
      table.string('capacity', 100).notNullable(); // 载重能力
      table.string('truck_features', 500); // 车辆特性
      table.string('driver_license', 100); // 驾驶证类型
      
      // 服务信息
      table.enum('service_type', ['FTL', 'LTL']).notNullable();
      table.string('rate_range', 100); // 价格范围
      table.string('rate', 100); // 运价
      
      // 联系信息
      table.string('company_name', 255).notNullable();
      table.string('contact_phone', 50).notNullable();
      table.string('contact_email', 255);
      
      // 其他信息
      table.string('ewid', 100).unique(); // EW单号
      table.text('notes'); // 备注
      table.decimal('rating', 3, 2).defaultTo(0); // 评分
      
      // 状态
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      // 索引
      table.index(['user_id']);
      table.index(['available_date']);
      table.index(['service_type']);
      table.index(['is_active']);
      table.index(['ewid']);
      table.index(['current_location']);
      table.index(['preferred_destination']);
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('land_trucks'),
    knex.schema.dropTableIfExists('land_loads')
  ]);
}; 