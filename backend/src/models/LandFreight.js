const { db } = require('../config/database');

class LandFreight {
  // ===== 车源管理 =====
  
  static async getAllTrucks(filters = {}) {
    try {
      let query = db('land_trucks')
        .where('is_active', true)
        .orderBy('available_date', 'asc');

      // 搜索功能
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.where(function() {
          this.whereRaw('LOWER(origin) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(destination) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(truck_type) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(company_name) LIKE ?', [searchTerm]);
        });
      }

      // 筛选功能
      if (filters.origin) {
        query = query.whereRaw('LOWER(origin) LIKE ?', [`%${filters.origin.toLowerCase()}%`]);
      }

      if (filters.destination) {
        query = query.whereRaw('LOWER(destination) LIKE ?', [`%${filters.destination.toLowerCase()}%`]);
      }

      if (filters.truckType) {
        query = query.whereRaw('LOWER(truck_type) LIKE ?', [`%${filters.truckType.toLowerCase()}%`]);
      }

      if (filters.serviceType) {
        query = query.where('service_type', filters.serviceType);
      }

      const trucks = await query;
      return this._transformTrucks(trucks);
    } catch (error) {
      console.error('获取车源信息失败:', error);
      throw new Error('获取车源信息失败');
    }
  }

  static async getTruckById(id) {
    try {
      const truck = await db('land_trucks')
        .where({ id, is_active: true })
        .first();
      
      return truck ? this._transformTruck(truck) : null;
    } catch (error) {
      console.error('获取车源信息失败:', error);
      throw new Error('获取车源信息失败');
    }
  }

  static async createTruck(truckData) {
    try {
      const [id] = await db('land_trucks').insert({
        user_id: truckData.userId,
        origin: truckData.origin,
        destination: truckData.destination,
        available_date: truckData.availableDate,
        truck_type: truckData.truckType,
        capacity: truckData.capacity,
        rate: truckData.rate,
        service_type: truckData.serviceType,
        company_name: truckData.companyName,
        contact_phone: truckData.contactPhone,
        contact_email: truckData.contactEmail || null,
        driver_license: truckData.driverLicense || null,
        truck_features: truckData.truckFeatures || null,
        notes: truckData.notes || null
      });

      return await this.getTruckById(id);
    } catch (error) {
      console.error('创建车源信息失败:', error);
      throw new Error('创建车源信息失败');
    }
  }

  static async updateTruck(id, truckData, userId) {
    try {
      const existingTruck = await db('land_trucks')
        .where({ id, user_id: userId, is_active: true })
        .first();

      if (!existingTruck) {
        throw new Error('车源信息不存在或无权限修改');
      }

      await db('land_trucks')
        .where({ id })
        .update({
          origin: truckData.origin,
          destination: truckData.destination,
          available_date: truckData.availableDate,
          truck_type: truckData.truckType,
          capacity: truckData.capacity,
          rate: truckData.rate,
          service_type: truckData.serviceType,
          company_name: truckData.companyName,
          contact_phone: truckData.contactPhone,
          contact_email: truckData.contactEmail || null,
          driver_license: truckData.driverLicense || null,
          truck_features: truckData.truckFeatures || null,
          notes: truckData.notes || null,
          updated_at: new Date()
        });

      return await this.getTruckById(id);
    } catch (error) {
      console.error('更新车源信息失败:', error);
      throw error;
    }
  }

  static async deleteTruck(id, userId) {
    try {
      const result = await db('land_trucks')
        .where({ id, user_id: userId, is_active: true })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      return result > 0;
    } catch (error) {
      console.error('删除车源信息失败:', error);
      throw new Error('删除车源信息失败');
    }
  }

  // ===== 货源管理 =====
  
  static async getAllLoads(filters = {}) {
    try {
      let query = db('land_freight_loads')
        .where('is_active', true)
        .orderByRaw(`
          CASE urgency 
            WHEN '特急' THEN 0 
            WHEN '紧急' THEN 1 
            WHEN '加急' THEN 2 
            WHEN '普通' THEN 3 
          END, required_date ASC
        `);

      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.where(function() {
          this.whereRaw('LOWER(origin) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(destination) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(cargo_type) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(company_name) LIKE ?', [searchTerm]);
        });
      }

      if (filters.origin) {
        query = query.whereRaw('LOWER(origin) LIKE ?', [`%${filters.origin.toLowerCase()}%`]);
      }

      if (filters.destination) {
        query = query.whereRaw('LOWER(destination) LIKE ?', [`%${filters.destination.toLowerCase()}%`]);
      }

      if (filters.cargoType) {
        query = query.whereRaw('LOWER(cargo_type) LIKE ?', [`%${filters.cargoType.toLowerCase()}%`]);
      }

      if (filters.urgency) {
        query = query.where('urgency', filters.urgency);
      }

      const loads = await query;
      return this._transformLoads(loads);
    } catch (error) {
      console.error('获取货源信息失败:', error);
      throw new Error('获取货源信息失败');
    }
  }

  static async createLoad(loadData) {
    try {
      const [id] = await db('land_freight_loads').insert({
        user_id: loadData.userId,
        origin: loadData.origin,
        destination: loadData.destination,
        required_date: loadData.requiredDate,
        weight: loadData.weight,
        cargo_type: loadData.cargoType,
        urgency: loadData.urgency,
        max_rate: loadData.maxRate,
        company_name: loadData.companyName,
        contact_phone: loadData.contactPhone,
        contact_email: loadData.contactEmail || null,
        special_requirements: loadData.specialRequirements || null,
        service_type: loadData.serviceType || null,
        notes: loadData.notes || null
      });

      return await this.getLoadById(id);
    } catch (error) {
      console.error('创建货源信息失败:', error);
      throw new Error('创建货源信息失败');
    }
  }

  static async getLoadById(id) {
    try {
      const load = await db('land_freight_loads')
        .where({ id, is_active: true })
        .first();
      
      return load ? this._transformLoad(load) : null;
    } catch (error) {
      console.error('获取货源信息失败:', error);
      throw new Error('获取货源信息失败');
    }
  }

  static async getUserPosts(userId) {
    try {
      const [trucks, loads] = await Promise.all([
        db('land_trucks').where({ user_id: userId, is_active: true }).orderBy('created_at', 'desc'),
        db('land_freight_loads').where({ user_id: userId, is_active: true }).orderBy('created_at', 'desc')
      ]);

      return {
        trucks: this._transformTrucks(trucks),
        loads: this._transformLoads(loads)
      };
    } catch (error) {
      console.error('获取用户发布信息失败:', error);
      throw new Error('获取用户发布信息失败');
    }
  }

  // ===== 数据转换方法 =====
  
  static _transformTruck(truck) {
    return {
      id: truck.id,
      origin: truck.origin,
      destination: truck.destination,
      availableDate: truck.available_date,
      truckType: truck.truck_type,
      capacity: truck.capacity,
      rate: truck.rate,
      serviceType: truck.service_type,
      company: truck.company_name,
      phone: truck.contact_phone,
      email: truck.contact_email,
      driverLicense: truck.driver_license,
      truckFeatures: truck.truck_features,
      notes: truck.notes,
      rating: parseFloat(truck.rating || 4.5),
      userId: truck.user_id,
      isActive: truck.is_active,
      createdAt: truck.created_at,
      updatedAt: truck.updated_at
    };
  }

  static _transformTrucks(trucks) {
    return trucks.map(truck => this._transformTruck(truck));
  }

  static _transformLoad(load) {
    return {
      id: load.id,
      origin: load.origin,
      destination: load.destination,
      requiredDate: load.required_date,
      weight: load.weight,
      cargoType: load.cargo_type,
      urgency: load.urgency,
      maxRate: load.max_rate,
      company: load.company_name,
      phone: load.contact_phone,
      email: load.contact_email,
      specialRequirements: load.special_requirements,
      serviceType: load.service_type,
      notes: load.notes,
      rating: parseFloat(load.rating || 4.5),
      userId: load.user_id,
      isActive: load.is_active,
      createdAt: load.created_at,
      updatedAt: load.updated_at
    };
  }

  static _transformLoads(loads) {
    return loads.map(load => this._transformLoad(load));
  }
}

module.exports = LandFreight; 