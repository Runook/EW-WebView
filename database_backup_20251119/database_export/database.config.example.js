// ============================================
// Backend 数据库配置示例
// 位置: backend/src/config/database.js
// ============================================

require('dotenv').config();

module.exports = {
  // 开发环境
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ewlogistics',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: false // 本地开发不需要 SSL
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },

  // 生产环境
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false } // AWS RDS 需要 SSL
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }
};

// 或者使用更简单的配置
// module.exports = {
//   client: 'pg',
//   connection: {
//     host: 'localhost',
//     port: 5432,
//     database: 'ewlogistics',
//     user: 'your_username',
//     password: 'your_password'
//   }
// };

