import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('感谢您的留言！我们会尽快回复您。');
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: '联系电话',
      details: '+1 (718) 386-7888',
      description: '周一至周五 8:00-18:00 EST'
    },
    {
      icon: <Mail size={24} />,
      title: '邮箱地址',
      details: 'info@ewlogistics.com',
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

  const services = [
    '海运货运',
    '陆运货运 (FTL/LTL)',
    'FBA配送',
    '仓储服务',
    '空运货运',
    '最后一公里配送',
    '其他服务'
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

            <div className="quick-actions">
              <button className="btn btn-primary">
                <MessageCircle size={20} />
                开始聊天
              </button>
              <button className="btn btn-secondary">
                <Phone size={20} />
                立即致电
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h2 className="form-title">发送消息</h2>
            <p className="form-description">
              请填写以下表单，我们会尽快回复您的咨询
            </p>

            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">姓名 *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">邮箱地址 *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company">公司名称</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">联系电话</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="service">感兴趣的服务</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                >
                  <option value="">请选择服务类型</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">留言内容 *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="请详细描述您的需求..."
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-submit">
                <Send size={20} />
                发送消息
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <h2 className="map-title">我们的位置</h2>
          <div className="map-container">
            <div className="map-placeholder">
              <MapPin size={48} />
              <p>地图功能正在开发中</p>
              <p>地址：Hauppauge, New York, USA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 