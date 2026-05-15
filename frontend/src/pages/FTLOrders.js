import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, datLoadBoardApi } from '../config/employeeApi';
import EditableCell from '../components/EditableCell';
import CompanyEditableCell from '../components/CompanyEditableCell';
import './BrokerOrdersNew.css';
import './FTLOrders.css';

const PAGE_SIZE = 50;

const EQUIPMENT_COMMON = [
  { code: 'V', name: 'Van' },
  { code: 'R', name: 'Reefer' },
  { code: 'F', name: 'Flatbed' },
  { code: 'VR', name: 'Van/Reefer' },
  { code: 'SD', name: 'Step Deck' },
  { code: 'FT', name: 'Flatbed w/Tarps' },
  { code: 'DD', name: 'Double Drop' },
  { code: 'LB', name: 'Lowboy' },
  { code: 'RG', name: 'Removable Gooseneck' },
  { code: 'AC', name: 'Auto Carrier' },
  { code: 'C', name: 'Container' },
  { code: 'PO', name: 'Power Only' },
  { code: 'HB', name: 'Hopper Bottom' },
  { code: 'TA', name: 'Tanker' },
  { code: 'SV', name: 'Sprinter Van' },
  { code: 'SB', name: 'Straight Box Truck' },
];

const STATUS_TABS = [
  { id: 'quote', label: '报价单' },
  { id: 'ordered', label: '已下单' },
  { id: 'completed', label: '已完成' },
  { id: 'cancelled', label: '已取消' },
  { id: 'claim', label: '需索赔' },
];

const formatCurrency = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return '-';
  return `$${n.toFixed(2)}`;
};

const formatNumber = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString();
};

const getSubStatusBadge = (sub) => {
  if (!sub) return '-';
  const map = {
    waiting_driver: { label: '寻找司机', color: '#e74c3c' },
    driver_found: { label: '找到司机', color: '#8e44ad' },
    sent_to_3pl: { label: '已给3PL', color: '#f39c12' },
    in_transit: { label: '运输中', color: '#27ae60' },
  };
  const m = map[sub];
  if (!m) return sub;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: m.color, color: 'white', fontSize: '0.8em' }}>
      {m.label}
    </span>
  );
};

const getNYDate = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

