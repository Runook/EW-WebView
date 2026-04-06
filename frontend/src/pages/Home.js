import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle,
  Truck,
  Globe,
  Zap,
  Package,
  X,
  Gift,
  Sparkles,
  MessageCircle,
  HeartHandshake
} from 'lucide-react';

import AdSlot from '../components/AdSlot';
import './Home.css';

const WELCOME_MODAL_KEY = 'welogx_welcome_dismissed';

const WelcomeModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(WELCOME_MODAL_KEY, today);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      className={`welcome-overlay ${isVisible ? 'welcome-overlay--visible' : ''} ${isClosing ? 'welcome-overlay--closing' : ''}`}
      onClick={handleClose}
    >
      <div className="welcome-modal" onClick={e => e.stopPropagation()}>
        <button className="welcome-close" onClick={handleClose} aria-label="关闭">
          <X size={20} />
        </button>

        <div className="welcome-glow" />

        <div className="welcome-trial-banner">
          <Sparkles size={20} />
          <span>试 运 营 中</span>
          <Sparkles size={20} />
        </div>

        <h2 className="welcome-title">
          欢迎来到 <span className="welcome-brand">Welogx</span>
        </h2>

        <p className="welcome-subtitle">
          一站式数字化物流服务平台，感谢您在试运营期间的支持与包容
        </p>

        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="welcome-feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <h4>欢迎指正</h4>
              <p>如您在使用中发现任何问题或有改进建议，我们非常期待您的反馈</p>
            </div>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <HeartHandshake size={20} />
            </div>
            <div>
              <h4>诚邀合作</h4>
              <p>无论您是货主、承运商还是物流服务商，我们期待与您建立合作伙伴关系</p>
            </div>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <Gift size={20} />
            </div>
            <div>
              <h4>积分奖励</h4>
              <p>注册即赠充值积分，参与平台活动还可获得额外积分奖励</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="welcome-btn-primary" onClick={handleClose}>
            开始探索
            <ArrowRight size={16} />
          </button>
          <button className="welcome-btn-secondary" onClick={() => { handleClose(); window.location.href = '/contact'; }}>
            联系我们
          </button>
        </div>

        <p className="welcome-footer-note">感谢您的支持与信任，我们将持续优化体验</p>
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_MODAL_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (dismissed !== today) {
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNavigateToForum = () => {
    navigate('/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleNavigateToLTL = () => {
    navigate('/get-quote-ltl');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="home">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <Helmet>
        <title>Welogx物流平台 - 美国陆运/海运/空运一站式物流服务 | 数字AI智慧物流 | welogx.com</title>
        <meta name="description" content="Welogx物流平台（welogx.com）- 专业的美国物流运输服务平台，提供陆运、海运、空运及多式联运的一站式数字化物流解决方案。DOT全美检查站路检点查询、物流语言、物流执照、物流知识、查车型、查trucking、专线物流、回笼回程车、拳头产品、搭顺风车、load match、求助吐槽、数字AI物流、智慧物流。" />
        <link rel="canonical" href="https://welogx.com/" />
        <meta name="keywords" content="welogx, WeLOGX, welogx.com, Welogx物流, 美国物流, 陆运, 海运, 空运, 物流平台, DOT全美检查站, 路检点, 物流语言, 物流执照, 物流知识, 查车型, 查trucking, 专线物流, 回笼回程车, 拳头产品, 搭顺风车, load match, 求助吐槽, 数字AI物流, 智慧物流" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://welogx.com/" />
        <meta property="og:title" content="Welogx物流平台 - 数字AI智慧物流 | 专业美国物流运输服务平台" />
        <meta property="og:description" content="专业的美国物流运输服务平台，提供陆运、海运、空运、多式联运等一站式物流解决方案。DOT全美检查站、物流知识、专线物流、load match、智慧物流。" />
        <meta property="og:image" content="https://welogx.com/logo.png" />
      </Helmet>

      {/* Hero Section - Animated Gradient Mesh */}
      <section className="hero-prime">
        <div className="hero-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-pattern"></div>
        </div>

        <div className="hero-prime-content">
          <div className="container">
            <div className="hero-badge">
              <Zap size={14} />
              <span>AI 驱动的智慧物流平台</span>
            </div>

            <h1 className="hero-prime-title">
              <span className="title-line">Welogx</span>
              <span className="title-gradient">连接美亚</span>
            </h1>

            <p className="hero-prime-desc">
              连接货主、承运商、物流服务商，打造高效透明的物流信息交易平台。
              <br />
              发布需求、寻找服务、在线交易，让物流更简单。
            </p>

            <div className="hero-prime-actions">
              <button onClick={handleNavigateToLTL} className="btn-hero-primary">
                立即获取LTL报价
                <ArrowRight size={18} />
              </button>
              <button onClick={handleNavigateToForum} className="btn-hero-secondary">
                物流论坛
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <CheckCircle size={16} />
                <span>信息发布免费</span>
              </div>
              <div className="trust-item">
                <CheckCircle size={16} />
                <span>实时匹配推荐</span>
              </div>
              <div className="trust-item">
                <CheckCircle size={16} />
                <span>交易安全保障</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card card-1">
            <Truck size={24} />
            <span>陆运</span>
          </div>
          <div className="visual-card card-2">
            <Globe size={24} />
            <span>海运</span>
          </div>
          <div className="visual-card card-3">
            <Package size={24} />
            <span>空运</span>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card stat-card-green">
              <div className="stat-icon-wrap stat-icon-green">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="20" r="14" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" opacity="0.3"/>
                  <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                  <circle cx="24" cy="20" r="3" fill="currentColor"/>
                  <path d="M24 34 L24 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 42 L30 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10 20 L6 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                  <path d="M42 20 L38 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                  <path d="M24 6 L24 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">全美覆盖</span>
                <span className="stat-label">DOT检查站查询</span>
              </div>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="stat-icon-wrap stat-icon-blue">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="14" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 26 L20 22 L26 28 L34 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="34" cy="18" r="2.5" fill="currentColor"/>
                  <path d="M16 8 L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M24 6 L24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M32 8 L32 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 10 L28 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">AI 智能</span>
                <span className="stat-label">数字化物流方案</span>
              </div>
            </div>

            <div className="stat-card stat-card-purple">
              <div className="stat-icon-wrap stat-icon-purple">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="32" cy="16" r="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 24 C16 24, 16 30, 10 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M32 24 C32 24, 32 30, 38 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 23 L30 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                  <path d="M20 28 C22 32, 26 32, 28 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M22 34 L24 38 L26 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="24" cy="42" r="2" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">B2B 平台</span>
                <span className="stat-label">货主与承运商对接</span>
              </div>
            </div>

            <div className="stat-card stat-card-red">
              <div className="stat-icon-wrap stat-icon-red">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 6 L40 16 L40 34 L24 44 L8 34 L8 16 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M24 12 L34 18 L34 30 L24 36 L14 30 L14 18 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.35"/>
                  <path d="M19 22 L23 27 L30 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="24" cy="6" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="40" cy="16" r="1.5" fill="currentColor" opacity="0.3"/>
                  <circle cx="8" cy="16" r="1.5" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">安全可靠</span>
                <span className="stat-label">合规运营保障</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Timeline Note */}
      <section className="timeline-note">
        <div className="container">
          <div className="timeline-card">
            <p>
              自2025年7月1日启动开发以来，我们致力于用前沿技术重塑物流行业生态，
              为用户提供更智能、更便捷的数字化物流解决方案，欢迎各大物流企业的加盟，期待与您的商业合作。
            </p>
          </div>
        </div>
      </section>

      {/* Ad Slot */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 0' }}>
        <AdSlot position="home-banner" layout="horizontal" />
      </section>

      {/* SEO Services Grid */}
      <section className="seo-services">
        <div className="container">
          <h2 className="seo-services-title">平台核心功能与服务</h2>
          <div className="seo-services-grid">
            <div className="seo-service-card">
              <h3>DOT 全美检查站 · 路检点</h3>
              <p>实时查询全美DOT检查站位置与路检点信息，帮助卡车司机提前规划路线，确保合规运营。</p>
            </div>
            <div className="seo-service-card">
              <h3>物流语言 · 物流知识</h3>
              <p>专业物流术语大全与行业知识库，涵盖中英双语物流用语，助力从业者快速入门与提升。</p>
            </div>
            <div className="seo-service-card">
              <h3>物流执照</h3>
              <p>物流执照申请指南、MC/DOT号码办理流程、保险要求等全套合规资讯，一站式解决开业难题。</p>
            </div>
            <div className="seo-service-card">
              <h3>查车型 · 查 Trucking</h3>
              <p>卡车车型数据库查询，了解各类运输车辆的规格、载重与适用场景，精准匹配运输需求。</p>
            </div>
            <div className="seo-service-card">
              <h3>专线物流 · 回笼回程车</h3>
              <p>专线物流资源整合，空车回程配载平台，降低空驶率，优化运力资源，节省运输成本。</p>
            </div>
            <div className="seo-service-card">
              <h3>搭顺风车 · Load Match</h3>
              <p>智能货源匹配系统，快速对接货主与承运商，搭顺风车节省运费，实现货源与运力的高效对接。</p>
            </div>
            <div className="seo-service-card">
              <h3>拳头产品</h3>
              <p>平台特色优势产品，包括LTL零担报价比价、FBA物流专线、整车运输及多式联运解决方案。</p>
            </div>
            <div className="seo-service-card">
              <h3>数字AI物流 · 智慧物流</h3>
              <p>运用AI人工智能技术驱动物流决策，智能报价、智能调度、数据分析，引领物流行业数字化转型。</p>
            </div>
            <div className="seo-service-card">
              <h3>求助吐槽 · 社区交流</h3>
              <p>物流从业者互助社区，分享行业经验、路况信息、政策变动，共建华人物流信息交流平台。</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">立即加入Welogx物流平台</h2>
            <p className="cta-description">
              无论您是货主、承运商还是物流服务商，我们都为您提供最合适的平台服务
            </p>
            <div className="cta-actions">
              <button onClick={handleNavigateToLTL} className="btn btn-primary">
                立即获取LTL报价
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
