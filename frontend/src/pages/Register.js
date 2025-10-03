import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCognitoUrls } from '../config/cognito';
import { AlertCircle, ArrowRight } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // 如果已登录则重定向到首页
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // 获取Cognito URL
    const { signUp } = getCognitoUrls();
    
    // 检查是否配置了域名
    if (signUp === '/register-error') {
      setError('系统配置错误：请联系管理员配置Cognito域名');
      return;
    }

    // 延迟重定向，让用户看到提示信息
    const timer = setTimeout(() => {
      window.location.href = signUp;
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-error">
                <AlertCircle size={48} className="error-icon" />
                <h1 className="auth-title">配置错误</h1>
                <p className="auth-subtitle">{error}</p>
              </div>
            </div>
            
            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                返回登录页面
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 显示加载中状态
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">正在跳转到注册页面</h1>
            <p className="auth-subtitle">
              即将为您打开安全注册页面...
            </p>
          </div>
          
          <div className="auth-loading" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner-wrapper">
              <div className="spinner"></div>
            </div>
            <p style={{ marginTop: '20px', color: '#666' }}>
              正在加载中，请稍候...
            </p>
          </div>

          <div className="auth-footer">
            <p className="auth-footer-text">
              已有账户？ 
              <Link to="/login" className="auth-link">
                返回登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;