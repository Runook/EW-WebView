import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle,
  Users,
  Globe,
  Clock,
  Shield,
  ChevronDown,
  Play,
  Pause
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  const stats = [
    { icon: <Users size={24} />, number: '10,000+', label: t('home.stats.customers') },
    { icon: <Globe size={24} />, number: '50+', label: t('home.stats.countries') },
    { icon: <Clock size={24} />, number: '24/7', label: t('home.stats.support') },
    { icon: <Shield size={24} />, number: '99.9%', label: t('home.stats.delivery') }
  ];

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    // 自动播放视频（静音）
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <div className="home">
      {/* Video Hero Section - 首屏视频背景 */}
      <section className="video-hero">
        <div className="video-background">
          {/* 
            视频文件放置说明：
            1. 将您的视频文件命名为 'hero-video.mp4'
            2. 放置在 frontend/public/videos/ 目录下
            3. 推荐视频规格：
               - 分辨率：1920x1080 或更高
               - 格式：MP4 (H.264编码)
               - 时长：10-30秒循环
               - 文件大小：建议小于 50MB
            4. 如果需要其他格式支持，可以添加多个 source 标签
          */}
          <video 
            ref={videoRef}
            className="hero-video"
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
            <source src="/videos/hero-video.webm" type="video/webm" />
            {/* 如果视频无法加载，显示后备内容 */}
            您的浏览器不支持视频播放
          </video>
          
          {/* 视频遮罩层 */}
          <div className="video-overlay"></div>
        </div>

        {/* 视频上的内容 */}
        <div className="video-content">
          <div className="container">
            <div className="video-text">
              <h1 className="video-title">
                东西方物流
                <span className="text-highlight">连接世界</span>
              </h1>
              <p className="video-description">
                智能物流平台，连接全球货主与承运商
                <br />
                让每一次运输都更高效、更安全、更可靠
              </p>
              <div className="video-actions">
                <Link to="/freight-board" className="btn btn-primary btn-large">
                  立即开始
                  <ArrowRight size={20} />
                </Link>
                <button 
                  onClick={toggleVideo}
                  className="btn btn-ghost btn-large video-control"
                >
                  <Play size={20} />
                  <Pause size={20} className="pause-icon" />
                  <span>播放/暂停</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className="scroll-indicator" onClick={scrollToContent}>
          <div className="scroll-text">向下滚动了解更多</div>
          <div className="scroll-arrow">
            <ChevronDown size={24} />
          </div>
        </div>
      </section>

      {/* 原有内容区域 - 向下滚动可见 */}
      <div ref={contentRef} className="content-section">
        {/* Hero Section - 原有的hero内容 */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <h2 className="hero-title">
                  物流行业
                  <span className="text-green">B2B服务平台</span>
                </h2>
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
                {/* 简化的hero图片区域，移除所有浮块 */}
                <div className="hero-simple-graphic">
                  <div className="simple-bg-element"></div>
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
    </div>
  );
};

export default Home; 