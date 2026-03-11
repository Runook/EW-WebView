import React, { useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle,
  ChevronDown
} from 'lucide-react';

import AdSlot from '../components/AdSlot';
import './Home.css';

const Home = () => {
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
  }, []);

  return (
    <div className="home">
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
                Welogx
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



        {/* 首页广告位 */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 0' }}>
          <AdSlot position="home-banner" layout="horizontal" />
        </section>

        {/* SEO 关键词服务板块 */}
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
                <button onClick={handleNavigateToFreightBoard} className="btn btn-primary">
                  开始使用平台
                  <ArrowRight size={20} />
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