import React from 'react';
import { 
  Mail, 
  DollarSign, 
  Globe, 
  Award, 
  Truck, 
  Package, 
  Users, 
  Calculator, 
  MessageSquare, 
  Shield,
  Search,
  Home,
  Briefcase,
  AlertTriangle,
  X
} from 'lucide-react';
import Modal from './common/Modal';
import './RewardModal.css';

const RewardModal = ({ isOpen, onClose }) => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent('公司命名悬赏 - Company Naming Reward - Up to $500 USD');
    const body = encodeURIComponent(`
亲爱的团队，
Dear Team,

我对您们的公司命名悬赏活动非常感兴趣！看完了您们平台的功能介绍，深受震撼！
I am very interested in your company naming reward campaign! After reading about your platform features, I'm truly impressed!

我的建议如下：
My suggestions are as follows:

中文公司名称建议 / Chinese Company Name Suggestion:
[请填写您的中文名称建议]

英文公司名称建议 / English Company Name Suggestion:
[请填写您的英文名称建议]

域名建议 / Domain Name Suggestion (必须未注册 / Must be unregistered):
[请填写您的域名建议 - 请确认域名未被注册]

设计理念与寓意 / Design Concept and Meaning:
[请详细描述您的命名理念，体现平台的物流本质、创新性和可信度]

为什么这个名字适合您的平台 / Why this name suits your platform:
[请说明名字如何体现"帮商家找车、帮司机找货、最佳物流工具、行业净化"等核心价值]

联系方式 / Contact Information:
姓名/Name: [您的姓名]
电话/Phone: [您的联系电话]
邮箱/Email: [您的邮箱地址]
微信/WeChat: [可选]

奖励说明 / Reward Information:
🎯 中英文名字 + 域名全部被采用 = $500 现金奖励
🎯 仅采用名字或仅采用域名 = $250 现金奖励
🎯 All names + domain adopted = $500 USD cash
🎯 Only name(s) or domain adopted = $250 USD cash

期待您的回复！我势在必得！💰
Looking forward to your reply! I'm determined to win this reward! 💰

此致敬礼
Best regards
    `);
    
    window.open(`mailto:ftl.us48@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="extra-large"
      className="reward-modal"
    >
      <div className="reward-content">
        {/* 关闭按钮 */}
        <button className="reward-close-btn" onClick={onClose} aria-label="关闭">
          <X size={24} />
        </button>
        
        {/* 头部标题 */}
        <div className="reward-header">
          <div className="reward-icon">
            <Award size={60} className="award-icon" />
          </div>
          <h1 className="reward-title">
            <span className="title-cn">公司命名悬赏</span>
            <span className="title-en">Company Naming Contest</span>
          </h1>
        </div>

        {/* 现金展示区域 - 5张100美元 */}
        <div className="cash-showcase">
          <div className="cash-title">
            <span className="cash-title-cn">
              <span className="cash-amount">$500 USD</span> 现金奖励
            </span>
            <span className="cash-title-en">
              Cash Reward
            </span>
          </div>
          <div className="cash-bills">
            <div className="bill-container">
              <div className="bill-placeholder">
                <img src="/100usd.jpg" alt="$100 USD" />
              </div>
            </div>
            <div className="bill-container">
              <div className="bill-placeholder">
                <img src="/100usd.jpg" alt="$100 USD" />
              </div>
            </div>
            <div className="bill-container">
              <div className="bill-placeholder">
                <img src="/100usd.jpg" alt="$100 USD" />
              </div>
            </div>
            <div className="bill-container">
              <div className="bill-placeholder">
                <img src="/100usd.jpg" alt="$100 USD" />
              </div>
            </div>
            <div className="bill-container">
              <div className="bill-placeholder">
                <img src="/100usd.jpg" alt="$100 USD" />
              </div>
            </div>
          </div>
          <div className="total-amount">
            <DollarSign size={32} className="dollar-icon" />
          </div>
        </div>

        {/* 公司介绍 */}
        <div className="company-intro">
          <h2 className="intro-title">
            <span className="intro-title-cn">革命性物流平台 - 为谁而生？</span>
            <span className="intro-title-en">Revolutionary Logistics Platform - Who Are We For?</span>
          </h2>
          
          <div className="intro-grid">
            {/* 核心功能1 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Truck size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">帮助商家找车</span>
                <span className="feature-title-en">Help Businesses Find Trucks</span>
              </h3>
              <p>
                <span className="feature-desc-cn">智能匹配系统，让货主秒找到合适车源，告别电话轰炸和低效沟通</span>
                <span className="feature-desc-en">Smart matching system for instant truck finding, goodbye to phone harassment</span>
              </p>
            </div>

            {/* 核心功能2 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Package size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">帮助司机找货</span>
                <span className="feature-title-en">Help Drivers Find Loads</span>
              </h3>
              <p>
                <span className="feature-desc-cn">精准货源推送，让司机空车不空跑，最大化收益和运营效率</span>
                <span className="feature-desc-en">Precise load recommendations, maximize driver revenue and efficiency</span>
              </p>
            </div>

            {/* 核心功能3 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Calculator size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">最好用的物流工具</span>
                <span className="feature-title-en">Best Logistics Tools</span>
              </h3>
              <p>
                <span className="feature-desc-cn">换算/格式一次成型，运费计算、尺寸转换、路线规划，一站式解决</span>
                <span className="feature-desc-en">One-click conversion tools, freight calculation, route planning, all-in-one</span>
              </p>
            </div>

            {/* 核心功能4 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Briefcase size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">物流行业招聘</span>
                <span className="feature-title-en">Logistics Recruitment</span>
              </h3>
              <p>
                <span className="feature-desc-cn">专业司机、调度员、物流经理精准匹配，解决行业人才紧缺问题</span>
                <span className="feature-desc-en">Precise matching for drivers, dispatchers, logistics managers</span>
              </p>
            </div>

            {/* 核心功能5 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Home size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">租赁 & 出售平台</span>
                <span className="feature-title-en">Rental & Sales Platform</span>
              </h3>
              <p>
                <span className="feature-desc-cn">卡车、拖车、仓库设备租售信息，盘活闲置资源，降低运营成本</span>
                <span className="feature-desc-en">Truck, trailer, warehouse equipment rental and sales marketplace</span>
              </p>
            </div>

            {/* 核心功能6 */}
            <div className="feature-card danger">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">论坛专挂骗子公司</span>
                <span className="feature-title-en">Scammer Company Blacklist Forum</span>
              </h3>
              <p>
                <span className="feature-desc-cn">业内独家！专门曝光骗子公司，保护司机和货主，净化行业环境</span>
                <span className="feature-desc-en">Industry exclusive! Expose scammer companies, protect drivers and shippers</span>
              </p>
            </div>

            {/* 核心功能7 */}
            <div className="feature-card danger">
              <div className="feature-icon">
                <Search size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">黑名单电话一键检索</span>
                <span className="feature-title-en">Blacklist Phone One-Click Search</span>
              </h3>
              <p>
                <span className="feature-desc-cn">输入电话号码，瞬间识别骗子！史上最强反诈工具，拯救物流人</span>
                <span className="feature-desc-en">Enter phone number, instantly identify scammers! Ultimate anti-fraud tool</span>
              </p>
            </div>

            {/* 核心功能8 */}
            <div className="feature-card">
              <div className="feature-icon">
                <MessageSquare size={32} />
              </div>
              <h3>
                <span className="feature-title-cn">专业交流论坛</span>
                <span className="feature-title-en">Professional Community Forum</span>
              </h3>
              <p>
                <span className="feature-desc-cn">司机经验分享、路况信息、政策解读，打造最有价值的物流知识库</span>
                <span className="feature-desc-en">Driver experience sharing, traffic info, policy updates, valuable knowledge base</span>
              </p>
            </div>
          </div>
        </div>

        {/* 痛点解决说明 */}
        <div className="pain-points">
          <h3 className="pain-title">
            <span className="pain-title-cn">我们解决了哪些行业痛点？</span>
            <span className="pain-title-en">What Industry Pain Points Do We Solve?</span>
          </h3>
          <div className="pain-list">
            <div className="pain-item">
              <AlertTriangle size={20} className="pain-icon" />
              <span className="pain-text-cn">❌ 货主找车难，信息不对称，被坑被骗频发</span>
              <span className="pain-text-en">❌ Shippers struggle to find trucks, information asymmetry, frequent scams</span>
            </div>
            <div className="pain-item">
              <AlertTriangle size={20} className="pain-icon" />
              <span className="pain-text-cn">❌ 司机空车率高，找货靠运气，收入不稳定</span>
              <span className="pain-text-en">❌ High empty truck rate, finding loads by luck, unstable income</span>
            </div>
            <div className="pain-item">
              <AlertTriangle size={20} className="pain-icon" />
              <span className="pain-text-cn">❌ 物流工具分散，计算繁琐，效率极低</span>
              <span className="pain-text-en">❌ Scattered logistics tools, tedious calculations, low efficiency</span>
            </div>
            <div className="pain-item">
              <AlertTriangle size={20} className="pain-icon" />
              <span className="pain-text-cn">❌ 行业骗子横行，缺乏有效监管和预警</span>
              <span className="pain-text-en">❌ Industry scammers run rampant, lack of effective supervision</span>
            </div>
          </div>
        </div>

        {/* 悬赏要求 */}
        <div className="contest-requirements">
          <h3 className="req-main-title">
            <span className="req-main-title-cn">命名要求 (重要！)</span>
            <span className="req-main-title-en">Naming Requirements (Important!)</span>
          </h3>
          <div className="requirements-grid">
            <div className="req-item">
              <div className="req-number">1</div>
              <div className="req-content">
                <span className="req-cn">提供响亮的中文公司名称</span>
                <span className="req-en">Provide catchy Chinese company name</span>
              </div>
            </div>
            <div className="req-item">
              <div className="req-number">2</div>
              <div className="req-content">
                <span className="req-cn">提供国际化英文公司名称</span>
                <span className="req-en">Provide international English company name</span>
              </div>
            </div>
            <div className="req-item special">
              <div className="req-number">3</div>
              <div className="req-content">
                <span className="req-cn">域名必须未注册 (.com优先)</span>
                <span className="req-en">Domain MUST be unregistered (.com preferred)</span>
              </div>
            </div>
            <div className="req-item">
              <div className="req-number">4</div>
              <div className="req-content">
                <span className="req-cn">体现物流本质，朗朗上口，寓意美好</span>
                <span className="req-en">Reflect logistics essence, catchy, positive meaning</span>
              </div>
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="reward-contact">
          <button className="contact-btn" onClick={handleEmailClick}>
            <Mail size={24} />
            <span className="btn-text">
              <span className="btn-cn">立即参与赢取最高 $500 现金</span>
              <span className="btn-en">Participate Now for Up to $500 Cash</span>
            </span>
          </button>
          <p className="email-info">
            <span className="email-cn">邮箱地址：</span>
            <span className="email-en">Email: </span>
            <strong>ftl.us48@gmail.com</strong>
          </p>
        </div>

        {/* 底部说明 */}
        <div className="reward-footer">
          <p className="footer-text">
            <span className="footer-cn">
              🎯 <strong>奖励规则说明：</strong><br/>
              • 中英文名字 + 域名全部被采用：<strong style={{color: '#dc2626'}}>$500 现金奖励</strong><br/>
              • 仅采用名字或仅采用域名：<strong style={{color: '#f59e0b'}}>$250 现金奖励</strong><br/>
              • 一旦确定采用，立即发放现金奖金！
            </span>
            <span className="footer-en">
              🎯 <strong>Reward Rules:</strong><br/>
              • Chinese & English names + Domain all adopted: <strong style={{color: '#dc2626'}}>$500 USD Cash</strong><br/>
              • Only name(s) or only domain adopted: <strong style={{color: '#f59e0b'}}>$250 USD Cash</strong><br/>
              • Cash reward paid immediately upon adoption!
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RewardModal; 