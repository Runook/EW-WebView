/**
 * 统一通知系统
 * 解决40+次重复的alert使用
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import './Notification.css';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000, actions = null) => {
    const id = Date.now() + Math.random();
    const notification = { 
      id, 
      message, 
      type, 
      duration,
      actions,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 便捷方法
  const success = useCallback((message, duration = 4000) => 
    showNotification(message, 'success', duration), [showNotification]);
    
  const error = useCallback((message, duration = 6000) => 
    showNotification(message, 'error', duration), [showNotification]);
    
  const warning = useCallback((message, duration = 5000) => 
    showNotification(message, 'warning', duration), [showNotification]);
    
  const info = useCallback((message, duration = 4000) => 
    showNotification(message, 'info', duration), [showNotification]);

  // 确认对话框替代alert
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const actions = [
        {
          label: options.confirmText || '确认',
          variant: options.confirmVariant || 'primary',
          onClick: () => {
            removeNotification(id);
            resolve(true);
          }
        },
        {
          label: options.cancelText || '取消',
          variant: 'secondary',
          onClick: () => {
            removeNotification(id);
            resolve(false);
          }
        }
      ];

      const id = showNotification(message, 'confirm', 0, actions);
    });
  }, [showNotification, removeNotification]);

  // 操作成功通知 (常用模式)
  const operationSuccess = useCallback((operation, details = '') => {
    const message = details ? `${operation}成功！${details}` : `${operation}成功！`;
    success(message);
  }, [success]);

  // 操作失败通知 (常用模式)  
  const operationError = useCallback((operation, error) => {
    const message = `${operation}失败: ${error.message || error}`;
    error(message);
  }, [error]);

  // API错误通知
  const apiError = useCallback((operation, error) => {
    let message = `${operation}失败`;
    
    if (error.message?.includes('Failed to fetch')) {
      message += ': 网络连接失败，请检查网络连接';
    } else if (error.message?.includes('401')) {
      message += ': 请先登录系统';
    } else if (error.message?.includes('403')) {
      message += ': 权限不足';
    } else if (error.message?.includes('404')) {
      message += ': 请求的资源不存在';
    } else if (error.message?.includes('500')) {
      message += ': 服务器内部错误，请稍后重试';
    } else {
      message += `: ${error.message || '未知错误'}`;
    }
    
    error(message, 8000);
  }, [error]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    confirm,
    operationSuccess,
    operationError,
    apiError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

// 通知容器组件
const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

// 单个通知项组件
const NotificationItem = ({ notification, onRemove }) => {
  const { type, message, actions } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'confirm':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-message">
          {message}
        </div>
        <button className="notification-close" onClick={onRemove}>
          <X size={16} />
        </button>
      </div>
      
      {actions && (
        <div className="notification-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`notification-btn notification-btn-${action.variant}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook for using notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default NotificationProvider; 