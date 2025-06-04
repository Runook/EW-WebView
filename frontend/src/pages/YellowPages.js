import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Building,
  Users,
  Package,
  Plus,
  Eye,
  Heart,
  Share2,
  Verified
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './YellowPages.css';

const YellowPages = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    serviceType: '',
    scale: '',
    certification: ''
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // 企业类别
  const categories = [
    '全部类别', '运输公司', '货运代理', '仓储服务', '物流园区', 
    '供应链管理', '国际货运', '快递配送', '冷链物流', '危险品运输'
  ];

  // 服务类型
  const serviceTypes = [
    '全部服务', '陆运服务', '海运服务', '空运服务', '多式联运',
    '仓储配送', '报关清关', '保险服务', '金融服务', '信息服务'
  ];

  // 企业规模
  const scales = [
    '全部规模', '大型企业', '中型企业', '小型企业', '微型企业'
  ];

  // 模拟企业数据
  const mockCompanies = [
    {
      id: 1,
      name: '东方物流集团有限公司',
      category: '运输公司',
      description: '专业提供全国整车零担运输服务，拥有自营车队800台，覆盖全国主要城市',
      logo: '/api/placeholder/80/80',
      rating: 4.8,
      reviews: 1250,
      address: '上海市浦东新区张江高科技园区',
      city: '上海',
      phone: '021-12345678',
      email: 'info@eastlogistics.com',
      website: 'www.eastlogistics.com',
      services: ['陆运服务', '仓储配送', '供应链管理'],
      scale: '大型企业',
      certification: ['ISO9001', 'CNAS认证', '危险品运输'],
      establishedYear: 2008,
      employeeCount: '1000+',
      verified: true,
      views: 15680,
      favorites: 234
    },
    {
      id: 2,
      name: '中海国际货运代理',
      category: '货运代理',
      description: '专业国际货运代理，主营中美、中欧海运专线，提供门到门服务',
      logo: '/api/placeholder/80/80',
      rating: 4.6,
      reviews: 890,
      address: '深圳市南山区蛇口港',
      city: '深圳',
      phone: '0755-88888888',
      email: 'service@chinaocean.com',
      website: 'www.chinaocean.com',
      services: ['海运服务', '报关清关', '国际货运'],
      scale: '中型企业',
      certification: ['NVOCC', 'IATA', 'WCA'],
      establishedYear: 2012,
      employeeCount: '200-500',
      verified: true,
      views: 12340,
      favorites: 189
    },
    {
      id: 3,
      name: '快达冷链物流',
      category: '冷链物流',
      description: '专业冷链运输服务商，覆盖生鲜、医药、化工等温控货物运输',
      logo: '/api/placeholder/80/80',
      rating: 4.7,
      reviews: 567,
      address: '北京市大兴区亦庄经济开发区',
      city: '北京',
      phone: '010-66666666',
      email: 'cold@quickdelivery.com',
      website: 'www.quickcold.com',
      services: ['冷链物流', '医药运输', '生鲜配送'],
      scale: '中型企业',
      certification: ['GSP认证', 'HACCP', '医药运输'],
      establishedYear: 2015,
      employeeCount: '100-200',
      verified: true,
      views: 9876,
      favorites: 156
    }
  ];

  // 页面加载时获取企业数据
  useEffect(() => {
    fetchCompanies();
  }, []);

  // 获取企业列表 - API接口
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/yellow-pages/companies', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      // 模拟API延迟
      setTimeout(() => {
        setCompanies(mockCompanies);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取企业列表失败:', error);
      setLoading(false);
    }
  };

  // 搜索企业 - API接口
  const searchCompanies = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/yellow-pages/search', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     query: searchQuery,
      //     filters: filters
      //   })
      // });
      // const data = await response.json();
      
      // 模拟搜索逻辑
      let filteredCompanies = mockCompanies;
      
      if (searchQuery) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.category && filters.category !== '全部类别') {
        filteredCompanies = filteredCompanies.filter(company =>
          company.category === filters.category
        );
      }
      
      if (filters.city) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.city.includes(filters.city)
        );
      }
      
      setTimeout(() => {
        setCompanies(filteredCompanies);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('搜索失败:', error);
      setLoading(false);
    }
  };

  // 查看企业详情 - API接口
  const viewCompanyDetails = async (companyId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/yellow-pages/companies/${companyId}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      const company = mockCompanies.find(c => c.id === companyId);
      setSelectedCompany(company);
      
      // 增加浏览量
      // await fetch(`/api/yellow-pages/companies/${companyId}/view`, {
      //   method: 'POST'
      // });
    } catch (error) {
      console.error('获取企业详情失败:', error);
    }
  };

  // 收藏企业 - API接口
  const favoriteCompany = async (companyId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/yellow-pages/companies/${companyId}/favorite`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      
      console.log('收藏企业:', companyId);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  // 发布企业信息 - API接口
  const publishCompany = async (companyData) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/yellow-pages/companies', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(companyData)
      // });
      // const data = await response.json();
      
      console.log('发布企业信息:', companyData);
      setShowPublishModal(false);
      // 刷新列表
      fetchCompanies();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleSearch = () => {
    searchCompanies();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="yellow-pages">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="container">
          <h1>商家黄页</h1>
          <p>物流行业企业信息发布平台，提供全面的物流服务商查询和企业展示服务</p>
        </div>
      </div>

      <div className="container">
        {/* 搜索区域 */}
        <div className="search-section">
          <div className="search-bar">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder="搜索企业名称、服务类型或关键词"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                搜索
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="filters">
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="城市"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />

            <select 
              value={filters.serviceType} 
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            >
              {serviceTypes.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>

            <select 
              value={filters.scale} 
              onChange={(e) => handleFilterChange('scale', e.target.value)}
            >
              {scales.map(scale => (
                <option key={scale} value={scale}>{scale}</option>
              ))}
            </select>
          </div>

          {/* 发布按钮 */}
          <div className="publish-section">
            <button 
              className="publish-btn"
              onClick={() => setShowPublishModal(true)}
            >
              <Plus size={20} />
              发布企业信息
            </button>
          </div>
        </div>

        {/* 企业列表 */}
        <div className="companies-grid">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          ) : (
            companies.map(company => (
              <div key={company.id} className="company-card">
                <div className="company-header">
                  <img src={company.logo} alt={company.name} className="company-logo" />
                  <div className="company-basic">
                    <div className="company-name">
                      <h3>{company.name}</h3>
                      {company.verified && <Verified size={16} className="verified-icon" />}
                    </div>
                    <div className="company-rating">
                      <Star size={14} fill="currentColor" />
                      <span>{company.rating}</span>
                      <span>({company.reviews}评价)</span>
                    </div>
                  </div>
                </div>

                <div className="company-info">
                  <p className="company-description">{company.description}</p>
                  
                  <div className="company-details">
                    <div className="detail-item">
                      <Building size={14} />
                      <span>{company.category}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span>{company.city}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={14} />
                      <span>{company.employeeCount}人</span>
                    </div>
                  </div>

                  <div className="company-services">
                    {company.services.slice(0, 3).map(service => (
                      <span key={service} className="service-tag">{service}</span>
                    ))}
                    {company.services.length > 3 && (
                      <span className="more-services">+{company.services.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className="company-actions">
                  <div className="company-stats">
                    <span><Eye size={14} /> {company.views}</span>
                    <span><Heart size={14} /> {company.favorites}</span>
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      onClick={() => favoriteCompany(company.id)}
                    >
                      <Heart size={16} />
                    </button>
                    <button className="btn-icon">
                      <Share2 size={16} />
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => viewCompanyDetails(company.id)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {companies.length === 0 && !loading && (
          <div className="no-results">
            <Building size={64} />
            <h3>暂无企业信息</h3>
            <p>试试调整搜索条件或发布您的企业信息</p>
          </div>
        )}
      </div>

      {/* 企业详情模态框 */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content company-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCompany.name}</h2>
              <button onClick={() => setSelectedCompany(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="company-detail-content">
                <div className="company-main-info">
                  <img src={selectedCompany.logo} alt={selectedCompany.name} />
                  <div className="basic-info">
                    <div className="rating">
                      <Star size={16} fill="currentColor" />
                      <span>{selectedCompany.rating}</span>
                      <span>({selectedCompany.reviews}评价)</span>
                    </div>
                    <p>{selectedCompany.description}</p>
                  </div>
                </div>

                <div className="company-details-grid">
                  <div className="detail-section">
                    <h4>联系信息</h4>
                    <div className="contact-info">
                      <div><Phone size={16} /> {selectedCompany.phone}</div>
                      <div><Mail size={16} /> {selectedCompany.email}</div>
                      <div><Globe size={16} /> {selectedCompany.website}</div>
                      <div><MapPin size={16} /> {selectedCompany.address}</div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>企业信息</h4>
                    <div className="enterprise-info">
                      <div>成立年份：{selectedCompany.establishedYear}</div>
                      <div>企业规模：{selectedCompany.scale}</div>
                      <div>员工人数：{selectedCompany.employeeCount}</div>
                      <div>主营业务：{selectedCompany.category}</div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>服务项目</h4>
                    <div className="services-list">
                      {selectedCompany.services.map(service => (
                        <span key={service} className="service-tag">{service}</span>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>资质认证</h4>
                    <div className="certifications">
                      {selectedCompany.certification.map(cert => (
                        <span key={cert} className="cert-tag">{cert}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发布企业信息模态框 */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>发布企业信息</h2>
              <button onClick={() => setShowPublishModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="publish-form">
                <div className="form-group">
                  <label>企业名称</label>
                  <input type="text" placeholder="请输入企业全称" />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>企业类别</label>
                    <select>
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>企业规模</label>
                    <select>
                      {scales.slice(1).map(scale => (
                        <option key={scale} value={scale}>{scale}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>企业简介</label>
                  <textarea placeholder="请简要介绍您的企业主营业务和优势"></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>联系电话</label>
                    <input type="tel" placeholder="请输入联系电话" />
                  </div>
                  <div className="form-group">
                    <label>邮箱地址</label>
                    <input type="email" placeholder="请输入企业邮箱" />
                  </div>
                </div>

                <div className="form-group">
                  <label>企业地址</label>
                  <input type="text" placeholder="请输入详细地址" />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowPublishModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => publishCompany({})}
                  >
                    立即发布
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YellowPages; 