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

  // 搜索非员工用户
  searchUsers: (query) => {
    const queryParams = new URLSearchParams({ query }).toString();
    return request(`/employees/search-users?${queryParams}`);
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

// 客户API
const customerApi = {
  // 获取客户列表
  getCustomers: (search = '') => {
    return request(`/customers?search=${encodeURIComponent(search)}`);
  },

  // 搜索客户（自动补全）
  searchCustomers: (keyword) => {
    return request(`/customers/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // 创建客户
  createCustomer: (customerData) => {
    return request('/customers', 'POST', customerData);
  },

  // 更新客户
  updateCustomer: (id, customerData) => {
    return request(`/customers/${id}`, 'PUT', customerData);
  },

  // 删除客户
  deleteCustomer: (id) => {
    return request(`/customers/${id}`, 'DELETE');
  },
};

// ==========================================
// 卡车联系簿 API (旧版兼容)
// ==========================================

export const truckContactApi = {
  // 获取联系簿列表
  getContacts: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/truck-contacts${params}`);
  },

  // 搜索联系人（用于自动补全）
  searchContacts: (keyword, field = '') => {
    const params = new URLSearchParams({ q: keyword });
    if (field) params.append('field', field);
    return request(`/truck-contacts/search?${params.toString()}`);
  },

  // 保存新联系人
  saveContact: (contactData) => {
    return request('/truck-contacts', 'POST', contactData);
  },

  // 更新联系人
  updateContact: (id, contactData) => {
    return request(`/truck-contacts/${id}`, 'PUT', contactData);
  },

  // 删除联系人
  deleteContact: (id) => {
    return request(`/truck-contacts/${id}`, 'DELETE');
  },
};

// ==========================================
// 供应商管理 API (增强版卡车联系簿)
// ==========================================

export const vendorApi = {
  // 获取供应商列表
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/vendors?${queryParams}`);
  },

  // 获取供应商详情
  getById: (id) => {
    return request(`/vendors/${id}`);
  },

  // 搜索供应商（用于自动补全）
  search: (keyword, field = '') => {
    const params = new URLSearchParams({ q: keyword });
    if (field) params.append('field', field);
    return request(`/vendors/search?${params.toString()}`);
  },

  // 创建供应商
  create: (data) => {
    return request('/vendors', 'POST', data);
  },

  // 更新供应商
  update: (id, data) => {
    return request(`/vendors/${id}`, 'PUT', data);
  },

  // 删除供应商
  delete: (id) => {
    return request(`/vendors/${id}`, 'DELETE');
  },

  // 获取供应商统计
  getStats: (id) => {
    return request(`/vendors/${id}/stats`);
  },
};

// ==========================================
// 付款记录 API
// ==========================================

export const paymentApi = {
  // 获取付款记录列表
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/payments?${queryParams}`);
  },

  // 获取付款记录详情
  getById: (id) => {
    return request(`/payments/${id}`);
  },

  // 获取订单的付款记录
  getByOrderId: (orderId) => {
    return request(`/payments/order/${orderId}`);
  },

  // 获取付款统计
  getStatistics: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/payments/statistics?${queryParams}`);
  },

  // 创建付款记录
  create: (data) => {
    return request('/payments', 'POST', data);
  },

  // 更新付款记录
  update: (id, data) => {
    return request(`/payments/${id}`, 'PUT', data);
  },

  // 删除付款记录
  delete: (id) => {
    return request(`/payments/${id}`, 'DELETE');
  },
};

// ==========================================
// 服务项目 API
// ==========================================

export const serviceItemApi = {
  // 获取服务项目列表
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return request(`/service-items?${queryParams}`);
  },

  // 获取服务项目详情
  getById: (id) => {
    return request(`/service-items/${id}`);
  },

  // 创建服务项目
  create: (data) => {
    return request('/service-items', 'POST', data);
  },

  // 更新服务项目
  update: (id, data) => {
    return request(`/service-items/${id}`, 'PUT', data);
  },

  // 删除服务项目
  delete: (id) => {
    return request(`/service-items/${id}`, 'DELETE');
  },

  // 切换服务项目状态
  toggle: (id) => {
    return request(`/service-items/${id}/toggle`, 'POST');
  },
};

// ==========================================
// 工具函数扩展
// ==========================================

// 付款方式标签
employeeUtils.getPaymentMethodLabel = (method) => {
  const labels = {
    check: '支票',
    ach: 'ACH转账',
    zelle: 'Zelle',
    wire: '电汇',
    credit_card: '信用卡',
    cash: '现金'
  };
  return labels[method] || method;
};

// 付款类型标签
employeeUtils.getPaymentTypeLabel = (type) => {
  const labels = {
    customer_payment: '客户付款',
    vendor_payment: '供应商付款'
  };
  return labels[type] || type;
};

// 付款条款标签
employeeUtils.getPaymentTermsLabel = (terms) => {
  const labels = {
    'Due on Receipt': '收到即付',
    'Net 15': '15天内付款',
    'Net 30': '30天内付款',
    'Net 45': '45天内付款',
    'Net 60': '60天内付款'
  };
  return labels[terms] || terms;
};

export default {
  employeeApi,
  orderApi,
  customerApi,
  employeeUtils,
  truckContactApi,
  vendorApi,
  paymentApi,
  serviceItemApi,
};

