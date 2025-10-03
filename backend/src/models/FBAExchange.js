const { db } = require('../config/database');

class FBAExchange {
  static async create(data) {
    try {
      const [newExchange] = await db('fba_exchanges').insert({
        user_id: data.user_id,
        fba_location_id: data.fba_location_id,
        fba_code: data.fba_code,
        exchange_type: data.exchange_type,
        pricing_strategy: data.pricing_strategy,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        time_zone: data.time_zone,
        cargo_type: data.cargo_type,
        description: data.description,
        is_urgent: data.is_urgent || false,
        expires_at: data.expires_at
      }).returning('*');
      
      return newExchange;
    } catch (error) {
      throw new Error(`创建FBA交换记录失败: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = db('fba_exchanges')
        .select('*')
        .orderBy('created_at', 'desc');

      // 应用筛选条件
      if (filters.fba_code) {
        query = query.where('fba_code', 'ilike', `%${filters.fba_code}%`);
      }

      if (filters.exchange_type) {
        query = query.where('exchange_type', filters.exchange_type);
      }

      if (filters.cargo_type) {
        query = query.where('cargo_type', filters.cargo_type);
      }

      if (filters.pricing_strategy) {
        query = query.where('pricing_strategy', filters.pricing_strategy);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('fba_code', 'ilike', `%${filters.search}%`)
              .orWhere('description', 'ilike', `%${filters.search}%`)
              .orWhere('contact_person', 'ilike', `%${filters.search}%`);
        });
      }

      return await query;
    } catch (error) {
      throw new Error(`查询FBA交换记录失败: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const exchange = await db('fba_exchanges')
        .select('*')
        .where('id', id)
        .first();

      if (exchange) {
        // 增加浏览次数
        await this.incrementViewCount(id);
      }

      return exchange;
    } catch (error) {
      throw new Error(`查询FBA交换记录失败: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      return await db('fba_exchanges')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');
    } catch (error) {
      throw new Error(`查询用户FBA交换记录失败: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      await db('fba_exchanges')
        .where('id', id)
        .update({
          ...data,
          updated_at: new Date()
        });
      
      return await this.findById(id);
    } catch (error) {
      throw new Error(`更新FBA交换记录失败: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      // 硬删除：真正从数据库中删除记录
      return await db('fba_exchanges')
        .where('id', id)
        .del();
    } catch (error) {
      throw new Error(`删除FBA交换记录失败: ${error.message}`);
    }
  }

  static async incrementViewCount(id) {
    try {
      return await db('fba_exchanges')
        .where('id', id)
        .increment('view_count', 1);
    } catch (error) {
      console.warn(`增加浏览次数失败: ${error.message}`);
    }
  }

  static async getStats() {
    try {
      const stats = await db('fba_exchanges')
        .select(
          db.raw('COUNT(*) as total_exchanges'),
          db.raw('COUNT(*) FILTER (WHERE exchange_type = ?) as supply_count', ['出让预约']),
          db.raw('COUNT(*) FILTER (WHERE exchange_type = ?) as demand_count', ['寻求预约']),
          db.raw('COUNT(*) FILTER (WHERE is_urgent = true) as urgent_count')
        )
        .first();

      return {
        total_exchanges: parseInt(stats.total_exchanges) || 0,
        supply_count: parseInt(stats.supply_count) || 0,
        demand_count: parseInt(stats.demand_count) || 0,
        urgent_count: parseInt(stats.urgent_count) || 0
      };
    } catch (error) {
      throw new Error(`获取统计数据失败: ${error.message}`);
    }
  }

  static async cleanupExpired() {
    try {
      // 硬删除过期记录
      return await db('fba_exchanges')
        .where('expires_at', '<', new Date())
        .del();
    } catch (error) {
      throw new Error(`清理过期记录失败: ${error.message}`);
    }
  }
}

module.exports = FBAExchange;