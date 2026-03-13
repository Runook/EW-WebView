import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiServices } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import './UserProfile.css';

const TABS = [
  { key: 'overview', label: '概览', icon: BarChart2 },
  { key: 'quotes', label: '我的报价', icon: Truck },
  { key: 'articles', label: '我的文章', icon: FileText },
  { key: 'bookmarks', label: '收藏', icon: Bookmark },
  { key: 'settings', label: '设置', icon: Settings },
];

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
        {activeTab === 'quotes' && renderQuotes()}
        {activeTab === 'articles' && renderArticles()}
        {activeTab === 'bookmarks' && renderBookmarks()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );

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
