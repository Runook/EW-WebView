const { db } = require('../config/database');

class Sale {
  // 获取所有销售项（带筛选）
  static async getAllSales(filters = {}) {
    try {
      let query = db('sales')
        .select(
          'sales.*',
          // 添加premium信息
          'premium_posts.premium_type',
          'premium_posts.end_time as premium_end_time',
          'premium_posts.created_at as premium_created_at'
        )
        .leftJoin('premium_posts', function() {
          this.on('premium_posts.post_type', '=', db.raw("'sale'"))
              .andOn('premium_posts.post_id', '=', 'sales.id')
              .andOn('premium_posts.is_active', '=', db.raw('true'))
              .andOn('premium_posts.end_time', '>', db.raw('NOW()'));
        })
        .where('sales.is_active', true)
        // 修改排序：置顶内容按置顶时间倒序，普通内容按发布时间倒序
        .orderBy(db.raw('CASE WHEN premium_posts.premium_type = \'top\' THEN 1 ELSE 2 END'))
        .orderBy('premium_posts.created_at', 'desc')
        .orderBy('sales.created_at', 'desc');

      // 应用筛选条件
      if (filters.category) {
        query = query.where('sales.category', filters.category);
      }
      
      if (filters.sub_category) {
        query = query.where('sales.sub_category', filters.sub_category);
      }
      
      if (filters.location) {
        query = query.where('sales.location', filters.location);
      }
      
      if (filters.condition) {
        query = query.where('sales.condition', filters.condition);
      }
      
      if (filters.brand) {
        query = query.where('sales.brand', 'ilike', `%${filters.brand}%`);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('sales.title', 'ilike', `%${filters.search}%`)
              .orWhere('sales.brand', 'ilike', `%${filters.search}%`)
              .orWhere('sales.description', 'ilike', `%${filters.search}%`);
        });
      }

      const sales = await query;
      
