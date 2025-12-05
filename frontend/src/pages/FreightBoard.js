import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  Scale,
  Info,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiServices, handleApiError } from '../utils/apiClient';
import { useNotification } from '../components/common/Notification';
import { apiLogger } from '../utils/logger';
import { useLoading } from '../hooks';
import './PlatformPage.css';
import './FreightBoard.css';

/**
 * 陆运信息平台主组件 - 简化版，只显示货源信息
 */
const FreightBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { success, error: showError, apiError } = useNotification();
  
  const [error, setError] = useState(null);
  const [loads, setLoads] = useState([]);

  const { loading, withLoading } = useLoading(false);
  const { isAuthenticated } = useAuth();

  // 格式化发布时间
  const formatPublicationDate = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
      return diffInMinutes <= 0 ? '刚刚发布' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  /**
   * 获取货源数据
   */
  const fetchLoads = useCallback(async () => {
    try {
      const result = await apiServices.landFreight.getLoads();
      return result.data || [];
    } catch (error) {
      apiLogger.error('获取货源信息失败', error);
      apiError('获取货源信息', error);
      return [];
    }
  }, [apiError]);

  /**
   * 组件初始化 - 加载货源数据
   */
  useEffect(() => {
    const loadData = async () => {
      await withLoading(async () => {
        try {
          setError(null);
          const loadData = await fetchLoads();
          setLoads(loadData);
        } catch (err) {
          setError('加载数据失败，请稍后重试');
          apiLogger.error('数据加载失败', err);
          showError('数据加载失败，请稍后重试');
        }
      });
    };

    loadData();
  }, [fetchLoads, showError, withLoading]);

  // 加载和错误状态渲染
  if (loading) {
    return (
      <div className="freight-board">
        <div className="container">
          <div className="loading-container">
            <Loader2 size={48} className="loading-spinner" />
            <p>正在加载货运信息...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="freight-board">
        <div className="container">
          <div className="error-container">
            <AlertCircle size={48} />
            <h3>加载失败</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>重新加载</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="platform-page freight-board">
      <div className="container">
        {/* Header */}
        <div className="platform-header">
          <div className="platform-icon">
            <Package size={48} />
          </div>
          <h1 className="platform-title">货源信息</h1>
          <p className="platform-description">
            查看所有已发布的货源信息，了解最新的运输需求
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="freight-content">
          {/* 货源信息列表 */}
          <div className="freight-list">
            {loads.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <h3>暂无货源信息</h3>
                <p>还没有货源信息</p>
              </div>
            ) : (
              loads.map(load => (
                <div key={load.id} className={`simple-card load-card ${load.serviceType?.toLowerCase()}`}>
                  <div className="card-main">
                    {/* 服务类型标识 */}
                    <div className="service-type">
                      <span className="ftl-badge">
                        <Package size={16} />
                        整车 FTL
                      </span>
                    </div>
                    
                    {/* 运输路线 */}
                    <div className="route">
                      <span className="origin">{load.originDisplay || load.origin}</span>
                      <ArrowRight size={16} />
                      <span className="destination">{load.destinationDisplay || load.destination}</span>
                    </div>

                    {/* 货物重量 */}
                    <div className="weight">
                      <Scale size={14} />
                      {load.weight} lbs
                    </div>
                    
                    {/* 取货日期 */}
                    <div className="date">
                      <Calendar size={14} />
                      <span className="date-text">
                        {load.pickupDate ? 
                          load.pickupDate.split('T')[0].slice(5).replace('-', '/') 
                          : '未知日期'} 取货
                      </span>
                    </div>
                    
                    {/* 发布时间 */}
                    <div className="publication-date">
                      <Clock size={14} />
                      <span className="publication-text">
                        {load.publicationDate
                          ? formatPublicationDate(load.publicationDate)
                          : (load.postedTime || '未知时间')}
                      </span>
                    </div>

                    {/* 详情按钮 */}
                    <button 
                      className="details-btn" 
                      onClick={() => {
                        showError('详情功能即将推出');
                      }}
                    >
                      <Info size={14} />
                      详情
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreightBoard;
