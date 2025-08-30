import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FBALocations.css';
import fbaLocationsData from '../data/fba-locations.json';
import { processLocationData } from '../utils/fbaDataProcessor';
import { useAuth } from '../contexts/AuthContext';
import FBAExchangeModal from '../components/FBAExchangeModal';

const FBALocations = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // 处理和清理数据
    const processedData = processLocationData(fbaLocationsData);
    console.log('处理后的FBA数据:', processedData.length, '个位置');
    setLocations(processedData);
    setFilteredLocations(processedData);
  }, []);

  // 检测屏幕大小变化
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile(); // 初始检查
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    // 过滤数据
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter(location => 
        location.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedState) {
      filtered = filtered.filter(location => location.state === selectedState);
    }

    if (selectedType) {
      filtered = filtered.filter(location => location.type === selectedType);
    }

    setFilteredLocations(filtered);
  }, [searchTerm, selectedState, selectedType, locations]);

  // 数据处理现在在 fbaDataProcessor.js 中处理

  // 获取唯一的州名
  const uniqueStates = [...new Set(locations.map(loc => loc.state))].sort();
  
  // 获取唯一的类型
  const uniqueTypes = [...new Set(locations.map(loc => loc.type))].filter(Boolean).sort();

  // 处理发布货源
  const handlePublishCargo = (location) => {
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }
    
    // 准备FBA位置数据传递给发布货源页面
    const fbaData = {
      code: location.code,
      address: location.address,
      city: location.city,
      state: location.state,
      isFBA: true
    };
    
    // 导航到发布货源页面，并传递FBA数据
    navigate('/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区', { 
      state: { 
        openPostModal: true, 
        fbaDestination: fbaData 
      } 
    });
  };

  // 处理评论功能 - 导航到详情页面
  const handleComment = (location) => {
    // 导航到FBA位置详情页面，那里有完整的评论功能
    navigate(`/fba-location/${location.id}`);
  };

  // 处理预约交换功能
  const handleExchange = (location) => {
    setSelectedLocation(location);
    setExchangeModalOpen(true);
  };

  // 渲染移动端卡片
  const renderMobileCards = () => {
    return (
      <div className="mobile-location-cards">
        {filteredLocations.map((location) => (
          <div key={location.id} className="mobile-location-card">
            <div className="mobile-card-header">
              <div className="mobile-card-badges">
                <div className="mobile-card-code badge-item">{location.code}</div>
                <span className={`type-badge type-${location.type?.toLowerCase()} badge-item`}>
                  {location.type}
                </span>
                <div className="mobile-card-state badge-item">{location.state}</div>
              </div>
            </div>
            <div className="mobile-card-address">
              {location.address}
            </div>
            <div className="mobile-card-actions">
              <button 
                onClick={() => handlePublishCargo(location)}
                className="action-btn publish-btn"
              >
                发布货源
              </button>
              <button 
                onClick={() => handleExchange(location)}
                className="action-btn exchange-btn"
              >
                预约交换
              </button>
              <button 
                onClick={() => handleComment(location)}
                className="action-btn comment-btn"
              >
                评论
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fba-locations-page">
      {/* Hero Section */}
      <section className="fba-hero">
        <div className="container">
          <h1>Amazon FBA 仓库位置查询</h1>
          <p>查找全美 Amazon FBA 配送中心和仓库位置信息，支持按州、城市、代码搜索</p>
          
          {/* Search and Filters */}
          <div className="search-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="搜索州名、城市、代码或地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filters">
              <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
                className="filter-select"
              >
                <option value="">所有州</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="">所有类型</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>



      {/* Locations Table */}
      <section className="fba-locations-list">
        <div className="container">
          
          {filteredLocations.length === 0 ? (
            <div className="no-results">
              <p>未找到匹配的位置，请调整搜索条件。</p>
            </div>
          ) : isMobile ? (
            renderMobileCards()
          ) : (
            <div className="locations-table-wrapper">
              <table className="locations-table">
                <thead>
                  <tr>
                    <th>州</th>
                    <th>代码</th>
                    <th>类型</th>
                    <th>地址</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((location) => (
                    <tr key={location.id}>
                      <td>{location.state}</td>
                      <td>
                        <span className="location-code">{location.code}</span>
                      </td>
                      <td>
                        <span className={`type-badge type-${location.type?.toLowerCase()}`}>
                          {location.type}
                        </span>
                      </td>
                      <td className="address-cell">
                        {location.address}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handlePublishCargo(location)}
                            className="action-btn publish-btn"
                          >
                            发布货源
                          </button>
                          <button 
                            onClick={() => handleExchange(location)}
                            className="action-btn exchange-btn"
                          >
                            预约交换
                          </button>
                          <button 
                            onClick={() => handleComment(location)}
                            className="action-btn comment-btn"
                          >
                            评论
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="fba-info">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <h3>什么是 Amazon FBA？</h3>
              <p>Amazon FBA (Fulfillment by Amazon) 是亚马逊提供的一项服务，卖家将商品存储在亚马逊的配送中心，由亚马逊处理订单配送、客户服务和退货。</p>
            </div>
            <div className="info-card">
              <h3>FBA 配送中心类型</h3>
              <ul>
                <li><strong>FC (Fulfillment Center)</strong> - 主要配送中心</li>
                <li><strong>DC (Distribution Center)</strong> - 分发中心</li>
                <li><strong>SC (Sortation Center)</strong> - 分拣中心</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>如何选择 FBA 仓库？</h3>
              <p>Amazon 会根据您的产品类型、尺寸、客户需求分布等因素自动为您分配最合适的仓库。您可以在卖家中心查看具体的配送计划。</p>
            </div>
          </div>
        </div>
      </section>

      {/* FBA Exchange Modal */}
      <FBAExchangeModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        location={selectedLocation}
        onSuccess={() => {
          // 可以在这里添加成功后的处理，比如刷新数据
          console.log('预约交换信息发布成功');
        }}
      />
    </div>
  );
};

export default FBALocations; 