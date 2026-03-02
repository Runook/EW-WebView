import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, forgotPassword, confirmForgotPassword } from '../utils/cognitoAuth'; // 使用直接API，不用Amplify!
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import '../pages/Auth.css';

const CognitoAuth = ({ type = 'login' }) => {
  const { setUserState } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    confirmationCode: '',
    countryCode: '+1'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码和新密码

  // 格式化电话号码为国际格式
  const formatPhoneNumber = (phone, countryCode = formData.countryCode) => {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return phone;
    
    return `${countryCode}${digits}`;
  };

  // 常用国家代码
  const countryCodes = [
    { code: '+1', name: '美国/加拿大', flag: '🇺🇸' },
    { code: '+86', name: '中国', flag: '🇨🇳' },
    { code: '+44', name: '英国', flag: '🇬🇧' },
    { code: '+33', name: '法国', flag: '🇫🇷' },
    { code: '+49', name: '德国', flag: '🇩🇪' },
    { code: '+81', name: '日本', flag: '🇯🇵' },
    { code: '+82', name: '韩国', flag: '🇰🇷' },
    { code: '+61', name: '澳大利亚', flag: '🇦🇺' },
    { code: '+91', name: '印度', flag: '🇮🇳' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 使用直接Cognito API登录（绕过Amplify）...');
      
      const result = await signIn(formData.email, formData.password);
      
      console.log('✅ 登录成功:', result);
      setSuccess('登录成功！正在跳转...');
      
      // 更新AuthContext状态
      setUserState(result.user);
      console.log('🔄 已更新AuthContext用户状态');
      
      // 登录成功后跳转到首页
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('❌ 登录失败:', error);
      setError(error.message || '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 发送密码重置验证码...');
      
      const result = await forgotPassword(formData.email);
      
      console.log('✅ 验证码发送成功:', result);
      setSuccess('验证码已发送到您的邮箱，请查收');
      setForgotPasswordStep(2);
      
    } catch (error) {
      console.error('❌ 发送验证码失败:', error);
      setError(error.message || '发送验证码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不一致');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('密码至少需要8位字符');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 重置密码...');
      
      const result = await confirmForgotPassword(
        formData.email,
        formData.confirmationCode,
        formData.password
      );
      
      console.log('✅ 密码重置成功:', result);
      setSuccess('密码重置成功！正在跳转到登录页面...');
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '', confirmationCode: '' }));
      }, 2000);
      
    } catch (error) {
      console.error('❌ 密码重置失败:', error);
      setError(error.message || '密码重置失败，请检查验证码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.email || !formData.password || !formData.firstName) {
      setError('请填写所有必填项');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不一致');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('密码至少需要8位字符');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 开始注册（直接API）...');

      const attributes = {
        email: formData.email,
        given_name: formData.firstName
      };

      if (formData.lastName) {
        attributes.family_name = formData.lastName;
      }

      if (formData.phone) {
        const formattedPhone = formatPhoneNumber(formData.phone);
        console.log('📱 电话号码格式化:', formData.phone, '→', formattedPhone);
        attributes.phone_number = formattedPhone;
      }

      const result = await signUp(
        formData.email,
        formData.password,
        attributes
      );

      console.log('✅ 注册成功:', result);
      setSuccess('注册成功！请查看邮箱中的验证码');
      setNeedsConfirmation(true);
      
    } catch (error) {
      console.error('❌ 注册失败:', error);
      setError(error.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 验证注册码...');

      const result = await confirmSignUp(
        formData.email,
        formData.confirmationCode
      );

      console.log('✅ 验证成功:', result);
      setSuccess('验证成功！现在可以登录了');
      setNeedsConfirmation(false);
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('❌ 验证失败:', error);
      setError(error.message || '验证码错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果需要确认注册，显示验证码输入
  if (needsConfirmation) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <img src="/logo.png" alt="Welogx" className="auth-logo-image" />
              </div>
              <h1 className="auth-title">邮箱验证</h1>
              <p className="auth-subtitle">
                我们已向 {formData.email} 发送验证码
              </p>
            </div>

            <form onSubmit={handleConfirmSignUp} className="auth-form">
              {error && (
                <div className="auth-error">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="auth-success">
                  <span>{success}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="confirmationCode" className="form-label">验证码</label>
                <input
                  id="confirmationCode"
                  name="confirmationCode"
                  type="text"
                  value={formData.confirmationCode}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="输入6位验证码"
                  maxLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? '验证中...' : '确认验证'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 忘记密码UI
  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <img src="/logo.png" alt="Welogx" className="auth-logo-image" />
              </div>
              <h1 className="auth-title">
                {forgotPasswordStep === 1 ? '重置密码' : '设置新密码'}
              </h1>
              <p className="auth-subtitle">
                {forgotPasswordStep === 1 
                  ? '输入您的邮箱地址，我们将发送验证码' 
                  : '输入验证码和新密码'}
              </p>
            </div>

            {forgotPasswordStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="auth-form">
                {error && (
                  <div className="auth-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="auth-success">
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email" className="form-label">邮箱地址</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ paddingLeft: '50px' }}
                      placeholder="输入您的邮箱地址"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? '发送中...' : '发送验证码'}
                </button>

                <div className="auth-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="auth-link"
                  >
                    返回登录
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                {error && (
                  <div className="auth-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="auth-success">
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="confirmationCode" className="form-label">验证码</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      id="confirmationCode"
                      name="confirmationCode"
                      type="text"
                      value={formData.confirmationCode}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ paddingLeft: '50px' }}
                      placeholder="输入6位验证码"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">新密码</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ paddingLeft: '50px' }}
                      placeholder="至少8位字符"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">确认新密码</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ paddingLeft: '50px' }}
                      placeholder="再次输入新密码"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? '重置中...' : '重置密码'}
                </button>

                <div className="auth-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep(1);
                      setError('');
                      setSuccess('');
                    }}
                    className="auth-link"
                  >
                    重新发送验证码
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logo.png" alt="Welogx" className="auth-logo-image" />
            </div>
            <h1 className="auth-title">
              {type === 'login' ? '用户登录' : '用户注册'}
            </h1>
            <p className="auth-subtitle">
              使用AWS Cognito安全认证
            </p>
          </div>

          <form onSubmit={type === 'login' ? handleLogin : handleRegister} className="auth-form">
            {error && (
              <div className="auth-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-success">
                <span>{success}</span>
              </div>
            )}

            {/* 注册时的额外字段 */}
            {type === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">名字 *</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="form-input"
                        style={{ paddingLeft: '50px' }}
                        placeholder="输入您的名字"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">姓氏</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="form-input"
                        style={{ paddingLeft: '50px' }}
                        placeholder="输入您的姓氏"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">手机号码</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                      className="form-input"
                      style={{ width: '140px', fontSize: '14px' }}
                    >
                      {countryCodes.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="input-wrapper" style={{ flex: 1 }}>
                      <Phone className="input-icon" size={20} />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        style={{ paddingLeft: '50px' }}
                        placeholder={formData.countryCode === '+1' ? '2135096697' : formData.countryCode === '+86' ? '13812345678' : '输入手机号码'}
                      />
                    </div>
                  </div>
                  {formData.phone && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      完整号码: {formatPhoneNumber(formData.phone)}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 邮箱 */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">邮箱地址 *</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ paddingLeft: '50px' }}
                  placeholder="输入您的邮箱地址"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">密码 *</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ paddingLeft: '50px' }}
                  placeholder={type === 'register' ? '至少8位字符' : '输入您的密码'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 忘记密码链接（仅登录时显示） */}
            {type === 'login' && (
              <div className="form-options">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="forgot-link"
                >
                  忘记密码？
                </button>
              </div>
            )}

            {/* 确认密码（仅注册时显示） */}
            {type === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">确认密码 *</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ paddingLeft: '50px' }}
                    placeholder="再次输入密码"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner-small" style={{ margin: '0 auto' }}></div>
              ) : (
                <>
                  <span>{type === 'login' ? '登录' : '注册'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            {type === 'login' ? (
              <>
                <p>还没有账户？</p>
                <a href="/register" className="auth-link">立即注册</a>
              </>
            ) : (
              <>
                <p>已有账户？</p>
                <a href="/login" className="auth-link">立即登录</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitoAuth;