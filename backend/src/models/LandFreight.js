const { db: knex } = require('../config/database');

/**
 * 陆运数据模型
 * 处理货源(loads)和车源(trucks)数据的CRUD操作
 */
class LandFreight {
  
  // ===== 货源管理 =====
  
  /**
   * 获取所有货源信息
   * @param {Object} filters - 查询筛选条件
   * @returns {Promise<Array>} 货源列表
   */
  static async getAllLoads(filters = {}) {
    try {
      let query = knex('land_loads')
        .select(
          'land_loads.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'land_loads.user_id', 'users.id')
        .where('land_loads.is_active', true)
        .orderBy('land_loads.created_at', 'desc');

      // 应用筛选条件
      if (filters.origin) {
        query = query.where('origin', 'ilike', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.where('destination', 'ilike', `%${filters.destination}%`);
      }
      if (filters.serviceType) {
        query = query.where('service_type', filters.serviceType);
      }
      if (filters.dateFrom) {
        query = query.where('pickup_date', '>=', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.where('pickup_date', '<=', filters.dateTo);
      }

      const loads = await query;
      
      // 转换数据格式以匹配前端期望
      return loads.map(load => this.formatLoadForFrontend(load));
    } catch (error) {
      console.error('获取货源列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取货源信息
   * @param {number} id - 货源ID
   * @returns {Promise<Object|null>} 货源信息
   */
  static async getLoadById(id) {
    try {
      const load = await knex('land_loads')
        .select(
          'land_loads.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'land_loads.user_id', 'users.id')
        .where('land_loads.id', id)
        .where('land_loads.is_active', true)
        .first();

      return load ? this.formatLoadForFrontend(load) : null;
    } catch (error) {
      console.error('获取货源详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新货源
   * @param {Object} loadData - 货源数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 创建的货源信息
   */
  static async createLoad(loadData, userId) {
    try {
      // 生成EWID
      const ewid = await this.generateEWID('L');
      
      // 准备数据库数据
      const dbData = {
        user_id: userId,
        origin: loadData.origin,
        destination: loadData.destination,
        origin_display: loadData.originDisplay || loadData.origin,
        destination_display: loadData.destinationDisplay || loadData.destination,
        distance_info: loadData.distanceInfo ? 
          (typeof loadData.distanceInfo === 'string' ? loadData.distanceInfo : 
           (typeof loadData.distanceInfo === 'object' ? JSON.stringify(loadData.distanceInfo) : null)) : null,
        pickup_date: loadData.requiredDate || loadData.pickupDate,
        delivery_date: loadData.deliveryDate,
        weight: loadData.weight,
        commodity: loadData.cargoType || loadData.commodity,
        cargo_value: loadData.cargoValue,
        pallets: loadData.pallets,
        freight_class: loadData.freightClass,
        service_type: loadData.serviceType,
        truck_type: loadData.truckType,
        equipment: loadData.equipment,
        rate: loadData.rate,
        max_rate: loadData.maxRate,
        company_name: loadData.companyName,
        contact_phone: loadData.contactPhone,
        contact_email: loadData.contactEmail,
        ewid: ewid,
        shipping_number: loadData.shippingNumber,
        notes: loadData.notes,
        special_requirements: loadData.specialRequirements,
        rating: 0
      };

      const [newLoad] = await knex('land_loads')
        .insert(dbData)
        .returning('*');

      // 获取完整数据并格式化
      const fullLoad = await this.getLoadById(newLoad.id);
      return fullLoad;
    } catch (error) {
      console.error('创建货源失败:', error);
      throw error;
    }
  }

  /**
   * 更新货源信息
   * @param {number} id - 货源ID
   * @param {Object} loadData - 更新数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 更新后的货源信息
   */
  static async updateLoad(id, loadData, userId) {
    try {
      // 检查权限
      const existing = await knex('land_loads')
        .where('id', id)
        .where('user_id', userId)
        .where('is_active', true)
        .first();

      if (!existing) {
        throw new Error('货源不存在或无权限修改');
      }

      // 准备更新数据
      const updateData = {
        origin: loadData.origin,
        destination: loadData.destination,
        origin_display: loadData.originDisplay || loadData.origin,
        destination_display: loadData.destinationDisplay || loadData.destination,
        distance_info: loadData.distanceInfo ? 
          (typeof loadData.distanceInfo === 'string' ? loadData.distanceInfo : 
           (typeof loadData.distanceInfo === 'object' ? JSON.stringify(loadData.distanceInfo) : null)) : null,
        pickup_date: loadData.requiredDate || loadData.pickupDate,
        delivery_date: loadData.deliveryDate,
        weight: loadData.weight,
        commodity: loadData.cargoType || loadData.commodity,
        cargo_value: loadData.cargoValue,
        pallets: loadData.pallets,
        freight_class: loadData.freightClass,
        service_type: loadData.serviceType,
        truck_type: loadData.truckType,
        equipment: loadData.equipment,
        rate: loadData.rate,
        max_rate: loadData.maxRate,
        company_name: loadData.companyName,
        contact_phone: loadData.contactPhone,
        contact_email: loadData.contactEmail,
        shipping_number: loadData.shippingNumber,
        notes: loadData.notes,
        special_requirements: loadData.specialRequirements,
        updated_at: knex.fn.now()
      };

      await knex('land_loads')
        .where('id', id)
        .update(updateData);

      // 返回更新后的数据
      return await this.getLoadById(id);
    } catch (error) {
      console.error('更新货源失败:', error);
      throw error;
    }
  }

  /**
   * 删除货源 (软删除)
   * @param {number} id - 货源ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async deleteLoad(id, userId) {
    try {
      const result = await knex('land_loads')
        .where('id', id)
        .where('user_id', userId)
        .update({
          is_active: false,
          updated_at: knex.fn.now()
        });

      return result > 0;
    } catch (error) {
      console.error('删除货源失败:', error);
      throw error;
    }
  }

  // ===== 车源管理 =====

  /**
   * 获取所有车源信息
   * @param {Object} filters - 查询筛选条件
   * @returns {Promise<Array>} 车源列表
   */
  static async getAllTrucks(filters = {}) {
    try {
      let query = knex('land_trucks')
        .select(
          'land_trucks.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'land_trucks.user_id', 'users.id')
        .where('land_trucks.is_active', true)
        .orderBy('land_trucks.created_at', 'desc');

      // 应用筛选条件
      if (filters.location) {
        query = query.where('current_location', 'ilike', `%${filters.location}%`);
      }
      if (filters.destination) {
        query = query.where('preferred_destination', 'ilike', `%${filters.destination}%`);
      }
      if (filters.serviceType) {
        query = query.where('service_type', filters.serviceType);
      }
      if (filters.dateFrom) {
        query = query.where('available_date', '>=', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.where('available_date', '<=', filters.dateTo);
      }

      const trucks = await query;
      
      // 转换数据格式以匹配前端期望
      return trucks.map(truck => this.formatTruckForFrontend(truck));
    } catch (error) {
      console.error('获取车源列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取车源信息
   * @param {number} id - 车源ID
   * @returns {Promise<Object|null>} 车源信息
   */
  static async getTruckById(id) {
    try {
      const truck = await knex('land_trucks')
        .select(
          'land_trucks.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'land_trucks.user_id', 'users.id')
        .where('land_trucks.id', id)
        .where('land_trucks.is_active', true)
        .first();

      return truck ? this.formatTruckForFrontend(truck) : null;
    } catch (error) {
      console.error('获取车源详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新车源
   * @param {Object} truckData - 车源数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 创建的车源信息
   */
  static async createTruck(truckData, userId) {
    try {
      // 生成EWID
      const ewid = await this.generateEWID('T');
      
      // 准备数据库数据
      const dbData = {
        user_id: userId,
        current_location: truckData.currentLocation || truckData.origin,
        preferred_destination: truckData.preferredDestination || truckData.destination || '全国各地',
        available_date: truckData.availableDate,
        truck_type: truckData.truckType,
        equipment: truckData.equipment || truckData.truckType,
        capacity: truckData.capacity,
        truck_features: truckData.truckFeatures,
        driver_license: truckData.driverLicense,
        service_type: truckData.serviceType,
        rate_range: truckData.rateRange,
        rate: truckData.rate,
        company_name: truckData.companyName,
        contact_phone: truckData.contactPhone,
        contact_email: truckData.contactEmail,
        ewid: ewid,
        notes: truckData.notes,
        rating: 0
      };

      const [newTruck] = await knex('land_trucks')
        .insert(dbData)
        .returning('*');

      // 获取完整数据并格式化
      const fullTruck = await this.getTruckById(newTruck.id);
      return fullTruck;
    } catch (error) {
      console.error('创建车源失败:', error);
      throw error;
    }
  }

  /**
   * 更新车源信息
   * @param {number} id - 车源ID
   * @param {Object} truckData - 更新数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 更新后的车源信息
   */
  static async updateTruck(id, truckData, userId) {
    try {
      // 检查权限
      const existing = await knex('land_trucks')
        .where('id', id)
        .where('user_id', userId)
        .where('is_active', true)
        .first();

      if (!existing) {
        throw new Error('车源不存在或无权限修改');
      }

      // 准备更新数据
      const updateData = {
        current_location: truckData.currentLocation || truckData.origin,
        preferred_destination: truckData.preferredDestination || truckData.destination,
        available_date: truckData.availableDate,
        truck_type: truckData.truckType,
        equipment: truckData.equipment || truckData.truckType,
        capacity: truckData.capacity,
        truck_features: truckData.truckFeatures,
        driver_license: truckData.driverLicense,
        service_type: truckData.serviceType,
        rate_range: truckData.rateRange,
        rate: truckData.rate,
        company_name: truckData.companyName,
        contact_phone: truckData.contactPhone,
        contact_email: truckData.contactEmail,
        notes: truckData.notes,
        updated_at: knex.fn.now()
      };

      await knex('land_trucks')
        .where('id', id)
        .update(updateData);

      // 返回更新后的数据
      return await this.getTruckById(id);
    } catch (error) {
      console.error('更新车源失败:', error);
      throw error;
    }
  }

  /**
   * 删除车源 (软删除)
   * @param {number} id - 车源ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async deleteTruck(id, userId) {
    try {
      const result = await knex('land_trucks')
        .where('id', id)
        .where('user_id', userId)
        .update({
          is_active: false,
          updated_at: knex.fn.now()
        });

      return result > 0;
    } catch (error) {
      console.error('删除车源失败:', error);
      throw error;
    }
  }

  // ===== 用户相关查询 =====

  /**
   * 获取用户发布的信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 包含loads和trucks的对象
   */
  static async getUserPosts(userId) {
    try {
      const [loads, trucks] = await Promise.all([
        knex('land_loads')
          .where('user_id', userId)
          .where('is_active', true)
          .orderBy('created_at', 'desc'),
        knex('land_trucks')
          .where('user_id', userId)
          .where('is_active', true)
          .orderBy('created_at', 'desc')
      ]);

      return {
        loads: loads.map(load => this.formatLoadForFrontend(load)),
        trucks: trucks.map(truck => this.formatTruckForFrontend(truck))
      };
    } catch (error) {
      console.error('获取用户发布信息失败:', error);
      throw error;
    }
  }

  // ===== 辅助方法 =====

  /**
   * 生成EWID编号
   * @param {string} type - 类型 (L=Load, T=Truck)
   * @returns {Promise<string>} EWID编号
   */
  static async generateEWID(type = 'L') {
    try {
      // 获取今天的日期字符串
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // 查询今天已有的相同类型记录数量
      const table = type === 'L' ? 'land_loads' : 'land_trucks';
      const count = await knex(table)
        .whereRaw(`DATE(created_at) = CURRENT_DATE`)
        .count('* as total');
      
      const sequence = (parseInt(count[0].total) + 1).toString().padStart(3, '0');
      return `EW${type}${today}${sequence}`;
    } catch (error) {
      console.error('生成EWID失败:', error);
      // 备用方案：使用时间戳
      const timestamp = Date.now().toString().slice(-6);
      return `EW${type}${timestamp}`;
    }
  }

  /**
   * 格式化货源数据以匹配前端期望
   * @param {Object} load - 数据库中的货源数据
   * @returns {Object} 格式化后的货源数据
   */
  static formatLoadForFrontend(load) {
    let distanceInfo = null;
    if (load.distance_info) {
      try {
        distanceInfo = typeof load.distance_info === 'string' ? JSON.parse(load.distance_info) : load.distance_info;
      } catch (error) {
        console.error('解析distance_info失败:', error, 'data:', load.distance_info);
        distanceInfo = null;
      }
    }

    return {
      id: load.id,
      origin: load.origin,
      destination: load.destination,
      originDisplay: load.origin_display || load.origin,
      destinationDisplay: load.destination_display || load.destination,
      distanceInfo: distanceInfo,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      weight: load.weight,
      commodity: load.commodity,
      cargoValue: load.cargo_value,
      pallets: load.pallets,
      freightClass: load.freight_class,
      serviceType: load.service_type,
      truckType: load.truck_type,
      equipment: load.equipment,
      rate: load.rate,
      maxRate: load.max_rate,
      company: load.company_name,
      phone: load.contact_phone,
      contactEmail: load.contact_email,
      EWID: load.ewid,
      shippingNumber: load.shipping_number,
      notes: load.notes,
      specialRequirements: load.special_requirements,
      rating: load.rating,
      publicationDate: load.created_at,
      postedTime: this.formatTimeAgo(load.created_at),
      // 保持向后兼容
      originalData: {
        deliveryDate: load.delivery_date,
        shippingNumber: load.shipping_number,
        contactEmail: load.contact_email,
        notes: load.notes,
        pallets: load.pallets,
        cargoValue: load.cargo_value,
        freightClass: load.freight_class
      }
    };
  }

  /**
   * 格式化车源数据以匹配前端期望
   * @param {Object} truck - 数据库中的车源数据
   * @returns {Object} 格式化后的车源数据
   */
  static formatTruckForFrontend(truck) {
    return {
      id: truck.id,
      location: truck.current_location,
      destination: truck.preferred_destination || '全国各地',
      availableDate: truck.available_date,
      equipment: truck.equipment,
      capacity: truck.capacity,
      serviceType: truck.service_type,
      rateRange: truck.rate_range,
      rate: truck.rate,
      company: truck.company_name,
      phone: truck.contact_phone,
      contactEmail: truck.contact_email,
      rating: truck.rating,
      EWID: truck.ewid,
      notes: truck.notes,
      publicationDate: truck.created_at,
      postedTime: this.formatTimeAgo(truck.created_at),
      // 保持向后兼容
      originalData: {
        truckType: truck.truck_type,
        truckFeatures: truck.truck_features,
        driverLicense: truck.driver_license,
        contactEmail: truck.contact_email,
        notes: truck.notes
      }
    };
  }

  /**
   * 格式化时间差显示
   * @param {string|Date} date - 日期
   * @returns {string} 格式化的时间差
   */
  static formatTimeAgo(date) {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
      return diffInMinutes <= 0 ? '刚刚发布' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  }
}

module.exports = LandFreight; 