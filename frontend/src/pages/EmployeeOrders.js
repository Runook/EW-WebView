import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi, employeeUtils } from '../config/employeeApi';
import './EmployeeOrders.css';

const EmployeeOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // 过滤条件
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    order_type: searchParams.get('order_type') || '',
    priority: searchParams.get('priority') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrders(filters);

      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('加载订单失败:', err);
      setError(err.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // 更新URL参数
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k]) params.set(k, newFilters[k]);
    });
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleViewOrder = (orderId) => {
    navigate(`/employee/orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/employee/orders/create');
  };

  return (
    <div className="employee-orders-container">
      <div className="orders-header">
        <div className="header-left">
          <h1>订单管理</h1>
          <p>管理和跟踪所有订单</p>
        </div>
        <button className="btn-create" onClick={handleCreateOrder}>
          <span>➕</span>
          创建订单
        </button>
      </div>

      {/* 过滤器 */}
      <div className="orders-filters">
        <div className="filter-group">
          <label>搜索</label>
          <input
            type="text"
            placeholder="订单号、客户名称..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>状态</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="pending">待处理</option>
            <option value="confirmed">已确认</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div className="filter-group">
          <label>订单类型</label>
          <select
            value={filters.order_type}
            onChange={(e) => handleFilterChange('order_type', e.target.value)}
            className="filter-select"
          >
            <option value="">全部</option>
            <option value="land_freight">陆运</option>
            <option value="sea_freight">海运</option>
            <option value="air_freight">空运</option>
            <option value="warehouse">仓储</option>
            <option value="customs">报关</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div className="filter-group">
          <label>优先级</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="">全部</option>
            <option value="low">低</option>
            <option value="normal">正常</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>

        <button 
          className="btn-reset"
          onClick={() => {
            setFilters({
              status: '',
              order_type: '',
              priority: '',
              search: '',
              page: 1
            });
            setSearchParams({});
          }}
        >
          重置
        </button>
      </div>

      {/* 订单列表 */}
      {loading ? (
        <div className="loading-container">
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div>
          <div className="loading-bar"></div>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadOrders} className="btn-retry">重试</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon">📦</div>
          <h3>暂无订单</h3>
          <p>没有找到符合条件的订单</p>
          <button className="btn-create" onClick={handleCreateOrder}>
            创建第一个订单
          </button>
        </div>
      ) : (
        <>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>优先级</th>
                  <th>金额</th>
                  <th>负责人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} onClick={() => handleViewOrder(order.id)}>
                    <td className="order-number">{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{employeeUtils.getOrderTypeLabel(order.order_type)}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {employeeUtils.getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${order.priority}`}>
                        {employeeUtils.getPriorityLabel(order.priority)}
                      </span>
                    </td>
                    <td className="order-amount">
                      {employeeUtils.formatCurrency(order.final_price || order.quoted_price)}
                    </td>
                    <td>{order.assignee_info?.name || '-'}</td>
                    <td>{employeeUtils.formatDate(order.created_at)}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="pagination-btn"
              >
                上一页
              </button>
              
              <span className="pagination-info">
                第 {pagination.page} 页 / 共 {pagination.totalPages} 页
                （总计 {pagination.total} 条）
              </span>
              
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="pagination-btn"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeOrders;

