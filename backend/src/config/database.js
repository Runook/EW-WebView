const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// 创建数据库连接实例
const db = knex(config);

// 测试数据库连接
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

// 定期心跳保活（每 5 分钟 ping 一次数据库，防止连接被断开）
const startKeepAlive = () => {
  const INTERVAL = 5 * 60 * 1000; // 5 minutes
  setInterval(async () => {
    try {
      await db.raw('SELECT 1');
    } catch (error) {
      console.error('❌ 数据库心跳失败:', error.message);
      // 连接池会自动尝试重新创建连接
    }
  }, INTERVAL);
  console.log('💓 数据库心跳保活已启动 (每5分钟)');
};

// 生产环境自动启动心跳
if (environment === 'production') {
  startKeepAlive();
}

// 优雅关闭数据库连接
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('📴 PostgreSQL connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = {
  db,
  testConnection,
  closeConnection
}; 