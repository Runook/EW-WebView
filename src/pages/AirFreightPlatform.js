import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Plane, 
  Package, 
  DollarSign,
  Star,
  Phone,
  MessageCircle,
  ArrowRight,
  Plus,
  Clock,
  Scale,
  Shield
} from 'lucide-react';
import PostAirCargoModal from '../components/PostAirCargoModal';
import PostAirDemandModal from '../components/PostAirDemandModal';
import './PlatformPage.css';
import './FreightBoard.css'; // 复用样式
import './AirFreightPlatform.css'; // 空运专用样式

const AirFreightPlatform = () => {
  const [activeTab, setActiveTab] = useState('cargo');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostCargoModalOpen, setIsPostCargoModalOpen] = useState(false);
  const [isPostDemandModalOpen, setIsPostDemandModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    cargoType: '',
    weight: '',
    urgency: ''
  });

  // Mock data for air cargo capacity
  const airCargo = [
    {
      id: 1,
      origin: '上海浦东机场 (PVG)',
      destination: '洛杉矶国际机场 (LAX)',
      flightDate: '2024-01-15',
      flightNumber: 'CA987',
      airline: '中国国际航空',
      availableWeight: '5,000 kg',
      rate: '¥45/kg',
      cargoType: '普货',
      company: '国际航空货运',
      rating: 4.8,
      phone: '(021) 1234-5678',
      transitTime: '12小时',
      specialService: '温控货舱'
    },
    {
      id: 2,
      origin: '北京首都机场 (PEK)',
      destination: '法兰克福机场 (FRA)',
      flightDate: '2024-01-16',
      flightNumber: 'LH720',
      airline: '汉莎航空',
      availableWeight: '3,200 kg',
      rate: '¥52/kg',
      cargoType: '普货/危险品',
      company: '欧洲航空物流',
      rating: 4.9,
      phone: '(010) 9876-5432',
      transitTime: '10小时',
      specialService: '危险品认证'
    },
    {
      id: 3,
      origin: '深圳宝安机场 (SZX)',
      destination: '迪拜国际机场 (DXB)',
      flightDate: '2024-01-17',
      flightNumber: 'EK362',
      airline: '阿联酋航空',
      availableWeight: '8,500 kg',
      rate: '¥38/kg',
      cargoType: '普货/生鲜',
      company: '中东快运',
      rating: 4.7,
      phone: '(0755) 5555-8888',
      transitTime: '8小时',
      specialService: '冷链运输'
    }
  ];

  // Mock data for air cargo demands
  const airDemands = [
    {
      id: 1,
      origin: '广州白云机场 (CAN)',
      destination: '纽约肯尼迪机场 (JFK)',
      requiredDate: '2024-01-18',
      weight: '2,500 kg',
      cargoType: '电子产品',
      urgency: '紧急',
      maxRate: '¥50/kg',
      company: '科技出口公司',
      rating: 4.6,
      phone: '(020) 1111-2222',
      specialRequirements: '防静电包装',
      insurance: '需要货物保险'
    },
    {
      id: 2,
      origin: '成都双流机场 (CTU)',
      destination: '东京羽田机场 (HND)',
      requiredDate: '2024-01-19',
      weight: '1,800 kg',
      cargoType: '医疗器械',
      urgency: '特急',
      maxRate: '¥65/kg',
      company: '医疗设备有限公司',
      rating: 4.8,
      phone: '(028) 3333-4444',
      specialRequirements: '温控运输',
      insurance: '高价值货物保险'
    }
  ];

  const cargoTypes = [
    '普货',
    '危险品',
    '生鲜冷冻',
    '贵重物品',
    '大件货物',
    '医疗用品',
    '电子产品',
    '化工品'
  ];

  const urgencyLevels = [
    '普通',
    '加急',
    '紧急',
    '特急'
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePostSubmit = (postData) => {
    setUserPosts(prev => [...prev, postData]);
  };

  // Combine user posts with mock data
  const allCargo = [...airCargo, ...userPosts.filter(post => post.type === 'cargo')];
  const allDemands = [...airDemands, ...userPosts.filter(post => post.type === 'demand')];

  return (
    <div className="platform-page freight-board">
      <div className="container">
        {/* Header */}
        <div className="platform-header board-header">
          <div className="platform-icon">
            <Plane size={48} />
          </div>
          <h1 className="platform-title board-title">空运信息平台</h1>
          <p className="platform-description board-description">
            航空货运代理发布舱位信息，货主发布空运需求，实现快速高效的航空货运匹配。
            支持普货、危险品、生鲜冷冻等多种货物类型。
          </p>
        </div>

        {/* Tabs */}
        <div className="board-tabs">
          <button 
            className={`tab ${activeTab === 'cargo' ? 'active' : ''}`}
            onClick={() => setActiveTab('cargo')}
          >
            <Plane size={20} />
            可用舱位
          </button>
          <button 
            className={`tab ${activeTab === 'demands' ? 'active' : ''}`}
            onClick={() => setActiveTab('demands')}
          >
            <Package size={20} />
            货运需求
          </button>
        </div>

        {/* Post Buttons */}
        <div className="post-buttons">
          <button 
            className="btn btn-primary post-btn"
            onClick={() => setIsPostCargoModalOpen(true)}
          >
            <Plus size={20} />
            发布舱位信息
          </button>
          <button 
            className="btn btn-secondary post-btn"
            onClick={() => setIsPostDemandModalOpen(true)}
          >
            <Plus size={20} />
            发布货运需求
          </button>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起飞机场、目的机场或货物类型"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label>起飞机场</label>
              <input
                type="text"
                placeholder="机场代码或城市"
                value={filters.origin}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>目的机场</label>
              <input
                type="text"
                placeholder="机场代码或城市"
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>货物类型</label>
              <select
                value={filters.cargoType}
                onChange={(e) => handleFilterChange('cargoType', e.target.value)}
              >
                <option value="">所有类型</option>
                {cargoTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>紧急程度</label>
              <select
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
              >
                <option value="">不限</option>
                {urgencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
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
          {activeTab === 'cargo' ? (
            <div className="loads-list">
              <div className="results-header">
                <h3>{allCargo.length} 条舱位信息</h3>
                <div className="sort-options">
                  <select>
                    <option>按运费排序 (低到高)</option>
                    <option>按运费排序 (高到低)</option>
                    <option>按起飞时间排序</option>
                    <option>按可用重量排序</option>
                  </select>
                </div>
              </div>

              {allCargo.map(cargo => (
                <div key={cargo.id} className="load-card">
                  <div className="load-header">
                    <div className="route">
                      <div className="location origin">
                        <MapPin size={16} />
                        <span>{cargo.origin}</span>
                      </div>
                      <ArrowRight size={16} className="route-arrow" />
                      <div className="location destination">
                        <MapPin size={16} />
                        <span>{cargo.destination}</span>
                      </div>
                    </div>
                    <div className="rate">
                      <DollarSign size={16} />
                      <span className="rate-amount">{cargo.rate}</span>
                    </div>
                  </div>

                  <div className="load-details">
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>起飞时间: {cargo.flightDate}</span>
                    </div>
                    <div className="detail-group">
                      <Plane size={16} />
                      <span>{cargo.flightNumber} - {cargo.airline}</span>
                    </div>
                    <div className="detail-group">
                      <Scale size={16} />
                      <span>可载重: {cargo.availableWeight}</span>
                    </div>
                    <div className="detail-group">
                      <Package size={16} />
                      <span>{cargo.cargoType}</span>
                    </div>
                    <div className="detail-group">
                      <Clock size={16} />
                      <span>航程: {cargo.transitTime}</span>
                    </div>
                    {cargo.specialService && (
                      <div className="detail-group">
                        <Star size={16} />
                        <span>特殊服务: {cargo.specialService}</span>
                      </div>
                    )}
                  </div>

                  <div className="load-footer">
                    <div className="company-info">
                      <span className="company-name">{cargo.company}</span>
                      <div className="rating">
                        <Star size={14} />
                        <span>{cargo.rating}</span>
                      </div>
                    </div>
                    <div className="load-actions">
                      <button className="btn btn-ghost">
                        <MessageCircle size={16} />
                        询价
                      </button>
                      <button className="btn btn-primary">
                        <Phone size={16} />
                        {cargo.phone}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="trucks-list">
              <div className="results-header">
                <h3>{allDemands.length} 条货运需求</h3>
                <div className="sort-options">
                  <select>
                    <option>按预算排序 (高到低)</option>
                    <option>按预算排序 (低到高)</option>
                    <option>按紧急程度排序</option>
                    <option>按货物重量排序</option>
                  </select>
                </div>
              </div>

              {allDemands.map(demand => (
                <div key={demand.id} className="truck-card">
                  <div className="truck-header">
                    <div className="route">
                      <div className="location origin">
                        <MapPin size={16} />
                        <span>{demand.origin}</span>
                      </div>
                      <ArrowRight size={16} className="route-arrow" />
                      <div className="location destination">
                        <MapPin size={16} />
                        <span>{demand.destination}</span>
                      </div>
                    </div>
                    <div className="urgency-badge">
                      <span className={`urgency ${demand.urgency}`}>{demand.urgency}</span>
                    </div>
                  </div>

                  <div className="truck-details">
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>要求日期: {demand.requiredDate}</span>
                    </div>
                    <div className="detail-group">
                      <Scale size={16} />
                      <span>货物重量: {demand.weight}</span>
                    </div>
                    <div className="detail-group">
                      <Package size={16} />
                      <span>货物类型: {demand.cargoType}</span>
                    </div>
                    <div className="detail-group">
                      <DollarSign size={16} />
                      <span>最高预算: {demand.maxRate}</span>
                    </div>
                    {demand.specialRequirements && (
                      <div className="detail-group">
                        <Star size={16} />
                        <span>特殊要求: {demand.specialRequirements}</span>
                      </div>
                    )}
                    {demand.insurance && (
                      <div className="detail-group">
                        <Shield size={16} />
                        <span>保险: {demand.insurance}</span>
                      </div>
                    )}
                  </div>

                  <div className="truck-footer">
                    <div className="company-info">
                      <span className="company-name">{demand.company}</span>
                      <div className="rating">
                        <Star size={14} />
                        <span>{demand.rating}</span>
                      </div>
                    </div>
                    <div className="truck-actions">
                      <button className="btn btn-ghost">
                        <MessageCircle size={16} />
                        报价
                      </button>
                      <button className="btn btn-primary">
                        <Phone size={16} />
                        {demand.phone}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PostAirCargoModal 
        isOpen={isPostCargoModalOpen}
        onClose={() => setIsPostCargoModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
      
      <PostAirDemandModal 
        isOpen={isPostDemandModalOpen}
        onClose={() => setIsPostDemandModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
};

export default AirFreightPlatform; 