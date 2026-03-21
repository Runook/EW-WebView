import React, { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Heart,
  ChevronRight,
  Warehouse,
  FileCheck,
  Truck,
  ShieldCheck,
  Landmark,
  Cpu,
  Scale,
  MoreHorizontal
} from 'lucide-react';
import PremiumPostModal from '../components/PremiumPostModal';
import { apiServices, getAuthToken, apiClient } from '../utils/apiClient';
import { useNotification } from '../components/common/Notification';
import { apiLogger } from '../utils/logger';
import { useModal } from '../hooks';
import './YellowPages.css';

const YellowPages = () => {
  const { success, error: showError, apiError } = useNotification();
  const publishModal = useModal();
  const premiumModal = useModal();
  
  const [currentView, setCurrentView] = useState('main');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFormData, setCurrentFormData] = useState(null);

  const categories = {
    '仓储货代': {
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      bg: 'rgba(245, 158, 11, 0.08)',
      icon: Warehouse,
      subcategories: ['收货仓', '海外仓', '货代公司']
    },
    '报关清关': {
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      bg: 'rgba(139, 92, 246, 0.08)',
      icon: FileCheck,
      subcategories: ['中美清关行', 'T86']
    },
    '卡车服务': {
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      bg: 'rgba(16, 185, 129, 0.08)',
      icon: Truck,
      subcategories: ['买卖车行', '维修保养', '交通罚单', '拖车服务', '配件装潢']
    },
    '保险服务': {
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      bg: 'rgba(6, 182, 212, 0.08)',
      icon: ShieldCheck,
      subcategories: ['汽车保险', '人身保险', '其他保险']
    },
    '金融服务': {
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      bg: 'rgba(59, 130, 246, 0.08)',
      icon: Landmark,
      subcategories: ['设备', '仓库', '生意', '等金融贷款', '税务会计', '理财']
    },
    '技术服务': {
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
      bg: 'rgba(236, 72, 153, 0.08)',
      icon: Cpu,
      subcategories: ['软件商', '设备商', '硬件配件商']
    },
    '律师服务': {
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      bg: 'rgba(99, 102, 241, 0.08)',
      icon: Scale,
      subcategories: ['交通意外伤害', '综合律师', '民诉律师', '商业律师', '华人事务所']
    },
    '其他服务': {
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      bg: 'rgba(239, 68, 68, 0.08)',
      icon: MoreHorizontal,
      subcategories: []
    }
  };

  const [categoryStats, setCategoryStats] = useState({});

  const fetchCompanies = useCallback(async () => {
    if (!selectedSubcategory) return;
    try {
      const result = await apiServices.companies.getBySubcategory(selectedSubcategory, { search: searchQuery });
      setCompanies(result.data || []);
    } catch (error) {
      apiLogger.error('获取公司数据失败', error);
      apiError('获取公司数据', error);
      setCompanies([]);
    }
  }, [selectedSubcategory, searchQuery, apiError]);

  const fetchCategoryStats = useCallback(async () => {
    try {
      const result = await apiServices.companies.getStats();
      setCategoryStats(result.data || {});
    } catch (error) {
      apiLogger.error('获取分类统计失败', error);
      apiError('获取分类统计', error);
    }
  }, [apiError]);

  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

  useEffect(() => {
    if (selectedSubcategory) {
      fetchCompanies();
    }
  }, [selectedSubcategory, searchQuery, fetchCompanies]);

  const filteredCompanies = companies;

  const handleFormSubmit = (companyData) => {
    const token = getAuthToken();
    if (!token) {
      showError('请先登录');
      return;
    }
    setCurrentFormData(companyData);
    publishModal.close();
    premiumModal.open();
  };

  const handleConfirmPublish = async ({ formData, premium }) => {
    try {
      const postData = { ...formData, premium };
      const result = await apiClient.post('/companies', postData);
      if (result.success) {
        success(`企业信息发布成功！已扣除 ${result.creditsSpent} 积分`);
        premiumModal.close();
        setCurrentFormData(null);
        if (selectedSubcategory === formData.subcategory) fetchCompanies();
        fetchCategoryStats();
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      apiLogger.error('发布公司信息失败', error);
      showError('发布失败: ' + error.message);
    }
  };

  const getTotalCount = (catName) => {
    const stats = categoryStats[catName];
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, n) => sum + n, 0);
  };

  // ===== VIEWS =====

  const renderMainView = () => (
    <div className="yp-main">
      <div className="yp-hero">
        <div className="yp-hero-bg">
          <div className="yp-orb yp-orb-1"></div>
          <div className="yp-orb yp-orb-2"></div>
        </div>
        <div className="yp-hero-content">
          <h1 className="yp-hero-title">商家黄页</h1>
          <p className="yp-hero-desc">精选北美物流服务商，一站式查找专业合作伙伴</p>
        </div>
      </div>

      <div className="yp-categories">
        {Object.entries(categories).map(([name, data]) => {
          const Icon = data.icon;
          const total = getTotalCount(name);
          return (
            <div
              key={name}
              className="yp-cat-card"
              onClick={() => {
                setSelectedCategory(name);
                setCurrentView('category');
              }}
            >
              <div className="yp-cat-icon" style={{ background: data.gradient }}>
                <Icon size={24} />
              </div>
              <div className="yp-cat-body">
                <div className="yp-cat-top">
                  <h3 className="yp-cat-name">{name}</h3>
                  <ChevronRight size={18} className="yp-cat-arrow" />
                </div>
                <div className="yp-cat-tags">
                  {data.subcategories.slice(0, 3).map(sub => (
                    <span key={sub} className="yp-tag">{sub}</span>
                  ))}
                  {data.subcategories.length > 3 && (
                    <span className="yp-tag yp-tag-more">+{data.subcategories.length - 3}</span>
                  )}
                </div>
                {total > 0 && <span className="yp-cat-count">{total} 家企业入驻</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCategoryView = () => {
    const catData = categories[selectedCategory];
    const Icon = catData?.icon || Building;
    return (
      <div className="yp-category-view">
        <div className="yp-hero yp-hero-sm">
          <div className="yp-hero-bg">
            <div className="yp-orb yp-orb-1" style={{ background: `radial-gradient(circle, ${catData?.color || '#3b82f6'} 0%, transparent 70%)` }}></div>
          </div>
          <div className="yp-hero-content">
            <button
              className="yp-back"
              type="button"
              onClick={() => { setCurrentView('main'); setSelectedCategory(null); }}
            >
              <ArrowLeft size={18} />
              <span>返回黄页</span>
            </button>
            <div className="yp-hero-row">
              <div className="yp-hero-cat-icon" style={{ background: catData?.gradient }}>
                <Icon size={28} />
              </div>
              <div>
                <h1 className="yp-hero-title">{selectedCategory}</h1>
                <p className="yp-hero-desc">选择具体的服务类别</p>
              </div>
            </div>
          </div>
        </div>

        <div className="yp-subcategories">
          {catData?.subcategories.map(sub => {
            const count = categoryStats[selectedCategory]?.[sub] || 0;
            return (
              <div
                key={sub}
                className="yp-sub-card"
                onClick={() => { setSelectedSubcategory(sub); setCurrentView('subcategory'); }}
              >
                <div className="yp-sub-info">
                  <h3>{sub}</h3>
                  <span className="yp-sub-count">{count} 家企业</span>
                </div>
                <div className="yp-sub-arrow" style={{ color: catData?.color }}>
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSubcategoryView = () => {
    const catData = categories[selectedCategory];
    return (
      <div className="yp-list-view">
        <div className="yp-hero yp-hero-sm">
          <div className="yp-hero-bg">
            <div className="yp-orb yp-orb-1" style={{ background: `radial-gradient(circle, ${catData?.color || '#3b82f6'} 0%, transparent 70%)` }}></div>
          </div>
          <div className="yp-hero-content">
            <button
              className="yp-back"
              type="button"
              onClick={() => { setCurrentView('category'); setSelectedSubcategory(null); setCompanies([]); setSearchQuery(''); }}
            >
              <ArrowLeft size={18} />
              <span>返回 {selectedCategory}</span>
            </button>
            <h1 className="yp-hero-title">{selectedSubcategory}</h1>
            <p className="yp-hero-desc">共找到 {filteredCompanies.length} 家企业</p>
          </div>
        </div>

        <div className="yp-controls">
          <div className="yp-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜索企业名称或服务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="yp-publish-btn" onClick={publishModal.open}>
            <Plus size={18} />
            发布企业信息
          </button>
        </div>

        <div className="yp-companies">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => (
              <div key={company.id} className={`yp-company${company.is_premium ? ' premium-post' : ''}${company.premium_type === 'top' ? ' premium-top' : ''}${company.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
                {company.premium_type === 'top' && (
                  <div className="premium-badge premium-top-badge">
                    <Star size={12} fill="currentColor" />
                    置顶
                  </div>
                )}
                {company.premium_type === 'highlight' && <div className="premium-overlay"></div>}

                <div className="yp-company-head">
                  <h3>{company.name}</h3>
                  {company.verified && <span className="yp-verified">已验证</span>}
                  <div className="yp-rating">
                    <Star size={14} fill="currentColor" />
                    <span className="yp-rating-num">{company.rating}</span>
                    <span className="yp-rating-count">({company.reviews})</span>
                  </div>
                </div>

                <p className="yp-company-desc">{company.description}</p>

                <div className="yp-company-contacts">
                  <div className="yp-contact-row"><MapPin size={15} /><span>{company.address}</span></div>
                  <div className="yp-contact-row"><Phone size={15} /><span>{company.phone}</span></div>
                  <div className="yp-contact-row"><Mail size={15} /><span>{company.email}</span></div>
                  {company.website && <div className="yp-contact-row"><Globe size={15} /><span>{company.website}</span></div>}
                </div>

                <div className="yp-company-actions">
                  <button className="yp-action"><Eye size={15} /><span>查看详情</span></button>
                  <button className="yp-action"><Heart size={15} /><span>收藏</span></button>
                  <button className="yp-action yp-action-primary">联系企业</button>
                </div>
              </div>
            ))
          ) : (
            <div className="yp-empty">
              <div className="yp-empty-icon"><Building size={48} /></div>
              <h3>暂无企业信息</h3>
              <p>成为第一个在此分类发布信息的企业</p>
              <button className="yp-publish-btn" onClick={publishModal.open}>
                <Plus size={18} />
                发布企业信息
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

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
      <div className="yp-inline-form" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
        <div className="yp-inline-card">
          <div className="yp-modal-header">
            <h2>发布企业信息</h2>
            <button onClick={publishModal.close} type="button">×</button>
          </div>
          <div className="yp-modal-body">
            <form className="yp-form" onSubmit={handleSubmit}>
              <div className="yp-field">
                <label>企业名称 *</label>
                <input type="text" name="name" placeholder="请输入企业全称" required />
              </div>
              <div className="yp-field">
                <label>服务分类 *</label>
                <select name="subcategory" required defaultValue={selectedSubcategory || ''}>
                  <option value="">请选择服务分类</option>
                  {Object.entries(categories).map(([catName, catData]) => (
                    <optgroup key={catName} label={catName}>
                      {catData.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="yp-field">
                <label>企业简介 *</label>
                <textarea name="description" placeholder="请简要介绍您的企业主营业务和优势" rows="4" required></textarea>
              </div>
              <div className="yp-field-row">
                <div className="yp-field">
                  <label>联系电话 *</label>
                  <input type="tel" name="phone" placeholder="请输入联系电话" required />
                </div>
                <div className="yp-field">
                  <label>邮箱地址 *</label>
                  <input type="text" name="email" placeholder="请输入企业邮箱" required />
                </div>
              </div>
              <div className="yp-field">
                <label>企业地址 *</label>
                <input type="text" name="address" placeholder="请输入详细地址" required />
              </div>
              <div className="yp-field">
                <label>企业网站</label>
                <input type="url" name="website" placeholder="https://（可选）" />
              </div>
              <div className="yp-form-actions">
                <button type="button" className="yp-btn-cancel" onClick={publishModal.close}>取消</button>
                <button type="submit" className="yp-btn-submit">立即发布</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  apiLogger.debug('当前视图', { currentView, selectedCategory, selectedSubcategory });

  return (
    <div className="yellow-pages">
      {currentView === 'main' && renderMainView()}
      {currentView === 'category' && renderCategoryView()}
      {currentView === 'subcategory' && renderSubcategoryView()}
      {publishModal.isOpen && renderPublishModal()}
      <PremiumPostModal
        isOpen={premiumModal.isOpen}
        onClose={() => { premiumModal.close(); setCurrentFormData(null); }}
        onConfirm={handleConfirmPublish}
        postType="company"
        formData={currentFormData}
      />
    </div>
  );
};

export default YellowPages;
