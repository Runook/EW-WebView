import React, { useState, useEffect } from 'react';
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
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  Scale,
  CheckCircle,
  X,
  Hash,
  Layers,
  Shield,
  Home,
  Building
} from 'lucide-react';
// import { useLanguage } from '../contexts/LanguageContext';
import PostLoadModal from '../components/PostLoadModal';
import PostTruckModal from '../components/PostTruckModal';
import './PlatformPage.css';
import './FreightBoard.css';

const FreightBoard = () => {
  // const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('loads');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostLoadModalOpen, setIsPostLoadModalOpen] = useState(false);
  const [isPostTruckModalOpen, setIsPostTruckModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loads, setLoads] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 分离筛选条件和应用的筛选条件
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    equipment: '',
    loadType: '',
    serviceType: '',
    capacity: '',
    volume: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    origin: '',
    destination: '',
    equipment: '',
    loadType: '',
    serviceType: '',
    capacity: '',
    volume: ''
  });
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // API调用函数
  const fetchLoads = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/landfreight/loads`);
      if (!response.ok) {
        throw new Error('获取货源信息失败');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('获取货源信息失败:', error);
      return [
        {
          id: 1,
          origin: '洛杉矶, CA',
          destination: '芝加哥, IL',
          pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          rate: '$2,800',
          weight: '22,000 lbs',
          volume: '35 cu ft',
          loadType: 'FTL',
          serviceType: 'FTL',
          equipment: 'Dry Van',
          length: '48 ft',
          company: 'Pacific Freight Co.',
          rating: 4.8,
          phone: '(213) 555-0123',
          distance: '2,015 miles',
          commodity: '电子设备 (Electronics)',
          pallets: '20 pallets',
          requirements: '恒温运输',
          // FTL专用信息
          trailerLength: '53 ft',
          maxWeight: '80,000 lbs',
          specialServices: 'Team Driver Available'
        },
        {
          id: 2,
          origin: '达拉斯, TX',
          destination: '迈阿密, FL',
          pickupDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          rate: '$850',
          weight: '3,500 lbs',
          volume: '185 cu ft',
          loadType: 'LTL',
          serviceType: 'LTL',
          equipment: 'Refrigerated',
          length: '8 ft',
          width: '4 ft',
          height: '6 ft',
          company: 'Southern Express',
          rating: 4.9,
          phone: '(214) 555-0456',
          distance: '1,290 miles',
          commodity: '生鲜食品 (Perishables)',
          pallets: '4 pallets',
          requirements: '冷链运输 35-40°F',
          // LTL专用信息
          freightClass: '125',
          density: '18.9 lbs/cu ft',
          stackable: true,
          hazmat: false,
          originType: 'Commercial',
          destinationType: 'Residential',
          liftgateRequired: true
        },
        {
          id: 3,
          origin: '西雅图, WA',
          destination: '丹佛, CO',
          pickupDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          rate: '$3,200',
          weight: '45,000 lbs',
          volume: '52 cu ft',
          loadType: 'FTL',
          serviceType: 'FTL',
          equipment: 'Flatbed',
          length: '48 ft',
          company: 'Mountain Logistics',
          rating: 4.7,
          phone: '(206) 555-0789',
          distance: '1,320 miles',
          commodity: '机械设备 (Machinery)',
          pallets: 'N/A',
          requirements: '专业装卸, 保险$50万',
          // FTL专用信息
          trailerLength: '48 ft',
          maxWeight: '80,000 lbs',
          specialServices: 'Tarping Required, Crane Service'
        },
        {
          id: 4,
          origin: '亚特兰大, GA',
          destination: '费城, PA',
          pickupDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          rate: '$420',
          weight: '1,800 lbs',
          volume: '96 cu ft',
          loadType: 'LTL',
          serviceType: 'LTL',
          equipment: 'Dry Van',
          length: '6 ft',
          width: '4 ft',
          height: '4 ft',
          company: 'East Coast Transport',
          rating: 4.6,
          phone: '(404) 555-0321',
          distance: '780 miles',
          commodity: '纺织品 (Textiles)',
          pallets: '3 pallets',
          requirements: '防潮包装',
          // LTL专用信息
          freightClass: '110',
          density: '18.75 lbs/cu ft',
          stackable: true,
          hazmat: false,
          originType: 'Commercial',
          destinationType: 'Commercial',
          liftgateRequired: false
        },
        {
          id: 5,
          origin: '凤凰城, AZ',
          destination: '拉斯维加斯, NV',
          pickupDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          rate: '$4,500',
          weight: '38,000 lbs',
          volume: '48 cu ft',
          loadType: 'FTL',
          serviceType: 'FTL',
          equipment: 'Step Deck',
          length: '45 ft',
          company: 'Desert Haul Inc.',
          rating: 4.5,
          phone: '(602) 555-0654',
          distance: '300 miles',
          commodity: '建筑材料 (Construction Materials)',
          pallets: 'N/A',
          requirements: '专业绑定, 超尺寸许可',
          // FTL专用信息
          trailerLength: '53 ft',
          maxWeight: '80,000 lbs',
          specialServices: 'Oversized Load, Permits Required'
        },
        {
          id: 6,
          origin: '波士顿, MA',
          destination: '纽约, NY',
          pickupDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          rate: '$320',
          weight: '850 lbs',
          volume: '48 cu ft',
          loadType: 'LTL',
          serviceType: 'LTL',
          equipment: 'Dry Van',
          length: '4 ft',
          width: '4 ft',
          height: '3 ft',
          company: 'Northeast Delivery',
          rating: 4.7,
          phone: '(617) 555-0987',
          distance: '220 miles',
          commodity: '电子产品 (Electronics)',
          pallets: '2 pallets',
          requirements: '易碎品包装',
          // LTL专用信息
          freightClass: '175',
          density: '17.7 lbs/cu ft',
          stackable: false,
          hazmat: false,
          originType: 'Commercial',
          destinationType: 'Residential',
          liftgateRequired: true
        }
      ];
    }
  };

  const fetchTrucks = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/landfreight/trucks`);
      if (!response.ok) {
        throw new Error('获取车源信息失败');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('获取车源信息失败:', error);
      return [
        {
          id: 1,
          location: '加州洛杉矶',
          destination: '任何地点',
          availableDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          equipment: 'Dry Van 53ft',
          capacity: '80,000 lbs',
          volume: '3,400 cu ft',
          serviceType: 'FTL',
          rateRange: '$2.20-2.80/mile',
          company: 'West Coast Trucking',
          rating: 4.8,
          phone: '(323) 555-0123',
          preferredLanes: 'CA to TX, AZ, NV',
          specialServices: 'Team Driver, Expedited'
        },
        {
          id: 2,
          location: '德州休斯顿',
          destination: '东部各州',
          availableDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          equipment: 'Refrigerated 53ft',
          capacity: '80,000 lbs',
          volume: '3,200 cu ft',
          serviceType: 'FTL',
          rateRange: '$2.50-3.20/mile',
          company: 'Gulf Coast Carriers',
          rating: 4.9,
          phone: '(713) 555-0456',
          preferredLanes: 'TX to FL, GA, NC',
          specialServices: 'Temperature Control, Food Grade'
        },
        {
          id: 3,
          location: '伊利诺伊芝加哥',
          destination: '中西部地区',
          availableDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          equipment: 'LTL Network',
          capacity: '28,000 lbs',
          volume: '1,800 cu ft',
          serviceType: 'LTL',
          rateRange: '$0.85-1.45/lb',
          company: 'Midwest LTL Services',
          rating: 4.7,
          phone: '(312) 555-0789',
          preferredLanes: 'IL to WI, IN, OH, MI',
          specialServices: 'Liftgate, Residential Delivery'
        }
      ];
    }
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [loadData, truckData] = await Promise.all([
          fetchLoads(),
          fetchTrucks()
        ]);
        setLoads(loadData);
        setTrucks(truckData);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
        console.error('数据加载失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setAppliedSearchQuery(searchQuery);
  };

  const resetFilters = () => {
    const resetState = {
      origin: '',
      destination: '',
      equipment: '',
      loadType: '',
      serviceType: '',
      capacity: '',
      volume: ''
    };
    setFilters(resetState);
    setAppliedFilters(resetState);
    setSearchQuery('');
    setAppliedSearchQuery('');
  };

  const handlePostSubmit = async (postData) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const endpoint = postData.type === 'load' ? '/landfreight/loads' : '/landfreight/trucks';
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录再发布信息');
        return;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error('发布失败');
      }

      // 重新加载数据
      if (postData.type === 'load') {
        const loadData = await fetchLoads();
        setLoads(loadData);
      } else {
        const truckData = await fetchTrucks();
        setTrucks(truckData);
      }

      alert('发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请稍后重试');
    }
  };

  const filterData = (data) => {
    return data.filter(item => {
      // 搜索过滤
      if (appliedSearchQuery) {
        const searchLower = appliedSearchQuery.toLowerCase();
        const matchesSearch = 
          item.origin?.toLowerCase().includes(searchLower) ||
          item.destination?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.equipment?.toLowerCase().includes(searchLower) ||
          item.commodity?.toLowerCase().includes(searchLower) ||
          item.company?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // 筛选条件过滤
      if (appliedFilters.origin && !item.origin?.toLowerCase().includes(appliedFilters.origin.toLowerCase()) && 
          !item.location?.toLowerCase().includes(appliedFilters.origin.toLowerCase())) return false;
      
      if (appliedFilters.destination && !item.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
      
      if (appliedFilters.equipment && !item.equipment?.toLowerCase().includes(appliedFilters.equipment.toLowerCase())) return false;
      
      if (appliedFilters.loadType && item.loadType !== appliedFilters.loadType) return false;
      
      if (appliedFilters.serviceType && item.serviceType !== appliedFilters.serviceType) return false;

      return true;
    });
  };

  const filteredLoads = filterData(loads);
  const filteredTrucks = filterData(trucks);

  const hasAppliedFilters = Object.values(appliedFilters).some(value => value !== '') || appliedSearchQuery !== '';

  const getFilterDescription = () => {
    const descriptions = [];
    if (appliedFilters.origin) descriptions.push(`起点: ${appliedFilters.origin}`);
    if (appliedFilters.destination) descriptions.push(`终点: ${appliedFilters.destination}`);
    if (appliedFilters.equipment) descriptions.push(`车型: ${appliedFilters.equipment}`);
    if (appliedFilters.loadType) descriptions.push(`类型: ${appliedFilters.loadType}`);
    if (appliedFilters.serviceType) descriptions.push(`服务: ${appliedFilters.serviceType}`);
    if (appliedSearchQuery) descriptions.push(`搜索: ${appliedSearchQuery}`);
    
    return descriptions.length > 0 
      ? `应用的筛选条件: ${descriptions.join(', ')}`
      : '';
  };

  // 获取地址类型图标
  const getLocationIcon = (locationType) => {
    switch (locationType) {
      case 'Residential': return <Home size={12} />;
      case 'Commercial': return <Building size={12} />;
      case 'Elevator Required': return <Layers size={12} />;
      case 'Gated/Secured': return <Shield size={12} />;
      default: return <Building size={12} />;
    }
  };

  if (loading) {
    return (
      <div className="freight-board">
        <div className="container">
          <div className="loading-container">
            <Loader2 size={48} className="loading-spinner" />
            <p>正在加载货运信息...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="freight-board">
        <div className="container">
          <div className="error-container">
            <AlertCircle size={48} />
            <h3>加载失败</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>重新加载</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="platform-page freight-board">
      <div className="container">
        {/* Header */}
        <div className="platform-header">
          <div className="platform-icon">
            <Truck size={48} />
          </div>
          <h1 className="platform-title">陆运信息平台</h1>
          <p className="platform-description">
            货主发布货源信息，承运商发布车源信息，通过智能匹配系统实现高效对接。
          </p>
        </div>

        {/* Tabs */}
        <div className="board-tabs">
          <button 
            className={`tab ${activeTab === 'loads' ? 'active' : ''}`}
            onClick={() => setActiveTab('loads')}
          >
            <Package size={20} />
            货源信息
            {filteredLoads.length > 0 && (
              <span className="tab-count">{filteredLoads.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'trucks' ? 'active' : ''}`}
            onClick={() => setActiveTab('trucks')}
          >
            <Truck size={20} />
            车源信息
            {filteredTrucks.length > 0 && (
              <span className="tab-count">{filteredTrucks.length}</span>
            )}
          </button>
        </div>

        {/* Post Buttons */}
        <div className="post-actions">
          <button 
            className="btn btn-primary post-btn"
            onClick={() => setIsPostLoadModalOpen(true)}
          >
            <Plus size={18} />
            发布货源信息
          </button>
          <button 
            className="btn btn-secondary post-btn"
            onClick={() => setIsPostTruckModalOpen(true)}
          >
            <Plus size={18} />
            发布车源信息
          </button>
        </div>

        {/* Compact Search and Filters */}
        <div className="search-filters-compact">
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索起始地、目的地、公司..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filters-bar">
            <select 
              value={filters.origin} 
              onChange={(e) => handleFilterChange('origin', e.target.value)}
            >
              <option value="">起始地</option>
              <option value="上海">上海</option>
              <option value="北京">北京</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="成都">成都</option>
              <option value="武汉">武汉</option>
            </select>

            <select 
              value={filters.destination} 
              onChange={(e) => handleFilterChange('destination', e.target.value)}
            >
              <option value="">目的地</option>
              <option value="上海">上海</option>
              <option value="北京">北京</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="成都">成都</option>
              <option value="重庆">重庆</option>
              <option value="开放">开放</option>
            </select>

            <select 
              value={filters.equipment} 
              onChange={(e) => handleFilterChange('equipment', e.target.value)}
            >
              <option value="">车型</option>
              <option value="厢式货车">厢式货车</option>
              <option value="冷藏车">冷藏车</option>
              <option value="平板车">平板车</option>
              <option value="高栏车">高栏车</option>
            </select>

            <select 
              value={filters.loadType} 
              onChange={(e) => handleFilterChange('loadType', e.target.value)}
            >
              <option value="">方式</option>
              <option value="FTL">整车</option>
              <option value="LTL">零担</option>
            </select>
            
            <button className="filter-btn" onClick={applyFilters}>
              <CheckCircle size={16} />
              确认筛选
            </button>
            
            <button className="reset-btn" onClick={resetFilters}>
              <X size={16} />
              重置
            </button>
          </div>
        </div>

        {/* Applied Filters Display */}
        {hasAppliedFilters && (
          <div className="applied-filters-bar">
            <span>当前筛选: {getFilterDescription()}</span>
            <span className="result-count">
              {activeTab === 'loads' 
                ? `${filteredLoads.length} 个货源` 
                : `${filteredTrucks.length} 个车源`
              }
            </span>
          </div>
        )}

        {/* Content */}
        <div className="freight-list-container">
          {activeTab === 'loads' && (
            <div className="loads-grid">
              {filteredLoads.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
                  <h3>
                    {hasAppliedFilters ? '没有符合条件的货源信息' : '暂无货源信息'}
                  </h3>
                  <p>
                    {hasAppliedFilters 
                      ? '请尝试修改筛选条件' 
                      : '还没有货源信息发布，快来发布第一个吧！'
                    }
                  </p>
                </div>
              ) : (
                filteredLoads.map(load => (
                  <div key={load.id} className="load-card enhanced">
                    {/* 运输类型标签 - 突出显示 */}
                    <div className={`service-type-header ${load.serviceType?.toLowerCase()}`}>
                      <div className="service-type-badge">
                        {load.serviceType === 'FTL' ? (
                          <>
                            <Truck size={16} />
                            <span>FTL - 整车运输</span>
                          </>
                        ) : (
                          <>
                            <Package size={16} />
                            <span>LTL - 零担运输</span>
                          </>
                        )}
                      </div>
                      {load.serviceType === 'LTL' && load.freightClass && (
                        <div className="freight-class-badge">
                          <Hash size={12} />
                          <span>Class {load.freightClass}</span>
                        </div>
                      )}
                    </div>

                    {/* 路线信息 */}
                    <div className="load-header">
                      <div className="route">
                        <div className="route-point">
                          <MapPin size={14} />
                          <div className="location">
                            <span className="city">{load.origin}</span>
                            {load.serviceType === 'LTL' && load.originType && (
                              <span className="location-type">
                                {getLocationIcon(load.originType)}
                                {load.originType}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="route-arrow">
                          <ArrowRight size={16} />
                          <span className="distance">{load.distance}</span>
                        </div>
                        
                        <div className="route-point">
                          <MapPin size={14} />
                          <div className="location">
                            <span className="city">{load.destination}</span>
                            {load.serviceType === 'LTL' && load.destinationType && (
                              <span className="location-type">
                                {getLocationIcon(load.destinationType)}
                                {load.destinationType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="date-info">
                        <span className="pickup-date">
                          <Calendar size={12} />
                          取货: {load.pickupDate}
                        </span>
                        <span className="delivery-date">
                          <Clock size={12} />
                          送达: {load.deliveryDate}
                        </span>
                      </div>
                    </div>

                    {/* 货物详细信息 */}
                    <div className="load-details enhanced">
                      <div className="commodity-info">
                        <div className="commodity-name">
                          <Package size={14} />
                          <span>{load.commodity}</span>
                        </div>
                        <div className="equipment-type">
                          <Truck size={14} />
                          <span>{load.equipment}</span>
                        </div>
                      </div>

                      {/* 根据运输类型显示不同信息 */}
                      {load.serviceType === 'FTL' ? (
                        <div className="ftl-details">
                          <div className="detail-row">
                            <div className="detail-item">
                              <Scale size={14} />
                              <span>重量: {load.weight}</span>
                            </div>
                            <div className="detail-item">
                              <Layers size={14} />
                              <span>长度: {load.trailerLength || load.length}</span>
                            </div>
                            <div className="detail-item">
                              <DollarSign size={14} />
                              <span className="rate-highlight">{load.rate}</span>
                            </div>
                          </div>
                          
                          {load.specialServices && (
                            <div className="special-services">
                              <CheckCircle size={12} />
                              <span>{load.specialServices}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="ltl-details">
                          <div className="ltl-metrics">
                            <div className="metric-item">
                              <Scale size={14} />
                              <div>
                                <span className="metric-value">{load.weight}</span>
                                <span className="metric-label">重量</span>
                              </div>
                            </div>
                            
                            <div className="metric-item">
                              <Package size={14} />
                              <div>
                                <span className="metric-value">{load.pallets}</span>
                                <span className="metric-label">托盘</span>
                              </div>
                            </div>
                            
                            {load.density && (
                              <div className="metric-item">
                                <Layers size={14} />
                                <div>
                                  <span className="metric-value">{load.density}</span>
                                  <span className="metric-label">密度</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="metric-item rate">
                              <DollarSign size={14} />
                              <div>
                                <span className="metric-value rate-highlight">{load.rate}</span>
                                <span className="metric-label">运费</span>
                              </div>
                            </div>
                          </div>

                          {/* LTL尺寸信息 */}
                          {load.length && load.width && load.height && (
                            <div className="dimensions-info">
                              <span className="dimensions-label">尺寸:</span>
                              <span className="dimensions-value">
                                {load.length} × {load.width} × {load.height}
                              </span>
                              <span className="volume">({load.volume})</span>
                            </div>
                          )}

                          {/* LTL特殊属性 */}
                          <div className="ltl-attributes">
                            {load.stackable !== undefined && (
                              <span className={`attribute ${load.stackable ? 'positive' : 'negative'}`}>
                                {load.stackable ? '可堆叠' : '不可堆叠'}
                              </span>
                            )}
                            {load.hazmat && (
                              <span className="attribute hazmat">危险品</span>
                            )}
                            {load.liftgateRequired && (
                              <span className="attribute service">需要尾板</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 特殊要求 */}
                      {load.requirements && (
                        <div className="requirements">
                          <AlertCircle size={12} />
                          <span>{load.requirements}</span>
                        </div>
                      )}
                    </div>

                    {/* 公司信息和操作 */}
                    <div className="load-footer enhanced">
                      <div className="company-info">
                        <div className="company-name">{load.company}</div>
                        <div className="company-rating">
                          <Star size={12} />
                          <span>{load.rating}</span>
                        </div>
                      </div>

                      <div className="load-actions">
                        <button className="btn-contact" onClick={() => window.open(`tel:${load.phone}`)}>
                          <Phone size={14} />
                          <span>联系</span>
                        </button>
                        <button className="btn-quote">
                          <MessageCircle size={14} />
                          <span>询价</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'trucks' && (
            <div className="freight-list">
              {filteredTrucks.length === 0 ? (
                <div className="empty-state">
                  <Truck size={48} />
                  <h3>
                    {hasAppliedFilters ? '没有符合条件的车源信息' : '暂无车源信息'}
                  </h3>
                  <p>
                    {hasAppliedFilters 
                      ? '请尝试修改筛选条件' 
                      : '还没有车源信息发布，快来发布第一个吧！'
                    }
                  </p>
                </div>
              ) : (
                filteredTrucks.map(truck => (
                  <div key={truck.id} className="freight-card-compact">
                    {/* 路线信息 */}
                    <div className="route-info">
                      <div className="route">
                        <span className="origin">{truck.location}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{truck.destination}</span>
                      </div>
                      <div className="route-meta">
                        <span className="service-type">{truck.serviceType || 'N/A'}</span>
                      </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="details-info">
                      <div className="detail-row">
                        <span><Calendar size={14} /> {truck.availableDate || 'N/A'}</span>
                        <span><Truck size={14} /> {truck.equipment || 'N/A'}</span>
                        <span><Scale size={14} /> {truck.capacity || 'N/A'}</span>
                      </div>

                      <div className="detail-row">
                        <span className="volume">{truck.volume || 'N/A'}</span>
                        <span>{truck.preferredLanes || 'N/A'}</span>
                        {truck.specialServices && <span className="requirements">{truck.specialServices}</span>}
                      </div>
                    </div>

                    {/* 公司信息 */}
                    <div className="company-info">
                      <div className="company">{truck.company || 'N/A'}</div>
                      <div className="rating">
                        <Star size={14} />
                        <span>{truck.rating || 'N/A'}</span>
                      </div>
                    </div>

                    {/* 价格和操作 */}
                    <div className="action-info">
                      <div className="price">{truck.rateRange || 'N/A'}</div>
                      <div className="actions">
                        <button className="btn-action">
                          <MessageCircle size={14} />
                          询价
                        </button>
                        <button className="btn-action primary">
                          <Phone size={14} />
                          联系
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

      <style jsx>{`
        .freight-board {
          padding: 20px 0;
        }

        .platform-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .platform-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #34C759, #2ecc71);
          border-radius: 16px;
          margin-bottom: 0.75rem;
          color: white;
        }

        .platform-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.375rem;
        }

        .platform-description {
          color: #666;
          font-size: 0.9rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .board-tabs {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          color: #666;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.85rem;
        }

        .tab.active {
          border-color: #34C759;
          background: #34C759;
          color: white;
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 10px;
          padding: 0.125rem 0.375rem;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .tab:not(.active) .tab-count {
          background: #34C759;
          color: white;
        }

        .post-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .post-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .search-filters-compact {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          gap: 0.375rem;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.85rem;
        }

        .filters-bar {
          display: flex;
          gap: 0.375rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .filters-bar select {
          padding: 0.375rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 0.8rem;
          background: white;
          min-width: 70px;
        }

        .filter-btn, .reset-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.625rem;
          border: none;
          border-radius: 5px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn {
          background: #34C759;
          color: white;
        }

        .filter-btn:hover {
          background: #2ecc71;
        }

        .reset-btn {
          background: #f5f5f5;
          color: #666;
        }

        .reset-btn:hover {
          background: #e0e0e0;
        }

        .applied-filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #e8f5e8;
          border: 1px solid #4caf50;
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
        }

        .result-count {
          color: #2e7d32;
          font-weight: 600;
        }

        .freight-list-container {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .freight-list {
          display: flex;
          flex-direction: column;
        }

        /* 桌面端：超窄卡片设计 */
        .freight-card-compact {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #f0f0f0;
          transition: all 0.2s ease;
          min-height: 60px;
        }

        .freight-card-compact:hover {
          background: #f8f9fa;
          border-left: 3px solid #34C759;
          padding-left: calc(0.75rem - 3px);
        }

        .freight-card-compact:last-child {
          border-bottom: none;
        }

        .route-info {
          flex: 0 0 160px;
          margin-right: 1rem;
        }

        .route {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.125rem;
        }

        .origin, .destination {
          font-weight: 700;
          color: #333;
          font-size: 0.9rem;
        }

        .route-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .distance {
          color: #666;
          font-size: 0.7rem;
        }

        .load-type {
          padding: 0.0625rem 0.375rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 600;
        }

        .load-type.ftl {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .load-type.ltl {
          background: #fff3e0;
          color: #e65100;
        }

        .load-type.unknown {
          background: #f5f5f5;
          color: #999;
        }

        .service-type {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.0625rem 0.375rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 600;
        }

        .details-info {
          flex: 1;
          margin-right: 1rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.125rem;
        }

        .detail-row span {
          display: flex;
          align-items: center;
          gap: 0.1875rem;
          color: #666;
          font-size: 0.75rem;
        }

        .detail-row svg {
          color: #999;
          width: 12px;
          height: 12px;
        }

        .volume {
          color: #007bff !important;
          font-weight: 600;
        }

        .requirements {
          background: #fff8e1;
          color: #f57c00;
          padding: 0.0625rem 0.25rem;
          border-radius: 8px;
          font-size: 0.65rem !important;
          font-weight: 600;
        }

        .company-info {
          flex: 0 0 120px;
          text-align: center;
          margin-right: 1rem;
        }

        .company {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.125rem;
          font-size: 0.8rem;
        }

        .rating {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.1875rem;
          color: #ff9800;
          font-size: 0.75rem;
        }

        .rating svg {
          width: 12px;
          height: 12px;
        }

        .action-info {
          flex: 0 0 140px;
          text-align: right;
        }

        .price {
          font-weight: 700;
          color: #e65100;
          font-size: 1rem;
          margin-bottom: 0.375rem;
        }

        .actions {
          display: flex;
          gap: 0.375rem;
          justify-content: flex-end;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.1875rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          background: white;
          color: #666;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action svg {
          width: 12px;
          height: 12px;
        }

        .btn-action:hover {
          border-color: #34C759;
          color: #34C759;
        }

        .btn-action.primary {
          background: #34C759;
          color: white;
          border-color: #34C759;
        }

        .btn-action.primary:hover {
          background: #2ecc71;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: #666;
        }

        .empty-state svg {
          color: #999;
          margin-bottom: 0.75rem;
        }

        .empty-state h3 {
          margin-bottom: 0.375rem;
          color: #333;
        }

        .empty-state p {
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        /* 移动端：完全重新设计的卡片布局 */
        @media (max-width: 768px) {
          .freight-board {
            padding: 10px 0;
          }

          .platform-header {
            margin-bottom: 1rem;
          }

          .platform-icon {
            width: 50px;
            height: 50px;
          }

          .platform-title {
            font-size: 1.5rem;
          }

          .board-tabs {
            margin-bottom: 0.75rem;
          }

          .post-actions {
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }

          .search-filters-compact {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
          }

          .filters-bar {
            gap: 0.25rem;
          }

          .filters-bar select {
            min-width: 60px;
            font-size: 0.75rem;
            padding: 0.25rem;
          }

          .applied-filters-bar {
            flex-direction: column;
            gap: 0.25rem;
            text-align: center;
            font-size: 0.75rem;
          }

          /* 移动端卡片：垂直布局 */
          .freight-card-compact {
            flex-direction: column;
            align-items: stretch;
            padding: 0.75rem;
            min-height: auto;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border: 1px solid #f0f0f0;
            background: white;
          }

          .freight-card-compact:hover {
            background: white;
            border-left: 1px solid #f0f0f0;
            padding-left: 0.75rem;
            box-shadow: 0 2px 8px rgba(52, 199, 89, 0.1);
            border-color: #34C759;
          }

          .freight-card-compact:last-child {
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 0;
          }

          .route-info,
          .details-info,
          .company-info,
          .action-info {
            flex: none;
            margin-right: 0;
            margin-bottom: 0.5rem;
          }

          .action-info {
            margin-bottom: 0;
          }

          /* 移动端路线信息 */
          .route-info {
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 6px;
          }

          .route {
            justify-content: center;
            margin-bottom: 0.25rem;
          }

          .origin, .destination {
            font-size: 1rem;
          }

          .route-meta {
            justify-content: center;
          }

          /* 移动端详细信息 */
          .details-info {
            background: #fff;
          }

          .detail-row {
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: space-around;
            margin-bottom: 0.25rem;
          }

          .detail-row span {
            font-size: 0.8rem;
            min-width: calc(50% - 0.25rem);
            justify-content: center;
          }

          /* 移动端公司信息 */
          .company-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 6px;
          }

          .company {
            font-size: 0.9rem;
            margin-bottom: 0;
          }

          .rating {
            font-size: 0.8rem;
          }

          /* 移动端操作区域 */
          .action-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #fff;
            padding: 0.5rem;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
          }

          .price {
            font-size: 1.1rem;
            margin-bottom: 0;
          }

          .actions {
            gap: 0.5rem;
          }

          .btn-action {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
          }

          .btn-action svg {
            width: 14px;
            height: 14px;
          }

          .freight-list {
            padding: 0.5rem;
            gap: 0;
          }

          .freight-list-container {
            background: transparent;
            box-shadow: none;
          }
        }

        /* 超小屏幕优化 */
        @media (max-width: 480px) {
          .detail-row span {
            min-width: 100%;
            margin-bottom: 0.25rem;
          }
          
          .action-info {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default FreightBoard; 

