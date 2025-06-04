import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck,
  Package,
  Settings,
  Star,
  Plus,
  Eye,
  Heart,
  Phone,
  Calendar,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './LogisticsRental.css';

const LogisticsRental = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('equipment'); // equipment 或 demands
  const [equipment, setEquipment] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    priceRange: '',
    condition: '',
    brand: '',
    rentType: ''
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishType, setPublishType] = useState('equipment'); // equipment 或 demand

  // 设备类别
  const categories = [
    '全部类别', '运输车辆', '仓储设备', '装卸设备', '包装设备', 
    '称重设备', '安全设备', '办公设备', '配件耗材', '其他设备'
  ];

  // 价格范围
  const priceRanges = [
    '不限', '1000元以下', '1000-5000元', '5000-1万元', '1-5万元', '5-10万元', '10万元以上'
  ];

  // 设备状态
  const conditions = [
    '不限', '全新', '9成新', '8成新', '7成新', '6成新以下'
  ];

  // 租赁类型
  const rentTypes = [
    '不限', '短期租赁', '长期租赁', '分期购买', '融资租赁', '一次性购买'
  ];

  // 模拟设备数据
  const mockEquipment = [
    {
      id: 1,
      title: '福田欧马可货车出租',
      category: '运输车辆',
      brand: '福田',
      model: '欧马可BJ1048',
      year: 2022,
      condition: '9成新',
      price: 500,
      priceUnit: '天',
      rentType: '短期租赁',
      location: '北京市朝阳区',
      city: '北京',
      description: '4.2米厢式货车，载重3.5吨，车况良好，手续齐全，可长短租',
      images: ['/api/placeholder/300/200'],
      specifications: {
        '车长': '4.2米',
        '载重': '3.5吨',
        '排量': '2.8L',
        '变速箱': '手动'
      },
      owner: {
        name: '张师傅',
        company: '快运车队',
        phone: '138****1234',
        rating: 4.8,
        reviews: 156
      },
      available: true,
      publishDate: '2024-01-01',
      views: 234,
      favorites: 45,
      tags: ['手续齐全', '车况良好', '可长租', '价格优惠']
    },
    {
      id: 2,
      title: '二手叉车转让',
      category: '装卸设备',
      brand: '杭叉',
      model: 'CPCD30',
      year: 2020,
      condition: '8成新',
      price: 35000,
      priceUnit: '台',
      rentType: '一次性购买',
      location: '上海市嘉定区',
      city: '上海',
      description: '3吨电动叉车，使用时间短，保养良好，价格可议',
      images: ['/api/placeholder/300/200'],
      specifications: {
        '载重': '3吨',
        '提升高度': '3米',
        '动力类型': '电动',
        '工作时间': '8小时/天'
      },
      owner: {
        name: '李经理',
        company: '物流设备公司',
        phone: '159****5678',
        rating: 4.6,
        reviews: 89
      },
      available: true,
      publishDate: '2024-01-02',
      views: 178,
      favorites: 23,
      tags: ['保养良好', '价格可议', '支持试用', '可开发票']
    },
    {
      id: 3,
      title: '仓储货架批量出售',
      category: '仓储设备',
      brand: '定制',
      model: '中型货架',
      year: 2023,
      condition: '全新',
      price: 180,
      priceUnit: '组',
      rentType: '一次性购买',
      location: '广州市白云区',
      city: '广州',
      description: '仓库搬迁，大量货架低价处理，规格齐全，质量保证',
      images: ['/api/placeholder/300/200'],
      specifications: {
        '高度': '2米',
        '长度': '2米',
        '深度': '0.6米',
        '载重': '500kg/层'
      },
      owner: {
        name: '王总',
        company: '大型仓储企业',
        phone: '135****9012',
        rating: 4.9,
        reviews: 67
      },
      available: true,
      publishDate: '2024-01-03',
      views: 456,
      favorites: 78,
      tags: ['批量优惠', '质量保证', '规格齐全', '急售']
    }
  ];

  // 模拟需求数据
  const mockDemands = [
    {
      id: 1,
      title: '长期租赁冷藏车',
      category: '运输车辆',
      specifications: '7.6米冷藏车，温度控制-18℃至+25℃',
      budget: '3000-4000元/月',
      location: '深圳市南山区',
      city: '深圳',
      duration: '12个月',
      urgent: true,
      description: '电商公司需要长期租赁冷藏车进行生鲜配送，要求车况良好，手续齐全',
      requirements: [
        '车长7.6米左右',
        '温度控制范围-18℃至+25℃',
        '车况良好，年限不超过5年',
        '手续齐全，可开发票'
      ],
      contact: {
        name: '陈经理',
        company: '鲜果优选',
        phone: '189****3456'
      },
      publishDate: '2024-01-01',
      validUntil: '2024-02-01',
      views: 89,
      responses: 12
    },
    {
      id: 2,
      title: '求购二手打包机',
      category: '包装设备',
      specifications: '半自动打包机，适用于纸箱打包',
      budget: '5000-8000元',
      location: '杭州市余杭区',
      city: '杭州',
      duration: '立即购买',
      urgent: false,
      description: '小型物流公司扩张，需要购买二手打包机设备',
      requirements: [
        '半自动或全自动打包机',
        '适用于纸箱打包',
        '使用年限不超过3年',
        '功能正常，有保修'
      ],
      contact: {
        name: '刘总',
        company: '顺达物流',
        phone: '158****7890'
      },
      publishDate: '2024-01-02',
      validUntil: '2024-01-16',
      views: 67,
      responses: 8
    }
  ];

  // 页面加载时获取数据
  useEffect(() => {
    if (activeTab === 'equipment') {
      fetchEquipment();
    } else {
      fetchDemands();
    }
  }, [activeTab]);

  // 获取设备列表 - API接口
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/logistics-rental/equipment', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      setTimeout(() => {
        setEquipment(mockEquipment);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取设备列表失败:', error);
      setLoading(false);
    }
  };

  // 获取需求列表 - API接口
  const fetchDemands = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/logistics-rental/demands', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      setTimeout(() => {
        setDemands(mockDemands);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取需求列表失败:', error);
      setLoading(false);
    }
  };

  // 搜索设备/需求 - API接口
  const searchItems = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'equipment' ? '/api/logistics-rental/equipment/search' : '/api/logistics-rental/demands/search';
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     query: searchQuery,
      //     filters: filters
      //   })
      // });
      // const data = await response.json();
      
      // 模拟搜索逻辑
      const sourceData = activeTab === 'equipment' ? mockEquipment : mockDemands;
      let filteredData = sourceData;
      
      if (searchQuery) {
        filteredData = filteredData.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.category && filters.category !== '全部类别') {
        filteredData = filteredData.filter(item =>
          item.category === filters.category
        );
      }
      
      if (filters.city) {
        filteredData = filteredData.filter(item =>
          item.city.includes(filters.city)
        );
      }
      
      setTimeout(() => {
        if (activeTab === 'equipment') {
          setEquipment(filteredData);
        } else {
          setDemands(filteredData);
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('搜索失败:', error);
      setLoading(false);
    }
  };

  // 联系设备所有者 - API接口
  const contactOwner = async (itemId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/logistics-rental/contact/${itemId}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     message: 'interested',
      //     userInfo: 'currentUserInfo'
      //   })
      // });
      
      console.log('联系设备所有者:', itemId);
      alert('联系信息已发送，请等待回复');
    } catch (error) {
      console.error('联系失败:', error);
    }
  };

  // 收藏设备/需求 - API接口
  const favoriteItem = async (itemId, type) => {
    try {
      const endpoint = `/api/logistics-rental/${type}/${itemId}/favorite`;
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      
      console.log('收藏:', type, itemId);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  // 发布设备/需求 - API接口
  const publishItem = async (itemData, type) => {
    try {
      const endpoint = `/api/logistics-rental/${type}`;
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(itemData)
      // });
      
      console.log('发布:', type, itemData);
      setShowPublishModal(false);
      // 刷新列表
      if (type === 'equipment') {
        fetchEquipment();
      } else {
        fetchDemands();
      }
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleSearch = () => {
    searchItems();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setFilters({
      category: '',
      city: '',
      priceRange: '',
      condition: '',
      brand: '',
      rentType: ''
    });
  };

  return (
    <div className="logistics-rental">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="container">
          <h1>物流租售</h1>
          <p>物流设备拥有者发布租赁信息，需求方发布租赁需求，提供设备租售撮合服务</p>
        </div>
      </div>

      <div className="container">
        {/* 标签切换 */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => handleTabChange('equipment')}
          >
            <Truck size={20} />
            设备出租/出售
          </button>
          <button 
            className={`tab-btn ${activeTab === 'demands' ? 'active' : ''}`}
            onClick={() => handleTabChange('demands')}
          >
            <Settings size={20} />
            租赁需求
          </button>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="search-section">
        <div className="container">
          <div className="search-bar">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === 'equipment' 
                    ? "搜索设备名称、品牌或关键词" 
                    : "搜索需求类型或关键词"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                搜索
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="filters">
            <select 
              value={filters.category} 
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="城市"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            />

            {activeTab === 'equipment' && (
              <>
                <select 
                  value={filters.condition} 
                  onChange={(e) => setFilters({...filters, condition: e.target.value})}
                >
                  <option value="">设备状态</option>
                  {conditions.slice(1).map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>

                <select 
                  value={filters.rentType} 
                  onChange={(e) => setFilters({...filters, rentType: e.target.value})}
                >
                  <option value="">租赁类型</option>
                  {rentTypes.slice(1).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </>
            )}

            <select 
              value={filters.priceRange} 
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
            >
              <option value="">价格范围</option>
              {priceRanges.slice(1).map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          {/* 发布按钮 */}
          <div className="publish-section">
            <button 
              className="publish-btn"
              onClick={() => {
                setPublishType(activeTab === 'equipment' ? 'equipment' : 'demand');
                setShowPublishModal(true);
              }}
            >
              <Plus size={20} />
              {activeTab === 'equipment' ? '发布设备信息' : '发布租赁需求'}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* 内容区域 */}
        {activeTab === 'equipment' ? (
          // 设备列表
          <div className="equipment-grid">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>加载中...</p>
              </div>
            ) : (
              equipment.map(item => (
                <div key={item.id} className="equipment-card">
                  <div className="equipment-image">
                    <img src={item.images[0]} alt={item.title} />
                    <div className="condition-tag">{item.condition}</div>
                    {!item.available && <div className="unavailable-overlay">已租出</div>}
                  </div>

                  <div className="equipment-content">
                    <div className="equipment-header">
                      <h3 className="equipment-title">{item.title}</h3>
                      <div className="price">
                        <span className="amount">¥{item.price}</span>
                        <span className="unit">/{item.priceUnit}</span>
                      </div>
                    </div>

                    <div className="equipment-info">
                      <div className="info-item">
                        <Package size={14} />
                        <span>{item.brand} {item.model} · {item.year}年</span>
                      </div>
                      <div className="info-item">
                        <MapPin size={14} />
                        <span>{item.location}</span>
                      </div>
                      <div className="info-item">
                        <Wrench size={14} />
                        <span>{item.rentType}</span>
                      </div>
                    </div>

                    <p className="equipment-description">{item.description}</p>

                    <div className="equipment-tags">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    <div className="owner-info">
                      <div className="owner-basic">
                        <strong>{item.owner.name}</strong>
                        <span>· {item.owner.company}</span>
                      </div>
                      <div className="owner-rating">
                        <Star size={12} fill="currentColor" />
                        <span>{item.owner.rating}</span>
                        <span>({item.owner.reviews}评价)</span>
                      </div>
                    </div>
                  </div>

                  <div className="equipment-footer">
                    <div className="equipment-stats">
                      <span><Calendar size={14} /> {item.publishDate}</span>
                      <span><Eye size={14} /> {item.views}</span>
                      <span><Heart size={14} /> {item.favorites}</span>
                    </div>
                    
                    <div className="equipment-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => favoriteItem(item.id, 'equipment')}
                      >
                        <Heart size={16} />
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => setSelectedItem(item)}
                      >
                        查看详情
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => contactOwner(item.id)}
                        disabled={!item.available}
                      >
                        <Phone size={16} />
                        联系租主
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // 需求列表
          <div className="demands-list">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>加载中...</p>
              </div>
            ) : (
              demands.map(demand => (
                <div key={demand.id} className="demand-card">
                  <div className="demand-header">
                    <div className="demand-title">
                      <h3>{demand.title}</h3>
                      {demand.urgent && <span className="urgent-tag">急需</span>}
                    </div>
                    <div className="demand-budget">{demand.budget}</div>
                  </div>

                  <div className="demand-content">
                    <div className="demand-info">
                      <div className="info-item">
                        <Package size={14} />
                        <span>{demand.category}</span>
                      </div>
                      <div className="info-item">
                        <MapPin size={14} />
                        <span>{demand.location}</span>
                      </div>
                      <div className="info-item">
                        <Clock size={14} />
                        <span>{demand.duration}</span>
                      </div>
                    </div>

                    <div className="demand-specifications">
                      <strong>需求规格：</strong>
                      <span>{demand.specifications}</span>
                    </div>

                    <p className="demand-description">{demand.description}</p>

                    <div className="demand-requirements">
                      <strong>具体要求：</strong>
                      <ul>
                        {demand.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="contact-info">
                      <strong>联系人：</strong>
                      <span>{demand.contact.name} · {demand.contact.company}</span>
                    </div>
                  </div>

                  <div className="demand-footer">
                    <div className="demand-stats">
                      <span><Calendar size={14} /> {demand.publishDate}</span>
                      <span><Eye size={14} /> {demand.views}浏览</span>
                      <span><Phone size={14} /> {demand.responses}响应</span>
                      <span className="valid-until">有效期至 {demand.validUntil}</span>
                    </div>
                    
                    <div className="demand-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => favoriteItem(demand.id, 'demand')}
                      >
                        <Heart size={16} />
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => contactOwner(demand.id)}
                      >
                        响应需求
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 空状态 */}
        {((activeTab === 'equipment' && equipment.length === 0) || 
          (activeTab === 'demands' && demands.length === 0)) && !loading && (
          <div className="no-results">
            {activeTab === 'equipment' ? <Truck size={64} /> : <Settings size={64} />}
            <h3>暂无{activeTab === 'equipment' ? '设备' : '需求'}信息</h3>
            <p>试试调整搜索条件或发布您的{activeTab === 'equipment' ? '设备信息' : '租赁需求'}</p>
          </div>
        )}
      </div>

      {/* 设备详情模态框 */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content equipment-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="equipment-detail-content">
                <div className="detail-images">
                  <img src={selectedItem.images[0]} alt={selectedItem.title} />
                </div>

                <div className="detail-info">
                  <div className="price-section">
                    <div className="price-big">
                      ¥{selectedItem.price}
                      <span className="unit">/{selectedItem.priceUnit}</span>
                    </div>
                    <div className="price-tags">
                      <span className="condition-tag">{selectedItem.condition}</span>
                      <span className="rent-type-tag">{selectedItem.rentType}</span>
                    </div>
                  </div>

                  <div className="basic-info">
                    <h4>基本信息</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">品牌型号：</span>
                        <span>{selectedItem.brand} {selectedItem.model}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">生产年份：</span>
                        <span>{selectedItem.year}年</span>
                      </div>
                      <div className="info-item">
                        <span className="label">设备状态：</span>
                        <span>{selectedItem.condition}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">所在位置：</span>
                        <span>{selectedItem.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="specifications">
                    <h4>设备规格</h4>
                    <div className="spec-grid">
                      {Object.entries(selectedItem.specifications).map(([key, value]) => (
                        <div key={key} className="spec-item">
                          <span className="spec-label">{key}：</span>
                          <span className="spec-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="description">
                    <h4>详细描述</h4>
                    <p>{selectedItem.description}</p>
                  </div>

                  <div className="tags-section">
                    <h4>特色标签</h4>
                    <div className="tags">
                      {selectedItem.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="owner-section">
                    <h4>设备所有者</h4>
                    <div className="owner-detail">
                      <div className="owner-info">
                        <div className="name-company">
                          <strong>{selectedItem.owner.name}</strong>
                          <span>{selectedItem.owner.company}</span>
                        </div>
                        <div className="rating">
                          <Star size={16} fill="currentColor" />
                          <span>{selectedItem.owner.rating}</span>
                          <span>({selectedItem.owner.reviews}评价)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-icon"
                  onClick={() => favoriteItem(selectedItem.id, 'equipment')}
                >
                  <Heart size={20} />
                </button>
                <button 
                  className="btn-primary btn-large"
                  onClick={() => contactOwner(selectedItem.id)}
                  disabled={!selectedItem.available}
                >
                  <Phone size={20} />
                  联系租主
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发布模态框 */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{publishType === 'equipment' ? '发布设备信息' : '发布租赁需求'}</h2>
              <button onClick={() => setShowPublishModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {publishType === 'equipment' ? (
                <div className="publish-form">
                  <div className="form-group">
                    <label>设备标题</label>
                    <input type="text" placeholder="请输入设备名称和简要描述" />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>设备类别</label>
                      <select>
                        {categories.slice(1).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>设备品牌</label>
                      <input type="text" placeholder="请输入品牌" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>型号规格</label>
                      <input type="text" placeholder="请输入型号" />
                    </div>
                    <div className="form-group">
                      <label>生产年份</label>
                      <input type="number" placeholder="请输入年份" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>设备状态</label>
                      <select>
                        {conditions.slice(1).map(condition => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>租赁类型</label>
                      <select>
                        {rentTypes.slice(1).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>价格</label>
                      <input type="number" placeholder="请输入价格" />
                    </div>
                    <div className="form-group">
                      <label>价格单位</label>
                      <select>
                        <option value="天">天</option>
                        <option value="月">月</option>
                        <option value="年">年</option>
                        <option value="台">台</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>所在位置</label>
                    <input type="text" placeholder="请输入详细地址" />
                  </div>

                  <div className="form-group">
                    <label>设备描述</label>
                    <textarea placeholder="请详细描述设备的功能、特点和使用情况"></textarea>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowPublishModal(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => publishItem({}, 'equipment')}
                    >
                      立即发布
                    </button>
                  </div>
                </div>
              ) : (
                <div className="publish-form">
                  <div className="form-group">
                    <label>需求标题</label>
                    <input type="text" placeholder="请输入需求标题" />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>设备类别</label>
                      <select>
                        {categories.slice(1).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>预算范围</label>
                      <input type="text" placeholder="如：5000-8000元/月" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>设备规格</label>
                    <input type="text" placeholder="请描述所需设备的规格要求" />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>使用地点</label>
                      <input type="text" placeholder="请输入使用地点" />
                    </div>
                    <div className="form-group">
                      <label>使用时长</label>
                      <input type="text" placeholder="如：6个月、长期等" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>需求描述</label>
                    <textarea placeholder="请详细描述您的需求和用途"></textarea>
                  </div>

                  <div className="form-group">
                    <label>具体要求</label>
                    <textarea placeholder="请列出对设备的具体要求，如品牌、年限、功能等"></textarea>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowPublishModal(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => publishItem({}, 'demand')}
                    >
                      立即发布
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsRental; 