/**
 * 统一API客户端工具类
 * 解决重复的API URL定义和token处理问题
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// 获取认证token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

// 获取认证头
const getAuthHeaders = (additionalHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// 统一的API请求函数
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request Error [${config.method} ${url}]:`, error);
    throw error;
  }
};

// API客户端对象
export const apiClient = {
  // GET请求
  get: (endpoint, params = {}) => {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    return apiRequest(url.toString());
  },

  // POST请求
  post: (endpoint, data = {}) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // PUT请求
  put: (endpoint, data = {}) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // DELETE请求
  delete: (endpoint) => apiRequest(endpoint, {
    method: 'DELETE'
  }),

  // PATCH请求
  patch: (endpoint, data = {}) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};

// 具体业务API服务
export const apiServices = {
  // 认证服务
  auth: {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    register: (userData) => apiClient.post('/auth/register', userData),
    verify: () => apiClient.get('/auth/verify'),
    profile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    logout: () => apiClient.post('/auth/logout')
  },

  // 陆运服务
  landFreight: {
    getLoads: (params = {}) => apiClient.get('/landfreight/loads', params),
    getTrucks: (params = {}) => apiClient.get('/landfreight/trucks', params),
    createLoad: (data) => apiClient.post('/landfreight/loads', data),
    createTruck: (data) => apiClient.post('/landfreight/trucks', data),
    getMyPosts: () => apiClient.get('/landfreight/my-posts'),
    updateLoadStatus: (id, status) => apiClient.put(`/landfreight/loads/${id}/status`, { status }),
    updateTruckStatus: (id, status) => apiClient.put(`/landfreight/trucks/${id}/status`, { status }),
    deleteLoad: (id) => apiClient.delete(`/landfreight/loads/${id}`),
    deleteTruck: (id) => apiClient.delete(`/landfreight/trucks/${id}`)
  },

  // 公司服务
  companies: {
    getAll: (params = {}) => apiClient.get('/companies', params),
    getBySubcategory: (subcategory, params = {}) => apiClient.get(`/companies/subcategory/${encodeURIComponent(subcategory)}`, params),
    getStats: () => apiClient.get('/companies/stats/categories'),
    create: (data) => apiClient.post('/companies', data),
    update: (id, data) => apiClient.put(`/companies/${id}`, data),
    delete: (id) => apiClient.delete(`/companies/${id}`)
  },

  // 职位服务
  jobs: {
    getAll: (params = {}) => apiClient.get('/jobs', params),
    getStats: () => apiClient.get('/jobs/stats/categories'),
    getMyPosts: () => apiClient.get('/jobs/my/posts'),
    create: (data) => apiClient.post('/jobs', data),
    update: (id, data) => apiClient.put(`/jobs/${id}`, data),
    delete: (id) => apiClient.delete(`/jobs/${id}`)
  },

  // 简历服务
  resumes: {
    getAll: (params = {}) => apiClient.get('/resumes', params),
    getStats: () => apiClient.get('/resumes/stats/positions'),
    getMyPosts: () => apiClient.get('/resumes/my/posts'),
    create: (data) => apiClient.post('/resumes', data),
    update: (id, data) => apiClient.put(`/resumes/${id}`, data),
    delete: (id) => apiClient.delete(`/resumes/${id}`)
  },

  // 用户管理服务
  userManagement: {
    getCredits: () => apiClient.get('/user-management/credits'),
    getCreditHistory: () => apiClient.get('/user-management/credits/history'),
    getPosts: () => apiClient.get('/user-management/posts'),
    getSystemConfig: () => apiClient.get('/user-management/system-config'),
    updatePostStatus: (type, id, status) => apiClient.put(`/user-management/posts/${type}/${id}/status`, { status }),
    deletePost: (type, id) => apiClient.delete(`/user-management/posts/${type}/${id}`),
    recharge: (amount) => apiClient.post('/user-management/credits/recharge', { amount }),
    activatePremium: (data) => apiClient.post('/user-management/premium/activate', data)
  }
};

// 错误处理工具
export const handleApiError = (error, context = 'API调用') => {
  console.error(`${context}失败:`, error);
  
  // 根据错误类型返回用户友好的消息
  if (error.message.includes('Failed to fetch')) {
    return '网络连接失败，请检查网络连接';
  } else if (error.message.includes('401')) {
    return '请先登录系统';
  } else if (error.message.includes('403')) {
    return '权限不足';
  } else if (error.message.includes('404')) {
    return '请求的资源不存在';
  } else if (error.message.includes('500')) {
    return '服务器内部错误，请稍后重试';
  } else {
    return error.message || '操作失败，请重试';
  }
};

// 导出常用工具
export { API_BASE_URL, getAuthToken, getAuthHeaders };
export default apiClient; 