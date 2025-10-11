require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Cognito配置
  cognito: {
    region: process.env.COGNITO_REGION || 'us-east-1',
    userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_HU9W7uLQA'
  },
  
  // 服务信息
  service: {
    name: 'EW Employee Service',
    version: '1.0.0',
    description: 'Employee Management Microservice'
  }
};

