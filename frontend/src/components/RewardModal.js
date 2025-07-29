import React from 'react';
import { Mail, DollarSign, Globe, Award } from 'lucide-react';
import Modal from './common/Modal';
import './RewardModal.css';

const RewardModal = ({ isOpen, onClose }) => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent('公司命名悬赏 - Company Naming Reward');
    const body = encodeURIComponent(`
亲爱的团队，
Dear Team,

我对您们的公司命名悬赏活动非常感兴趣！
I am very interested in your company naming reward campaign!

我的建议如下：
My suggestions are as follows:

中文名称建议 / Chinese Name Suggestion:
[请填写您的中文名称建议]

英文名称建议 / English Name Suggestion:
[请填写您的英文名称建议]

域名建议 / Domain Name Suggestion:
[请填写您的域名建议]

设计理念 / Design Concept:
[请简述您的命名理念和含义]

联系方式 / Contact Information:
姓名/Name: [您的姓名]
电话/Phone: [您的联系电话]
邮箱/Email: [您的邮箱地址]

期待您的回复！
Looking forward to your reply!

此致敬礼
Best regards
    `);
    
    window.open(`mailto:ftl.us48@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="large"
      className="reward-modal"
    >
      <div className="reward-content">
        {/* 头部标题 */}
        <div className="reward-header">
          <div className="reward-icon">
            <Award size={48} className="award-icon" />
          </div>
          <h1 className="reward-title">
            <span className="title-cn">公司命名悬赏</span>
            <span className="title-en">Company Naming Reward</span>
          </h1>
        </div>

        {/* 奖金展示 */}
        <div className="reward-amount">
          <div className="amount-display">
            <DollarSign size={32} className="dollar-icon" />
            <span className="amount">500</span>
            <span className="currency">USD</span>
          </div>
          <p className="amount-text">
            <span className="text-cn">现金奖励等您来拿！</span>
            <span className="text-en">Cash reward waiting for you!</span>
          </p>
        </div>

        {/* 悬赏内容 */}
        <div className="reward-description">
          <div className="description-item">
            <Globe size={24} className="item-icon" />
            <div className="item-content">
              <h3>
                <span className="item-title-cn">我们需要您的创意</span>
                <span className="item-title-en">We Need Your Creativity</span>
              </h3>
              <p className="item-text">
                <span className="text-cn">为我们的物流平台设计一个响亮的中英文名称和域名</span>
                <span className="text-en">Design a catchy Chinese and English name plus domain for our logistics platform</span>
              </p>
            </div>
          </div>

          <div className="requirements">
            <h4>
              <span className="req-title-cn">悬赏要求 Requirements</span>
            </h4>
            <ul className="req-list">
              <li>
                <span className="req-cn">• 提供中文公司名称建议</span>
                <span className="req-en">• Provide Chinese company name suggestion</span>
              </li>
              <li>
                <span className="req-cn">• 提供英文公司名称建议</span>
                <span className="req-en">• Provide English company name suggestion</span>
              </li>
              <li>
                <span className="req-cn">• 提供相关域名建议</span>
                <span className="req-en">• Provide related domain name suggestion</span>
              </li>
              <li>
                <span className="req-cn">• 简述命名理念和寓意</span>
                <span className="req-en">• Brief explanation of naming concept and meaning</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="reward-contact">
          <button className="contact-btn" onClick={handleEmailClick}>
            <Mail size={20} />
            <span className="btn-text">
              <span className="btn-cn">立即发送邮件参与</span>
              <span className="btn-en">Send Email to Participate</span>
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
            <span className="footer-cn">我们将从所有投稿中选出最佳方案，获奖者将获得500美金现金奖励！</span>
            <span className="footer-en">We will select the best proposal from all submissions. The winner will receive $500 USD cash reward!</span>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RewardModal; 