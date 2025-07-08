const config = require('../config/app');

class Logger {
  constructor() {
    this.level = config.logging.level;
    this.env = config.app.env;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    if (this.env === 'development') {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }
    
    return JSON.stringify(logEntry);
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }

  // 记录HTTP请求
  logRequest(req, res, next) {
    const self = this;
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      self.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    });
    
    next();
  }

  // 记录数据库查询
  logQuery(query, duration) {
    this.debug('Database Query', {
      query: query.toString(),
      duration: `${duration}ms`
    });
  }

  // 记录错误
  logError(error, context = {}) {
    this.error('Application Error', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }
}

module.exports = new Logger();
