// 员工服务认证中间件
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');
const { db } = require('../config/database');
const config = require('../config/app');

// Cognito配置
const COGNITO_REGION = config.cognito.region;
const USER_POOL_ID = config.cognito.userPoolId;
const COGNITO_ISS = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`;

// 缓存JWKs
let jwks = null;
let jwksExpiry = 0;

// 获取Cognito的JWKs
const getJWKs = async () => {
  const now = Date.now();
  
  if (jwks && jwksExpiry > now) {
    return jwks;
  }
  
  try {
    console.log('🔑 [员工服务] 获取Cognito JWKs...');
    const response = await axios.get(`${COGNITO_ISS}/.well-known/jwks.json`);
    jwks = response.data.keys;
    jwksExpiry = now + (24 * 60 * 60 * 1000); // 缓存24小时
    console.log('✅ [员工服务] JWKs获取成功');
    return jwks;
  } catch (error) {
    console.error('❌ [员工服务] 获取JWKs失败:', error);
    throw new Error('Failed to fetch JWKs');
  }
};

// 验证Cognito JWT Token
const verifyCognitoToken = async (token) => {
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      throw new Error('Invalid token');
    }

    const keys = await getJWKs();
    const key = keys.find(k => k.kid === decodedToken.header.kid);
    if (!key) {
      throw new Error('Key not found');
    }

    const pem = jwkToPem(key);
    const payload = jwt.verify(token, pem, {
      issuer: COGNITO_ISS,
      algorithms: ['RS256']
    });

    return payload;
  } catch (error) {
    console.error('[员工服务] Token验证失败:', error.message);
    throw error;
  }
};

// 获取用户信息（包括员工信息）
const getUserWithEmployeeInfo = async (cognitoSub) => {
  try {
    const user = await db('users')
      .where('cognito_sub', cognitoSub)
      .first();
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return user;
  } catch (error) {
    console.error('[员工服务] 获取用户信息失败:', error);
    throw error;
  }
};

// 认证中间件
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '需要登录才能访问' 
      });
    }

    const token = authHeader.substring(7);
    
    // 🔧 Mock模式支持（本地开发）
    if (token === 'mock-jwt-token-for-development') {
      console.log('🔧 [员工服务] Mock模式 - 使用Mock用户');
      
      try {
        // 从数据库获取Mock用户
        const mockUser = await db('users')
          .where('email', 'dev@ewltl.com')
          .first();
        
        if (mockUser) {
          req.user = {
            id: mockUser.id,
            userId: mockUser.id,
            email: mockUser.email,
            cognitoSub: 'mock-user-sub-123',
            firstName: mockUser.first_name,
            lastName: mockUser.last_name,
            phone: mockUser.phone,
            isEmployee: mockUser.is_employee,
            employeeRole: mockUser.employee_role,
            employeeId: mockUser.employee_id
          };
          console.log('✅ [员工服务] Mock用户认证成功:', mockUser.email, '角色:', mockUser.employee_role);
          return next();
        } else {
          console.error('❌ [员工服务] Mock用户不存在');
          return res.status(401).json({ 
            success: false, 
            message: 'Mock用户未配置' 
          });
        }
      } catch (error) {
        console.error('❌ [员工服务] Mock认证失败:', error);
        return res.status(401).json({ 
          success: false, 
          message: '认证失败' 
        });
      }
    }
    
    try {
      // 验证Cognito token
      const payload = await verifyCognitoToken(token);
      
      // 获取用户信息（包括员工状态）
      const user = await getUserWithEmployeeInfo(payload.sub);
      
      // 设置用户信息
      req.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        cognitoSub: user.cognito_sub,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isEmployee: user.is_employee,
        employeeRole: user.employee_role,
        employeeId: user.employee_id
      };
      
      console.log(`✅ [员工服务] 用户认证成功: ${user.email} (员工: ${user.is_employee})`);
      next();
    } catch (cognitoError) {
      console.error('[员工服务] Cognito认证失败:', cognitoError.message);
      return res.status(401).json({ 
        success: false, 
        message: '认证失败，请重新登录' 
      });
    }
  } catch (error) {
    console.error('[员工服务] 认证中间件错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 员工认证中间件 - 要求用户必须是员工
const requireEmployee = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: '需要登录' 
    });
  }
  
  if (!req.user.isEmployee) {
    return res.status(403).json({ 
      success: false, 
      message: '只有员工可以访问此功能' 
    });
  }
  
  next();
};

// 角色验证中间件
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '需要登录' 
      });
    }
    
    if (!req.user.isEmployee) {
      return res.status(403).json({ 
        success: false, 
        message: '只有员工可以访问' 
      });
    }
    
    const userRole = req.user.employeeRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }
    
    next();
  };
};

// 权限检查中间件
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.isEmployee) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }
    
    try {
      const userRole = req.user.employeeRole;
      
      // 检查该角色是否有此权限
      const hasPermission = await db('employee_role_permissions as erp')
        .join('employee_permissions as ep', 'erp.permission_id', 'ep.id')
        .where('erp.role', userRole)
        .where('ep.permission_key', permissionKey)
        .first();
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: '您没有执行此操作的权限' 
        });
      }
      
      next();
    } catch (error) {
      console.error('[员工服务] 权限检查失败:', error);
      res.status(500).json({ 
        success: false, 
        message: '权限检查失败' 
      });
    }
  };
};

module.exports = {
  auth,
  requireEmployee,
  requireRole,
  requirePermission
};

