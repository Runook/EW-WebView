import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, Twitter, Linkedin, Instagram,
  Phone, Mail, MapPin, MessageCircle,
  ArrowUpRight
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '首页', path: '/' },
    { label: 'LTL 报价', path: '/get-quote-ltl' },
    { label: '物流论坛', path: '/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区' },
    { label: 'FBA 仓库', path: '/fba-locations' },
    { label: '联系我们', path: '/contact' }
  ];

  const services = [
    { label: '海运货运', path: '/services' },
    { label: '陆运货运', path: '/services' },
    { label: '空运货运', path: '/services' },
    { label: '仓储服务', path: '/services' },
    { label: '物流租售', path: '/logistics-rental' }
  ];

  return (
    <footer className="footer-new">
      {/* Contact Strip */}
      <div className="footer-contact-strip">
        <div className="container">
          <div className="contact-cards">
            <a href="tel:5164277016" className="contact-card">
              <div className="contact-card-icon contact-icon-green">
                <Phone size={20} />
              </div>
              <div className="contact-card-info">
                <span className="contact-card-label">电话咨询</span>
                <span className="contact-card-value">(516) 427-7016</span>
              </div>
            </a>
            <a href="mailto:ftl.us48@gmail.com" className="contact-card">
              <div className="contact-card-icon contact-icon-blue">
                <Mail size={20} />
              </div>
              <div className="contact-card-info">
                <span className="contact-card-label">商务邮箱</span>
                <span className="contact-card-value">ftl.us48@gmail.com</span>
              </div>
            </a>
            <div className="contact-card">
              <div className="contact-card-icon contact-icon-purple">
                <MessageCircle size={20} />
              </div>
              <div className="contact-card-info">
                <span className="contact-card-label">微信联系</span>
                <span className="contact-card-value">LtlshippingtoUsa</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon contact-icon-red">
                <MapPin size={20} />
              </div>
              <div className="contact-card-info">
                <span className="contact-card-label">公司地址</span>
                <span className="contact-card-value">Hauppauge, NY 11788</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-bg-grid"></div>
        <div className="container">
          <div className="footer-columns">
            {/* Brand Column */}
            <div className="footer-col footer-col-brand">
              <Link to="/" className="footer-logo">
                <div className="footer-logo-icon">
                  <img src="/logo.png" alt="Welogx Logo" className="footer-logo-image" />
                </div>
                <div className="footer-logo-text">
                  <span className="footer-logo-main">Welogx</span>
                  <span className="footer-logo-sub">连接世界 · 智慧物流</span>
                </div>
              </Link>
              <p className="footer-brand-desc">
                AI 驱动的一站式数字化物流服务平台，连接货主、承运商与物流服务商，让每一次运输都更高效、更透明。
              </p>
              <div className="footer-certs">
                <div className="cert-badge">MC# 1094635</div>
                <div className="cert-badge">Broker MC# 1281963</div>
                <div className="cert-badge">SCAC: EWLV</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">快速链接</h4>
              <ul className="footer-nav">
                {quickLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="footer-nav-link">
                      <span>{link.label}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="footer-col">
              <h4 className="footer-col-title">服务项目</h4>
              <ul className="footer-nav">
                {services.map((svc) => (
                  <li key={svc.label}>
                    <Link to={svc.path} className="footer-nav-link">
                      <span>{svc.label}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours & Social */}
            <div className="footer-col">
              <h4 className="footer-col-title">工作时间</h4>
              <div className="footer-hours">
                <div className="hours-row">
                  <span className="hours-day">周一 – 周五</span>
                  <span className="hours-time">8:00 – 18:00 EST</span>
                </div>
                <div className="hours-row">
                  <span className="hours-day">周六</span>
                  <span className="hours-time">9:00 – 14:00 EST</span>
                </div>
                <div className="hours-row">
                  <span className="hours-day">周日</span>
                  <span className="hours-time hours-closed">休息</span>
                </div>
              </div>
              <div className="footer-social">
                <button className="social-btn" aria-label="Facebook" type="button">
                  <Facebook size={18} />
                </button>
                <button className="social-btn" aria-label="Twitter" type="button">
                  <Twitter size={18} />
                </button>
                <button className="social-btn" aria-label="LinkedIn" type="button">
                  <Linkedin size={18} />
                </button>
                <button className="social-btn" aria-label="Instagram" type="button">
                  <Instagram size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom-bar">
            <p className="footer-copyright">
              © {currentYear} WELOGX TECHNOLOGY INC. All Rights Reserved.
            </p>
            <div className="footer-legal">
              <button type="button">隐私政策</button>
              <span className="legal-divider">·</span>
              <button type="button">服务条款</button>
              <span className="legal-divider">·</span>
              <button type="button">Cookie 政策</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
