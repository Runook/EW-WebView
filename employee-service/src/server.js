const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config/app');
const { db } = require('./config/database');

// 导入路由
const employeesRouter = require('./routes/employees');
const ordersRouter = require('./routes/orders');
const truckContactsRouter = require('./routes/truck-contacts');

// 创建Express应用
const app = express();

// ===========================
// 中间件配置
// ===========================

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===========================
// 路由配置
// ===========================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: config.service.name,
    version: config.service.version,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 服务信息
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    service: config.service
  });
});

// API路由
app.use('/api/employees', employeesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/truck-contacts', truckContactsRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// ===========================
// 启动服务器
// ===========================

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('================================================');
  console.log(`🚀 ${config.service.name} v${config.service.version}`);
  console.log('================================================');
  console.log(`📝 环境: ${config.nodeEnv}`);
  console.log(`🌐 端口: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔐 CORS: ${config.corsOrigin}`);
  console.log('================================================');
  console.log('');
  console.log('✅ 员工服务启动成功！');
  console.log('');
});

// 优雅关闭
const gracefulShutdown = () => {
  console.log('\n⏳ 正在关闭服务器...');
  
  server.close(async () => {
    console.log('✅ HTTP服务器已关闭');
    
    try {
      await db.destroy();
      console.log('✅ 数据库连接已关闭');
      process.exit(0);
    } catch (error) {
      console.error('❌ 关闭数据库连接失败:', error);
      process.exit(1);
    }
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('❌ 强制关闭服务器');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  gracefulShutdown();
});

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  gracefulShutdown();
});

module.exports = app;

