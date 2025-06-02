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
  Navigation,
  Package,
  BarChart3,
  Award
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
                {/* 主要运输方式卡片 */}
                <div className="floating-card card-1 transport-card">
                  <div className="card-gradient truck-gradient"></div>
                  <div className="card-content">
                    <Truck size={28} />
                    <span className="card-title">陆运</span>
                    <span className="card-subtitle">公路运输</span>
                  </div>
                  <div className="card-stats">
                    <span className="stat-dot"></span>
                    <span className="stat-text">1.2万+</span>
                  </div>
                </div>

                <div className="floating-card card-2 transport-card">
                  <div className="card-gradient ocean-gradient"></div>
                  <div className="card-content">
                    <Ship size={28} />
                    <span className="card-title">海运</span>
                    <span className="card-subtitle">国际货运</span>
                  </div>
                  <div className="card-stats">
                    <span className="stat-dot"></span>
                    <span className="stat-text">850+</span>
                  </div>
                </div>

                <div className="floating-card card-3 transport-card">
                  <div className="card-gradient air-gradient"></div>
                  <div className="card-content">
                    <Plane size={28} />
                    <span className="card-title">空运</span>
                    <span className="card-subtitle">快速配送</span>
                  </div>
                  <div className="card-stats">
                    <span className="stat-dot"></span>
                    <span className="stat-text">620+</span>
                  </div>
                </div>

                <div className="floating-card card-4 transport-card">
                  <div className="card-gradient multimodal-gradient"></div>
                  <div className="card-content">
                    <Navigation size={28} />
                    <span className="card-title">联运</span>
                    <span className="card-subtitle">多式运输</span>
                  </div>
                  <div className="card-stats">
                    <span className="stat-dot"></span>
                    <span className="stat-text">480+</span>
                  </div>
                </div>

                {/* 数据指标卡片 */}
                <div className="floating-card card-5 data-card">
                  <div className="data-content">
                    <BarChart3 size={20} />
                    <div className="data-text">
                      <span className="data-number">99.8%</span>
                      <span className="data-label">准时率</span>
                    </div>
                  </div>
                </div>

                <div className="floating-card card-6 data-card">
                  <div className="data-content">
                    <Package size={20} />
                    <div className="data-text">
                      <span className="data-number">2.5万</span>
                      <span className="data-label">日订单</span>
                    </div>
                  </div>
                </div>

                <div className="floating-card card-7 data-card">
                  <div className="data-content">
                    <Award size={20} />
                    <div className="data-text">
                      <span className="data-number">4.9</span>
                      <span className="data-label">服务评分</span>
                    </div>
                  </div>
                </div>

                {/* 背景装饰元素 */}
                <div className="bg-element element-1"></div>
                <div className="bg-element element-2"></div>
                <div className="bg-element element-3"></div>
                
                {/* 连接线动画 */}
                <svg className="connection-lines" width="100%" height="100%">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34C759" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#34C759" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path 
                    className="connection-line line-1" 
                    d="M 80 120 Q 200 80 320 160" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2" 
                    fill="none" 
                  />
                  <path 
                    className="connection-line line-2" 
                    d="M 120 300 Q 250 250 380 320" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2" 
                    fill="none" 
                  />
                </svg>
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