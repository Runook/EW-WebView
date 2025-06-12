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
import './YellowPages.css';

const YellowPages = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'category', 'subcategory'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  // 根据图片定义的分类结构
  const categories = {
    '物流货运': {
      color: '#FF6B35',
      subcategories: ['陆运服务', '海运服务', '空运服务', '多式联运']
    },
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
    }
  };

  // 模拟公司数据
  const mockCompanies = {
    '陆运服务': [
      {
        id: 1,
        name: '东方物流集团',
        description: '专业提供全国整车零担运输服务，拥有自营车队800台',
        address: '上海市浦东新区张江高科技园区',
        phone: '021-12345678',
        email: 'info@eastlogistics.com',
        website: 'www.eastlogistics.com',
        rating: 4.8,
        reviews: 125,
        verified: true
      },
      {
        id: 2,
        name: '快运通物流',
        description: '专注于城际快运，覆盖华东地区主要城市',
        address: '江苏省苏州市工业园区',
        phone: '0512-88888888',
        email: 'service@kuaiyuntong.com',
        website: 'www.kuaiyuntong.com',
        rating: 4.5,
        reviews: 89,
        verified: true
      }
    ],
    '海运服务': [
      {
        id: 3,
        name: '中海国际货运',
        description: '专业国际海运代理，主营中美、中欧航线',
        address: '深圳市南山区蛇口港',
        phone: '0755-66666666',
        email: 'info@chinaocean.com',
        website: 'www.chinaocean.com',
        rating: 4.7,
        reviews: 156,
        verified: true
      }
    ],
    '中美清关行': [
      {
        id: 4,
        name: '美中通关服务',
        description: '专业中美清关服务，快速通关，安全可靠',
        address: '洛杉矶市中心商业区',
        phone: '+1-213-555-0123',
        email: 'info@uscnclearing.com',
        website: 'www.uscnclearing.com',
        rating: 4.6,
        reviews: 78,
        verified: true
      }
    ],
    '维修保养': [
      {
        id: 5,
        name: '金牌卡车维修中心',
        description: '专业卡车维修保养，24小时道路救援',
        address: '休斯顿市工业区',
        phone: '+1-713-555-0456',
        email: 'service@goldtruck.com',
        website: 'www.goldtruck.com',
        rating: 4.4,
        reviews: 92,
        verified: true
      }
    ],
    '汽车保险': [
      {
        id: 6,
        name: '太平洋保险经纪',
        description: '专业汽车保险服务，理赔快速，服务周到',
        address: '旧金山市金融区',
        phone: '+1-415-555-0789',
        email: 'info@pacificins.com',
        website: 'www.pacificins.com',
        rating: 4.3,
        reviews: 134,
        verified: true
      }
    ],
    '税务会计': [
      {
        id: 7,
        name: '华美金融咨询',
        description: '专业税务会计服务，为华人企业提供全方位服务',
        address: '纽约市曼哈顿唐人街',
        phone: '+1-212-555-0321',
        email: 'info@sinoamfinance.com',
        website: 'www.sinoamfinance.com',
        rating: 4.5,
        reviews: 67,
        verified: true
      }
    ],
    '软件商': [
      {
        id: 8,
        name: '智联物流科技',
        description: '专业物流管理软件开发，TMS、WMS系统定制',
        address: '西雅图市科技园区',
        phone: '+1-206-555-0654',
        email: 'info@smartlogis.com',
        website: 'www.smartlogis.com',
        rating: 4.8,
        reviews: 45,
        verified: true
      }
    ],
    '华人事务所': [
      {
        id: 9,
        name: '华人法律事务所',
        description: '专业华人律师团队，精通中美法律',
        address: '芝加哥市法律区',
        phone: '+1-312-555-0987',
        email: 'info@chineselaw.com',
        website: 'www.chineselaw.com',
        rating: 4.9,
        reviews: 89,
        verified: true
      }
    ]
  };

  // 从API获取公司数据
  const fetchCompanies = async () => {
    if (!selectedSubcategory) return;
    
    try {
      const response = await fetch(`/api/companies/subcategory/${encodeURIComponent(selectedSubcategory)}?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data || []);
      } else {
        // 如果API失败，使用模拟数据
        setCompanies(mockCompanies[selectedSubcategory] || []);
      }
    } catch (error) {
      console.error('获取公司数据失败:', error);
      // 使用模拟数据作为后备
      setCompanies(mockCompanies[selectedSubcategory] || []);
    }
  };

  // 当选择的子分类或搜索查询改变时获取数据
  useEffect(() => {
    if (selectedSubcategory) {
      fetchCompanies();
    }
  }, [selectedSubcategory, searchQuery]);

  // 搜索过滤（用于模拟数据）
  const filteredCompanies = companies.length > 0 ? companies : 
    (mockCompanies[selectedSubcategory] || []).filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // 发布公司信息
  const handlePublishCompany = async (companyData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('企业信息发布成功！');
        setShowPublishModal(false);
        // 如果当前在相同的子分类，刷新数据
        if (selectedSubcategory === companyData.subcategory) {
          fetchCompanies();
        }
      } else {
        const error = await response.json();
        alert(error.message || '发布失败');
      }
    } catch (error) {
      console.error('发布公司信息失败:', error);
      alert('发布失败，请稍后重试');
    }
  };

  // 主页面 - 显示所有一级分类
  const renderMainView = () => (
    <div className="yellow-pages-main">
      <div className="page-header">
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
      <div className="page-header">
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
          const companyCount = mockCompanies[subcategory]?.length || 0;
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
      <div className="page-header">
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
            <div key={company.id} className="company-card">
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

      handlePublishCompany(companyData);
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
    </div>
  );
};

export default YellowPages; 