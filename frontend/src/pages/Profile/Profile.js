import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../components/common/Notification';
import { apiLogger } from '../../utils/logger';
import { useLoading } from '../../hooks';
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
  AlertCircle,
  Package,
  ArrowRight,
  Scale,
  Clock,
  Calendar
} from 'lucide-react';
import { apiServices, handleApiError, apiClient } from '../../utils/apiClient';
import './Profile.css';

const Profile = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const { success, error: showError, confirm } = useNotification();
  const { loading, withLoading } = useLoading(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [postsFilter, setPostsFilter] = useState('active'); // 'active' 或 'inactive'
  const [postsCategoryFilter, setPostsCategoryFilter] = useState('all'); // 类别筛选
  const [credits, setCredits] = useState(null);
  const [posts, setPosts] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);

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
  const fetchUserData = useCallback(async () => {
    await withLoading(async () => {
      try {
        apiLogger.info('获取用户数据...');
        
        const [creditsData, postsData] = await Promise.all([
          apiServices.userManagement.getCredits(),
          apiServices.userManagement.getPosts()
        ]);

        setCredits(creditsData.data);
        setPosts(postsData.data);
        apiLogger.info('用户数据获取成功', { credits: creditsData.data, posts: postsData.data });
      } catch (error) {
        const errorMsg = handleApiError(error, '获取用户数据');
        apiLogger.error('获取用户数据失败', error);
        showError(errorMsg);
      }
    });
  }, [withLoading, showError]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const fetchCreditHistory = async () => {
    try {
      const data = await apiServices.userManagement.getCreditHistory();
      setCreditHistory(data.data);
      apiLogger.info('积分历史获取成功', data.data);
    } catch (error) {
      const errorMsg = handleApiError(error, '获取积分历史');
      apiLogger.error('获取积分历史失败', error);
      showError(errorMsg);
    }
  };

  // 切换发布状态
  const togglePostStatus = async (type, id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      apiLogger.info('切换发布状态', { type, id, currentStatus, newStatus });
      
      await apiServices.userManagement.updatePostStatus(type, id, newStatus);
      fetchUserData(); // 重新获取数据
      success('状态更新成功');
      apiLogger.info('状态更新成功');
    } catch (error) {
      const errorMsg = handleApiError(error, '状态更新');
      apiLogger.error('状态更新失败', error);
      showError(errorMsg);
    }
  };

  // 删除发布
  const deletePost = async (type, id) => {
    const confirmed = await confirm('确认删除此发布？删除后不可恢复。', {
      confirmText: '删除',
      confirmVariant: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      apiLogger.info('删除发布', { type, id });
      
      await apiServices.userManagement.deletePost(type, id);
      fetchUserData(); // 重新获取数据
      success('删除成功');
      apiLogger.info('删除成功');
    } catch (error) {
      const errorMsg = handleApiError(error, '删除发布');
      apiLogger.error('删除失败', error);
      showError(errorMsg);
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
      case 'rental':
      case 'sale':
        showError('租售信息编辑功能即将推出');
        break;
      default:
        showError('暂不支持编辑此类型的内容');
    }
  };

  // 处理充值
  const handleRecharge = async (amount, credits) => {
    const confirmed = await confirm(
      `确认虚拟充值 $${amount} 获得 ${credits} 积分？（这是测试功能）`,
      {
        confirmText: '确认充值',
        confirmVariant: 'primary'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      
      const data = await apiClient.post('/user-management/recharge', {
        amount: amount,
        paymentMethod: 'mock'
      });

      if (data.success) {
        success(`虚拟充值成功！获得 ${data.data.credits} 积分`);
        fetchUserData(); // 重新获取积分数据
        navigate('/profile/credits'); // 返回积分管理页面
      } else {
        showError(data.message || '充值失败');
      }
    } catch (error) {
      apiLogger.error('充值失败', error);
      showError('充值失败: ' + error.message);
    }
  };

  // 渲染发布项目 - 使用货源板样式的卡片
  const renderPostItem = (item, type) => {
    if (type === 'load') {
      return (
        <div key={`${type}-${item.id}`} className={`quote-card-item ${item.status} ${item.is_premium ? 'premium' : ''}`}>
          <div className="quote-card-main">
            {/* 服务类型标识 */}
            <div className="quote-service-type">
              <span className="quote-ftl-badge">
                <Package size={16} />
                整车 FTL
              </span>
            </div>
            
            {/* 运输路线 */}
            <div className="quote-route">
              <span className="quote-origin">{item.origin}</span>
              <ArrowRight size={16} />
              <span className="quote-destination">{item.destination}</span>
            </div>

            {/* 货物重量 */}
            <div className="quote-weight">
              <Scale size={14} />
              {item.weight}
            </div>
            
            {/* 取货日期 */}
            <div className="quote-date">
              <Calendar size={14} />
              <span className="quote-date-text">
                {item.pickup_date ? 
                  new Date(item.pickup_date).toLocaleDateString() 
                  : '未知日期'}
              </span>
            </div>
            
            {/* 发布时间 */}
            <div className="quote-publication-date">
              <Clock size={14} />
              <span className="quote-publication-text">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* 操作按钮 */}
            <div className="quote-actions">
              <button
                className={`quote-action-btn ${item.status}`}
                onClick={() => togglePostStatus(type, item.id, item.status)}
                title={item.status === 'active' ? '点击下架' : '点击上架'}
              >
                {item.status === 'active' ? '上架' : '下架'}
              </button>
              <button
                className="quote-action-btn delete"
                onClick={() => deletePost(type, item.id)}
                title="删除"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      );
    }

    const getTitle = () => {
      switch (type) {
        case 'company':
          return item.name;
        case 'job':
          return item.title;
        case 'resume':
          return `${item.name} - ${item.position}`;
        case 'rental':
          return item.title;
        case 'sale':
          return item.title;
        default:
          return '未知';
      }
    };

    const getSubtitle = () => {
      switch (type) {
        case 'company':
          return item.category;
        case 'job':
          return `${item.company} | ${item.location}`;
        case 'resume':
          return `${item.experience} | ${item.location}`;
        case 'rental':
          return `${item.category} | ${item.location} | ${item.price}`;
        case 'sale':
          return `${item.category} | ${item.location} | ${item.price}`;
        default:
          return '';
      }
    };

    return (
      <div key={`${type}-${item.id}`} className={`post-item ${item.status} ${item.is_premium ? 'premium' : ''}`}>
        <div className="post-main">
          <div className="post-info">
            <h3 className="post-title">{getTitle()}</h3>
            <span className="post-subtitle">{getSubtitle()}</span>
            <span className="post-date">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.is_premium && <span className="premium-tag">置顶</span>}
          </div>
          <div className="post-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => editPost(type, item)}
              title="编辑"
            >
              编辑
            </button>
            <button
              className={`action-btn status-btn ${item.status}`}
              onClick={() => togglePostStatus(type, item.id, item.status)}
              title={item.status === 'active' ? '点击下架' : '点击上架'}
            >
              {item.status === 'active' ? '上架' : '下架'}
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => deletePost(type, item.id)}
              title="删除"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getTotalCounts = () => {
    if (!posts) return { active: 0, inactive: 0 };
    
    const active = posts.active ? 
      posts.active.loads.length + 
      posts.active.companies.length + posts.active.jobs.length + 
      posts.active.resumes.length + 
      (posts.active.rentals?.length || 0) + (posts.active.sales?.length || 0) : 0;
    
    const inactive = posts.inactive ? 
      posts.inactive.loads.length + 
      posts.inactive.companies.length + posts.inactive.jobs.length + 
      posts.inactive.resumes.length +
      (posts.inactive.rentals?.length || 0) + (posts.inactive.sales?.length || 0) : 0;
    
    return { active, inactive };
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  const totalCounts = getTotalCounts();

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 主内容区 - 全宽 */}
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
                      {posts.active.loads.slice(0, 3).map(item => renderPostItem(item, 'load'))}
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
                      上架中 ({totalCounts.active})
                    </button>
                    <button
                      className={`filter-tab ${postsFilter === 'inactive' ? 'active' : ''}`}
                      onClick={() => setPostsFilter('inactive')}
                    >
                      已下架 ({totalCounts.inactive})
                    </button>
                  </div>
                  <button className="refresh-btn" onClick={fetchUserData}>
                    刷新
                  </button>
                </div>
              </div>

              {posts && posts[postsFilter] && (
                <div className="posts-content-wrapper">
                  {/* 左侧类别菜单 */}
                  <div className="posts-sidebar">
                    <button
                      className={`category-item ${postsCategoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setPostsCategoryFilter('all')}
                    >
                      全部
                    </button>
                    <button
                      className={`category-item ${postsCategoryFilter === 'loads' ? 'active' : ''}`}
                      onClick={() => setPostsCategoryFilter('loads')}
                    >
                      已保存的Quote ({posts[postsFilter].loads.length})
                    </button>
                    <button
                      className={`category-item ${postsCategoryFilter === 'companies' ? 'active' : ''}`}
                      onClick={() => setPostsCategoryFilter('companies')}
                    >
                      企业 ({posts[postsFilter].companies.length})
                    </button>
                    <button
                      className={`category-item ${postsCategoryFilter === 'jobs' ? 'active' : ''}`}
                      onClick={() => setPostsCategoryFilter('jobs')}
                    >
                      职位 ({posts[postsFilter].jobs.length})
                    </button>
                    <button
                      className={`category-item ${postsCategoryFilter === 'resumes' ? 'active' : ''}`}
                      onClick={() => setPostsCategoryFilter('resumes')}
                    >
                      简历 ({posts[postsFilter].resumes.length})
                    </button>
                    {posts[postsFilter].rentals && posts[postsFilter].rentals.length > 0 && (
                      <button
                        className={`category-item ${postsCategoryFilter === 'rentals' ? 'active' : ''}`}
                        onClick={() => setPostsCategoryFilter('rentals')}
                      >
                        租赁 ({posts[postsFilter].rentals.length})
                      </button>
                    )}
                    {posts[postsFilter].sales && posts[postsFilter].sales.length > 0 && (
                      <button
                        className={`category-item ${postsCategoryFilter === 'sales' ? 'active' : ''}`}
                        onClick={() => setPostsCategoryFilter('sales')}
                      >
                        出售 ({posts[postsFilter].sales.length})
                      </button>
                    )}
                  </div>

                  {/* 右侧内容区 */}
                  <div className="posts-content">
                    {(postsCategoryFilter === 'all' || postsCategoryFilter === 'loads') && (
                      <div className="posts-list">
                        {posts[postsFilter].loads.map(item => renderPostItem(item, 'load'))}
                      </div>
                    )}

                    {(postsCategoryFilter === 'all' || postsCategoryFilter === 'companies') && (
                      <div className="posts-list">
                        {posts[postsFilter].companies.map(item => renderPostItem(item, 'company'))}
                      </div>
                    )}

                    {(postsCategoryFilter === 'all' || postsCategoryFilter === 'jobs') && (
                      <div className="posts-list">
                        {posts[postsFilter].jobs.map(item => renderPostItem(item, 'job'))}
                      </div>
                    )}

                    {(postsCategoryFilter === 'all' || postsCategoryFilter === 'resumes') && (
                      <div className="posts-list">
                        {posts[postsFilter].resumes.map(item => renderPostItem(item, 'resume'))}
                      </div>
                    )}

                    {posts[postsFilter].rentals && (postsCategoryFilter === 'all' || postsCategoryFilter === 'rentals') && (
                      <div className="posts-list">
                        {posts[postsFilter].rentals.map(item => renderPostItem(item, 'rental'))}
                      </div>
                    )}

                    {posts[postsFilter].sales && (postsCategoryFilter === 'all' || postsCategoryFilter === 'sales') && (
                      <div className="posts-list">
                        {posts[postsFilter].sales.map(item => renderPostItem(item, 'sale'))}
                      </div>
                    )}
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
