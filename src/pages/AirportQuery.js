import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Mail, Clock, Plane, Zap, Filter } from 'lucide-react';
import './FreightBoard.css'; // 复用现有样式

const AirportQuery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  // Mock data for airports in China and USA
  const airports = [
    // China airports
    {
      id: 1,
      name: '北京首都国际机场',
      code: 'PEK',
      address: '北京市朝阳区首都机场路',
      city: '北京',
      state: '北京市',
      country: 'China',
      phone: '+86-10-96158',
      email: 'service@bcia.com.cn',
      services: ['国际货运', '国内货运', '快递业务', '冷链运输'],
      operatingHours: '24/7',
      capacity: '年货运量200万吨',
      rating: 4.8,
      specialties: ['亚欧航线', '北美航线', '中亚航线'],
      facilities: ['现代化货站', '冷库设施', '危品仓库', '海关监管']
    },
    {
      id: 2,
      name: '上海浦东国际机场',
      address: '上海市浦东新区机场大道',
      code: 'PVG',
      city: '上海',
      state: '上海市',
      country: 'China',
      phone: '+86-21-68346666',
      email: 'cargo@shairport.com',
      services: ['国际快递', '跨境电商', '生鲜运输', '汽车配件'],
      operatingHours: '24/7',
      capacity: '年货运量380万吨',
      rating: 4.9,
      specialties: ['亚太枢纽', '欧美航线', '电商专线'],
      facilities: ['智能货站', '自动分拣', '温控仓储', '快速通关']
    },
    {
      id: 3,
      name: '广州白云国际机场',
      code: 'CAN',
      address: '广东省广州市白云区机场路',
      city: '广州',
      state: '广东省',
      country: 'China',
      phone: '+86-20-36066999',
      email: 'cargo@gbiac.net',
      services: ['南方门户', '东南亚航线', '水果进口', '医药运输'],
      operatingHours: '24/7',
      capacity: '年货运量190万吨',
      rating: 4.7,
      specialties: ['东南亚枢纽', '南亚航线', '生鲜专线'],
      facilities: ['恒温库房', '鲜活货物', '特种货运', '联检通关']
    },
    {
      id: 4,
      name: '深圳宝安国际机场',
      code: 'SZX',
      address: '广东省深圳市宝安区福永街道',
      city: '深圳',
      state: '广东省',
      country: 'China',
      phone: '+86-755-23456789',
      email: 'freight@szairport.com',
      services: ['高新技术产品', '电子器件', '精密仪器', '时装服饰'],
      operatingHours: '24/7',
      capacity: '年货运量130万吨',
      rating: 4.6,
      specialties: ['科技产品', '制造业', '跨境电商'],
      facilities: ['无尘车间', '精密设备', '快件中心', '保税功能']
    },

    // USA airports
    {
      id: 5,
      name: 'Los Angeles International Airport',
      code: 'LAX',
      address: '1 World Way, Los Angeles, CA 90045',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      phone: '+1-310-646-5252',
      email: 'cargo@lawa.org',
      services: ['International freight', 'Express delivery', 'Perishables', 'Automotive parts'],
      operatingHours: '24/7',
      capacity: '2.2 million tons annually',
      rating: 4.5,
      specialties: ['Trans-Pacific gateway', 'Asia-Pacific trade', 'Entertainment industry'],
      facilities: ['Modern cargo terminals', 'Cold storage', 'Security screening', 'Ground handling']
    },
    {
      id: 6,
      name: 'John F. Kennedy International Airport',
      code: 'JFK',
      address: 'Jamaica, NY 11430',
      city: 'New York',
      state: 'New York',
      country: 'USA',
      phone: '+1-718-244-4444',
      email: 'cargo@panynj.gov',
      services: ['International cargo', 'Pharmaceutical shipping', 'Fashion goods', 'Fine art transport'],
      operatingHours: '24/7',
      capacity: '1.3 million tons annually',
      rating: 4.6,
      specialties: ['Transatlantic trade', 'European connections', 'Luxury goods'],
      facilities: ['TAPA certified', 'Climate controlled', 'High security', 'Quick transit']
    },
    {
      id: 7,
      name: 'Miami International Airport',
      code: 'MIA',
      address: '2100 NW 42nd Ave, Miami, FL 33126',
      city: 'Miami',
      state: 'Florida',
      country: 'USA',
      phone: '+1-305-876-7000',
      email: 'cargo@miami-airport.com',
      services: ['Latin America gateway', 'Fresh flowers', 'Seafood transport', 'Medical supplies'],
      operatingHours: '24/7',
      capacity: '2.3 million tons annually',
      rating: 4.7,
      specialties: ['Americas hub', 'Perishables', 'Pharmaceuticals'],
      facilities: ['Flower center', 'Perishable handling', 'Free trade zone', 'Fast customs']
    },
    {
      id: 8,
      name: "Chicago O'Hare International Airport",
      code: 'ORD',
      address: '10000 Bessie Coleman Dr, Chicago, IL 60666',
      city: 'Chicago',
      state: 'Illinois',
      country: 'USA',
      phone: '+1-773-686-2200',
      email: 'cargo@flychicago.com',
      services: ['Midwest hub', 'Manufacturing goods', 'Agricultural products', 'E-commerce'],
      operatingHours: '24/7',
      capacity: '1.7 million tons annually',
      rating: 4.4,
      specialties: ['Domestic distribution', 'Manufacturing', 'Agriculture'],
      facilities: ['Intermodal connections', 'Sorting facilities', 'Temperature control', 'Rail access']
    }
  ];

  const filteredAirports = airports.filter(airport => {
    const matchesSearch = !searchQuery || 
      airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || airport.country === selectedCountry;
    const matchesState = selectedState === 'all' || airport.state === selectedState;
    
    return matchesSearch && matchesCountry && matchesState;
  });

  const getUniqueStates = () => {
    const states = airports
      .filter(a => selectedCountry === 'all' || a.country === selectedCountry)
      .map(a => a.state);
    return [...new Set(states)];
  };

  return (
    <div className="freight-board">
      <div className="container">
        {/* Header */}
        <div className="board-header">
          <h1 className="board-title">机场查询</h1>
          <p className="board-description">
            查找中美两国的主要机场信息，包括货运设施、航线网络、服务能力等详细查询
          </p>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索机场名称、代码、城市或地区"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label>国家</label>
              <select 
                value={selectedCountry} 
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState('all');
                }}
              >
                <option value="all">全部</option>
                <option value="China">中国</option>
                <option value="USA">美国</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>省州</label>
              <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="all">全部</option>
                {getUniqueStates().map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary">
              <Filter size={16} />
              应用筛选
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="results">
          <div className="loads-list">
            <div className="results-header">
              <h3>找到 {filteredAirports.length} 个空港</h3>
            </div>

            {filteredAirports.map(airport => (
              <div key={airport.id} className="load-card">
                <div className="load-header">
                  <div className="route">
                    <div className="location origin">
                      <Plane size={16} />
                      <span>{airport.name} ({airport.code})</span>
                    </div>
                  </div>
                  <div className="rating">
                    <Star size={16} fill="currentColor" />
                    <span>{airport.rating}</span>
                  </div>
                </div>

                <div className="load-details">
                  <div className="detail-group">
                    <MapPin size={16} />
                    <span>{airport.address}</span>
                  </div>
                  <div className="detail-group">
                    <Phone size={16} />
                    <span>{airport.phone}</span>
                  </div>
                  <div className="detail-group">
                    <Mail size={16} />
                    <span>{airport.email}</span>
                  </div>
                  <div className="detail-group">
                    <Clock size={16} />
                    <span>运营时间: {airport.operatingHours}</span>
                  </div>
                  <div className="detail-group">
                    <Zap size={16} />
                    <span>货运能力: {airport.capacity}</span>
                  </div>
                </div>

                <div className="warehouse-services">
                  <h5>主要服务:</h5>
                  <div className="services-tags">
                    {airport.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>

                <div className="warehouse-specialties">
                  <h5>主要航线:</h5>
                  <div className="specialties-tags">
                    {airport.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">{specialty}</span>
                    ))}
                  </div>
                </div>

                <div className="port-facilities">
                  <h5>货运设施:</h5>
                  <div className="facilities-tags">
                    {airport.facilities.map((facility, index) => (
                      <span key={index} className="facility-tag">{facility}</span>
                    ))}
                  </div>
                </div>

                <div className="load-footer">
                  <div className="company-info">
                    <span className="company-name">{airport.city}, {airport.state}</span>
                  </div>
                  <div className="load-actions">
                    <button className="btn btn-ghost">
                      <Mail size={16} />
                      发送邮件
                    </button>
                    <button className="btn btn-primary">
                      <Phone size={16} />
                      联系机场
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportQuery; 