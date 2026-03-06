require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ew_logistics',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      // 只在连接 AWS RDS 时使用 SSL，本地和 Docker 不使用
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 1,
      max: 2
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 5
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.NODE_ENV === 'production' ? process.env.RDS_ENDPOINT : process.env.DB_HOST,
      port: process.env.NODE_ENV === 'production' ? process.env.RDS_PORT : process.env.DB_PORT || 5432,
      database: process.env.NODE_ENV === 'production' ? process.env.RDS_DATABASE || process.env.RDS_DB_NAME : process.env.DB_NAME,
      user: process.env.NODE_ENV === 'production' ? process.env.RDS_USERNAME : process.env.DB_USER,
      password: process.env.NODE_ENV === 'production' ? process.env.RDS_PASSWORD : process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      // 保持 TCP 连接活跃，防止被 AWS NAT/安全组断开
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 0,   // 允许连接池缩到0，避免持有死连接
      max: 20,
      createTimeoutMillis: 5000,
      acquireTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,     // 30秒空闲后释放连接
      reapIntervalMillis: 5000,     // 每5秒检查并回收空闲连接
      createRetryIntervalMillis: 200,
      propagateCreateError: false,
      // 每次从池中取出连接前，先验证连接是否还活着
      afterCreate: (conn, done) => {
        conn.query('SELECT 1', (err) => {
          if (err) {
            console.error('❌ 新建数据库连接验证失败:', err.message);
          }
          done(err, conn);
        });
      }
    },
    acquireConnectionTimeout: 15000
  }
}; 