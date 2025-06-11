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

/**
 * 陆运信息平台主组件
 * 
 * 功能概述：
 * - 显示货源和车源信息列表
 * - 支持搜索、筛选、排序功能
 * - 提供发布货源/车源的模态框
 * - 支持查看详细信息
 * - 自动生成EWID编号和发布时间显示
 * 
 * 主要状态：
 * - activeTab: 当前标签页 (loads/trucks)
 * - loads/trucks: 数据列表
 * - filters: 筛选条件
 * - searchQuery: 搜索关键词
 * - modal状态: 控制各种模态框显示
 * 
 * 核心功能：
 * - 数据获取 (fetchLoads/fetchTrucks)
 * - 数据筛选和排序 (filterData)
 * - EWID生成 (generateEWID)
 * - 发布时间格式化 (formatPublicationDate)
 */
const FreightBoard = () => {
  // === 状态管理 ===
  // 基础UI状态
  const [activeTab, setActiveTab] = useState('loads'); // 当前激活的标签页 ('loads' | 'trucks')
  const [loading, setLoading] = useState(true); // 数据加载状态
  const [error, setError] = useState(null); // 错误信息

  // 模态框状态
  const [isPostLoadModalOpen, setIsPostLoadModalOpen] = useState(false);
  const [isPostTruckModalOpen, setIsPostTruckModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // 详情模态框中选中的项目

  // 数据状态
  const [loads, setLoads] = useState([]); // 货源列表
  const [trucks, setTrucks] = useState([]); // 车源列表

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [filters, setFilters] = useState({
    search: '',
    origin: '', // 起始地筛选
    destination: '', // 目的地筛选
    serviceType: '', // 服务类型筛选 (FTL/LTL)
    dateFrom: '', // 开始日期筛选
    dateTo: '' // 结束日期筛选
  });
  const [sortBy, setSortBy] = useState('date'); // 排序方式 ('date' | 'rate' | 'weight')

  const { isAuthenticated } = useAuth();

  // EWID计数器（在实际应用中应该从数据库获取）
  const [ewidCounter, setEwidCounter] = useState(() => {
    const saved = localStorage.getItem('ewidCounter');
    return saved ? parseInt(saved) : 1;
  });

  // 生成EWID单号 - 从EW000000001开始的顺序编号
  const generateEWID = () => {
    const paddedNumber = ewidCounter.toString().padStart(9, '0');
    const ewid = `EW${paddedNumber}`;
    
    // 更新计数器
    const newCounter = ewidCounter + 1;
    setEwidCounter(newCounter);
    localStorage.setItem('ewidCounter', newCounter.toString());
    
    return ewid;
  };

  // 格式化发布时间
  const formatPublicationDate = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
      return diffInMinutes <= 0 ? '刚刚发布' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  // === 数据获取函数 ===
  /**
   * 获取货源数据
   * @returns {Promise<Array>} 货源列表
   */
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
      // 返回模拟数据用于演示
      return getMockLoadsData();
    }
  };

  /**
   * 获取车源数据
   * @returns {Promise<Array>} 车源列表
   */
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
      // 返回模拟数据用于演示
      return getMockTrucksData();
    }
  };

  /**
   * 获取模拟货源数据
   * @returns {Array} 模拟货源数组
   */
  const getMockLoadsData = () => [
    {
      id: 1,
      origin: '洛杉矶港 (Port of LA)',
      destination: '芝加哥 (Chicago, IL)',
      pickupDate: '2024-03-15',
      weight: '45,000 lb',
      commodity: '汽车配件 (Auto Parts)',
      rate: '$3,200',
      company: 'Pacific Logistics',
      phone: '(213) 555-0123',
      postedTime: '2小时前',
      EWID: 'EW-LA-240315-001',
      serviceType: 'FTL',
      cargoValue: '$85,000',
      truckType: '干货车 (Dry Van)',
      originalData: {
        deliveryDate: '2024-03-18',
        shippingNumber: 'FTL-2024-0315-001',
        contactEmail: 'dispatch@pacificlogistics.com',
        notes: '包含时效性要求，请按时交货'
      }
    },
    {
      id: 2,
      origin: '达拉斯 (Dallas, TX)',
      destination: '迈阿密 (Miami, FL)',
      pickupDate: '2024-03-16',
      weight: '52,000 lb',
      commodity: '电子设备 (Electronics)',
      rate: '$2,800',
      company: 'Texas Express',
      phone: '(214) 555-0145',
      postedTime: '45分钟前',
      EWID: 'EW-TX-240316-002',
      serviceType: 'FTL',
      cargoValue: '$120,000',
      truckType: '冷藏车 (Refrigerated)'
    },
    {
      id: 3,
      origin: '西雅图 (Seattle, WA)',
      destination: '凤凰城 (Phoenix, AZ)',
      pickupDate: '2024-03-17',
      weight: '8,500 lb',
      commodity: '机械设备 (Machinery)',
      freightClass: '70',
      rate: '$1,250',
      company: 'Northwest Freight',
      phone: '(206) 555-0167',
      postedTime: '1天前',
      EWID: 'EW-WA-240317-003',
      serviceType: 'LTL',
      pallets: 6,
      truckType: '平板车 (Flatbed)',
      originalData: {
        length: '48',
        width: '40',
        height: '60',
        volume: '46.67',
        density: '182.14',
        fragile: true,
        stackable: false,
        shippingNumber: 'SH-2024-0317-001',
        contactEmail: 'contact@northwestfreight.com',
        notes: '特殊包装要求，需防潮处理'
      }
    }
  ];

  /**
   * 获取模拟车源数据
   * @returns {Array} 模拟车源数组
   */
  const getMockTrucksData = () => [
    {
      id: 1,
      location: '广东广州',
      destination: '全国各地',
      availableDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      equipment: '厢式货车17.5米',
      capacity: '32吨',
      serviceType: 'FTL',
      rateRange: '3.5-4.2元/公里',
      company: '粤运物流',
      rating: 4.8,
      phone: '020-8888-6666'
    },
    {
      id: 2,
      location: '浙江杭州',
      destination: '华东地区',
      availableDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      equipment: '冷藏车13米',
      capacity: '25吨',
      serviceType: 'FTL',
      rateRange: '4.0-5.5元/公里',
      company: '江南冷链',
      rating: 4.9,
      phone: '0571-7777-8888'
    }
  ];

  // === 组件初始化 ===
  /**
   * 组件初始化 - 加载货源和车源数据
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 并行加载货源和车源数据
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

  // === 事件处理函数 ===
  /**
   * 处理筛选条件变化
   * @param {string} key - 筛选字段名
   * @param {string} value - 筛选值
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * 重置所有筛选条件
   */
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      search: '',
      origin: '',
      destination: '',
      serviceType: '',
      dateFrom: '',
      dateTo: ''
    });
    setSortBy('date');
  };

  /**
   * Apply filters - currently filtering is reactive so this is mainly for enter key support
   * Could be extended in the future for manual filter application or search actions
   */
  const applyFilters = () => {
    // Filtering is already reactive through filteredLoads/filteredTrucks computed properties
    // This function is mainly here to support the Enter key functionality in search
    // Could be extended in the future for additional search logic if needed
  };

  /**
   * 处理发布货源/车源
   * @param {Object} postData - 发布的数据
   */
  const handlePostSubmit = async (postData) => {
    try {
      console.log('发布的数据:', postData);

      if (postData.type === 'load') {
        // 创建新的货源记录
        const newLoad = {
          id: Date.now(),
          origin: postData.origin,
          destination: postData.destination,
          // 新的格式化地址字段
          originDisplay: postData.originDisplay || postData.origin,
          destinationDisplay: postData.destinationDisplay || postData.destination,
          // 距离信息
          distanceInfo: postData.distanceInfo,
          pickupDate: postData.requiredDate,
          deliveryDate: postData.deliveryDate,
          rate: postData.maxRate || '预估价格',
          weight: postData.weight,
          serviceType: postData.serviceType,
          equipment: postData.truckType || '标准货车',
          company: postData.companyName,
          phone: postData.contactPhone,
          contactEmail: postData.contactEmail,
          commodity: postData.cargoType,
          pallets: postData.originalData?.pallets || '',
          cargoValue: postData.cargoValue || postData.originalData?.cargoValue || '',
          shippingNumber: postData.shippingNumber || postData.originalData?.shippingNumber || '',
          notes: postData.specialRequirements || postData.notes || '',
          truckType: postData.truckType,
          freightClass: postData.originalData?.freightClass || postData.originalData?.calculatedClass || '',
          EWID: generateEWID(),
          publicationDate: new Date().toISOString(),
          postedTime: '刚刚发布',
          // 保存完整的原始数据供详情页使用
          originalData: postData.originalData || postData
        };
        console.log('创建的新货源:', newLoad);
        setLoads(prev => [newLoad, ...prev]);
      } else {
        // 创建新的车源记录
        const newTruck = {
          id: Date.now(),
          location: postData.currentLocation || postData.origin,
          destination: postData.destination || postData.preferredDestination || '全国各地',
          availableDate: postData.availableDate,
          equipment: postData.equipment || postData.truckType,
          capacity: postData.capacity,
          serviceType: postData.serviceType,
          rateRange: postData.rateRange || postData.rate,
          company: postData.companyName,
          phone: postData.contactPhone,
          contactEmail: postData.contactEmail,
          EWID: generateEWID(),
          publicationDate: new Date().toISOString(),
          postedTime: '刚刚发布',
          // 保存完整的原始数据供详情页使用
          originalData: postData.originalData || postData
        };
        console.log('创建的新车源:', newTruck);
        setTrucks(prev => [newTruck, ...prev]);
      }

      alert('发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请稍后重试');
    }
  };

  // === 数据处理函数 ===
  /**
   * 过滤和排序数据
   * @param {Array} data - 原始数据数组
   * @returns {Array} 过滤和排序后的数据
   */
  const filterData = (data) => {
    let filteredData = data.filter(item => {
      // 搜索关键词匹配
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          item.origin?.toLowerCase().includes(searchLower) ||
          item.destination?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.equipment?.toLowerCase().includes(searchLower) ||
          item.commodity?.toLowerCase().includes(searchLower) ||
          item.company?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // 起始地筛选
      if (filters.origin && 
          !item.origin?.toLowerCase().includes(filters.origin.toLowerCase()) && 
          !item.location?.toLowerCase().includes(filters.origin.toLowerCase())) return false;
      
      // 目的地筛选
      if (filters.destination && 
          !item.destination?.toLowerCase().includes(filters.destination.toLowerCase())) return false;
      
      // 服务类型筛选
      if (filters.serviceType && item.serviceType !== filters.serviceType) return false;

      // 日期范围筛选
      if (filters.dateFrom && new Date(item.pickupDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(item.pickupDate) > new Date(filters.dateTo)) return false;

      return true;
    });

    // 数据排序
    if (sortBy) {
      filteredData.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.pickupDate || b.availableDate || b.postedDate) - 
                   new Date(a.pickupDate || a.availableDate || a.postedDate);
          case 'rate':
            const aRate = parseFloat((a.rate || a.rateRange || '0').replace(/[^\d.]/g, ''));
            const bRate = parseFloat((b.rate || b.rateRange || '0').replace(/[^\d.]/g, ''));
            return aRate - bRate;
          case 'weight':
            const aWeight = parseFloat((a.weight || '0').replace(/[^\d.]/g, ''));
            const bWeight = parseFloat((b.weight || '0').replace(/[^\d.]/g, ''));
            return bWeight - aWeight;
          default:
            return 0;
        }
      });
    }

    return filteredData;
  };

  // === 模态框事件处理 ===
  /**
   * 处理发布货源按钮点击
   */
  const handlePostLoadClick = () => {
    if (!isAuthenticated) {
      alert('请先登录再发布货源信息');
      return;
    }
    setIsPostLoadModalOpen(true);
  };

  /**
   * 处理发布车源按钮点击
   */
  const handlePostTruckClick = () => {
    if (!isAuthenticated) {
      alert('请先登录再发布车源信息');
      return;
    }
    setIsPostTruckModalOpen(true);
  };

  /**
   * 处理详情模态框打开
   * @param {Object} item - 选中的项目
   */
  const handleDetailsClick = (item) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  /**
   * 处理详情模态框关闭
   */
  const handleDetailsClose = () => {
    setDetailsModalOpen(false);
    setSelectedItem(null);
  };

  // === 计算衍生状态 ===
  const filteredLoads = filterData(loads);
  const filteredTrucks = filterData(trucks);
  const hasAppliedFilters = Object.values(filters).some(value => value !== '') || searchQuery;

  // === 加载和错误状态渲染 ===
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

  // === 主组件渲染 ===
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

        {/* === 主要内容区域 === */}
        <div className="freight-content">
          {/* 货源信息列表 */}
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
                    {/* 卡片主要信息 */}
                    <div className="card-main">
                      {/* 服务类型标识 */}
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
                      
                      {/* 运输路线 - 使用格式化地址 */}
                      <div className="route">
                        <span className="origin">{load.originDisplay || load.origin}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{load.destinationDisplay || load.destination}</span>
                      </div>
                      
                      {/* 货物重量 */}
                      <div className="weight">
                        <Scale size={14} />
                        {load.weight} lb
                      </div>
                      
                      {/* 取货日期和距离 */}
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">
                          {load.pickupDate?.split('-').slice(1).join('/') || '未知日期'} 取货
                          {load.distanceInfo && (
                            <span className="distance-badge">
                              • {load.distanceInfo.distance}
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {/* LTL特有信息：托盘数量 */}
                      {load.serviceType === 'LTL' && (
                        <div className="Pallets">
                          <span>板数: {load.pallets || '未知'}</span>
                        </div>
                      )}

                      {/* 发布时间 */}
                      <div className={`publication-date ${load.serviceType === 'FTL' ? 'ml-offset' : ''}`}>
                        <Clock size={14} />
                        <span className="publication-text">
                          {load.publicationDate
                            ? formatPublicationDate(load.publicationDate)
                            : (load.postedTime || '未知时间')}
                        </span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
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

          {/* 车源信息列表 */}
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
                    {/* 卡片主要信息 */}
                    <div className="card-main">
                      {/* 服务类型标识 */}
                      <div className="service-type">
                        <span className="truck-badge">
                          <Truck size={16} />
                          车源 {truck.serviceType}
                        </span>
                      </div>
                      
                      {/* 运输路线 */}
                      <div className="route">
                        <span className="origin">{truck.location}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{truck.destination}</span>
                      </div>
                      
                      {/* 车辆设备 */}
                      <div className="equipment">
                        {truck.equipment}
                      </div>
                      
                      {/* 载重能力 */}
                      <div className="capacity">
                        <Scale size={14} />
                        {truck.capacity}
                      </div>
                      
                      {/* 可用日期 */}
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">{truck.availableDate?.split('-').slice(1).join('/') || '未知日期'}</span>
                      </div>
                      
                      {/* 价格范围 */}
                      <div className="rate">
                        <DollarSign size={16} />
                        <span className="rate-text">{truck.rateRange || '预估价格'}</span>
                      </div>
                      
                      {/* 发布时间 */}
                      <div className="publication-date">
                        <Clock size={14} />
                        <span className="publication-text">
                          {truck.publicationDate ? formatPublicationDate(truck.publicationDate) : (truck.postedTime || '未知时间')}
                        </span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
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

      {/* === 模态框组件 === */}
      {/* 发布货源模态框 */}
      <PostLoadModal 
        isOpen={isPostLoadModalOpen}
        onClose={() => setIsPostLoadModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
      
      {/* 发布车源模态框 */}
      <PostTruckModal 
        isOpen={isPostTruckModalOpen}
        onClose={() => setIsPostTruckModalOpen(false)}
        onSubmit={handlePostSubmit}
      />

      {/* 详情查看模态框 */}
      <DetailsModal 
        isOpen={detailsModalOpen}
        onClose={handleDetailsClose}
        item={selectedItem}
      />
    </div>
  );
};

export default FreightBoard; 

