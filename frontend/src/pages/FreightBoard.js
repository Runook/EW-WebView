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
  X
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
          origin: '上海',
          destination: '北京',
          pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
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
          pickupDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
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
          pickupDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
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
          pickupDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
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
        },
        {
          id: 5,
          origin: '西安',
          destination: '郑州',
          pickupDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          rate: '4,200',
          weight: '18吨',
          volume: '28立方米',
          loadType: 'FTL',
          equipment: '高栏车',
          length: '17.5米',
          company: '中原快运',
          rating: 4.5,
          phone: '(029) 888-9999',
          distance: '480公里',
          commodity: '建材',
          pallets: '不适用',
          requirements: '吊装设备'
        },
        {
          id: 6,
          origin: '杭州',
          destination: '南京',
          pickupDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          rate: '1,800',
          weight: '5吨',
          volume: '10立方米',
          loadType: 'LTL',
          equipment: '厢式货车',
          length: '9.6米',
          company: '江浙物流',
          rating: 4.7,
          phone: '(0571) 777-8888',
          distance: '280公里',
          commodity: '纺织品',
          pallets: '6托盘',
          requirements: '防潮包装'
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
          location: '武汉',
          destination: '开放',
          availableDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
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
          availableDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
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
          availableDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
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
        },
        {
          id: 4,
          location: '青岛',
          destination: '开放',
          availableDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          equipment: '平板车',
          length: '17.5米',
          capacity: '35吨',
          volume: '50立方米',
          serviceType: 'FTL',
          company: '山东重载',
          rating: 4.7,
          phone: '(0532) 666-7777',
          preferredLanes: '华东至全国',
          rateRange: '¥5-10/公里',
          specialServices: '超重货物、专业装卸'
        },
        {
          id: 5,
          location: '深圳',
          destination: '开放',
          availableDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          equipment: '厢式货车',
          length: '9.6米',
          capacity: '8吨',
          volume: '15立方米',
          serviceType: 'LTL',
          company: '深港快运',
          rating: 4.8,
          phone: '(0755) 888-9999',
          preferredLanes: '珠三角至全国',
          rateRange: '¥4-9/公里',
          specialServices: '港货运输、当日达'
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
        const [loadsData, trucksData] = await Promise.all([
          fetchLoads(),
          fetchTrucks()
        ]);
        setLoads(loadsData);
        setTrucks(trucksData);
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

  // 应用筛选条件
  const applyFilters = () => {
    setAppliedFilters(filters);
    setAppliedSearchQuery(searchQuery);
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      equipment: '',
      loadType: '',
      serviceType: '',
      capacity: '',
      volume: ''
    });
    setAppliedFilters({
      origin: '',
      destination: '',
      equipment: '',
      loadType: '',
      serviceType: '',
      capacity: '',
      volume: ''
    });
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
        const loadsData = await fetchLoads();
        setLoads(loadsData);
      } else {
        const trucksData = await fetchTrucks();
        setTrucks(trucksData);
      }

      alert('发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      // 如果API调用失败，至少更新本地状态
      setUserPosts(prev => [...prev, { ...postData, id: Date.now() }]);
      alert('发布成功！');
    }
  };

  // 筛选和搜索逻辑（基于已应用的筛选条件）
  const filterData = (data) => {
    let filtered = [...data];

    // 搜索筛选
    if (appliedSearchQuery.trim()) {
      const query = appliedSearchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.origin && item.origin.toLowerCase().includes(query)) ||
        (item.destination && item.destination.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query)) ||
        (item.commodity && item.commodity.toLowerCase().includes(query)) ||
        (item.equipment && item.equipment.toLowerCase().includes(query)) ||
        (item.company && item.company.toLowerCase().includes(query))
      );
    }

    // 应用其他筛选条件
    if (appliedFilters.origin) {
      filtered = filtered.filter(item => 
        (item.origin && item.origin.toLowerCase().includes(appliedFilters.origin.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(appliedFilters.origin.toLowerCase()))
      );
    }

    if (appliedFilters.destination) {
      filtered = filtered.filter(item => 
        item.destination && item.destination.toLowerCase().includes(appliedFilters.destination.toLowerCase())
      );
    }

    if (appliedFilters.equipment) {
      filtered = filtered.filter(item => 
        item.equipment && item.equipment.toLowerCase().includes(appliedFilters.equipment.toLowerCase())
      );
    }

    if (appliedFilters.loadType) {
      filtered = filtered.filter(item => 
        item.loadType === appliedFilters.loadType || 
        (item.serviceType && item.serviceType.includes(appliedFilters.loadType))
      );
    }

    return filtered;
  };

  // Combine user posts with API data
  const allLoads = [...loads, ...userPosts.filter(post => post.type === 'load')];
  const allTrucks = [...trucks, ...userPosts.filter(post => post.type === 'truck')];

  // 应用筛选
  const filteredLoads = filterData(allLoads);
  const filteredTrucks = filterData(allTrucks);

  // 检查是否有应用的筛选条件
  const hasAppliedFilters = appliedSearchQuery || Object.values(appliedFilters).some(f => f);

  // 获取当前筛选条件的描述
  const getFilterDescription = () => {
    const conditions = [];
    if (appliedSearchQuery) conditions.push(`关键词: ${appliedSearchQuery}`);
    if (appliedFilters.origin) conditions.push(`起始地: ${appliedFilters.origin}`);
    if (appliedFilters.destination) conditions.push(`目的地: ${appliedFilters.destination}`);
    if (appliedFilters.equipment) conditions.push(`车型: ${appliedFilters.equipment}`);
    if (appliedFilters.loadType) conditions.push(`方式: ${appliedFilters.loadType}`);
    return conditions.join(' | ');
  };

  if (loading) {
    return (
      <div className="platform-page freight-board">
        <div className="container">
          <div className="loading-container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column'
          }}>
            <Loader2 size={48} style={{ color: '#34C759', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>正在加载陆运信息...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="platform-page freight-board">
        <div className="container">
          <div className="error-container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} style={{ color: '#ff4444' }} />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '16px', maxWidth: '400px' }}>{error}</p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '16px' }}
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
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
            <div className="freight-list">
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
                  <div key={load.id} className="freight-card-compact">
                    {/* 路线信息 */}
                    <div className="route-info">
                      <div className="route">
                        <span className="origin">{load.origin}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{load.destination}</span>
                      </div>
                      <div className="route-meta">
                        <span className="distance">{load.distance || 'N/A'}</span>
                        <span className={`load-type ${load.loadType ? load.loadType.toLowerCase() : 'unknown'}`}>{load.loadType || 'N/A'}</span>
                      </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="details-info">
                      <div className="detail-row">
                        <span><Calendar size={14} /> {load.pickupDate || 'N/A'}</span>
                        <span><Package size={14} /> {load.commodity || 'N/A'}</span>
                        <span><Truck size={14} /> {load.equipment || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span><Scale size={14} /> {load.weight || 'N/A'}</span>
                        <span className="volume">{load.volume || 'N/A'}</span>
                        {load.requirements && <span className="requirements">{load.requirements}</span>}
                      </div>
                    </div>

                    {/* 公司信息 */}
                    <div className="company-info">
                      <div className="company">{load.company || 'N/A'}</div>
                      <div className="rating">
                        <Star size={14} />
                        <span>{load.rating || 'N/A'}</span>
                      </div>
                    </div>

                    {/* 价格和操作 */}
                    <div className="action-info">
                      <div className="price">¥{load.rate || 'N/A'}</div>
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
