import { useState, useCallback } from 'react';

/**
 * 布尔状态切换Hook
 * 解决重复的布尔状态管理逻辑
 * 
 * @param {boolean} initialValue - 初始值
 * @returns {[boolean, function, function, function]} - [状态, 切换函数, 设置为true函数, 设置为false函数]
 */
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
};

/**
 * 多个布尔状态管理Hook
 * 解决多个相关布尔状态的管理
 * 
 * @param {Object} initialStates - 初始状态对象
 * @returns {[Object, Object]} - [状态对象, 控制函数对象]
 */
export const useMultipleToggle = (initialStates = {}) => {
  const [states, setStates] = useState(initialStates);
  
  const toggle = useCallback((key) => {
    setStates(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);
  
  const setTrue = useCallback((key) => {
    setStates(prev => ({ ...prev, [key]: true }));
  }, []);
  
  const setFalse = useCallback((key) => {
    setStates(prev => ({ ...prev, [key]: false }));
  }, []);
  
  const reset = useCallback(() => {
    setStates(initialStates);
  }, [initialStates]);
  
  const set = useCallback((updates) => {
    setStates(prev => ({ ...prev, ...updates }));
  }, []);
  
  return [states, { toggle, setTrue, setFalse, reset, set }];
};

/**
 * Modal专用Hook
 * 简化模态框状态管理
 * 
 * @param {boolean} initialOpen - 初始打开状态
 * @returns {Object} - 包含模态框状态和控制函数的对象
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, , setTrue, setFalse] = useToggle(initialOpen);
  
  return {
    isOpen,
    open: setTrue,
    close: setFalse,
    toggle: () => isOpen ? setFalse() : setTrue()
  };
};

/**
 * Loading状态Hook
 * 专门处理加载状态的Hook
 * 
 * @param {boolean} initialLoading - 初始加载状态
 * @returns {Object} - 包含加载状态和控制函数的对象
 */
export const useLoading = (initialLoading = false) => {
  const [loading, , setTrue, setFalse] = useToggle(initialLoading);
  
  const withLoading = useCallback(async (asyncFn) => {
    try {
      setTrue();
      const result = await asyncFn();
      return result;
    } finally {
      setFalse();
    }
  }, [setTrue, setFalse]);
  
  return {
    loading,
    startLoading: setTrue,
    stopLoading: setFalse,
    withLoading
  };
};

/**
 * 显示/隐藏状态Hook
 * 常用于下拉菜单、提示框等
 * 
 * @param {boolean} initialVisible - 初始可见状态
 * @returns {Object} - 包含可见状态和控制函数的对象
 */
export const useVisibility = (initialVisible = false) => {
  const [visible, , setTrue, setFalse] = useToggle(initialVisible);
  
  return {
    visible,
    show: setTrue,
    hide: setFalse,
    toggle: () => visible ? setFalse() : setTrue()
  };
};

export default useToggle; 