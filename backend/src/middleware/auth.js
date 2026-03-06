// AWS Cognito JWT验证中间件
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');
const { db } = require('../config/database');

// Cognito配置 — from environment
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.USER_POOL_ID;
if (!USER_POOL_ID) {
  console.warn('⚠️ COGNITO_USER_POOL_ID not set in environment');
}
const COGNITO_ISS = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`;

// 缓存JWKs
let jwks = null;
let jwksExpiry = 0;

// 获取Cognito的JWKs
const getJWKs = async () => {
  const now = Date.now();
  
  // 如果缓存还有效，返回缓存的JWKs
  if (jwks && jwksExpiry > now) {
    return jwks;
  }
  
  try {
    console.log('🔑 获取Cognito JWKs...');
    const response = await axios.get(`${COGNITO_ISS}/.well-known/jwks.json`);
    jwks = response.data.keys;
    jwksExpiry = now + (24 * 60 * 60 * 1000); // 缓存24小时
    console.log('✅ JWKs获取成功');
    return jwks;
  } catch (error) {
    console.error('❌ 获取JWKs失败:', error);
    throw new Error('Failed to fetch JWKs');
  }
};

// 验证Cognito JWT Token
const verifyCognitoToken = async (token) => {
  try {
    // 解码token头部
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      throw new Error('Invalid token');
    }

    // 获取JWKs
    const keys = await getJWKs();
    
    // 找到匹配的key
    const key = keys.find(k => k.kid === decodedToken.header.kid);
    if (!key) {
      throw new Error('Key not found');
    }

    // 将JWK转换为PEM
    const pem = jwkToPem(key);

    // 验证token
    const payload = jwt.verify(token, pem, {
      issuer: COGNITO_ISS,
      algorithms: ['RS256']
    });

    return payload;
  } catch (error) {
    console.error('Token验证失败:', error.message);
    throw error;
  }
};

// 同步Cognito用户到数据库
const syncCognitoUser = async (cognitoPayload) => {
  try {
    // 打印payload以调试
    console.log('📋 Cognito Payload:', JSON.stringify(cognitoPayload, null, 2));
    
    const cognitoSub = cognitoPayload.sub;
    // 修正email字段获取 - Cognito的ID token中email字段就是email
    let email = cognitoPayload.email || cognitoPayload['email'] || cognitoPayload['cognito:username'] || cognitoPayload.username;
    
    // 检查email是否为UUID格式（错误的数据），如果是则生成临时email
    if (email && email.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.warn('⚠️ Email为UUID格式，使用cognito_sub生成临时email');
      email = `user_${cognitoSub.substring(0, 8)}@welogx.com`;
    }
    
    if (!email) {
      console.error('❌ 无法从Cognito payload中获取email，使用cognito_sub生成临时email');
      email = `user_${cognitoSub.substring(0, 8)}@welogx.com`;
    }
    
    // 查找现有用户（先尝试cognito_sub，再尝试email）
    let user = await db('users')
      .where('cognito_sub', cognitoSub)
      .first();
    
    if (!user && email) {
      // 如果没找到，尝试通过email查找（忽略大小写）
      user = await db('users')
        .whereRaw('LOWER(email) = LOWER(?)', [email])
        .first();
    }
    
    if (!user) {
      // 创建新用户 - 使用固定默认值，避免额外的数据库查询导致失败
      console.log(`📝 创建新的Cognito用户: ${email}`);
      
      const bonusCredits = 500; // 固定默认值
      
      const insertData = {
        email: email,
        cognito_sub: cognitoSub,
        first_name: cognitoPayload.given_name || cognitoPayload.name?.split(' ')[0] || '',
        last_name: cognitoPayload.family_name || cognitoPayload.name?.split(' ')[1] || '',
        phone: cognitoPayload.phone_number || '',
        user_type: 'shipper',
        is_active: true,
        is_verified: cognitoPayload.email_verified || false,
        is_employee: false,
        credits: bonusCredits,
        total_credits_earned: bonusCredits,
        total_credits_spent: 0,
        last_login_at: new Date()
      };
      
      console.log('📝 插入用户数据:', JSON.stringify(insertData, null, 2));
      
      try {
        const [newUser] = await db('users')
          .insert(insertData)
          .returning('*');
        user = newUser;
        console.log('✅ 用户创建成功:', user.id, user.email);
      } catch (insertError) {
        console.error('❌ 插入用户失败:', insertError.message);
        console.error('❌ 插入数据:', insertData);
        // 可能是并发插入导致的唯一约束冲突，再次尝试查询
        user = await db('users')
          .whereRaw('LOWER(email) = LOWER(?)', [email])
          .orWhere('cognito_sub', cognitoSub)
          .first();
        if (user) {
          console.log('✅ 找到已存在的用户:', user.id);
        } else {
          throw insertError;
        }
      }
    } else {
      // 更新现有用户
      console.log(`🔄 更新Cognito用户: ${email} (ID: ${user.id})`);
      await db('users')
        .where('id', user.id)
        .update({
          cognito_sub: cognitoSub,
          first_name: cognitoPayload.given_name || user.first_name,
          last_name: cognitoPayload.family_name || user.last_name,
          phone: cognitoPayload.phone_number || user.phone,
          is_verified: cognitoPayload.email_verified || user.is_verified,
          last_login_at: new Date()
        });
      
      // 重新获取更新后的用户
      user = await db('users').where('id', user.id).first();
    }
    
    return user;
  } catch (error) {
    console.error('❌ 同步Cognito用户失败:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
    throw error;
  }
};

// 认证中间件
const auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('⚠️ 缺少Authorization header，拒绝访问');
      return res.status(401).json({ 
        success: false, 
        message: '需要登录才能访问' 
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    //  Mock模式支持（本地开发）
    if (token === 'mock-jwt-token-for-development') {
      console.log('🔧 Mock模式 - 使用Mock用户');
      
      try {
        // 从数据库获取Mock用户
        const mockUser = await db('users')
          .where('email', 'dev@welogx.com')
          .first();
        
        if (mockUser) {
          req.user = {
            id: mockUser.id,
            userId: mockUser.id,
            email: mockUser.email,
            username: mockUser.email,
            userType: 'shipper',
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
            phone_number: mockUser.phone,
            credits: mockUser.credits || 9999,
            given_name: mockUser.first_name,
            family_name: mockUser.last_name,
            // 员工系统相关字段
            isEmployee: mockUser.is_employee || false,
            employeeRole: mockUser.employee_role || null,
            employeeId: mockUser.employee_id || null
          };
          console.log('✅ Mock用户认证成功:', mockUser.email, '角色:', mockUser.employee_role);
          return next();
        } else {
          console.error('❌ Mock用户不存在');
          return res.status(401).json({ 
            success: false, 
            message: 'Mock用户未配置，请运行数据库导入脚本' 
          });
        }
      } catch (error) {
        console.error('❌ Mock认证失败:', error);
        return res.status(401).json({ 
          success: false, 
          message: '认证失败' 
        });
      }
    }
    
    try {
      // 验证Cognito token
      const payload = await verifyCognitoToken(token);
      
      console.log('✅ Token验证成功:', payload.email);
      
      // 同步用户到数据库 - 重试机制
      let dbUser;
      let syncAttempts = 0;
      const maxAttempts = 2;
      
      while (syncAttempts < maxAttempts) {
        try {
          syncAttempts++;
          dbUser = await syncCognitoUser(payload);
          break; // 成功则退出循环
        } catch (syncError) {
          console.error(`❌ 同步用户失败 (尝试 ${syncAttempts}/${maxAttempts}):`, syncError.message);
          if (syncAttempts >= maxAttempts) {
            console.error('❌ 所有同步尝试均失败，使用临时用户信息');
            // 同步失败时使用临时信息，但记录详细日志
            req.user = {
              id: payload.sub,
              userId: payload.sub,
              email: payload.email || payload.username || 'unknown@example.com',
              username: payload.email || payload.username,
              userType: 'shipper',
              phone_number: payload.phone_number || '',
              credits: 0,
              first_name: payload.given_name || '',
              last_name: payload.family_name || '',
              _syncFailed: true // 标记同步失败
            };
            return next();
          }
          // 等待100ms后重试
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // 设置用户信息（使用数据库中的信息）
      req.user = {
        id: dbUser.id,
        userId: dbUser.id,
        email: dbUser.email,
        username: dbUser.email,
        userType: 'shipper', // 统一使用shipper
        given_name: dbUser.first_name,
        family_name: dbUser.last_name,
        phone_number: dbUser.phone,
        credits: dbUser.credits,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        // 员工系统相关字段
        isEmployee: dbUser.is_employee || false,
        employeeRole: dbUser.employee_role || null,
        employeeId: dbUser.employee_id || null
      };
      
      next();
    } catch (cognitoError) {
      console.log('⚠️ Cognito token验证失败，尝试验证旧格式token');
      
      // 兼容旧的JWT token格式
      try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.userId || decoded.id,
          userId: decoded.userId || decoded.id,
          email: decoded.email,
          userType: decoded.userType || 'shipper'
        };
        next();
      } catch (legacyError) {
        console.error('❌ 所有token验证都失败');
        return res.status(401).json({ 
          success: false, 
          message: '认证失败，请重新登录' 
        });
      }
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 可选认证中间件
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Mock模式支持（本地开发）
    if (token === 'mock-jwt-token-for-development') {
      console.log('🔧 可选认证：Mock模式');
      
      try {
        const mockUser = await db('users')
          .where('email', 'dev@welogx.com')
          .first();
        
        if (mockUser) {
          req.user = {
            id: mockUser.id,
            userId: mockUser.id,
            email: mockUser.email,
            username: mockUser.email,
            userType: 'shipper',
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
            phone_number: mockUser.phone,
            credits: mockUser.credits || 9999,
            // 员工系统相关字段
            isEmployee: mockUser.is_employee || false,
            employeeRole: mockUser.employee_role || null,
            employeeId: mockUser.employee_id || null
          };
          return next();
        }
      } catch (error) {
        console.error('❌ 可选认证：Mock用户获取失败:', error);
      }
      req.user = null;
      return next();
    }
    
    try {
      const payload = await verifyCognitoToken(token);
      let dbUser;
      try {
        dbUser = await syncCognitoUser(payload);
        req.user = {
          id: dbUser.id,
          userId: dbUser.id,
          email: dbUser.email,
          username: dbUser.email,
          userType: 'shipper',
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          phone_number: dbUser.phone,
          credits: dbUser.credits,
          // 员工系统相关字段
          isEmployee: dbUser.is_employee || false,
          employeeRole: dbUser.employee_role || null,
          employeeId: dbUser.employee_id || null
        };
      } catch (syncError) {
        console.error('❌ 可选认证：同步用户失败:', syncError.message);
        // 使用token信息作为fallback
        req.user = {
          id: payload.sub,
          userId: payload.sub,
          email: payload.email || payload.username || 'unknown@example.com',
          username: payload.email || payload.username,
          userType: 'shipper',
          phone_number: payload.phone_number || '',
          credits: 0,
          first_name: payload.given_name || '',
          last_name: payload.family_name || ''
        };
      }
    } catch (error) {
      // Token无效时，仍然允许访问，但user为null
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    req.user = null;
    next();
  }
};

// 角色验证中间件
const requireRole = (roles) => {
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

// 员工角色验证中间件
const requireEmployeeRole = (allowedRoles) => {
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
      console.error('权限检查失败:', error);
      res.status(500).json({ 
        success: false, 
        message: '权限检查失败' 
      });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireEmployee,
  requireEmployeeRole,
  requirePermission
};