require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ew_logistics',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('host.docker.internal') ? { rejectUnauthorized: false } : false
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
      max: 20,  // 增加最大连接数
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 10000,  // 减少超时时间到10秒
      idleTimeoutMillis: 10000,  // 减少空闲超时，更快释放连接
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false
    },
    acquireConnectionTimeout: 10000  // 减少到10秒
  }
}; 