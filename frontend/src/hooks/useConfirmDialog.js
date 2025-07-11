import { useState, useCallback } from 'react';

/**
 * 确认对话框Hook
 * 解决重复的确认操作逻辑
 * 
 * @returns {object} - 包含状态和控制函数的对象
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '确认操作',
    message: '您确定要执行此操作吗？',
    confirmText: '确认',
    cancelText: '取消',
    variant: 'danger' // 'primary', 'danger', 'warning'
  });
  const [resolveRef, setResolveRef] = useState(null);

  const showConfirm = useCallback((options = {}) => {
    const finalConfig = {
      ...config,
      ...options
    };
    
    setConfig(finalConfig);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, [config]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef(true);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const reset = useCallback(() => {
    setIsOpen(false);
    setResolveRef(null);
  }, []);

  return {
    isOpen,
    config,
    showConfirm,
    handleConfirm,
    handleCancel,
    reset
  };
};

/**
 * 简化的确认操作Hook
 * 用于快速创建确认操作
 * 
 * @param {function} action - 需要确认的操作
 * @param {object} options - 确认对话框配置
 * @returns {object} - 包含状态和控制函数的对象
 */
export const useConfirmAction = (action, options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const confirmDialog = useConfirmDialog();

  const executeWithConfirm = useCallback(async (...args) => {
    const confirmed = await confirmDialog.showConfirm(options);
    
    if (confirmed) {
      try {
        setIsLoading(true);
        await action(...args);
      } catch (error) {
        console.error('Action failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  }, [action, options, confirmDialog]);

  return {
    ...confirmDialog,
    isLoading,
    executeWithConfirm
  };
};

/**
 * 预定义的确认对话框配置
 */
export const confirmDialogPresets = {
  delete: {
    title: '删除确认',
    message: '此操作不可撤销，您确定要删除吗？',
    confirmText: '删除',
    cancelText: '取消',
    variant: 'danger'
  },
  
  logout: {
    title: '退出登录',
    message: '您确定要退出登录吗？',
    confirmText: '退出',
    cancelText: '取消',
    variant: 'warning'
  },
  
  submit: {
    title: '提交确认',
    message: '您确定要提交吗？',
    confirmText: '提交',
    cancelText: '取消',
    variant: 'primary'
  },
  
  discard: {
    title: '放弃更改',
    message: '您有未保存的更改，确定要放弃吗？',
    confirmText: '放弃',
    cancelText: '继续编辑',
    variant: 'warning'
  }
};

export default useConfirmDialog; 