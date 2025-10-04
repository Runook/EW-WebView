import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../config/employeeApi';
import './BrokerOrders.css';

const BrokerOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waiting_driver: 0,
    driver_found: 0,
    in_transit: 0
  });
  
  // 当前选中的主状态
  const currentStatus = searchParams.get('status') || 'quote';
  
  // 过滤条件
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employee: searchParams.get('employee') || 'all', // 'all' 或 'mine'
    sub_status: searchParams.get('sub_status') || ''
  });

  useEffect(() => {
    loadOrders();
    if (currentStatus === 'ordered') {
      loadStats();
    }
  }, [currentStatus, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const params = {
        status: currentStatus,
        search: filters.search,
        ...filters
      };
      
      console.log('📋 [BrokerOrders] 加载订单，参数:', params);
      
      const response = await orderApi.getOrders(params);
      
      console.log('📥 [BrokerOrders] 响应:', response);
      
      if (response.success) {
        console.log('✅ [BrokerOrders] 获取订单数:', response.data?.length || 0);
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('❌ [BrokerOrders] 加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderApi.getStatistics({ status: 'ordered' });
      if (response.success) {
        setStats({
          waiting_driver: response.data.waitingDriverCount || 0,
          driver_found: response.data.driverFoundCount || 0,
          in_transit: response.data.inTransitCount || 0
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleStatusChange = (status) => {
    navigate(`/employee/broker-orders?status=${status}`);
  };

  const handleCreateOrder = () => {
    navigate('/employee/broker-orders/new');
  };

  const handleEditOrder = (orderId) => {
    navigate(`/employee/broker-orders/${orderId}`);
  };

  const getSubStatusLabel = (subStatus) => {
    const labels = {
      waiting_driver: '等待司机',
      driver_found: '找到司机',
      in_transit: '运输中'
    };
    return labels[subStatus] || '';
  };

  const getSubStatusClass = (subStatus) => {
    return `sub-status-${subStatus}`;
  };

  return (
    <div className="broker-orders-container">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>订单管理</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentStatus === 'quote' ? 'active' : ''}`}
            onClick={() => handleStatusChange('quote')}
          >
            <span className="nav-label">报价单</span>
          </button>
          
          <button
            className={`nav-item ${currentStatus === 'ordered' ? 'active' : ''}`}
            onClick={() => handleStatusChange('ordered')}
          >
            <span className="nav-label">已下单</span>
          </button>
          
          <button
            className={`nav-item ${currentStatus === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatusChange('completed')}
          >
            <span className="nav-label">已完成</span>
          </button>
        </nav>
        
        {/* 系统管理入口（仅管理员）*/}
        {user?.employeeRole === 'admin' && (
          <div className="sidebar-footer">
            <button
              className="nav-item nav-admin"
              onClick={() => navigate('/employee/admin')}
            >
              <span className="nav-label">⚙️ 系统管理</span>
            </button>
          </div>
        )}

        {/* 已下单的子状态统计 */}
        {currentStatus === 'ordered' && (
          <div className="sub-status-stats">
            <h3>订单状态</h3>
            <div className="stat-item waiting-driver">
              <span className="stat-label">等待司机</span>
              <span className="stat-value">{stats.waiting_driver}</span>
            </div>
            <div className="stat-item driver-found">
              <span className="stat-label">找到司机</span>
              <span className="stat-value">{stats.driver_found}</span>
            </div>
            <div className="stat-item in-transit">
              <span className="stat-label">运输中</span>
              <span className="stat-value">{stats.in_transit}</span>
            </div>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 顶部工具栏 */}
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              type="text"
              className="search-input"
              placeholder="搜索订单号、公司名称..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            
            <select
              className="filter-select"
              value={filters.employee}
              onChange={(e) => setFilters({...filters, employee: e.target.value})}
            >
              <option value="all">所有订单</option>
              <option value="mine">我的订单</option>
            </select>

            {currentStatus === 'ordered' && (
              <select
                className="filter-select"
                value={filters.sub_status}
                onChange={(e) => setFilters({...filters, sub_status: e.target.value})}
              >
                <option value="">所有状态</option>
                <option value="waiting_driver">等待司机</option>
                <option value="driver_found">找到司机</option>
                <option value="in_transit">运输中</option>
              </select>
            )}
          </div>
          
          <button className="btn-primary" onClick={handleCreateOrder}>
            + 新建订单
          </button>
        </div>

        {/* 订单列表表格 */}
        {loading ? (
          <div className="loading">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>暂无订单</p>
            <p className="debug-info">
              Debug: currentStatus={currentStatus}, orders.length={orders.length}
            </p>
            <button className="btn-primary" onClick={handleCreateOrder}>
              创建第一个订单
            </button>
            <button className="btn-secondary" onClick={loadOrders} style={{marginTop: '10px'}}>
              🔄 重新加载
            </button>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>报价日期</th>
                  <th>EW报价单号</th>
                  <th>询价公司</th>
                  <th>发货地 → 收货地</th>
                  <th>重量(lbs)</th>
                  <th>EW报价</th>
                  {currentStatus === 'ordered' && <th>状态</th>}
                  <th>操作员工</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr 
                    key={order.id}
                    className={order.sub_status ? getSubStatusClass(order.sub_status) : ''}
                    onClick={() => handleEditOrder(order.id)}
                  >
                    <td>{order.quote_date || '-'}</td>
                    <td className="order-number">{order.ew_quote_number || order.order_number}</td>
                    <td>{order.inquiry_company || order.customer_name}</td>
                    <td className="address-cell">
                      <div className="address-short">
                        {order.origin_city || '-'} → {order.destination_city || '-'}
                      </div>
                    </td>
                    <td>{order.total_weight_lbs ? `${order.total_weight_lbs.toLocaleString()}` : '-'}</td>
                    <td className="price-cell">
                      {order.ew_quote_price ? `$${order.ew_quote_price.toLocaleString()}` : '-'}
                    </td>
                    {currentStatus === 'ordered' && (
                      <td>
                        {order.sub_status && (
                          <span className={`status-badge ${getSubStatusClass(order.sub_status)}`}>
                            {getSubStatusLabel(order.sub_status)}
                          </span>
                        )}
                      </td>
                    )}
                    <td>{order.assignee_info?.name || order.creator_info?.name || '-'}</td>
                    <td>
                      <button
                        className="btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order.id);
                        }}
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerOrders;

