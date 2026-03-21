import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Heart, X, Building, Package, Search, Filter, ChevronDown, Upload, Send, ImageIcon, Camera, MapPin, Settings, Truck, Calendar, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import PremiumPostModal from '../components/PremiumPostModal';
import './LogisticsRental.css';
import { useModal } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/common/Notification';
import { apiClient } from '../utils/apiClient';

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
  const [currentFormData, setCurrentFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const premiumModal = useModal();
    // 通知和日志系统
    const { success, error: showError, apiError } = useNotification();
  
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

  // 获取租赁数据
  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/rentals');
      if (response.success) {
        setRentalItems(response.data);
      }
    } catch (error) {
      console.error('获取租赁数据失败:', error);
      apiError(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取出售数据
  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales');
      if (response.success) {
        setSaleItems(response.data);
      }
    } catch (error) {
      console.error('获取出售数据失败:', error);
      apiError(error);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchRentals();
    fetchSales();
  }, []);

  // 压缩图片
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 如果图片太大，等比例缩小
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为Blob
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理照片上传 - 压缩后直接保存base64
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // 压缩图片
          const compressedFile = await compressImage(file);
          console.log(`📸 图片压缩: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);

          // 读取压缩后的图片为base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Url = e.target.result;
            console.log(`✅ 图片处理完成: ${file.name}, 大小: ${(compressedFile.size / 1024).toFixed(1)}KB`);
            
            setPostForm(prev => ({
              ...prev,
              images: [...prev.images, {
                file: compressedFile,
                url: base64Url,
                serverUrl: base64Url, // 直接使用base64作为最终URL
                name: file.name,
                uploading: false,
                failed: false
              }]
            }));
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          console.error('❌ 图片处理失败:', error);
          showError(`图片 ${file.name} 处理失败: ${error.message}`);
        }
      }
    }
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
    if (!isAuthenticated) {
      showError('请先登录再发布');
      return;
    }
    
    // 保存表单数据，等待Premium选项
    const postData = {
      title: formData.get('title'),
      category: formData.get('category'),
      location: formData.get('location'),
      price: formData.get('price'),
      condition: formData.get('condition'),
      description: formData.get('description'),
      contactPhone: formData.get('phone'),
      contactPerson: formData.get('contactName')
    };

    // 添加可选字段（只有非空时才添加）
    const subCategory = formData.get('subCategory');
    if (subCategory) {
      postData.sub_category = subCategory;
    }

    const brand = formData.get('brand');
    if (brand) {
      postData.brand = brand;
    }

    const company = formData.get('company');
    if (company) {
      postData.company = company;
    }

    // 处理图片 - 使用压缩后的base64
    if (postForm.images && postForm.images.length > 0) {
      // 确保所有图片都已处理完成
      const processingImages = postForm.images.filter(img => img.uploading);
      
      if (processingImages.length > 0) {
        showError('请等待图片处理完成...');
        return;
      }
      
      postData.images = postForm.images.map(img => img.serverUrl || img.url);
    }

    setCurrentFormData(postData);
    setShowPostModal(false);
    premiumModal.open();
  };


 // 确认发布函数
  const handleConfirmPost = async ({ formData, premium }) => {
    try {
      setLoading(true);
      
      const postData = {
        ...currentFormData,
        premium: premium
      };

      const endpoint = activeTab === 'rental' ? '/rentals' : '/sales';
      
      console.log('📤 发布数据:', {
        endpoint,
        postData,
        activeTab
      });
      
      const result = await apiClient.post(endpoint, postData);

      console.log('✅ 发布结果:', result);

      if (result.success) {
        premiumModal.close();
        setCurrentFormData(null);
        resetPostForm();
        
        // 刷新数据列表
        if (activeTab === 'rental') {
          await fetchRentals();
        } else {
          await fetchSales();
        }
        
        const typeName = activeTab === 'rental' ? '租赁' : '出售';
        success(`${typeName}信息发布成功！已扣除 ${result.creditsSpent} 积分`);
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      console.error('❌ 发布失败详情:', error);
      console.error('错误响应:', error.response);
      showError('发布失败: ' + error.message);
    } finally {
      setLoading(false);
    }
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
    <div className="lr-page">
      {/* Hero */}
      <div className="lr-hero">
        <div className="lr-hero-bg"><div className="lr-orb lr-orb-1"></div><div className="lr-orb lr-orb-2"></div></div>
        <div className="lr-hero-content">
          <h1>物流租售</h1>
          <p>专业的物流设备租赁与买卖平台</p>
        </div>
      </div>

      <div className="lr-body">
        {/* Tab + Controls Row */}
        <div className="lr-toolbar">
          <div className="lr-tabs">
            <button className={`lr-tab ${activeTab === 'rental' ? 'lr-tab-active' : ''}`} onClick={() => setActiveTab('rental')}>
              <Building size={16} />
              物流出租
            </button>
            <button className={`lr-tab ${activeTab === 'sale' ? 'lr-tab-active' : ''}`} onClick={() => setActiveTab('sale')}>
              <Package size={16} />
              物流出售
            </button>
          </div>

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
            <button className="lr-post-btn" onClick={() => setShowPostModal(true)}>
              <Plus size={15} />
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
                <h3 className="lr-card-title" onClick={() => handleViewDetails(item)}>{item.title}</h3>
                <span className="lr-card-badge">{activeTab === 'rental' ? '出租' : '出售'}</span>
              </div>

              <div className="lr-card-price">{item.price}</div>

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
                  <button className="lr-btn-phone"><Phone size={13} /> 查看电话</button>
                  <button className="lr-btn-detail" onClick={() => handleViewDetails(item)}>查看详情</button>
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

      {/* 发布表单 (inline) */}
      {showPostModal && (
        <div className="lr-inline-form" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <div className="lr-inline-card">
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

                <div className="form-group">
                  <label>子分类</label>
                  <input type="text" name="subCategory" placeholder="如：重型卡车、中型卡车等" />
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

      {/* 积分发布模态框 */}
      <PremiumPostModal
        isOpen={premiumModal.isOpen}
        onClose={() => {
          premiumModal.close();
          setCurrentFormData(null);
        }}
        onConfirm={handleConfirmPost}
        postType={activeTab === 'rental' ? 'rental' : 'sale'}
        formData={currentFormData}
      />
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