      return sales.map(sale => this.formatSaleData(sale));
    } catch (error) {
      console.error('Sale.getAllSales error:', error);
      throw error;
    }
  }

  // 根据ID获取单个销售项
  static async getSaleById(id) {
    try {
      const sale = await db('sales')
        .select('sales.*')
        .where('sales.id', id)
        .first();

      if (!sale) {
        return null;
      }

      return this.formatSaleData(sale);
    } catch (error) {
      console.error('Sale.getSaleById error:', error);
      throw error;
    }
  }

  // 创建新销售项
  static async createSale(saleData) {
    try {
      const [sale] = await db('sales')
        .insert({
          user_id: saleData.userId || null,
          title: saleData.title,
          category: saleData.category,
          sub_category: saleData.sub_category,
          brand: saleData.brand,
          location: saleData.location,
          price: saleData.price,
          condition: saleData.condition,
          description: saleData.description,
          specifications: saleData.specifications,
          images: saleData.images,
          contact_phone: saleData.contactPhone,
          contact_email: saleData.contactEmail,
          contact_person: saleData.contactPerson,
          company: saleData.company,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return this.formatSaleData(sale);
    } catch (error) {
      console.error('Sale.createSale error:', error);
      throw error;
    }
  }

  // 更新销售项
  static async updateSale(id, saleData, userId = null) {
    try {
      let query = db('sales').where('id', id);
      
      // 如果提供了userId，确保只能更新自己的销售项
      if (userId) {
        query = query.where('user_id', userId);
      }

      const updateData = {
        updated_at: new Date()
      };

      // 只更新提供的字段
      if (saleData.title) updateData.title = saleData.title;
      if (saleData.category) updateData.category = saleData.category;
      if (saleData.sub_category) updateData.sub_category = saleData.sub_category;
      if (saleData.brand) updateData.brand = saleData.brand;
      if (saleData.location) updateData.location = saleData.location;
      if (saleData.price) updateData.price = saleData.price;
      if (saleData.condition) updateData.condition = saleData.condition;
      if (saleData.description) updateData.description = saleData.description;
      if (saleData.specifications) updateData.specifications = saleData.specifications;
      if (saleData.images) updateData.images = saleData.images;
      if (saleData.contactPhone) updateData.contact_phone = saleData.contactPhone;
      if (saleData.contactEmail) updateData.contact_email = saleData.contactEmail;
      if (saleData.contactPerson) updateData.contact_person = saleData.contactPerson;
      if (saleData.company) updateData.company = saleData.company;
      if (saleData.is_active !== undefined) updateData.is_active = saleData.is_active;

      const [updatedSale] = await query
        .update(updateData)
        .returning('*');

      if (!updatedSale) {
        return null;
      }

      return this.formatSaleData(updatedSale);
    } catch (error) {
      console.error('Sale.updateSale error:', error);
      throw error;
    }
  }

  // 删除销售项
  static async deleteSale(id, userId = null) {
    try {
      let query = db('sales').where('id', id);
      
      // 如果提供了userId，确保只能删除自己的销售项
      if (userId) {
        query = query.where('user_id', userId);
      }

      const deletedCount = await query.del();
      return deletedCount > 0;
    } catch (error) {
      console.error('Sale.deleteSale error:', error);
      throw error;
    }
  }

  // 获取用户的销售项
  static async getUserSales(userId) {
    try {
      const sales = await db('sales')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      return sales.map(sale => this.formatSaleData(sale));
    } catch (error) {
      console.error('Sale.getUserSales error:', error);
      throw error;
    }
  }

  // 增加浏览量
  static async incrementViews(id) {
    try {
      await db('sales')
        .where('id', id)
        .increment('views', 1);
    } catch (error) {
      console.error('Sale.incrementViews error:', error);
      throw error;
    }
  }

  // 获取分类统计
  static async getCategoryStats() {
    try {
      const stats = await db('sales')
        .select('category')
        .count('* as count')
        .where('is_active', true)
        .groupBy('category')
        .orderBy('count', 'desc');

      return stats.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.count);
        return acc;
      }, {});
    } catch (error) {
      console.error('Sale.getCategoryStats error:', error);
      throw error;
    }
  }

  // 搜索销售项
  static async searchSales(searchTerm, filters = {}) {
    try {
      let query = db('sales')
        .select('sales.*')
        .where('sales.is_active', true);

      // 搜索条件
      if (searchTerm) {
        query = query.where(function() {
          this.where('sales.title', 'ilike', `%${searchTerm}%`)
              .orWhere('sales.brand', 'ilike', `%${searchTerm}%`)
              .orWhere('sales.description', 'ilike', `%${searchTerm}%`)
              .orWhere('sales.category', 'ilike', `%${searchTerm}%`)
              .orWhere('sales.sub_category', 'ilike', `%${searchTerm}%`);
        });
      }

      // 其他筛选条件
      if (filters.category) {
        query = query.where('sales.category', filters.category);
      }
      
      if (filters.sub_category) {
        query = query.where('sales.sub_category', filters.sub_category);
      }
      
      if (filters.location) {
        query = query.where('sales.location', filters.location);
      }

      query = query.orderBy('sales.created_at', 'desc');

      const sales = await query;
      return sales.map(sale => this.formatSaleData(sale));
    } catch (error) {
      console.error('Sale.searchSales error:', error);
      throw error;
    }
  }

  // 格式化销售项数据
  static formatSaleData(sale) {
    if (!sale) return null;

    return {
      id: sale.id,
      title: sale.title,
      category: sale.category,
      subCategory: sale.sub_category,
      brand: sale.brand,
      location: sale.location,
      price: sale.price,
      condition: sale.condition,
      description: sale.description,
      specifications: sale.specifications,
      images: sale.images ? sale.images.split(',') : [],
      contactPhone: sale.contact_phone,
      contactEmail: sale.contact_email,
      contactPerson: sale.contact_person,
      company: sale.company,
      views: sale.views || 0,
      isActive: sale.is_active,
      isFeatured: sale.is_featured,
      posted: this.getTimeAgo(sale.created_at),
      publishDate: sale.created_at ? sale.created_at.toISOString().split('T')[0] : null,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
      // Premium 字段
      is_premium: sale.is_premium || false,
      premium_type: sale.premium_type || null,
      premium_end_time: sale.premium_end_time || null,
      publisher: {
        userId: sale.user_id
      }
    };
  }

  // 计算时间差
  static getTimeAgo(date) {
    if (!date) return '未知时间';
    
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '1天前';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}个月前`;
  }
}

module.exports = Sale;