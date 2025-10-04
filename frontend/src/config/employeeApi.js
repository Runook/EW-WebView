// 员工服务API配置

// 员工服务基础URL
const EMPLOYEE_API_BASE_URL = process.env.REACT_APP_EMPLOYEE_API_URL || 'http://localhost:3001/api';

// 获取认证Token
const getAuthToken = () => {
  // 兼容多种Token存储方式
  const token = localStorage.getItem('idToken') ||  // Mock模式和Cognito
                localStorage.getItem('authToken') || // 备用key
                localStorage.getItem('accessToken'); // 备用key
  return token;
};

// 创建请求配置
const createConfig = (method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  return config;
};

// API请求封装
const request = async (endpoint, method = 'GET', body = null) => {
  try {
    const url = `${EMPLOYEE_API_BASE_URL}${endpoint}`;
    const config = createConfig(method, body);

    console.log(`[员工API] ${method} ${url}`);
    if (body) {
      console.log('[员工API] 请求体:', body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`[员工API] 响应状态: ${response.status}`);
    console.log('[员工API] 响应数据:', data);

    if (!response.ok) {
      const errorMsg = data.message || `请求失败: ${response.status}`;
      console.error('[员工API] 错误详情:', data);
      const error = new Error(errorMsg);
      error.response = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[员工API] 请求失败:', error);
    throw error;
  }
};

// ==========================================
// 员工管理 API
// ==========================================

export const employeeApi = {
  // 获取所有员工
  getAllEmployees: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/employees?${queryParams}`);
  },

  // 获取员工详情
  getEmployeeById: (id) => {
    return request(`/employees/${id}`);
  },

  // 获取当前员工信息
  getCurrentEmployee: () => {
    return request('/employees/me/info');
  },

  // 设置用户为员工
  setUserAsEmployee: (userId, role, employeeId = null) => {
    return request('/employees/set', 'POST', { userId, role, employeeId });
  },

  // 更新员工信息
  updateEmployee: (id, data) => {
    return request(`/employees/${id}`, 'PUT', data);
  },

  // 移除员工身份
  removeEmployee: (id) => {
    return request(`/employees/${id}`, 'DELETE');
  },

  // 获取员工统计
  getEmployeeStats: (id) => {
    return request(`/employees/${id}/stats`);
  },

  // 获取员工权限
  getEmployeePermissions: (id) => {
    return request(`/employees/${id}/permissions`);
  },
};

// ==========================================
// 订单管理 API
// ==========================================

export const orderApi = {
  // 获取订单列表
  getOrders: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/orders?${queryParams}`);
  },

  // 获取订单详情
  getOrderById: (id) => {
    return request(`/orders/${id}`);
  },

  // 创建订单
  createOrder: (orderData) => {
    return request('/orders', 'POST', orderData);
  },

  // 更新订单
  updateOrder: (id, orderData) => {
    return request(`/orders/${id}`, 'PUT', orderData);
  },

  // 删除订单
  deleteOrder: (id) => {
    return request(`/orders/${id}`, 'DELETE');
  },

  // 添加订单评论
  addComment: (id, comment, isInternal = true) => {
    return request(`/orders/${id}/comments`, 'POST', { comment, isInternal });
  },

  // 分配订单
  assignOrder: (id, assignedTo) => {
    return request(`/orders/${id}/assign`, 'POST', { assignedTo });
  },

  // 获取订单统计
  getStatistics: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/orders/statistics?${queryParams}`);
  },
  
  // 确认订单（报价单 → 已下单）
  confirmOrder: (id, subStatus = 'waiting_driver') => {
    return request(`/orders/${id}/confirm`, 'POST', { sub_status: subStatus });
  },
  
  // 完成订单（已下单 → 已完成）
  completeOrder: (id) => {
    return request(`/orders/${id}/complete`, 'POST');
  },
  
  // 更新子状态
  updateSubStatus: (id, subStatus) => {
    return request(`/orders/${id}/sub-status`, 'PUT', { sub_status: subStatus });
  },

  // 取消订单
  cancelOrder: (id) => {
    return request(`/orders/${id}/cancel`, 'POST');
  },
  
  // 申请索赔
  requestClaim: (id, claimReason) => {
    return request(`/orders/${id}/claim`, 'POST', { claim_reason: claimReason });
  },
  
  // 解决索赔
  resolveClaim: (id, resolution) => {
    return request(`/orders/${id}/resolve-claim`, 'POST', { resolution });
  },
};

// ==========================================
// 工具函数
// ==========================================

export const employeeUtils = {
  // 订单状态标签
  getStatusLabel: (status) => {
    const labels = {
      draft: '草稿',
      pending: '待处理',
      confirmed: '已确认',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      on_hold: '暂停'
    };
    return labels[status] || status;
  },

  // 订单状态颜色
  getStatusColor: (status) => {
    const colors = {
      draft: 'gray',
      pending: 'orange',
      confirmed: 'blue',
      in_progress: 'cyan',
      completed: 'green',
      cancelled: 'red',
      on_hold: 'yellow'
    };
    return colors[status] || 'default';
  },

  // 订单类型标签
  getOrderTypeLabel: (type) => {
    const labels = {
      land_freight: '陆运',
      sea_freight: '海运',
      air_freight: '空运',
      warehouse: '仓储',
      customs: '报关',
      other: '其他'
    };
    return labels[type] || type;
  },

  // 优先级标签
  getPriorityLabel: (priority) => {
    const labels = {
      low: '低',
      normal: '正常',
      high: '高',
      urgent: '紧急'
    };
    return labels[priority] || priority;
  },

  // 优先级颜色
  getPriorityColor: (priority) => {
    const colors = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'default';
  },

  // 角色标签
  getRoleLabel: (role) => {
    const labels = {
      employee: '员工',
      manager: '经理',
      admin: '管理员'
    };
    return labels[role] || role;
  },

  // 格式化金额
  formatCurrency: (amount, currency = 'USD') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // 格式化日期
  formatDate: (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  // 格式化日期时间
  formatDateTime: (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
};

export default {
  employeeApi,
  orderApi,
  employeeUtils,
};

