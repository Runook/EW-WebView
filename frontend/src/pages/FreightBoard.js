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
import PremiumPostModal from '../components/PremiumPostModal';
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentPostType, setCurrentPostType] = useState(null);
  const [currentFormData, setCurrentFormData] = useState(null);

  // 数据状态
  const [loads, setLoads] = useState([]); // 货源列表
  const [trucks, setTrucks] = useState([]); // 车源列表

  // 统一的筛选状态管理
  const [filters, setFilters] = useState({
    searchQuery: '', // 搜索关键词
    origin: '', // 起始地筛选
    destination: '', // 目的地筛选
    serviceType: '', // 服务类型筛选 (FTL/LTL)
    dateFrom: '', // 开始日期筛选
    dateTo: '', // 结束日期筛选
    sortBy: 'date' // 排序方式
  });

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
      return [];
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
      return [];
    }
  };

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

  // === 筛选和搜索功能 ===
  /**
   * 统一的筛选条件更新函数
   * @param {string} key - 筛选字段名
   * @param {string} value - 筛选值
   */
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * 重置所有筛选条件
   */
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      origin: '',
      destination: '',
      serviceType: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date'
    });
  };

  /**
   * 美国50个州及特区的简称列表
   */
  const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  /**
   * 从地址字符串中提取州简称
   * @param {string} address - 完整地址
   * @returns {string} 州简称或空字符串
   */
  const extractStateFromAddress = (address) => {
    if (!address) return '';
    
    // 尝试匹配常见的地址格式
    // 例如: "City, State zipcode" 或 "City, State" 或 "City State"
    const statePatterns = [
      /,\s*([A-Z]{2})\s*\d{5}/, // "City, CA 90210"
      /,\s*([A-Z]{2})\s*$/, // "City, CA"
      /\s([A-Z]{2})\s*\d{5}/, // "City CA 90210"
      /\s([A-Z]{2})\s*$/ // "City CA"
    ];
    
    for (const pattern of statePatterns) {
      const match = address.match(pattern);
      if (match && match[1]) {
        const stateCode = match[1].toUpperCase();
        // 验证是否是有效的州简称
        if (US_STATES.some(state => state.code === stateCode)) {
          return stateCode;
        }
      }
    }
    
    return '';
  };

  /**
   * 从数据中提取在用的州简称
   */
  const getStatesInUse = () => {
    const statesSet = new Set();
    
    // 从货源数据提取州
    loads.forEach(load => {
      const originState = extractStateFromAddress(load.origin || load.originDisplay);
      const destState = extractStateFromAddress(load.destination || load.destinationDisplay);
      if (originState) statesSet.add(originState);
      if (destState) statesSet.add(destState);
    });
    
    // 从车源数据提取州
    trucks.forEach(truck => {
      const originState = extractStateFromAddress(truck.preferredOrigin || truck.location);
      const destState = extractStateFromAddress(truck.preferredDestination || truck.destination);
      if (originState) statesSet.add(originState);
      if (destState) statesSet.add(destState);
    });
    
    // 返回排序后的在用州列表
    return Array.from(statesSet).sort();
  };



  /**
   * 改进的数据筛选和排序函数
   * @param {Array} data - 原始数据数组
   * @returns {Array} 过滤和排序后的数据
   */
  const filterAndSortData = (data) => {
    let filteredData = data.filter(item => {
      // 搜索关键词匹配 - 支持多个字段
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const searchFields = [
          item.origin,
          item.destination,
          item.location,
          item.preferredOrigin,
          item.preferredDestination,
          item.equipment,
          item.commodity,
          item.company,
          item.originDisplay,
          item.destinationDisplay
        ].filter(Boolean);
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }

      // 起始地州筛选 - 基于州简称匹配
      if (filters.origin) {
        const originAddresses = [
          item.origin,
          item.location,
          item.preferredOrigin,
          item.originDisplay
        ].filter(Boolean);
        
        const originMatches = originAddresses.some(address => {
          const stateCode = extractStateFromAddress(address);
          return stateCode === filters.origin;
        });
        
        if (!originMatches) return false;
      }
      
      // 目的地州筛选 - 基于州简称匹配
      if (filters.destination) {
        const destAddresses = [
          item.destination,
          item.preferredDestination,
          item.destinationDisplay
        ].filter(Boolean);
        
        const destMatches = destAddresses.some(address => {
          const stateCode = extractStateFromAddress(address);
          return stateCode === filters.destination;
        });
        
        if (!destMatches) return false;
      }
      
      // 服务类型筛选
      if (filters.serviceType && item.serviceType !== filters.serviceType) {
        return false;
      }

      // 日期范围筛选 - 根据数据类型选择正确的日期字段
      const itemDate = item.pickupDate || item.availableDate || item.postedDate;
      
      if (filters.dateFrom && itemDate) {
        try {
          if (new Date(itemDate) < new Date(filters.dateFrom)) return false;
        } catch (e) {
          console.warn('Invalid date:', itemDate);
        }
      }
      
      if (filters.dateTo && itemDate) {
        try {
          if (new Date(itemDate) > new Date(filters.dateTo)) return false;
        } catch (e) {
          console.warn('Invalid date:', itemDate);
        }
      }

      return true;
    });

    // 数据排序 - 保持置顶优先级
    filteredData.sort((a, b) => {
      // 1. 首先按置顶优先级排序（置顶在前）
      const aIsTop = a.premium_type === 'top';
      const bIsTop = b.premium_type === 'top';
      
      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;
      
      // 2. 如果都是置顶，按置顶时间倒序（最新置顶在前）
      if (aIsTop && bIsTop) {
        const aPremiumDate = new Date(a.premium_created_at || a.premium_end_time || 0);
        const bPremiumDate = new Date(b.premium_created_at || b.premium_end_time || 0);
        return bPremiumDate - aPremiumDate;
      }
      
      // 3. 如果都不是置顶，或没有指定排序方式，按用户选择的排序方式排序
      if (!filters.sortBy) {
        // 默认按发布时间倒序
        const aPubDate = new Date(a.publicationDate || a.postedTime || a.pickupDate || a.availableDate || 0);
        const bPubDate = new Date(b.publicationDate || b.postedTime || b.pickupDate || b.availableDate || 0);
        return bPubDate - aPubDate;
      }
      
      switch (filters.sortBy) {
        case 'date':
          const aDate = new Date(a.pickupDate || a.availableDate || a.postedDate || 0);
          const bDate = new Date(b.pickupDate || b.availableDate || b.postedDate || 0);
          return bDate - aDate;
          
        case 'publication':
          const aPubDate = new Date(a.publicationDate || a.postedTime || a.pickupDate || a.availableDate || 0);
          const bPubDate = new Date(b.publicationDate || b.postedTime || b.pickupDate || b.availableDate || 0);
          return bPubDate - aPubDate;
          
        case 'rate':
          const aRate = parseFloat((a.rate || a.rateRange || '0').replace(/[^\d.]/g, '')) || 0;
          const bRate = parseFloat((b.rate || b.rateRange || '0').replace(/[^\d.]/g, '')) || 0;
          return bRate - aRate;
          
        case 'weight':
          const aWeight = parseFloat((a.weight || a.capacity || '0').replace(/[^\d.]/g, '')) || 0;
          const bWeight = parseFloat((b.weight || b.capacity || '0').replace(/[^\d.]/g, '')) || 0;
          return bWeight - aWeight;
          
        default:
          return 0;
      }
    });

    return filteredData;
  };

  // === 事件处理函数 ===
  /**
   * 处理发布货源/车源
   * @param {Object} postData - 发布的数据
   */
  // 原始发布处理函数（修改为显示积分模态框）
  const handlePostSubmit = (postData) => {
    if (!isAuthenticated) {
      alert('请先登录再发布');
      return;
    }

    // 确定发布类型
    const postType = postData.type === 'load' ? 'load' : 'truck';
    
    setCurrentFormData(postData);
    setCurrentPostType(postType);
    setIsPostLoadModalOpen(false);
    setIsPostTruckModalOpen(false);
    setShowPremiumModal(true);
  };

  // 确认发布函数
  const handleConfirmPost = async ({ formData, premium }) => {
    try {
      console.log('发布的数据:', formData);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('请先登录');
        return;
      }

      // 为数据添加EWID、发布时间和高级功能
      const enhancedData = {
        ...formData,
        ewid: generateEWID(),
        postedTime: new Date().toISOString(),
        publicationDate: new Date().toISOString(),
        premium: premium
      };

      const endpoint = formData.type === 'load' ? 'loads' : 'trucks';
      const response = await fetch(`${API_URL}/landfreight/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(enhancedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '发布失败');
      }

      const result = await response.json();
      console.log('发布成功:', result);

      if (result.success) {
        const typeName = formData.type === 'load' ? '货源' : '车源';
        alert(`${typeName}发布成功！已扣除 ${result.creditsSpent} 积分`);
        
        // 关闭模态框
        setShowPremiumModal(false);
        setCurrentFormData(null);
        setCurrentPostType(null);

        // 重新加载数据以显示最新发布的信息
        try {
          const [loadData, truckData] = await Promise.all([
            fetchLoads(),
            fetchTrucks()
          ]);
          console.log('重新加载数据成功:', { loads: loadData.length, trucks: truckData.length });
          setLoads(loadData);
          setTrucks(truckData);
              } catch (reloadError) {
          console.error('重新加载数据失败:', reloadError);
          alert('发布成功，但刷新列表失败，请手动刷新页面查看最新数据');
        }
      } else {
        alert(result.message || '发布失败，请重试');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert(error.message || '发布失败，请稍后重试');
    }
  };

  // === 计算衍生状态 ===
  const filteredLoads = filterAndSortData(loads);
  const filteredTrucks = filterAndSortData(trucks);
  const hasAppliedFilters = filters.searchQuery || filters.origin || filters.destination || 
                            filters.serviceType || filters.dateFrom || filters.dateTo || 
                            filters.sortBy !== 'date';
  const statesInUse = getStatesInUse();
  
  // 调试信息
  console.log('FreightBoard 筛选状态:', {
    原始数据: { loads: loads.length, trucks: trucks.length },
    筛选后: { loads: filteredLoads.length, trucks: filteredTrucks.length },
    筛选条件: filters,
    是否有筛选: hasAppliedFilters,
    在用州数量: statesInUse.length,
    在用州列表: statesInUse,
    当前标签: activeTab
  });

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
            className={`btn post-btn ${activeTab === 'loads' ? 'btn-primary active-post' : 'btn-secondary'}`}
            onClick={handlePostLoadClick}
          >
            <Plus size={18} />
            发布货源信息
          </button>
          <button 
            className={`btn post-btn ${activeTab === 'trucks' ? 'btn-primary active-post' : 'btn-secondary'}`}
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
              placeholder="搜索起始地、目的地、州、公司名称..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
          </div>

          <div className="filters-row">
            <select 
              value={filters.origin} 
              onChange={(e) => updateFilter('origin', e.target.value)}
            >
              <option value="">选择起始州</option>
              {US_STATES.map(state => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>

            <select 
              value={filters.destination} 
              onChange={(e) => updateFilter('destination', e.target.value)}
            >
              <option value="">选择目的州</option>
              {US_STATES.map(state => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>

            <select 
              value={filters.serviceType} 
              onChange={(e) => updateFilter('serviceType', e.target.value)}
            >
              <option value="">全部类型</option>
              <option value="FTL">整车运输</option>
              <option value="LTL">零担运输</option>
            </select>

            <div className="date-range">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                placeholder={activeTab === 'loads' ? "取货开始日期" : "可用开始日期"}
                title={activeTab === 'loads' ? "取货开始日期" : "可用开始日期"}
              />
              <span>-</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                placeholder={activeTab === 'loads' ? "取货结束日期" : "可用结束日期"}
                title={activeTab === 'loads' ? "取货结束日期" : "可用结束日期"}
              />
            </div>

            <select value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)}>
              <option value="date">按日期排序</option>
              <option value="publication">按发布时间排序</option>
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
                {filters.searchQuery && (
                  <span className="filter-tag">
                    搜索: {filters.searchQuery}
                    <button onClick={() => updateFilter('searchQuery', '')}>×</button>
                  </span>
                )}
                {filters.origin && (
                  <span className="filter-tag">
                    起始州: {US_STATES.find(state => state.code === filters.origin)?.name || filters.origin}
                    <button onClick={() => updateFilter('origin', '')}>×</button>
                  </span>
                )}
                {filters.destination && (
                  <span className="filter-tag">
                    目的州: {US_STATES.find(state => state.code === filters.destination)?.name || filters.destination}
                    <button onClick={() => updateFilter('destination', '')}>×</button>
                  </span>
                )}
                {filters.serviceType && (
                  <span className="filter-tag">
                    类型: {filters.serviceType === 'FTL' ? '整车' : '零担'}
                    <button onClick={() => updateFilter('serviceType', '')}>×</button>
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="filter-tag">
                    日期: {filters.dateFrom || '不限'} - {filters.dateTo || '不限'}
                    <button onClick={() => { 
                      updateFilter('dateFrom', ''); 
                      updateFilter('dateTo', ''); 
                    }}>×</button>
                  </span>
                )}
                {filters.sortBy !== 'date' && (
                  <span className="filter-tag">
                    排序: {
                      filters.sortBy === 'publication' ? '发布时间' :
                      filters.sortBy === 'rate' ? '价格' :
                      filters.sortBy === 'weight' ? '重量' : '日期'
                    }
                    <button onClick={() => updateFilter('sortBy', 'date')}>×</button>
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
                  <div key={load.id} className={`simple-card load-card ${load.serviceType?.toLowerCase()}${load.is_premium ? ' premium-post' : ''}${load.premium_type === 'top' ? ' premium-top' : ''}${load.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
                    {/* Premium标识 */}
                    {load.premium_type === 'top' && (
                      <div className="premium-badge premium-top-badge">
                        <Star size={14} fill="currentColor" />
                        置顶
                      </div>
                    )}
                    {load.premium_type === 'highlight' && (
                      <div className="premium-overlay"></div>
                    )}
                    
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

                      {/* LTL特有信息：托盘数量 */}
                      {load.serviceType === 'LTL' && (
                        <div className="pallets">
                          <span>板数: {load.pallets || '未知'}</span>
                        </div>
                      )}

                      {/* 货物重量 */}
                      <div className="weight">
                        <Scale size={14} />
                        {load.weight} lbs
                      </div>
                      
                      {/* 取货日期 */}
<div className="date">
  <Calendar size={14} />
  <span className="date-text">
    {load.pickupDate ? 
      new Date(load.pickupDate).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}) 
      : '未知日期'} 取货
  </span>
</div>
                      
                      {/* 距离信息 */}
                      <div className="distance-info">
                        {load.distanceInfo && (
                          <span className="distance-badge">
                            {load.distanceInfo.distance}
                          </span>
                        )}
                      </div>
                      

                      {/* 发布时间 */}
                      <div className="publication-date">
                        <Clock size={14} />
                        <span className="publication-text">
                          {load.publicationDate
                            ? formatPublicationDate(load.publicationDate)
                            : (load.postedTime || '未知时间')}
                        </span>
                      </div>

                      {/* 详情按钮 */}
                      <button className="details-btn" onClick={() => handleDetailsClick(load)}>
                        <Info size={14} />
                        详情
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
                  <div key={truck.id} className={`simple-card truck-card ${truck.serviceType?.toLowerCase().replace('/', '-')}${truck.is_premium ? ' premium-post' : ''}${truck.premium_type === 'top' ? ' premium-top' : ''}${truck.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
                    {/* Premium标识 */}
                    {truck.premium_type === 'top' && (
                      <div className="premium-badge premium-top-badge">
                        <Star size={14} fill="currentColor" />
                        置顶
                      </div>
                    )}
                    {truck.premium_type === 'highlight' && (
                      <div className="premium-overlay"></div>
                    )}
                    
                    {/* 卡片主要信息 */}
                    <div className="card-main">
                      {/* 服务类型标识 */}
                      <div className="service-type">
                        {truck.serviceType === 'FTL' ? (
                          <span className="ftl-badge">
                            <Truck size={16} />
                            整车 FTL
                          </span>
                        ) : truck.serviceType === 'LTL' ? (
                          <span className="ltl-badge">
                            <Truck size={16} />
                            零担 LTL
                          </span>
                        ) : (
                          <span className="ftl-ltl-badge">
                            <Truck size={16} />
                            FTL/LTL
                          </span>
                        )}
                      </div>
                      
                      {/* 运输路线 */}
                      <div className="route">
                        <span className="origin">{truck.preferredOrigin || truck.location}</span>
                        <ArrowRight size={16} />
                        <span className="destination">{truck.preferredDestination || truck.destination}</span>
                      </div>

                      {/* 车型 */}
                      <div className="equipment">
                        {truck.truckType}
                      </div>
                      
                      {/* 载重能力 */}
                      <div className="weight">
                        <Scale size={14} />
                        {truck.capacity}
                      </div>
                      
                      {/* 可用日期 */}
                      <div className="date">
                        <Calendar size={14} />
                        <span className="date-text">
                          {truck.availableDate ? 
                            new Date(truck.availableDate).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}) 
                            : '未知日期'} 可用
                        </span>
                      </div>
                      
                      {/* 发布时间 */}
                      <div className="publication-date">
                        <Clock size={14} />
                        <span className="publication-text">
                          {truck.publicationDate
                            ? formatPublicationDate(truck.publicationDate)
                            : (truck.postedTime || '未知时间')}
                        </span>
                      </div>

                      {/* 详情按钮 */}
                      <button className="details-btn" onClick={() => handleDetailsClick(truck)}>
                        <Info size={14} />
                        详情
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

      {/* 积分发布模态框 */}
      <PremiumPostModal
        isOpen={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          setCurrentFormData(null);
          setCurrentPostType(null);
        }}
        onConfirm={handleConfirmPost}
        postType={currentPostType}
        formData={currentFormData}
      />
    </div>
  );
};

export default FreightBoard; 

