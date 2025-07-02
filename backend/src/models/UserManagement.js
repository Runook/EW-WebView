const { db: knex } = require('../config/database');

class UserManagement {
  /**
   * 获取系统配置
   * @param {string} key - 配置键
   * @returns {Promise<any>} 配置值
   */
  static async getSystemConfig(key) {
    try {
      const config = await knex('system_config')
        .where('config_key', key)
        .first();
      
      if (!config) return null;
      
      switch (config.data_type) {
        case 'number':
          return parseFloat(config.config_value);
        case 'boolean':
          return config.config_value === 'true';
        case 'json':
          return JSON.parse(config.config_value);
        default:
          return config.config_value;
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户积分信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 积分信息
   */
  static async getUserCredits(userId) {
    try {
      const user = await knex('users')
        .select('credits', 'total_credits_earned', 'total_credits_spent')
        .where('id', userId)
        .first();
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return {
        current: user.credits || 0,
        totalEarned: user.total_credits_earned || 0,
        totalSpent: user.total_credits_spent || 0
      };
    } catch (error) {
      console.error('获取用户积分失败:', error);
      throw error;
    }
  }

  /**
   * 积分变动
   * @param {number} userId - 用户ID
   * @param {string} type - 变动类型：earn, spend, refund, admin_adjust
   * @param {number} amount - 变动数量
   * @param {string} description - 变动描述
   * @param {string} referenceType - 关联类型
   * @param {number} referenceId - 关联ID
   * @returns {Promise<Object>} 变动结果
   */
  static async creditTransaction(userId, type, amount, description, referenceType = null, referenceId = null) {
    const trx = await knex.transaction();
    
    try {
      // 获取当前积分
      const user = await trx('users')
        .select('credits', 'total_credits_earned', 'total_credits_spent')
        .where('id', userId)
        .first();
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const currentCredits = user.credits || 0;
      let newCredits = currentCredits;
      let updateData = {};
      
      // 根据类型计算新积分
      switch (type) {
        case 'earn':
        case 'refund':
          newCredits = currentCredits + Math.abs(amount);
          updateData.total_credits_earned = (user.total_credits_earned || 0) + Math.abs(amount);
          break;
        case 'spend':
          if (currentCredits < Math.abs(amount)) {
            throw new Error('积分余额不足');
          }
          newCredits = currentCredits - Math.abs(amount);
          updateData.total_credits_spent = (user.total_credits_spent || 0) + Math.abs(amount);
          break;
        case 'admin_adjust':
          newCredits = currentCredits + amount; // amount可以是正数或负数
          if (amount > 0) {
            updateData.total_credits_earned = (user.total_credits_earned || 0) + amount;
          } else {
            updateData.total_credits_spent = (user.total_credits_spent || 0) + Math.abs(amount);
          }
          break;
        default:
          throw new Error('无效的积分变动类型');
      }
      
      if (newCredits < 0) {
        throw new Error('积分不能为负数');
      }
      
      // 更新用户积分
      updateData.credits = newCredits;
      await trx('users')
        .where('id', userId)
        .update(updateData);
      
      // 记录积分变动日志
      const logEntry = await trx('user_credits_log')
        .insert({
          user_id: userId,
          type: type,
          amount: type === 'spend' ? -Math.abs(amount) : Math.abs(amount),
          balance_after: newCredits,
          description: description,
          reference_type: referenceType,
          reference_id: referenceId
        })
        .returning('*');
      
      await trx.commit();
      
      return {
        success: true,
        previousBalance: currentCredits,
        newBalance: newCredits,
        transactionAmount: type === 'spend' ? -Math.abs(amount) : Math.abs(amount),
        logId: logEntry[0].id
      };
    } catch (error) {
      await trx.rollback();
      console.error('积分变动失败:', error);
      throw error;
    }
  }

  /**
   * 发布内容时扣除积分
   * @param {number} userId - 用户ID
   * @param {string} postType - 发布类型：load, truck, company, job, resume
   * @param {number} postId - 发布内容ID
   * @returns {Promise<Object>} 扣费结果
   */
  static async chargeForPost(userId, postType, postId) {
    try {
      const cost = await this.getSystemConfig(`post_costs.${postType}`);
      if (!cost) {
        throw new Error(`未找到 ${postType} 的发布费用配置`);
      }
      
      const result = await this.creditTransaction(
        userId,
        'spend',
        cost,
        `发布${this.getPostTypeName(postType)}`,
        postType,
        postId
      );
      
      return {
        ...result,
        cost: cost,
        postType: postType
      };
    } catch (error) {
      console.error('发布内容扣费失败:', error);
      throw error;
    }
  }

  /**
   * 置顶内容
   * @param {number} userId - 用户ID
   * @param {string} postType - 内容类型
   * @param {number} postId - 内容ID
   * @param {string} premiumType - 置顶类型：top, highlight, urgent
   * @param {number} duration - 持续时间（小时）
   * @returns {Promise<Object>} 置顶结果
   */
  static async makePremium(userId, postType, postId, premiumType, duration = 24) {
    const trx = await knex.transaction();
    
    try {
      // 检查是否已有相同类型的置顶
      const existing = await trx('premium_posts')
        .where({
          post_type: postType,
          post_id: postId,
          premium_type: premiumType,
          is_active: true
        })
        .where('end_time', '>', new Date())
        .first();
      
      if (existing) {
        throw new Error('该内容已有相同类型的置顶正在生效');
      }
      
      // 计算费用
      let costKey;
      switch (premiumType) {
        case 'top':
          if (duration <= 24) costKey = 'premium_costs.top_24h';
          else if (duration <= 72) costKey = 'premium_costs.top_72h';
          else costKey = 'premium_costs.top_168h';
          break;
        case 'highlight':
          costKey = 'premium_costs.highlight';
          break;
        case 'urgent':
          costKey = 'premium_costs.urgent';
          break;
        default:
          throw new Error('无效的置顶类型');
      }
      
      const cost = await this.getSystemConfig(costKey);
      if (!cost) {
        throw new Error(`未找到 ${premiumType} 的费用配置`);
      }
      
      // 扣除积分
      await this.creditTransaction(
        userId,
        'spend',
        cost,
        `${this.getPremiumTypeName(premiumType)} - ${this.getPostTypeName(postType)}`,
        `premium_${postType}`,
        postId
      );
      
      // 创建置顶记录
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      const premiumPost = await trx('premium_posts')
        .insert({
          user_id: userId,
          post_type: postType,
          post_id: postId,
          premium_type: premiumType,
          credits_cost: cost,
          start_time: startTime,
          end_time: endTime,
          is_active: true
        })
        .returning('*');
      
      // 更新内容表的is_premium字段
      const tableName = this.getTableName(postType);
      await trx(tableName)
        .where('id', postId)
        .update({ is_premium: true });
      
      await trx.commit();
      
      return {
        success: true,
        premiumId: premiumPost[0].id,
        cost: cost,
        startTime: startTime,
        endTime: endTime,
        duration: duration
      };
    } catch (error) {
      await trx.rollback();
      console.error('置顶失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有发布内容
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户发布的所有内容
   */
  static async getUserPosts(userId) {
    try {
      const [loads, trucks, companies, jobs, resumes] = await Promise.all([
        knex('land_loads')
          .where('user_id', userId)
          .orderBy('created_at', 'desc'),
        knex('land_trucks')
          .where('user_id', userId)
          .orderBy('created_at', 'desc'),
        knex('companies')
          .where('user_id', userId)
          .orderBy('created_at', 'desc'),
        knex('jobs')
          .where('user_id', userId)
          .orderBy('created_at', 'desc'),
        knex('resumes')
          .where('user_id', userId)
          .orderBy('created_at', 'desc')
      ]);
      
      return {
        loads: loads.map(item => ({ ...item, type: 'load' })),
        trucks: trucks.map(item => ({ ...item, type: 'truck' })),
        companies: companies.map(item => ({ ...item, type: 'company' })),
        jobs: jobs.map(item => ({ ...item, type: 'job' })),
        resumes: resumes.map(item => ({ ...item, type: 'resume' }))
      };
    } catch (error) {
      console.error('获取用户发布内容失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容状态
   * @param {number} userId - 用户ID
   * @param {string} postType - 内容类型
   * @param {number} postId - 内容ID
   * @param {string} status - 新状态
   * @returns {Promise<boolean>} 更新结果
   */
  static async updatePostStatus(userId, postType, postId, status) {
    try {
      const tableName = this.getTableName(postType);
      const result = await knex(tableName)
        .where({ id: postId, user_id: userId })
        .update({ 
          status: status,
          last_refreshed: status === 'active' ? new Date() : null
        });
      
      return result > 0;
    } catch (error) {
      console.error('更新内容状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户发布的内容
   * @param {number} userId - 用户ID
   * @param {string} postType - 内容类型
   * @param {number} postId - 内容ID
   * @returns {Promise<boolean>} 删除结果
   */
  static async deleteUserPost(userId, postType, postId) {
    const trx = await knex.transaction();
    
    try {
      const tableName = this.getTableName(postType);
      
      // 软删除：设置is_active为false
      const result = await trx(tableName)
        .where({ id: postId, user_id: userId })
        .update({ is_active: false });
      
      if (result === 0) {
        throw new Error('内容不存在或无权限删除');
      }
      
      // 删除相关的置顶记录
      await trx('premium_posts')
        .where({
          post_type: postType,
          post_id: postId,
          user_id: userId
        })
        .update({ is_active: false });
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      console.error('删除用户发布内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取积分变动记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 积分记录
   */
  static async getCreditHistory(userId, limit = 20, offset = 0) {
    try {
      const records = await knex('user_credits_log')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      return records.map(record => ({
        ...record,
        amount: record.amount,
        type_name: this.getCreditTypeName(record.type),
        created_at: record.created_at
      }));
    } catch (error) {
      console.error('获取积分历史失败:', error);
      throw error;
    }
  }

  // 辅助方法
  static getTableName(postType) {
    const tableMap = {
      load: 'land_loads',
      truck: 'land_trucks',
      company: 'companies',
      job: 'jobs',
      resume: 'resumes'
    };
    return tableMap[postType];
  }

  static getPostTypeName(postType) {
    const nameMap = {
      load: '货源信息',
      truck: '车源信息',
      company: '企业信息',
      job: '职位信息',
      resume: '简历信息'
    };
    return nameMap[postType] || postType;
  }

  static getPremiumTypeName(premiumType) {
    const nameMap = {
      top: '置顶',
      highlight: '高亮',
      urgent: '紧急'
    };
    return nameMap[premiumType] || premiumType;
  }

  static getCreditTypeName(type) {
    const nameMap = {
      earn: '获得',
      spend: '消费',
      refund: '退款',
      admin_adjust: '管理员调整'
    };
    return nameMap[type] || type;
  }
}

module.exports = UserManagement;
