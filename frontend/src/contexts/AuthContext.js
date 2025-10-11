import React, { createContext, useContext, useState, useEffect } from 'react';
import { signOut, getCurrentUser, fetchUserProfile } from '../utils/cognitoAuth'; // 使用直接API
import { isMockMode, autoMockLogin, getMockUser, getMockToken } from '../utils/mockAuth';

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
      
      // 检查是否为Mock模式
      if (isMockMode()) {
        console.log('🔧 AuthContext: Mock模式 (开发环境)');
        
        // 自动Mock登录
        autoMockLogin();
        
        // 使用Mock用户
        const mockUser = getMockUser();
        console.log('✅ AuthContext: 使用Mock用户:', mockUser);
        setUser(mockUser);
      } else {
        // 生产模式：使用Cognito认证
        // 首先快速检查token是否存在
        const currentUser = getCurrentUser();
        
        if (currentUser) {
          console.log('✅ AuthContext: 找到token，获取完整用户信息...');
          // 从后端获取完整的用户信息（包括员工信息）
          try {
            const fullUserInfo = await fetchUserProfile();
            if (fullUserInfo) {
              console.log('✅ AuthContext: 获取完整用户信息成功:', fullUserInfo);
              setUser(fullUserInfo);
            } else {
              console.log('⚠️ AuthContext: 无法获取完整信息，使用token信息');
              setUser(currentUser);
            }
          } catch (error) {
            console.error('❌ AuthContext: 获取完整信息失败，使用token信息:', error);
            setUser(currentUser);
          }
        } else {
          console.log('ℹ️ AuthContext: 用户未登录');
          setUser(null);
        }
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