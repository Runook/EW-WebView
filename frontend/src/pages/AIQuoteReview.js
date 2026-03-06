import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../config/employeeApi';
import {
  Bot, FileText, CheckCircle, XCircle, Send, RefreshCw, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Package, MapPin, DollarSign,
  Truck, Eye, ArrowLeft
} from 'lucide-react';
import './AIQuoteReview.css';

const STATUS_CONFIG = {
  pending_review: { label: '待审核', color: '#f39c12', icon: Clock },
  approved: { label: '已批准', color: '#27ae60', icon: CheckCircle },
  rejected: { label: '已拒绝', color: '#e74c3c', icon: XCircle },
  distributed: { label: '已分发', color: '#3498db', icon: Send },
};

const AIQuoteReview = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const res = await agentApi.getReviews(filters);
      setTasks(res.data || []);
    } catch (err) {
      setError(err.message || '加载审核任务失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    agentApi.getStatus().then(res => setSystemStatus(res.data)).catch(() => {});
  }, []);

  const loadTaskDetail = async (taskId) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
      setTaskDetail(null);
      return;
    }
    setExpandedTask(taskId);
    setDetailLoading(true);
    try {
      const res = await agentApi.getReviewById(taskId);
      setTaskDetail(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (taskId) => {
    setActionLoading(taskId);
    try {
      await agentApi.approveReview(taskId, { enrichWithDAT: true });
      await fetchTasks();
      if (expandedTask === taskId) {
        const res = await agentApi.getReviewById(taskId);
        setTaskDetail(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (taskId) => {
    setActionLoading(taskId);
    try {
      await agentApi.rejectReview(taskId, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDistribute = async (taskId) => {
    setActionLoading(taskId);
    try {
      await agentApi.distributeQuote(taskId);
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnrichDAT = async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return;
    setActionLoading('enrich');
    try {
      await agentApi.enrichQuotes(orderIds);
      if (expandedTask) {
        const res = await agentApi.getReviewById(expandedTask);
        setTaskDetail(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="ai-review-container">
      <div className="ai-review-sidebar">
        <div className="sidebar-header">
          <h2><Bot size={20} /> AI 报价审核</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/employee/broker-orders')}>
            <ArrowLeft size={16} /> 返回订单
          </button>
          <button
            className={`nav-item ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            全部任务
          </button>
          <button
            className={`nav-item ${statusFilter === 'pending_review' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending_review')}
          >
            <Clock size={14} /> 待审核
          </button>
          <button
            className={`nav-item ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            <CheckCircle size={14} /> 已批准
          </button>
          <button
            className={`nav-item ${statusFilter === 'distributed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('distributed')}
          >
            <Send size={14} /> 已分发
          </button>
          <button
            className={`nav-item ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <XCircle size={14} /> 已拒绝
          </button>
        </nav>

        {systemStatus && (
          <div className="system-status-panel">
            <h3>系统状态</h3>
            <div className="status-item">
              <span>WeCom</span>
              <span className={`status-dot ${systemStatus.wecom?.configured ? 'active' : 'inactive'}`} />
            </div>
            <div className="status-item">
              <span>DAT API</span>
              <span className={`status-dot ${systemStatus.dat?.configured ? 'active' : 'inactive'}`} />
            </div>
            <div className="status-item">
              <span>OpenClaw</span>
              <span className={`status-dot ${systemStatus.openclaw?.configured ? 'active' : 'inactive'}`} />
            </div>
          </div>
        )}
      </div>

      <div className="ai-review-main">
        <div className="ai-review-header">
          <div className="header-left">
            <h1>AI 报价审核</h1>
            <span className="task-count">{tasks.length} 个任务</span>
          </div>
          <button className="btn-refresh" onClick={fetchTasks} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> 刷新
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <AlertTriangle size={16} /> {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>暂无审核任务</p>
            <span>当 AI Agent 解析客户文件后，审核任务会出现在这里</span>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(task => {
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending_review;
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedTask === task.id;
              const parsedData = (() => {
                try { return JSON.parse(task.parsed_data || '[]'); } catch { return []; }
              })();
              const orderIds = (() => {
                try { return JSON.parse(task.order_ids || '[]'); } catch { return []; }
              })();

              return (
                <div key={task.id} className={`task-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="task-card-header" onClick={() => loadTaskDetail(task.id)}>
                    <div className="task-info">
                      <span className="task-status-badge" style={{ background: statusCfg.color }}>
                        <StatusIcon size={12} /> {statusCfg.label}
                      </span>
                      <span className="task-filename">
                        <FileText size={14} /> {task.source_filename || 'Unknown file'}
                      </span>
                      <span className="task-meta">
                        {parsedData.length} 条货物 | {orderIds.length} 个订单
                      </span>
                      <span className="task-date">{formatDate(task.created_at)}</span>
                    </div>
                    <div className="task-actions-inline">
                      {task.status === 'pending_review' && (
                        <>
                          <button
                            className="btn-approve"
                            onClick={(e) => { e.stopPropagation(); handleApprove(task.id); }}
                            disabled={actionLoading === task.id}
                          >
                            <CheckCircle size={14} /> 批准
                          </button>
                          <button
                            className="btn-reject"
                            onClick={(e) => { e.stopPropagation(); setShowRejectModal(task.id); }}
                            disabled={actionLoading === task.id}
                          >
                            <XCircle size={14} /> 拒绝
                          </button>
                        </>
                      )}
                      {task.status === 'approved' && (
                        <button
                          className="btn-distribute"
                          onClick={(e) => { e.stopPropagation(); handleDistribute(task.id); }}
                          disabled={actionLoading === task.id}
                        >
                          <Send size={14} /> 分发报价
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="task-card-detail">
                      {detailLoading ? (
                        <div className="loading-state">加载详情...</div>
                      ) : taskDetail ? (
                        <>
                          <div className="detail-toolbar">
                            <button
                              className="btn-secondary"
                              onClick={() => handleEnrichDAT(taskDetail.order_ids)}
                              disabled={actionLoading === 'enrich'}
                            >
                              <DollarSign size={14} /> 获取 DAT 报价
                            </button>
                          </div>

                          <div className="parsed-items-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>单号</th>
                                  <th>品名</th>
                                  <th>目的地</th>
                                  <th>重量(lbs)</th>
                                  <th>件数</th>
                                  <th>地址类型</th>
                                  <th>DAT</th>
                                  <th>EW报价</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(taskDetail.orders || []).map((order, idx) => (
                                  <tr key={order.id || idx}>
                                    <td className="td-tracking">
                                      <span className="tracking-number">{order.ew_quote_number || order.order_number}</span>
                                    </td>
                                    <td>
                                      <div className="cargo-name">
                                        <Package size={12} />
                                        {order.cargo_description}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="destination-info">
                                        <MapPin size={12} />
                                        {order.destination_city}{order.destination_zipcode ? `, ${order.destination_zipcode}` : ''}
                                      </div>
                                    </td>
                                    <td>{order.total_weight_lbs || '-'}</td>
                                    <td>{order.actual_pallets || '-'}</td>
                                    <td>
                                      <span className={`address-badge ${order.address_type === 'Residential' ? 'residential' : 'commercial'}`}>
                                        {order.address_type === 'Residential' ? '住宅' : '商业'}
                                      </span>
                                    </td>
                                    <td className="td-price">
                                      {order.total_dat ? `$${order.total_dat}` : (
                                        <span className="no-data">-</span>
                                      )}
                                    </td>
                                    <td className="td-price">
                                      {order.ew_quote_price ? `$${order.ew_quote_price}` : (
                                        <span className="no-data">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {taskDetail.parsed_data && taskDetail.parsed_data.length > 0 && (
                            <details className="raw-data-section">
                              <summary><Eye size={14} /> 查看原始解析数据</summary>
                              <pre>{JSON.stringify(taskDetail.parsed_data, null, 2)}</pre>
                            </details>
                          )}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>拒绝审核</h3>
            <p>请输入拒绝原因（可选）：</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="例如：数据解析不准确，需要人工重新核实..."
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRejectModal(null)}>取消</button>
              <button
                className="btn-reject"
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuoteReview;
