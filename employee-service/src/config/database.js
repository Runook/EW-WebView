const knex = require('knex');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ewltl',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../../../backend/migrations' // 共享主项目的migrations
  }
};

// 创建数据库连接实例
const db = knex(dbConfig);

// 测试数据库连接
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ 员工服务：数据库连接成功');
  })
  .catch((err) => {
    console.error('❌ 员工服务：数据库连接失败:', err);
    process.exit(1);
  });

module.exports = { db };

