// 简单的内存存储用户模型
// 在实际项目中，这应该使用真实的数据库（PostgreSQL, MySQL等）

const { db } = require('../config/database');

class User {
  constructor() {
    this.tableName = 'users';
  }

  // 创建用户
  async create(userData) {
    try {
      // 转换驼峰命名为下划线命名
      const dbData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        user_type: userData.userType,
        company_name: userData.companyName,
        company_type: userData.companyType,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zipCode,
        business_license: userData.businessLicense,
        mc_number: userData.mcNumber,
        dot_number: userData.dotNumber,
        is_active: userData.isActive || true,
        is_verified: userData.isVerified || false
      };

      const [user] = await db(this.tableName)
        .insert(dbData)
        .returning('*');
      
      return this._transformUser(user);
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    }
  }

  // 根据ID查找用户
  async findById(id) {
    try {
      const user = await db(this.tableName)
        .where('id', id)
        .first();
      
      return user ? this._transformUser(user) : null;
    } catch (error) {
      console.error('User.findById error:', error);
      throw error;
    }
  }

  // 根据邮箱查找用户
  async findByEmail(email) {
    try {
      const user = await db(this.tableName)
        .where('email', email.toLowerCase())
        .first();
      
      return user ? this._transformUser(user) : null;
    } catch (error) {
      console.error('User.findByEmail error:', error);
      throw error;
    }
  }

  // 根据MC号码查找承运商
  async findByMCNumber(mcNumber) {
    try {
      const user = await db(this.tableName)
        .where({
          'user_type': 'carrier',
          'mc_number': mcNumber
        })
        .first();
      
      return user ? this._transformUser(user) : null;
    } catch (error) {
      console.error('User.findByMCNumber error:', error);
      throw error;
    }
  }

  // 更新用户信息
  async update(id, updates) {
    try {
      // 转换驼峰命名为下划线命名
      const dbUpdates = {};
      const fieldMapping = {
        firstName: 'first_name',
        lastName: 'last_name',
        userType: 'user_type',
        companyName: 'company_name',
        companyType: 'company_type',
        zipCode: 'zip_code',
        businessLicense: 'business_license',
        mcNumber: 'mc_number',
        dotNumber: 'dot_number',
        isActive: 'is_active',
        isVerified: 'is_verified'
      };

      Object.keys(updates).forEach(key => {
        const dbKey = fieldMapping[key] || key;
        dbUpdates[dbKey] = updates[key];
      });

      dbUpdates.updated_at = new Date();

      const [user] = await db(this.tableName)
        .where('id', id)
        .update(dbUpdates)
        .returning('*');

      if (!user) {
        throw new Error('用户不存在');
      }

      return this._transformUser(user);
    } catch (error) {
      console.error('User.update error:', error);
      throw error;
    }
  }

  // 更新最后登录时间
  async updateLastLogin(id) {
    try {
      const [user] = await db(this.tableName)
        .where('id', id)
        .update({
          last_login_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return user ? this._transformUser(user) : null;
    } catch (error) {
      console.error('User.updateLastLogin error:', error);
      throw error;
    }
  }

  // 软删除用户
  async softDelete(id) {
    try {
      const [user] = await db(this.tableName)
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .returning('*');

      if (!user) {
        throw new Error('用户不存在');
      }

      return this._transformUser(user);
    } catch (error) {
      console.error('User.softDelete error:', error);
      throw error;
    }
  }

  // 获取所有用户（管理员功能）
  async findAll(filters = {}) {
    try {
      let query = db(this.tableName);

      // 按用户类型过滤
      if (filters.userType) {
        query = query.where('user_type', filters.userType);
      }

      // 按状态过滤
      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
      }

      // 按公司名称搜索
      if (filters.companyName) {
        query = query.where('company_name', 'ilike', `%${filters.companyName}%`);
      }

      const users = await query.select('*');
      
      return users.map(user => {
        const transformed = this._transformUser(user);
        delete transformed.password; // 移除密码字段
        return transformed;
      });
    } catch (error) {
      console.error('User.findAll error:', error);
      throw error;
    }
  }

  // 统计信息
  async getStats() {
    try {
      const stats = await db(this.tableName)
        .select(
          db.raw('COUNT(*) as total_users'),
          db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_users'),
          db.raw('COUNT(CASE WHEN user_type = ? THEN 1 END) as shippers', ['shipper']),
          db.raw('COUNT(CASE WHEN user_type = ? THEN 1 END) as carriers', ['carrier'])
        )
        .first();

      return {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.total_users) - parseInt(stats.active_users),
        shippers: parseInt(stats.shippers),
        carriers: parseInt(stats.carriers)
      };
    } catch (error) {
      console.error('User.getStats error:', error);
      throw error;
    }
  }

  // 验证用户权限
  async hasPermission(userId, permission) {
    try {
      const user = await this.findById(userId);
      
      if (!user || !user.isActive) {
        return false;
      }

      // 基本权限检查
      const userPermissions = {
        shipper: ['view_own_shipments', 'create_shipment', 'update_own_profile'],
        carrier: ['view_available_loads', 'bid_on_loads', 'update_own_profile'],
        admin: ['view_all_users', 'manage_users', 'view_analytics']
      };

      return userPermissions[user.userType]?.includes(permission) || false;
    } catch (error) {
      console.error('User.hasPermission error:', error);
      return false;
    }
  }

  // 转换数据库字段为前端字段
  _transformUser(dbUser) {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      userType: dbUser.user_type,
      companyName: dbUser.company_name,
      companyType: dbUser.company_type,
      address: dbUser.address,
      city: dbUser.city,
      state: dbUser.state,
      zipCode: dbUser.zip_code,
      businessLicense: dbUser.business_license,
      mcNumber: dbUser.mc_number,
      dotNumber: dbUser.dot_number,
      isActive: dbUser.is_active,
      isVerified: dbUser.is_verified,
      lastLoginAt: dbUser.last_login_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }
}

// 创建单例实例
const userModel = new User();

module.exports = userModel; 