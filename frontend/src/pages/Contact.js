import React from 'react';
import { Phone, Mail, Clock, MapPin } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: '联系电话',
      details: '7186599888',
      description: '周一至周五 8:00-18:00 EST'
    },
    {
      icon: <Mail size={24} />,
      title: '邮箱地址',
      details: 'ltl.48ew@gmail.com',
      description: '在线支持'
    },
    {
      icon: <MapPin size={24} />,
      title: '办公地址',
      details: 'Hauppauge, New York',
      description: 'United States'
    },
    {
      icon: <Clock size={24} />,
      title: '工作时间',
      details: '周一至周五: 8:00-18:00 EST',
      description: '周六: 9:00-14:00 EST'
    }
  ];

  return (
    <div className="contact">
      <div className="container">
        {/* Header */}
        <div className="contact-header">
          <h1 className="contact-title">联系我们</h1>
          <p className="contact-description">
            随时联系我们的专业团队，获取个性化的物流解决方案和报价
          </p>
        </div>

        <div className="contact-content">
          {/* Contact Info */}
          <div className="contact-info">
            <h2 className="info-title">联系方式</h2>
            <p className="info-description">
              我们随时准备为您提供专业的物流服务
            </p>

            <div className="contact-cards">
              {contactInfo.map((info, index) => (
                <div key={index} className="contact-card">
                  <div className="contact-icon">
                    {info.icon}
                  </div>
                  <div className="contact-details">
                    <h3 className="contact-card-title">{info.title}</h3>
                    <p className="contact-card-details">{info.details}</p>
                    <p className="contact-card-description">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 