const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/database');
const { getRedisStatus, getRedisClient } = require('./config/redis');
const config = require('./config/app');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = config.app.port;

// PostgreSQL 连接测试
testConnection();

// 使用自定义日志记录器
app.use((req, res, next) => {
  logger.logRequest(req, res, next);
});

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS 配置
app.use(cors(config.cors));

// 请求限制 (Redis-backed if available, fallback to in-memory)
const rateLimitConfig = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many requests',
      message: '请求过于频繁，请稍后再试',
      retryAfter: 60
    });
  }
};

// 如果 Redis 可用，用 Redis 做分布式限流
const redisClient = getRedisClient();
if (redisClient) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    rateLimitConfig.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    });
    console.log('✅ Rate limiting: 使用 Redis 存储');
  } catch (e) {
    console.log('⚠️ Rate limiting: Redis store 加载失败，使用内存存储');
  }
} else {
  console.log('ℹ️ Rate limiting: 使用内存存储');
}

const limiter = rateLimit(rateLimitConfig);
app.use('/api/', limiter);

// 认证路由严格限流
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts', message: '认证请求过于频繁，请15分钟后再试' }
});
app.use('/api/auth/', authLimiter);

// 中间件
app.use(compression());
app.use(morgan(config.logging.format));
app.use(express.json({ limit: '50mb' })); // 增加JSON限制到50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // 增加URL编码限制到50MB

// 静态文件服务 - 为上传的媒体文件提供服务（通过/api/uploads路由）
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// 请求日志中间件
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// 响应时间中间件
app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 5000) { // 记录慢请求
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`
      });
    }
  });
  next();
});

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 快速健康检查
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      redis: getRedisStatus(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});//测试

// API健康检查端点 (用于负载均衡器)
app.get('/api/health', async (req, res) => {
  try {
    // 快速健康检查，不等待数据库连接
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 就绪检查端点 (Kubernetes style)
app.get('/ready', async (req, res) => {
  try {
    const { testConnection } = require('./config/database');
    const dbStatus = await testConnection();
    
    if (dbStatus) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database connection failed' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: error.message });
  }
});

// 存活检查端点 (Kubernetes style)
app.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: config.app.name + ' API',
    version: config.app.version,
    environment: config.app.env,
    database: 'PostgreSQL',
    endpoints: {
      health: '/health',
      ready: '/ready',
      live: '/live',
      api: '/api',
      freight: '/api/landfreight',
      companies: '/api/companies',
      jobs: '/api/jobs',
      resumes: '/api/resumes',
      users: '/api/user-management',
      fba: '/api/fba',
      rentals: '/api/rentals',
      sales: '/api/sales',
      upload: '/api/upload',
      auth: 'AWS Cognito (外部认证)'
    }
  });
});

// 路由文件 - auth路由已移除，改用AWS Cognito
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/landfreight', require('./routes/landfreight'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/sitemap', require('./routes/sitemap'));
app.use('/api/user-management', require('./routes/user-management'));

// 员工系统路由
app.use('/api/employees', require('./routes/employees'));
app.use('/api/orders', require('./routes/employee-orders'));
app.use('/api/orders', require('./routes/order-pods'));
app.use('/api/orders', require('./routes/order-documents'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/truck-contacts', require('./routes/truck-contacts'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/ads', require('./routes/ad-slots'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/service-items', require('./routes/service-items'));
app.use('/api/qbo', require('./routes/quickbooks'));

// 物流租售路由
app.use('/api/rentals', require('./routes/rental'));
app.use('/api/sales', require('./routes/sale'));

// 文件上传路由
app.use('/api/upload', require('./routes/upload'));

// Carrier proxy rate limiter — stricter than global (20 quotes/min per IP)
const carrierQuoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many quote requests, please try again later' }
});

// Zipcode lookup utility
app.use('/api/zipcode', require('./routes/zipcode'));

// LTL quote sessions (user quote history)
app.use('/api/ltl-quotes', require('./routes/ltl-quotes'));

// LTL carrier proxy routes
app.use('/api/warp', carrierQuoteLimiter, require('./routes/warp'));
app.use('/api/rrts', carrierQuoteLimiter, require('./routes/rrts'));
app.use('/api/rlc', carrierQuoteLimiter, require('./routes/rlc'));
app.use('/api/saia', carrierQuoteLimiter, require('./routes/saia'));
app.use('/api/tforce', carrierQuoteLimiter, require('./routes/tforce'));
app.use('/api/ediexpress', carrierQuoteLimiter, require('./routes/ediexpress'));
app.use('/api/stg', carrierQuoteLimiter, require('./routes/stg'));
app.use('/api/welogx', carrierQuoteLimiter, require('./routes/welogx'));
app.use('/api/aact', carrierQuoteLimiter, require('./routes/aact'));

// AI Agent 报价自动化路由
app.use('/api/wecom', require('./routes/wecom'));
app.use('/api/dat', require('./routes/dat'));
app.use('/api/agent', require('./routes/agent'));

// 临时测试路由
app.get('/api/fba/test', (req, res) => {
  res.json({ message: 'FBA test route working!' });
});

// 使用简化版本的FBA API
try {
  const fbaRoutes = require('./routes/fba-simple');
  app.use('/api/fba', fbaRoutes);
  
  // 添加FBA Exchange路由
  const fbaExchangeRoutes = require('./routes/fba-exchange');
  app.use('/api/fba-exchange', fbaExchangeRoutes);
  
  console.log('FBA routes loaded successfully');
  console.log('FBA Exchange routes loaded successfully');
} catch (error) {
  console.error('Error loading FBA routes:', error);
}

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  // 记录错误
  logger.logError(error, {
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // JSON 解析错误
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }
  
  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
  
  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message
    });
  }
  
  // 数据库错误
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'Resource already exists'
    });
  }
  
  // 通用错误响应
  const statusCode = error.status || error.statusCode || 500;
  res.status(statusCode).json({
    error: config.app.env === 'production' ? 'Internal server error' : error.message,
    stack: config.app.env === 'production' ? undefined : error.stack,
    timestamp: new Date().toISOString()
  });
});

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, gracefully shutting down...');
  const { closeConnection } = require('./config/database');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, gracefully shutting down...');
  const { closeConnection } = require('./config/database');
  await closeConnection();
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 ${config.app.name} running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.app.env}`);
  logger.info(`🐘 Database: PostgreSQL`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔐 Auth: AWS Cognito (外部认证)`);
});

module.exports = app; 