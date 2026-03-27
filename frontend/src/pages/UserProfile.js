import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  FileText,
  MessageCircle,
  Heart,
  MapPin,
  Globe,
  Calendar,
  Edit3,
  Bookmark,
  Eye,
  ChevronRight,
  Shield,
  Award,
  Save,
  CheckCircle,
  AlertCircle,
  LogIn,
  Plus,
  Settings,
  BarChart2,
  X,
  Truck,
  Clock,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Edit,
  Image as ImageIcon,
  Briefcase,
  Building2,
  DollarSign,
  BookOpen,
  RefreshCw,
  Coins,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiServices, apiClient } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import './UserProfile.css';

const TABS = [
  { key: 'overview', label: '概览', icon: BarChart2 },
  { key: 'credits', label: '我的积分', icon: Coins },
  { key: 'quotes', label: '我的报价', icon: Truck },
  { key: 'myJobs', label: '我的招聘', icon: Briefcase },
  { key: 'myResumes', label: '我的求职', icon: User },
  { key: 'myRentals', label: '我的出租', icon: Building2 },
  { key: 'mySales', label: '我的出售', icon: DollarSign },
  { key: 'articles', label: '我的文章', icon: FileText },
  { key: 'bookmarks', label: '收藏', icon: Bookmark },
  { key: 'settings', label: '设置', icon: Settings },
];

