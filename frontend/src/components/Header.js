import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, UserCircle, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.nav-dropdown') && 
          !event.target.closest('.user-menu') &&
          !event.target.closest('.mobile-nav-dropdown')) {
        setActiveDropdown(null);
        setActiveSubmenu(null);
        setIsUserMenuOpen(false);
      }
    };

    const handleResize = () => {
      // 窗口大小变化时关闭所有下拉菜单
      setActiveDropdown(null);
      setActiveSubmenu(null);
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
    setActiveSubmenu(null);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // 导航菜单结构
  const menuStructure = [
    {
      id: 'home',
      label: '首页',
      path: '/',
      type: 'single'
    },
    // 员工系统入口（仅员工可见）- 直接指向Broker订单
    ...(user?.isEmployee ? [{
      id: 'employee',
      label: '员工系统',
      path: '/employee/broker-orders',
      type: 'single',
      className: 'employee-menu-item'
    }] : []),
    {
      id: 'landServices',
      label: '陆运服务',
      type: 'dropdown',
      items: [
        { path: '/get-quote-ltl', label: '获取LTL报价' },
        { path: '/fba-locations', label: 'FBA仓库查询' },
      ]
    },
    {
      id: 'oceanServices',
      label: '海运服务',
      type: 'dropdown',
      items: [
        { path: '/sea-freight-logistics-container-shipping-platform-国际海运集装箱物流平台-船期运费查询与货代服务', label: '海运信息平台' },
        { path: '/seaport-query', label: '港口查询' }
      ]
    },
    {
      id: 'airServices',
      label: '空运服务',
      type: 'dropdown',
      items: [
        { path: '/air-platform-logistics-airfreight-shipping-rates-国际空运物流平台-货运报价与航班信息查询系统', label: '空运信息平台' },
      ]
    },
    {
      id: 'multimodal',
      label: '多式联运',
      type: 'dropdown',
      items: [
        { path: '/ddp-service', label: '双清包服务' },
        { path: '/ddu-service', label: '单清包服务' },
        { path: '/ldp-service', label: '港口货服务' }
      ]
    },
    {
      id: 'infoServices',
      label: '信息服务',
      type: 'dropdown',
      items: [
        { path: '/yellow-pages-logistics-supplier-directory-物流企业服务商黄页-货运卡车租赁公司查询平台', label: '黄页查询' },
        { path: '/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统', label: '物流招聘' },
        { path: '/logistics-truck-rental-equipment-leasing-物流设备出租平台-卡车叉车仓库租赁服务', label: '物流出租' },
        { path: '/logistics-truck-sale-equipment-trading-物流设备出售平台-卡车叉车仓库买卖交易', label: '物流出售' },
        { path: '/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区', label: '物流论坛' }
      ]
    },
    {
      id: 'logisticsTool',
      label: '物流工具',
      type: 'dropdown',
      items: [
        { path: '/freight-calculator-logistics-shipping-estimator-tool-物流计算工具-美国物流等级class计算与换算平台', label: '货运计算器' },
        { path: '/kgcm-converter-logistics-unit-conversion-tool-公斤厘米换算工具-国际货运尺寸重量单位转换平台', label: '重量体积转换' }
        
      ]
    },
    {
      id: 'account',
      label: '我的',
      type: 'dropdown',
      items: [
        { path: '/profile', label: '个人中心' },
        { path: '/my-orders', label: '我的订单' },
        { path: '/profile/myJobs', label: '我的招聘' },
        { path: '/profile/myResumes', label: '我的求职' },
        { path: '/profile/articles', label: '我的文章' },
        { path: '/profile/bookmarks', label: '我的收藏' },
        { path: '/profile/settings', label: '账户设置' },
        { path: '/contact', label: '联系我们' }
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleDropdownToggle = (dropdownId) => {
    // 只在移动端使用点击切换逻辑
    const isMobile = window.innerWidth <= 1024;
    if (isMobile) {
      setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
      // 切换主菜单时清理子菜单状态
      setActiveSubmenu(null);
    }
  };

  const handleSubmenuToggle = (submenuId) => {
    // 桌面端和移动端都支持子菜单切换逻辑
    setActiveSubmenu(activeSubmenu === submenuId ? null : submenuId);
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
    setActiveSubmenu(null);
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    // 兼容新旧两种格式
    const firstName = user.firstName || user.first_name || user.attributes?.given_name || '';
    const lastName = user.lastName || user.last_name || user.attributes?.family_name || '';
    return `${firstName} ${lastName}`.trim() || user.email || user.username || '用户';
  };

  const getUserTypeLabel = () => {
    if (!user) return '';
    return '用户'; // 统一显示用户，不再区分类型
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
              <span className="logo-main">Welogx</span>
              <span className="logo-sub">专业物流服务</span>
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
                      {item.items.map((subItem) => {
                        // Handle submenu items - 桌面端也改为点击展开
                        if (subItem.type === 'submenu') {
                          return (
                            <div key={subItem.id} className="submenu-wrapper">
                              <button
                                className={`submenu-trigger ${activeSubmenu === subItem.id ? 'active' : ''}`}
                                onClick={() => handleSubmenuToggle(subItem.id)}
                              >
                                {subItem.label}
                                <ChevronDown size={14} className="submenu-dropdown-icon" />
                              </button>
                              {activeSubmenu === subItem.id && (
                                <div className="submenu-items">
                                  {subItem.items.map((subsubItem) => (
                                    <Link
                                      key={subsubItem.path}
                                      to={subsubItem.path}
                                      className={`submenu-item ${isActive(subsubItem.path) ? 'active' : ''}`}
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        setActiveSubmenu(null);
                                      }}
                                    >
                                      {subsubItem.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`dropdown-item ${isActive(subItem.path) ? 'active' : ''} ${subItem.className || ''}`}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
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
                        {item.items.map((subItem) => {
                          // Handle submenu items in mobile
                          if (subItem.type === 'submenu') {
                            return (
                              <div key={subItem.id} className="mobile-submenu-wrapper">
                                <button
                                  className={`mobile-submenu-trigger ${activeSubmenu === subItem.id ? 'active' : ''}`}
                                  onClick={() => handleSubmenuToggle(subItem.id)}
                                >
                                  {subItem.label}
                                  <ChevronDown size={16} className="submenu-dropdown-icon" />
                                </button>
                                {activeSubmenu === subItem.id && (
                                  <div className="mobile-submenu-items">
                                    {subItem.items.map((subsubItem) => (
                                      <Link
                                        key={subsubItem.path}
                                        to={subsubItem.path}
                                        className={`mobile-submenu-item ${isActive(subsubItem.path) ? 'active' : ''}`}
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          setActiveSubmenu(null);
                                          setIsMenuOpen(false);
                                        }}
                                      >
                                        {subsubItem.label}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`mobile-dropdown-item ${isActive(subItem.path) ? 'active' : ''} ${subItem.className || ''}`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setIsMenuOpen(false);
                              }}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
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