import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FBALocations.css';
import fbaLocationsData from '../data/fba-locations.json';
import { processLocationData } from '../utils/fbaDataProcessor';

const FBALocations = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    // 处理和清理数据
    const processedData = processLocationData(fbaLocationsData);
    console.log('处理后的FBA数据:', processedData.length, '个位置');
    setLocations(processedData);
    setFilteredLocations(processedData);
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

      {/* Statistics */}
      <section className="fba-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{filteredLocations.length}</div>
              <div className="stat-label">找到的位置</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{uniqueStates.length}</div>
              <div className="stat-label">覆盖州数</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{uniqueTypes.length}</div>
              <div className="stat-label">设施类型</div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Table */}
      <section className="fba-locations-list">
        <div className="container">
          <h2>FBA 仓库位置列表</h2>
          
          {filteredLocations.length === 0 ? (
            <div className="no-results">
              <p>未找到匹配的位置，请调整搜索条件。</p>
            </div>
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
                        <Link 
                          to={`/fba-location/${location.id}`}
                          className="view-details-btn"
                        >
                          查看详情
                        </Link>
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
    </div>
  );
};

export default FBALocations; 