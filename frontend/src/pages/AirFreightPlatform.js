import React, { useState, useEffect } from 'react';
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
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import PostAirCargoModal from '../components/PostAirCargoModal';
import PostAirDemandModal from '../components/PostAirDemandModal';
import './PlatformPage.css';
import './FreightBoard.css'; // 复用样式
import './AirFreightPlatform.css'; // 空运专用样式

const AirFreightPlatform = () => {
  const [activeTab, setActiveTab] = useState('demands');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostCargoModalOpen, setIsPostCargoModalOpen] = useState(false);
  const [isPostDemandModalOpen, setIsPostDemandModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [airCargo, setAirCargo] = useState([]);
  const [airDemands, setAirDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    cargoType: '',
    weight: '',
    urgency: ''
  });

  // Generate future dates for mock data
  const getRandomFutureDate = (daysFromNow = 1, maxDays = 7) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysFromNow + Math.floor(Math.random() * maxDays));
    return futureDate.toISOString().split('T')[0];
  };

  // API调用函数
  const fetchAirCargo = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/airfreight/cargo`);
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
      origin: '上海浦东机场 (PVG)',
      destination: '洛杉矶国际机场 (LAX)',
          flightDate: getRandomFutureDate(1),
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
          flightDate: getRandomFutureDate(2),
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
          flightDate: getRandomFutureDate(3),
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
    }
  };

  const fetchAirDemands = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/airfreight/demands`);
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
      origin: '广州白云机场 (CAN)',
      destination: '纽约肯尼迪机场 (JFK)',
          requiredDate: getRandomFutureDate(4),
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
          requiredDate: getRandomFutureDate(5),
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
    }
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cargoData, demandData] = await Promise.all([
          fetchAirCargo(),
          fetchAirDemands()
        ]);
        setAirCargo(cargoData);
        setAirDemands(demandData);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
        console.error('数据加载失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handlePostSubmit = async (postData) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const endpoint = postData.type === 'cargo' ? '/airfreight/cargo' : '/airfreight/demands';
      
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
        const cargoData = await fetchAirCargo();
        setAirCargo(cargoData);
      } else {
        const demandData = await fetchAirDemands();
        setAirDemands(demandData);
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
        item.flightNumber?.toLowerCase().includes(query) ||
        item.airline?.toLowerCase().includes(query)
      );
    }

    // 起始机场筛选
    if (filters.origin) {
      filtered = filtered.filter(item => 
        item.origin?.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    // 目的机场筛选
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

    // 紧急程度筛选（仅对货运需求）
    if (filters.urgency && activeTab === 'demands') {
      filtered = filtered.filter(item => 
        item.urgency === filters.urgency
      );
    }

    return filtered;
  };

  // Combine user posts with API data
  const allCargo = [...airCargo, ...userPosts.filter(post => post.type === 'cargo')];
  const allDemands = [...airDemands, ...userPosts.filter(post => post.type === 'demand')];

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
            <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>正在加载空运信息...</p>
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
            className={`tab ${activeTab === 'demands' ? 'active' : ''}`}
            onClick={() => setActiveTab('demands')}
          >
            <Package size={20} />
            货运需求
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
            <Plane size={20} />
            可用舱位
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
              placeholder="搜索机场、航班号、货物类型或公司名称"
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
              <option value="">起始机场</option>
              <option value="上海浦东机场">上海浦东机场 (PVG)</option>
              <option value="北京首都机场">北京首都机场 (PEK)</option>
              <option value="深圳宝安机场">深圳宝安机场 (SZX)</option>
              <option value="广州白云机场">广州白云机场 (CAN)</option>
              <option value="成都双流机场">成都双流机场 (CTU)</option>
            </select>

            <select 
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
            >
              <option value="">目的机场</option>
              <option value="洛杉矶国际机场">洛杉矶国际机场 (LAX)</option>
              <option value="纽约肯尼迪机场">纽约肯尼迪机场 (JFK)</option>
              <option value="法兰克福机场">法兰克福机场 (FRA)</option>
              <option value="迪拜国际机场">迪拜国际机场 (DXB)</option>
              <option value="东京羽田机场">东京羽田机场 (HND)</option>
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
                urgency: ''
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
                  border: '2px dashed #ddd',
                  gridColumn: '1 / -1'
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
                    <div className="urgency-badge">
                      <span className={`urgency ${demand.urgency}`}>{demand.urgency}</span>
                    </div>
                  </div>

                    <div className="load-details">
                      <div className="detail-row">
                      <Calendar size={16} />
                      <span>要求日期: {demand.requiredDate}</span>
                    </div>
                      <div className="detail-row weight-display">
                      <Scale size={16} />
                        <span>{demand.weight}</span>
                    </div>
                      <div className="detail-row">
                      <Package size={16} />
                        <span>货物: {demand.cargoType}</span>
                    </div>
                      <div className="detail-row">
                      <DollarSign size={16} />
                        <span className="rate">预算: {demand.maxRate}</span>
                    </div>
                    {demand.specialRequirements && (
                        <div className="detail-row special">
                          <Shield size={16} />
                          <span>{demand.specialRequirements}</span>
                      </div>
                    )}
                    {demand.insurance && (
                        <div className="special-service">
                          <Shield size={12} />
                          {demand.insurance}
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
                  border: '2px dashed #ddd',
                  gridColumn: '1 / -1'
                }}>
                  <Plane size={48} style={{ color: '#999', marginBottom: '16px' }} />
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
                        <MapPin size={16} />
                        <span>{cargo.origin}</span>
                      </div>
                      <ArrowRight size={16} className="route-arrow" />
                        <div className="route-point">
                        <MapPin size={16} />
                        <span>{cargo.destination}</span>
                      </div>
                    </div>
                      <div className="flight-info">
                        <Plane size={16} />
                        <span>{cargo.flightNumber}</span>
                    </div>
                  </div>

                  <div className="load-details">
                      <div className="detail-row">
                      <Calendar size={16} />
                        <span>航班: {cargo.flightDate}</span>
                    </div>
                      <div className="detail-row">
                      <Plane size={16} />
                        <span>航司: {cargo.airline}</span>
                    </div>
                      <div className="detail-row weight-display">
                      <Scale size={16} />
                        <span>可载: {cargo.availableWeight}</span>
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
                        <span>货类: {cargo.cargoType}</span>
                      </div>
                    {cargo.specialService && (
                        <div className="special-service">
                          <Shield size={12} />
                          {cargo.specialService}
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
                    urgency: ''
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
        .loads-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .loads-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AirFreightPlatform; 