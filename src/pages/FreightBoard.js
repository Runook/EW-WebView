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
    length: '',
    weight: ''
  });

  // Mock data for loads
  const loads = [
    {
      id: 1,
      origin: 'Los Angeles, CA',
      destination: 'New York, NY',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-20',
      rate: '$4,200',
      weight: '34,000 lbs',
      length: '48 ft',
      equipment: 'Dry Van',
      company: 'ABC Logistics',
      rating: 4.8,
      phone: '(555) 123-4567',
      miles: 2789,
      commodity: 'Electronics'
    },
    {
      id: 2,
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      pickupDate: '2024-01-16',
      deliveryDate: '2024-01-19',
      rate: '$2,850',
      weight: '28,500 lbs',
      length: '53 ft',
      equipment: 'Reefer',
      company: 'Cool Transport',
      rating: 4.9,
      phone: '(555) 987-6543',
      miles: 1365,
      commodity: 'Food Products'
    },
    {
      id: 3,
      origin: 'Houston, TX',
      destination: 'Seattle, WA',
      pickupDate: '2024-01-17',
      deliveryDate: '2024-01-22',
      rate: '$3,650',
      weight: '42,000 lbs',
      length: '48 ft',
      equipment: 'Flatbed',
      company: 'Heavy Haul Inc',
      rating: 4.7,
      phone: '(555) 456-7890',
      miles: 2348,
      commodity: 'Machinery'
    }
  ];

  // Mock data for trucks
  const trucks = [
    {
      id: 1,
      location: 'Dallas, TX',
      destination: 'Open',
      availableDate: '2024-01-16',
      equipment: 'Dry Van',
      length: '53 ft',
      company: 'Reliable Carriers',
      rating: 4.6,
      phone: '(555) 111-2222',
      preferredLanes: 'TX to CA, TX to FL'
    },
    {
      id: 2,
      location: 'Phoenix, AZ',
      destination: 'Open',
      availableDate: '2024-01-15',
      equipment: 'Reefer',
      length: '48 ft',
      company: 'Cold Chain Express',
      rating: 4.8,
      phone: '(555) 333-4444',
      preferredLanes: 'Southwest US'
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
                placeholder="城市, 省份"
                value={filters.origin}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>终点</label>
              <input
                type="text"
                placeholder="城市, 省份"
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              />
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
                      <span className="rate-amount">{load.rate || `$${load.rate}`}</span>
                      {load.miles && (
                        <span className="rate-per-mile">${(parseFloat(load.rate.replace('$', '').replace(',', '')) / load.miles).toFixed(2)}/mi</span>
                      )}
                    </div>
                  </div>

                  <div className="load-details">
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>{t('freight.pickup')}: {load.pickupDate}</span>
                    </div>
                    <div className="detail-group">
                      <Calendar size={16} />
                      <span>{t('freight.delivery')}: {load.deliveryDate}</span>
                    </div>
                    <div className="detail-group">
                      <Truck size={16} />
                      <span>{load.equipment} - {load.length}</span>
                    </div>
                    <div className="detail-group">
                      <Package size={16} />
                      <span>{load.weight} - {load.commodity || load.description}</span>
                    </div>
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
                        {t('freight.message')}
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
                      <span>{t('freight.available')}: {truck.availableDate}</span>
                    </div>
                  </div>

                  <div className="truck-details">
                    <div className="detail-group">
                      <Truck size={16} />
                      <span>{truck.equipment} - {truck.length}</span>
                    </div>
                    <div className="detail-group">
                      <span>{t('freight.preferredLanes')}: {truck.preferredLanes || `${truck.preferredOrigin} to ${truck.preferredDestination}`}</span>
                    </div>
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
                        {t('freight.message')}
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