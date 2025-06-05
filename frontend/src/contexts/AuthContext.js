import React, { createContext, useContext, useState, useEffect } from 'react';

// API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检查本地存储的token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || '登录失败');
        return { success: false, error: data.message || '登录失败' };
      }
    } catch (error) {
      console.error('AuthContext: 登录网络错误:', error);
      const errorMsg = '网络错误，请稍后重试';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 注册函数
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || '注册失败');
        return { success: false, error: data.message || '注册失败' };
      }
    } catch (error) {
      console.error('AuthContext: 注册网络错误:', error);
      const errorMsg = '网络错误，请稍后重试';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setError(null);
  };

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 