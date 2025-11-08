const { db } = require('../config/database');

class Rental {
  // 获取所有租赁项（带筛选）
  static async getAllRentals(filters = {}) {
    try {
      let query = db('rentals')
        .select(
          'rentals.*',
          // 添加premium信息
          'premium_posts.premium_type',
          'premium_posts.end_time as premium_end_time',
          'premium_posts.created_at as premium_created_at'
        )
        .leftJoin('premium_posts', function() {
          this.on('premium_posts.post_type', '=', db.raw("'rental'"))
              .andOn('premium_posts.post_id', '=', 'rentals.id')
              .andOn('premium_posts.is_active', '=', db.raw('true'))
              .andOn('premium_posts.end_time', '>', db.raw('NOW()'));
        })
        .where('rentals.is_active', true)
        // 修改排序：置顶内容按置顶时间倒序，普通内容按发布时间倒序
        .orderBy(db.raw('CASE WHEN premium_posts.premium_type = \'top\' THEN 1 ELSE 2 END'))
        .orderBy('premium_posts.created_at', 'desc')
        .orderBy('rentals.created_at', 'desc');

      // 应用筛选条件
      if (filters.category) {
        query = query.where('rentals.category', filters.category);
      }
      
      if (filters.sub_category) {
        query = query.where('rentals.sub_category', filters.sub_category);
      }
      
      if (filters.location) {
        query = query.where('rentals.location', filters.location);
      }
      
      if (filters.condition) {
        query = query.where('rentals.condition', filters.condition);
      }
      
      if (filters.brand) {
        query = query.where('rentals.brand', 'ilike', `%${filters.brand}%`);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('rentals.title', 'ilike', `%${filters.search}%`)
              .orWhere('rentals.brand', 'ilike', `%${filters.search}%`)
              .orWhere('rentals.description', 'ilike', `%${filters.search}%`);
        });
      }

      const rentals = await query;
      
