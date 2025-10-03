/**
 * 认证中间件统一入口
 * 根据环境自动选择使用Mock认证还是Cognito认证
 */

const { auth: cognitoAuth, optionalAuth: cognitoOptionalAuth, requireRole: cognitoRequireRole } = require('./auth');
const { mockAuth, mockOptionalAuth, mockRequireRole } = require('./mockAuth');

// 根据环境变量决定使用哪种认证模式
const AUTH_MODE = process.env.AUTH_MODE || 'cognito';
const IS_MOCK = AUTH_MODE === 'mock';

console.log(`🔐 认证模式: ${IS_MOCK ? 'Mock (本地开发)' : 'Cognito (生产环境)'}`);

// 导出对应的认证中间件
module.exports = {
  auth: IS_MOCK ? mockAuth : cognitoAuth,
  optionalAuth: IS_MOCK ? mockOptionalAuth : cognitoOptionalAuth,
  requireRole: IS_MOCK ? mockRequireRole : cognitoRequireRole
};

