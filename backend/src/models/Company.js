const { db: knex } = require('../config/database');

/**
 * 商家黄页数据模型
 * 处理企业信息的CRUD操作
 */
class Company {
  
  /**
   * 获取所有企业信息
   * @param {Object} filters - 查询筛选条件
   * @returns {Promise<Array>} 企业列表
   */
  static async getAllCompanies(filters = {}) {
    try {
      let query = knex('companies')
        .select(
          'companies.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email',
          // 添加premium信息
          'premium_posts.premium_type',
          'premium_posts.end_time as premium_end_time'
        )
        .leftJoin('users', 'companies.user_id', 'users.id')
        .leftJoin('premium_posts', function() {
          this.on('premium_posts.post_type', '=', knex.raw("'company'"))
              .andOn('premium_posts.post_id', '=', 'companies.id')
              .andOn('premium_posts.is_active', '=', knex.raw('true'))
              .andOn('premium_posts.end_time', '>', knex.raw('NOW()'));
        })
        .where('companies.is_active', true)
        .orderBy('companies.is_premium', 'desc')
        .orderBy('companies.created_at', 'desc');

      // 应用筛选条件
      if (filters.category) {
        query = query.where('category', filters.category);
      }
      if (filters.subcategory) {
        query = query.where('subcategory', filters.subcategory);
      }
      if (filters.search) {
        query = query.where(function() {
          this.where('name', 'ilike', `%${filters.search}%`)
              .orWhere('description', 'ilike', `%${filters.search}%`)
              .orWhere('address', 'ilike', `%${filters.search}%`);
        });
      }
      if (filters.verified !== undefined) {
        query = query.where('verified', filters.verified);
      }

      const companies = await query;
      
      // 转换数据格式以匹配前端期望
      return companies.map(company => this.formatCompanyForFrontend(company));
    } catch (error) {
      console.error('获取企业列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据子分类获取企业信息
   * @param {string} subcategory - 子分类名称
   * @param {Object} filters - 其他筛选条件
   * @returns {Promise<Array>} 企业列表
   */
  static async getCompaniesBySubcategory(subcategory, filters = {}) {
    try {
      return await this.getAllCompanies({
        ...filters,
        subcategory: subcategory
      });
    } catch (error) {
      console.error('根据子分类获取企业失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取企业信息
   * @param {number} id - 企业ID
   * @returns {Promise<Object|null>} 企业信息
   */
  static async getCompanyById(id) {
    try {
      const company = await knex('companies')
        .select(
          'companies.*',
          'users.first_name',
          'users.last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'companies.user_id', 'users.id')
        .where('companies.id', id)
        .where('companies.is_active', true)
        .first();

      if (company) {
        // 增加查看次数
        await this.incrementViews(id);
        return this.formatCompanyForFrontend(company);
      }
      
      return null;
    } catch (error) {
      console.error('获取企业详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新企业
   * @param {Object} companyData - 企业数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 创建的企业信息
   */
  static async createCompany(companyData, userId) {
    try {
      // 准备数据库数据
      const dbData = {
        user_id: userId,
        name: companyData.name,
        description: companyData.description,
        category: companyData.category,
        subcategory: companyData.subcategory,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address,
        website: companyData.website || null,
        notes: companyData.notes || null,
        services: companyData.services ? JSON.stringify(companyData.services) : null,
        business_hours: companyData.businessHours ? JSON.stringify(companyData.businessHours) : null
      };

      const [newCompany] = await knex('companies')
        .insert(dbData)
        .returning('*');

      // 获取完整数据并格式化
      const fullCompany = await this.getCompanyById(newCompany.id);
      return fullCompany;
    } catch (error) {
      console.error('创建企业失败:', error);
      throw error;
    }
  }

  /**
   * 更新企业信息
   * @param {number} id - 企业ID
   * @param {Object} companyData - 更新数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 更新后的企业信息
   */
  static async updateCompany(id, companyData, userId) {
    try {
      // 检查权限
      const existing = await knex('companies')
        .where('id', id)
        .where('user_id', userId)
        .where('is_active', true)
        .first();

      if (!existing) {
        throw new Error('企业不存在或无权限修改');
      }

      // 准备更新数据
      const updateData = {
        name: companyData.name,
        description: companyData.description,
        category: companyData.category,
        subcategory: companyData.subcategory,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address,
        website: companyData.website || null,
        notes: companyData.notes || null,
        services: companyData.services ? JSON.stringify(companyData.services) : null,
        business_hours: companyData.businessHours ? JSON.stringify(companyData.businessHours) : null,
        updated_at: knex.fn.now()
      };

      await knex('companies')
        .where('id', id)
        .update(updateData);

      // 返回更新后的数据
      return await this.getCompanyById(id);
    } catch (error) {
      console.error('更新企业失败:', error);
      throw error;
    }
  }

  /**
   * 删除企业 (软删除)
   * @param {number} id - 企业ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async deleteCompany(id, userId) {
    try {
      const result = await knex('companies')
        .where('id', id)
        .where('user_id', userId)
        .update({
          is_active: false,
          updated_at: knex.fn.now()
        });

      return result > 0;
    } catch (error) {
      console.error('删除企业失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户发布的企业信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 企业列表
   */
  static async getUserCompanies(userId) {
    try {
      const companies = await knex('companies')
        .where('user_id', userId)
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      return companies.map(company => this.formatCompanyForFrontend(company));
    } catch (error) {
      console.error('获取用户企业信息失败:', error);
      throw error;
    }
  }

  /**
   * 增加查看次数
   * @param {number} id - 企业ID
   */
  static async incrementViews(id) {
    try {
      await knex('companies')
        .where('id', id)
        .increment('views', 1);
    } catch (error) {
      console.error('更新查看次数失败:', error);
      // 不抛出错误，避免影响主要功能
    }
  }

  /**
   * 获取分类统计
   * @returns {Promise<Object>} 各分类的企业数量
   */
  static async getCategoryStats() {
    try {
      const stats = await knex('companies')
        .select('category', 'subcategory')
        .count('* as count')
        .where('is_active', true)
        .groupBy('category', 'subcategory')
        .orderBy('category', 'subcategory');

      // 转换为前端期望的格式
      const result = {};
      stats.forEach(stat => {
        if (!result[stat.category]) {
          result[stat.category] = {};
        }
        result[stat.category][stat.subcategory] = parseInt(stat.count);
      });

      return result;
    } catch (error) {
      console.error('获取分类统计失败:', error);
      throw error;
    }
  }

  /**
   * 格式化企业数据以匹配前端期望
   * @param {Object} company - 数据库中的企业数据
   * @returns {Object} 格式化后的企业数据
   */
  static formatCompanyForFrontend(company) {
    let services = null;
    let businessHours = null;

    try {
      if (company.services) {
        services = typeof company.services === 'string' ? JSON.parse(company.services) : company.services;
      }
      if (company.business_hours) {
        businessHours = typeof company.business_hours === 'string' ? JSON.parse(company.business_hours) : company.business_hours;
      }
    } catch (error) {
      console.error('解析JSON数据失败:', error);
    }

    return {
      id: company.id,
      name: company.name,
      description: company.description,
      category: company.category,
      subcategory: company.subcategory,
      phone: company.phone,
      email: company.email,
      address: company.address,
      website: company.website,
      rating: parseFloat(company.rating) || 0,
      reviews: parseInt(company.reviews_count) || 0,
      verified: company.verified,
      views: parseInt(company.views) || 0,
      favorites: parseInt(company.favorites) || 0,
      notes: company.notes,
      services: services,
      businessHours: businessHours,
      isFeatured: company.is_featured,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      // Premium 字段
      is_premium: company.is_premium || false,
      premium_type: company.premium_type || null,
      premium_end_time: company.premium_end_time || null,
      // 发布者信息
      publisher: {
        firstName: company.first_name,
        lastName: company.last_name,
        email: company.user_email
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

module.exports = Company; 