// API配置文件
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    PROFILE: `${API_BASE_URL}/auth/profile`
  },
  
  // 陆运相关
  LAND_FREIGHT: {
    LOADS: `${API_BASE_URL}/landfreight/loads`,
    TRUCKS: `${API_BASE_URL}/landfreight/trucks`,
    MY_POSTS: `${API_BASE_URL}/landfreight/my-posts`
  },
  
  // 海运相关
  SEA_FREIGHT: {
    CARGO: `${API_BASE_URL}/seafreight/cargo`,
    DEMANDS: `${API_BASE_URL}/seafreight/demands`,
    MY_POSTS: `${API_BASE_URL}/seafreight/my-posts`,
    STATS: `${API_BASE_URL}/seafreight/stats`
  },
  
  // 空运相关
  AIR_FREIGHT: {
    CARGO: `${API_BASE_URL}/airfreight/cargo`,
    DEMANDS: `${API_BASE_URL}/airfreight/demands`,
    MY_POSTS: `${API_BASE_URL}/airfreight/my-posts`
  },
  
  // 系统相关
  SYSTEM: {
    HEALTH: `${API_BASE_URL.replace('/api', '')}/health`,
    INFO: `${API_BASE_URL}`
  }
};

// HTTP请求配置
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

// 请求头配置
export const getAuthHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const authToken = token || localStorage.getItem('token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

// 通用API请求函数
export const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    method: HTTP_METHODS.GET,
    headers: getAuthHeaders()
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// 专用API服务函数
export const ApiService = {
  // 陆运服务
  landFreight: {
    getLoads: (params = {}) => {
      const url = new URL(API_ENDPOINTS.LAND_FREIGHT.LOADS);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    getTrucks: (params = {}) => {
      const url = new URL(API_ENDPOINTS.LAND_FREIGHT.TRUCKS);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    createLoad: (data) => apiRequest(API_ENDPOINTS.LAND_FREIGHT.LOADS, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    }),
    
    createTruck: (data) => apiRequest(API_ENDPOINTS.LAND_FREIGHT.TRUCKS, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    })
  },
  
  // 海运服务
  seaFreight: {
    getCargo: (params = {}) => {
      const url = new URL(API_ENDPOINTS.SEA_FREIGHT.CARGO);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    getDemands: (params = {}) => {
      const url = new URL(API_ENDPOINTS.SEA_FREIGHT.DEMANDS);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    createCargo: (data) => apiRequest(API_ENDPOINTS.SEA_FREIGHT.CARGO, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    }),
    
    createDemand: (data) => apiRequest(API_ENDPOINTS.SEA_FREIGHT.DEMANDS, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    })
  },
  
  // 空运服务
  airFreight: {
    getCargo: (params = {}) => {
      const url = new URL(API_ENDPOINTS.AIR_FREIGHT.CARGO);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    getDemands: (params = {}) => {
      const url = new URL(API_ENDPOINTS.AIR_FREIGHT.DEMANDS);
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      return apiRequest(url.toString());
    },
    
    createCargo: (data) => apiRequest(API_ENDPOINTS.AIR_FREIGHT.CARGO, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    }),
    
    createDemand: (data) => apiRequest(API_ENDPOINTS.AIR_FREIGHT.DEMANDS, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    })
  }
};

export default ApiService; 