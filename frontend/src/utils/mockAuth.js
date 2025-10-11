/**
 * Mock认证工具
 * 用于本地开发环境，绕过AWS Cognito认证
 */

const MOCK_USER = {
  email: 'dev@ewltl.com',
  sub: 'mock-user-sub-123',
  given_name: '开发',
  family_name: '者',
  phone_number: '+1234567890',
  email_verified: true,
  // 员工系统相关字段（本地开发用）
  isEmployee: true,
  employeeRole: 'admin', // admin, manager, employee
  employeeId: 'EW240001'
};

const MOCK_TOKEN = 'mock-jwt-token-for-development';

/**
 * 检查是否为Mock模式
 */
export const isMockMode = () => {
  return process.env.REACT_APP_AUTH_MODE === 'mock' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Mock登录
 */
export const mockLogin = () => {
  console.log('🔧 使用Mock登录 (开发模式)');
  localStorage.setItem('idToken', MOCK_TOKEN);
  localStorage.setItem('accessToken', MOCK_TOKEN);
  localStorage.setItem('refreshToken', MOCK_TOKEN);
  localStorage.setItem('user', JSON.stringify(MOCK_USER));
  return { success: true, user: MOCK_USER };
};

/**
 * 自动Mock登录
 * 如果是开发环境且未登录，自动使用Mock用户
 */
export const autoMockLogin = () => {
  if (isMockMode()) {
    const existingUser = localStorage.getItem('user');
    if (!existingUser) {
      console.log('🔧 自动Mock登录 (开发模式)');
      mockLogin();
      return true;
    }
  }
  return false;
};

/**
 * 获取Mock Token
 */
export const getMockToken = () => {
  return MOCK_TOKEN;
};

/**
 * 获取Mock用户
 */
export const getMockUser = () => {
  return MOCK_USER;
};

