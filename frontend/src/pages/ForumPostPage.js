import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  Star,
  TrendingUp,
  MessageCircle,
  Award,
  User
} from 'lucide-react';
import { apiServices } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { PATH_FORUM_LONG } from '../constants/servicePaths';
import './Forum.css';

const CATEGORIES = [
  { id: 'fba-warehouse', name: 'FBA仓库介绍', icon: Star, color: '#ff6b35' },
  { id: 'anti-scam', name: '司机防骗', icon: Star, color: '#e53935' },
  { id: 'industry-news', name: '行业资讯', icon: TrendingUp, color: '#1890ff' },
  { id: 'experience', name: '经验分享', icon: Award, color: '#52c41a' },
  { id: 'qa', name: '问题解答', icon: MessageCircle, color: '#fa8c16' },
  { id: 'policy', name: '政策法规', icon: Star, color: '#722ed1' },
  { id: 'technology', name: '技术交流', icon: Star, color: '#13c2c2' },
  { id: 'career', name: '职场发展', icon: User, color: '#eb2f96' }
];

/**
 * Dedicated publish page for forum articles (employee-only). No PremiumPostModal — API has no credits flow.
 */
const ForumPostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.isEmployee || user?.employeeRole;
  const [publishing, setPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: '',
    category: 'industry-news',
    content: '',
    tags: '',
    cover_image: '',
    summary: ''
  });

  useEffect(() => {
    const ok = user?.isEmployee || user?.employeeRole;
    if (user !== undefined && user !== null && !ok) {
      navigate(PATH_FORUM_LONG, { replace: true });
    }
  }, [user, navigate]);

  const handlePublish = async () => {
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
        tags: publishForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        cover_image: publishForm.cover_image.trim() || null,
        summary: publishForm.summary.trim() || null
      };
      const response = await apiServices.articles.create(data);
      if (response.success) {
        navigate(PATH_FORUM_LONG);
      }
    } catch (error) {
      console.error('发布文章失败:', error);
      alert('发布失败，请重试');
    } finally {
      setPublishing(false);
    }
  };

  if (!isEmployee) {
    return (
      <div className="forum forum-post-page">
        <div className="container" style={{ padding: '48px 24px' }}>
          <p>仅员工可发布文章，正在跳转…</p>
          <Link to={PATH_FORUM_LONG}>返回论坛</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forum forum-post-page">
      <div className="container" style={{ maxWidth: 800, padding: '24px 16px 48px' }}>
        <div className="forum-post-page-header" style={{ marginBottom: 24 }}>
          <Link to={PATH_FORUM_LONG} className="jobs-post-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ArrowLeft size={20} /> 返回论坛
          </Link>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>发布文章</h1>
        </div>

        <div className="forum-inline-card" style={{ position: 'relative', top: 0 }}>
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
                  {CATEGORIES.map(category => (
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
                <textarea
                  placeholder="请详细描述您的文章内容..."
                  rows="8"
                  value={publishForm.content}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, content: e.target.value }))}
                />
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
                <label>
                  <ImageIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  封面图片URL
                </label>
                <input
                  type="text"
                  placeholder="请输入封面图片链接（选填）"
                  value={publishForm.cover_image}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, cover_image: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <Link to={PATH_FORUM_LONG} className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  取消
                </Link>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || !publishForm.title.trim() || !publishForm.content.trim()}
                >
                  {publishing ? '发布中...' : (<><Plus size={16} /> 发布文章</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPostPage;
