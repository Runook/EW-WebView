const { db } = require('../config/database');

class Resume {
  // 获取所有简历（带筛选）
  static async getAllResumes(filters = {}) {
    try {
      let query = db('resumes')
        .select('resumes.*')
        .where('resumes.is_active', true)
        .orderBy('resumes.created_at', 'desc');

      // 应用筛选条件
      if (filters.position) {
        query = query.where('resumes.position', 'ilike', `%${filters.position}%`);
      }
      
      if (filters.location) {
        query = query.where('resumes.location', filters.location);
      }
      
      if (filters.experience) {
        query = query.where('resumes.experience', filters.experience);
      }
      
      if (filters.workTypePreference) {
        query = query.where('resumes.work_type_preference', filters.workTypePreference);
      }
      
      if (filters.search) {
        query = query.where(function() {
          this.where('resumes.name', 'ilike', `%${filters.search}%`)
              .orWhere('resumes.position', 'ilike', `%${filters.search}%`)
              .orWhere('resumes.skills', 'ilike', `%${filters.search}%`)
              .orWhere('resumes.summary', 'ilike', `%${filters.search}%`);
        });
      }

      const resumes = await query;
      
      return resumes.map(resume => this.formatResumeData(resume));
    } catch (error) {
      console.error('Resume.getAllResumes error:', error);
      throw error;
    }
  }

  // 根据ID获取单个简历
  static async getResumeById(id) {
    try {
      const resume = await db('resumes')
        .select('resumes.*')
        .where('resumes.id', id)
        .first();

      if (!resume) {
        return null;
      }

      return this.formatResumeData(resume);
    } catch (error) {
      console.error('Resume.getResumeById error:', error);
      throw error;
    }
  }

  // 创建新简历
  static async createResume(resumeData) {
    try {
      const [resume] = await db('resumes')
        .insert({
          user_id: resumeData.userId || null,
          name: resumeData.name,
          position: resumeData.position,
          experience: resumeData.experience,
          location: resumeData.location,
          phone: resumeData.phone,
          email: resumeData.email,
          skills: JSON.stringify(resumeData.skills || []),
          summary: resumeData.summary,
          expected_salary: resumeData.expectedSalary,
          work_type_preference: resumeData.workTypePreference,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return this.formatResumeData(resume);
    } catch (error) {
      console.error('Resume.createResume error:', error);
      throw error;
    }
  }

  // 更新简历
  static async updateResume(id, resumeData, userId = null) {
    try {
      let query = db('resumes').where('id', id);
      
      // 如果提供了userId，确保只能更新自己的简历
      if (userId) {
        query = query.where('user_id', userId);
      }

      const updateData = {
        updated_at: new Date()
      };

      // 只更新提供的字段
      if (resumeData.name) updateData.name = resumeData.name;
      if (resumeData.position) updateData.position = resumeData.position;
      if (resumeData.experience) updateData.experience = resumeData.experience;
      if (resumeData.location) updateData.location = resumeData.location;
      if (resumeData.phone) updateData.phone = resumeData.phone;
      if (resumeData.email) updateData.email = resumeData.email;
      if (resumeData.skills) updateData.skills = JSON.stringify(resumeData.skills);
      if (resumeData.summary) updateData.summary = resumeData.summary;
      if (resumeData.expectedSalary) updateData.expected_salary = resumeData.expectedSalary;
      if (resumeData.workTypePreference) updateData.work_type_preference = resumeData.workTypePreference;

      const [updatedResume] = await query
        .update(updateData)
        .returning('*');

      if (!updatedResume) {
        return null;
      }

      return this.formatResumeData(updatedResume);
    } catch (error) {
      console.error('Resume.updateResume error:', error);
      throw error;
    }
  }

  // 删除简历
  static async deleteResume(id, userId = null) {
    try {
      let query = db('resumes').where('id', id);
      
      // 如果提供了userId，确保只能删除自己的简历
      if (userId) {
        query = query.where('user_id', userId);
      }

      const deletedCount = await query.del();
      return deletedCount > 0;
    } catch (error) {
      console.error('Resume.deleteResume error:', error);
      throw error;
    }
  }

  // 获取用户的简历
  static async getUserResumes(userId) {
    try {
      const resumes = await db('resumes')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      return resumes.map(resume => this.formatResumeData(resume));
    } catch (error) {
      console.error('Resume.getUserResumes error:', error);
      throw error;
    }
  }

  // 增加浏览量
  static async incrementViews(id) {
    try {
      await db('resumes')
        .where('id', id)
        .increment('views', 1);
    } catch (error) {
      console.error('Resume.incrementViews error:', error);
      throw error;
    }
  }

  // 获取职位统计
  static async getPositionStats() {
    try {
      const stats = await db('resumes')
        .select('position')
        .count('* as count')
        .where('is_active', true)
        .groupBy('position')
        .orderBy('count', 'desc');

      return stats.reduce((acc, stat) => {
        acc[stat.position] = parseInt(stat.count);
        return acc;
      }, {});
    } catch (error) {
      console.error('Resume.getPositionStats error:', error);
      throw error;
    }
  }

  // 搜索简历
  static async searchResumes(searchTerm, filters = {}) {
    try {
      let query = db('resumes')
        .select('resumes.*')
        .where('resumes.is_active', true);

      // 搜索条件
      query = query.where(function() {
        this.where('resumes.name', 'ilike', `%${searchTerm}%`)
            .orWhere('resumes.position', 'ilike', `%${searchTerm}%`)
            .orWhere('resumes.skills', 'ilike', `%${searchTerm}%`)
            .orWhere('resumes.summary', 'ilike', `%${searchTerm}%`);
      });

      // 应用额外筛选条件
      if (filters.position) {
        query = query.where('resumes.position', 'ilike', `%${filters.position}%`);
      }
      
      if (filters.location) {
        query = query.where('resumes.location', filters.location);
      }

      query = query.orderBy('resumes.created_at', 'desc');

      const resumes = await query;
      
      return resumes.map(resume => this.formatResumeData(resume));
    } catch (error) {
      console.error('Resume.searchResumes error:', error);
      throw error;
    }
  }

  // 格式化简历数据
  static formatResumeData(resume) {
    if (!resume) return null;

    // 解析技能JSON
    let skills = [];
    try {
      skills = resume.skills ? JSON.parse(resume.skills) : [];
    } catch (e) {
      skills = resume.skills ? resume.skills.split(',').map(s => s.trim()) : [];
    }

    return {
      id: resume.id,
      name: resume.name,
      position: resume.position,
      experience: resume.experience,
      location: resume.location,
      phone: resume.phone,
      email: resume.email,
      skills: skills,
      summary: resume.summary,
      expectedSalary: resume.expected_salary,
      workTypePreference: resume.work_type_preference,
      views: resume.views || 0,
      isActive: resume.is_active,
      isFeatured: resume.is_featured,
      posted: this.getTimeAgo(resume.created_at),
      publishDate: new Date(resume.created_at).toISOString().split('T')[0],
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
      publisher: {
        userId: resume.user_id
      }
    };
  }

  // 获取时间差显示
  static getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚发布';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}周前`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}个月前`;
    
    return `${Math.floor(diffInMonths / 12)}年前`;
  }
}

module.exports = Resume; 