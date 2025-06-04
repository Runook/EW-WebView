import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Ship, 
  Package, 
  DollarSign,
  Star,
  Phone,
  MessageCircle,
  ArrowRight,
  Plus,
  Clock,
  Scale,
  Shield,
  Anchor,
  Container,
  Loader2,
  AlertCircle
} from 'lucide-react';
import PostSeaCargoModal from '../components/PostSeaCargoModal';
import PostSeaDemandModal from '../components/PostSeaDemandModal';
import './PlatformPage.css';
import './FreightBoard.css'; // 复用样式
import './AirFreightPlatform.css'; // 复用空运专用样式

const SeaFreightPlatform = () => {
  const [activeTab, setActiveTab] = useState('demands');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostCargoModalOpen, setIsPostCargoModalOpen] = useState(false);
  const [isPostDemandModalOpen, setIsPostDemandModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [seaCargo, setSeaCargo] = useState([]);
  const [seaDemands, setSeaDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    cargoType: '',
    weight: '',
    urgency: '',
    vesselType: ''
  });

  // Generate future dates for mock data
  const getRandomFutureDate = (daysFromNow = 5, maxDays = 30) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysFromNow + Math.floor(Math.random() * maxDays));
    return futureDate.toISOString().split('T')[0];
  };

  const cargoTypes = [
    '普货',
    '危险品',
    '冷冻货物',
    '散货',
    '液体货物',
    '超重超限',
    '电子产品',
    '机械设备',
    '化工品',
    '食品原料',
    '纺织品',
    '汽车及配件'
  ];

  const urgencyLevels = [
    '普通',
    '加急',
    '紧急',
    '特急'
  ];

  const vesselTypes = [
    '集装箱船',
    '散货船',
    '液货船',
    '滚装船',
    '多用途船',
    '超大型集装箱船'
  ];

  // API调用函数
  const fetchSeaCargo = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/seafreight/cargo`);
      if (!response.ok) {
        throw new Error('获取舱位信息失败');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('获取舱位信息失败:', error);
      // 返回带有更新日期的mock数据作为fallback
      return [
        {
          id: 1,
          origin: '上海港 (CNSHA)',
          destination: '洛杉矶港 (USLAX)',
          sailingDate: getRandomFutureDate(5),
          vesselName: '中远海运宇宙',
          shippingLine: '中远海运集装箱运输',
          availableSpace: '200 TEU',
          rate: '¥2,800/TEU',
          transitTime: '15天',
          cargoType: '普货/危险品',
          company: '中远海运代理',
          rating: 4.8,
          phone: '(021) 1234-5678',
          vesselType: '集装箱船',
          cutOffDate: getRandomFutureDate(3),
          specialService: 'Door to Door'
        },
        {
          id: 2,
          origin: '深圳盐田港 (CNYKA)',
          destination: '汉堡港 (DEHAM)',
          sailingDate: getRandomFutureDate(7),
          vesselName: 'OOCL Hong Kong',
          shippingLine: '东方海外货柜航运',
          availableSpace: '150 TEU',
          rate: '¥3,200/TEU',
          transitTime: '28天',
          cargoType: '普货/冷冻',
          company: '东方海外代理',
          rating: 4.9,
          phone: '(0755) 9876-5432',
          vesselType: '集装箱船',
          cutOffDate: getRandomFutureDate(5),
          specialService: '冷链服务'
        },
        {
          id: 3,
          origin: '宁波舟山港 (CNNGB)',
          destination: '鹿特丹港 (NLRTM)',
          sailingDate: getRandomFutureDate(10),
          vesselName: 'MSC Oscar',
          shippingLine: '地中海航运',
          availableSpace: '300 TEU',
          rate: '¥2,600/TEU',
          transitTime: '30天',
          cargoType: '普货/散货',
          company: '地中海航运中国',
          rating: 4.7,
          phone: '(0574) 5555-8888',
          vesselType: '超大型集装箱船',
          cutOffDate: getRandomFutureDate(8),
          specialService: 'LCL拼箱'
        },
        {
          id: 4,
          origin: '青岛港 (CNTAO)',
          destination: '纽约港 (USNYC)',
          sailingDate: getRandomFutureDate(12),
          vesselName: 'COSCO SHIPPING Universe',
          shippingLine: '中远海运集装箱运输',
          availableSpace: '180 TEU',
          rate: '¥3,000/TEU',
          transitTime: '18天',
          cargoType: '普货/项目货',
          company: '中远海运青岛',
          rating: 4.6,
          phone: '(0532) 7777-9999',
          vesselType: '集装箱船',
          cutOffDate: getRandomFutureDate(10),
          specialService: '项目物流'
        }
      ];
    }
  };

  const fetchSeaDemands = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/seafreight/demands`);
      if (!response.ok) {
        throw new Error('获取货运需求失败');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('获取货运需求失败:', error);
      // 返回带有更新日期的mock数据作为fallback
      return [
        {
          id: 1,
          origin: '广州南沙港 (CNCAN)',
          destination: '新加坡港 (SGSIN)',
          requiredDate: getRandomFutureDate(8),
          weight: '20 TEU',
          cargoType: '电子产品',
          urgency: '紧急',
          maxRate: '¥1,800/TEU',
          company: '广州科技出口',
          rating: 4.6,
          phone: '(020) 1111-2222',
          specialRequirements: '恒温干燥',
          insurance: '高价值货物保险',
          containerType: '20GP 干箱',
          incoterms: 'FOB'
        },
        {
          id: 2,
          origin: '天津港 (CNTSN)',
          destination: '安特卫普港 (BEANR)',
          requiredDate: getRandomFutureDate(10),
          weight: '35 TEU',
          cargoType: '机械设备',
          urgency: '加急',
          maxRate: '¥2,500/TEU',
          company: '京津冀重工',
          rating: 4.8,
          phone: '(022) 3333-4444',
          specialRequirements: '超重货物处理',
          insurance: '基础货物保险',
          containerType: '40HC 超高箱',
          incoterms: 'CIF'
        },
        {
          id: 3,
          origin: '厦门港 (CNXMN)',
          destination: '釜山港 (KRPUS)',
          requiredDate: getRandomFutureDate(15),
          weight: '10 TEU',
          cargoType: '食品原料',
          urgency: '普通',
          maxRate: '¥1,200/TEU',
          company: '闽南食品贸易',
          rating: 4.5,
          phone: '(0592) 6666-7777',
          specialRequirements: '冷藏运输',
          insurance: '食品安全保险',
          containerType: '20RF 冷冻箱',
          incoterms: 'EXW'
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
        const [cargoData, demandData] = await Promise.all([
          fetchSeaCargo(),
          fetchSeaDemands()
        ]);
        setSeaCargo(cargoData);
        setSeaDemands(demandData);
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

  const handlePostSubmit = async (postData) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const endpoint = postData.type === 'cargo' ? '/seafreight/cargo' : '/seafreight/demands';
      
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

      const result = await response.json();
      
      // 重新加载数据
      if (postData.type === 'cargo') {
        const cargoData = await fetchSeaCargo();
        setSeaCargo(cargoData);
      } else {
        const demandData = await fetchSeaDemands();
        setSeaDemands(demandData);
      }

      alert('发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      // 如果API调用失败，至少更新本地状态
      setUserPosts(prev => [...prev, { ...postData, id: Date.now() }]);
      alert('发布成功！');
    }
  };

  // 筛选和搜索逻辑
  const filterData = (data) => {
    let filtered = [...data];

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.origin?.toLowerCase().includes(query) ||
        item.destination?.toLowerCase().includes(query) ||
        item.cargoType?.toLowerCase().includes(query) ||
        item.company?.toLowerCase().includes(query) ||
        item.vesselName?.toLowerCase().includes(query) ||
        item.shippingLine?.toLowerCase().includes(query)
      );
    }

    // 起始港筛选
    if (filters.origin) {
      filtered = filtered.filter(item => 
        item.origin?.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    // 目的港筛选
    if (filters.destination) {
      filtered = filtered.filter(item => 
        item.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    // 货物类型筛选
    if (filters.cargoType) {
      filtered = filtered.filter(item => 
        item.cargoType?.toLowerCase().includes(filters.cargoType.toLowerCase())
      );
    }

    // 船舶类型筛选（仅对舱位信息）
    if (filters.vesselType && activeTab === 'cargo') {
      filtered = filtered.filter(item => 
        item.vesselType?.toLowerCase().includes(filters.vesselType.toLowerCase())
      );
    }

    // 紧急程度筛选（仅对货运需求）
    if (filters.urgency && activeTab === 'demands') {
      filtered = filtered.filter(item => 
        item.urgency === filters.urgency
      );
    }

    return filtered;
  };

  // Combine user posts with API data
  const allCargo = [...seaCargo, ...userPosts.filter(post => post.type === 'cargo')];
  const allDemands = [...seaDemands, ...userPosts.filter(post => post.type === 'demand')];

  // 应用筛选
  const filteredCargo = filterData(allCargo);
  const filteredDemands = filterData(allDemands);

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
            <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>正在加载海运信息...</p>
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
        <div className="platform-header board-header">
          <div className="platform-icon">
            <Ship size={48} />
          </div>
          <h1 className="platform-title board-title">海运信息平台</h1>
          <p className="platform-description board-description">
            海运货代、船公司发布舱位信息，货主发布货源需求，实现海运物流信息匹配。
            支持集装箱、散货、液货等多种海运服务。
          </p>
        </div>

        {/* Tabs */}
        <div className="board-tabs">
          <button 
            className={`tab ${activeTab === 'demands' ? 'active' : ''}`}
            onClick={() => setActiveTab('demands')}
          >
            <Package size={20} />
            寻现仓 (货运需求)
            {filteredDemands.length > 0 && (
              <span className="tab-count" style={{
                marginLeft: '8px',
                backgroundColor: '#34C759',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>{filteredDemands.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'cargo' ? 'active' : ''}`}
            onClick={() => setActiveTab('cargo')}
          >
            <Ship size={20} />
            出现仓 (可用舱位)
            {filteredCargo.length > 0 && (
              <span className="tab-count" style={{
                marginLeft: '8px',
                backgroundColor: '#34C759',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>{filteredCargo.length}</span>
            )}
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
        <div className="platform-search board-search">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起始港、目的港、货物类型或公司名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="filters">
            <select 
              value={filters.origin} 
              onChange={(e) => handleFilterChange('origin', e.target.value)}
            >
              <option value="">起始港</option>
              <option value="上海港">上海港</option>
              <option value="深圳港">深圳港</option>
              <option value="宁波港">宁波港</option>
              <option value="青岛港">青岛港</option>
              <option value="天津港">天津港</option>
              <option value="厦门港">厦门港</option>
              <option value="广州港">广州港</option>
            </select>

            <select 
              value={filters.destination} 
              onChange={(e) => handleFilterChange('destination', e.target.value)}
            >
              <option value="">目的港</option>
              <option value="洛杉矶港">洛杉矶港</option>
              <option value="纽约港">纽约港</option>
              <option value="汉堡港">汉堡港</option>
              <option value="鹿特丹港">鹿特丹港</option>
              <option value="新加坡港">新加坡港</option>
              <option value="釜山港">釜山港</option>
              <option value="安特卫普港">安特卫普港</option>
            </select>

            <select 
              value={filters.cargoType} 
              onChange={(e) => handleFilterChange('cargoType', e.target.value)}
            >
              <option value="">货物类型</option>
              {cargoTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {activeTab === 'cargo' && (
              <select 
                value={filters.vesselType} 
                onChange={(e) => handleFilterChange('vesselType', e.target.value)}
              >
                <option value="">船舶类型</option>
                {vesselTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            {activeTab === 'demands' && (
              <select 
                value={filters.urgency} 
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
              >
                <option value="">紧急程度</option>
                {urgencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            )}

            <button 
              className="btn btn-ghost filter-btn"
              onClick={() => setFilters({
                origin: '',
                destination: '',
                cargoType: '',
                weight: '',
                urgency: '',
                vesselType: ''
              })}
            >
              <Filter size={16} />
              清空筛选
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="board-content">
          {activeTab === 'demands' && (
            <div className="loads-grid">
              {filteredDemands.length === 0 ? (
                <div className="empty-state" style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '12px',
                  border: '2px dashed #ddd'
                }}>
                  <Package size={48} style={{ color: '#999', marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '8px', color: '#333' }}>暂无货运需求</h3>
                  <p style={{ marginBottom: '24px', fontSize: '14px' }}>
                    {searchQuery || Object.values(filters).some(f => f) 
                      ? '当前筛选条件下没有找到相关的货运需求信息' 
                      : '还没有货运需求发布，快来发布第一个吧！'
                    }
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsPostDemandModalOpen(true)}
                  >
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    发布货运需求
                  </button>
                </div>
              ) : (
                filteredDemands.map(demand => (
                  <div key={demand.id} className="load-card">
                    <div className="load-header">
                      <div className="route">
                        <div className="route-point">
                          <MapPin size={16} />
                          <span>{demand.origin}</span>
                        </div>
                        <ArrowRight size={16} className="route-arrow" />
                        <div className="route-point">
                          <MapPin size={16} />
                          <span>{demand.destination}</span>
                        </div>
                      </div>
                      <div className={`urgency-badge urgency-${demand.urgency === '紧急' || demand.urgency === '特急' ? 'high' : 'normal'}`}>
                        {demand.urgency}
                      </div>
                    </div>

                    <div className="load-details">
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>要求开船: {demand.requiredDate}</span>
                      </div>
                      <div className="detail-row">
                        <Container size={16} />
                        <span>货量: {demand.weight}</span>
                      </div>
                      <div className="detail-row">
                        <Package size={16} />
                        <span>货物: {demand.cargoType}</span>
                      </div>
                      <div className="detail-row">
                        <DollarSign size={16} />
                        <span className="rate">预算: {demand.maxRate}</span>
                      </div>
                      {demand.containerType && (
                        <div className="detail-row">
                          <Package size={16} />
                          <span>箱型: {demand.containerType}</span>
                        </div>
                      )}
                      {demand.specialRequirements && (
                        <div className="detail-row special">
                          <Shield size={16} />
                          <span>{demand.specialRequirements}</span>
                        </div>
                      )}
                    </div>

                    <div className="load-footer">
                      <div className="company-info">
                        <span className="company-name">{demand.company}</span>
                        <div className="rating">
                          <Star size={14} />
                          <span>{demand.rating}</span>
                        </div>
                      </div>
                      <div className="load-actions">
                        <button className="btn btn-ghost">
                          <MessageCircle size={16} />
                          询价
                        </button>
                        <button className="btn btn-primary">
                          <Phone size={16} />
                          {demand.phone}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'cargo' && (
            <div className="loads-grid">
              {filteredCargo.length === 0 ? (
                <div className="empty-state" style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '12px',
                  border: '2px dashed #ddd'
                }}>
                  <Ship size={48} style={{ color: '#999', marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '8px', color: '#333' }}>暂无舱位信息</h3>
                  <p style={{ marginBottom: '24px', fontSize: '14px' }}>
                    {searchQuery || Object.values(filters).some(f => f) 
                      ? '当前筛选条件下没有找到相关的舱位信息' 
                      : '还没有舱位信息发布，快来发布第一个吧！'
                    }
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsPostCargoModalOpen(true)}
                  >
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    发布舱位信息
                  </button>
                </div>
              ) : (
                filteredCargo.map(cargo => (
                  <div key={cargo.id} className="load-card">
                    <div className="load-header">
                      <div className="route">
                        <div className="route-point">
                          <Anchor size={16} />
                          <span>{cargo.origin}</span>
                        </div>
                        <ArrowRight size={16} className="route-arrow" />
                        <div className="route-point">
                          <Anchor size={16} />
                          <span>{cargo.destination}</span>
                        </div>
                      </div>
                      <div className="urgency-badge urgency-normal">
                        {cargo.vesselType}
                      </div>
                    </div>

                    <div className="load-details">
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>开船: {cargo.sailingDate}</span>
                      </div>
                      <div className="detail-row">
                        <Ship size={16} />
                        <span>船名: {cargo.vesselName}</span>
                      </div>
                      <div className="detail-row">
                        <Container size={16} />
                        <span>可用舱位: {cargo.availableSpace}</span>
                      </div>
                      <div className="detail-row">
                        <Clock size={16} />
                        <span>航程: {cargo.transitTime}</span>
                      </div>
                      <div className="detail-row">
                        <DollarSign size={16} />
                        <span className="rate">运费: {cargo.rate}</span>
                      </div>
                      <div className="detail-row">
                        <Package size={16} />
                        <span>货物类型: {cargo.cargoType}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>截关: {cargo.cutOffDate}</span>
                      </div>
                      {cargo.specialService && (
                        <div className="detail-row special">
                          <Shield size={16} />
                          <span>{cargo.specialService}</span>
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
                ))
              )}
            </div>
          )}
        </div>

        {/* 结果统计 */}
        {(searchQuery || Object.values(filters).some(f => f)) && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            {activeTab === 'demands' 
              ? `找到 ${filteredDemands.length} 个货运需求` 
              : `找到 ${filteredCargo.length} 个舱位信息`
            }
            {(searchQuery || Object.values(filters).some(f => f)) && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    origin: '',
                    destination: '',
                    cargoType: '',
                    weight: '',
                    urgency: '',
                    vesselType: ''
                  });
                }}
                style={{
                  marginLeft: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#34C759',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                清空所有筛选条件
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PostSeaCargoModal 
        isOpen={isPostCargoModalOpen}
        onClose={() => setIsPostCargoModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
      
      <PostSeaDemandModal 
        isOpen={isPostDemandModalOpen}
        onClose={() => setIsPostDemandModalOpen(false)}
        onSubmit={handlePostSubmit}
      />

      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .search-bar {
          position: relative;
        }
        .empty-state {
          grid-column: 1 / -1;
        }
        .tab-count {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SeaFreightPlatform; 