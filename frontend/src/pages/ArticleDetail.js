import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  User,
  Building,
  Send,
  Trash2,
  ChevronRight,
  Heart,
  Tag,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { apiServices } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../contexts/AuthContext';
import AdSlot from '../components/AdSlot';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', category: '', content: '', tags: '', cover_image: '', summary: '' });
  const [saving, setSaving] = useState(false);
  const isEmployee = user?.isEmployee || user?.employeeRole;

  // Fetch article data
  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiServices.articles.getBySlug(slug);
      setArticle(response.data || response);
    } catch (err) {
      console.error('Failed to fetch article:', err);
      setError(err.message || '文章加载失败');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // SEO
  const seoData = article ? {
    title: article.seo_title || article.title,
    description: article.seo_description || article.summary,
    keywords: article.seo_keywords || (article.tags ? article.tags.join(',') : ''),
    image: article.cover_image,
    url: window.location.href,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'description': article.summary,
      'image': article.cover_image,
      'author': {
        '@type': 'Person',
        'name': article.author?.name
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'WELOGX TECHNOLOGY INC',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://welogx.com/logo.png'
        }
      },
      'datePublished': article.published_at,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': window.location.href
      }
    }
  } : {
    title: '文章详情 - Welogx物流论坛',
    description: '物流行业文章详情'
  };
  useSEO(seoData);

  // Action handlers
  const handleLike = async () => {
    if (!article) return;
    try {
      await apiServices.articles.like(article.id);
      setArticle(prev => ({
        ...prev,
        is_liked: !prev.is_liked,
        like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1
      }));
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;
    try {
      await apiServices.articles.bookmark(article.id);
      setArticle(prev => ({
        ...prev,
        is_bookmarked: !prev.is_bookmarked
      }));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await apiServices.articles.share(article.id, 'link');
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    try {
      setSubmittingComment(true);
      await apiServices.articles.addComment(article.id, commentText.trim());
      setCommentText('');
      await fetchArticle(); // Refresh to get new comment
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim() || submittingComment) return;
    try {
      setSubmittingComment(true);
      await apiServices.articles.addComment(article.id, replyText.trim(), parentId);
      setReplyText('');
      setReplyTo(null);
      await fetchArticle();
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;
    try {
      await apiServices.articles.deleteComment(article.id, commentId);
      await fetchArticle();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await apiServices.articles.likeComment(commentId);
      await fetchArticle();
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  // Open edit modal
  const handleOpenEdit = () => {
    setEditForm({
      title: article.title || '',
      category: article.category || 'industry-news',
      content: article.content || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
      cover_image: article.cover_image || '',
      summary: article.summary || ''
    });
    setShowEditModal(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('请填写标题和内容');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: editForm.title.trim(),
        category: editForm.category,
        content: editForm.content.trim(),
        tags: editForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        cover_image: editForm.cover_image.trim() || null,
        summary: editForm.summary.trim() || null
      };
      const response = await apiServices.articles.update(article.id, data);
      if (response.success) {
        setShowEditModal(false);
        await fetchArticle();
      }
    } catch (err) {
      console.error('更新文章失败:', err);
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!window.confirm('确定要删除这篇文章吗？删除后将无法恢复。')) return;
    try {
      const response = await apiServices.articles.delete(article.id);
      if (response.success) {
        navigate('/forum');
      }
    } catch (err) {
      console.error('删除文章失败:', err);
      alert('删除失败，请重试');
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return formatDate(dateStr);
  };

  // Get category display info
  const getCategoryInfo = (category) => {
    const categories = {
      'fba-warehouse': { name: 'FBA仓库介绍', color: '#ff6b35' },
      'anti-scam': { name: '司机防骗', color: '#e53935' },
      'industry-news': { name: '行业资讯', color: '#1890ff' },
      'experience': { name: '经验分享', color: '#52c41a' },
      'qa': { name: '问题解答', color: '#fa8c16' },
      'policy': { name: '政策法规', color: '#722ed1' },
      'technology': { name: '技术交流', color: '#13c2c2' },
      'career': { name: '职场发展', color: '#eb2f96' }
    };
    return categories[category] || { name: category, color: '#666' };
  };

  // Organize comments into tree structure
  const organizeComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return [];
    const topLevel = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }));
  };

  // Render article content
  const renderContent = (content) => {
    if (!content) return null;
    // Check if content contains HTML tags
    const hasHTML = /<[a-z][\s\S]*>/i.test(content);
    if (hasHTML) {
      return <div className="article-body" dangerouslySetInnerHTML={{ __html: content }} />;
    }
    // Plain text: split into paragraphs
    return (
      <div className="article-body">
        {content.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="article-loading">
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="article-detail-page">
        <div className="article-error">
          <h2>加载失败</h2>
          <p>{error}</p>
          <button onClick={fetchArticle} className="retry-btn">重试</button>
          <button onClick={() => navigate('/forum')} className="back-btn-link">返回论坛</button>
        </div>
      </div>
    );
  }

  // Not found
  if (!article) {
    return (
      <div className="article-detail-page">
        <div className="article-not-found">
          <h2>文章未找到</h2>
          <p>抱歉，该文章不存在或已被删除。</p>
          <button onClick={() => navigate('/forum')} className="back-btn-link">返回论坛</button>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(article.category);
  const commentTree = organizeComments(article.comments);

  return (
    <div className="article-detail-page">
      {/* Breadcrumb */}
      <nav className="article-breadcrumb">
        <div className="breadcrumb-inner">
          <Link to="/">首页</Link>
          <ChevronRight size={14} />
          <Link to="/forum">物流论坛</Link>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{article.title}</span>
        </div>
      </nav>

      <div className="article-detail-container">
        {/* Main Content */}
        <article className="article-main">
          {/* Article Header */}
          <header className="article-header">
            <div className="article-category-badge" style={{ backgroundColor: categoryInfo.color }}>
              {categoryInfo.name}
            </div>
            <h1 className="article-title">{article.title}</h1>

            {/* Author + meta - single line, small */}
            <div className="article-meta-line">
              <span className="meta-item">{article.author?.name || '匿名'}</span>
              <span className="meta-dot">·</span>
              <span className="meta-item">{formatDate(article.published_at)}</span>
              <span className="meta-dot">·</span>
              <span className="meta-item"><Eye size={12} /> {article.view_count || 0}</span>
              <span className="meta-item"><ThumbsUp size={12} /> {article.like_count || 0}</span>
              <span className="meta-item"><MessageCircle size={12} /> {article.comment_count || 0}</span>
            </div>
          </header>

          {/* Cover Image */}
          {article.cover_image && (
            <div className="article-cover">
              <img src={article.cover_image} alt={article.title} />
            </div>
          )}

          {/* Article Content */}
          <section className="article-content">
            {renderContent(article.content)}
          </section>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              <Tag size={16} />
              {article.tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/forum?tag=${encodeURIComponent(tag)}`}
                  className="tag-badge"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Action Bar - compact, matching forum */}
          <div className="article-actions-bar">
            <button
              className={`act-btn ${article.is_liked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <ThumbsUp size={14} />
              <span>点赞{article.like_count > 0 ? ` ${article.like_count}` : ''}</span>
            </button>
            <button
              className={`act-btn ${article.is_bookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
            >
              <Bookmark size={14} />
              <span>{article.is_bookmarked ? '已收藏' : '收藏'}</span>
            </button>
            <button
              className={`act-btn ${copied ? 'active' : ''}`}
              onClick={handleShare}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? '已复制' : '分享'}</span>
            </button>
            <button
              className="act-btn act-back"
              onClick={() => navigate('/forum')}
            >
              <ArrowLeft size={14} />
              <span>返回论坛</span>
            </button>
            {isEmployee && (
              <>
                <button className="act-btn act-edit" onClick={handleOpenEdit}>
                  <Edit size={14} />
                  <span>编辑</span>
                </button>
                <button className="act-btn act-delete" onClick={handleDeleteArticle}>
                  <Trash2 size={14} />
                  <span>删除</span>
                </button>
              </>
            )}
          </div>

          {/* 文章底部广告位 */}
          <div style={{ padding: '16px 32px 0' }}>
            <AdSlot position="article-bottom" layout="horizontal" />
          </div>

          {/* Comments Section */}
          <section className="comments-section" id="comments">
            <h2 className="comments-title">
              <MessageCircle size={20} />
              评论 ({article.comment_count || 0})
            </h2>

            {/* Comment Form */}
            {user ? (
              <form className="comment-form" onSubmit={handleAddComment}>
                <div className="comment-form-header">
                  <div className="comment-user-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder small">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <span className="comment-user-name">{user.name || '我'}</span>
                </div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="comment-textarea"
                />
                <div className="comment-form-footer">
                  <span className="char-count">{commentText.length}/500</span>
                  <button
                    type="submit"
                    className="submit-comment-btn"
                    disabled={!commentText.trim() || submittingComment}
                  >
                    <Send size={16} />
                    {submittingComment ? '发送中...' : '发表评论'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="comment-login-prompt">
                <User size={20} />
                <span>请登录后评论</span>
                <Link to="/login" className="login-link">去登录</Link>
              </div>
            )}

            {/* Comment List */}
            <div className="comment-list">
              {commentTree.length === 0 ? (
                <div className="no-comments">
                  <MessageCircle size={40} />
                  <p>暂无评论，来发表第一条评论吧！</p>
                </div>
              ) : (
                commentTree.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-main">
                      <div className="comment-avatar">
                        {comment.user_info?.avatar_url ? (
                          <img src={comment.user_info.avatar_url} alt={comment.user_info.name} />
                        ) : (
                          <div className="avatar-placeholder small">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{comment.user_info?.name || '匿名'}</span>
                          {comment.user_info?.company_name && (
                            <span className="comment-company">{comment.user_info.company_name}</span>
                          )}
                          <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-actions">
                          <button
                            className="comment-action-btn"
                            onClick={() => handleLikeComment(comment.id)}
                          >
                            <ThumbsUp size={14} />
                            {comment.like_count > 0 && <span>{comment.like_count}</span>}
                          </button>
                          <button
                            className="comment-action-btn"
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          >
                            <MessageCircle size={14} />
                            <span>回复</span>
                          </button>
                          {user && comment.user_info?.id === user.id && (
                            <button
                              className="comment-action-btn delete-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 size={14} />
                              <span>删除</span>
                            </button>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyTo === comment.id && user && (
                          <form className="reply-form" onSubmit={(e) => handleAddReply(e, comment.id)}>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`回复 ${comment.user_info?.name || '匿名'}...`}
                              rows={2}
                              className="reply-textarea"
                              autoFocus
                            />
                            <div className="reply-form-actions">
                              <button
                                type="button"
                                className="cancel-reply-btn"
                                onClick={() => { setReplyTo(null); setReplyText(''); }}
                              >
                                取消
                              </button>
                              <button
                                type="submit"
                                className="submit-reply-btn"
                                disabled={!replyText.trim() || submittingComment}
                              >
                                <Send size={14} />
                                {submittingComment ? '发送中...' : '回复'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="comment-replies">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="reply-item">
                                <div className="comment-avatar small">
                                  {reply.user_info?.avatar_url ? (
                                    <img src={reply.user_info.avatar_url} alt={reply.user_info.name} />
                                  ) : (
                                    <div className="avatar-placeholder tiny">
                                      <User size={12} />
                                    </div>
                                  )}
                                </div>
                                <div className="reply-body">
                                  <div className="comment-header">
                                    <span className="comment-author">{reply.user_info?.name || '匿名'}</span>
                                    {reply.user_info?.company_name && (
                                      <span className="comment-company">{reply.user_info.company_name}</span>
                                    )}
                                    <span className="comment-time">{formatRelativeTime(reply.created_at)}</span>
                                  </div>
                                  <div className="comment-content">{reply.content}</div>
                                  <div className="comment-actions">
                                    <button
                                      className="comment-action-btn"
                                      onClick={() => handleLikeComment(reply.id)}
                                    >
                                      <ThumbsUp size={14} />
                                      {reply.like_count > 0 && <span>{reply.like_count}</span>}
                                    </button>
                                    {user && reply.user_info?.id === user.id && (
                                      <button
                                        className="comment-action-btn delete-btn"
                                        onClick={() => handleDeleteComment(reply.id)}
                                      >
                                        <Trash2 size={14} />
                                        <span>删除</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </article>
      </div>

      {/* 编辑文章模态框 */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>编辑文章</h2>
              <button onClick={() => setShowEditModal(false)}>
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
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>选择分类</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  >
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
                  <textarea
                    placeholder="请输入文章摘要（选填，不超过200字）"
                    rows="2"
                    value={editForm.summary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>文章内容</label>
                  <textarea
                    placeholder="请详细描述您的文章内容..."
                    rows="8"
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>文章标签</label>
                  <input
                    type="text"
                    placeholder="请输入相关标签，用逗号分隔"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <ImageIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    封面图片URL
                  </label>
                  <input
                    type="text"
                    placeholder="请输入封面图片链接（选填）"
                    value={editForm.cover_image}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cover_image: e.target.value }))}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveEdit}
                    disabled={saving || !editForm.title.trim() || !editForm.content.trim()}
                  >
                    <Save size={16} />
                    {saving ? '保存中...' : '保存修改'}
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

export default ArticleDetail;
