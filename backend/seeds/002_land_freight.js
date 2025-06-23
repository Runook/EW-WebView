/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 清空现有数据
  await knex('land_trucks').del();
  await knex('land_loads').del();
  
  // 插入货源数据
  await knex('land_loads').insert([
    {
      user_id: 1,
      origin: '广东省广州市',
      destination: '北京市朝阳区',
      origin_display: '广州市天河区',
      destination_display: '北京市朝阳区建国门',
      pickup_date: '2024-01-15',
      delivery_date: '2024-01-18',
      weight: '25000',
      commodity: '电子设备',
      cargo_value: '150000',
      service_type: 'FTL',
      truck_type: '厢式货车',
      rate: '8500',
      max_rate: '9000',
      company_name: '顺丰物流',
      contact_phone: '13800138001',
      contact_email: 'shipper@example.com',
      ewid: 'EWL20240115001',
      shipping_number: 'SF2024011501',
      notes: '货物贵重，请小心搬运',
      special_requirements: '需要恒温运输',
      rating: 4.8
    },
    {
      user_id: 2,
      origin: '浙江省杭州市',
      destination: '上海市浦东新区',
      origin_display: '杭州市滨江区',
      destination_display: '上海市浦东新区陆家嘴',
      pickup_date: '2024-01-16',
      delivery_date: '2024-01-17',
      weight: '15000',
      commodity: '服装纺织品',
      cargo_value: '80000',
      pallets: 12,
      service_type: 'LTL',
      truck_type: '平板车',
      rate: '3500',
      max_rate: '4000',
      company_name: '示例物流公司',
      contact_phone: '13800138003',
      contact_email: 'demo@example.com',
      ewid: 'EWL20240116001',
      shipping_number: 'DM2024011601',
      notes: '标准货物运输',
      special_requirements: '无特殊要求',
      rating: 4.5
    },
    {
      user_id: 1,
      origin: '江苏省南京市',
      destination: '四川省成都市',
      origin_display: '南京市鼓楼区',
      destination_display: '成都市高新区',
      pickup_date: '2024-01-18',
      delivery_date: '2024-01-22',
      weight: '35000',
      commodity: '机械设备',
      cargo_value: '280000',
      service_type: 'FTL',
      truck_type: '低平板车',
      rate: '12000',
      max_rate: '13500',
      company_name: '顺丰物流',
      contact_phone: '13800138001',
      contact_email: 'shipper@example.com',
      ewid: 'EWL20240118001',
      shipping_number: 'SF2024011801',
      notes: '超重货物，需专业设备',
      special_requirements: '需要起重设备协助装卸',
      rating: 4.9
    }
  ]);

  // 插入车源数据
  await knex('land_trucks').insert([
    {
      user_id: 2,
      current_location: '广东省深圳市',
      preferred_destination: '华北地区',
      available_date: '2024-01-15',
      truck_type: '厢式货车',
      equipment: '17.5米厢式货车',
      capacity: '32000',
      truck_features: '带尾板，GPS定位',
      driver_license: 'A2',
      service_type: 'FTL',
      rate_range: '3.5-4.2',
      rate: '3.8',
      company_name: '中通快递',
      contact_phone: '13800138002',
      contact_email: 'carrier@example.com',
      ewid: 'EWT20240115001',
      notes: '经验丰富司机，准时到达',
      rating: 4.7
    },
    {
      user_id: 2,
      current_location: '浙江省杭州市',
      preferred_destination: '华东地区',
      available_date: '2024-01-16',
      truck_type: '冷藏车',
      equipment: '13米冷藏车',
      capacity: '25000',
      truck_features: '温控系统，保鲜运输',
      driver_license: 'A2',
      service_type: 'FTL',
      rate_range: '4.0-5.5',
      rate: '4.5',
      company_name: '中通快递',
      contact_phone: '13800138002',
      contact_email: 'carrier@example.com',
      ewid: 'EWT20240116001',
      notes: '专业冷链运输',
      rating: 4.9
    },
    {
      user_id: 12,
      current_location: '山东省青岛市',
      preferred_destination: '全国各地',
      available_date: '2024-01-17',
      truck_type: '平板车',
      equipment: '12.5米平板车',
      capacity: '28000',
      truck_features: '可装载大型货物',
      driver_license: 'A2',
      service_type: 'FTL',
      rate_range: '3.2-4.0',
      rate: '3.6',
      company_name: '示例物流公司',
      contact_phone: '13800138003',
      contact_email: 'demo@example.com',
      ewid: 'EWT20240117001',
      notes: '适合装载建材等大型货物',
      rating: 4.6
    }
  ]);
}; 