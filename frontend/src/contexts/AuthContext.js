import React, { createContext, useContext, useState, useEffect } from 'react';
import { signOut, getCurrentUser } from '../utils/cognitoAuth'; // 使用直接API

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 添加setUserState函数供CognitoAuth使用
  const setUserState = (cognitoUser) => {
    console.log('📌 AuthContext: 设置用户状态:', cognitoUser);
    setUser(cognitoUser);
  };

  // 检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 AuthContext: 检查认证状态...');
      
      // 使用新的getCurrentUser函数（从localStorage读取）
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        console.log('✅ AuthContext: 找到已登录用户:', currentUser);
        setUser(currentUser);
      } else {
        console.log('ℹ️ AuthContext: 用户未登录');
        setUser(null);
      }
      
    } catch (error) {
      console.error('❌ AuthContext: 认证检查错误:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 登录（保留接口兼容性）
  const login = async (email, password) => {
    console.log('ℹ️ AuthContext: login()被调用，请使用CognitoAuth组件');
    return { success: false, error: '请使用新的登录页面' };
  };

  // 注册（保留接口兼容性）
  const register = async (userData) => {
    console.log('ℹ️ AuthContext: register()被调用，请使用CognitoAuth组件');
    return { success: false, error: '请使用新的注册页面' };
  };

  // 登出
  const logout = async () => {
    try {
      console.log('🚪 AuthContext: 执行登出...');
      
      await signOut();
      setUser(null);
      setError(null);
      
      console.log('✅ AuthContext: 登出成功');
    } catch (error) {
      console.error('❌ AuthContext: 退出登录失败:', error);
    }
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
    clearError,
    isAuthenticated: !!user,
    setUserState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};