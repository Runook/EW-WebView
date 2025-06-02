import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, Phone, User, LogOut, UserCircle, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();

  const navigationItems = [
    { path: '/', label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/land-warehouse', label: t('nav.landWarehouse') },
    { path: '/seaport-query', label: t('nav.seaportQuery') },
    { path: '/airport-query', label: t('nav.airportQuery') },
    { path: '/contact', label: t('nav.contact') }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserTypeLabel = () => {
    if (!user) return '';
    return user.userType === 'shipper' ? '货主' : '承运商';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="EWLogistics Logo" className="logo-image" />
            </div>
            <div className="logo-text">
              <span className="logo-main">{t('logo.main')}</span>
              <span className="logo-sub">{t('logo.sub')}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="header-actions">
            <button className="btn btn-ghost">
              <MessageCircle size={20} />
              {t('header.liveChat')}
            </button>
            <button className="btn btn-secondary">
              <Phone size={20} />
              (718) 386-7888
            </button>

            {/* User Authentication */}
            {isAuthenticated ? (
              <div className="user-menu">
                <button
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <UserCircle size={24} />
                  <span className="user-name">{getUserDisplayName()}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-info">
                      <div className="user-details">
                        <p className="user-name-full">{getUserDisplayName()}</p>
                        <p className="user-type">{getUserTypeLabel()}</p>
                        <p className="user-company">{user.companyName}</p>
                      </div>
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <div className="user-menu-items">
                      <Link to="/profile" className="user-menu-item">
                        <User size={18} />
                        <span>个人资料</span>
                      </Link>
                      <Link to="/settings" className="user-menu-item">
                        <Settings size={18} />
                        <span>账户设置</span>
                      </Link>
                    </div>
                    
                    <div className="user-menu-divider"></div>
                    
                    <button onClick={handleLogout} className="user-menu-item logout">
                      <LogOut size={18} />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost">
                  登录
                </Link>
                <Link to="/register" className="btn btn-primary">
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="mobile-nav">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="mobile-actions">
              <button className="btn btn-ghost mobile-btn">
                <MessageCircle size={20} />
                {t('header.liveChat')}
              </button>
              <button className="btn btn-secondary mobile-btn">
                <Phone size={20} />
                {t('header.callNow')}
              </button>
              
              {/* Mobile Auth Buttons */}
              {isAuthenticated ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    <p className="mobile-user-name">{getUserDisplayName()}</p>
                    <p className="mobile-user-type">{getUserTypeLabel()}</p>
                  </div>
                  <Link to="/profile" className="btn btn-ghost mobile-btn">
                    <User size={20} />
                    个人资料
                  </Link>
                  <button onClick={handleLogout} className="btn btn-ghost mobile-btn logout">
                    <LogOut size={20} />
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link to="/login" className="btn btn-ghost mobile-btn">
                    登录
                  </Link>
                  <Link to="/register" className="btn btn-primary mobile-btn">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 