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
  Building,
  Trash2,
  RotateCcw,
  Box
} from 'lucide-react';
// import { useLanguage } from '../contexts/LanguageContext';
import PostLoadModal from '../components/PostLoadModal';
import PostTruckModal from '../components/PostTruckModal';
import { useAuth } from '../contexts/AuthContext';
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
  
  // 简化的筛选条件
  const [filters, setFilters] = useState({
    search: '',
    origin: '',
    destination: '',
    serviceType: '', // FTL, LTL
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('date'); // date, rate, weight

  const { isAuthenticated } = useAuth();

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
          deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          rate: '3,200元',
          rateValue: 3200,
          weight: '26吨',
          weightValue: 26000,
          serviceType: 'FTL',
          equipment: '厢式货车',
          length: '17.5米',
          company: '上海顺达物流',
          rating: 4.8,
          phone: '021-6666-8888',
          distance: '1,318公里',
          commodity: '电子设备',
          pallets: '标准托盘×26',
          requirements: '需要保险、防震包装',
          insurance: '货值保险100万',
          urgency: '普通'
        },
        {
          id: 2,
          origin: '广州',
          destination: '深圳',
          pickupDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          rate: '850元',
          rateValue: 850,
          weight: '3.5吨',
          weightValue: 3500,
          serviceType: 'LTL',
          equipment: '冷藏车',
          dimensions: '3×2×2米',
          company: '华南冷链',
          rating: 4.9,
          phone: '020-8888-6666',
          distance: '120公里',
          commodity: '生鲜食品',
          pallets: '保温箱×8',
          requirements: '温控2-8°C，当日配送',
          freightClass: '150级',
          density: '583公斤/立方米',
          stackable: false,
          urgency: '加急'
        },
        {
          id: 3,
          origin: '重庆',
          destination: '成都',
          pickupDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          rate: '4,800元',
          rateValue: 4800,
          weight: '32吨',
          weightValue: 32000,
          serviceType: 'FTL',
          equipment: '平板车',
          length: '13米',
          company: '川渝专线',
          rating: 4.7,
          phone: '023-7777-9999',
          distance: '308公里',
          commodity: '钢材',
          pallets: '散装',
          requirements: '需要绑扎固定，超重货物',
          insurance: '货值保险200万',
          urgency: '普通'
        },
        {
          id: 4,
          origin: '杭州',
          destination: '南京',
          pickupDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          rate: '420元',
          rateValue: 420,
          weight: '1.8吨',
          weightValue: 1800,
          serviceType: 'LTL',
          equipment: '厢式货车',
          dimensions: '2×1.5×1.5米',
          company: '江浙运输',
          rating: 4.6,
          phone: '0571-5555-3333',
          distance: '280公里',
          commodity: '纺织品',
          pallets: '纸箱×24',
          requirements: '防潮包装，轻拿轻放',
          freightClass: '85级',
          density: '400公斤/立方米',
          stackable: true,
          urgency: '普通'
        },
        {
          id: 5,
          origin: '西安',
          destination: '郑州',
          pickupDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          rate: '5,600元',
          rateValue: 5600,
          weight: '28吨',
          weightValue: 28000,
          serviceType: 'FTL',
          equipment: '高栏车',
          length: '13米',
          company: '中原物流',
          rating: 4.5,
          phone: '029-8888-7777',
          distance: '480公里',
          commodity: '建材',
          pallets: '散装',
          requirements: '需要苫布覆盖，防尘',
          insurance: '货值保险150万',
          urgency: '普通'
        },
        {
          id: 6,
          origin: '天津',
          destination: '济南',
          pickupDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          rate: '680元',
          rateValue: 680,
          weight: '2.2吨',
          weightValue: 2200,
          serviceType: 'LTL',
          equipment: '厢式货车',
          dimensions: '2.5×2×1.8米',
          company: '环渤海快运',
          rating: 4.7,
          phone: '022-6666-9999',
          distance: '360公里',
          commodity: '机械配件',
          pallets: '木托盘×6',
          requirements: '精密包装，防震',
          freightClass: '125级',
          density: '244公斤/立方米',
          stackable: false,
          urgency: '加急'
        },
        {
          id: 7,
          origin: '昆明',
          destination: '贵阳',
          pickupDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
          rate: '980元',
          rateValue: 980,
          weight: '4.2吨',
          weightValue: 4200,
          serviceType: 'LTL',
          equipment: '厢式货车',
          dimensions: '3×2×1.5米',
          company: '云贵物流',
          rating: 4.4,
          phone: '0871-7777-8888',
          distance: '450公里',
          commodity: '农产品',
          pallets: '保鲜箱×12',
          requirements: '通风透气，避免挤压',
          freightClass: '70级',
          density: '467公斤/立方米',
          stackable: true,
          urgency: '紧急'
        },
        {
          id: 8,
          origin: '福州',
          destination: '厦门',
          pickupDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
          rate: '7,200元',
          rateValue: 7200,
          weight: '30吨',
          weightValue: 30000,
          serviceType: 'FTL',
          equipment: '特种车',
          length: '16米',
          company: '闽南重载',
          rating: 4.9,
          phone: '0591-9999-5555',
          distance: '280公里',
          commodity: '大型设备',
          pallets: '专用支架',
          requirements: '超限运输，需要护送',
          insurance: '货值保险500万',
          urgency: '紧急'
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
          location: '广东广州',
          destination: '全国各地',
          availableDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          equipment: '厢式货车17.5米',
          capacity: '32吨',
          volume: '120立方米',
          serviceType: 'FTL',
          rateRange: '3.5-4.2元/公里',
          company: '粤运物流',
          rating: 4.8,
          phone: '020-8888-6666',
          preferredLanes: '珠三角至长三角、京津冀',
          specialServices: '双司机配送，GPS定位'
        },
        {
          id: 2,
          location: '浙江杭州',
          destination: '华东地区',
          availableDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          equipment: '冷藏车13米',
          capacity: '25',
          volume: '85立方米',
          serviceType: 'FTL',
          rateRange: '4.0-5.5元/公里',
          company: '江南冷链',
          rating: 4.9,
          phone: '0571-7777-8888',
          preferredLanes: '长三角冷链专线',
          specialServices: '恒温控制，食品级运输'
        },
        {
          id: 3,
          location: '河北石家庄',
          destination: '华北华中',
          availableDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          equipment: '零担专线',
          capacity: '20吨',
          volume: '60立方米',
          serviceType: 'LTL',
          rateRange: '0.8-1.5元/公斤',
          company: '华北零担',
          rating: 4.7,
          phone: '0311-6666-9999',
          preferredLanes: '京津冀至中原地区',
          specialServices: '门到门配送，代收货款'
        },
        {
          id: 4,
          location: '四川成都',
          destination: '西南各省',
          availableDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          equipment: '高栏车13米',
          capacity: '30吨',
          volume: '100立方米',
          serviceType: 'FTL',
          rateRange: '3.8-4.5元/公里',
          company: '川渝运输',
          rating: 4.6,
          phone: '028-5555-7777',
          preferredLanes: '西南环线，川渝云贵',
          specialServices: '山区运输经验，安全可靠'
        },
        {
          id: 5,
          location: '山东青岛',
          destination: '华东华北',
          availableDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          equipment: '平板车16米',
          capacity: '35吨',
          volume: '150立方米',
          serviceType: 'FTL',
          rateRange: '4.2-5.0元/公里',
          company: '齐鲁重载',
          rating: 4.8,
          phone: '0532-9999-8888',
          preferredLanes: '环渤海经济圈',
          specialServices: '重件运输，专业绑扎'
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
    // Implementation of applyFilters function
  };

  const resetFilters = () => {
    const resetState = {
      search: '',
      origin: '',
      destination: '',
      serviceType: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(resetState);
    setSearchQuery('');
  };

  const handlePostSubmit = async (postData) => {
    try {
      // 临时简化：直接添加到本地数据，不调用API
      if (!isAuthenticated) {
        alert('请先登录再发布信息');
        return;
      }

      console.log('收到的发布数据:', postData); // 调试日志
      
      if (postData.type === 'load') {
        const newLoad = {
          id: Date.now(),
          origin: postData.origin,
          destination: postData.destination,
          pickupDate: postData.pickupDate || postData.requiredDate,
          deliveryDate: postData.deliveryDate || postData.pickupDate,
          rate: postData.maxRate,
          rateValue: parseFloat(postData.maxRate?.replace(/[^\d.]/g, '')) || 0,
          weight: postData.weight,
          weightValue: parseFloat(postData.weight?.replace(/[^\d.]/g, '')) || 0,
          serviceType: postData.serviceType,
          equipment: postData.truckType || '标准货车',
          company: postData.companyName,
          rating: 4.5,
          phone: postData.contactPhone,
          commodity: postData.cargoType,
          urgency: postData.urgency,
          pallets: postData.originalData?.pallets || '',
          requirements: postData.specialRequirements || postData.notes || '',
          freightClass: postData.originalData?.freightClass || '',
          density: postData.originalData?.calculatedDensity || '',
          stackable: postData.originalData?.stackable || true
        };
        console.log('创建的新货源:', newLoad); // 调试日志
        setLoads(prev => [newLoad, ...prev]);
      } else {
        const newTruck = {
          id: Date.now(),
          location: postData.currentLocation || postData.origin,
          destination: postData.destination || postData.preferredDestination || '全国各地',
          availableDate: postData.availableDate,
          equipment: postData.equipment || postData.truckType,
          capacity: postData.capacity,
          volume: postData.volume || '',
          serviceType: postData.serviceType,
          rateRange: postData.rateRange || postData.rate,
          company: postData.companyName,
          rating: 4.5,
          phone: postData.contactPhone,
          preferredLanes: postData.originalData?.preferredLanes || `${postData.preferredOrigin || '任意地点'} 至 ${postData.preferredDestination || '全国各地'}`,
          specialServices: postData.truckFeatures || postData.specialServices || ''
        };
        console.log('创建的新车源:', newTruck); // 调试日志
        setTrucks(prev => [newTruck, ...prev]);
      }

      alert('发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请稍后重试');
    }
  };

  const filterData = (data) => {
    let filteredData = data.filter(item => {
      // 搜索过滤 - 扩展搜索字段
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          item.origin?.toLowerCase().includes(searchLower) ||
          item.destination?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.currentLocation?.toLowerCase().includes(searchLower) ||
          item.equipment?.toLowerCase().includes(searchLower) ||
          item.truckType?.toLowerCase().includes(searchLower) ||
          item.cargoType?.toLowerCase().includes(searchLower) ||
          item.commodity?.toLowerCase().includes(searchLower) ||
          item.company?.toLowerCase().includes(searchLower) ||
          item.companyName?.toLowerCase().includes(searchLower) ||
          item.specialServices?.toLowerCase().includes(searchLower) ||
          item.preferredLanes?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // 基础筛选条件
      if (filters.origin && 
          !item.origin?.toLowerCase().includes(filters.origin.toLowerCase()) && 
          !item.location?.toLowerCase().includes(filters.origin.toLowerCase())) return false;
      
      if (filters.destination && 
          !item.destination?.toLowerCase().includes(filters.destination.toLowerCase())) return false;
      
      // 服务类型筛选
      if (filters.serviceType && item.serviceType !== filters.serviceType) return false;

      // 取货日期范围筛选
      if (filters.dateFrom && new Date(item.pickupDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(item.pickupDate) > new Date(filters.dateTo)) return false;

      return true;
    });

    // 排序功能 - 扩展排序选项
    if (sortBy) {
      filteredData.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.pickupDate || b.availableDate || b.postedDate) - 
                   new Date(a.pickupDate || a.availableDate || a.postedDate);
          case 'rate':
            return (a.rateValue || a.maxRate || 0) - (b.rateValue || b.maxRate || 0);
          case 'weight':
            return (b.weightValue || b.weight || 0) - (a.weightValue || a.weight || 0);
          default:
            return 0;
        }
      });
    }

    return filteredData;
  };

  const filteredLoads = filterData(loads);
  const filteredTrucks = filterData(trucks);

  const hasAppliedFilters = Object.values(filters).some(value => value !== '');

  const getFilterDescription = () => {
    const descriptions = [];
    if (filters.origin) descriptions.push(`起始: ${filters.origin}`);
    if (filters.destination) descriptions.push(`目的: ${filters.destination}`);
    if (filters.serviceType) descriptions.push(`服务: ${filters.serviceType === 'FTL' ? '整车' : '零担'}`);
    if (filters.dateFrom) descriptions.push(`取货从: ${filters.dateFrom}`);
    if (filters.dateTo) descriptions.push(`取货到: ${filters.dateTo}`);
    if (searchQuery) descriptions.push(`搜索: ${searchQuery}`);
    
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

  // 处理发布按钮点击
  const handlePostLoadClick = () => {
    if (!isAuthenticated) {
      alert('请先登录再发布货源信息');
      return;
    }
    setIsPostLoadModalOpen(true);
  };

  const handlePostTruckClick = () => {
    if (!isAuthenticated) {
      alert('请先登录再发布车源信息');
      return;
    }
    setIsPostTruckModalOpen(true);
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
            onClick={handlePostLoadClick}
          >
            <Plus size={18} />
            发布货源信息
          </button>
          <button 
            className="btn btn-secondary post-btn"
            onClick={handlePostTruckClick}
          >
            <Plus size={18} />
            发布车源信息
          </button>
        </div>

        {/* 搜索筛选区域 - 重新设计 */}
        <div className="search-filter-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起始地、目的地、公司名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          <div className="filters-row">
            <select 
              value={filters.origin} 
              onChange={(e) => handleFilterChange('origin', e.target.value)}
            >
              <option value="">选择起始地</option>
              <option value="北京">北京</option>
              <option value="上海">上海</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="杭州">杭州</option>
              <option value="南京">南京</option>
              <option value="成都">成都</option>
              <option value="重庆">重庆</option>
            </select>

            <select 
              value={filters.destination} 
              onChange={(e) => handleFilterChange('destination', e.target.value)}
            >
              <option value="">选择目的地</option>
              <option value="北京">北京</option>
              <option value="上海">上海</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="杭州">杭州</option>
              <option value="南京">南京</option>
              <option value="成都">成都</option>
              <option value="重庆">重庆</option>
              <option value="全国">全国各地</option>
            </select>

            <select 
              value={filters.serviceType} 
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            >
              <option value="">全部类型</option>
              <option value="FTL">整车运输</option>
              <option value="LTL">零担运输</option>
            </select>

            {activeTab === 'loads' && (
              <div className="date-range">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  placeholder="取货开始日期"
                />
                <span>-</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  placeholder="取货结束日期"
                />
              </div>
            )}

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">按日期排序</option>
              <option value="rate">按价格排序</option>
              <option value="weight">按重量排序</option>
            </select>

            <button className="reset-btn" onClick={resetFilters}>
              <RotateCcw size={16} />
              重置
            </button>
          </div>

          {/* 活跃筛选标签 */}
          {hasAppliedFilters && (
            <div className="active-filters">
              <span className="results-text">
                找到 {activeTab === 'loads' ? filteredLoads.length : filteredTrucks.length} 条结果
              </span>
              <div className="filter-tags">
                {searchQuery && (
                  <span className="filter-tag">
                    搜索: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>×</button>
                  </span>
                )}
                {filters.origin && (
                  <span className="filter-tag">
                    起始: {filters.origin}
                    <button onClick={() => handleFilterChange('origin', '')}>×</button>
                  </span>
                )}
                {filters.destination && (
                  <span className="filter-tag">
                    目的: {filters.destination}
                    <button onClick={() => handleFilterChange('destination', '')}>×</button>
                  </span>
                )}
                {filters.serviceType && (
                  <span className="filter-tag">
                    类型: {filters.serviceType === 'FTL' ? '整车' : '零担'}
                    <button onClick={() => handleFilterChange('serviceType', '')}>×</button>
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="filter-tag">
                    日期: {filters.dateFrom || '不限'} - {filters.dateTo || '不限'}
                    <button onClick={() => { handleFilterChange('dateFrom', ''); handleFilterChange('dateTo', ''); }}>×</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="freight-content">
          {activeTab === 'loads' && (
            <div className="freight-list">
              {filteredLoads.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
                  <h3>暂无货源信息</h3>
                  <p>还没有符合条件的货源信息</p>
                </div>
              ) : (
                filteredLoads.map(load => (
                  <div key={load.id} className={`simple-card load-card ${load.serviceType?.toLowerCase()}`}>
                    <div className="card-main">
                      <div className="service-type">
                        {load.serviceType === 'FTL' ? (
                          <span className="ftl-badge">
                            <Truck size={16} />
                            整车 FTL
                          </span>
                        ) : (
                          <span className="ltl-badge">
                            <Package size={16} />
                            零担 LTL
                          </span>
                        )}
                      </div>
                      
                      <div className="route">
                        <span className="origin">{load.origin}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{load.destination}</span>
                      </div>
                      
                      <div className="cargo-type">
                        {load.commodity}
                      </div>
                      
                      <div className="weight">
                        <Scale size={14} />
                        {load.weight}
                      </div>
                      
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">{load.pickupDate?.split('-').slice(1).join('/') || '未知日期'}</span>
                      </div>
                      
                      <div className="price">
                        <DollarSign size={16} />
                        <span className="price-text">{load.rate || '价格面议'}</span>
                      </div>
                      
                      {load.urgency && load.urgency !== '普通' && (
                        <div className="urgency">{load.urgency}</div>
                      )}
                    </div>
                    
                    <div className="card-actions">
                      <button className="contact-btn" onClick={() => window.open(`tel:${load.phone}`)}>
                        <Phone size={14} />
                        联系
                      </button>
                      <button className="quote-btn">
                        <MessageCircle size={14} />
                        询价
                      </button>
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
                  <h3>暂无车源信息</h3>
                  <p>还没有符合条件的车源信息</p>
                </div>
              ) : (
                filteredTrucks.map(truck => (
                  <div key={truck.id} className={`simple-card truck-card ${truck.serviceType?.toLowerCase()}`}>
                    <div className="card-main">
                      <div className="service-type">
                        <span className="truck-badge">
                          <Truck size={16} />
                          车源 {truck.serviceType}
                        </span>
                      </div>
                      
                      <div className="route">
                        <span className="origin">{truck.location}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{truck.destination}</span>
                      </div>
                      
                      <div className="equipment">
                        {truck.equipment}
                      </div>
                      
                      <div className="capacity">
                        <Scale size={14} />
                        {truck.capacity}
                      </div>
                      
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">{truck.availableDate?.split('-').slice(1).join('/') || '未知日期'}</span>
                      </div>
                      
                      <div className="rate">
                        <DollarSign size={16} />
                        <span className="rate-text">{truck.rateRange || '价格面议'}</span>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button className="contact-btn" onClick={() => window.open(`tel:${truck.phone}`)}>
                        <Phone size={14} />
                        联系
                      </button>
                      <button className="quote-btn">
                        <MessageCircle size={14} />
                        询价
                      </button>
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
    </div>
  );
};

export default FreightBoard; 

