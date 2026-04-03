import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Truck, Clock } from 'lucide-react';
import './FBALocationDetail.css';
import fbaLocationsData from '../data/fba-locations.json';
import { processLocationData } from '../utils/fbaDataProcessor';
import FBAComments from '../components/FBAComments';

const FBALocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 处理数据并找到对应的位置
    const processedData = processLocationData(fbaLocationsData);
    const foundLocation = processedData.find(loc => loc.id === id);
    
    if (foundLocation) {
      setLocation(foundLocation);
    }
    setLoading(false);
  }, [id]);

  // 数据处理现在在 fbaDataProcessor.js 中处理

  if (loading) {
    return (
      <div className="fba-detail-loading">
        <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
        <div className="loading-bar"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="fba-detail-not-found">
        <div className="container">
          <h1>位置未找到</h1>
          <p>抱歉，未能找到您请求的 FBA 位置信息。</p>
          <Link to="/fba-locations" className="back-btn">
            <ArrowLeft size={20} />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fba-detail-page">
      {/* Header */}
      <section className="fba-detail-header">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            返回
          </button>
          
          <div className="location-header">
            <div className="location-badge">
              <span className={`type-badge type-${location.type?.toLowerCase()}`}>
                {location.type}
              </span>
            </div>
            <h1>{location.code} - {location.city}</h1>
            <div className="location-subtitle">
              <MapPin size={18} />
              <span>{location.state}, {location.stateCode}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="fba-detail-content">
        <div className="container">
          <div className="detail-grid">
            
            {/* Basic Information */}
            <div className="info-section">
              <h2>
                <Building size={24} />
                基本信息
              </h2>
              <div className="info-cards">
                <div className="info-card">
                  <div className="info-label">设施代码</div>
                  <div className="info-value">{location.code}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">设施类型</div>
                  <div className="info-value">{location.type}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">运营时间</div>
                  <div className="info-value">
                    <Clock size={16} />
                    {location.operatingHours}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">邮政编码</div>
                  <div className="info-value">{location.zipCode}</div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="info-section">
              <h2>
                <MapPin size={24} />
                地址信息
              </h2>
              <div className="address-card">
                <div className="address-text">
                  {location.address}
                </div>
                <div className="address-actions">
                  <button 
                    className="map-btn"
                    onClick={() => {
                      const query = encodeURIComponent(location.address);
                      window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
                    }}
                  >
                    <MapPin size={16} />
                    在地图中查看
                  </button>
                  <button 
                    className="direction-btn"
                    onClick={() => {
                      const query = encodeURIComponent(location.address);
                      window.open(`https://maps.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                    }}
                  >
                    <Truck size={16} />
                    获取路线
                  </button>
                </div>
              </div>
            </div>

            {/* 用户评论区域 */}
            <div className="info-section full-width">
              <FBAComments locationCode={location.code} />
            </div>

            {/* Additional Info */}
            <div className="info-section full-width">
              <h2>重要提醒</h2>
              <div className="alert-box">
                <h4>发货须知</h4>
                <ul>
                  <li>此位置由 Amazon 自动分配，卖家无法直接选择特定的配送中心</li>
                  <li>请按照 Seller Central 中的 Shipping Plan 指定地址发货</li>
                  <li>配送中心不接受个人直接访问，仅处理商业货件</li>
                  <li>所有入库商品必须符合 Amazon FBA 标准和要求</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Actions */}
      <section className="fba-actions">
        <div className="container">
          <div className="actions-grid">
            <Link to="/fba-locations" className="action-card">
              <div className="action-icon">📍</div>
              <div className="action-content">
                <h3>查看所有位置</h3>
                <p>浏览全部 Amazon FBA 配送中心</p>
              </div>
            </Link>
            <a 
              href="https://sellercentral.amazon.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-card"
            >
              <div className="action-icon">🚚</div>
              <div className="action-content">
                <h3>Seller Central</h3>
                <p>管理您的 FBA 库存和发货</p>
              </div>
            </a>
            <Link to="/contact" className="action-card">
              <div className="action-icon">💬</div>
              <div className="action-content">
                <h3>联系我们</h3>
                <p>需要帮助？联系我们的客服团队</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FBALocationDetail; 