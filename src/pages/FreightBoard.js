import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Truck, 
  Package, 
  DollarSign,
  Star,
  Phone,
  MessageCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PostLoadModal from '../components/PostLoadModal';
import PostTruckModal from '../components/PostTruckModal';
import './FreightBoard.css';

const FreightBoard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('loads');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostLoadModalOpen, setIsPostLoadModalOpen] = useState(false);
  const [isPostTruckModalOpen, setIsPostTruckModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    equipment: '',
    loadType: '',
    serviceType: '',
    capacity: '',
    volume: ''
  });

  // Mock data for loads (专注FTL和LTL)
  const loads = [
    {
      id: 1,
      origin: '上海',
      destination: '北京',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-17',
      rate: '8,500',
      weight: '22吨',
      volume: '35立方米',
      loadType: 'FTL',
      equipment: '厢式货车',
      length: '17.5米',
      company: '上海运输集团',
      rating: 4.8,
      phone: '(021) 1234-5678',
      distance: '1463公里',
      commodity: '电子设备',
      pallets: '20托盘',
      requirements: '恒温运输'
    },
    {
      id: 2,
      origin: '广州',
      destination: '深圳',
      pickupDate: '2024-01-16',
      deliveryDate: '2024-01-16',
      rate: '1,200',
      weight: '3.5吨',
      volume: '8立方米',
      loadType: 'LTL',
      equipment: '冷藏车',
      length: '9.6米',
      company: '粤港运输',
      rating: 4.9,
      phone: '(020) 987-6543',
      distance: '140公里',
      commodity: '生鲜食品',
      pallets: '4托盘',
      requirements: '冷链运输 2-8°C'
    },
    {
      id: 3,
      origin: '成都',
      destination: '重庆',
      pickupDate: '2024-01-17',
      deliveryDate: '2024-01-18',
      rate: '3,800',
      weight: '15吨',
      volume: '25立方米',
      loadType: 'FTL',
      equipment: '平板车',
      length: '13米',
      company: '川渝物流',
      rating: 4.7,
      phone: '(028) 456-7890',
      distance: '300公里',
      commodity: '机械设备',
      pallets: '不适用',
      requirements: '专业装卸'
    },
    {
      id: 4,
      origin: '天津',
      destination: '青岛',
      pickupDate: '2024-01-18',
      deliveryDate: '2024-01-19',
      rate: '2,600',
      weight: '8吨',
      volume: '12立方米',
      loadType: 'LTL',
      equipment: '厢式货车',
      length: '9.6米',
      company: '环渤海运输',
      rating: 4.6,
      phone: '(022) 333-4444',
      distance: '320公里',
      commodity: '日用百货',
      pallets: '8托盘',
      requirements: '干货运输'
    }
  ];

  // Mock data for trucks (专注FTL和LTL服务)
  const trucks = [
    {
      id: 1,
      location: '武汉',
      destination: '开放',
      availableDate: '2024-01-16',
      equipment: '厢式货车',
      length: '17.5米',
      capacity: '30吨',
      volume: '45立方米',
      serviceType: 'FTL',
      company: '中部运输',
      rating: 4.6,
      phone: '(027) 111-2222',
      preferredLanes: '华中至华东、华南',
      rateRange: '¥6-12/公里',
      specialServices: '恒温运输、GPS跟踪'
    },
    {
      id: 2,
      location: '西安',
      destination: '开放',
      availableDate: '2024-01-15',
      equipment: '冷藏车',
      length: '13米',
      capacity: '18吨',
      volume: '35立方米',
      serviceType: 'FTL/LTL',
      company: '西北冷链',
      rating: 4.8,
      phone: '(029) 333-4444',
      preferredLanes: '西北至全国',
      rateRange: '¥8-15/公里',
      specialServices: '冷链运输 -18°C至+25°C'
    },
    {
      id: 3,
      location: '郑州',
      destination: '开放',
      availableDate: '2024-01-17',
      equipment: '高栏车',
      length: '9.6米',
      capacity: '12吨',
      volume: '20立方米',
      serviceType: 'LTL',
      company: '中原快运',
      rating: 4.5,
      phone: '(0371) 555-6666',
      preferredLanes: '河南省内及周边',
      rateRange: '¥3-8/公里',
      specialServices: '零担拼车、当日达'
    }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePostSubmit = (postData) => {
    setUserPosts(prev => [...prev, postData]);
  };

  // Combine user posts with mock data
  const allLoads = [...loads, ...userPosts.filter(post => post.type === 'load')];
  const allTrucks = [...trucks, ...userPosts.filter(post => post.type === 'truck')];

  return (
    <div className="freight-board">
      <div className="container">
        {/* Header */}
        <div className="board-header">
          <h1 className="board-title">陆运信息平台</h1>
          <p className="board-description">
            货主发布货源信息，承运商发布车源信息，通过智能匹配系统实现高效对接。
            免费发布，实时更新，让陆运生意更简单。
          </p>
        </div>

        {/* Tabs */}
        <div className="board-tabs">
          <button 
            className={`tab ${activeTab === 'loads' ? 'active' : ''}`}
            onClick={() => setActiveTab('loads')}
          >
            <Package size={20} />
            可用货源
          </button>
          <button 
            className={`tab ${activeTab === 'trucks' ? 'active' : ''}`}
            onClick={() => setActiveTab('trucks')}
          >
            <Truck size={20} />
            可用车源
          </button>
        </div>

        {/* Post Buttons */}
        <div className="post-buttons">
          <button 
            className="btn btn-primary post-btn"
            onClick={() => setIsPostLoadModalOpen(true)}
          >
            <Plus size={20} />
            发布货源
          </button>
          <button 
            className="btn btn-ghost post-btn"
            onClick={() => setIsPostTruckModalOpen(true)}
          >
            <Plus size={20} />
            发布车源
          </button>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起点、终点或货物类型"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label>起点</label>
              <input
                type="text"
                placeholder="城市或省份"
                value={filters.origin}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>终点</label>
              <input
                type="text"
                placeholder="城市或省份"
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>运输类型</label>
              <select
                value={filters.loadType || filters.serviceType}
                onChange={(e) => {
                  if (activeTab === 'loads') {
                    handleFilterChange('loadType', e.target.value);
                  } else {
                    handleFilterChange('serviceType', e.target.value);
                  }
                }}
              >
                <option value="">所有类型</option>
                <option value="FTL">FTL (整车运输)</option>
                <option value="LTL">LTL (零担运输)</option>
                <option value="FTL/LTL">FTL/LTL (都可以)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>车型</label>
              <select
                value={filters.equipment}
                onChange={(e) => handleFilterChange('equipment', e.target.value)}
              >
                <option value="">所有车型</option>
                <option value="厢式货车">厢式货车</option>
                <option value="冷藏车">冷藏车</option>
                <option value="平板车">平板车</option>
                <option value="高栏车">高栏车</option>
                <option value="低板车">低板车</option>
                <option value="油罐车">油罐车</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{activeTab === 'loads' ? '载重' : '载重能力'}</label>
              <select
                value={filters.capacity}
                onChange={(e) => handleFilterChange('capacity', e.target.value)}
              >
                <option value="">不限</option>
                <option value="5吨以下">5吨以下</option>
                <option value="5-10吨">5-10吨</option>
                <option value="10-20吨">10-20吨</option>
                <option value="20吨以上">20吨以上</option>
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
          {activeTab === 'loads' ? (
            <div className="loads-list">
              <div className="results-header">
                <h3>{allLoads.length} 条货源信息</h3>
                <div className="sort-options">
                  <select>
                    <option>按运费排序 (高到低)</option>
                    <option>按运费排序 (低到高)</option>
                    <option>按发货日期排序</option>
                    <option>按里程排序</option>
                  </select>
                </div>
              </div>

              {allLoads.map(load => (
                <div key={load.id} className="load-card">
                  <div className="load-header">
                    <div className="route">
                      <div className="location origin">
                        <MapPin size={16} />
                        <span>{load.origin}</span>
                      </div>
                      <ArrowRight size={16} className="route-arrow" />
                      <div className="location destination">
                        <MapPin size={16} />
                        <span>{load.destination}</span>
                      </div>
                    </div>
                    <div className="rate">
                      <DollarSign size={16} />
                      <span className="rate-amount">{load.rate}</span>
                      <span className="load-type-badge">{load.loadType}</span>
                    </div>
                  </div>

                  <div className="load-details">
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>提货: {load.pickupDate}</span>
                    </div>
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>送达: {load.deliveryDate}</span>
                    </div>
                    <div className="detail-group">
                      <Truck size={16} />
                      <span>{load.equipment} ({load.length})</span>
                    </div>
                    <div className="detail-group">
                      <Package size={16} />
                      <span>{load.weight} / {load.volume} - {load.commodity}</span>
                    </div>
                    <div className="detail-group">
                      <span>📦 {load.pallets} | 🛣️ {load.distance}</span>
                    </div>
                    {load.requirements && (
                      <div className="detail-group">
                        <Star size={16} />
                        <span>要求: {load.requirements}</span>
                      </div>
                    )}
                  </div>

                  <div className="load-footer">
                    <div className="company-info">
                      <span className="company-name">{load.company || load.companyName}</span>
                      <div className="rating">
                        <Star size={14} />
                        <span>{load.rating || 'New'}</span>
                      </div>
                    </div>
                    <div className="load-actions">
                      <button className="btn btn-ghost">
                        <MessageCircle size={16} />
                        询价
                      </button>
                      <button className="btn btn-primary">
                        <Phone size={16} />
                        {load.phone || load.contactPhone}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="trucks-list">
              <div className="results-header">
                <h3>{allTrucks.length} {t('freight.trucksAvailable')}</h3>
              </div>

              {allTrucks.map(truck => (
                <div key={truck.id} className="truck-card">
                  <div className="truck-header">
                    <div className="location">
                      <MapPin size={16} />
                      <span>{truck.location || truck.currentLocation}</span>
                    </div>
                    <div className="availability">
                      <Calendar size={16} />
                      <span>可用: {truck.availableDate}</span>
                    </div>
                    <div className="service-type-badge">
                      <span className="service-type">{truck.serviceType}</span>
                    </div>
                  </div>

                  <div className="truck-details">
                    <div className="detail-group">
                      <Truck size={16} />
                      <span>{truck.equipment} ({truck.length})</span>
                    </div>
                    <div className="detail-group">
                      <Package size={16} />
                      <span>载重: {truck.capacity} | 体积: {truck.volume}</span>
                    </div>
                    <div className="detail-group">
                      <DollarSign size={16} />
                      <span>运费: {truck.rateRange}</span>
                    </div>
                    <div className="detail-group">
                      <span>🛣️ {truck.preferredLanes || `${truck.preferredOrigin} 至 ${truck.preferredDestination}`}</span>
                    </div>
                    {truck.specialServices && (
                      <div className="detail-group">
                        <Star size={16} />
                        <span>服务: {truck.specialServices}</span>
                      </div>
                    )}
                  </div>

                  <div className="truck-footer">
                    <div className="company-info">
                      <span className="company-name">{truck.company || truck.companyName}</span>
                      <div className="rating">
                        <Star size={14} />
                        <span>{truck.rating || 'New'}</span>
                      </div>
                    </div>
                    <div className="truck-actions">
                      <button className="btn btn-ghost">
                        <MessageCircle size={16} />
                        询价
                      </button>
                      <button className="btn btn-primary">
                        <Phone size={16} />
                        {truck.phone || truck.contactPhone}
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
      <PostLoadModal 
        isOpen={isPostLoadModalOpen}
        onClose={() => setIsPostLoadModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
      
      <PostTruckModal 
        isOpen={isPostTruckModalOpen}
        onClose={() => setIsPostTruckModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
};

export default FreightBoard; 
