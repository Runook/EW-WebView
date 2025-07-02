import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  CreditCard, 
  FileText, 
  TrendingUp,
  Coins,
  History,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Star,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [postsFilter, setPostsFilter] = useState('active'); // 'active' 或 'inactive'
  const [credits, setCredits] = useState(null);
  const [posts, setPosts] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 根据URL参数设置activeTab
  useEffect(() => {
    const tabMap = {
      'posts': 'posts',
      'credits': 'credits',
      'recharge': 'credits',
      'settings': 'settings'
    };
    
    setActiveTab(section ? (tabMap[section] || 'overview') : 'overview');
  }, [section]);

  // 获取用户信息
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      console.log('📊 获取用户数据...', { API_URL, hasToken: !!token });
      
      const [creditsRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/user-management/credits`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/user-management/posts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCredits(creditsData.data);
        console.log('✅ 积分数据获取成功:', creditsData.data);
      } else {
        console.error('❌ 积分数据获取失败:', creditsRes.status);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.data);
        console.log('✅ 发布数据获取成功:', postsData.data);
      } else {
        console.error('❌ 发布数据获取失败:', postsRes.status);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditHistory = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/user-management/credits/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.data);
        console.log('✅ 积分历史获取成功:', data.data);
      } else {
        console.error('❌ 积分历史获取失败:', response.status);
      }
    } catch (error) {
      console.error('获取积分历史失败:', error);
    }
  };

  // 切换发布状态
  const togglePostStatus = async (type, id, currentStatus) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      console.log('🔄 切换发布状态:', { type, id, currentStatus, newStatus });
      
      const response = await fetch(`${API_URL}/user-management/posts/${type}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUserData(); // 重新获取数据
        console.log('✅ 状态更新成功');
      } else {
        console.error('❌ 状态更新失败:', response.status);
        alert('状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败');
    }
  };

  // 删除发布
  const deletePost = async (type, id) => {
    if (!window.confirm('确认删除此发布？删除后不可恢复。')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      console.log('🗑️ 删除发布:', { type, id });
      
      const response = await fetch(`${API_URL}/user-management/posts/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUserData(); // 重新获取数据
        alert('删除成功');
        console.log('✅ 删除成功');
      } else {
        console.error('❌ 删除失败:', response.status);
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 编辑发布
  const editPost = (type, item) => {
    // 根据类型跳转到对应的编辑页面
    switch (type) {
      case 'load':
        navigate('/freight-board', { 
          state: { editMode: true, editData: item } 
        });
        break;
      case 'truck':
        navigate('/freight-board', { 
          state: { editMode: true, editData: item, postType: 'truck' } 
        });
        break;
      case 'company':
        navigate('/yellow-pages', { 
          state: { editMode: true, editData: item } 
        });
        break;
      case 'job':
        navigate('/jobs', { 
          state: { editMode: true, editData: item, postType: 'job' } 
        });
        break;
      case 'resume':
        navigate('/jobs', { 
          state: { editMode: true, editData: item, postType: 'resume' } 
        });
        break;
      default:
        alert('暂不支持编辑此类型的内容');
    }
  };

  // 处理充值
  const handleRecharge = async (amount, credits) => {
    if (!window.confirm(`确认虚拟充值 $${amount} 获得 ${credits} 积分？（这是测试功能）`)) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/user-management/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          paymentMethod: 'mock'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`虚拟充值成功！获得 ${data.data.credits} 积分`);
        fetchUserData(); // 重新获取积分数据
        navigate('/profile/credits'); // 返回积分管理页面
      } else {
        const error = await response.json();
        alert(error.message || '充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败: ' + error.message);
    }
  };

  // 渲染发布项目
  const renderPostItem = (item, type) => {
    const getTitle = () => {
      switch (type) {
        case 'load':
          return `${item.origin} → ${item.destination}`;
        case 'truck':
          return `${item.current_location} → ${item.preferred_destination || '全国各地'}`;
        case 'company':
          return item.name;
        case 'job':
          return item.title;
        case 'resume':
          return `${item.name} - ${item.position}`;
        default:
          return '未知';
      }
    };

    const getSubtitle = () => {
      switch (type) {
        case 'load':
          return `${item.service_type || item.serviceType} | ${item.weight}`;
        case 'truck':
          return `${item.service_type || item.serviceType} | ${item.truck_type || item.truckType}`;
        case 'company':
          return item.category;
        case 'job':
          return `${item.company} | ${item.location}`;
        case 'resume':
          return `${item.experience} | ${item.location}`;
        default:
          return '';
      }
    };

    return (
      <div key={`${type}-${item.id}`} className={`post-item ${item.status} ${item.is_premium ? 'premium' : ''}`}>
        {/* 高亮背景效果 */}
        {item.is_premium && item.premium_type === 'highlight' && (
          <div className="highlight-overlay"></div>
        )}
        
        {/* 置顶标识 */}
        {item.is_premium && item.premium_type === 'top' && (
          <div className="top-badge">
            <Star size={14} />
            <span>置顶</span>
          </div>
        )}

        <div className="post-main">
          <div className="post-header">
            <h3 className="post-title">{getTitle()}</h3>
            <div className="post-actions">
              <button
                className="edit-btn"
                onClick={() => editPost(type, item)}
                title="编辑"
              >
                <Edit size={16} />
              </button>
              <button
                className={`status-btn ${item.status}`}
                onClick={() => togglePostStatus(type, item.id, item.status)}
                title={item.status === 'active' ? '点击下架' : '点击上架'}
              >
                {item.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                {item.status === 'active' ? '上架中' : '已下架'}
              </button>
              <button
                className="delete-btn"
                onClick={() => deletePost(type, item.id)}
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <p className="post-subtitle">{getSubtitle()}</p>
          <div className="post-meta">
            <span className="post-date">
              发布于 {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.is_premium && item.premium_type === 'highlight' && (
              <span className="highlight-badge">
                <Zap size={12} />
                高亮
              </span>
            )}
            <span className="views-count">
              浏览 {item.views || item.views_count || 0} 次
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 获取总计数
  const getTotalCounts = () => {
    if (!posts) return { active: 0, inactive: 0 };
    
    const active = posts.active ? 
      posts.active.loads.length + posts.active.trucks.length + 
      posts.active.companies.length + posts.active.jobs.length + 
      posts.active.resumes.length : 0;
    
    const inactive = posts.inactive ? 
      posts.inactive.loads.length + posts.inactive.trucks.length + 
      posts.inactive.companies.length + posts.inactive.jobs.length + 
      posts.inactive.resumes.length : 0;
    
    return { active, inactive };
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={32} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const totalCounts = getTotalCounts();

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 侧边栏 */}
        <div className="profile-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              <User size={48} />
            </div>
            <h2>我的账户</h2>
          </div>
          
          <nav className="profile-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <TrendingUp size={20} />
              概览
            </button>
            <button
              className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => navigate('/profile/posts')}
            >
              <FileText size={20} />
              我的发布
            </button>
            <button
              className={`nav-item ${activeTab === 'credits' ? 'active' : ''}`}
              onClick={() => {
                navigate('/profile/credits');
                if (creditHistory.length === 0) {
                  fetchCreditHistory();
                }
              }}
            >
              <Coins size={20} />
              积分管理
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('/profile/settings')}
            >
              <Settings size={20} />
              账户设置
            </button>
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="profile-content">
          {/* 概览页面 */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h1>账户概览</h1>
              
              <div className="overview-cards">
                <div className="overview-card credits-card">
                  <div className="card-icon">
                    <Coins size={24} />
                  </div>
                  <div className="card-info">
                    <h3>积分余额</h3>
                    <div className="card-value">{credits?.current || 0}</div>
                    <p className="card-subtitle">
                      累计获得 {credits?.totalEarned || 0} | 已消费 {credits?.totalSpent || 0}
                    </p>
                  </div>
                </div>

                <div className="overview-card posts-card">
                  <div className="card-icon">
                    <FileText size={24} />
                  </div>
                  <div className="card-info">
                    <h3>发布总数</h3>
                    <div className="card-value">{totalCounts.active + totalCounts.inactive}</div>
                    <p className="card-subtitle">
                      上架中 {totalCounts.active} | 已下架 {totalCounts.inactive}
                    </p>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h2>最近发布</h2>
                <div className="activity-list">
                  {posts && posts.active && (
                    <>
                      {posts.active.loads.slice(0, 2).map(item => renderPostItem(item, 'load'))}
                      {posts.active.trucks.slice(0, 2).map(item => renderPostItem(item, 'truck'))}
                      {posts.active.companies.slice(0, 2).map(item => renderPostItem(item, 'company'))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 我的发布页面 */}
          {activeTab === 'posts' && (
            <div className="posts-section">
              <div className="section-header">
                <h1>我的发布</h1>
                <div className="header-actions">
                  <div className="filter-tabs">
                    <button
                      className={`filter-tab ${postsFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setPostsFilter('active')}
                    >
                      <CheckCircle size={16} />
                      上架中 ({totalCounts.active})
                    </button>
                    <button
                      className={`filter-tab ${postsFilter === 'inactive' ? 'active' : ''}`}
                      onClick={() => setPostsFilter('inactive')}
                    >
                      <AlertCircle size={16} />
                      已下架 ({totalCounts.inactive})
                    </button>
                  </div>
                  <button className="refresh-btn" onClick={fetchUserData}>
                    <RefreshCw size={16} />
                    刷新
                  </button>
                </div>
              </div>

              {posts && posts[postsFilter] && (
                <div className="posts-content">
                  <div className="posts-category">
                    <h2>货源信息 ({posts[postsFilter].loads.length})</h2>
                    <div className="posts-list">
                      {posts[postsFilter].loads.map(item => renderPostItem(item, 'load'))}
                    </div>
                  </div>

                  <div className="posts-category">
                    <h2>车源信息 ({posts[postsFilter].trucks.length})</h2>
                    <div className="posts-list">
                      {posts[postsFilter].trucks.map(item => renderPostItem(item, 'truck'))}
                    </div>
                  </div>

                  <div className="posts-category">
                    <h2>企业信息 ({posts[postsFilter].companies.length})</h2>
                    <div className="posts-list">
                      {posts[postsFilter].companies.map(item => renderPostItem(item, 'company'))}
                    </div>
                  </div>

                  <div className="posts-category">
                    <h2>职位信息 ({posts[postsFilter].jobs.length})</h2>
                    <div className="posts-list">
                      {posts[postsFilter].jobs.map(item => renderPostItem(item, 'job'))}
                    </div>
                  </div>

                  <div className="posts-category">
                    <h2>简历信息 ({posts[postsFilter].resumes.length})</h2>
                    <div className="posts-list">
                      {posts[postsFilter].resumes.map(item => renderPostItem(item, 'resume'))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 积分管理页面 */}
          {activeTab === 'credits' && (
            <div className="credits-section">
              <h1>{section === 'recharge' ? '充值积分' : '积分管理'}</h1>
              
              <div className="credits-overview">
                <div className="credits-balance">
                  <h2>当前余额</h2>
                  <div className="balance-amount">{credits?.current || 0}</div>
                  <p>积分</p>
                </div>
                
                <div className="credits-actions">
                  <button 
                    className={`recharge-btn ${section === 'recharge' ? 'active' : ''}`}
                    onClick={() => navigate('/profile/recharge')}
                  >
                    <CreditCard size={16} />
                    充值积分
                  </button>
                  {section === 'recharge' && (
                    <button 
                      className="back-btn"
                      onClick={() => navigate('/profile/credits')}
                    >
                      返回积分管理
                    </button>
                  )}
                </div>
              </div>

              {section === 'recharge' ? (
                <div className="recharge-section">
                  <h2>选择充值套餐</h2>
                  <div className="recharge-packages">
                    <div className="package-item" onClick={() => handleRecharge(10, 100)}>
                      <div className="package-price">$10</div>
                      <div className="package-credits">100 积分</div>
                      <div className="package-bonus">新手推荐</div>
                    </div>
                    <div className="package-item popular" onClick={() => handleRecharge(45, 500)}>
                      <div className="package-price">$45</div>
                      <div className="package-credits">500 积分</div>
                      <div className="package-bonus">最受欢迎</div>
                    </div>
                    <div className="package-item" onClick={() => handleRecharge(85, 1000)}>
                      <div className="package-price">$85</div>
                      <div className="package-credits">1000 积分</div>
                      <div className="package-bonus">超值优惠</div>
                    </div>
                    <div className="package-item" onClick={() => handleRecharge(160, 2000)}>
                      <div className="package-price">$160</div>
                      <div className="package-credits">2000 积分</div>
                      <div className="package-bonus">商务首选</div>
                    </div>
                    <div className="package-item premium" onClick={() => handleRecharge(380, 5000)}>
                      <div className="package-price">$380</div>
                      <div className="package-credits">5000 积分</div>
                      <div className="package-bonus">企业套餐</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="credits-history">
                  <h2>
                    <History size={20} />
                    积分记录
                  </h2>
                  <div className="history-list">
                    {creditHistory.map(record => (
                      <div key={record.id} className="history-item">
                        <div className="history-main">
                          <span className="history-description">{record.description}</span>
                          <span className="history-date">
                            {new Date(record.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className={`history-amount ${record.amount > 0 ? 'positive' : 'negative'}`}>
                          {record.amount > 0 ? '+' : ''}{record.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 账户设置页面 */}
          {activeTab === 'settings' && (
            <div className="settings-section">
              <h1>账户设置</h1>
              <p>设置功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
