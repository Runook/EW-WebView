import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageCircle,
  Send, ArrowRight, CheckCircle
} from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [formStatus, setFormStatus] = useState(null); // null | 'sending' | 'sent'

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => setFormStatus('sent'), 1500);
  };

  return (
    <div className="ct-page">
      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero-bg">
          <div className="ct-orb ct-orb-1"></div>
          <div className="ct-orb ct-orb-2"></div>
          <div className="ct-grid-pattern"></div>
        </div>
        <div className="ct-hero-content">
          <h1 className="ct-hero-title">联系我们</h1>
          <p className="ct-hero-desc">
            随时联系 Welogx 专业团队，获取个性化的物流解决方案和报价
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="ct-cards-section">
        <div className="container">
          <div className="ct-cards">
            <a href="tel:5164277016" className="ct-card">
              <div className="ct-card-icon ct-icon-green">
                <Phone size={22} />
              </div>
              <h3>电话咨询</h3>
              <p className="ct-card-value">(516) 427-7016</p>
              <p className="ct-card-note">周一至周五 8:00-18:00 EST</p>
            </a>

            <a href="mailto:ftl.us48@gmail.com" className="ct-card">
              <div className="ct-card-icon ct-icon-blue">
                <Mail size={22} />
              </div>
              <h3>商务邮箱</h3>
              <p className="ct-card-value">ftl.us48@gmail.com</p>
              <p className="ct-card-note">24 小时在线接收</p>
            </a>

            <div className="ct-card">
              <div className="ct-card-icon ct-icon-purple">
                <MessageCircle size={22} />
              </div>
              <h3>微信联系</h3>
              <p className="ct-card-value">welogx</p>
              <p className="ct-card-note">添加好友请备注来意</p>
            </div>

            <div className="ct-card">
              <div className="ct-card-icon ct-icon-red">
                <MapPin size={22} />
              </div>
              <h3>公司地址</h3>
              <p className="ct-card-value">55 Kennedy Dr</p>
              <p className="ct-card-note">Hauppauge, NY 11788</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Form + Info */}
      <section className="ct-main">
        <div className="container">
          <div className="ct-layout">
            {/* Left: Contact Form */}
            <div className="ct-form-wrap">
              <h2 className="ct-section-title">发送消息</h2>
              <p className="ct-section-desc">填写以下信息，我们会尽快与您联系</p>

              {formStatus === 'sent' ? (
                <div className="ct-success">
                  <div className="ct-success-icon">
                    <CheckCircle size={40} />
                  </div>
                  <h3>消息已发送</h3>
                  <p>感谢您的联系，我们的团队将在 24 小时内回复您。</p>
                  <button className="ct-btn-reset" onClick={() => setFormStatus(null)}>
                    发送新消息
                  </button>
                </div>
              ) : (
                <form className="ct-form" onSubmit={handleSubmit}>
                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label>姓名 *</label>
                      <input type="text" placeholder="您的姓名" required />
                    </div>
                    <div className="ct-field">
                      <label>公司名称</label>
                      <input type="text" placeholder="公司名称（可选）" />
                    </div>
                  </div>
                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label>邮箱 *</label>
                      <input type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="ct-field">
                      <label>电话</label>
                      <input type="tel" placeholder="联系电话（可选）" />
                    </div>
                  </div>
                  <div className="ct-field">
                    <label>服务类型</label>
                    <select defaultValue="">
                      <option value="" disabled>请选择您需要的服务</option>
                      <option value="ltl">LTL 零担运输</option>
                      <option value="ftl">FTL 整车运输</option>
                      <option value="ocean">海运服务</option>
                      <option value="air">空运服务</option>
                      <option value="fba">FBA 物流</option>
                      <option value="other">其他服务</option>
                    </select>
                  </div>
                  <div className="ct-field">
                    <label>留言内容 *</label>
                    <textarea placeholder="请描述您的需求或问题..." rows="5" required></textarea>
                  </div>
                  <button
                    type="submit"
                    className="ct-btn-submit"
                    disabled={formStatus === 'sending'}
                  >
                    {formStatus === 'sending' ? (
                      <>发送中...</>
                    ) : (
                      <>
                        发送消息
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right: Info Sidebar */}
            <div className="ct-sidebar">
              {/* Hours */}
              <div className="ct-info-card">
                <div className="ct-info-header">
                  <Clock size={18} />
                  <h3>工作时间</h3>
                </div>
                <div className="ct-hours">
                  <div className="ct-hour-row">
                    <span>周一 – 周五</span>
                    <span className="ct-hour-time">8:00 – 18:00 EST</span>
                  </div>
                  <div className="ct-hour-row">
                    <span>周六</span>
                    <span className="ct-hour-time">9:00 – 14:00 EST</span>
                  </div>
                  <div className="ct-hour-row">
                    <span>周日</span>
                    <span className="ct-hour-time ct-closed">休息</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="ct-info-card">
                <div className="ct-info-header">
                  <ArrowRight size={18} />
                  <h3>快速入口</h3>
                </div>
                <div className="ct-quick-links">
                  <a href="/get-quote-ltl" className="ct-quick-link">
                    获取 LTL 报价
                    <ArrowRight size={14} />
                  </a>
                  <a href="/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区" className="ct-quick-link">
                    物流论坛
                    <ArrowRight size={14} />
                  </a>
                  <a href="/fba-locations" className="ct-quick-link">
                    FBA 仓库查询
                    <ArrowRight size={14} />
                  </a>
                  <a href="/yellow-pages-商家黄页-物流服务商名录" className="ct-quick-link">
                    商家黄页
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Company Info */}
              <div className="ct-info-card ct-info-brand">
                <p className="ct-brand-name">WELOGX TECHNOLOGY INC</p>
                <p className="ct-brand-slogan">连接世界 · 智慧物流</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