      return rentals.map(rental => this.formatRentalData(rental));
    } catch (error) {
      console.error('Rental.getAllRentals error:', error);
      throw error;
    }
  }

  // 根据ID获取单个租赁项
  static async getRentalById(id) {
    try {
      const rental = await db('rentals')
        .select('rentals.*')
        .where('rentals.id', id)
        .first();

      if (!rental) {
        return null;
      }

      return this.formatRentalData(rental);
    } catch (error) {
      console.error('Rental.getRentalById error:', error);
      throw error;
    }
  }

  // 创建新租赁项
  static async createRental(rentalData) {
    try {
      const [rental] = await db('rentals')
        .insert({
          user_id: rentalData.userId || null,
          title: rentalData.title,
          category: rentalData.category,
          sub_category: rentalData.sub_category,
          brand: rentalData.brand,
          location: rentalData.location,
          price: rentalData.price,
          condition: rentalData.condition,
          description: rentalData.description,
          specifications: rentalData.specifications,
          images: rentalData.images,
          contact_phone: rentalData.contactPhone,
          contact_email: rentalData.contactEmail,
          contact_person: rentalData.contactPerson,
          company: rentalData.company,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return this.formatRentalData(rental);
    } catch (error) {
      console.error('Rental.createRental error:', error);
      throw error;
    }
  }

  // 更新租赁项
  static async updateRental(id, rentalData, userId = null) {
    try {
      let query = db('rentals').where('id', id);
      
      // 如果提供了userId，确保只能更新自己的租赁项
      if (userId) {
        query = query.where('user_id', userId);
      }

      const updateData = {
        updated_at: new Date()
      };

      // 只更新提供的字段
      if (rentalData.title) updateData.title = rentalData.title;
      if (rentalData.category) updateData.category = rentalData.category;
      if (rentalData.sub_category) updateData.sub_category = rentalData.sub_category;
      if (rentalData.brand) updateData.brand = rentalData.brand;
      if (rentalData.location) updateData.location = rentalData.location;
      if (rentalData.price) updateData.price = rentalData.price;
      if (rentalData.condition) updateData.condition = rentalData.condition;
      if (rentalData.description) updateData.description = rentalData.description;
      if (rentalData.specifications) updateData.specifications = rentalData.specifications;
      if (rentalData.images) updateData.images = rentalData.images;
      if (rentalData.contactPhone) updateData.contact_phone = rentalData.contactPhone;
      if (rentalData.contactEmail) updateData.contact_email = rentalData.contactEmail;
      if (rentalData.contactPerson) updateData.contact_person = rentalData.contactPerson;
      if (rentalData.company) updateData.company = rentalData.company;
      if (rentalData.is_active !== undefined) updateData.is_active = rentalData.is_active;

      const [updatedRental] = await query
        .update(updateData)
        .returning('*');

      if (!updatedRental) {
        return null;
      }

      return this.formatRentalData(updatedRental);
    } catch (error) {
      console.error('Rental.updateRental error:', error);
      throw error;
    }
  }

  // 删除租赁项
  static async deleteRental(id, userId = null) {
    try {
      let query = db('rentals').where('id', id);
      
      // 如果提供了userId，确保只能删除自己的租赁项
      if (userId) {
        query = query.where('user_id', userId);
      }

      const deletedCount = await query.del();
      return deletedCount > 0;
    } catch (error) {
      console.error('Rental.deleteRental error:', error);
      throw error;
    }
  }

  // 获取用户的租赁项
  static async getUserRentals(userId) {
    try {
      const rentals = await db('rentals')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      return rentals.map(rental => this.formatRentalData(rental));
    } catch (error) {
      console.error('Rental.getUserRentals error:', error);
      throw error;
    }
  }

  // 增加浏览量
  static async incrementViews(id) {
    try {
      await db('rentals')
        .where('id', id)
        .increment('views', 1);
    } catch (error) {
      console.error('Rental.incrementViews error:', error);
      throw error;
    }
  }

  // 获取分类统计
  static async getCategoryStats() {
    try {
      const stats = await db('rentals')
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
      console.error('Rental.getCategoryStats error:', error);
      throw error;
    }
  }

  // 搜索租赁项
  static async searchRentals(searchTerm, filters = {}) {
    try {
      let query = db('rentals')
        .select('rentals.*')
        .where('rentals.is_active', true);

      // 搜索条件
      if (searchTerm) {
        query = query.where(function() {
          this.where('rentals.title', 'ilike', `%${searchTerm}%`)
              .orWhere('rentals.brand', 'ilike', `%${searchTerm}%`)
              .orWhere('rentals.description', 'ilike', `%${searchTerm}%`)
              .orWhere('rentals.category', 'ilike', `%${searchTerm}%`)
              .orWhere('rentals.sub_category', 'ilike', `%${searchTerm}%`);
        });
      }

      // 其他筛选条件
      if (filters.category) {
        query = query.where('rentals.category', filters.category);
      }
      
      if (filters.sub_category) {
        query = query.where('rentals.sub_category', filters.sub_category);
      }
      
      if (filters.location) {
        query = query.where('rentals.location', filters.location);
      }

      query = query.orderBy('rentals.created_at', 'desc');

      const rentals = await query;
      return rentals.map(rental => this.formatRentalData(rental));
    } catch (error) {
      console.error('Rental.searchRentals error:', error);
      throw error;
    }
  }

  // 格式化租赁项数据
  static formatRentalData(rental) {
    if (!rental) return null;

    return {
      id: rental.id,
      title: rental.title,
      category: rental.category,
      subCategory: rental.sub_category,
      brand: rental.brand,
      location: rental.location,
      price: rental.price,
      condition: rental.condition,
      description: rental.description,
      specifications: rental.specifications,
      images: rental.images ? (rental.images.includes('|||') ? rental.images.split('|||').filter(img => img.trim()) : [rental.images]) : [],
      contactPhone: rental.contact_phone,
      contactEmail: rental.contact_email,
      contactPerson: rental.contact_person,
      company: rental.company,
      views: rental.views || 0,
      isActive: rental.is_active,
      isFeatured: rental.is_featured,
      posted: this.getTimeAgo(rental.created_at),
      publishDate: rental.created_at ? rental.created_at.toISOString().split('T')[0] : null,
      createdAt: rental.created_at,
      updatedAt: rental.updated_at,
      // Premium 字段
      is_premium: rental.is_premium || false,
      premium_type: rental.premium_type || null,
      premium_end_time: rental.premium_end_time || null,
      publisher: {
        userId: rental.user_id
      },
      contact: {
        name: rental.contact_person,
        company: rental.company,
        phone: rental.contact_phone
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

module.exports = Rental;

