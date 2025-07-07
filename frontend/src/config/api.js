// API配置文件 - 现在使用统一的API客户端
import { 
  API_BASE_URL, 
  apiServices, 
  handleApiError, 
  getAuthToken, 
  getAuthHeaders 
} from '../utils/apiClient';

// 兼容性 - 保持旧的API端点配置格式（逐步迁移时使用）
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

// 导出统一的API服务（推荐使用）
export { apiServices, handleApiError, getAuthToken, getAuthHeaders };

// HTTP请求配置（兼容性保持）
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

// 兼容性别名 - 逐步迁移旧代码时使用
export const ApiService = apiServices;

export default apiServices; 