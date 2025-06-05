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
    serviceType: '',
    minRate: '',
    maxRate: '',
    minWeight: '',
    maxWeight: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    origin: '',
    destination: '',
    equipment: '',
    serviceType: '',
    minRate: '',
    maxRate: '',
    minWeight: '',
    maxWeight: ''
  });
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, rate-low, rate-high, weight

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
          capacity: '25吨',
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
    setAppliedFilters({ ...filters });
    setAppliedSearchQuery(searchQuery);
  };

  const resetFilters = () => {
    const resetState = {
      origin: '',
      destination: '',
      equipment: '',
      serviceType: '',
      minRate: '',
      maxRate: '',
      minWeight: '',
      maxWeight: ''
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
    let filteredData = data.filter(item => {
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

      // 基础筛选条件
      if (appliedFilters.origin && !item.origin?.toLowerCase().includes(appliedFilters.origin.toLowerCase()) && 
          !item.location?.toLowerCase().includes(appliedFilters.origin.toLowerCase())) return false;
      
      if (appliedFilters.destination && !item.destination?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
      
      if (appliedFilters.equipment && !item.equipment?.toLowerCase().includes(appliedFilters.equipment.toLowerCase())) return false;
      
      if (appliedFilters.serviceType && item.serviceType !== appliedFilters.serviceType) return false;

      // 价格范围筛选
      if (appliedFilters.minRate) {
        const minRate = parseInt(appliedFilters.minRate);
        if (item.rateValue && item.rateValue < minRate) return false;
      }
      
      if (appliedFilters.maxRate) {
        const maxRate = parseInt(appliedFilters.maxRate);
        if (item.rateValue && item.rateValue > maxRate) return false;
      }

      // 重量范围筛选
      if (appliedFilters.minWeight) {
        const minWeight = parseInt(appliedFilters.minWeight);
        if (item.weightValue && item.weightValue < minWeight) return false;
      }
      
      if (appliedFilters.maxWeight) {
        const maxWeight = parseInt(appliedFilters.maxWeight);
        if (item.weightValue && item.weightValue > maxWeight) return false;
      }

      return true;
    });

    // 排序功能
    if (sortBy) {
      filteredData.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.pickupDate || b.availableDate) - new Date(a.pickupDate || a.availableDate);
          case 'rate-low':
            return (a.rateValue || 0) - (b.rateValue || 0);
          case 'rate-high':
            return (b.rateValue || 0) - (a.rateValue || 0);
          case 'weight':
            return (b.weightValue || 0) - (a.weightValue || 0);
          default:
            return 0;
        }
      });
    }

    return filteredData;
  };

  const filteredLoads = filterData(loads);
  const filteredTrucks = filterData(trucks);

  const hasAppliedFilters = Object.values(appliedFilters).some(value => value !== '') || appliedSearchQuery !== '';

  const getFilterDescription = () => {
    const descriptions = [];
    if (appliedFilters.origin) descriptions.push(`起始: ${appliedFilters.origin}`);
    if (appliedFilters.destination) descriptions.push(`目的: ${appliedFilters.destination}`);
    if (appliedFilters.equipment) descriptions.push(`车型: ${appliedFilters.equipment}`);
    if (appliedFilters.serviceType) descriptions.push(`服务: ${appliedFilters.serviceType === 'FTL' ? '整车' : '零担'}`);
    if (appliedFilters.minRate) descriptions.push(`最低价: ${appliedFilters.minRate}元`);
    if (appliedFilters.maxRate) descriptions.push(`最高价: ${appliedFilters.maxRate}元`);
    if (appliedFilters.minWeight) descriptions.push(`最低重量: ${appliedFilters.minWeight}kg`);
    if (appliedFilters.maxWeight) descriptions.push(`最高重量: ${appliedFilters.maxWeight}kg`);
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

        {/* 搜索筛选区域 */}
        <div className="search-filter-section">
          {/* 主搜索栏 */}
          <div className="main-search">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder="搜索起始地、目的地、公司名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
              <button className="search-submit-btn" onClick={applyFilters}>
                搜索
              </button>
            </div>
          </div>

          {/* 快速筛选 */}
          <div className="quick-filters">
            <div className="filter-group">
              <label>起始地</label>
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
                <option value="西安">西安</option>
                <option value="郑州">郑州</option>
                <option value="天津">天津</option>
                <option value="济南">济南</option>
                <option value="青岛">青岛</option>
                <option value="福州">福州</option>
                <option value="厦门">厦门</option>
                <option value="昆明">昆明</option>
                <option value="贵阳">贵阳</option>
              </select>
            </div>

            <div className="filter-group">
              <label>目的地</label>
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
                <option value="西安">西安</option>
                <option value="郑州">郑州</option>
                <option value="天津">天津</option>
                <option value="济南">济南</option>
                <option value="青岛">青岛</option>
                <option value="福州">福州</option>
                <option value="厦门">厦门</option>
                <option value="昆明">昆明</option>
                <option value="贵阳">贵阳</option>
                <option value="全国">全国各地</option>
              </select>
            </div>

            <div className="filter-group">
              <label>车型</label>
              <select 
                value={filters.equipment} 
                onChange={(e) => handleFilterChange('equipment', e.target.value)}
              >
                <option value="">选择车型</option>
                <option value="厢式货车">厢式货车</option>
                <option value="平板车">平板车</option>
                <option value="高栏车">高栏车</option>
                <option value="冷藏车">冷藏车</option>
                <option value="特种车">特种车</option>
              </select>
            </div>

            <div className="filter-group">
              <label>服务类型</label>
              <select 
                value={filters.serviceType} 
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
              >
                <option value="">全部类型</option>
                <option value="FTL">整车运输</option>
                <option value="LTL">零担运输</option>
              </select>
            </div>

            <div className="filter-actions">
              <button className="apply-btn" onClick={applyFilters}>
                <Filter size={16} />
                筛选
              </button>
              <button className="reset-btn" onClick={resetFilters}>
                <X size={16} />
                重置
              </button>
            </div>
          </div>

          {/* 高级筛选和排序 */}
          <div className="advanced-controls">
            <div className="range-filters">
              <div className="range-group">
                <label>价格范围(元)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="最低价"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange('minRate', e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="最高价"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                  />
                </div>
              </div>

              <div className="range-group">
                <label>重量范围(kg)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="最低重量"
                    value={filters.minWeight}
                    onChange={(e) => handleFilterChange('minWeight', e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="最高重量"
                    value={filters.maxWeight}
                    onChange={(e) => handleFilterChange('maxWeight', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sort-control">
              <label>排序方式</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">发布时间</option>
                <option value="rate-low">价格由低到高</option>
                <option value="rate-high">价格由高到低</option>
                <option value="weight">重量由大到小</option>
              </select>
            </div>
          </div>

          {/* 当前筛选状态 */}
          {hasAppliedFilters && (
            <div className="active-filters">
              <span className="filter-label">当前筛选：</span>
              <div className="filter-tags">
                {appliedSearchQuery && (
                  <span className="filter-tag">
                    搜索: {appliedSearchQuery}
                    <button onClick={() => { setSearchQuery(''); setAppliedSearchQuery(''); }}>×</button>
                  </span>
                )}
                {appliedFilters.origin && (
                  <span className="filter-tag">
                    起始: {appliedFilters.origin}
                    <button onClick={() => handleFilterChange('origin', '')}>×</button>
                  </span>
                )}
                {appliedFilters.destination && (
                  <span className="filter-tag">
                    目的: {appliedFilters.destination}
                    <button onClick={() => handleFilterChange('destination', '')}>×</button>
                  </span>
                )}
                {appliedFilters.serviceType && (
                  <span className="filter-tag">
                    类型: {appliedFilters.serviceType === 'FTL' ? '整车' : '零担'}
                    <button onClick={() => handleFilterChange('serviceType', '')}>×</button>
                  </span>
                )}
              </div>
              <span className="results-count">
                共找到 {activeTab === 'loads' ? filteredLoads.length : filteredTrucks.length} 条结果
              </span>
            </div>
          )}
        </div>

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
                  <div key={load.id} className={`freight-card ${load.serviceType?.toLowerCase()}`}>
                    {/* 紧凑货源卡片 */}
                    <div className="card-header">
                      <div className={`service-type-badge ${load.serviceType?.toLowerCase()}`}>
                        {load.serviceType === 'FTL' ? (
                          <>
                            <Truck size={14} />
                            <span>整车</span>
                          </>
                        ) : (
                          <>
                            <Package size={14} />
                            <span>零担</span>
                          </>
                        )}
                      </div>
                      
                      {load.urgency && load.urgency !== '普通' && (
                        <div className={`urgency-tag ${load.urgency}`}>
                          {load.urgency === '紧急' && <AlertCircle size={12} />}
                          {load.urgency === '加急' && <Clock size={12} />}
                          <span>{load.urgency}</span>
                        </div>
                      )}
                    </div>

                    <div className="card-content">
                      {/* 路线信息 - 更紧凑 */}
                      <div className="route-section">
                        <div className="route-info">
                          <span className="origin">{load.origin}</span>
                          <ArrowRight size={14} className="arrow" />
                          <span className="destination">{load.destination}</span>
                          <span className="distance">({load.distance})</span>
                        </div>
                        <div className="date-info">
                          {load.pickupDate?.split('-').slice(1).join('/')} 取货
                        </div>
                      </div>

                      {/* 货物和价格信息 */}
                      <div className="cargo-section">
                        <div className="cargo-info">
                          <span className="commodity">{load.commodity}</span>
                          <span className="weight-equipment">{load.weight} | {load.equipment}</span>
                        </div>
                        <div className="price-info">
                          <span className="price">{load.rate}</span>
                          {load.serviceType === 'LTL' && load.freightClass && (
                            <span className="freight-class">{load.freightClass}</span>
                          )}
                        </div>
                      </div>

                      {/* 特殊要求 */}
                      {load.requirements && (
                        <div className="requirements-section">
                          <span className="requirements">{load.requirements}</span>
                        </div>
                      )}

                      {/* LTL特有信息 */}
                      {load.serviceType === 'LTL' && (
                        <div className="ltl-details">
                          {load.dimensions && <span>尺寸: {load.dimensions}</span>}
                          {load.density && <span>密度: {load.density}</span>}
                          {load.stackable !== undefined && (
                            <span className={load.stackable ? 'positive' : 'negative'}>
                              {load.stackable ? '可堆叠' : '不可堆叠'}
                            </span>
                          )}
                        </div>
                      )}

                      {/* FTL特有信息 */}
                      {load.serviceType === 'FTL' && load.insurance && (
                        <div className="ftl-details">
                          <span className="insurance">{load.insurance}</span>
                        </div>
                      )}
                    </div>

                    {/* 公司信息和操作 */}
                    <div className="card-footer">
                      <div className="company-section">
                        <div className="company-name">{load.company}</div>
                        <div className="company-rating">
                          <Star size={12} />
                          <span>{load.rating}</span>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button className="contact-btn" onClick={() => window.open(`tel:${load.phone}`)}>
                          <Phone size={12} />
                          联系
                        </button>
                        <button className="quote-btn">
                          <MessageCircle size={12} />
                          询价
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
                  <div key={truck.id} className={`freight-card ${truck.serviceType?.toLowerCase()}`}>
                    {/* 紧凑车源卡片 */}
                    <div className="card-header">
                      <div className={`service-type-badge ${truck.serviceType?.toLowerCase()}`}>
                        {truck.serviceType === 'FTL' ? (
                          <>
                            <Truck size={14} />
                            <span>整车</span>
                          </>
                        ) : (
                          <>
                            <Package size={14} />
                            <span>零担</span>
                          </>
                        )}
                      </div>
                      
                      <div className="available-tag">
                        <Clock size={12} />
                        <span>可用车辆</span>
                      </div>
                    </div>

                    <div className="card-content">
                      {/* 路线信息 */}
                      <div className="route-section">
                        <div className="route-info">
                          <span className="origin">{truck.location}</span>
                          <ArrowRight size={14} className="arrow" />
                          <span className="destination">{truck.destination}</span>
                        </div>
                        <div className="date-info">
                          {truck.availableDate?.split('-').slice(1).join('/')} 可用
                        </div>
                      </div>

                      {/* 车辆和价格信息 */}
                      <div className="cargo-section">
                        <div className="cargo-info">
                          <span className="commodity">{truck.equipment}</span>
                          <span className="weight-equipment">{truck.capacity} | {truck.volume}</span>
                        </div>
                        <div className="price-info">
                          <span className="price">{truck.rateRange}</span>
                        </div>
                      </div>

                      {/* 优势路线 */}
                      {truck.preferredLanes && (
                        <div className="requirements-section">
                          <span className="requirements">优势路线: {truck.preferredLanes}</span>
                        </div>
                      )}

                      {/* 特殊服务 */}
                      {truck.specialServices && (
                        <div className="ltl-details">
                          <span className="positive">{truck.specialServices}</span>
                        </div>
                      )}
                    </div>

                    {/* 公司信息和操作 */}
                    <div className="card-footer">
                      <div className="company-section">
                        <div className="company-name">{truck.company}</div>
                        <div className="company-rating">
                          <Star size={12} />
                          <span>{truck.rating}</span>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button className="contact-btn" onClick={() => window.open(`tel:${truck.phone}`)}>
                          <Phone size={12} />
                          联系
                        </button>
                        <button className="quote-btn">
                          <MessageCircle size={12} />
                          询价
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
    </div>
  );
};

export default FreightBoard; 

