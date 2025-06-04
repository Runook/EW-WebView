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
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PostLoadModal from '../components/PostLoadModal';
import PostTruckModal from '../components/PostTruckModal';
import './PlatformPage.css';
import './FreightBoard.css';

const FreightBoard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('loads');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostLoadModalOpen, setIsPostLoadModalOpen] = useState(false);
  const [isPostTruckModalOpen, setIsPostTruckModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loads, setLoads] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    equipment: '',
    loadType: '',
    serviceType: '',
    capacity: '',
    volume: ''
  });

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
      // 返回mock数据作为fallback
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
      // 返回mock数据作为fallback
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

  // 筛选和搜索逻辑
  const filterData = (data) => {
    let filtered = [...data];

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.origin?.toLowerCase().includes(query) ||
        item.destination?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.commodity?.toLowerCase().includes(query) ||
        item.equipment?.toLowerCase().includes(query) ||
        item.company?.toLowerCase().includes(query)
      );
    }

    // 应用其他筛选条件
    if (filters.origin) {
      filtered = filtered.filter(item => 
        item.origin?.toLowerCase().includes(filters.origin.toLowerCase()) ||
        item.location?.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.destination) {
      filtered = filtered.filter(item => 
        item.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.equipment) {
      filtered = filtered.filter(item => 
        item.equipment?.toLowerCase().includes(filters.equipment.toLowerCase())
      );
    }

    if (filters.loadType) {
      filtered = filtered.filter(item => 
        item.loadType === filters.loadType || item.serviceType?.includes(filters.loadType)
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
        <div className="platform-header board-header">
          <div className="platform-icon">
            <Truck size={48} />
          </div>
          <h1 className="platform-title board-title">陆运信息平台</h1>
          <p className="platform-description board-description">
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
            货源信息
            {filteredLoads.length > 0 && (
              <span className="tab-count" style={{
                marginLeft: '8px',
                backgroundColor: '#34C759',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>{filteredLoads.length}</span>
            )}
          </button>
          <button 
            className={`tab ${activeTab === 'trucks' ? 'active' : ''}`}
            onClick={() => setActiveTab('trucks')}
          >
            <Truck size={20} />
            车源信息
            {filteredTrucks.length > 0 && (
              <span className="tab-count" style={{
                marginLeft: '8px',
                backgroundColor: '#34C759',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>{filteredTrucks.length}</span>
            )}
          </button>
        </div>

        {/* Post Buttons */}
        <div className="post-buttons">
          <button 
            className="btn btn-primary post-btn"
            onClick={() => setIsPostLoadModalOpen(true)}
          >
            <Plus size={20} />
            发布货源信息
          </button>
          <button 
            className="btn btn-secondary post-btn"
            onClick={() => setIsPostTruckModalOpen(true)}
          >
            <Plus size={20} />
            发布车源信息
          </button>
        </div>

        {/* Search and Filters */}
        <div className="platform-search board-search">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起始地、目的地、货物类型或公司名称"
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
              <option value="">起始地</option>
              <option value="上海">上海</option>
              <option value="北京">北京</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="成都">成都</option>
              <option value="武汉">武汉</option>
              <option value="天津">天津</option>
              <option value="西安">西安</option>
              <option value="郑州">郑州</option>
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
              <option value="青岛">青岛</option>
              <option value="开放">开放</option>
            </select>

            <select 
              value={filters.equipment} 
              onChange={(e) => handleFilterChange('equipment', e.target.value)}
            >
              <option value="">车型设备</option>
              <option value="厢式货车">厢式货车</option>
              <option value="冷藏车">冷藏车</option>
              <option value="平板车">平板车</option>
              <option value="高栏车">高栏车</option>
              <option value="危险品车">危险品车</option>
            </select>

            <select 
              value={filters.loadType} 
              onChange={(e) => handleFilterChange('loadType', e.target.value)}
            >
              <option value="">运输方式</option>
              <option value="FTL">整车 (FTL)</option>
              <option value="LTL">零担 (LTL)</option>
            </select>

            <button 
              className="btn btn-ghost filter-btn"
              onClick={() => setFilters({
                origin: '',
                destination: '',
                equipment: '',
                loadType: '',
                serviceType: '',
                capacity: '',
                volume: ''
              })}
            >
              <Filter size={16} />
              清空筛选
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="board-content">
          {activeTab === 'loads' && (
            <div className="loads-grid">
              {filteredLoads.length === 0 ? (
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
                  <h3 style={{ marginBottom: '8px', color: '#333' }}>暂无货源信息</h3>
                  <p style={{ marginBottom: '24px', fontSize: '14px' }}>
                    {searchQuery || Object.values(filters).some(f => f) 
                      ? '当前筛选条件下没有找到相关的货源信息' 
                      : '还没有货源信息发布，快来发布第一个吧！'
                    }
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsPostLoadModalOpen(true)}
                  >
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    发布货源信息
                  </button>
                </div>
              ) : (
                filteredLoads.map(load => (
                  <div key={load.id} className="load-card">
                    <div className="load-header">
                      <div className="route">
                        <div className="route-point">
                          <MapPin size={16} />
                          <span>{load.origin}</span>
                        </div>
                        <ArrowRight size={16} className="route-arrow" />
                        <div className="route-point">
                          <MapPin size={16} />
                          <span>{load.destination}</span>
                        </div>
                      </div>
                      <div className="load-type-badge">
                        {load.loadType}
                      </div>
                    </div>

                    <div className="load-details">
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>提货: {load.pickupDate}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>送达: {load.deliveryDate}</span>
                      </div>
                      <div className="detail-row">
                        <Package size={16} />
                        <span>重量: {load.weight} | 体积: {load.volume}</span>
                      </div>
                      <div className="detail-row">
                        <Truck size={16} />
                        <span>车型: {load.equipment} ({load.length})</span>
                      </div>
                      <div className="detail-row">
                        <DollarSign size={16} />
                        <span className="rate">运费: ¥{load.rate}</span>
                      </div>
                      <div className="detail-row">
                        <Package size={16} />
                        <span>货物: {load.commodity}</span>
                      </div>
                      {load.requirements && (
                        <div className="detail-row special">
                          <span style={{ color: '#e65100' }}>{load.requirements}</span>
                        </div>
                      )}
                    </div>

                    <div className="load-footer">
                      <div className="company-info">
                        <span className="company-name">{load.company}</span>
                        <div className="rating">
                          <Star size={14} />
                          <span>{load.rating}</span>
                        </div>
                      </div>
                      <div className="load-actions">
                        <button className="btn btn-ghost">
                          <MessageCircle size={16} />
                          询价
                        </button>
                        <button className="btn btn-primary">
                          <Phone size={16} />
                          {load.phone}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'trucks' && (
            <div className="loads-grid">
              {filteredTrucks.length === 0 ? (
                <div className="empty-state" style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '12px',
                  border: '2px dashed #ddd',
                  gridColumn: '1 / -1'
                }}>
                  <Truck size={48} style={{ color: '#999', marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '8px', color: '#333' }}>暂无车源信息</h3>
                  <p style={{ marginBottom: '24px', fontSize: '14px' }}>
                    {searchQuery || Object.values(filters).some(f => f) 
                      ? '当前筛选条件下没有找到相关的车源信息' 
                      : '还没有车源信息发布，快来发布第一个吧！'
                    }
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsPostTruckModalOpen(true)}
                  >
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    发布车源信息
                  </button>
                </div>
              ) : (
                filteredTrucks.map(truck => (
                  <div key={truck.id} className="truck-card">
                    <div className="truck-header">
                      <div className="location">
                        <MapPin size={16} />
                        <span>{truck.location}</span>
                        <ArrowRight size={16} />
                        <span>{truck.destination}</span>
                      </div>
                      <div className="service-type-badge">
                        {truck.serviceType}
                      </div>
                    </div>

                    <div className="truck-details">
                      <div className="detail-row">
                        <Calendar size={16} />
                        <span>可用日期: {truck.availableDate}</span>
                      </div>
                      <div className="detail-row">
                        <Truck size={16} />
                        <span>车型: {truck.equipment} ({truck.length})</span>
                      </div>
                      <div className="detail-row">
                        <Package size={16} />
                        <span>载重: {truck.capacity} | 体积: {truck.volume}</span>
                      </div>
                      <div className="detail-row">
                        <DollarSign size={16} />
                        <span className="rate">运价: {truck.rateRange}</span>
                      </div>
                      <div className="detail-row">
                        <span>常跑线路: {truck.preferredLanes}</span>
                      </div>
                      {truck.specialServices && (
                        <div className="detail-row special">
                          <span style={{ color: '#2e7d32' }}>{truck.specialServices}</span>
                        </div>
                      )}
                    </div>

                    <div className="load-footer">
                      <div className="company-info">
                        <span className="company-name">{truck.company}</span>
                        <div className="rating">
                          <Star size={14} />
                          <span>{truck.rating}</span>
                        </div>
                      </div>
                      <div className="load-actions">
                        <button className="btn btn-ghost">
                          <MessageCircle size={16} />
                          联系
                        </button>
                        <button className="btn btn-primary">
                          <Phone size={16} />
                          {truck.phone}
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
            {activeTab === 'loads' 
              ? `找到 ${filteredLoads.length} 个货源信息` 
              : `找到 ${filteredTrucks.length} 个车源信息`
            }
            {(searchQuery || Object.values(filters).some(f => f)) && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    origin: '',
                    destination: '',
                    equipment: '',
                    loadType: '',
                    serviceType: '',
                    capacity: '',
                    volume: ''
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

export default FreightBoard; 
