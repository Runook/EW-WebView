import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: '', // 'shipper' 或 'carrier'
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    companyType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    mcNumber: '', // 承运商专用
    dotNumber: '', // 承运商专用
    businessLicense: '', // 企业营业执照号
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 如果已登录则重定向
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 清除错误信息
  useEffect(() => {
    clearError();
    setFormError('');
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除错误信息
    if (formError) setFormError('');
    if (error) clearError();
  };

  const validateStep1 = () => {
    if (!formData.userType) {
      setFormError('请选择用户类型');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
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
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('密码确认不一致');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!formData.firstName.trim()) {
      setFormError('请输入名字');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      setFormError('请输入姓氏');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setFormError('请输入手机号码');
      return false;
    }
    
    if (!formData.companyName.trim()) {
      setFormError('请输入公司名称');
      return false;
    }
    
    if (!formData.companyType) {
      setFormError('请选择公司类型');
      return false;
    }
    
    if (formData.userType === 'carrier' && !formData.mcNumber.trim()) {
      setFormError('承运商需要输入MC号码');
      return false;
    }
    
    if (!formData.agreeTerms) {
      setFormError('请阅读并同意服务条款');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        break;
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      setFormError('');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }
    
    setIsLoading(true);
    setFormError('');
    
    try {
      // 构建注册数据
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        companyName: formData.companyName,
        companyType: formData.companyType,
        userType: formData.userType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        businessLicense: formData.businessLicense
      };
      
      // 承运商特殊字段
      if (formData.userType === 'carrier') {
        registrationData.mcNumber = formData.mcNumber;
        registrationData.dotNumber = formData.dotNumber;
      }
      
      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setFormError(result.error);
      }
    } catch (error) {
      setFormError('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = formError || error;

  const renderStep1 = () => (
    <div className="auth-step">
      <h2 className="step-title">选择用户类型</h2>
      <p className="step-subtitle">请选择最符合您需求的账户类型</p>
      
      <div className="user-type-selection">
        <button
          type="button"
          className={`user-type-card ${formData.userType === 'shipper' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, userType: 'shipper' }))}
        >
          <div className="user-type-icon">🏭</div>
          <h3>货主</h3>
          <p>我需要运输货物</p>
          <ul>
            <li>发布货物运输需求</li>
            <li>查找合适的承运商</li>
            <li>管理运输订单</li>
          </ul>
          {formData.userType === 'shipper' && <Check className="selected-icon" size={24} />}
        </button>
        
        <button
          type="button"
          className={`user-type-card ${formData.userType === 'carrier' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, userType: 'carrier' }))}
        >
          <div className="user-type-icon">🚛</div>
          <h3>承运商</h3>
          <p>我提供运输服务</p>
          <ul>
            <li>发布可用运力信息</li>
            <li>接收运输订单</li>
            <li>管理车队和司机</li>
          </ul>
          {formData.userType === 'carrier' && <Check className="selected-icon" size={24} />}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="auth-step">
      <h2 className="step-title">账户信息</h2>
      <p className="step-subtitle">设置您的登录凭据</p>
      
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
            placeholder="输入您的邮箱地址"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">密码</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={20} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            className="form-input"
            placeholder="设置登录密码"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="form-hint">密码至少包含6个字符</p>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">确认密码</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={20} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="form-input"
            placeholder="再次输入密码"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="password-toggle"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="auth-step">
      <h2 className="step-title">个人和公司信息</h2>
      <p className="step-subtitle">完善您的基本信息</p>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">名字</label>
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="您的名字"
              autoComplete="given-name"
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
              placeholder="您的姓氏"
              autoComplete="family-name"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">手机号码</label>
        <div className="input-wrapper">
          <Phone className="input-icon" size={20} />
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder="输入手机号码"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="companyName" className="form-label">公司名称</label>
        <div className="input-wrapper">
          <Building className="input-icon" size={20} />
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="输入公司名称"
            autoComplete="organization"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="companyType" className="form-label">公司类型</label>
        <select
          id="companyType"
          name="companyType"
          value={formData.companyType}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">请选择公司类型</option>
          <option value="corporation">有限公司</option>
          <option value="llc">有限责任公司</option>
          <option value="partnership">合伙企业</option>
          <option value="sole-proprietorship">个体工商户</option>
          <option value="other">其他</option>
        </select>
      </div>

      {formData.userType === 'carrier' && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mcNumber" className="form-label">MC号码 *</label>
            <input
              id="mcNumber"
              name="mcNumber"
              type="text"
              value={formData.mcNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="输入MC号码"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dotNumber" className="form-label">DOT号码</label>
            <input
              id="dotNumber"
              name="dotNumber"
              type="text"
              value={formData.dotNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="输入DOT号码（可选）"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="businessLicense" className="form-label">营业执照号</label>
        <input
          id="businessLicense"
          name="businessLicense"
          type="text"
          value={formData.businessLicense}
          onChange={handleInputChange}
          className="form-input"
          placeholder="输入营业执照号码"
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleInputChange}
            className="checkbox"
          />
          <span className="checkmark"></span>
          我已阅读并同意
          <Link to="/terms" className="terms-link">《服务条款》</Link>
          和
          <Link to="/privacy" className="terms-link">《隐私政策》</Link>
        </label>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-container register">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logo.png" alt="EW Logistics" className="auth-logo-image" />
            </div>
            <h1 className="auth-title">创建账户</h1>
            <p className="auth-subtitle">加入EW物流平台</p>
          </div>

          {/* Progress */}
          <div className="auth-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
            <div className="progress-steps">
              <span className={currentStep >= 1 ? 'active' : ''}>用户类型</span>
              <span className={currentStep >= 2 ? 'active' : ''}>账户设置</span>
              <span className={currentStep >= 3 ? 'active' : ''}>完善信息</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {displayError && (
              <div className="auth-error">
                <AlertCircle size={20} />
                <span>{displayError}</span>
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Form Actions */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  上一步
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                  disabled={!formData.userType && currentStep === 1}
                >
                  下一步
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <span>创建账户</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>已有账户？</p>
            <Link to="/login" className="auth-link">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 