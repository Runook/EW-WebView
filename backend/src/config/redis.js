const Redis = require('ioredis');

let redis = null;
let isConnected = false;

// 初始化 Redis 连接
const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('ℹ️ REDIS_URL 未配置，缓存功能跳过');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null; // 超过10次放弃
        return Math.min(times * 200, 5000);
      },
      reconnectOnError(err) {
        return err.message.includes('READONLY');
      },
      lazyConnect: false,
      connectTimeout: 5000,
      commandTimeout: 3000
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis 已连接');
    });

    redis.on('error', (err) => {
      isConnected = false;
      console.error('❌ Redis 错误:', err.message);
    });

    redis.on('close', () => {
      isConnected = false;
      console.log('📴 Redis 连接已关闭');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis 重连中...');
    });

    return redis;
  } catch (err) {
    console.error('❌ Redis 初始化失败:', err.message);
    return null;
  }
};

// 获取缓存
const getCache = async (key) => {
  if (!redis || !isConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis GET 失败:', err.message);
    return null;
  }
};

// 设置缓存
const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redis || !isConnected) return false;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (err) {
    console.error('Redis SET 失败:', err.message);
    return false;
  }
};

// 删除缓存
const deleteCache = async (key) => {
  if (!redis || !isConnected) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error('Redis DEL 失败:', err.message);
    return false;
  }
};

// 按模式删除缓存
const deleteCachePattern = async (pattern) => {
  if (!redis || !isConnected) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ 清除缓存: ${pattern} (${keys.length} keys)`);
    }
    return true;
  } catch (err) {
    console.error('Redis DEL pattern 失败:', err.message);
    return false;
  }
};

// 健康检查
const getRedisStatus = () => {
  return {
    configured: !!process.env.REDIS_URL,
    connected: isConnected,
    uptime: redis?.status || 'not initialized'
  };
};

// 获取 Redis 实例（给 rate-limit-redis 用）
const getRedisClient = () => redis;

// 初始化
initRedis();

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  getRedisStatus,
  getRedisClient,
  initRedis
};
