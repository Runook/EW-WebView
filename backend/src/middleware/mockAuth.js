/**
 * Mock认证中间件
 * 用于本地开发环境，绕过AWS Cognito认证
 */

const mockUser = {
  id: parseInt(process.env.MOCK_USER_ID) || 1,
  userId: parseInt(process.env.MOCK_USER_ID) || 1,
  email: process.env.MOCK_USER_EMAIL || 'dev@welogx.com',
  username: process.env.MOCK_USER_EMAIL || 'dev@welogx.com',
  userType: 'shipper',
  first_name: '开发',
  last_name: '者',
  phone_number: '+1234567890',
  credits: parseInt(process.env.MOCK_USER_CREDITS) || 9999,
  given_name: '开发',
  family_name: '者'
};

// Mock认证中间件
const mockAuth = (req, res, next) => {
  console.log('🔧 使用Mock认证模式 (开发环境)');
  req.user = mockUser;
  next();
};

// Mock可选认证中间件
const mockOptionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
  } else {
    req.user = mockUser;
  }
  
  next();
};

// Mock角色验证中间件
const mockRequireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '需要登录' 
      });
    }

    const userRole = req.user.userType || 'shipper';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    next();
  };
};

module.exports = {
  mockAuth,
  mockOptionalAuth,
  mockRequireRole
};

