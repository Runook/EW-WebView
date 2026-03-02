const { getCache, setCache } = require('../config/redis');

/**
 * Express 缓存中间件
 * @param {number} ttlSeconds - 缓存时间（秒）
 * @param {string} keyPrefix - 缓存键前缀
 */
const cacheResponse = (ttlSeconds = 300, keyPrefix = '') => {
  return async (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') return next();

    // 生成缓存 key：前缀 + 路径 + 查询参数
    const cacheKey = `cache:${keyPrefix || req.baseUrl}:${req.originalUrl}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        // 命中缓存
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      // 缓存读取失败，继续正常处理
    }

    // 拦截 res.json 来缓存响应
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // 只缓存成功响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, data, ttlSeconds).catch(() => {});
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

module.exports = { cacheResponse };
