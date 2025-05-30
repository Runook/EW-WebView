import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navigationItems = [
    { path: '/', label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/land-warehouse', label: t('nav.landWarehouse') },
    { path: '/seaport-query', label: t('nav.seaportQuery') },
    { path: '/airport-query', label: t('nav.airportQuery') },
    { path: '/contact', label: t('nav.contact') }
  ];

  const isActive = (path) => location.pathname === path;

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
            <button className="btn btn-primary">
              <Phone size={20} />
              (718) 386-7888
            </button>
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
              <button className="btn btn-primary mobile-btn">
                <Phone size={20} />
                {t('header.callNow')}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 