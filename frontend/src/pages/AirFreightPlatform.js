import React from 'react';
import { 
  Plane, 
  CloudLightning,
  Scale,
  Users,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Calendar
} from 'lucide-react';
import './PlatformPage.css';
import './FreightBoard.css';

const AirFreightPlatform = () => {
  return (
    <div className="platform-page freight-board">
      <div className="container">
        {/* Header */}
        <div className="platform-header">
          <div className="platform-icon">
            <Plane size={48} />
          </div>
          <h1 className="platform-title">空运服务平台</h1>
          <p className="platform-description">
            专业的国际空运物流服务平台正在紧锣密鼓地开发中，将为您提供快速高效的国际航空货运服务，覆盖全球主要航线。
          </p>
        </div>

        {/* 开发状态卡片 */}
        <div className="coming-soon">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <Clock size={32} style={{ color: '#34C759' }} />
            <h3 style={{ margin: 0, fontSize: '1.8rem' }}>正在开发中，尽情等待</h3>
          </div>
          
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            我们的开发团队正在全力打造功能完善的空运服务平台，敬请期待！
          </p>

          {/* 服务特性网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            <div style={{
              background: '#f5f5f7',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <Plane size={32} style={{ color: '#34C759', marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d1d1f' }}>国际空运</h4>
              <p style={{ margin: 0, color: '#6e6e73', fontSize: '0.9rem' }}>全球航线网络，快速安全运输</p>
            </div>
            
            <div style={{
              background: '#f5f5f7',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <CloudLightning size={32} style={{ color: '#34C759', marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d1d1f' }}>快速清关</h4>
              <p style={{ margin: 0, color: '#6e6e73', fontSize: '0.9rem' }}>专业清关团队，高效通关服务</p>
            </div>
            
            <div style={{
              background: '#f5f5f7',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <Scale size={32} style={{ color: '#34C759', marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d1d1f' }}>多种服务</h4>
              <p style={{ margin: 0, color: '#6e6e73', fontSize: '0.9rem' }}>普货、危险品、生鲜等专业服务</p>
            </div>
          </div>

          {/* 进度信息 */}
          <div style={{
            background: '#e8f5e8',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Calendar size={20} style={{ color: '#34C759' }} />
              <span style={{ fontWeight: '600', color: '#1d1d1f' }}>开发进度</span>
            </div>
            
            <div style={{
              background: '#ddd',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #34C759, #30D158)',
                height: '100%',
                width: '45%',
                borderRadius: '4px'
              }}></div>
            </div>
            
            <p style={{ 
              margin: 0, 
              textAlign: 'center', 
              color: '#6e6e73',
              fontSize: '0.9rem'
            }}>
              45% 完成 · 预计 2025年第三季度上线
            </p>
          </div>

          {/* 合作邀请区域 */}
          <div style={{
            background: '#f0f9ff',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid #e0f2fe'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <Users size={24} style={{ color: '#0ea5e9' }} />
              <h3 style={{ margin: 0, color: '#1d1d1f' }}>寻求合作</h3>
            </div>
            
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#6e6e73',
              textAlign: 'center',
              fontSize: '1rem'
            }}>
              如果您是空运物流行业的专业人士，或有相关合作意向，欢迎与我们联系
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a 
                href="mailto:ftl.us48@gmail.com" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: '#34C759',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.closest('a').style.background = '#2ecc71'}
                onMouseOut={(e) => e.target.closest('a').style.background = '#34C759'}
              >
                <Mail size={16} />
                邮件联系
              </a>
              
              <a 
                href="tel:+1-555-0123" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'white',
                  color: '#34C759',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  border: '2px solid #34C759',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.closest('a').style.background = '#34C759';
                  e.target.closest('a').style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.closest('a').style.background = 'white';
                  e.target.closest('a').style.color = '#34C759';
                }}
              >
                <Phone size={16} />
                电话咨询
              </a>
              
              <a 
                href="#" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'white',
                  color: '#0ea5e9',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  border: '2px solid #0ea5e9',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.closest('a').style.background = '#0ea5e9';
                  e.target.closest('a').style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.closest('a').style.background = 'white';
                  e.target.closest('a').style.color = '#0ea5e9';
                }}
              >
                <MessageCircle size={16} />
                在线咨询
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirFreightPlatform; 