import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 异步状态管理Hook
 * 解决重复的异步操作状态管理逻辑
 * 
 * @param {function} asyncFunction - 异步函数
 * @param {boolean} immediate - 是否立即执行
 * @returns {object} - 包含状态和控制函数的对象
 */
export const useAsyncState = (asyncFunction, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const cancelRef = useRef(false);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      cancelRef.current = false;

      const result = await asyncFunction(...args);
      
      if (!cancelRef.current) {
        setData(result);
      }
      
      return result;
    } catch (err) {
      if (!cancelRef.current) {
        setError(err);
        console.error('Async operation failed:', err);
      }
      throw err;
    } finally {
      if (!cancelRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    cancelRef.current = true;
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setLoading(false);
  }, []);

  // 立即执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  // 清理
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    cancel,
    isIdle: !loading && !error && !data,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null
  };
};

/**
 * 简化的异步操作Hook
 * 用于简单的异步操作
 */
export const useAsync = (asyncFunction) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [asyncFunction]);

  return {
    ...state,
    execute,
    reset: () => setState({ data: null, loading: false, error: null })
  };
};

export default useAsyncState; 