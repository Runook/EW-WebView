import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Heart, X, Building, Package, Search, Filter, ChevronDown, Upload, Send, ImageIcon, Camera, MapPin, Settings, Truck, Calendar, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import './LogisticsRental.css';

const LogisticsRental = () => {

  const [activeTab, setActiveTab] = useState('rental'); // 'rental' 或 'sale'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [rentalItems, setRentalItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 发布表单状态
  const [postForm, setPostForm] = useState({
    images: [],
    coverImageIndex: 0
  });

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

  // 模拟出租数据（添加多张图片）
  const mockRentalItems = useMemo(() => ([
    {
      id: 1,
      title: '重型冷藏车出租',
      category: '卡车',
      subCategory: '冷藏车',
      location: '洛杉矶',
      price: '$2500/月',
      condition: '9成新',
      brand: '沃尔沃',
      description: '2020年沃尔沃重型冷藏车，温度控制-18℃至+25℃，适合生鲜配送',
      specifications: {
        year: '2020年',
        make: '沃尔沃',
        model: 'VNL 760',
        mileage: '15万英里',
        engine: '沃尔沃D13发动机',
        transmission: '自动变速箱',
        temperatureRange: '-18℃至+25℃'
      },
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-10',
      posted: '2天前',
      views: 125,
      contact: {
        name: '张经理',
        company: '冷链物流公司',
        phone: '(123) 456-7890'
      }
    },
    {
      id: 2,
      title: '大型仓库出租',
      category: '仓库/物流园区',
      subCategory: '常温储存',
      location: '纽约',
      price: '$8000/月',
      condition: '全新',
      brand: '',
      description: '10000平方英尺现代化仓库，配备装卸平台，适合电商仓储',
      specifications: {
        area: '10000平方英尺',
        height: '24英尺',
        doors: '6个装卸门',
        parking: '20个停车位',
        services: ['常温储存', '拣选包装', '短期储存']
      },
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-11',
      posted: '1天前',
      views: 89,
      contact: {
        name: '李总',
        company: '仓储管理公司',
        phone: '(234) 567-8901'
      }
    },
    {
      id: 3,
      title: '叉车短期租赁',
      category: '叉车',
      subCategory: '电动叉车',
      location: '旧金山',
      price: '$150/天',
      condition: '8成新',
      brand: '丰田',
      description: '丰田电动叉车，载重2吨，适合仓库作业',
      specifications: {
        capacity: '2吨',
        liftHeight: '3米',
        power: '电动',
        battery: '锂电池',
        runtime: '8小时'
      },
      images: [
        'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1605902711834-8b11c3e3ef75?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-09',
      posted: '3天前',
      views: 67,
      contact: {
        name: '王师傅',
        company: '设备租赁公司',
        phone: '(345) 678-9012'
      }
    }
  ]), []);

  // 模拟出售数据（添加多张图片）
  const mockSaleItems = useMemo(() => ([
    {
      id: 1,
      title: '2019年肯沃斯T680卡车出售',
      category: '卡车出售',
      subCategory: '重型卡车',
      location: '芝加哥',
      price: '$85000',
      condition: '8成新',
      brand: '肯沃斯',
      description: '2019年肯沃斯T680，里程35万英里，保养良好，手续齐全',
      specifications: {
        year: '2019年',
        make: '肯沃斯',
        model: 'T680',
        mileage: '35万英里',
        engine: 'PACCAR MX-13',
        transmission: '18速手动',
        vin: 'VIN12345678901234567'
      },
      images: [
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-08',
      posted: '4天前',
      views: 156,
      contact: {
        name: '陈老板',
        company: '二手车行',
        phone: '(456) 789-0123'
      }
    },
    {
      id: 2,
      title: '物流公司MC DOT出售',
      category: '公司MC DOT',
      subCategory: 'MC权限',
      location: '休斯顿',
      price: '$15000',
      condition: '全新',
      brand: '',
      description: '正规物流公司MC DOT权限转让，运营记录良好，保险齐全',
      specifications: {
        mcNumber: 'MC-123456',
        dotNumber: 'DOT-789012',
        operatingYears: '5年',
        safetyRating: 'Satisfactory',
        insurance: '100万美元',
        authority: 'Property'
      },
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-07',
      posted: '5天前',
      views: 234,
      contact: {
        name: '刘总',
        company: '物流咨询公司',
        phone: '(567) 890-1234'
      }
    },
    {
      id: 3,
      title: '仓库货架清仓出售',
      category: '叉车货架',
      subCategory: '重型货架',
      location: '凤凰城',
      price: '$50/组',
      condition: '7成新',
      brand: '钢铁侠',
      description: '重型货架批量出售，高3米，承重2吨/层，适合仓库使用',
      specifications: {
        height: '3米',
        width: '2.5米',
        depth: '1米',
        capacity: '2吨/层',
        material: '钢材',
        quantity: '50组'
      },
      images: [
        'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=600&fit=crop'
      ],
      coverImageIndex: 0,
      publishDate: '2024-01-06',
      posted: '6天前',
      views: 78,
      contact: {
        name: '赵经理',
        company: '仓储设备公司',
        phone: '(678) 901-2345'
      }
    }
  ]), []);

  useEffect(() => {
    setRentalItems(mockRentalItems);
    setSaleItems(mockSaleItems);
  }, [mockRentalItems, mockSaleItems]);

  // 处理照片上传
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPostForm(prev => ({
            ...prev,
            images: [...prev.images, {
              file: file,
              url: e.target.result,
              name: file.name
            }]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // 删除照片
  const removeImage = (index) => {
    setPostForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        coverImageIndex: prev.coverImageIndex >= newImages.length ? 0 : prev.coverImageIndex
      };
    });
  };

  // 设置封面照片
  const setCoverImage = (index) => {
    setPostForm(prev => ({
      ...prev,
      coverImageIndex: index
    }));
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

  // 重置发布表单
  const resetPostForm = () => {
    setPostForm({
      images: [],
      coverImageIndex: 0
    });
  };

  // 发布信息
  const handlePost = (formData) => {
    const newItem = {
      id: (activeTab === 'rental' ? rentalItems.length : saleItems.length) + 1,
      title: formData.get('title'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory'),
      location: formData.get('location'),
      price: formData.get('price'),
      condition: formData.get('condition'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      specifications: {},
      images: postForm.images.map(img => img.url),
      coverImageIndex: postForm.coverImageIndex,
      publishDate: new Date().toISOString().split('T')[0],
      posted: '刚刚',
      views: 0,
      contact: {
        name: formData.get('contactName'),
        company: formData.get('company'),
        phone: formData.get('phone')
      }
    };

    if (activeTab === 'rental') {
      setRentalItems([newItem, ...rentalItems]);
    } else {
      setSaleItems([newItem, ...saleItems]);
    }
    setShowPostModal(false);
    resetPostForm();
  };

  // 查看详情
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setShowDetailModal(true);
  };

  // 图片导航
  const nextImage = () => {
    if (selectedItem && selectedItem.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === selectedItem.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedItem && selectedItem.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedItem.images.length - 1 : prev - 1
      );
    }
  };

  // 定义地点、状态、租期和发布时间选项
  const locations = ['洛杉矶', '纽约', '旧金山', '芝加哥', '休斯顿', '凤凰城'];
  const conditions = ['全新', '9成新', '8成新', '7成新', '6成新', '5成新', '4成新', '3成新', '2成新', '1成新'];
  const rentalPeriods = ['不限', '1天', '3天', '1周', '1个月'];
  const publishTimeOptions = ['全部时间', '今天', '3天内', '1周内', '1个月内'];

  return (
    <div className="logistics-rental-page">
      {/* 页面头部 */}
      <div className="page-header-rental">
        <div className="header-content">
          <h1>物流租售</h1>
          <p>专业的物流设备租赁与买卖平台</p>
        </div>
      </div>

      {/* 切换标签 */}
      <div className="tab-switcher">
        <button 
          className={`tab-button ${activeTab === 'rental' ? 'active' : ''}`}
          onClick={() => setActiveTab('rental')}
        >
          <Building size={20} />
          物流出租
        </button>
        <button 
          className={`tab-button ${activeTab === 'sale' ? 'active' : ''}`}
          onClick={() => setActiveTab('sale')}
        >
          <Package size={20} />
          物流出售
        </button>
      </div>

      {/* 搜索和控制区域 */}
      <div className="controls-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder={activeTab === 'rental' ? '搜索租赁设备...' : '搜索出售物品...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="control-buttons">
          <button 
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            筛选
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>
          
          <button 
            className="post-button"
            onClick={() => setShowPostModal(true)}
          >
            <Plus size={20} />
            {activeTab === 'rental' ? '发布出租' : '发布出售'}
          </button>
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
                {conditions.slice(1).map(condition => (
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

      {/* 内容区域 */}
      <div className="content-area">
        <div className="items-list">
          {getCurrentItems().map(item => (
            <div key={item.id} className="item-card">
              {/* 添加图片显示区域 */}
              <div className="item-image">
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={item.images[item.coverImageIndex || 0]} 
                    alt={item.title}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';
                    }}
                  />
                ) : (
                  <div className="no-image">
                    <ImageIcon size={48} />
                    <span>暂无图片</span>
                  </div>
                )}
                {item.images && item.images.length > 1 && (
                  <div className="image-count">
                    <Camera size={14} />
                    {item.images.length}
                  </div>
                )}
              </div>

              <div className="item-content">
                <div className="item-header">
                  <div className="item-title">
                    <h3>{item.title}</h3>
                    <span className="item-category">{item.category}</span>
                    {item.subCategory && (
                      <span className="item-subcategory">{item.subCategory}</span>
                    )}
                  </div>
                  <div className="item-price">{item.price}</div>
                </div>
                
                <div className="item-details">
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{item.location}</span>
                  </div>
                  <div className="detail-item">
                    <Settings size={16} />
                    <span>{item.condition}</span>
                  </div>
                  {item.brand && (
                    <div className="detail-item">
                      <Truck size={16} />
                      <span>{item.brand}</span>
                    </div>
                  )}
                  <div className="detail-item posted">
                    <Calendar size={16} />
                    <span>{item.posted}</span>
                  </div>
                </div>

                <p className="item-description">{item.description}</p>

                <div className="item-footer">
                  <div className="item-stats">
                    <span><Eye size={14} /> {item.views}浏览</span>
                    <span>{item.contact.name} · {item.contact.company}</span>
                  </div>
                  
                  <div className="item-actions">
                    <button className="contact-button">
                      <Phone size={16} />
                      联系卖家
                    </button>
                    <button 
                      className="details-button"
                      onClick={() => handleViewDetails(item)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {getCurrentItems().length === 0 && (
            <div className="empty-state">
              {activeTab === 'rental' ? <Building size={64} /> : <Package size={64} />}
              <h3>暂无{activeTab === 'rental' ? '租赁' : '出售'}信息</h3>
              <p>试试调整搜索条件或发布您的{activeTab === 'rental' ? '出租' : '出售'}信息</p>
            </div>
          )}
        </div>
      </div>

      {/* 发布模态框 */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeTab === 'rental' ? '发布出租信息' : '发布出售信息'}</h2>
              <button onClick={() => {
                setShowPostModal(false);
                resetPostForm();
              }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePost(new FormData(e.target));
            }}>
              <div className="modal-body">
                {/* 照片上传区域 */}
                <div className="form-group">
                  <label>照片上传</label>
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image-upload" className="upload-button">
                      <Upload size={20} />
                      点击上传照片
                    </label>
                    <p className="upload-hint">支持多张照片，建议尺寸800x600，格式JPG/PNG</p>
                  </div>

                  {/* 照片预览区域 */}
                  {postForm.images.length > 0 && (
                    <div className="image-preview-area">
                      <div className="image-grid">
                        {postForm.images.map((image, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={image.url} alt={`预览 ${index + 1}`} />
                            <div className="image-actions">
                              <button
                                type="button"
                                className={`cover-button ${postForm.coverImageIndex === index ? 'active' : ''}`}
                                onClick={() => setCoverImage(index)}
                                title="设为封面"
                              >
                                {postForm.coverImageIndex === index ? '封面' : '设为封面'}
                              </button>
                              <button
                                type="button"
                                className="remove-button"
                                onClick={() => removeImage(index)}
                                title="删除"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>标题 *</label>
                  <input type="text" name="title" required placeholder="如：重型冷藏车出租" />
                </div>
                
                <div className="form-group">
                  <label>分类 *</label>
                  <select name="category" required>
                    <option value="">请选择分类</option>
                    {getCurrentCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>地点 *</label>
                    <select name="location" required>
                      <option value="">请选择地点</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{activeTab === 'rental' ? '租金' : '价格'} *</label>
                    <input type="text" name="price" required placeholder={activeTab === 'rental' ? '如：$2500/月' : '如：$85000'} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>设备状态 *</label>
                    <select name="condition" required>
                      <option value="">请选择</option>
                      {conditions.slice(1).map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>品牌</label>
                    <input type="text" name="brand" placeholder="如：沃尔沃" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>详细描述 *</label>
                  <textarea name="description" required placeholder="详细描述设备信息、技术参数、使用条件等..."></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>联系人 *</label>
                    <input type="text" name="contactName" required placeholder="如：张经理" />
                  </div>
                  <div className="form-group">
                    <label>公司名称</label>
                    <input type="text" name="company" placeholder="如：冷链物流公司" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>联系电话 *</label>
                  <input type="tel" name="phone" required placeholder="如：(123) 456-7890" />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => {
                  setShowPostModal(false);
                  resetPostForm();
                }}>
                  取消
                </button>
                <button type="submit" className="submit-button">
                  <Send size={16} />
                  发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 详情模态框 */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem.title}</h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* 图片展示区域 */}
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="detail-images">
                  <div className="main-image">
                    <img 
                      src={selectedItem.images[currentImageIndex]} 
                      alt={`${selectedItem.title} - 图片 ${currentImageIndex + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
                      }}
                    />
                    {selectedItem.images.length > 1 && (
                      <>
                        <button className="image-nav prev" onClick={prevImage}>
                          <ChevronLeft size={24} />
                        </button>
                        <button className="image-nav next" onClick={nextImage}>
                          <ChevronRight size={24} />
                        </button>
                        <div className="image-indicator">
                          {currentImageIndex + 1} / {selectedItem.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {selectedItem.images.length > 1 && (
                    <div className="image-thumbnails">
                      {selectedItem.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`缩略图 ${index + 1}`}
                          className={currentImageIndex === index ? 'active' : ''}
                          onClick={() => setCurrentImageIndex(index)}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=100&fit=crop';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="detail-price">{selectedItem.price}</div>
              
              <div className="detail-info">
                <div className="info-row">
                  <span className="label">分类：</span>
                  <span>{selectedItem.category}</span>
                </div>
                {selectedItem.subCategory && (
                  <div className="info-row">
                    <span className="label">细分：</span>
                    <span>{selectedItem.subCategory}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">地点：</span>
                  <span>{selectedItem.location}</span>
                </div>
                <div className="info-row">
                  <span className="label">状态：</span>
                  <span>{selectedItem.condition}</span>
                </div>
                {selectedItem.brand && (
                  <div className="info-row">
                    <span className="label">品牌：</span>
                    <span>{selectedItem.brand}</span>
                  </div>
                )}
              </div>

              <div className="detail-description">
                <h4>详细描述</h4>
                <p>{selectedItem.description}</p>
              </div>

              {selectedItem.specifications && Object.keys(selectedItem.specifications).length > 0 && (
                <div className="detail-specifications">
                  <h4>技术参数</h4>
                  <div className="specs-grid">
                    {Object.entries(selectedItem.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-label">{key}：</span>
                        <span className="spec-value">{Array.isArray(value) ? value.join(', ') : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-contact">
                <h4>联系信息</h4>
                <div className="contact-info">
                  <div><strong>联系人：</strong>{selectedItem.contact.name}</div>
                  {selectedItem.contact.company && (
                    <div><strong>公司：</strong>{selectedItem.contact.company}</div>
                  )}
                  <div><strong>电话：</strong>{selectedItem.contact.phone}</div>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button className="contact-button">
                <Phone size={16} />
                联系卖家
              </button>
              <button className="favorite-button">
                <Heart size={16} />
                收藏
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsRental;