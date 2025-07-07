/**
 * 统一日志系统
 * 解决100+次重复的console.error使用
 */

// 日志级别
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
};

// 日志颜色配置
const LOG_COLORS = {
  error: '#dc3545',
  warn: '#ffc107', 
  info: '#17a2b8',
  debug: '#6c757d'
};

/**
 * 统一日志记录器
 */
class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this.context = '';
  }

  /**
   * 设置上下文
   * @param {string} context - 上下文信息
   */
  setContext(context) {
    this.context = context;
    return this;
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toLocaleTimeString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    return {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message: `${timestamp} ${contextStr}${message}`,
      data
    };
  }

  /**
   * 输出日志
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  log(level, message, data = null) {
    const formatted = this.formatMessage(level, message, data);
    
    if (process.env.NODE_ENV === 'development') {
      const color = LOG_COLORS[level];
      console.log(
        `%c${formatted.message}`,
        `color: ${color}; font-weight: bold;`,
        data || ''
      );
    } else if (level === LOG_LEVELS.ERROR) {
      // 生产环境只记录错误
      console.error(formatted.message, data);
      
      // 这里可以集成错误监控服务（如 Sentry）
      // sentry.captureException(new Error(message), { extra: data });
    }
  }

  /**
   * 错误日志
   * @param {string} message - 错误消息
   * @param {Error|Object} error - 错误对象或附加数据
   */
  error(message, error = null) {
    this.log(LOG_LEVELS.ERROR, message, error);
  }

  /**
   * 警告日志
   * @param {string} message - 警告消息
   * @param {*} data - 附加数据
   */
  warn(message, data = null) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * 信息日志
   * @param {string} message - 信息消息
   * @param {*} data - 附加数据
   */
  info(message, data = null) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * 调试日志
   * @param {string} message - 调试消息
   * @param {*} data - 附加数据
   */
  debug(message, data = null) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * API错误专用方法
   * @param {string} endpoint - API端点
   * @param {Error} error - 错误对象
   * @param {string} operation - 操作描述
   */
  apiError(endpoint, error, operation = 'API请求') {
    const errorData = {
      endpoint,
      operation,
      status: error.status || 'unknown',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    this.error(`${operation}失败 [${endpoint}]`, errorData);
  }

  /**
   * 用户操作日志
   * @param {string} action - 用户操作
   * @param {*} data - 操作数据
   */
  userAction(action, data = null) {
    this.info(`用户操作: ${action}`, data);
  }

  /**
   * 性能日志
   * @param {string} operation - 操作名称
   * @param {number} duration - 耗时（毫秒）
   * @param {*} data - 附加数据
   */
  performance(operation, duration, data = null) {
    const level = duration > 1000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, `性能: ${operation} 耗时 ${duration}ms`, data);
  }
}

// 创建全局日志实例
const logger = new Logger();

// 便捷的上下文日志创建器
export const createLogger = (context) => {
  return logger.setContext(context);
};

// 预定义的上下文日志器
export const apiLogger = createLogger('API');
export const uiLogger = createLogger('UI');
export const authLogger = createLogger('AUTH');
export const formLogger = createLogger('FORM');
export const routerLogger = createLogger('ROUTER');

export default logger; 