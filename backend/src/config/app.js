// 确保环境变量在配置之前加载
require('dotenv').config();

const config = {
  // 应用配置
  app: {
    name: 'EW Logistics Platform',
    version: '1.0.0',
    port: process.env.PORT || 5001,
    env: process.env.NODE_ENV || 'development'
  },

  // 数据库配置
  database: {
    host: process.env.NODE_ENV === 'production' ? process.env.RDS_ENDPOINT : process.env.DB_HOST || 'localhost',
    port: process.env.NODE_ENV === 'production' ? process.env.RDS_PORT : process.env.DB_PORT || 5432,
    name: process.env.NODE_ENV === 'production' ? process.env.RDS_DB_NAME : process.env.DB_NAME || 'ew_logistics',
    user: process.env.NODE_ENV === 'production' ? process.env.RDS_USERNAME : process.env.DB_USER || 'postgres',
    password: process.env.NODE_ENV === 'production' ? process.env.RDS_PASSWORD : process.env.DB_PASSWORD || 'password'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // CORS配置
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // AWS配置
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID,
      region: process.env.COGNITO_REGION || 'us-east-1'
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // 健康检查配置
  health: {
    timeout: 5000, // 健康检查超时时间
    interval: 30000 // 健康检查间隔
  }
};

// 验证必要的环境变量
const validateConfig = () => {
  const required = [];
  
  if (config.app.env === 'production') {
    if (!config.jwt.secret || config.jwt.secret === 'your-secret-key-change-this-in-production') {
      required.push('JWT_SECRET');
    }
    if (!config.database.host) required.push('RDS_ENDPOINT');
    if (!config.database.user) required.push('RDS_USERNAME');
    if (!config.database.password) required.push('RDS_PASSWORD');
  }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
};

// 在生产环境验证配置
if (config.app.env === 'production') {
  validateConfig();
}

module.exports = config;
