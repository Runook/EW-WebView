import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Contact.css';

const Contact = () => {
  const { t } = useLanguage();
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
    // 这里可以添加表单提交逻辑
    // console.log('Form submitted:', formData);
    alert('感谢您的留言！我们会尽快回复您。');
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: t('contact.phone'),
      details: '+1 (718) 386-7888',
      description: 'Mon-Fri from 8am to 6pm EST'
    },
    {
      icon: <Mail size={24} />,
      title: t('contact.email'),
      details: 'info@ewlogistics.com',
      description: 'Online support'
    },
    {
      icon: <MapPin size={24} />,
      title: t('contact.office'),
      details: 'Hauppauge, New York',
      description: 'United States'
    },
    {
      icon: <Clock size={24} />,
      title: t('contact.workingHours'),
      details: 'Mon-Fri: 8am-6pm EST',
      description: 'Saturday: 9am-2pm EST'
    }
  ];

  const services = [
    t('home.services.oceanFreight'),
    t('home.services.truckLoads') + ' (FTL/LTL)',
    t('home.services.fbaShipping'),
    t('home.services.warehousing'),
    t('services.airFreight.title'),
    t('services.lastMile.title'),
    t('contact.other')
  ];

  return (
    <div className="contact">
      <div className="container">
        {/* Header */}
        <div className="contact-header">
          <h1 className="contact-title">{t('contact.title')}</h1>
          <p className="contact-description">
            {t('contact.description')}
          </p>
        </div>

        <div className="contact-content">
          {/* Contact Info */}
          <div className="contact-info">
            <h2 className="info-title">{t('contact.getInTouch')}</h2>
            <p className="info-description">
              {t('contact.ready')}
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
                {t('contact.startChat')}
              </button>
              <button className="btn btn-secondary">
                <Phone size={20} />
                {t('header.callNow')}
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h2 className="form-title">{t('contact.sendMessage')}</h2>
            <p className="form-description">
              {t('contact.formDescription')}
            </p>

            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t('contact.fullName')} *</label>
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
                  <label htmlFor="email">{t('contact.emailAddress')} *</label>
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
                  <label htmlFor="company">{t('contact.companyName')}</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">{t('contact.phoneNumber')}</label>
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
                <label htmlFor="service">{t('contact.serviceInterest')}</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                >
                  <option value="">{t('contact.selectService')}</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">{t('contact.message')} *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={t('contact.messagePlaceholder')}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary form-submit">
                <Send size={20} />
                {t('contact.sendBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 