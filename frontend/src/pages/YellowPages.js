import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Building,
  Users,
  Eye,
  Heart,
  ChevronRight
} from 'lucide-react';
import PremiumPostModal from '../components/PremiumPostModal';
import './YellowPages.css';

const YellowPages = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'category', 'subcategory'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(null);

  // 根据图片定义的分类结构
  const categories = {

    '仓储货代': {
      color: '#F7931E', 
      subcategories: ['收货仓', '海外仓', '货代公司']
    },
    '报关清关': {
      color: '#FFD23F',
      subcategories: ['中美清关行', 'T86']
    },
    '卡车服务': {
      color: '#06FFA5',
      subcategories: ['买卖车行', '维修保养', '交通罚单', '拖车服务', '配件装潢']
    },
    '保险服务': {
      color: '#4ECDC4',
      subcategories: ['汽车保险', '人身保险', '其他保险']
    },
    '金融服务': {
      color: '#45B7D1',
      subcategories: ['设备', '仓库', '生意', '等金融贷款', '税务会计', '理财']
    },
    '技术服务': {
      color: '#96CEB4',
      subcategories: ['软件商', '设备商', '硬件配件商']
    },
    '律师服务': {
      color: '#FFEAA7',
      subcategories: ['交通意外伤害', '综合律师', '民诉律师', '商业律师', '华人事务所']
    },
    '其他服务': {
      color: '#FF6B6B',
      subcategories: []
    }
    
  };

  // 统计信息状态
  const [categoryStats, setCategoryStats] = useState({});

  // 从API获取公司数据
  const fetchCompanies = async () => {
    if (!selectedSubcategory) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/companies/subcategory/${encodeURIComponent(selectedSubcategory)}?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data || []);
      } else {
        console.error('获取公司数据失败:', response.status);
        setCompanies([]);
      }
    } catch (error) {
      console.error('获取公司数据失败:', error);
      setCompanies([]);
    }
  };

  // 获取分类统计数据
  const fetchCategoryStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/companies/stats/categories`);
      if (response.ok) {
        const result = await response.json();
        setCategoryStats(result.data || {});
      }
    } catch (error) {
      console.error('获取分类统计失败:', error);
    }
  };

  // 组件初始化时获取分类统计
  useEffect(() => {
    fetchCategoryStats();
  }, []);

  // 当选择的子分类或搜索查询改变时获取数据
  useEffect(() => {
    if (selectedSubcategory) {
      fetchCompanies();
    }
  }, [selectedSubcategory, searchQuery]);

  // 过滤后的公司列表（API已处理搜索，这里主要用于显示）
  const filteredCompanies = companies;

  // 处理表单提交，显示积分模态框
  const handleFormSubmit = (companyData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('请先登录');
      return;
    }

    setCurrentFormData(companyData);
    setShowPublishModal(false);
    setShowPremiumModal(true);
  };

  // 确认发布公司信息
  const handleConfirmPublish = async ({ formData, premium }) => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      const postData = {
        ...formData,
        premium: premium
      };

      const response = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`企业信息发布成功！已扣除 ${result.creditsSpent} 积分`);
        setShowPremiumModal(false);
        setCurrentFormData(null);
        
        // 如果当前在相同的子分类，刷新数据
        if (selectedSubcategory === formData.subcategory) {
          fetchCompanies();
        }
        // 刷新分类统计
        fetchCategoryStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || '发布失败');
      }
    } catch (error) {
      console.error('发布公司信息失败:', error);
      alert('发布失败: ' + error.message);
    }
  };

  // 主页面 - 显示所有一级分类
  const renderMainView = () => (
    <div className="yellow-pages-main">
      <div className="yellow-page-header">
        <h1>商家黄页</h1>
        <p>选择服务分类，查找专业的物流服务商</p>
      </div>

      <div className="categories-grid">
        {Object.entries(categories).map(([categoryName, categoryData]) => (
          <div 
            key={categoryName}
            className="category-card"
            style={{ borderLeftColor: categoryData.color }}
            onClick={() => {
              setSelectedCategory(categoryName);
              setCurrentView('category');
            }}
          >
            <div className="category-header">
              <h3>{categoryName}</h3>
              <ChevronRight size={20} />
            </div>
            <div className="subcategories-preview">
              {categoryData.subcategories.slice(0, 3).map(sub => (
                <span key={sub} className="subcategory-tag">{sub}</span>
              ))}
              {categoryData.subcategories.length > 3 && (
                <span className="more-tag">+{categoryData.subcategories.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 分类页面 - 显示选中分类的所有二级分类
  const renderCategoryView = () => (
    <div className="yellow-pages-category">
      <div className="yellow-page-header">
        <div className="header-top">
          <button 
            className="back-button"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('分类页面返回按钮被点击');
              
              setCurrentView('main');
              setSelectedCategory(null);
            }}
          >
            <ArrowLeft size={20} />
            返回
          </button>
        </div>
        <div className="header-content">
          <h1>{selectedCategory}</h1>
          <p>选择具体的服务类别</p>
        </div>
      </div>

      <div className="subcategories-grid">
        {categories[selectedCategory]?.subcategories.map(subcategory => {
          const companyCount = categoryStats[selectedCategory]?.[subcategory] || 0;
          return (
            <div 
              key={subcategory}
              className="subcategory-card"
              onClick={() => {
                setSelectedSubcategory(subcategory);
                setCurrentView('subcategory');
              }}
            >
              <div className="subcategory-header">
                <h3>{subcategory}</h3>
                <ChevronRight size={20} />
              </div>
              <div className="company-count">
                {companyCount} 家企业
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 子分类页面 - 显示该服务类别下的公司列表
  const renderSubcategoryView = () => (
    <div className="yellow-pages-subcategory">
      <div className="yellow-page-header">
        <div className="header-top">
          <button 
            className="back-button"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('子分类页面返回按钮被点击');
              
              setCurrentView('category');
              setSelectedSubcategory(null);
              setCompanies([]);
              setSearchQuery('');
            }}
          >
            <ArrowLeft size={20} />
            返回 {selectedCategory}
          </button>
        </div>
        <div className="header-content">
          <h1>{selectedSubcategory}</h1>
          <p>共找到 {filteredCompanies.length} 家企业</p>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="搜索企业名称或服务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="publish-button"
          onClick={() => setShowPublishModal(true)}
        >
          <Plus size={20} />
          发布企业信息
        </button>
      </div>

      <div className="companies-list">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map(company => (
            <div key={company.id} className={`company-card${company.is_premium ? ' premium-post' : ''}${company.premium_type === 'top' ? ' premium-top' : ''}${company.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
              {/* Premium标识 */}
              {company.premium_type === 'top' && (
                <div className="premium-badge premium-top-badge">
                  <Star size={14} fill="currentColor" />
                  置顶
                </div>
              )}
              {company.premium_type === 'highlight' && (
                <div className="premium-overlay"></div>
              )}
              
              <div className="company-header">
                <div className="company-basic">
                  <h3>{company.name}</h3>
                  {company.verified && <span className="verified-badge">已验证</span>}
                  <div className="company-rating">
                    <Star size={14} fill="currentColor" />
                    <span>{company.rating}</span>
                    <span>({company.reviews}评价)</span>
                  </div>
                </div>
              </div>

              <p className="company-description">{company.description}</p>

              <div className="company-contact">
                <div className="contact-item">
                  <MapPin size={16} />
                  <span>{company.address}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} />
                  <span>{company.phone}</span>
                </div>
                <div className="contact-item">
                  <Mail size={16} />
                  <span>{company.email}</span>
                </div>
                {company.website && (
                  <div className="contact-item">
                    <Globe size={16} />
                    <span>{company.website}</span>
                  </div>
                )}
              </div>

              <div className="company-actions">
                <button className="action-button">
                  <Eye size={16} />
                  查看详情
                </button>
                <button className="action-button">
                  <Heart size={16} />
                  收藏
                </button>
                <button className="contact-button">
                  联系企业
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-companies">
            <Building size={64} />
            <h3>暂无企业信息</h3>
            <p>成为第一个在此分类发布信息的企业</p>
            <button 
              className="publish-button"
              onClick={() => setShowPublishModal(true)}
            >
              <Plus size={20} />
              发布企业信息
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // 发布企业信息模态框
  const renderPublishModal = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const companyData = {
        name: formData.get('name'),
        description: formData.get('description'),
        subcategory: formData.get('subcategory'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        website: formData.get('website') || ''
      };

      // 根据子分类确定主分类
      let category = '';
      for (const [catName, catData] of Object.entries(categories)) {
        if (catData.subcategories.includes(companyData.subcategory)) {
          category = catName;
          break;
        }
      }
      companyData.category = category;

      handleFormSubmit(companyData);
    };

    return (
      <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>发布企业信息</h2>
            <button onClick={() => setShowPublishModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <form className="publish-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>企业名称 *</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="请输入企业全称" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>服务分类 *</label>
                <select name="subcategory" required defaultValue={selectedSubcategory || ''}>
                  <option value="">请选择服务分类</option>
                  {Object.entries(categories).map(([categoryName, categoryData]) => (
                    <optgroup key={categoryName} label={categoryName}>
                      {categoryData.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>企业简介 *</label>
                <textarea 
                  name="description"
                  placeholder="请简要介绍您的企业主营业务和优势"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>联系电话 *</label>
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder="请输入联系电话" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>邮箱地址 *</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="请输入企业邮箱" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>企业地址 *</label>
                <input 
                  type="text" 
                  name="address"
                  placeholder="请输入详细地址" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>企业网站</label>
                <input 
                  type="url" 
                  name="website"
                  placeholder="请输入企业网站（可选）" 
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-button" 
                  onClick={() => setShowPublishModal(false)}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="submit-button"
                >
                  立即发布
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 调试信息
  console.log('当前视图:', currentView);
  console.log('选中分类:', selectedCategory);
  console.log('选中子分类:', selectedSubcategory);

  return (
    <div className="yellow-pages">
      {currentView === 'main' && renderMainView()}
      {currentView === 'category' && renderCategoryView()}
      {currentView === 'subcategory' && renderSubcategoryView()}
      {showPublishModal && renderPublishModal()}

      {/* 积分发布模态框 */}
      <PremiumPostModal
        isOpen={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          setCurrentFormData(null);
        }}
        onConfirm={handleConfirmPublish}
        postType="company"
        formData={currentFormData}
      />
    </div>
  );
};

export default YellowPages; 