const FTLOrders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const currentStatus = searchParams.get('status') || 'quote';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ waiting_driver: 0, driver_found: 0, in_transit: 0 });
  const [postingToDAT, setPostingToDAT] = useState({});

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employee: searchParams.get('employee') || 'all',
  });

  const loadOrders = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      if (!append) {
        setPage(1);
        setHasMore(true);
      }
      const response = await orderApi.getOrders({
        status: currentStatus,
        freight_mode: 'FTL',
        ...filters,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (response.success) {
        const incoming = response.data || [];
        setOrders((prev) => (append ? [...prev, ...incoming] : incoming));
        const pg = response.pagination;
        if (pg) setHasMore(pg.page < pg.totalPages);
        else setHasMore(incoming.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('加载 FTL 订单失败:', error);
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [currentStatus, filters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await orderApi.getStatistics({
        status: 'ordered',
        freight_mode: 'FTL',
      });
      if (response.success) {
        setStats({
          waiting_driver: response.data.waitingDriverCount || 0,
          driver_found: response.data.driverFoundCount || 0,
          in_transit: response.data.inTransitCount || 0,
        });
      }
    } catch (error) {
      console.error('加载 FTL 统计失败:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders(1, false);
    if (currentStatus === 'ordered') loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus, filters]);

  const handleTableScroll = (e) => {
    if (loadingMore || !hasMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      const next = page + 1;
      setPage(next);
      loadOrders(next, true);
    }
  };

  const handleStatusChange = (s) => {
    navigate(`/employee/ftl-orders?status=${s}`);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      const response = await orderApi.createOrder({
        customer_name: '新建 FTL 订单',
        inquiry_company: '新建 FTL 订单',
        cargo_description: '待填写',
        cargo_description_detailed: '待填写',
        order_type: 'land_freight',
        freight_mode: 'FTL',
        equipment_type: 'V',
        truck_length_ft: 53,
        status: 'quote',
        quote_date: getNYDate(),
      });
      if (response.success) {
        navigate(`/employee/ftl-orders/${response.data.id}`);
      }
    } catch (error) {
      console.error('创建 FTL 订单失败:', error);
      alert(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCellUpdate = async (orderId, field, newValue) => {
    try {
      const response = await orderApi.updateOrder(orderId, { [field]: newValue });
      if (response.success) {
        const updated = response.data || { [field]: newValue };
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
      }
    } catch (error) {
      console.error('更新失败:', error);
      throw error;
    }
  };

  const handlePostToDAT = async (orderId) => {
    if (!window.confirm('确定将此订单 Post 到 DAT Load Board?')) return;
    setPostingToDAT((p) => ({ ...p, [orderId]: true }));
    try {
      const res = await datLoadBoardApi.postFromOrder(orderId);
      if (res.success) {
        alert(`已 Post 到 DAT，Post ID: ${res.data.datPostId}`);
      }
    } catch (err) {
      console.error('Post to DAT 失败:', err);
      alert(`Post 失败: ${err.message}`);
    } finally {
      setPostingToDAT((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`确定要删除 ${order.order_number} 吗？`)) return;
    try {
      await orderApi.deleteOrder(order.id);
      loadOrders(1, false);
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('确定将此订单标记为"已下单"？')) return;
    try {
      const response = await orderApi.confirmOrder(orderId, 'waiting_driver');
      if (response.success) {
        navigate('/employee/ftl-orders?status=ordered');
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  const handleUpdateSubStatus = async (orderId, newSub) => {
    try {
      if (newSub === 'completed') {
        const r = await orderApi.completeOrder(orderId);
        if (r.success) loadOrders(1, false);
      } else if (newSub === 'cancel') {
        const r = await orderApi.cancelOrder(orderId);
        if (r.success) loadOrders(1, false);
      } else {
        const r = await orderApi.updateSubStatus(orderId, newSub);
        if (r.success) loadOrders(1, false);
      }
    } catch (err) {
      alert('更新失败: ' + err.message);
    }
  };

  return (
    <div className="broker-orders-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>FTL 整车订单</h2>
        </div>

        {/* Mode toggle at the very top */}
        <div className="ftl-mode-toggle">
          <button
            className="mode-btn"
            onClick={() => navigate('/employee/broker-orders')}
            title="切换到 LTL 散板订单"
          >
            🚛 LTL 散板
          </button>
          <button className="mode-btn active" title="当前页">
            🚚 FTL 整车
          </button>
        </div>

        <nav className="sidebar-nav">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${currentStatus === t.id ? 'active' : ''}`}
              onClick={() => handleStatusChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="nav-divider"></div>

        <button className="nav-item" onClick={() => navigate('/employee/customers')}>Customers</button>
        <button className="nav-item" onClick={() => navigate('/employee/vendors')}>Vendors</button>
        <button className="nav-item" onClick={() => navigate('/employee/payments')}>付款管理</button>
        <button className="nav-item" onClick={() => navigate('/employee/dat-loadboard')}>DAT Load Board</button>
        <button className="nav-item" onClick={() => navigate('/employee/driver-contacts')}>司机联系簿</button>

        {currentStatus === 'ordered' && (
          <div className="sub-status-stats">
            <h3>FTL 订单状态</h3>
            <div className="stat-item waiting-driver">
              <span>寻找司机</span>
              <strong>{stats.waiting_driver}</strong>
            </div>
            <div className="stat-item driver-found">
              <span>找到司机</span>
              <strong>{stats.driver_found}</strong>
            </div>
            <div className="stat-item in-transit">
              <span>运输中</span>
              <strong>{stats.in_transit}</strong>
            </div>
          </div>
        )}

        {['admin', 'accountant'].includes(user?.employeeRole) && (
          <div className="sidebar-footer">
            {user?.employeeRole === 'admin' && (
              <button className="nav-item nav-admin" onClick={() => navigate('/employee/admin')}>
                ⚙️ 系统管理
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="搜索订单号、公司..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className="filter-select"
            value={filters.employee}
            onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
          >
            <option value="all">所有 FTL 订单</option>
            <option value="mine">我的 FTL 订单</option>
          </select>

          <button className="btn-create" onClick={handleCreateOrder} disabled={loading}>
            {loading ? '创建中...' : '+ 新建 FTL 订单'}
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>暂无 FTL 订单</p>
            <button className="btn-create" onClick={handleCreateOrder}>
              创建第一个 FTL 订单
            </button>
          </div>
        ) : (
          <div className="table-wrapper" onScroll={handleTableScroll}>
            <table className="orders-table ftl-orders-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>Company</th>
                  <th>WE单号</th>
                  <th>设备</th>
                  <th className="text-right">车长</th>
                  <th>发货地</th>
                  <th>收货地</th>
                  <th className="text-right">总重(lbs)</th>
                  <th className="text-right">距离(mi)</th>
                  <th className="text-right">RPM</th>
                  <th className="text-right">线运费</th>
                  <th className="text-right">油附加</th>
                  <th className="text-right">客户总价</th>
                  <th className="text-right">司机付款</th>
                  <th className="text-right">利润</th>
                  {currentStatus === 'ordered' && <th>状态</th>}
                  {currentStatus === 'ordered' && <th>卡车</th>}
                  <th>操作员</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const customerTotal =
                    (parseFloat(order.line_haul_rate) || 0) +
                    (parseFloat(order.fuel_surcharge) || 0) +
                    (parseFloat(order.customer_accessorials) || 0) +
                    (parseFloat(order.customer_extra_fee) || 0);
                  const driverTotal =
                    (parseFloat(order.carrier_line_haul) || 0) +
                    (parseFloat(order.carrier_fuel_surcharge) || 0) +
                    (parseFloat(order.carrier_accessorials) || 0) +
                    (parseFloat(order.driver_extra_fee) || 0);

                  return (
                    <tr
                      key={order.id}
                      className={`order-row ${order.sub_status ? `sub-status-${order.sub_status}` : ''}`}
                      onClick={() => navigate(`/employee/ftl-orders/${order.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.quote_date}
                          orderId={order.id}
                          field="quote_date"
                          type="date"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => {
                            if (!v) return '-';
                            const d = new Date(v);
                            return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
                          }}
                        />
                      </td>
                      <td className="td-company" onClick={(e) => e.stopPropagation()}>
                        <CompanyEditableCell
                          value={order.inquiry_company || order.customer_name}
                          orderId={order.id}
                          onSave={handleCellUpdate}
                        />
                      </td>
                      <td className="order-number we-number">
                        <span className="we-number-display">{order.order_number || '-'}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="ftl-equipment-select"
                          value={order.equipment_type || 'V'}
                          onChange={(e) => handleCellUpdate(order.id, 'equipment_type', e.target.value)}
                        >
                          {EQUIPMENT_COMMON.map((eq) => (
                            <option key={eq.code} value={eq.code}>
                              {eq.code} — {eq.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.truck_length_ft}
                          orderId={order.id}
                          field="truck_length_ft"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => (v ? `${v} ft` : '-')}
                        />
                      </td>
                      <td>
                        {order.origin_city || ''}
                        {order.origin_state ? `, ${order.origin_state}` : ''}
                      </td>
                      <td>
                        {order.destination_city || ''}
                        {order.destination_state ? `, ${order.destination_state}` : ''}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.total_weight_lbs}
                          orderId={order.id}
                          field="total_weight_lbs"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => formatNumber(v)}
                        />
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.transport_distance}
                          orderId={order.id}
                          field="transport_distance"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => (v ? `${formatNumber(v)} mi` : '-')}
                        />
                      </td>
                      <td className="text-right" style={{ fontWeight: 600, color: '#2c7be5' }}>
                        {order.rate_per_mile ? `$${parseFloat(order.rate_per_mile).toFixed(2)}` : '-'}
                      </td>
                      <td className="text-right price" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.line_haul_rate}
                          orderId={order.id}
                          field="line_haul_rate"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => formatCurrency(v)}
                        />
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={order.fuel_surcharge}
                          orderId={order.id}
                          field="fuel_surcharge"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => formatCurrency(v)}
                        />
                      </td>
                      <td className="text-right price" style={{ color: '#16a34a' }}>
                        {customerTotal > 0 ? `$${customerTotal.toFixed(2)}` : '-'}
                      </td>
                      <td className="text-right" style={{ color: '#dc2626' }}>
                        {driverTotal > 0 ? `$${driverTotal.toFixed(2)}` : '-'}
                      </td>
                      <td className="text-right" style={{ fontWeight: 600 }}>
                        {formatCurrency(order.profit)}
                      </td>
                      {currentStatus === 'ordered' && <td>{getSubStatusBadge(order.sub_status)}</td>}
                      {currentStatus === 'ordered' && (
                        <td>
                          {order.truck_company_name ? (
                            <div className="truck-info-mini">
                              {order.truck_company_name}
                              {order.mc_number && <div className="mc-num">MC# {order.mc_number}</div>}
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td>
                        {currentStatus === 'quote' && (order.creator_info?.name || '-')}
                        {currentStatus === 'ordered' && (order.confirmer_info?.name || order.assignee_info?.name || '-')}
                        {currentStatus === 'completed' && (order.completer_info?.name || '-')}
                        {currentStatus === 'cancelled' && (order.canceller_info?.name || '-')}
                        {currentStatus === 'claim' && (order.assignee_info?.name || order.creator_info?.name || '-')}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="ftl-row-actions">
                          <button
                            className="btn-row btn-row-dat"
                            onClick={() => handlePostToDAT(order.id)}
                            disabled={postingToDAT[order.id]}
                            title="Post to DAT Load Board"
                          >
                            {postingToDAT[order.id] ? '...' : '📤 DAT'}
                          </button>
                          {order.status === 'quote' && (
                            <>
                              <button
                                className="btn-row btn-row-confirm"
                                onClick={() => handleConfirmOrder(order.id)}
                                title="确认下单"
                              >
                                下单
                              </button>
                              <button
                                className="btn-row btn-row-delete"
                                onClick={() => handleDeleteOrder(order)}
                                title="删除订单"
                              >
                                删除
                              </button>
                            </>
                          )}
                          {order.status === 'ordered' && (
                            <select
                              className="sub-status-select"
                              value={order.sub_status || 'waiting_driver'}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateSubStatus(order.id, e.target.value)}
                            >
                              <option value="waiting_driver">寻找司机</option>
                              <option value="driver_found">找到司机</option>
                              <option value="sent_to_3pl">给3PL</option>
                              <option value="in_transit">运输中</option>
                              <option value="completed">已完成</option>
                              <option value="cancel">取消订单</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {loadingMore && (
                  <tr>
                    <td colSpan="100%" style={{ textAlign: 'center', padding: 16, color: '#888' }}>
                      加载更多...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FTLOrders;
