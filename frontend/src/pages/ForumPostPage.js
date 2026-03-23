import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  Star,
  TrendingUp,
  MessageCircle,
  Award,
  User,
  Upload,
  Send
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PremiumPostStep from '../components/PremiumPostStep';
import { apiServices, getAuthToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { PATH_FORUM_LONG } from '../constants/servicePaths';
import './ForumEditor.css';

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

const API_BASE = process.env.REACT_APP_API_URL || 'https://welogx.com/api';

const ForumPostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.isEmployee || user?.employeeRole;
  const quillRef = useRef(null);

  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState('editor'); // 'editor' | 'premium'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('industry-news');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);

  useEffect(() => {
    const ok = user?.isEmployee || user?.employeeRole;
    if (user !== undefined && user !== null && !ok) {
      navigate(PATH_FORUM_LONG, { replace: true });
    }
  }, [user, navigate]);

  const compressImage = useCallback((file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadImage = useCallback(async (file) => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('image', compressed);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/upload/single`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error(data.message || '上传失败');
  }, [compressImage]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
        }
      } catch (err) {
        alert('图片上传失败: ' + err.message);
      }
    };
  }, [uploadImage]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link', 'image'],
        [{ align: [] }],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'link', 'image', 'align'
  ];

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch (err) {
      alert('封面上传失败: ' + err.message);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGoToPremium = () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      alert('请填写标题和内容');
      return;
    }
    const data = {
      title: title.trim(),
      category,
      content,
      tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      cover_image: coverImage || null,
      summary: summary.trim() || null
    };
    setSavedFormData(data);
    setStep('premium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPublish = async ({ formData, premium }) => {
    setPublishing(true);
    try {
      const postData = { ...formData, premium };
      const response = await apiServices.articles.create(postData);
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
      <div className="forum-editor-page">
        <div className="fe-container">
          <p>仅员工可发布文章，正在跳转…</p>
          <Link to={PATH_FORUM_LONG}>返回论坛</Link>
        </div>
      </div>
    );
  }

  if (step === 'premium' && savedFormData) {
    return (
      <div className="forum-editor-page">
        <div className="fe-container">
          <div className="fe-header">
            <Link to={PATH_FORUM_LONG} className="fe-back"><ArrowLeft size={20} /> 返回论坛</Link>
            <h1>发布文章</h1>
          </div>
          <div className="fe-card">
            <PremiumPostStep
              postType="article"
              formData={savedFormData}
              onConfirm={handleConfirmPublish}
              onBack={() => setStep('editor')}
              loading={publishing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-editor-page">
      <div className="fe-container">
        <div className="fe-header">
          <Link to={PATH_FORUM_LONG} className="fe-back">
            <ArrowLeft size={20} /> 返回论坛
          </Link>
          <h1>发布文章</h1>
        </div>

        <div className="fe-card">
          {/* Title */}
          <div className="fe-field">
            <label>文章标题 *</label>
            <input type="text" placeholder="请输入文章标题" value={title} onChange={(e) => setTitle(e.target.value)} className="fe-input" />
          </div>

          {/* Category + Tags row */}
          <div className="fe-row">
            <div className="fe-field">
              <label>选择分类</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="fe-select">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fe-field">
              <label>文章标签</label>
              <input type="text" placeholder="用逗号分隔，如：物流,行业资讯" value={tags} onChange={(e) => setTags(e.target.value)} className="fe-input" />
            </div>
          </div>

          {/* Summary */}
          <div className="fe-field">
            <label>文章摘要（选填）</label>
            <textarea placeholder="不超过200字，留空将自动截取正文前200字" rows="2" value={summary} onChange={(e) => setSummary(e.target.value)} className="fe-textarea" />
          </div>

          {/* Cover image upload */}
          <div className="fe-field">
            <label><ImageIcon size={14} /> 封面图片（选填）</label>
            <div className="fe-cover-area">
              {coverImage ? (
                <div className="fe-cover-preview">
                  <img src={coverImage} alt="封面预览" />
                  <button type="button" className="fe-cover-remove" onClick={() => setCoverImage('')}>更换</button>
                </div>
              ) : (
                <label className="fe-cover-upload">
                  <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  {coverUploading ? '上传中...' : (<><Upload size={20} /> 点击上传封面图片</>)}
                </label>
              )}
            </div>
          </div>

          {/* Rich text editor */}
          <div className="fe-field">
            <label>文章内容 *</label>
            <p className="fe-hint">点击工具栏图片按钮可在任意位置插入图片，图片将自动上传到服务器</p>
            <div className="fe-editor-wrap">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="在这里撰写文章内容..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="fe-actions">
            <Link to={PATH_FORUM_LONG} className="fe-btn secondary">取消</Link>
            <button
              type="button"
              className="fe-btn primary"
              onClick={handleGoToPremium}
              disabled={!title.trim() || !content.trim() || content === '<p><br></p>'}
            >
              <Send size={16} /> 下一步（积分与置顶）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPostPage;