const JOB_CATEGORIES = [
  'CLASS A 司机', 'CLASS B 司机', 'CLASS D 司机', '调度找召卡车',
  '文员OP', '跟单/客服', '应收应付会计', '卸柜搬货工',
  '出单出货 点数', '物流销售', '货运代理', '卡车修理技工', '货运经纪', '报关师'
];
const LOCATIONS = [
  'Alabama (AL)', 'Alaska (AK)', 'Arizona (AZ)', 'Arkansas (AR)', 'California (CA)',
  'Colorado (CO)', 'Connecticut (CT)', 'Delaware (DE)', 'Florida (FL)', 'Georgia (GA)',
  'Hawaii (HI)', 'Idaho (ID)', 'Illinois (IL)', 'Indiana (IN)', 'Iowa (IA)',
  'Kansas (KS)', 'Kentucky (KY)', 'Louisiana (LA)', 'Maine (ME)', 'Maryland (MD)',
  'Massachusetts (MA)', 'Michigan (MI)', 'Minnesota (MN)', 'Mississippi (MS)', 'Missouri (MO)',
  'Montana (MT)', 'Nebraska (NE)', 'Nevada (NV)', 'New Hampshire (NH)', 'New Jersey (NJ)',
  'New Mexico (NM)', 'New York (NY)', 'North Carolina (NC)', 'North Dakota (ND)', 'Ohio (OH)',
  'Oklahoma (OK)', 'Oregon (OR)', 'Pennsylvania (PA)', 'Rhode Island (RI)', 'South Carolina (SC)',
  'South Dakota (SD)', 'Tennessee (TN)', 'Texas (TX)', 'Utah (UT)', 'Vermont (VT)',
  'Virginia (VA)', 'Washington (WA)', 'West Virginia (WV)', 'Wisconsin (WI)', 'Wyoming (WY)',
  'Washington D.C.'
];
const WORK_TYPES = ['全职', '兼职', '合同工', '临时工'];
const EXPERIENCE_OPTIONS = ['经验不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];

const UserProfile = () => {
  const navigate = useNavigate();
  const { section } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const validTabs = TABS.map(t => t.key);
  const [activeTab, setActiveTab] = useState(() => {
    if (section && validTabs.includes(section)) return section;
    return 'overview';
  });

  // Articles fetched separately for "My Articles" tab
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // LTL Quote sessions
  const [quoteSessions, setQuoteSessions] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Settings form state
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Article edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', content: '', tags: '', cover_image: '', summary: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Credits state
  const [creditsInfo, setCreditsInfo] = useState(null);
  const [creditsHistory, setCreditsHistory] = useState([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [rechargeRates, setRechargeRates] = useState(null);
  const [rechargingAmount, setRechargingAmount] = useState(null);

  // Jobs/Resumes state
  const [myJobs, setMyJobs] = useState([]);
  const [myJobsLoading, setMyJobsLoading] = useState(false);
  const [myResumes, setMyResumes] = useState([]);
  const [myResumesLoading, setMyResumesLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editingResume, setEditingResume] = useState(null);

  // Rentals/Sales state
  const [myRentals, setMyRentals] = useState([]);
  const [myRentalsLoading, setMyRentalsLoading] = useState(false);
  const [mySales, setMySales] = useState([]);
  const [mySalesLoading, setMySalesLoading] = useState(false);
  const [editingRentalSale, setEditingRentalSale] = useState(null); // { ...item, _type: 'rental'|'sale' }

  // SEO
  useSEO({
    title: '我的主页 - Welogx物流平台',
    description: '管理您的Welogx物流平台个人资料、文章和收藏',
    keywords: '用户中心,个人资料,Welogx物流',
  });

  // --------------- Data fetching ---------------
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiServices.articles.getMyProfile();
      const data = res.data || res;
      setProfile(data);
      // Initialise form with current values
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company_name: data.company_name || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        wechat: data.wechat || '',
        specialties: data.specialties || [],
      });
    } catch (err) {
      console.error('获取用户资料失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setArticlesLoading(true);
      const res = await apiServices.articles.getAll({ author_id: profile.id });
      const data = res.data || res;
      setArticles(Array.isArray(data) ? data : data.articles || []);
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setArticlesLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (section && validTabs.includes(section)) setActiveTab(section);
  }, [section, validTabs]);

  useEffect(() => {
    if (user) fetchProfile();
    else setLoading(false);
  }, [user, fetchProfile]);

  const fetchQuoteSessions = useCallback(async () => {
    const email = user?.email || user?.attributes?.email;
    if (!email) return;
    try {
      setQuotesLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiBase}/ltl-quotes/sessions?email=${encodeURIComponent(email)}&includeExpired=true`);
      if (res.ok) {
        const data = await res.json();
        setQuoteSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('获取报价历史失败:', err);
    } finally {
      setQuotesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'articles' && profile?.id && articles.length === 0) {
      fetchArticles();
    }
  }, [activeTab, profile?.id, articles.length, fetchArticles]);

  useEffect(() => {
    if ((activeTab === 'quotes' || activeTab === 'overview') && quoteSessions.length === 0 && user) {
      fetchQuoteSessions();
    }
  }, [activeTab, quoteSessions.length, fetchQuoteSessions, user]);

  const fetchMyJobs = useCallback(async () => {
    try {
      setMyJobsLoading(true);
      const res = await apiClient.get('/jobs/my/posts');
      if (res.success) setMyJobs(res.data || []);
    } catch (err) { console.error('获取我的职位失败:', err); }
    finally { setMyJobsLoading(false); }
  }, []);

  const fetchMyResumes = useCallback(async () => {
    try {
      setMyResumesLoading(true);
      const res = await apiClient.get('/resumes/my/posts');
      if (res.success) setMyResumes(res.data || []);
    } catch (err) { console.error('获取我的简历失败:', err); }
    finally { setMyResumesLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'myJobs' && myJobs.length === 0 && user) fetchMyJobs();
  }, [activeTab, myJobs.length, user, fetchMyJobs]);

  useEffect(() => {
    if (activeTab === 'myResumes' && myResumes.length === 0 && user) fetchMyResumes();
  }, [activeTab, myResumes.length, user, fetchMyResumes]);

  const fetchMyRentals = useCallback(async () => {
    try { setMyRentalsLoading(true); const res = await apiClient.get('/rentals/my/posts'); if (res.success) setMyRentals(res.data || []); }
    catch (err) { console.error('获取我的出租失败:', err); } finally { setMyRentalsLoading(false); }
  }, []);

  const fetchMySales = useCallback(async () => {
    try { setMySalesLoading(true); const res = await apiClient.get('/sales/my/posts'); if (res.success) setMySales(res.data || []); }
    catch (err) { console.error('获取我的出售失败:', err); } finally { setMySalesLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'myRentals' && myRentals.length === 0 && user) fetchMyRentals();
  }, [activeTab, myRentals.length, user, fetchMyRentals]);

  useEffect(() => {
    if (activeTab === 'mySales' && mySales.length === 0 && user) fetchMySales();
  }, [activeTab, mySales.length, user, fetchMySales]);

  // Credits fetching
  const fetchCreditsData = useCallback(async () => {
    try {
      setCreditsLoading(true);
      const [creditsRes, historyRes, configRes] = await Promise.all([
        apiClient.get('/user-management/credits'),
        apiClient.get('/user-management/credits/history', { limit: 30, offset: 0 }),
        apiClient.get('/user-management/system-config', { keys: 'recharge_rates' })
      ]);
      if (creditsRes.success) setCreditsInfo(creditsRes.data);
      if (historyRes.success) setCreditsHistory(historyRes.data || []);
      if (configRes.success && configRes.data?.recharge_rates) setRechargeRates(configRes.data.recharge_rates);
    } catch (err) { console.error('获取积分数据失败:', err); }
    finally { setCreditsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'credits' && user && !creditsInfo) fetchCreditsData();
  }, [activeTab, user, creditsInfo, fetchCreditsData]);

  const handleRecharge = async (amount) => {
    try {
      setRechargingAmount(amount);
      const res = await apiClient.post('/user-management/recharge', { amount: parseFloat(amount), paymentMethod: 'mock' });
      if (res.success) {
        alert(`充值成功！获得 ${res.data.credits} 积分`);
        setCreditsInfo(null);
        fetchCreditsData();
      } else {
        alert('充值失败: ' + (res.message || '未知错误'));
      }
    } catch (err) { alert('充值失败: ' + err.message); }
    finally { setRechargingAmount(null); }
  };

  // --------------- Form helpers ---------------
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFeedback(null);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tag = newTag.trim();
      if (!formData.specialties.includes(tag)) {
        handleFormChange('specialties', [...formData.specialties, tag]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    handleFormChange('specialties', formData.specialties.filter(t => t !== tag));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      await apiServices.articles.updateProfile(formData);
      setFeedback({ type: 'success', message: '资料已更新' });
      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      console.error('更新资料失败:', err);
      setFeedback({ type: 'error', message: err.message || '更新失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  // --------------- Article edit/delete ---------------
  const handleEditArticle = async (e, article) => {
    e.stopPropagation();
    try {
      const response = await apiServices.articles.getBySlug(article.slug || article.id);
      const full = response.data || response;
      setEditingArticle(full);
      setEditForm({
        title: full.title || '',
        category: full.category || 'industry-news',
        content: full.content || '',
        tags: Array.isArray(full.tags) ? full.tags.join(', ') : (full.tags || ''),
        cover_image: full.cover_image || '',
        summary: full.summary || ''
      });
      setShowEditModal(true);
    } catch (err) {
      console.error('获取文章详情失败:', err);
      alert('获取文章详情失败，请重试');
    }
  };

  const handleSaveArticle = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('请填写标题和内容');
      return;
    }
    setEditSaving(true);
    try {
      const data = {
        title: editForm.title.trim(),
        category: editForm.category,
        content: editForm.content.trim(),
        tags: editForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        cover_image: editForm.cover_image.trim() || null,
        summary: editForm.summary.trim() || null
      };
      const response = await apiServices.articles.update(editingArticle.id, data);
      if (response.success) {
        setShowEditModal(false);
        setEditingArticle(null);
        fetchArticles();
        fetchProfile();
      }
    } catch (err) {
      console.error('更新文章失败:', err);
      alert('更新失败，请重试');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteArticle = async (e, articleId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这篇文章吗？删除后将无法恢复。')) return;
    try {
      const response = await apiServices.articles.delete(articleId);
      if (response.success) {
        setArticles(prev => prev.filter(a => a.id !== articleId));
        fetchProfile();
      }
    } catch (err) {
      console.error('删除文章失败:', err);
      alert('删除失败，请重试');
    }
  };

  // --------------- Utilities ---------------
  const getInitials = () => {
    if (!profile) return '?';
    const f = profile.first_name?.[0] || '';
    const l = profile.last_name?.[0] || '';
    return (f + l).toUpperCase() || profile.email?.[0]?.toUpperCase() || '?';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const userTypeLabel = (type) => {
    const map = { shipper: '货主', carrier: '承运商', broker: '经纪人', driver: '司机', admin: '管理员' };
    return map[type] || type || '用户';
  };

  // --------------- Not logged in ---------------
  if (!user) {
    return (
      <div className="user-profile-page">
        <div className="profile-login-prompt">
          <div className="prompt-icon"><User size={36} /></div>
          <h2>请先登录</h2>
          <p>登录后即可查看和管理您的个人资料</p>
          <button className="login-btn" onClick={() => navigate('/login')}>
            <LogIn size={18} /> 去登录
          </button>
        </div>
      </div>
    );
  }

  // --------------- Loading ---------------
  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  // --------------- Error ---------------
  if (error) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchProfile}>重试</button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Shortcuts
  const isEmployee = !!profile.employee_id;
  const recentArticles = profile.recentArticles || [];
  const bookmarks = profile.bookmarks || [];

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="user-profile-page">
      {/* 编辑文章模态框 */}
      {showEditModal && editingArticle && (
        <div className="article-edit-overlay" onClick={() => setShowEditModal(false)}>
          <div className="article-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="article-edit-header">
              <h2>编辑文章</h2>
              <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="article-edit-body">
              <div className="form-group">
                <label>文章标题</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="请输入文章标题" />
              </div>
              <div className="form-group">
                <label>选择分类</label>
                <select value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}>
                  <option value="fba-warehouse">FBA仓库介绍</option>
                  <option value="anti-scam">司机防骗</option>
                  <option value="industry-news">行业资讯</option>
                  <option value="experience">经验分享</option>
                  <option value="qa">问题解答</option>
                  <option value="policy">政策法规</option>
                  <option value="technology">技术交流</option>
                  <option value="career">职场发展</option>
                </select>
              </div>
              <div className="form-group">
                <label>文章摘要</label>
                <textarea rows="2" value={editForm.summary} onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))} placeholder="请输入文章摘要（选填）" />
              </div>
              <div className="form-group">
                <label>文章内容</label>
                <textarea rows="8" value={editForm.content} onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))} placeholder="请详细描述您的文章内容..." />
              </div>
              <div className="form-group">
                <label>文章标签</label>
                <input type="text" value={editForm.tags} onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="请输入相关标签，用逗号分隔" />
              </div>
              <div className="form-group">
                <label><ImageIcon size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />封面图片URL</label>
                <input type="text" value={editForm.cover_image} onChange={(e) => setEditForm(prev => ({ ...prev, cover_image: e.target.value }))} placeholder="请输入封面图片链接（选填）" />
              </div>
              <div className="article-edit-actions">
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>取消</button>
                <button className="btn-save" onClick={handleSaveArticle} disabled={editSaving || !editForm.title.trim() || !editForm.content.trim()}>
                  <Save size={16} /> {editSaving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ---------- HEADER CARD ---------- */}
      <div className="profile-header-card">
        <div className="profile-header-inner">
          {/* Avatar */}
          <div className="profile-avatar-section">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">{getInitials()}</div>
            )}
          </div>

          {/* Info */}
          <div className="profile-info-section">
            <div className="profile-name-row">
              <h1 className="profile-name">
                {profile.first_name} {profile.last_name}
              </h1>
              <span className="profile-type-badge">
                <Shield size={12} /> {userTypeLabel(profile.user_type)}
              </span>
              {profile.is_verified && (
                <span className="profile-verified-badge">
                  <CheckCircle size={12} /> 已认证
                </span>
              )}
            </div>

            {profile.company_name && (
              <div className="profile-company">{profile.company_name}</div>
            )}

            {profile.bio && <div className="profile-bio">{profile.bio}</div>}

            <div className="profile-meta-row">
              {profile.location && (
                <span className="profile-meta-item"><MapPin size={13} /> {profile.location}</span>
              )}
              {profile.website && (
                <span className="profile-meta-item">
                  <Globe size={13} />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a>
                </span>
              )}
              {profile.wechat && (
                <span className="profile-meta-item">微信: {profile.wechat}</span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <div className="profile-header-actions">
            <button className="profile-edit-btn" onClick={() => setActiveTab('settings')}>
              <Edit3 size={15} /> 编辑资料
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-row">
          <div className="profile-stat-item">
            <span className="profile-stat-value">{profile.article_count ?? 0}</span>
            <span className="profile-stat-label">文章</span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-value">{profile.comment_count ?? 0}</span>
            <span className="profile-stat-label">评论</span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-value">{profile.like_received ?? 0}</span>
            <span className="profile-stat-label">获赞</span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-value">{formatDate(profile.member_since)}</span>
            <span className="profile-stat-label">加入时间</span>
          </div>
        </div>
      </div>

      {/* ---------- TAB NAVIGATION ---------- */}
      <div className="profile-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          let count = null;
          if (tab.key === 'articles') count = profile.article_count ?? 0;
          if (tab.key === 'bookmarks') count = bookmarks.length;
          if (tab.key === 'quotes') count = quoteSessions.length || null;
          if (tab.key === 'myJobs') count = myJobs.length || null;
          if (tab.key === 'myResumes') count = myResumes.length || null;
          return (
            <button
              key={tab.key}
              className={`profile-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              {tab.label}
              {count !== null && <span className="tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ---------- TAB CONTENT ---------- */}
      <div className="profile-tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'credits' && renderCreditsTab()}
        {activeTab === 'quotes' && renderQuotes()}
        {activeTab === 'myJobs' && renderMyJobs()}
        {activeTab === 'myResumes' && renderMyResumesTab()}
        {activeTab === 'myRentals' && renderMyRentalsTab()}
        {activeTab === 'mySales' && renderMySalesTab()}
        {activeTab === 'articles' && renderArticles()}
        {activeTab === 'bookmarks' && renderBookmarks()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );

  // ===== CREDITS TAB =====
  function renderCreditsTab() {
    if (creditsLoading) {
      return <div className="loading-state"><RefreshCw size={24} className="spin-icon" /><p>加载积分数据...</p></div>;
    }
    const formatDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return dt.toLocaleDateString('zh-CN') + ' ' + dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };
    return (
      <div className="credits-tab">
        {/* Balance card */}
        <div className="credits-balance-card">
          <div className="credits-balance-icon"><Coins size={32} /></div>
          <div className="credits-balance-info">
            <div className="credits-balance-label">当前积分余额</div>
            <div className="credits-balance-amount">{creditsInfo?.current ?? 0}</div>
          </div>
        </div>

        {/* Recharge section */}
        {rechargeRates && Object.keys(rechargeRates).length > 0 && (
          <div className="credits-recharge-section">
            <h3><CreditCard size={18} /> 积分充值</h3>
            <div className="credits-recharge-grid">
              {Object.entries(rechargeRates).map(([credits, price]) => (
                <button
                  key={credits}
                  className="credits-recharge-item"
                  disabled={rechargingAmount !== null}
                  onClick={() => handleRecharge(price)}
                >
                  <div className="recharge-credits"><Coins size={16} /> {credits} 积分</div>
                  <div className="recharge-price">${price}</div>
                  {rechargingAmount === price && <span className="recharge-loading">处理中...</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="credits-history-section">
          <h3><Clock size={18} /> 积分明细</h3>
          {creditsHistory.length > 0 ? (
            <div className="credits-history-list">
              {creditsHistory.map((item, idx) => (
                <div key={item.id || idx} className="credits-history-row">
                  <div className="credits-history-icon">
                    {item.type === 'earn' ? <ArrowUpCircle size={18} className="credit-earn" /> : <ArrowDownCircle size={18} className="credit-spend" />}
                  </div>
                  <div className="credits-history-desc">
                    <span className="credits-desc-text">{item.description}</span>
                    <span className="credits-desc-date">{formatDate(item.created_at)}</span>
                  </div>
                  <div className={`credits-history-amount ${item.type === 'earn' ? 'earn' : 'spend'}`}>
                    {item.type === 'earn' ? '+' : '-'}{Math.abs(item.amount)}
                  </div>
                  <div className="credits-history-balance">余额: {item.balance_after}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="credits-empty"><AlertCircle size={20} /> 暂无积分记录</div>
          )}
        </div>
      </div>
    );
  }

  // ===== OVERVIEW TAB =====
  function renderOverview() {
    return (
      <>
        {/* Stat cards */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-icon articles"><FileText size={24} /></div>
            <div className="stat-number">{profile.article_count ?? 0}</div>
            <div className="stat-text">发布文章</div>
          </div>
          <div className="overview-stat-card">
            <div className="stat-icon comments"><MessageCircle size={24} /></div>
            <div className="stat-number">{profile.comment_count ?? 0}</div>
            <div className="stat-text">发表评论</div>
          </div>
          <div className="overview-stat-card">
            <div className="stat-icon likes"><Heart size={24} /></div>
            <div className="stat-number">{profile.like_received ?? 0}</div>
            <div className="stat-text">获得点赞</div>
          </div>
        </div>

        {/* Employee badge */}
        {isEmployee && (
          <div className="employee-badge-card" onClick={() => navigate('/employee')}>
            <div className="badge-icon"><Award size={24} /></div>
            <div className="badge-info">
              <h4>员工系统 - {profile.employee_role} ({profile.employee_id})</h4>
              <p>点击进入员工管理系统</p>
            </div>
            <ChevronRight size={20} className="badge-arrow" />
          </div>
        )}

        {/* Recent quotes */}
        {quoteSessions.length > 0 && (
          <div className="profile-section-card">
            <div className="section-header">
              <h3><Truck size={18} /> 最近报价</h3>
              <button className="section-view-all" onClick={() => setActiveTab('quotes')}>
                查看全部 &rarr;
              </button>
            </div>
            <div className="article-list">
              {quoteSessions.slice(0, 3).map(session => {
                const isExpired = session.is_expired || new Date(session.expires_at) < new Date();
                return (
                  <div key={session.id} className="article-list-item" style={{ cursor: 'default' }}>
                    <div className="article-item-content">
                      <div className="article-item-title">
                        {session.origin_city || session.origin_zip} &rarr; {session.destination_city || session.destination_zip}
                        {isExpired && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: 8 }}>(已过期)</span>}
                      </div>
                      <div className="article-item-meta">
                        <span className="article-item-category">{session.quote_count} 个报价</span>
                        <span className="meta-item" style={{ fontWeight: 600, color: '#16a34a' }}>
                          ${session.lowest_price ? parseFloat(session.lowest_price).toFixed(2) : 'N/A'}
                        </span>
                        <span className="meta-item"><Calendar size={12} /> {new Date(session.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent articles */}
        <div className="profile-section-card">
          <div className="section-header">
            <h3><FileText size={18} /> 最近文章</h3>
            {recentArticles.length > 0 && (
              <button className="section-view-all" onClick={() => setActiveTab('articles')}>
                查看全部 &rarr;
              </button>
            )}
          </div>
          {recentArticles.length > 0 ? (
            <div className="article-list">
              {recentArticles.slice(0, 5).map(article => (
                <div
                  key={article.id}
                  className="article-list-item"
                  onClick={() => navigate(`/article/${article.slug}`)}
                >
                  <div className="article-item-content">
                    <div className="article-item-title">{article.title}</div>
                    <div className="article-item-meta">
                      <span className="article-item-category">{article.category}</span>
                      <span className="meta-item"><Eye size={12} /> {article.view_count ?? 0}</span>
                      <span className="meta-item"><Heart size={12} /> {article.like_count ?? 0}</span>
                      <span className="meta-item"><Calendar size={12} /> {formatDate(article.published_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#ccc', flexShrink: 0, marginTop: 2 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={28} /></div>
              <p>暂无文章</p>
            </div>
          )}
        </div>

        {/* Recent bookmarks */}
        <div className="profile-section-card">
          <div className="section-header">
            <h3><Bookmark size={18} /> 最近收藏</h3>
            {bookmarks.length > 0 && (
              <button className="section-view-all" onClick={() => setActiveTab('bookmarks')}>
                查看全部 &rarr;
              </button>
            )}
          </div>
          {bookmarks.length > 0 ? (
            <div className="article-list">
              {bookmarks.slice(0, 5).map(article => (
                <div
                  key={article.id}
                  className="article-list-item"
                  onClick={() => navigate(`/article/${article.slug}`)}
                >
                  <div className="article-item-content">
                    <div className="article-item-title">{article.title}</div>
                    <div className="article-item-meta">
                      <span className="article-item-category">{article.category}</span>
                      <span className="meta-item"><Heart size={12} /> {article.like_count ?? 0}</span>
                      <span className="meta-item"><Calendar size={12} /> {formatDate(article.published_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#ccc', flexShrink: 0, marginTop: 2 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Bookmark size={28} /></div>
              <p>暂无收藏</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== MY QUOTES TAB =====
  const handleDeleteQuote = async (sessionId) => {
    if (!window.confirm('确定要删除这个报价记录吗？')) return;
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiBase}/ltl-quotes/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setQuoteSessions(prev => prev.filter(s => s.session_id !== sessionId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  function renderQuotes() {
    return (
      <>
        <div className="articles-tab-header">
          <h3>我的报价</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="new-article-btn" onClick={() => navigate('/my-quotes')}>
              <ExternalLink size={16} /> All Quotes
            </button>
            <button className="new-article-btn" onClick={() => navigate('/get-quote-ltl')}>
              <Plus size={16} /> New Quote
            </button>
          </div>
        </div>

        <div className="profile-section-card">
          {quotesLoading ? (
            <div className="profile-loading" style={{ minHeight: '200px' }}>
              <div className="loading-bar"></div>
            </div>
          ) : quoteSessions.length > 0 ? (
            <div className="quote-sessions-list">
              {quoteSessions.map(session => {
                const isExpired = session.is_expired || new Date(session.expires_at) < new Date();
                return (
                  <div
                    key={session.id}
                    className={`quote-session-card ${isExpired ? 'expired' : ''}`}
                    onClick={() => navigate(`/quote/${session.session_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quote-session-route">
                      <div className="route-endpoints">
                        <span className="route-point">
                          <MapPin size={14} />
                          {session.origin_city}{session.origin_state ? `, ${session.origin_state}` : ''} {session.origin_zip}
                        </span>
                        <span className="route-arrow">&rarr;</span>
                        <span className="route-point">
                          <MapPin size={14} />
                          {session.destination_city}{session.destination_state ? `, ${session.destination_state}` : ''} {session.destination_zip}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isExpired && (
                          <span className="quote-expired-badge">
                            <AlertTriangle size={12} /> 已过期
                          </span>
                        )}
                        <button
                          className="quote-delete-btn"
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuote(session.session_id); }}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="quote-session-meta">
                      <span className="meta-item" style={{ fontWeight: 600, color: '#1d4ed8' }}>
                        {session.session_id}
                      </span>
                      <span className="meta-item">
                        <Truck size={12} />
                        {session.quote_count} 家运输商
                      </span>
                      <span className="meta-item">
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>
                          ${session.lowest_price ? parseFloat(session.lowest_price).toFixed(2) : 'N/A'}
                        </span>
                        &nbsp;起
                      </span>
                      <span className="meta-item">
                        <Calendar size={12} />
                        {new Date(session.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="meta-item">
                        <Clock size={12} />
                        有效期至 {new Date(session.expires_at).toLocaleDateString('en-US')}
                      </span>
                    </div>

                    {session.quote_results && session.quote_results.length > 0 && !isExpired && (
                      <div className="quote-session-carriers">
                        {session.quote_results.slice(0, 5).map((q, idx) => (
                          <span key={idx} className="carrier-chip">
                            {q.carrier}: ${parseFloat(q.price || 0).toFixed(0)}
                          </span>
                        ))}
                        {session.quote_results.length > 5 && (
                          <span className="carrier-chip more">+{session.quote_results.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Truck size={28} /></div>
              <p>暂无报价记录</p>
              <button className="new-article-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/get-quote-ltl')}>
                获取第一个LTL报价
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== MY JOBS TAB =====
  function handleDeleteJob(id) {
    if (!window.confirm('确定要删除这条招聘信息吗？')) return;
    apiClient.delete(`/jobs/${id}`).then(res => {
      if (res.success) setMyJobs(prev => prev.filter(j => j.id !== id));
    }).catch(err => { console.error('删除职位失败:', err); alert('删除失败'); });
  }

  function handleSaveJob(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (let [key, value] of fd.entries()) data[key] = value;
    apiClient.put(`/jobs/${editingJob.id}`, data).then(res => {
      if (res.success) { setEditingJob(null); fetchMyJobs(); }
    }).catch(err => { console.error('更新职位失败:', err); alert('更新失败'); });
  }

  function handleDeleteResume(id) {
    if (!window.confirm('确定要删除这条简历吗？')) return;
    apiClient.delete(`/resumes/${id}`).then(res => {
      if (res.success) setMyResumes(prev => prev.filter(r => r.id !== id));
    }).catch(err => { console.error('删除简历失败:', err); alert('删除失败'); });
  }

  function handleSaveResume(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (let [key, value] of fd.entries()) data[key] = value;
    if (data.skills) data.skills = data.skills.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    apiClient.put(`/resumes/${editingResume.id}`, data).then(res => {
      if (res.success) { setEditingResume(null); fetchMyResumes(); }
    }).catch(err => { console.error('更新简历失败:', err); alert('更新失败'); });
  }

  function renderMyJobs() {
    const activeJobs = myJobs.filter(j => j.isActive);
    const inactiveJobs = myJobs.filter(j => !j.isActive);
    return (
      <>
        {/* Edit Modal */}
        {editingJob && (
          <div className="article-edit-overlay" onClick={() => setEditingJob(null)}>
            <div className="article-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="article-edit-header">
                <h2>编辑职位</h2>
                <button onClick={() => setEditingJob(null)}><X size={20} /></button>
              </div>
              <div className="article-edit-body">
                <form onSubmit={handleSaveJob}>
                  <div className="form-group"><label>职位名称</label><input name="title" defaultValue={editingJob.title} required /></div>
                  <div className="form-group"><label>职位分类</label>
                    <select name="category" defaultValue={editingJob.category} required>
                      {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>公司名称</label><input name="company" defaultValue={editingJob.company} placeholder="选填" /></div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>工作州</label><input name="location" defaultValue={editingJob.location} placeholder="如：California (CA), Texas (TX)（选填）" /></div>
                    <div className="form-group" style={{ flex: 1 }}><label>薪资待遇</label><input name="salary" defaultValue={editingJob.salary} required /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>工作类型</label>
                      <select name="workType" defaultValue={editingJob.type} required>
                        {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}><label>经验要求</label>
                      <select name="experience" defaultValue={editingJob.experience} required>
                        {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>职位描述</label><textarea name="description" defaultValue={editingJob.description} rows={4} required /></div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>联系人</label><input name="contactPerson" defaultValue={editingJob.contactPerson} /></div>
                    <div className="form-group" style={{ flex: 1 }}><label>联系电话</label><input name="contactPhone" defaultValue={editingJob.contactPhone} /></div>
                  </div>
                  <div className="form-group"><label>联系邮箱</label><input name="contactEmail" defaultValue={editingJob.contactEmail} type="text" placeholder="选填" /></div>
                  <div className="article-edit-actions">
                    <button type="button" className="btn-cancel" onClick={() => setEditingJob(null)}>取消</button>
                    <button type="submit" className="btn-save"><Save size={16} /> 保存</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="articles-tab-header">
          <h3>我的招聘 ({myJobs.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="new-article-btn" onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
              <ExternalLink size={16} /> 招聘大厅
            </button>
            <button className="new-article-btn" onClick={fetchMyJobs}>
              <RefreshCw size={16} /> 刷新
            </button>
          </div>
        </div>

        <div className="profile-section-card">
          {myJobsLoading ? (
            <div className="profile-loading" style={{ minHeight: '200px' }}><div className="loading-bar"></div></div>
          ) : myJobs.length > 0 ? (
            <div className="my-posts-list">
              {activeJobs.length > 0 && (
                <>
                  <div className="my-posts-section-label">活跃中 ({activeJobs.length})</div>
                  {activeJobs.map(job => (
                    <div key={job.id} className="my-post-card">
                      <div className="my-post-main">
                        <div className="my-post-title-row">
                          <h4>{job.title}</h4>
                          <span className="my-post-status active">活跃</span>
                        </div>
                        <div className="my-post-meta">
                          <span><Building2 size={13} /> {job.company}</span>
                          <span><MapPin size={13} /> {job.location}</span>
                          <span><DollarSign size={13} /> {job.salary}</span>
                          <span><Eye size={13} /> {job.views}</span>
                          <span><Calendar size={13} /> {job.posted}</span>
                        </div>
                      </div>
                      <div className="my-post-actions">
                        <button className="article-action-btn edit" onClick={() => setEditingJob(job)}><Edit size={14} /> 编辑</button>
                        <button className="article-action-btn delete" onClick={() => handleDeleteJob(job.id)}><Trash2 size={14} /> 删除</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {inactiveJobs.length > 0 && (
                <>
                  <div className="my-posts-section-label" style={{ marginTop: activeJobs.length ? 16 : 0 }}>已下线 ({inactiveJobs.length})</div>
                  {inactiveJobs.map(job => (
                    <div key={job.id} className="my-post-card inactive">
                      <div className="my-post-main">
                        <div className="my-post-title-row">
                          <h4>{job.title}</h4>
                          <span className="my-post-status inactive">已下线</span>
                        </div>
                        <div className="my-post-meta">
                          <span><Building2 size={13} /> {job.company}</span>
                          <span><MapPin size={13} /> {job.location}</span>
                        </div>
                      </div>
                      <div className="my-post-actions">
                        <button className="article-action-btn delete" onClick={() => handleDeleteJob(job.id)}><Trash2 size={14} /> 删除</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Briefcase size={28} /></div>
              <p>暂无发布的招聘信息</p>
              <button className="new-article-btn" style={{ marginTop: '1rem' }}
                onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
                去发布招聘
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== MY RESUMES TAB =====
  function renderMyResumesTab() {
    const activeResumes = myResumes.filter(r => r.isActive);
    const inactiveResumes = myResumes.filter(r => !r.isActive);
    return (
      <>
        {/* Edit Modal */}
        {editingResume && (
          <div className="article-edit-overlay" onClick={() => setEditingResume(null)}>
            <div className="article-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="article-edit-header">
                <h2>编辑简历</h2>
                <button onClick={() => setEditingResume(null)}><X size={20} /></button>
              </div>
              <div className="article-edit-body">
                <form onSubmit={handleSaveResume}>
                  <div className="form-group"><label>姓名</label><input name="name" defaultValue={editingResume.name} required /></div>
                  <div className="form-group"><label>求职岗位</label><input name="position" defaultValue={editingResume.position} required /></div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>工作经验</label>
                      <select name="experience" defaultValue={editingResume.experience} required>
                        {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}><label>期望州</label><input name="location" defaultValue={editingResume.location} placeholder="如：California (CA), Texas (TX)（选填）" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>联系电话</label><input name="phone" defaultValue={editingResume.phone} required /></div>
                    <div className="form-group" style={{ flex: 1 }}><label>邮箱</label><input name="email" defaultValue={editingResume.email} type="text" placeholder="选填" /></div>
                  </div>
                  <div className="form-group"><label>技能专长</label><input name="skills" defaultValue={editingResume.skills?.join(', ')} /></div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label>期望薪资</label><input name="expectedSalary" defaultValue={editingResume.expectedSalary} /></div>
                    <div className="form-group" style={{ flex: 1 }}><label>工作类型偏好</label>
                      <select name="workTypePreference" defaultValue={editingResume.workTypePreference}>
                        <option value="">不限</option>
                        {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>个人简介</label><textarea name="summary" defaultValue={editingResume.summary} rows={4} /></div>
                  <div className="article-edit-actions">
                    <button type="button" className="btn-cancel" onClick={() => setEditingResume(null)}>取消</button>
                    <button type="submit" className="btn-save"><Save size={16} /> 保存</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="articles-tab-header">
          <h3>我的求职 ({myResumes.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="new-article-btn" onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
              <ExternalLink size={16} /> 求职大厅
            </button>
            <button className="new-article-btn" onClick={fetchMyResumes}>
              <RefreshCw size={16} /> 刷新
            </button>
          </div>
        </div>

        <div className="profile-section-card">
          {myResumesLoading ? (
            <div className="profile-loading" style={{ minHeight: '200px' }}><div className="loading-bar"></div></div>
          ) : myResumes.length > 0 ? (
            <div className="my-posts-list">
              {activeResumes.length > 0 && (
                <>
                  <div className="my-posts-section-label">活跃中 ({activeResumes.length})</div>
                  {activeResumes.map(resume => (
                    <div key={resume.id} className="my-post-card">
                      <div className="my-post-main">
                        <div className="my-post-title-row">
                          <h4>{resume.name} — {resume.position}</h4>
                          <span className="my-post-status active">活跃</span>
                        </div>
                        <div className="my-post-meta">
                          <span><MapPin size={13} /> {resume.location}</span>
                          <span><BookOpen size={13} /> {resume.experience}</span>
                          {resume.expectedSalary && <span><DollarSign size={13} /> {resume.expectedSalary}</span>}
                          <span><Eye size={13} /> {resume.views}</span>
                          <span><Calendar size={13} /> {resume.posted}</span>
                        </div>
                        {resume.skills && resume.skills.length > 0 && (
                          <div className="my-post-skills">
                            {resume.skills.slice(0, 5).map((s, i) => <span key={i} className="my-skill-tag">{s}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="my-post-actions">
                        <button className="article-action-btn edit" onClick={() => setEditingResume(resume)}><Edit size={14} /> 编辑</button>
                        <button className="article-action-btn delete" onClick={() => handleDeleteResume(resume.id)}><Trash2 size={14} /> 删除</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {inactiveResumes.length > 0 && (
                <>
                  <div className="my-posts-section-label" style={{ marginTop: activeResumes.length ? 16 : 0 }}>已下线 ({inactiveResumes.length})</div>
                  {inactiveResumes.map(resume => (
                    <div key={resume.id} className="my-post-card inactive">
                      <div className="my-post-main">
                        <div className="my-post-title-row">
                          <h4>{resume.name} — {resume.position}</h4>
                          <span className="my-post-status inactive">已下线</span>
                        </div>
                      </div>
                      <div className="my-post-actions">
                        <button className="article-action-btn delete" onClick={() => handleDeleteResume(resume.id)}><Trash2 size={14} /> 删除</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><User size={28} /></div>
              <p>暂无发布的简历</p>
              <button className="new-article-btn" style={{ marginTop: '1rem' }}
                onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
                去发布简历
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== MY RENTALS TAB =====
  function handleDeleteRental(id) {
    if (!window.confirm('确定要删除这条出租信息吗？')) return;
    apiClient.delete(`/rentals/${id}`).then(res => {
      if (res.success) setMyRentals(prev => prev.filter(r => r.id !== id));
    }).catch(err => { console.error('删除出租失败:', err); alert('删除失败'); });
  }

  function handleDeleteSale(id) {
    if (!window.confirm('确定要删除这条出售信息吗？')) return;
    apiClient.delete(`/sales/${id}`).then(res => {
      if (res.success) setMySales(prev => prev.filter(s => s.id !== id));
    }).catch(err => { console.error('删除出售失败:', err); alert('删除失败'); });
  }

  function handleSaveRentalSale(e) {
    e.preventDefault();
    if (!editingRentalSale) return;
    const fd = new FormData(e.target);
    const data = {};
    for (let [key, value] of fd.entries()) data[key] = value;
    const endpoint = editingRentalSale._type === 'rental' ? `/rentals/${editingRentalSale.id}` : `/sales/${editingRentalSale.id}`;
    apiClient.put(endpoint, data).then(res => {
      if (res.success) {
        setEditingRentalSale(null);
        if (editingRentalSale._type === 'rental') fetchMyRentals(); else fetchMySales();
      }
    }).catch(err => { console.error('更新失败:', err); alert('更新失败: ' + err.message); });
  }

  function renderRentalSaleList(items, type, loading, onDelete) {
    const typeName = type === 'rental' ? '出租' : '出售';
    if (loading) return <div className="loading-state"><RefreshCw size={24} className="spin-icon" /><p>加载中...</p></div>;
    if (items.length === 0) return (
      <div className="empty-state">
        <div className="empty-icon">{type === 'rental' ? <Building2 size={28} /> : <DollarSign size={28} />}</div>
        <p>暂无{typeName}信息</p>
      </div>
    );
    return (
      <div className="my-posts-list">
        {items.map(item => (
          <div key={item.id} className="my-post-card">
            <div className="my-post-info" style={{ flex: 1 }}>
              <div className="my-post-title-row">
                <span className="my-post-title">{item.title}</span>
                <span className="my-post-badge">{item.category}</span>
                {item.is_premium && <span className="my-post-badge premium">置顶</span>}
              </div>
              <div className="my-post-meta">
                <span>{item.price}</span>
                <span>{item.location}</span>
                <span>{item.condition}</span>
                <span><Eye size={12} /> {item.views || 0}</span>
                <span>{item.posted || (item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : '')}</span>
              </div>
            </div>
            <div className="my-post-actions">
              <button className="article-action-btn edit" onClick={() => setEditingRentalSale({ ...item, _type: type })}><Edit size={14} /> 编辑</button>
              <button className="article-action-btn delete" onClick={() => onDelete(item.id)}><Trash2 size={14} /> 删除</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderRentalSaleEditModal() {
    if (!editingRentalSale) return null;
    const typeName = editingRentalSale._type === 'rental' ? '出租' : '出售';
    return (
      <div className="article-edit-overlay" onClick={() => setEditingRentalSale(null)}>
        <div className="article-edit-modal" onClick={e => e.stopPropagation()}>
          <div className="article-edit-header">
            <h2>编辑{typeName}信息</h2>
            <button onClick={() => setEditingRentalSale(null)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSaveRentalSale} style={{ padding: 20 }}>
            <div className="form-group"><label>标题</label><input name="title" defaultValue={editingRentalSale.title} required /></div>
            <div className="form-group"><label>价格</label><input name="price" defaultValue={editingRentalSale.price} required /></div>
            <div className="form-group"><label>地点</label><input name="location" defaultValue={editingRentalSale.location} /></div>
            <div className="form-group"><label>状态</label><input name="condition" defaultValue={editingRentalSale.condition} /></div>
            <div className="form-group"><label>描述</label><textarea name="description" defaultValue={editingRentalSale.description} rows={4} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn-secondary" onClick={() => setEditingRentalSale(null)}>取消</button>
              <button type="submit" className="btn-primary"><Save size={14} /> 保存</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderMyRentalsTab() {
    return (
      <>
        <div className="tab-header">
          <h2>我的出租 ({myRentals.length})</h2>
        </div>
        {renderRentalSaleList(myRentals, 'rental', myRentalsLoading, handleDeleteRental)}
        {renderRentalSaleEditModal()}
      </>
    );
  }

  function renderMySalesTab() {
    return (
      <>
        <div className="tab-header">
          <h2>我的出售 ({mySales.length})</h2>
        </div>
        {renderRentalSaleList(mySales, 'sale', mySalesLoading, handleDeleteSale)}
        {renderRentalSaleEditModal()}
      </>
    );
  }

  // ===== MY ARTICLES TAB =====
  function renderArticles() {
    const articleList = articles.length > 0 ? articles : recentArticles;

    return (
      <>
        <div className="articles-tab-header">
          <h3>我的文章</h3>
          {isEmployee && (
            <button className="new-article-btn" onClick={() => navigate('/forum?publish=true')}>
              <Plus size={16} /> 写新文章
            </button>
          )}
        </div>

        <div className="profile-section-card">
          {articlesLoading ? (
            <div className="profile-loading" style={{ minHeight: '200px' }}>
              <div className="loading-bar"></div>
            </div>
          ) : articleList.length > 0 ? (
            <div className="article-list">
              {articleList.map(article => (
                <div
                  key={article.id}
                  className="article-list-item"
                  onClick={() => navigate(`/article/${article.slug}`)}
                >
                  <div className="article-item-content">
                    <div className="article-item-title">{article.title}</div>
                    <div className="article-item-meta">
                      <span className="article-item-category">{article.category}</span>
                      {article.status && (
                        <span className={`article-item-status ${article.status}`}>
                          {article.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      )}
                      <span className="meta-item"><Eye size={12} /> {article.view_count ?? 0}</span>
                      <span className="meta-item"><Heart size={12} /> {article.like_count ?? 0}</span>
                      <span className="meta-item"><Calendar size={12} /> {formatDate(article.published_at)}</span>
                    </div>
                  </div>
                  <div className="article-item-actions">
                    <button
                      className="article-action-btn edit"
                      onClick={(e) => handleEditArticle(e, article)}
                      title="编辑文章"
                    >
                      <Edit size={14} /> 编辑
                    </button>
                    <button
                      className="article-action-btn delete"
                      onClick={(e) => handleDeleteArticle(e, article.id)}
                      title="删除文章"
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={28} /></div>
              <p>暂无文章，快去发布第一篇吧！</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== BOOKMARKS TAB =====
  function renderBookmarks() {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <h3><Bookmark size={18} /> 我的收藏</h3>
        </div>
        {bookmarks.length > 0 ? (
          <div className="article-list">
            {bookmarks.map(article => (
              <div
                key={article.id}
                className="article-list-item"
                onClick={() => navigate(`/article/${article.slug}`)}
              >
                <div className="article-item-content">
                  <div className="article-item-title">{article.title}</div>
                  <div className="article-item-meta">
                    <span className="article-item-category">{article.category}</span>
                    <span className="meta-item"><Heart size={12} /> {article.like_count ?? 0}</span>
                    <span className="meta-item"><Calendar size={12} /> {formatDate(article.published_at)}</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#ccc', flexShrink: 0, marginTop: 2 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Bookmark size={28} /></div>
            <p>暂无收藏文章</p>
          </div>
        )}
      </div>
    );
  }

  // ===== SETTINGS TAB =====
  function renderSettings() {
    return (
      <div className="settings-form-card">
        <h3><Settings size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />编辑个人资料</h3>

        <div className="form-grid">
          {/* First name */}
          <div className="form-group">
            <label>名 (First Name)</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={e => handleFormChange('first_name', e.target.value)}
              placeholder="请输入名"
            />
          </div>

          {/* Last name */}
          <div className="form-group">
            <label>姓 (Last Name)</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={e => handleFormChange('last_name', e.target.value)}
              placeholder="请输入姓"
            />
          </div>

          {/* Company */}
          <div className="form-group">
            <label>公司名称</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={e => handleFormChange('company_name', e.target.value)}
              placeholder="请输入公司名称"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>电话</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleFormChange('phone', e.target.value)}
              placeholder="请输入电话号码"
            />
          </div>

          {/* Avatar URL */}
          <div className="form-group full-width">
            <label>头像链接 (URL)</label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={e => handleFormChange('avatar_url', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Bio */}
          <div className="form-group full-width">
            <label>个人简介</label>
            <textarea
              value={formData.bio}
              onChange={e => handleFormChange('bio', e.target.value)}
              placeholder="介绍一下自己..."
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label>所在地</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleFormChange('location', e.target.value)}
              placeholder="例如: New York, NY"
            />
          </div>

          {/* Website */}
          <div className="form-group">
            <label>个人网站</label>
            <input
              type="url"
              value={formData.website}
              onChange={e => handleFormChange('website', e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>

          {/* WeChat */}
          <div className="form-group">
            <label>微信号</label>
            <input
              type="text"
              value={formData.wechat}
              onChange={e => handleFormChange('wechat', e.target.value)}
              placeholder="请输入微信号"
            />
          </div>

          {/* Specialties */}
          <div className="form-group full-width">
            <label>专业领域</label>
            <div className="tags-input-container">
              {formData.specialties.map(tag => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button className="remove-tag" onClick={() => handleRemoveTag(tag)} type="button">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                className="tags-input"
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={formData.specialties.length === 0 ? '输入后回车添加，如 LTL, FTL' : '继续添加...'}
              />
            </div>
            <span className="tags-hint">输入标签后按 Enter 添加</span>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? '保存中...' : '保存修改'}
          </button>

          {feedback && (
            <div className={`form-feedback ${feedback.type}`}>
              {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default UserProfile;
