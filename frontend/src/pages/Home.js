import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle,
  ChevronDown
} from 'lucide-react';

import './Home.css';
import RewardModal from '../components/RewardModal';

const Home = () => {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const contentRef = useRef(null);



  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 导航到搜索货源车源页面并滚动到顶部
  const handleNavigateToFreightBoard = () => {
    navigate('/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区');
    // 确保滚动到页面顶部
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    // 自动播放视频（静音）
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(console.error);
    }
    
    // 每次刷新首页时显示悬赏弹窗
    const timer = setTimeout(() => {
      setShowRewardModal(true);
    }, 1500); // 延迟1.5秒显示，让用户先看到页面加载
    
    return () => clearTimeout(timer);
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
                <button onClick={handleNavigateToFreightBoard} className="btn btn-primary btn-large">
                  立即开始
                  <ArrowRight size={20} />
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
                  <br />
                  <span className="development-timeline">
                    自2025年7月1日启动开发以来，我们致力于用前沿技术重塑物流行业生态，
                    为用户提供更智能、更便捷的数字化物流解决方案，欢迎各大物流企业的加盟，期待与您的商业合作。
                  </span>
                </p>
                <div className="hero-actions">
                  <button onClick={handleNavigateToFreightBoard} className="btn btn-primary">
                    搜索货源车源
                    <ArrowRight size={20} />
                  </button>
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
                <button onClick={handleNavigateToFreightBoard} className="btn btn-primary">
                  开始使用平台
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* 悬赏广告弹窗 */}
      <RewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)} 
      />
    </div>
  );
};

export default Home; 