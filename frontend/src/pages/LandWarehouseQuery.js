import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Mail, Clock, Truck, Package, Filter } from 'lucide-react';
import './FreightBoard.css'; // 复用现有样式

const LandWarehouseQuery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  // Mock data for land warehouses in China and USA
  const warehouses = [
    // China locations
    {
      id: 1,
      name: '上海浦东陆运仓储中心',
      address: '上海市浦东新区外高桥保税区',
      city: '上海',
      state: '上海市',
      country: 'China',
      phone: '+86-21-5888-6666',
      email: 'pudong@warehouse.cn',
      services: ['整车配送', '零担运输', '仓储服务', '货物分拣'],
      operatingHours: '24/7',
      capacity: '50,000 平方米',
      rating: 4.8,
      specialties: ['跨境电商', '快消品', '汽车配件']
    },
    {
      id: 2,
      name: '深圳前海物流园区',
      address: '广东省深圳市前海深港现代服务业合作区',
      city: '深圳',
      state: '广东省',
      country: 'China',
      phone: '+86-755-8888-9999',
      email: 'qianhai@logistics.cn',
      services: ['保税仓储', '国际中转', '城市配送', '供应链管理'],
      operatingHours: '周一至周六 8:00-18:00',
      capacity: '80,000 平方米',
      rating: 4.9,
      specialties: ['电子产品', '服装纺织', '医疗器械']
    },
    {
      id: 3,
      name: '北京亦庄综合物流中心',
      address: '北京市大兴区亦庄经济技术开发区',
      city: '北京',
      state: '北京市',
      country: 'China',
      phone: '+86-10-6789-0123',
      email: 'yizhuang@logistics.cn',
      services: ['智能仓储', '多式联运', '城际运输', '末端配送'],
      operatingHours: '24/7',
      capacity: '120,000 平方米',
      rating: 4.7,
      specialties: ['高新技术产品', '精密仪器', '生鲜冷链']
    },
    {
      id: 4,
      name: '广州黄埔港陆运集散中心',
      address: '广东省广州市黄埔区港湾路',
      city: '广州',
      state: '广东省',
      country: 'China',
      phone: '+86-20-8899-7766',
      email: 'huangpu@transport.cn',
      services: ['港口集疏运', '国际货运', '仓储配送', '报关报检'],
      operatingHours: '24/7',
      capacity: '75,000 平方米',
      rating: 4.6,
      specialties: ['国际贸易', '大宗商品', '化工产品']
    },

    // USA locations
    {
      id: 5,
      name: 'Los Angeles Distribution Center',
      address: '1234 Industrial Blvd, Los Angeles, CA 90058',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      phone: '+1-213-555-0123',
      email: 'la@warehouse.com',
      services: ['Cross-docking', 'LTL/FTL', 'E-commerce fulfillment', 'Port services'],
      operatingHours: '24/7',
      capacity: '500,000 sq ft',
      rating: 4.5,
      specialties: ['Import/Export', 'Consumer goods', 'Automotive parts']
    },
    {
      id: 6,
      name: 'Chicago Logistics Hub',
      address: '5678 Transport Way, Chicago, IL 60609',
      city: 'Chicago',
      state: 'Illinois',
      country: 'USA',
      phone: '+1-312-555-0456',
      email: 'chicago@logistics.com',
      services: ['Rail intermodal', 'Truck transportation', 'Warehousing', 'Distribution'],
      operatingHours: 'Mon-Fri 6:00-22:00',
      capacity: '750,000 sq ft',
      rating: 4.7,
      specialties: ['Manufacturing', 'Food & beverage', 'Retail']
    },
    {
      id: 7,
      name: 'Atlanta Southeast Gateway',
      address: '9012 Freight Center Dr, Atlanta, GA 30354',
      city: 'Atlanta',
      state: 'Georgia',
      country: 'USA',
      phone: '+1-404-555-0789',
      email: 'atlanta@gateway.com',
      services: ['Regional distribution', 'Last-mile delivery', 'Inventory management', 'Value-added services'],
      operatingHours: '24/7',
      capacity: '600,000 sq ft',
      rating: 4.6,
      specialties: ['E-commerce', 'Healthcare', 'Technology']
    },
    {
      id: 8,
      name: 'New York Metro Logistics',
      address: '3456 Warehouse Ave, Newark, NJ 07114',
      city: 'Newark',
      state: 'New Jersey',
      country: 'USA',
      phone: '+1-201-555-0321',
      email: 'nj@metro.com',
      services: ['Urban delivery', 'Port connections', 'Express shipping', 'Temperature-controlled'],
      operatingHours: '24/7',
      capacity: '400,000 sq ft',
      rating: 4.8,
      specialties: ['Fashion', 'Electronics', 'Pharmaceuticals']
    }
  ];

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = !searchQuery || 
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || warehouse.country === selectedCountry;
    const matchesState = selectedState === 'all' || warehouse.state === selectedState;
    
    return matchesSearch && matchesCountry && matchesState;
  });

  const getUniqueStates = () => {
    const states = warehouses
      .filter(w => selectedCountry === 'all' || w.country === selectedCountry)
      .map(w => w.state);
    return [...new Set(states)];
  };

  return (
    <div className="freight-board">
      <div className="container">
        {/* Header */}
        <div className="board-header">
          <h1 className="board-title">陆仓查询</h1>
          <p className="board-description">
            查找中美两国的陆运仓储中心和物流园区，提供仓储、配送、运输等综合物流服务信息查询
          </p>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索仓储中心名称、城市或地区"
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
              <h3>找到 {filteredWarehouses.length} 个陆运仓储中心</h3>
            </div>

            {filteredWarehouses.map(warehouse => (
              <div key={warehouse.id} className="load-card">
                <div className="load-header">
                  <div className="route">
                    <div className="location origin">
                      <Truck size={16} />
                      <span>{warehouse.name}</span>
                    </div>
                  </div>
                  <div className="rating">
                    <Star size={16} fill="currentColor" />
                    <span>{warehouse.rating}</span>
                  </div>
                </div>

                <div className="load-details">
                  <div className="detail-group">
                    <MapPin size={16} />
                    <span>{warehouse.address}</span>
                  </div>
                  <div className="detail-group">
                    <Phone size={16} />
                    <span>{warehouse.phone}</span>
                  </div>
                  <div className="detail-group">
                    <Mail size={16} />
                    <span>{warehouse.email}</span>
                  </div>
                  <div className="detail-group">
                    <Clock size={16} />
                    <span>营业时间: {warehouse.operatingHours}</span>
                  </div>
                  <div className="detail-group">
                    <Package size={16} />
                    <span>仓储面积: {warehouse.capacity}</span>
                  </div>
                </div>

                <div className="warehouse-services">
                  <h5>主要服务:</h5>
                  <div className="services-tags">
                    {warehouse.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>

                <div className="warehouse-specialties">
                  <h5>专业领域:</h5>
                  <div className="specialties-tags">
                    {warehouse.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">{specialty}</span>
                    ))}
                  </div>
                </div>

                <div className="load-footer">
                  <div className="company-info">
                    <span className="company-name">{warehouse.city}, {warehouse.state}</span>
                  </div>
                  <div className="load-actions">
                    <button className="btn btn-ghost">
                      <Mail size={16} />
                      发送邮件
                    </button>
                    <button className="btn btn-primary">
                      <Phone size={16} />
                      联系咨询
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

export default LandWarehouseQuery; 