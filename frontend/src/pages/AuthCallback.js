import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import './Auth.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserState } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // 获取URL参数
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          setError(`认证错误: ${errorDescription || error}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setError('未收到授权码');
          setIsProcessing(false);
          return;
        }

        // TODO: 这里应该调用后端API来交换token
        console.log('收到授权码:', code);
        
        // 暂时直接跳转到登录页
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { message: '注册成功！请登录您的账户。' }
          });
        }, 1500);

      } catch (err) {
        console.error('处理回调时出错:', err);
        setError('处理认证回调时出错');
        setIsProcessing(false);
      }
    };

    processAuthCallback();
  }, [location, navigate, setUserState]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-error">
                <AlertCircle size={48} className="error-icon" />
                <h1 className="auth-title">认证错误</h1>
                <p className="auth-subtitle">{error}</p>
              </div>
            </div>
            
            <div className="auth-footer">
              <a href="/login" className="auth-link">
                返回登录页面
              </a>
            </div>
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
            <h1 className="auth-title">
              {isProcessing ? '正在处理...' : '注册成功！'}
            </h1>
            <p className="auth-subtitle">
              {isProcessing 
                ? '正在完成注册流程，请稍候...' 
                : '即将跳转到登录页面...'}
            </p>
          </div>
          
          <div className="auth-loading">
            <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
