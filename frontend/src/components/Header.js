import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, UserCircle, Settings, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 动态检查当前是否为移动端
      const isMobile = window.innerWidth <= 1024;
      
      if (!event.target.closest('.nav-dropdown') && 
          !event.target.closest('.user-menu') &&
          !event.target.closest('.mobile-nav-dropdown')) {
        setActiveDropdown(null);
        setIsUserMenuOpen(false);
      }
    };

    const handleResize = () => {
      // 窗口大小变化时关闭所有下拉菜单
      setActiveDropdown(null);
      setIsUserMenuOpen(false);
      // 清理任何待定的定时器
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    };

    // 始终监听点击外部，但在事件处理中动态判断
    document.addEventListener('mousedown', handleClickOutside);
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      // 清理定时器
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // 路由变化时关闭菜单
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // 新的二级菜单结构
  const menuStructure = [
    {
      id: 'home',
      label: t('nav.home'),
      path: '/',
      type: 'single'
    },
    {
      id: 'landServices',
      label: t('nav.landServices'),
      type: 'dropdown',
      items: [
        { path: '/freight-board', label: t('nav.landServices.platform') },
        { path: '/land-warehouse', label: t('nav.landServices.warehouse') }
      ]
    },
    {
      id: 'oceanServices',
      label: t('nav.oceanServices'),
      type: 'dropdown',
      items: [
        { path: '/sea-freight', label: t('nav.oceanServices.platform') },
        { path: '/seaport-query', label: t('nav.oceanServices.seaport') }
      ]
    },
    {
      id: 'airServices',
      label: t('nav.airServices'),
      type: 'dropdown',
      items: [
        { path: '/air-platform', label: t('nav.airServices.platform') },
        { path: '/airport-query', label: t('nav.airServices.airport') }
      ]
    },
    {
      id: 'multimodal',
      label: t('nav.multimodal'),
      type: 'dropdown',
      items: [
        { path: '/ddp-service', label: t('nav.multimodal.ddp') },
        { path: '/ddu-service', label: t('nav.multimodal.ddu') },
        { path: '/ldp-service', label: t('nav.multimodal.ldp') }
      ]
    },
    {
      id: 'infoServices',
      label: t('nav.infoServices'),
      type: 'dropdown',
      items: [
        { path: '/yellow-pages', label: t('nav.infoServices.yellowPages') },
        { path: '/jobs', label: t('nav.infoServices.jobs') },
        { path: '/logistics-rental', label: t('nav.infoServices.logistics') },
        { path: '/forum', label: t('nav.infoServices.forum') }
      ]
    },
    {
      id: 'account',
      label: t('nav.account'),
      type: 'dropdown',
      items: [
        { path: '/my-points', label: t('nav.account.points') },
        { path: '/recharge', label: t('nav.account.recharge') },
        { path: '/my-posts', label: t('nav.account.myPosts') },
        { path: '/favorites', label: t('nav.account.favorites') },
        { path: '/my-recruitment', label: t('nav.account.myRecruitment') },
        { path: '/my-job-search', label: t('nav.account.myJobSearch') },
        { path: '/certification', label: t('nav.account.certification') },
        { path: '/contact', label: t('nav.account.contact') },
        { path: '/business', label: t('nav.account.business') },
        { path: '/invite-rewards', label: t('nav.account.invite') }
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleDropdownToggle = (dropdownId) => {
    // 只在移动端使用点击切换逻辑
    const isMobile = window.innerWidth <= 1024;
    if (isMobile) {
      setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
    }
  };

  // 桌面端鼠标悬停处理 - 改进版
  const handleMouseEnter = (dropdownId) => {
    const isMobile = window.innerWidth <= 1024;
    if (!isMobile) {
      // 清除任何待定的关闭定时器
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setActiveDropdown(dropdownId);
    }
  };

  const handleMouseLeave = (dropdownId) => {
    const isMobile = window.innerWidth <= 1024;
    if (!isMobile) {
      // 设置延迟关闭，给用户时间移动到子菜单
      const timeout = setTimeout(() => {
        setActiveDropdown(null);
        setHoverTimeout(null);
      }, 150);
      setHoverTimeout(timeout);
    }
  };

  // 当鼠标进入dropdown菜单本身时，保持菜单打开
  const handleDropdownMenuEnter = () => {
    const isMobile = window.innerWidth <= 1024;
    if (!isMobile && hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  // 当鼠标离开dropdown菜单时，关闭菜单
  const handleDropdownMenuLeave = () => {
    const isMobile = window.innerWidth <= 1024;
    if (!isMobile) {
      const timeout = setTimeout(() => {
        setActiveDropdown(null);
        setHoverTimeout(null);
      }, 150);
      setHoverTimeout(timeout);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setActiveDropdown(null);
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

  // 检查是否有子菜单项是活跃的
  const hasActiveChild = (items) => {
    return items.some(item => isActive(item.path));
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
            {menuStructure.map((item) => {
              if (item.type === 'single') {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              } else {
                return (
                  <div 
                    key={item.id} 
                    className={`nav-dropdown ${activeDropdown === item.id ? 'active' : ''}`}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={() => handleMouseLeave(item.id)}
                  >
                    <button
                      className={`nav-link dropdown-trigger ${hasActiveChild(item.items) ? 'active' : ''}`}
                      onClick={() => handleDropdownToggle(item.id)}
                    >
                      {item.label}
                      <ChevronDown size={16} className="dropdown-icon" />
                    </button>
                    
                    <div 
                      className="dropdown-menu"
                      onMouseEnter={handleDropdownMenuEnter}
                      onMouseLeave={handleDropdownMenuLeave}
                    >
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`dropdown-item ${isActive(subItem.path) ? 'active' : ''}`}
                          onClick={() => setActiveDropdown(null)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
            })}
          </nav>

          {/* Action Buttons */}
          <div className="header-actions">
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
            {menuStructure.map((item) => {
              if (item.type === 'single') {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              } else {
                return (
                  <div 
                    key={item.id} 
                    className={`mobile-nav-dropdown ${activeDropdown === item.id ? 'active' : ''}`}
                  >
                    <button
                      className={`mobile-nav-link dropdown-trigger ${hasActiveChild(item.items) ? 'active' : ''}`}
                      onClick={() => handleDropdownToggle(item.id)}
                    >
                      {item.label}
                      <ChevronDown size={16} className="dropdown-icon" />
                    </button>
                    
                    {activeDropdown === item.id && (
                      <div className="mobile-dropdown-menu">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`mobile-dropdown-item ${isActive(subItem.path) ? 'active' : ''}`}
                            onClick={() => {
                              setActiveDropdown(null);
                              setIsMenuOpen(false);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            })}
            
            <div className="mobile-actions">
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