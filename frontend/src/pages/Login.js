import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 如果已登录则重定向
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 清除错误信息
  useEffect(() => {
    clearError();
    setFormError('');
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误信息
    if (formError) setFormError('');
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setFormError('请输入邮箱地址');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('请输入有效的邮箱地址');
      return false;
    }
    
    if (!formData.password) {
      setFormError('请输入密码');
      return false;
    }
    
    if (formData.password.length < 6) {
      setFormError('密码至少需要6位字符');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFormError('');
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setFormError(result.error);
      }
    } catch (error) {
      setFormError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = formError || error;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logo.png" alt="EW Logistics" className="auth-logo-image" />
            </div>
            <h1 className="auth-title">欢迎回来</h1>
            <p className="auth-subtitle">登录您的EW物流账户</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {displayError && (
              <div className="auth-error">
                <AlertCircle size={20} />
                <span>{displayError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱地址
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ paddingLeft: '80px' }}
                  placeholder="输入您的邮箱地址"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ paddingLeft: '80px' }}
                  placeholder="输入您的密码"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox" />
                <span className="checkmark"></span>
                记住我
              </label>
              <Link to="/forgot-password" className="forgot-link">
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <span>登录</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>还没有账户？</p>
            <Link to="/register" className="auth-link">
              立即注册
            </Link>
          </div>
        </div>

        {/* Side Info */}
        <div className="auth-side">
          <div className="auth-side-content">
            <h2>专业物流服务</h2>
            <p>连接全球货主与承运商，提供安全、高效的物流解决方案</p>
            <div className="auth-features">
              <div className="feature-item">
                <div className="feature-icon">🚛</div>
                <div>
                  <h3>货运匹配</h3>
                  <p>智能匹配最适合的运输方案</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div>
                  <h3>实时追踪</h3>
                  <p>全程可视化货物运输状态</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🛡️</div>
                <div>
                  <h3>安全保障</h3>
                  <p>全面的货物保险和风险控制</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 