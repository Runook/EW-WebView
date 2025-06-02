import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Mail, Clock, Ship, Anchor, Filter } from 'lucide-react';
import './FreightBoard.css'; // 复用现有样式

const SeaportQuery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  // Mock data for seaports in China and USA
  const seaports = [
    // China seaports
    {
      id: 1,
      name: '上海港',
      address: '上海市浦东新区外高桥码头',
      city: '上海',
      state: '上海市',
      country: 'China',
      phone: '+86-21-5555-0001',
      email: 'info@shanghaiport.com.cn',
      services: ['集装箱运输', '散货运输', '油品运输', '滚装运输'],
      operatingHours: '24/7',
      capacity: '年吞吐量4700万TEU',
      rating: 4.9,
      specialties: ['亚欧航线', '跨太平洋航线', '内贸运输'],
      facilities: ['深水泊位', '自动化码头', '保税仓库', '铁路集疏运']
    },
    {
      id: 2,
      name: '深圳港',
      address: '广东省深圳市南山区蛇口港区',
      city: '深圳',
      state: '广东省',
      country: 'China',
      phone: '+86-755-2688-8888',
      email: 'service@szport.net',
      services: ['国际集装箱', '内贸运输', '多式联运', '物流园区'],
      operatingHours: '24/7',
      capacity: '年吞吐量2980万TEU',
      rating: 4.8,
      specialties: ['珠三角枢纽', '华南门户', '东南亚航线'],
      facilities: ['现代化码头', '智能闸口', '冷藏设施', '危品堆场']
    },
    {
      id: 3,
      name: '宁波舟山港',
      address: '浙江省宁波市北仑区梅山岛',
      city: '宁波',
      state: '浙江省',
      country: 'China',
      phone: '+86-574-8666-9999',
      email: 'contact@nbport.com.cn',
      services: ['大宗散货', '集装箱运输', '液体化工', '汽车滚装'],
      operatingHours: '24/7',
      capacity: '年吞吐量3520万TEU',
      rating: 4.7,
      specialties: ['铁矿石中转', '原油进口', '长江航线'],
      facilities: ['40万吨级码头', '铁路专线', '管道输送', '堆场仓储']
    },
    {
      id: 4,
      name: '青岛港',
      address: '山东省青岛市黄岛区前湾港区',
      city: '青岛',
      state: '山东省',
      country: 'China',
      phone: '+86-532-8899-0000',
      email: 'info@qdport.com',
      services: ['集装箱运输', '散货运输', '原油码头', 'LNG接收'],
      operatingHours: '24/7',
      capacity: '年吞吐量2400万TEU',
      rating: 4.6,
      specialties: ['东北亚航线', '欧洲航线', '中亚班列'],
      facilities: ['自动化码头', '智慧港口', '绿色港口', '多式联运']
    },

    // USA seaports
    {
      id: 5,
      name: 'Port of Los Angeles',
      address: '425 S Palos Verdes St, San Pedro, CA 90731',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      phone: '+1-310-732-3508',
      email: 'info@portla.org',
      services: ['Container shipping', 'Breakbulk cargo', 'Automotive', 'Passenger terminals'],
      operatingHours: '24/7',
      capacity: '9.3 million TEU annually',
      rating: 4.7,
      specialties: ['Trans-Pacific trade', 'Asia shipping', 'Automotive gateway'],
      facilities: ['Modern terminals', 'Rail connections', 'Truck gates', 'Warehouse facilities']
    },
    {
      id: 6,
      name: 'Port of Long Beach',
      address: '415 W Ocean Blvd, Long Beach, CA 90802',
      city: 'Long Beach',
      state: 'California',
      country: 'USA',
      phone: '+1-562-283-7000',
      email: 'info@polb.com',
      services: ['Container operations', 'Liquid bulk', 'Dry bulk', 'Breakbulk'],
      operatingHours: '24/7',
      capacity: '8.1 million TEU annually',
      rating: 4.6,
      specialties: ['Green port initiatives', 'Asian trade', 'Technology advancement'],
      facilities: ['Green technology', 'Zero emissions', 'Automated systems', 'Intermodal']
    },
    {
      id: 7,
      name: 'Port of New York and New Jersey',
      address: '4 World Trade Center, New York, NY 10007',
      city: 'New York',
      state: 'New York',
      country: 'USA',
      phone: '+1-212-435-7000',
      email: 'info@panynj.gov',
      services: ['Container shipping', 'Automobile imports', 'Bulk cargo', 'Cruise terminals'],
      operatingHours: '24/7',
      capacity: '7.8 million TEU annually',
      rating: 4.8,
      specialties: ['East Coast gateway', 'European trade', 'Consumer goods'],
      facilities: ['Deep water access', 'Rail network', 'Warehouse complexes', 'Distribution centers']
    },
    {
      id: 8,
      name: 'Port of Savannah',
      address: '1 Main St, Savannah, GA 31401',
      city: 'Savannah',
      state: 'Georgia',
      country: 'USA',
      phone: '+1-912-963-3200',
      email: 'info@gaports.com',
      services: ['Container handling', 'Breakbulk cargo', 'Heavy lift', 'Project cargo'],
      operatingHours: '24/7',
      capacity: '4.6 million TEU annually',
      rating: 4.5,
      specialties: ['Southeast gateway', 'Inland distribution', 'Agricultural exports'],
      facilities: ['Inland port', 'Rail terminal', 'Container yards', 'Specialized equipment']
    }
  ];

  const filteredSeaports = seaports.filter(port => {
    const matchesSearch = !searchQuery || 
      port.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      port.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      port.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || port.country === selectedCountry;
    const matchesState = selectedState === 'all' || port.state === selectedState;
    
    return matchesSearch && matchesCountry && matchesState;
  });

  const getUniqueStates = () => {
    const states = seaports
      .filter(p => selectedCountry === 'all' || p.country === selectedCountry)
      .map(p => p.state);
    return [...new Set(states)];
  };

  return (
    <div className="freight-board">
      <div className="container">
        {/* Header */}
        <div className="board-header">
          <h1 className="board-title">海港查询</h1>
          <p className="board-description">
            查找中美两国的主要海港信息，包括港口设施、服务能力、航线信息等详细查询
          </p>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索港口名称、城市或地区"
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
              <h3>找到 {filteredSeaports.length} 个海港</h3>
            </div>

            {filteredSeaports.map(port => (
              <div key={port.id} className="load-card">
                <div className="load-header">
                  <div className="route">
                    <div className="location origin">
                      <Ship size={16} />
                      <span>{port.name}</span>
                    </div>
                  </div>
                  <div className="rating">
                    <Star size={16} fill="currentColor" />
                    <span>{port.rating}</span>
                  </div>
                </div>

                <div className="load-details">
                  <div className="detail-group">
                    <MapPin size={16} />
                    <span>{port.address}</span>
                  </div>
                  <div className="detail-group">
                    <Phone size={16} />
                    <span>{port.phone}</span>
                  </div>
                  <div className="detail-group">
                    <Mail size={16} />
                    <span>{port.email}</span>
                  </div>
                  <div className="detail-group">
                    <Clock size={16} />
                    <span>运营时间: {port.operatingHours}</span>
                  </div>
                  <div className="detail-group">
                    <Anchor size={16} />
                    <span>吞吐能力: {port.capacity}</span>
                  </div>
                </div>

                <div className="warehouse-services">
                  <h5>主要服务:</h5>
                  <div className="services-tags">
                    {port.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>

                <div className="warehouse-specialties">
                  <h5>主要航线:</h5>
                  <div className="specialties-tags">
                    {port.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">{specialty}</span>
                    ))}
                  </div>
                </div>

                <div className="port-facilities">
                  <h5>港口设施:</h5>
                  <div className="facilities-tags">
                    {port.facilities.map((facility, index) => (
                      <span key={index} className="facility-tag">{facility}</span>
                    ))}
                  </div>
                </div>

                <div className="load-footer">
                  <div className="company-info">
                    <span className="company-name">{port.city}, {port.state}</span>
                  </div>
                  <div className="load-actions">
                    <button className="btn btn-ghost">
                      <Mail size={16} />
                      发送邮件
                    </button>
                    <button className="btn btn-primary">
                      <Phone size={16} />
                      联系港口
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

export default SeaportQuery; 