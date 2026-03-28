import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Phone, Building, Package, Search, Filter, ChevronDown, ImageIcon, Camera, MapPin, Calendar, Eye, Plus } from 'lucide-react';
import { generateRentalSlug } from './RentalDetail';
import './LogisticsRental.css';
import { PATH_LOGISTICS_RENTAL, PATH_LOGISTICS_RENTAL_ONLY, PATH_LOGISTICS_SALE_ONLY } from '../constants/servicePaths';
import { useNotification } from '../components/common/Notification';
import { apiClient } from '../utils/apiClient';
const LogisticsRental = ({ defaultTab }) => {

  const [activeTab, setActiveTab] = useState(defaultTab || 'rental');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [rentalItems, setRentalItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const { apiError } = useNotification();

  // 筛选条件状态
  const [filters, setFilters] = useState({
    category: '',       // 分类
    location: '',       // 地点
    priceRange: '',     // 价格范围
    condition: '',      // 设备状态
    brand: '',          // 品牌
    rentalPeriod: '',   // 租期
    publishTime: ''     // 发布时间
  });

  // 物流出租分类
  const rentalCategories = [
    '卡车',
    '叉车',
    '仓库/物流园区',
    '船舶/飞机',
    '车架/车身',
    '海柜干柜',
    '特殊设备',
    '第三方物流',
    '家庭仓/车库/停车场',
    '卡车车位',
    '仓库/海外仓'
  ];

  // 物流出售分类
  const saleCategories = [
    '卡车出售',
    '叉车货架',
    '仓库/海外仓',
    '配件零件',
    '车架',
    '海柜干柜',
    '特殊设备',
    '公司MC DOT',
    '清库存',
    '生意买卖/转让',
    '地区分站加盟',
    '出FBA预约'
  ];

  // 卡车类型（用于卡车分类的细分）
  // eslint-disable-next-line no-unused-vars
  const truckTypes = [
    '轻型卡车',
    '中型卡车',
    '重型卡车',
    '货车',
    '轻型厢式卡车',
    '中型厢式卡车',
    '平头卡车',
    '冷藏车',
    '平板车',
    '日间驾驶室',
    '卧铺车',
    '场地卡车'
  ];

  // 获取租赁数据
  const fetchRentals = async () => {
    try {
      const response = await apiClient.get('/rentals');
      if (response.success) {
        setRentalItems(response.data);
      }
    } catch (error) {
      console.error('获取租赁数据失败:', error);
      apiError(error);
    }
  };

  // 获取出售数据
  const fetchSales = async () => {
    try {
      const response = await apiClient.get('/sales');
      if (response.success) {
        setSaleItems(response.data);
      }
    } catch (error) {
      console.error('获取出售数据失败:', error);
      apiError(error);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchRentals();
    fetchSales();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only load

  useEffect(() => {
    if (defaultTab) { setActiveTab(defaultTab); return; }
    const t = searchParams.get('tab');
    if (t === 'sale') setActiveTab('sale');
    else if (t === 'rental') setActiveTab('rental');
  }, [searchParams, defaultTab]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set('tab', tab);
      return n;
    });
  };

  // 筛选函数
  const applyFilters = (items) => {
    return items.filter(item => {
      // 搜索关键词匹配
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          item.title?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.brand?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // 分类筛选
      if (filters.category && item.category !== filters.category) return false;

      // 地点筛选
      if (filters.location && item.location !== filters.location) return false;

      // 设备状态筛选
      if (filters.condition && item.condition !== filters.condition) return false;

      // 品牌筛选
      if (filters.brand && item.brand !== filters.brand) return false;

      // 发布时间筛选
      if (filters.publishTime && filters.publishTime !== '全部时间') {
        const publishDate = new Date(item.publishDate);
        const now = new Date();
        const diffTime = Math.abs(now - publishDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.publishTime) {
          case '今天':
            if (diffDays > 1) return false;
            break;
          case '3天内':
            if (diffDays > 3) return false;
            break;
          case '1周内':
            if (diffDays > 7) return false;
            break;
          case '1个月内':
            if (diffDays > 30) return false;
            break;
          default:
            break;
        }
      }

      // 价格范围筛选
      if (filters.priceRange && filters.priceRange !== '不限') {
        const itemPrice = item.price || '';
        const priceNum = parseInt(itemPrice.replace(/[^\d]/g, ''));

        if (activeTab === 'rental') {
          switch (filters.priceRange) {
            case '$500以下/月':
              if (priceNum >= 500) return false;
              break;
            case '$500-1000/月':
              if (priceNum < 500 || priceNum > 1000) return false;
              break;
            case '$1000-2000/月':
              if (priceNum < 1000 || priceNum > 2000) return false;
              break;
            case '$2000-5000/月':
              if (priceNum < 2000 || priceNum > 5000) return false;
              break;
            case '$5000-10000/月':
              if (priceNum < 5000 || priceNum > 10000) return false;
              break;
            case '$10000以上/月':
              if (priceNum < 10000) return false;
              break;
            default:
              break;
          }
        } else {
          switch (filters.priceRange) {
            case '$5000以下':
              if (priceNum >= 5000) return false;
              break;
            case '$5000-10000':
              if (priceNum < 5000 || priceNum > 10000) return false;
              break;
            case '$10000-50000':
              if (priceNum < 10000 || priceNum > 50000) return false;
              break;
            case '$50000-100000':
              if (priceNum < 50000 || priceNum > 100000) return false;
              break;
            case '$100000以上':
              if (priceNum < 100000) return false;
              break;
            default:
              break;
          }
        }
      }

      return true;
    });
  };

  // 过滤数据
  const filteredRentalItems = applyFilters(rentalItems);
  const filteredSaleItems = applyFilters(saleItems);

  // 处理筛选条件变化
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 获取当前分类选项
  const getCurrentCategories = () => {
    return activeTab === 'rental' ? rentalCategories : saleCategories;
  };

  // 获取当前数据
  const getCurrentItems = () => {
    return activeTab === 'rental' ? filteredRentalItems : filteredSaleItems;
  };

  const getDetailLink = (item) => `/${activeTab === 'rental' ? 'rental' : 'sale'}/${item.id}/${generateRentalSlug(item)}`;

  const currentBasePath = defaultTab === 'sale' ? PATH_LOGISTICS_SALE_ONLY
    : defaultTab === 'rental' ? PATH_LOGISTICS_RENTAL_ONLY
    : PATH_LOGISTICS_RENTAL;

  // 定义地点、状态、租期和发布时间选项
  const locations = [
    'Alabama (AL)', 'Alaska (AK)', 'Arizona (AZ)', 'Arkansas (AR)', 'California (CA)',
    'Colorado (CO)', 'Connecticut (CT)', 'Delaware (DE)', 'Florida (FL)', 'Georgia (GA)',
    'Hawaii (HI)', 'Idaho (ID)', 'Illinois (IL)', 'Indiana (IN)', 'Iowa (IA)',
    'Kansas (KS)', 'Kentucky (KY)', 'Louisiana (LA)', 'Maine (ME)', 'Maryland (MD)',
    'Massachusetts (MA)', 'Michigan (MI)', 'Minnesota (MN)', 'Mississippi (MS)', 'Missouri (MO)',
    'Montana (MT)', 'Nebraska (NE)', 'Nevada (NV)', 'New Hampshire (NH)', 'New Jersey (NJ)',
    'New Mexico (NM)', 'New York (NY)', 'North Carolina (NC)', 'North Dakota (ND)', 'Ohio (OH)',
    'Oklahoma (OK)', 'Oregon (OR)', 'Pennsylvania (PA)', 'Rhode Island (RI)', 'South Carolina (SC)',
    'South Dakota (SD)', 'Tennessee (TN)', 'Texas (TX)', 'Utah (UT)', 'Vermont (VT)',
    'Virginia (VA)', 'Washington (WA)', 'West Virginia (WV)', 'Wisconsin (WI)', 'Wyoming (WY)',
    'Washington D.C.'
  ];
  const conditions = ['全新', '9成新', '8成新', '7成新', '6成新', '5成新', '4成新', '3成新', '2成新', '1成新'];
  const rentalPeriods = ['不限', '1天', '3天', '1周', '1个月'];
  const publishTimeOptions = ['全部时间', '今天', '3天内', '1周内', '1个月内'];

  return (
    <div className="lr-page">
      {/* Hero */}
      <div className="lr-hero">
        <div className="lr-hero-bg"><div className="lr-orb lr-orb-1"></div><div className="lr-orb lr-orb-2"></div></div>
        <div className="lr-hero-content">
          <h1>{defaultTab === 'rental' ? '物流出租' : defaultTab === 'sale' ? '物流出售' : '物流租售'}</h1>
          <p>{defaultTab === 'rental' ? '专业的物流设备租赁平台' : defaultTab === 'sale' ? '专业的物流设备买卖平台' : '专业的物流设备租赁与买卖平台'}</p>
        </div>
      </div>

      <div className="lr-body">
        {/* Tab + Controls Row */}
        <div className="lr-toolbar">
          {!defaultTab && (
            <div className="lr-tabs">
              <button type="button" className={`lr-tab ${activeTab === 'rental' ? 'lr-tab-active' : ''}`} onClick={() => setTab('rental')}>
                <Building size={16} />
                物流出租
              </button>
              <button type="button" className={`lr-tab ${activeTab === 'sale' ? 'lr-tab-active' : ''}`} onClick={() => setTab('sale')}>
                <Package size={16} />
                物流出售
              </button>
            </div>
          )}

          <div className="lr-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={activeTab === 'rental' ? '搜索租赁设备...' : '搜索出售物品...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="lr-actions">
            <button className={`lr-filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={15} />
              筛选
              <ChevronDown size={14} className={showFilters ? 'rotated' : ''} />
            </button>
            <Link
              className="lr-post-btn"
              to={`${currentBasePath}/post?mode=${activeTab === 'rental' ? 'rental' : 'sale'}`}
            >
              <Plus size={15} />
              {activeTab === 'rental' ? '发布出租' : '发布出售'}
            </Link>
          </div>
        </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>分类</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">全部分类</option>
                {getCurrentCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>地点</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">全部地点</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>价格范围</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                <option value="">全部价格</option>
                {getCurrentCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>设备状态</label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
              >
                <option value="">全部状态</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            {activeTab === 'rental' && (
              <div className="filter-group">
                <label>租期</label>
                <select
                  value={filters.rentalPeriod}
                  onChange={(e) => handleFilterChange('rentalPeriod', e.target.value)}
                >
                  <option value="">全部租期</option>
                  {rentalPeriods.slice(1).map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <label>发布时间</label>
              <select
                value={filters.publishTime}
                onChange={(e) => handleFilterChange('publishTime', e.target.value)}
              >
                <option value="">全部时间</option>
                {publishTimeOptions.slice(1).map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="lr-list">
        {getCurrentItems().map(item => (
          <div key={item.id} className="lr-card">
            <div className="lr-card-thumb">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[item.coverImageIndex || 0]} alt={item.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'; }} />
              ) : (
                <div className="lr-no-img"><ImageIcon size={28} /></div>
              )}
              {item.images && item.images.length > 1 && (
                <span className="lr-img-count"><Camera size={11} /> {item.images.length}</span>
              )}
            </div>

            <div className="lr-card-body">
              <div className="lr-card-row1">
                <Link to={getDetailLink(item)} className="lr-card-title">{item.title}</Link>
                <span className="lr-card-badge">{activeTab === 'rental' ? '出租' : '出售'}</span>
              </div>

              <div className="lr-card-price">{item.price && !String(item.price).startsWith('$') ? '$' + item.price : item.price}</div>

              <div className="lr-card-tags">
                <span>{item.category}</span>
                {item.subCategory && <span>{item.subCategory}</span>}
                <span>{item.condition}</span>
                {item.brand && <span>{item.brand}</span>}
              </div>

              <p className="lr-card-desc">{item.description}</p>

              <div className="lr-card-bottom">
                <div className="lr-card-meta">
                  <span className="lr-meta-loc"><MapPin size={13} /> {item.location}</span>
                  <span className="lr-meta-date"><Calendar size={13} /> {item.posted}</span>
                  <span className="lr-meta-view"><Eye size={13} /> {item.views}</span>
                </div>
                <div className="lr-card-btns">
                  <button className="lr-btn-phone" onClick={(e) => { e.stopPropagation(); const phoneUS = item.contact?.phone || item.contactPhone; const phoneCN = item.contact?.phoneCN || item.contactPhoneCN; let msg = ''; if (phoneUS) msg += `电话(美国): ${phoneUS}\n`; if (phoneCN) msg += `电话(中国): ${phoneCN}\n`; if (!msg) msg = '暂无电话信息'; alert(msg.trim()); }}><Phone size={13} /> 查看电话</button>
                  <Link to={getDetailLink(item)} className="lr-btn-detail">查看详情</Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {getCurrentItems().length === 0 && (
          <div className="lr-empty">
            {activeTab === 'rental' ? <Building size={48} /> : <Package size={48} />}
            <h3>暂无{activeTab === 'rental' ? '租赁' : '出售'}信息</h3>
            <p>试试调整搜索条件或发布您的{activeTab === 'rental' ? '出租' : '出售'}信息</p>
          </div>
        )}
      </div>
      </div>{/* end lr-body */}

    </div>
  );
};

export default LogisticsRental;