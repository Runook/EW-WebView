import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PATH_FORUM_LONG } from '../constants/servicePaths';
import {
  Search,
  MessageCircle,
  ThumbsUp,
  Eye,
  Clock,
  User,
  Star,
  Plus,
  Bookmark,
  Share2,
  TrendingUp,
  Hash,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiServices, getAuthToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';

import AdSlot from '../components/AdSlot';
import './Forum.css';
import './ForumEditor.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://welogx.com/api';

const CATEGORIES = [
  { id: 'all', name: '全部话题', icon: Hash, color: '#666' },
  { id: 'fba-warehouse', name: 'FBA仓库介绍', icon: Star, color: '#ff6b35' },
  { id: 'anti-scam', name: '司机防骗', icon: Star, color: '#e53935' },
  { id: 'industry-news', name: '行业资讯', icon: TrendingUp, color: '#1890ff' },
  { id: 'experience', name: '经验分享', icon: Award, color: '#52c41a' },
  { id: 'qa', name: '问题解答', icon: MessageCircle, color: '#fa8c16' },
  { id: 'policy', name: '政策法规', icon: Star, color: '#722ed1' },
  { id: 'technology', name: '技术交流', icon: Star, color: '#13c2c2' },
  { id: 'career', name: '职场发展', icon: User, color: '#eb2f96' }
];

const CATEGORY_NAME_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {});

