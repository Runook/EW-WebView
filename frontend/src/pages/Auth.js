import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import './Auth.css';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');

  return (
    <div className="auth-wrapper">
      {/* Tab Navigation */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${currentTab === 'login' ? 'active' : ''}`}
          onClick={() => setCurrentTab('login')}
        >
          登录
        </button>
        <button
          className={`auth-tab ${currentTab === 'register' ? 'active' : ''}`}
          onClick={() => setCurrentTab('register')}
        >
          注册
        </button>
      </div>

      {/* Tab Content */}
      <div className="auth-content">
        {currentTab === 'login' ? <Login /> : <Register />}
      </div>
    </div>
  );
};

export default Auth; 