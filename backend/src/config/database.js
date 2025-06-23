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