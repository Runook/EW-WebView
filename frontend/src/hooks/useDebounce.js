import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 防抖Hook
 * 解决重复的防抖逻辑
 * 
 * @param {*} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {*} - 防抖后的值
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 防抖回调Hook
 * 用于防抖函数调用
 * 
 * @param {function} callback - 需要防抖的回调函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {array} deps - 依赖数组
 * @returns {function} - 防抖后的回调函数
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);

  // 清理timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export default useDebounce; 