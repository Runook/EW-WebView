import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Ship, 
  ArrowRight, 
  CheckCircle,
  Users,
  Globe,
  Clock,
  Shield,
  Plane,
  Navigation
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: <Users size={24} />, number: '10,000+', label: t('home.stats.customers') },
    { icon: <Globe size={24} />, number: '50+', label: t('home.stats.countries') },
    { icon: <Clock size={24} />, number: '24/7', label: t('home.stats.support') },
    { icon: <Shield size={24} />, number: '99.9%', label: t('home.stats.delivery') }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                物流行业
                <span className="text-green">B2B服务平台</span>
              </h1>
              <p className="hero-description">
                连接货主、承运商、物流服务商，打造高效透明的物流信息交易平台。
                发布需求、寻找服务、在线交易，让物流更简单。
              </p>
              <div className="hero-actions">
                <Link to="/freight-board" className="btn btn-primary">
                  陆运平台
                  <ArrowRight size={20} />
                </Link>
                <Link to="/services" className="btn btn-secondary">
                  所有平台
                </Link>
              </div>
              <div className="hero-features">
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>信息发布免费</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>实时匹配推荐</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>交易安全保障</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <div className="floating-card card-1">
                  <Truck size={24} />
                  <span>陆运</span>
                </div>
                <div className="floating-card card-2">
                  <Ship size={24} />
                  <span>海运</span>
                </div>
                <div className="floating-card card-3">
                  <Plane size={24} />
                  <span>空运</span>
                </div>
                <div className="floating-card card-4">
                  <Navigation size={24} />
                  <span>联运</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">立即加入东西方物流平台</h2>
            <p className="cta-description">
              无论您是货主、承运商还是物流服务商，我们都为您提供最合适的平台服务
            </p>
            <div className="cta-actions">
              <Link to="/freight-board" className="btn btn-primary">
                开始使用平台
                <ArrowRight size={20} />
              </Link>
              <button className="btn btn-ghost">
                联系客服
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 