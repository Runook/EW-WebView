import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '首页', path: '/' },
    { label: '服务', path: '/services' },
    { label: '陆运仓库', path: '/land-warehouse' },
    { label: '港口查询', path: '/seaport-query' },
    { label: '联系我们', path: '/contact' }
  ];

  const services = [
    '海运货运',
    '陆运货运',
    '仓储服务',
    '空运货运',
    '最后一公里配送'
  ];

  const legalLinks = [
    '隐私政策',
    '服务条款',
    'Cookie政策',
    '合规声明'
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
                <span className="footer-logo-main">EW物流</span>
                <span className="footer-logo-sub">专业物流服务</span>
              </div>
            </Link>
            <p className="footer-description">
              为全球客户提供专业、高效、可靠的物流运输服务，致力于成为您最信赖的物流合作伙伴。
            </p>
            <p className="footer-contact">
              5164277016<br/>
              ftl.us48@gmail.com<br/>
              Hauppauge, New York, USA
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">快速链接</h3>
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
            <h3 className="footer-title">服务项目</h3>
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
            <h3 className="footer-title">法律条款</h3>
            <ul className="footer-links">
              {legalLinks.map((link) => (
                <li key={link}>
                  <button className="footer-link footer-link-button" type="button">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
            {/* <div className="footer-certifications">
              <p className="certification-title">运营许可证</p>
              <div className="certifications">
                <span>MC #: 1094635</span>
                <span>Broker MC #: 1281963</span>
                <span>UIIA SCAC: EWLV</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} EW物流平台. 保留所有权利.
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