const { db } = require('../config/database');

class Job {
  // 获取所有职位（带筛选）
  static async getAllJobs(filters = {}) {
    try {
      let query = db('jobs')
        .select(
          'jobs.*',
          // 添加premium信息
          'premium_posts.premium_type',
          'premium_posts.end_time as premium_end_time'
        )
        .leftJoin('premium_posts', function() {
          this.on('premium_posts.post_type', '=', db.raw("'job'"))
              .andOn('premium_posts.post_id', '=', 'jobs.id')
              .andOn('premium_posts.is_active', '=', db.raw('true'))
              .andOn('premium_posts.end_time', '>', db.raw('NOW()'));
        })
        .where('jobs.is_active', true)
        .orderBy('jobs.is_premium', 'desc')
        .orderBy('jobs.created_at', 'desc');

      // 应用筛选条件
      if (filters.category) {
        query = query.where('jobs.category', filters.category);
      }
      
      if (filters.location) {
        query = query.where('jobs.location', filters.location);
      }
      
      if (filters.workType) {
        query = query.where('jobs.work_type', filters.workType);
      }
      
      if (filters.experience) {
        query = query.where('jobs.experience', filters.experience);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('jobs.title', 'ilike', `%${filters.search}%`)
              .orWhere('jobs.company', 'ilike', `%${filters.search}%`)
              .orWhere('jobs.description', 'ilike', `%${filters.search}%`);
        });
      }

      const jobs = await query;
      
      return jobs.map(job => this.formatJobData(job));
    } catch (error) {
      console.error('Job.getAllJobs error:', error);
      throw error;
    }
  }

  // 根据ID获取单个职位
  static async getJobById(id) {
    try {
      const job = await db('jobs')
        .select('jobs.*')
        .where('jobs.id', id)
        .first();

      if (!job) {
        return null;
      }

      return this.formatJobData(job);
    } catch (error) {
      console.error('Job.getJobById error:', error);
      throw error;
    }
  }

  // 创建新职位
  static async createJob(jobData) {
    try {
      const [job] = await db('jobs')
        .insert({
          user_id: jobData.userId || null,
          title: jobData.title,
          category: jobData.category,
          company: jobData.company,
          location: jobData.location,
          salary: jobData.salary,
          work_type: jobData.workType,
          experience: jobData.experience,
          description: jobData.description,
          contact_phone: jobData.contactPhone,
          contact_email: jobData.contactEmail,
          contact_person: jobData.contactPerson,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return this.formatJobData(job);
    } catch (error) {
      console.error('Job.createJob error:', error);
      throw error;
    }
  }

  // 更新职位
  static async updateJob(id, jobData, userId = null) {
    try {
      let query = db('jobs').where('id', id);
      
      // 如果提供了userId，确保只能更新自己的职位
      if (userId) {
        query = query.where('user_id', userId);
      }

      const updateData = {
        updated_at: new Date()
      };

      // 只更新提供的字段
      if (jobData.title) updateData.title = jobData.title;
      if (jobData.category) updateData.category = jobData.category;
      if (jobData.company) updateData.company = jobData.company;
      if (jobData.location) updateData.location = jobData.location;
      if (jobData.salary) updateData.salary = jobData.salary;
      if (jobData.workType) updateData.work_type = jobData.workType;
      if (jobData.experience) updateData.experience = jobData.experience;
      if (jobData.description) updateData.description = jobData.description;
      if (jobData.contactPhone) updateData.contact_phone = jobData.contactPhone;
      if (jobData.contactEmail) updateData.contact_email = jobData.contactEmail;
      if (jobData.contactPerson) updateData.contact_person = jobData.contactPerson;

      const [updatedJob] = await query
        .update(updateData)
        .returning('*');

      if (!updatedJob) {
        return null;
      }

      return this.formatJobData(updatedJob);
    } catch (error) {
      console.error('Job.updateJob error:', error);
      throw error;
    }
  }

  // 删除职位
  static async deleteJob(id, userId = null) {
    try {
      let query = db('jobs').where('id', id);
      
      // 如果提供了userId，确保只能删除自己的职位
      if (userId) {
        query = query.where('user_id', userId);
      }

      const deletedCount = await query.del();
      return deletedCount > 0;
    } catch (error) {
      console.error('Job.deleteJob error:', error);
      throw error;
    }
  }

  // 获取用户的职位
  static async getUserJobs(userId) {
    try {
      const jobs = await db('jobs')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      return jobs.map(job => this.formatJobData(job));
    } catch (error) {
      console.error('Job.getUserJobs error:', error);
      throw error;
    }
  }

  // 增加浏览量
  static async incrementViews(id) {
    try {
      await db('jobs')
        .where('id', id)
        .increment('views', 1);
    } catch (error) {
      console.error('Job.incrementViews error:', error);
      throw error;
    }
  }

  // 获取分类统计
  static async getCategoryStats() {
    try {
      const stats = await db('jobs')
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
      console.error('Job.getCategoryStats error:', error);
      throw error;
    }
  }

  // 搜索职位
  static async searchJobs(searchTerm, filters = {}) {
    try {
      let query = db('jobs')
        .select('jobs.*')
        .where('jobs.is_active', true);

      // 搜索条件
      if (searchTerm) {
        query = query.where(function() {
          this.where('jobs.title', 'ilike', `%${searchTerm}%`)
              .orWhere('jobs.company', 'ilike', `%${searchTerm}%`)
              .orWhere('jobs.description', 'ilike', `%${searchTerm}%`)
              .orWhere('jobs.category', 'ilike', `%${searchTerm}%`);
        });
      }

      // 其他筛选条件
      if (filters.category) {
        query = query.where('jobs.category', filters.category);
      }
      
      if (filters.location) {
        query = query.where('jobs.location', filters.location);
      }

      query = query.orderBy('jobs.created_at', 'desc');

      const jobs = await query;
      return jobs.map(job => this.formatJobData(job));
    } catch (error) {
      console.error('Job.searchJobs error:', error);
      throw error;
    }
  }

  // 格式化职位数据
  static formatJobData(job) {
    if (!job) return null;

    return {
      id: job.id,
      title: job.title,
      category: job.category,
      company: job.company,
      location: job.location,
      salary: job.salary,
      type: job.work_type,
      experience: job.experience,
      description: job.description,
      contactPhone: job.contact_phone,
      contactEmail: job.contact_email,
      contactPerson: job.contact_person,
      views: job.views || 0,
      isActive: job.is_active,
      isFeatured: job.is_featured,
      posted: this.getTimeAgo(job.created_at),
      publishDate: job.created_at ? job.created_at.toISOString().split('T')[0] : null,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      // Premium 字段
      is_premium: job.is_premium || false,
      premium_type: job.premium_type || null,
      premium_end_time: job.premium_end_time || null,
      publisher: {
        userId: job.user_id
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

module.exports = Job; 