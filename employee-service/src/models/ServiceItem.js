const { db } = require('../config/database');

/**
 * 服务项目模型 - 用于QBO的Item
 */
class ServiceItem {
  /**
   * 获取所有服务项目
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 服务项目列表
   */
  static async getAll(filters = {}) {
    try {
      let query = db('service_items');
      
      // 只显示启用的
      if (filters.activeOnly) {
        query = query.where('is_active', true);
      }
      
      // 按类型过滤
      if (filters.item_type) {
        query = query.where('item_type', filters.item_type);
      }
      
      // 搜索
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('item_code', 'ilike', searchTerm)
            .orWhere('item_name', 'ilike', searchTerm)
            .orWhere('item_name_cn', 'ilike', searchTerm);
        });
      }
      
      // 排序
      query = query.orderBy('item_code', 'asc');
      
      const items = await query.select('*');
      return items;
    } catch (error) {
      console.error('获取服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 通过ID获取服务项目
   * @param {number} id - 服务项目ID
   * @returns {Promise<Object>} 服务项目
   */
  static async getById(id) {
    try {
      const item = await db('service_items')
        .where('id', id)
        .first();
      
      if (!item) {
        throw new Error('服务项目不存在');
      }
      
      return item;
    } catch (error) {
      console.error('获取服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 通过代码获取服务项目
   * @param {string} code - 服务项目代码
   * @returns {Promise<Object>} 服务项目
   */
  static async getByCode(code) {
    try {
      const item = await db('service_items')
        .where('item_code', code.toUpperCase())
        .first();
      
      return item;
    } catch (error) {
      console.error('获取服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 创建服务项目
   * @param {Object} data - 服务项目数据
   * @param {number} createdBy - 创建者ID
   * @returns {Promise<Object>} 创建的服务项目
   */
  static async create(data, createdBy) {
    try {
      // 检查代码是否已存在
      const existing = await this.getByCode(data.item_code);
      if (existing) {
        throw new Error(`服务代码 "${data.item_code}" 已存在`);
      }
      
      const insertData = {
        item_code: data.item_code.toUpperCase().trim(),
        item_name: data.item_name.trim(),
        item_name_cn: data.item_name_cn?.trim() || null,
        item_type: data.item_type || 'service',
        description: data.description?.trim() || null,
        default_rate: data.default_rate || null,
        unit: data.unit || 'EA',
        is_taxable: data.is_taxable || false,
        is_active: data.is_active !== false,
        created_by: createdBy
      };
      
      const [item] = await db('service_items')
        .insert(insertData)
        .returning('*');
      
      console.log(`✅ 服务项目创建成功: ${item.item_code}`);
      return item;
    } catch (error) {
      console.error('创建服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 更新服务项目
   * @param {number} id - 服务项目ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新后的服务项目
   */
  static async update(id, data) {
    try {
      const allowedFields = [
        'item_name', 'item_name_cn', 'item_type', 'description',
        'default_rate', 'unit', 'is_taxable', 'is_active'
      ];
      
      const updateData = { updated_at: new Date() };
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
        }
      });
      
      // item_code不允许修改，但如果传了要检查
      if (data.item_code) {
        const existing = await db('service_items').where('id', id).first();
        if (existing && existing.item_code !== data.item_code.toUpperCase()) {
          throw new Error('服务代码不允许修改');
        }
      }
      
      const [item] = await db('service_items')
        .where('id', id)
        .update(updateData)
        .returning('*');
      
      if (!item) {
        throw new Error('服务项目不存在');
      }
      
      console.log(`✅ 服务项目更新成功: ${item.item_code}`);
      return item;
    } catch (error) {
      console.error('更新服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 删除服务项目
   * @param {number} id - 服务项目ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    try {
      const deleted = await db('service_items')
        .where('id', id)
        .del();
      
      if (!deleted) {
        throw new Error('服务项目不存在');
      }
      
      return { success: true, message: '服务项目已删除' };
    } catch (error) {
      console.error('删除服务项目失败:', error);
      throw error;
    }
  }

  /**
   * 切换服务项目状态
   * @param {number} id - 服务项目ID
   * @returns {Promise<Object>} 更新后的服务项目
   */
  static async toggleActive(id) {
    try {
      const item = await this.getById(id);
      
      const [updated] = await db('service_items')
        .where('id', id)
        .update({ is_active: !item.is_active, updated_at: new Date() })
        .returning('*');
      
      return updated;
    } catch (error) {
      console.error('切换服务项目状态失败:', error);
      throw error;
    }
  }
}

module.exports = ServiceItem;

