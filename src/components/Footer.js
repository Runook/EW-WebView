import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.services'), path: '/services' },
    { label: t('nav.freightBoard'), path: '/freight-board' },
    { label: t('nav.contact'), path: '/contact' }
  ];

  const services = [
    t('home.services.oceanFreight'),
    t('home.services.truckLoads'),
    t('home.services.fbaShipping'),
    t('home.services.warehousing'),
    t('services.airFreight.title'),
    t('services.lastMile.title')
  ];

  const legalLinks = [
    t('footer.privacyPolicy'),
    t('footer.termsOfService'),
    t('footer.cookiePolicy'),
    t('footer.compliance')
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <img src="/logo.png" alt="EWLogistics Logo" className="footer-logo-image" />
              </div>
              <div className="footer-logo-text">
                <span className="footer-logo-main">{t('logo.main')}</span>
                <span className="footer-logo-sub">{t('logo.sub')}</span>
              </div>
            </Link>
            <p className="footer-description">
              {t('footer.description')}
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <Phone size={16} />
                <span>+1 (718) 386-7888</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>info@ewlogistics.com</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Hauppauge, New York, USA</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">{t('footer.quickLinks')}</h3>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h3 className="footer-title">{t('footer.services')}</h3>
            <ul className="footer-links">
              {services.map((service) => (
                <li key={service}>
                  <Link to="/services" className="footer-link">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="footer-section">
            <h3 className="footer-title">{t('footer.legal')}</h3>
            <ul className="footer-links">
              {legalLinks.map((link) => (
                <li key={link}>
                  <button className="footer-link footer-link-button" type="button">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
            <div className="footer-certifications">
              <p className="certification-title">{t('footer.licenses')}</p>
              <div className="certifications">
                <span>MC #: 1094635</span>
                <span>Broker MC #: 1281963</span>
                <span>UIIA SCAC: EWLV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} {t('footer.copyright')}
            </p>
            <div className="social-links">
              <button className="social-link" aria-label="Facebook" type="button">
                <Facebook size={20} />
              </button>
              <button className="social-link" aria-label="Twitter" type="button">
                <Twitter size={20} />
              </button>
              <button className="social-link" aria-label="LinkedIn" type="button">
                <Linkedin size={20} />
              </button>
              <button className="social-link" aria-label="Instagram" type="button">
                <Instagram size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 