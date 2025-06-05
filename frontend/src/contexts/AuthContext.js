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
        console.log('AuthContext: 检查认证状态...');
        const token = localStorage.getItem('authToken');
        console.log('AuthContext: Token from localStorage:', token ? '存在' : '不存在');
        
        if (token) {
          console.log('AuthContext: 验证token...');
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('AuthContext: Verify response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('AuthContext: 用户验证成功:', userData.user);
            setUser(userData.user);
          } else {
            console.log('AuthContext: Token验证失败，清除token');
            localStorage.removeItem('authToken');
          }
        } else {
          console.log('AuthContext: 无token，用户未登录');
        }
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
        console.log('AuthContext: 认证检查完成');
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (email, password) => {
    try {
      console.log('AuthContext: 开始登录...', { email });
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('AuthContext: 登录响应状态:', response.status);
      const data = await response.json();
      console.log('AuthContext: 登录响应数据:', data);

      if (response.ok) {
        console.log('AuthContext: 登录成功，保存token和用户信息');
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('AuthContext: 登录失败:', data.message);
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
      console.log('AuthContext: 开始注册...', userData);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      console.log('AuthContext: 注册响应状态:', response.status);
      const data = await response.json();
      console.log('AuthContext: 注册响应数据:', data);

      if (response.ok) {
        console.log('AuthContext: 注册成功，保存token和用户信息');
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('AuthContext: 注册失败:', data.message);
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
    console.log('AuthContext: 用户退出登录');
    localStorage.removeItem('authToken');
    setUser(null);
    setError(null);
  };

  // 更新用户信息
  const updateUser = (userData) => {
    console.log('AuthContext: 更新用户信息:', userData);
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

  console.log('AuthContext: 当前状态:', {
    user: user ? `${user.firstName} ${user.lastName}` : null,
    loading,
    error,
    isAuthenticated: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 