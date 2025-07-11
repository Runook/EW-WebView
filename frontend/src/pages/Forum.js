import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  MessageCircle, 
  ThumbsUp, 
  Eye, 
  Clock,
  User,
  Star,
  Plus,
  Send,
  Bookmark,
  Share2,
  TrendingUp,
  Hash,
  Award
} from 'lucide-react';

import './Forum.css';

const Forum = () => {

  const [activeTab, setActiveTab] = useState('hot'); // hot, latest, following
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newReply, setNewReply] = useState('');

  // 论坛分类
  const forumCategories = [
    { id: 'all', name: '全部话题', icon: Hash, color: '#666' },
    { id: 'industry-news', name: '行业资讯', icon: TrendingUp, color: '#1890ff' },
    { id: 'experience', name: '经验分享', icon: Award, color: '#52c41a' },
    { id: 'qa', name: '问题解答', icon: MessageCircle, color: '#fa8c16' },
    { id: 'policy', name: '政策法规', icon: Star, color: '#722ed1' },
    { id: 'technology', name: '技术交流', icon: Star, color: '#13c2c2' },
    { id: 'career', name: '职场发展', icon: User, color: '#eb2f96' }
  ];

  // 模拟论坛数据
  const mockPosts = useMemo(() => [
    {
      id: 1,
      title: '2024年物流行业发展趋势分析',
      content: '随着数字化转型的深入，物流行业正迎来新的发展机遇。本文从供应链智能化、绿色物流、跨境电商等方面分析了2024年的发展趋势...',
      category: 'industry-news',
      categoryName: '行业资讯',
      author: {
        id: 1,
        name: '物流观察员',
        avatar: '/api/placeholder/40/40',
        title: '行业分析师',
        level: 'VIP',
        reputation: 2580
      },
      publishTime: '2024-01-01 10:30',
      views: 1250,
      likes: 89,
      replies: 23,
      isHot: true,
      isTop: false,
      tags: ['行业趋势', '数字化', '供应链'],
      images: ['/api/placeholder/600/300'],
      summary: '深度分析2024年物流行业发展趋势，涵盖技术创新、政策影响、市场机遇等多个维度。'
    },
    {
      id: 2,
      title: '仓库管理系统WMS选型经验分享',
      content: '最近公司要上WMS系统，经过半年的调研和试用，最终选定了xxx系统。整个选型过程中踩了不少坑，在这里分享一下经验...',
      category: 'experience',
      categoryName: '经验分享',
      author: {
        id: 2,
        name: '仓储达人',
        avatar: '/api/placeholder/40/40',
        title: '仓储经理',
        level: '专家',
        reputation: 1890
      },
      publishTime: '2024-01-02 14:20',
      views: 856,
      likes: 67,
      replies: 45,
      isHot: true,
      isTop: false,
      tags: ['WMS', '系统选型', '仓储管理'],
      images: [],
      summary: '详细分享WMS系统选型的全过程，包括需求分析、产品对比、试用体验等。'
    },
    {
      id: 3,
      title: '货运司机如何应对油价上涨？',
      content: '最近油价又涨了，运营成本压力很大。大家都是怎么应对的？有什么节油技巧吗？',
      category: 'qa',
      categoryName: '问题解答',
      author: {
        id: 3,
        name: '老司机王师傅',
        avatar: '/api/placeholder/40/40',
        title: '货运司机',
        level: '新手',
        reputation: 320
      },
      publishTime: '2024-01-03 09:15',
      views: 423,
      likes: 34,
      replies: 18,
      isHot: false,
      isTop: false,
      tags: ['货运', '成本控制', '节油'],
      images: [],
      summary: '讨论油价上涨对货运成本的影响，寻求节约成本的方法和建议。'
    },
    {
      id: 4,
      title: '跨境电商物流新政策解读',
      content: '海关总署最新发布的跨境电商政策对我们有什么影响？哪位大神能详细解读一下？',
      category: 'policy',
      categoryName: '政策法规',
      author: {
        id: 4,
        name: '跨境小白',
        avatar: '/api/placeholder/40/40',
        title: '电商运营',
        level: '新手',
        reputation: 180
      },
      publishTime: '2024-01-03 16:45',
      views: 567,
      likes: 28,
      replies: 12,
      isHot: false,
      isTop: true,
      tags: ['跨境电商', '政策解读', '海关'],
      images: [],
      summary: '求助解读最新跨境电商物流政策，了解对行业的影响。'
    }
  ], []);

  // 获取帖子列表 - API接口
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/forum/posts?tab=${activeTab}&category=${selectedCategory}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      let sortedPosts = [...mockPosts];
      
      if (activeTab === 'hot') {
        sortedPosts.sort((a, b) => (b.likes + b.replies * 2) - (a.likes + a.replies * 2));
      } else if (activeTab === 'latest') {
        sortedPosts.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
      }
      
      setTimeout(() => {
        setPosts(sortedPosts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      setLoading(false);
    }
  }, [activeTab, mockPosts]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 搜索帖子 - API接口
  const searchPosts = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/forum/search', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     query: searchQuery,
      //     category: selectedCategory
      //   })
      // });
      // const data = await response.json();
      
      let filteredPosts = mockPosts;
      
      if (searchQuery) {
        filteredPosts = filteredPosts.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      if (selectedCategory && selectedCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === selectedCategory);
      }
      
      setTimeout(() => {
        setPosts(filteredPosts);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('搜索失败:', error);
      setLoading(false);
    }
  };

  // 点赞帖子 - API接口
  const likePost = async (postId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/forum/posts/${postId}/like`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 收藏帖子 - API接口
  const bookmarkPost = async (postId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/forum/posts/${postId}/bookmark`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      
      console.log('收藏帖子:', postId);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  // 发布帖子 - API接口
  const publishPost = async (postData) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/forum/posts', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(postData)
      // });
      
      console.log('发布帖子:', postData);
      setShowPublishModal(false);
      fetchPosts();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  // 回复帖子 - API接口
  const replyPost = async (postId, content) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/forum/posts/${postId}/replies`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ content })
      // });
      
      console.log('回复帖子:', postId, content);
      setNewReply('');
      
      // 更新回复数
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, replies: post.replies + 1 }
          : post
      ));
    } catch (error) {
      console.error('回复失败:', error);
    }
  };

  const handleSearch = () => {
    searchPosts();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getAuthorLevelColor = (level) => {
    switch (level) {
      case 'VIP': return '#f50';
      case '专家': return '#1890ff';
      case '新手': return '#52c41a';
      default: return '#666';
    }
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
                {forumCategories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <div 
                      key={category.id}
                      className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={16} style={{ color: category.color }} />
                      <span>{category.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hot-topics">
              <h3>热门话题</h3>
              <div className="topic-list">
                <div className="topic-item">
                  <Hash size={14} />
                  <span>2024物流趋势</span>
                </div>
                <div className="topic-item">
                  <Hash size={14} />
                  <span>WMS系统</span>
                </div>
                <div className="topic-item">
                  <Hash size={14} />
                  <span>成本控制</span>
                </div>
                <div className="topic-item">
                  <Hash size={14} />
                  <span>跨境电商</span>
                </div>
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

              <button 
                className="publish-btn"
                onClick={() => setShowPublishModal(true)}
              >
                <Plus size={20} />
                发布话题
              </button>
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

            {/* 帖子列表 */}
            <div className="posts-list">
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>加载中...</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="post-card">
                    {post.isTop && <div className="top-tag">置顶</div>}
                    {post.isHot && <div className="hot-tag">热门</div>}
                    
                    <div className="post-header">
                      <div className="author-info">
                        <img src={post.author.avatar} alt={post.author.name} className="avatar" />
                        <div className="author-details">
                          <div className="author-name">
                            <span>{post.author.name}</span>
                            <span 
                              className="level-badge"
                              style={{ color: getAuthorLevelColor(post.author.level) }}
                            >
                              {post.author.level}
                            </span>
                          </div>
                          <div className="author-title">{post.author.title}</div>
                        </div>
                      </div>
                      
                      <div className="post-meta">
                        <span className="category-badge">{post.categoryName}</span>
                        <span className="publish-time">
                          <Clock size={12} />
                          {post.publishTime}
                        </span>
                      </div>
                    </div>

                    <div className="post-content">
                      <h3 className="post-title" onClick={() => setSelectedPost(post)}>
                        {post.title}
                      </h3>
                      
                      <p className="post-summary">{post.summary}</p>
                      
                      {post.images.length > 0 && (
                        <div className="post-images">
                          <img src={post.images[0]} alt="post" />
                        </div>
                      )}

                      <div className="post-tags">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="post-footer">
                      <div className="post-stats">
                        <span><Eye size={14} /> {post.views}</span>
                        <span><ThumbsUp size={14} /> {post.likes}</span>
                        <span><MessageCircle size={14} /> {post.replies}</span>
                      </div>
                      
                      <div className="post-actions">
                        <button 
                          className="action-btn"
                          onClick={() => likePost(post.id)}
                        >
                          <ThumbsUp size={16} />
                          点赞
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => setSelectedPost(post)}
                        >
                          <MessageCircle size={16} />
                          回复
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => bookmarkPost(post.id)}
                        >
                          <Bookmark size={16} />
                          收藏
                        </button>
                        <button className="action-btn">
                          <Share2 size={16} />
                          分享
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {posts.length === 0 && !loading && (
              <div className="no-results">
                <MessageCircle size={64} />
                <h3>暂无相关话题</h3>
                <p>试试调整搜索条件或发布新话题</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 帖子详情模态框 */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content post-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPost.title}</h2>
              <button onClick={() => setSelectedPost(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="post-detail-content">
                <div className="post-detail-header">
                  <div className="author-info">
                    <img src={selectedPost.author.avatar} alt={selectedPost.author.name} />
                    <div className="author-details">
                      <div className="author-name">
                        <span>{selectedPost.author.name}</span>
                        <span 
                          className="level-badge"
                          style={{ color: getAuthorLevelColor(selectedPost.author.level) }}
                        >
                          {selectedPost.author.level}
                        </span>
                      </div>
                      <div className="author-stats">
                        <span>{selectedPost.author.title}</span>
                        <span>声望: {selectedPost.author.reputation}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="post-detail-meta">
                    <span className="category-badge">{selectedPost.categoryName}</span>
                    <span className="publish-time">{selectedPost.publishTime}</span>
                  </div>
                </div>

                <div className="post-detail-body">
                  <div className="post-content-full">
                    {selectedPost.content}
                  </div>

                  {selectedPost.images.length > 0 && (
                    <div className="post-images">
                      {selectedPost.images.map((img, index) => (
                        <img key={index} src={img} alt={`post-${index}`} />
                      ))}
                    </div>
                  )}

                  <div className="post-tags">
                    {selectedPost.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="post-actions-bar">
                  <button 
                    className="action-btn primary"
                    onClick={() => likePost(selectedPost.id)}
                  >
                    <ThumbsUp size={16} />
                    点赞 ({selectedPost.likes})
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => bookmarkPost(selectedPost.id)}
                  >
                    <Bookmark size={16} />
                    收藏
                  </button>
                  <button className="action-btn">
                    <Share2 size={16} />
                    分享
                  </button>
                </div>

                {/* 回复区域 */}
                <div className="replies-section">
                  <h4>回复 ({selectedPost.replies})</h4>
                  
                  <div className="reply-form">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="写下你的回复..."
                      rows="3"
                    />
                    <div className="reply-actions">
                      <button 
                        className="btn-primary"
                        onClick={() => replyPost(selectedPost.id, newReply)}
                        disabled={!newReply.trim()}
                      >
                        <Send size={16} />
                        发布回复
                      </button>
                    </div>
                  </div>

                  <div className="replies-list">
                    {/* 这里可以加载真实的回复数据 */}
                    <div className="reply-item">
                      <img src="/api/placeholder/32/32" alt="reply-author" className="reply-avatar" />
                      <div className="reply-content">
                        <div className="reply-author">
                          <span>用户名</span>
                          <span className="reply-time">2024-01-01 12:00</span>
                        </div>
                        <p>这是一条示例回复内容...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发布话题模态框 */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>发布话题</h2>
              <button onClick={() => setShowPublishModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="publish-form">
                <div className="form-group">
                  <label>话题标题</label>
                  <input type="text" placeholder="请输入话题标题" />
                </div>
                
                <div className="form-group">
                  <label>选择分类</label>
                  <select>
                    {forumCategories.slice(1).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>话题内容</label>
                  <textarea 
                    placeholder="请详细描述您要讨论的话题..." 
                    rows="8"
                  />
                </div>

                <div className="form-group">
                  <label>话题标签</label>
                  <input 
                    type="text" 
                    placeholder="请输入相关标签，用逗号分隔" 
                  />
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
                    onClick={() => publishPost({})}
                  >
                    发布话题
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