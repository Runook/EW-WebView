const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ew-logistics';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    // 不退出进程，允许应用继续运行（使用模拟数据）
  });

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 100 次请求
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// 中间件
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: 'EW Logistics Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      seafreight: '/api/seafreight',
      landfreight: '/api/landfreight',
      airfreight: '/api/airfreight',
      freight: '/api/freight',
      users: '/api/users',
      companies: '/api/companies'
    }
  });
});

// 路由文件
app.use('/api/auth', require('./routes/auth'));
app.use('/api/seafreight', require('./routes/seafreight'));
app.use('/api/landfreight', require('./routes/landfreight'));
app.use('/api/airfreight', require('./routes/airfreight'));
app.use('/api/companies', require('./routes/companies'));
// app.use('/api/freight', require('./routes/freight'));
// app.use('/api/users', require('./routes/users'));

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error(error.stack);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 EW Logistics Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});

module.exports = app; 