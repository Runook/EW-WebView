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
  Box,
  Info
} from 'lucide-react';
// import { useLanguage } from '../contexts/LanguageContext';
import PostLoadModal from '../components/PostLoadModal';
import PostTruckModal from '../components/PostTruckModal';
import DetailsModal from '../components/DetailsModal';
import { useAuth } from '../contexts/AuthContext';
import './PlatformPage.css';
import './FreightBoard.css';

const FreightBoard = () => {
  // const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('loads');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostLoadModalOpen, setIsPostLoadModalOpen] = useState(false);
  const [isPostTruckModalOpen, setIsPostTruckModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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

  // 生成EWID单号
  const generateEWID = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EWID${timestamp.slice(-6)}${random}`;
  };

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
          origin: '洛杉矶港 (Port of LA)',
          destination: '芝加哥 (Chicago, IL)',
          distance: '2,015英里',
          pickupDate: '2024-03-15',
          deliveryDate: '2024-03-18',
          weight: '45,000 lb',
          commodity: '汽车配件 (Auto Parts)',
          rate: '$3,200',
          company: 'Pacific Logistics',
          phone: '(213) 555-0123',
          contactEmail: 'dispatch@pacificlogistics.com',
          postedTime: '2小时前',
          EWID: 'EW-LA-240315-001',
          serviceType: 'FTL',
          cargoValue: '$85,000 货值',
          truckType: '干货车 (Dry Van)'
        },
        {
          id: 2,
          origin: '达拉斯 (Dallas, TX)',
          destination: '迈阿密 (Miami, FL)',
          distance: '1,307英里',
          pickupDate: '2024-03-16',
          deliveryDate: '2024-03-19',
          weight: '52,000 lb',
          commodity: '电子设备 (Electronics)',
          rate: '$2,800',
          company: 'Texas Express',
          phone: '(214) 555-0145',
          contactEmail: 'loads@texasexpress.com',
          postedTime: '45分钟前',
          EWID: 'EW-TX-240316-002',
          serviceType: 'FTL',
          cargoValue: '$120,000 货值',
          truckType: '冷藏车 (Refrigerated)'
        },
        {
          id: 3,
          origin: '西雅图 (Seattle, WA)',
          destination: '凤凰城 (Phoenix, AZ)',
          distance: '1,422英里',
          pickupDate: '2024-03-17',
          deliveryDate: '2024-03-20',
          weight: '8,500 lb',
          commodity: '机械设备 (Machinery)',
          freightClass: '70',
          rate: '$1,250',
          company: 'Northwest Freight',
          phone: '(206) 555-0167',
          contactEmail: 'operations@nwfreight.com',
          postedTime: '1天前',
          EWID: 'EW-WA-240317-003',
          serviceType: 'LTL',
          pallets: 6,
          truckType: '平板车 (Flatbed)'
        },
        {
          id: 4,
          origin: '亚特兰大 (Atlanta, GA)',
          destination: '丹佛 (Denver, CO)',
          distance: '1,398英里',
          pickupDate: '2024-03-18',
          deliveryDate: '2024-03-21',
          weight: '48,000 lb',
          commodity: '建筑材料 (Building Materials)',
          rate: '$2,950',
          company: 'Southern Transport',
          phone: '(404) 555-0189',
          contactEmail: 'dispatch@southerntransport.com',
          postedTime: '3小时前',
          EWID: 'EW-GA-240318-004',
          serviceType: 'FTL',
          cargoValue: '$75,000 货值',
          truckType: '平板车 (Flatbed)'
        },
        {
          id: 5,
          origin: '休斯顿 (Houston, TX)',
          destination: '纽约 (New York, NY)',
          distance: '1,628英里',
          pickupDate: '2024-03-19',
          deliveryDate: '2024-03-22',
          weight: '44,000 lb',
          commodity: '化工原料 (Chemicals)',
          rate: '$3,100',
          company: 'Gulf Coast Logistics',
          phone: '(713) 555-0201',
          contactEmail: 'loads@gulfcoastlog.com',
          postedTime: '6小时前',
          EWID: 'EW-TX-240319-005',
          serviceType: 'FTL',
          cargoValue: '$95,000 货值',
          truckType: '危险品车 (Hazmat)'
        },
        {
          id: 6,
          origin: '盐湖城 (Salt Lake City, UT)',
          destination: '拉斯维加斯 (Las Vegas, NV)',
          distance: '421英里',
          pickupDate: '2024-03-20',
          deliveryDate: '2024-03-21',
          weight: '12,800 lb',
          commodity: '纺织品 (Textiles)',
          freightClass: '110',
          rate: '$890',
          company: 'Mountain Freight',
          phone: '(801) 555-0223',
          contactEmail: 'dispatch@mountainfreight.com',
          postedTime: '2天前',
          EWID: 'EW-UT-240320-006',
          serviceType: 'LTL',
          pallets: 8,
          truckType: '干货车 (Dry Van)'
        },
        {
          id: 7,
          origin: '波特兰 (Portland, OR)',
          destination: '洛杉矶 (Los Angeles, CA)',
          distance: '964英里',
          pickupDate: '2024-03-21',
          deliveryDate: '2024-03-23',
          weight: '15,600 lb',
          commodity: '家具 (Furniture)',
          freightClass: '125',
          rate: '$1,450',
          company: 'Pacific Northwest Logistics',
          phone: '(503) 555-0245',
          contactEmail: 'ops@pnwlogistics.com',
          postedTime: '8小时前',
          EWID: 'EW-OR-240321-007',
          serviceType: 'LTL',
          pallets: 10,
          truckType: '升降尾板 (Liftgate Required)'
        },
        {
          id: 8,
          origin: '底特律 (Detroit, MI)',
          destination: '纳什维尔 (Nashville, TN)',
          distance: '456英里',
          pickupDate: '2024-03-22',
          deliveryDate: '2024-03-24',
          weight: '22,000 lb',
          commodity: '汽车配件 (Auto Parts)',
          freightClass: '85',
          rate: '$1,680',
          company: 'Great Lakes Transport',
          phone: '(313) 555-0267',
          contactEmail: 'dispatch@greatlakestransport.com',
          postedTime: '4小时前',
          EWID: 'EW-MI-240322-008',
          serviceType: 'LTL',
          pallets: 14,
          truckType: '干货车 (Dry Van)'
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
      console.log('发布的数据:', postData); // 调试日志

      if (postData.type === 'load') {
        const newLoad = {
          id: Date.now(),
          origin: postData.origin,
          destination: postData.destination,
          pickupDate: postData.requiredDate,
          deliveryDate: postData.deliveryDate,
          distance: '距离计算中',
          rate: postData.maxRate || '预估价格',
          rateValue: parseFloat(postData.maxRate?.replace(/[^\d.]/g, '')) || 0,
          weight: postData.weight,
          weightValue: parseFloat(postData.weight?.replace(/[^\d.]/g, '')) || 0,
          serviceType: postData.serviceType,
          equipment: postData.truckType || '标准货车',
          company: postData.companyName,
          rating: 4.5,
          phone: postData.contactPhone,
          commodity: postData.cargoType,
          pallets: postData.originalData?.pallets || '',
          requirements: postData.specialRequirements || postData.notes || '',
          freightClass: postData.originalData?.freightClass || postData.originalData?.calculatedClass || '',
          nmfcClass: postData.originalData?.calculatedClass || '',
          density: postData.originalData?.calculatedDensity || '',
          stackable: postData.originalData?.stackable || true,
          cargoValue: postData.cargoValue || postData.originalData?.cargoValue || '',
          EWID: generateEWID()
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
          specialServices: postData.truckFeatures || postData.specialServices || '',
          EWID: generateEWID()
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

  const handleDetailsClick = (item) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsModalOpen(false);
    setSelectedItem(null);
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
                      
                      {/* 根据服务类型显示不同信息 */}
                      {load.serviceType === 'FTL' ? (
                        <div className="cargo-value">
                          <DollarSign size={14} />
                           {load.cargoValue || '无'} （货值）
                        </div>
                      ) : (
                        <div className="nmfc-class">
                          <Layers size={14} />
                          Class: {load.freightClass || load.nmfcClass || '未分类'}
                        </div>
                      )}
                      
                      <div className="weight">
                        <Scale size={14} />
                        {load.weight} lb
                      </div>
                      
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">{load.pickupDate?.split('-').slice(1).join('/') || '未知日期'} 取货</span>
                      </div>
                      {load.serviceType === 'LTL' && (
                      <div className="Pallets">
                        <span>板数: {load.pallets || '未知'}</span>
                      </div>
                      )}
                      

                      
                      {/* EWID单号显示 */}
                      {(load.ewid || load.EWID) && (
                        <div className="ewid">
                          <Hash size={14} />
                          <span className="ewid-text">{load.ewid || load.EWID}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-actions">
                      <button className="contact-btn" onClick={() => handleDetailsClick(load)}>
                        <Info size={14} />
                        详情
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
                        <span className="rate-text">{truck.rateRange || '预估价格'}</span>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button className="contact-btn" onClick={() => handleDetailsClick(truck)}>
                        <Info size={14} />
                        详情
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

      <DetailsModal 
        isOpen={detailsModalOpen}
        onClose={handleDetailsClose}
        item={selectedItem}
      />
    </div>
  );
};

export default FreightBoard; 

