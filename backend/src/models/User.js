// 简单的内存存储用户模型
// 在实际项目中，这应该使用真实的数据库（PostgreSQL, MySQL等）

class User {
  constructor() {
    // 内存中的用户数据
    this.users = [];
    this.nextId = 1;
  }

  // 创建用户
  async create(userData) {
    const user = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
    };
    
    this.users.push(user);
    return user.id;
  }

  // 根据ID查找用户
  async findById(id) {
    return this.users.find(user => user.id === parseInt(id));
  }

  // 根据邮箱查找用户
  async findByEmail(email) {
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // 根据MC号码查找承运商
  async findByMCNumber(mcNumber) {
    return this.users.find(user => 
      user.userType === 'carrier' && user.mcNumber === mcNumber
    );
  }

  // 更新用户信息
  async update(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  // 更新最后登录时间
  async updateLastLogin(id) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex !== -1) {
      this.users[userIndex].lastLoginAt = new Date();
    }

    return this.users[userIndex];
  }

  // 删除用户（软删除）
  async softDelete(id) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    this.users[userIndex].isActive = false;
    this.users[userIndex].updatedAt = new Date();

    return this.users[userIndex];
  }

  // 获取所有用户（管理员功能）
  async findAll(filters = {}) {
    let filteredUsers = [...this.users];

    // 按用户类型过滤
    if (filters.userType) {
      filteredUsers = filteredUsers.filter(user => 
        user.userType === filters.userType
      );
    }

    // 按状态过滤
    if (filters.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => 
        user.isActive === filters.isActive
      );
    }

    // 按公司名称搜索
    if (filters.companyName) {
      filteredUsers = filteredUsers.filter(user => 
        user.companyName.toLowerCase().includes(filters.companyName.toLowerCase())
      );
    }

    // 移除密码字段
    return filteredUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  // 统计信息
  async getStats() {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(user => user.isActive).length;
    const shippers = this.users.filter(user => user.userType === 'shipper').length;
    const carriers = this.users.filter(user => user.userType === 'carrier').length;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      shippers,
      carriers
    };
  }

  // 验证用户权限
  async hasPermission(userId, permission) {
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
  }

  // 清除所有数据（仅用于测试）
  async clearAll() {
    this.users = [];
    this.nextId = 1;
  }
}

// 创建单例实例
const userModel = new User();

// 初始化一些测试数据
userModel.create({
  email: 'shipper@test.com',
  password: '$2a$12$4VGZ6hQc5VAl2m5ovDXImeYiY8uvl1Cg2llGhdK53MYO/vMygqM9u', // password: test123
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  companyName: 'Test Shipping Co.',
  companyType: 'corporation',
  userType: 'shipper',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  businessLicense: 'SH123456',
  isActive: true,
  isVerified: true
});

userModel.create({
  email: 'carrier@test.com',
  password: '$2a$12$4VGZ6hQc5VAl2m5ovDXImeYiY8uvl1Cg2llGhdK53MYO/vMygqM9u', // password: test123
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+1987654321',
  companyName: 'Test Trucking LLC',
  companyType: 'llc',
  userType: 'carrier',
  address: '456 Oak Ave',
  city: 'Los Angeles',
  state: 'CA',
  zipCode: '90001',
  mcNumber: 'MC123456',
  dotNumber: 'DOT789012',
  businessLicense: 'CA987654',
  isActive: true,
  isVerified: true
});

module.exports = userModel; 