const Forum = () => {
  const { user, isAuthenticated } = useAuth();

  // SEO
  useSEO({
    title: '物流论坛 - Welogx物流平台 | 行业资讯与经验分享社区',
    description: 'Welogx物流论坛汇聚物流行业资讯、经验分享、问题解答、政策法规、技术交流等内容。加入物流从业者社区，获取最新行业动态。',
    keywords: '物流论坛,行业资讯,经验分享,物流社区,货运讨论,物流政策,技术交流,物流行业'
  });

  const [activeTab, setActiveTab] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hotTags, setHotTags] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [publishing, setPublishing] = useState(false);

  // Publish form state
  const [publishForm, setPublishForm] = useState({
    title: '',
    category: 'industry-news',
    content: '',
    tags: '',
    cover_image: '',
    summary: ''
  });
  const [editingArticle, setEditingArticle] = useState(null);
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const editQuillRef = useRef(null);

  const isEmployee = user?.isEmployee || user?.employeeRole;

  const compressImageForEdit = useCallback((file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadImageForEdit = useCallback(async (file) => {
    const compressed = await compressImageForEdit(file);
    const fd = new FormData();
    fd.append('image', compressed);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/upload/single`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
    });
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error(data.message || '上传失败');
  }, [compressImageForEdit]);

  const editImageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const url = await uploadImageForEdit(file);
        const quill = editQuillRef.current?.getEditor();
        if (quill) { const range = quill.getSelection(true); quill.insertEmbed(range.index, 'image', url); quill.setSelection(range.index + 1); }
      } catch (err) { alert('图片上传失败: ' + err.message); }
    };
  }, [uploadImageForEdit]);

  const editQuillModules = useMemo(() => ({
    toolbar: {
      container: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link', 'image'], [{ align: [] }], ['clean']],
      handlers: { image: editImageHandler }
    }
  }), [editImageHandler]);

  const editQuillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'link', 'image', 'align'];
  const LIMIT = 10;

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tab: activeTab,
        page,
        limit: LIMIT
      };
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiServices.articles.getAll(params);
      if (response.success) {
        setPosts(response.data || []);
        if (response.pagination) {
          setPagination({
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1
          });
        }
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery, page]);

  // Fetch hot tags
  const fetchHotTags = useCallback(async () => {
    try {
      const response = await apiServices.articles.getHotTags();
      if (response.success) {
        setHotTags(response.data || []);
      }
    } catch (error) {
      console.error('获取热门标签失败:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchHotTags();
  }, [fetchHotTags]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedCategory]);

  // Search handler
  const handleSearch = () => {
    setPage(1);
    fetchPosts();
  };

  // Tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Navigate to article detail (new tab for SEO + UX)
  const handlePostClick = (slug) => {
    window.open(`/article/${slug}`, '_blank', 'noopener,noreferrer');
  };

  // Like
  const handleLike = async (e, articleId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('请先登录后再点赞');
      return;
    }
    try {
      const response = await apiServices.articles.like(articleId);
      if (response.success) {
        setPosts(prev =>
          prev.map(post =>
            post.id === articleId
              ? {
                  ...post,
                  is_liked: response.liked,
                  like_count: response.liked ? post.like_count + 1 : post.like_count - 1
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // Bookmark
  const handleBookmark = async (e, articleId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('请先登录后再收藏');
      return;
    }
    try {
      const response = await apiServices.articles.bookmark(articleId);
      if (response.success) {
        setPosts(prev =>
          prev.map(post =>
            post.id === articleId
              ? { ...post, is_bookmarked: !post.is_bookmarked }
              : post
          )
        );
      }
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  // Share
  const handleShare = async (e, articleId) => {
    e.stopPropagation();
    try {
      await apiServices.articles.share(articleId, 'link');
      // Copy link to clipboard
      const url = `${window.location.origin}/article/${posts.find(p => p.id === articleId)?.slug || articleId}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // Update article (new posts use ForumPostPage)
  const handlePublish = async () => {
    if (!editingArticle) return;
    if (!publishForm.title.trim() || !publishForm.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setPublishing(true);
    try {
      const data = {
        title: publishForm.title.trim(),
        category: publishForm.category,
        content: publishForm.content.trim(),
        tags: publishForm.tags
          .split(/[,，]/)
          .map(t => t.trim())
          .filter(Boolean),
        cover_image: publishForm.cover_image.trim() || null,
        summary: publishForm.summary.trim() || null
      };

      const response = await apiServices.articles.update(editingArticle.id, data);

      if (response.success) {
        setEditingArticle(null);
        setPublishForm({
          title: '',
          category: 'industry-news',
          content: '',
          tags: '',
          cover_image: '',
          summary: ''
        });
        setPage(1);
        fetchPosts();
      }
    } catch (error) {
      console.error('更新文章失败:', error);
      alert('更新失败，请重试');
    } finally {
      setPublishing(false);
    }
  };

  // Open edit modal with article data
  const handleEditArticle = async (e, post) => {
    e.stopPropagation();
    try {
      const response = await apiServices.articles.getBySlug(post.slug || post.id);
      const article = response.data || response;
      setEditingArticle(article);
      setPublishForm({
        title: article.title || '',
        category: article.category || 'industry-news',
        content: article.content || '',
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
        cover_image: article.cover_image || '',
        summary: article.summary || ''
      });
    } catch (error) {
      console.error('获取文章详情失败:', error);
      alert('获取文章详情失败，请重试');
    }
  };

  // Delete article
  const handleDeleteArticle = async (e, articleId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这篇文章吗？删除后将无法恢复。')) return;
    try {
      const response = await apiServices.articles.delete(articleId);
      if (response.success) {
        fetchPosts();
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败，请重试');
    }
  };

  // Close publish modal
  const handleClosePublishModal = () => {
    setEditingArticle(null);
    setPublishForm({
      title: '',
      category: 'industry-news',
      content: '',
      tags: '',
      cover_image: '',
      summary: ''
    });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // Tag click to search
  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    setPage(1);
  };

  return (
    <div className="forum">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="container">
          <h1>事件论坛</h1>
          <p>清乱象，立诚信！物流世界，强者通行！</p>
        </div>
      </div>

      <div className="container">
        <div className="forum-layout">
          {/* 左侧分类导航 */}
          <div className="forum-sidebar">
            <div className="categories">
              <h3>论坛分类</h3>
              <div className="category-list">
                {CATEGORIES.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <div
                      key={category.id}
                      className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <IconComponent size={16} style={{ color: category.color }} />
                      <span>{category.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 侧边栏广告位 */}
            <AdSlot position="forum-sidebar" />

            <div className="hot-topics">
              <h3>热门话题</h3>
              <div className="topic-list">
                {hotTags.length > 0 ? (
                  hotTags.map((item, index) => (
                    <div
                      key={index}
                      className="topic-item"
                      onClick={() => handleTagClick(item.tag)}
                    >
                      <Hash size={14} />
                      <span>{item.tag}</span>
                      {item.count > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px 24px', color: '#999', fontSize: '14px' }}>
                    暂无热门话题
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="forum-main">
            {/* 搜索和操作栏 */}
            <div className="forum-toolbar">
              <div className="search-section">
                <div className="search-input-group">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="搜索话题、关键词或用户"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button className="search-btn" onClick={handleSearch}>
                    搜索
                  </button>
                </div>
              </div>

              {isEmployee && (
                <Link className="publish-btn" to={`${PATH_FORUM_LONG}/post`}>
                  <Plus size={20} />
                  发布文章
                </Link>
              )}
            </div>

            {/* 标签切换 */}
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'hot' ? 'active' : ''}`}
                onClick={() => handleTabChange('hot')}
              >
                <TrendingUp size={18} />
                热门
              </button>
              <button
                className={`tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
                onClick={() => handleTabChange('latest')}
              >
                <Clock size={18} />
                最新
              </button>
              <button
                className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
                onClick={() => handleTabChange('following')}
              >
                <Star size={18} />
                关注
              </button>
            </div>

            {/* 顶部广告位 */}
            <AdSlot position="forum-top" layout="horizontal" />

            {/* 帖子列表 */}
            <div className="posts-list">
              {loading ? (
                <div className="loading">
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#34C759' }}>Welogx</div>
                  <div className="loading-bar"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className={`post-row${post.premium_type === 'top' && new Date(post.premium_end_time) > new Date() ? ' post-row-top' : ''}${post.premium_type === 'highlight' && new Date(post.premium_end_time) > new Date() ? ' post-row-highlight' : ''}`} onClick={() => handlePostClick(post.slug)}>
                    <div className="post-row-left">
                      <span className="category-badge-sm">
                        {CATEGORY_NAME_MAP[post.category] || post.category}
                      </span>
                      {post.premium_type === 'top' && new Date(post.premium_end_time) > new Date() && <span className="premium-pin-badge"><Star size={11} /> 置顶</span>}
                      {post.is_pinned && !post.premium_type && <span className="pin-badge">📌</span>}
                      <span className="post-row-title">{post.title}</span>
                    </div>
                    <div className="post-row-right">
                      <span className="post-row-meta">{post.author?.name || '匿名'}</span>
                      <span className="post-row-meta">{formatDate(post.published_at)}</span>
                      <span className="post-row-stat"><Eye size={12} />{post.view_count || 0}</span>
                      <span className="post-row-stat"><ThumbsUp size={12} />{post.like_count || 0}</span>
                      <span className="post-row-stat"><MessageCircle size={12} />{post.comment_count || 0}</span>
                      <button
                        className={`action-btn-sm ${post.is_liked ? 'active' : ''}`}
                        onClick={(e) => handleLike(e, post.id)}
                        title="点赞"
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        className={`action-btn-sm ${post.is_bookmarked ? 'active' : ''}`}
                        onClick={(e) => handleBookmark(e, post.id)}
                        title="收藏"
                      >
                        <Bookmark size={13} />
                      </button>
                      <button
                        className="action-btn-sm"
                        onClick={(e) => handleShare(e, post.id)}
                        title="分享"
                      >
                        <Share2 size={13} />
                      </button>
                      {isEmployee && (
                        <>
                          <button
                            className="action-btn-labeled edit-btn"
                            onClick={(e) => handleEditArticle(e, post)}
                            title="编辑"
                          >
                            <Edit size={13} /> 编辑
                          </button>
                          <button
                            className="action-btn-labeled delete-btn"
                            onClick={(e) => handleDeleteArticle(e, post.id)}
                            title="删除"
                          >
                            <Trash2 size={13} /> 删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <MessageCircle size={64} />
                  <h3>暂无相关话题</h3>
                  <p>试试调整搜索条件或发布新话题</p>
                </div>
              )}
            </div>

            {/* 分页 */}
            {!loading && pagination.totalPages > 1 && (
              <div className="pagination" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '24px 0',
                marginTop: '16px'
              }}>
                <button
                  className="action-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ opacity: page <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} />
                  上一页
                </button>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  第 {page} / {pagination.totalPages} 页 (共 {pagination.total} 条)
                </span>
                <button
                  className="action-btn"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  style={{ opacity: page >= pagination.totalPages ? 0.5 : 1 }}
                >
                  下一页
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑文章模态框 */}
      {editingArticle && (
        <div className="forum-inline-form" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <div className="forum-inline-card">
            <div className="modal-header">
              <h2>编辑文章</h2>
              <button onClick={handleClosePublishModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="publish-form">
                <div className="form-group">
                  <label>文章标题</label>
                  <input
                    type="text"
                    placeholder="请输入文章标题"
                    value={publishForm.title}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>选择分类</label>
                  <select
                    value={publishForm.category}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.slice(1).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>文章摘要</label>
                  <textarea
                    placeholder="请输入文章摘要（选填，不超过200字）"
                    rows="2"
                    value={publishForm.summary}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, summary: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>文章内容</label>
                  <div className="fe-editor-wrap">
                    <ReactQuill
                      ref={editQuillRef}
                      theme="snow"
                      value={publishForm.content}
                      onChange={(val) => setPublishForm(prev => ({ ...prev, content: val }))}
                      modules={editQuillModules}
                      formats={editQuillFormats}
                      placeholder="在这里编辑文章内容，可插入图片..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>文章标签</label>
                  <input
                    type="text"
                    placeholder="请输入相关标签，用逗号分隔"
                    value={publishForm.tags}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>封面图片</label>
                  <div className="fe-cover-area">
                    {publishForm.cover_image ? (
                      <div className="fe-cover-preview">
                        <img src={publishForm.cover_image} alt="封面" />
                        <button type="button" className="fe-cover-remove" onClick={() => setPublishForm(prev => ({ ...prev, cover_image: '' }))}>更换</button>
                      </div>
                    ) : (
                      <label className="fe-cover-upload">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          setEditCoverUploading(true);
                          try { const url = await uploadImageForEdit(file); setPublishForm(prev => ({ ...prev, cover_image: url })); }
                          catch (err) { alert('上传失败: ' + err.message); }
                          finally { setEditCoverUploading(false); }
                        }} style={{ display: 'none' }} />
                        {editCoverUploading ? '上传中...' : (<><Upload size={16} /> 上传封面</>)}
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleClosePublishModal}
                  >
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handlePublish}
                    disabled={publishing || !publishForm.title.trim() || !publishForm.content.trim()}
                  >
                    <Save size={16} />
                    {publishing ? '保存中...' : '保存修改'}
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

export default Forum;
