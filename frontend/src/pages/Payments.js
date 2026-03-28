import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentApi, orderApi, vendorApi, employeeUtils } from '../config/employeeApi';
import './Payments.css';

const Payments = () => {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  // 过滤条件
  const [filters, setFilters] = useState({
    payment_type: searchParams.get('type') || '',
    date_from: '',
    date_to: '',
    search: ''
  });

  // 表单数据
  const [formData, setFormData] = useState({
    payment_type: 'customer_payment',
    order_id: '',
    customer_id: '',
    vendor_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'check',
    reference_number: '',
    memo: ''
  });

  // 订单搜索
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 供应商搜索
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPayments();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setPayments(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error('加载付款记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await paymentApi.getStatistics(filters);
      setStatistics(response.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 搜索订单
  const searchOrders = async (term) => {
    if (!term || term.length < 2) {
      setOrderSuggestions([]);
      return;
    }
    try {
      const response = await orderApi.getOrders({ search: term, limit: 10 });
      setOrderSuggestions(response.data || []);
    } catch (error) {
      console.error('搜索订单失败:', error);
    }
  };

  // 搜索供应商
  const searchVendors = async (term) => {
    if (!term || term.length < 2) {
      setVendorSuggestions([]);
      return;
    }
    try {
      const response = await vendorApi.search(term);
      setVendorSuggestions(response.data || []);
    } catch (error) {
      console.error('搜索供应商失败:', error);
    }
  };

  const handleCreate = () => {
    setFormData({
      payment_type: 'customer_payment',
      order_id: '',
      customer_id: '',
      vendor_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'check',
      reference_number: '',
      memo: ''
    });
    setSelectedOrder(null);
    setSelectedVendor(null);
    setOrderSearchTerm('');
    setVendorSearchTerm('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentApi.create(formData);
      setShowModal(false);
      loadPayments();
      loadStatistics();
    } catch (error) {
      console.error('创建付款记录失败:', error);
      alert(error.message || '创建失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条付款记录吗？')) {
      try {
        await paymentApi.delete(id);
        loadPayments();
        loadStatistics();
      } catch (error) {
        console.error('删除付款记录失败:', error);
        alert(error.message || '删除失败');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setOrderSearchTerm(order.order_number);
    setFormData(prev => ({
      ...prev,
      order_id: order.id,
      amount: order.ew_final_price || order.final_price || ''
    }));
    setOrderSuggestions([]);
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setVendorSearchTerm(vendor.truck_company_name);
    setFormData(prev => ({
      ...prev,
      vendor_id: vendor.id,
      payment_method: vendor.payment_method || 'check'
    }));
    setVendorSuggestions([]);
  };

  return (
    <div className="payments-container">
      <div className="payments-header">
        <div className="header-left">
          <h1>💰 付款管理</h1>
          <p>跟踪客户付款和供应商付款</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          + 记录付款
        </button>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="stats-cards">
          <div className="stat-card received">
            <div className="stat-icon">📥</div>
            <div className="stat-info">
              <span className="stat-value">{employeeUtils.formatCurrency(statistics.totalReceived)}</span>
              <span className="stat-label">已收款 ({statistics.customerPaymentCount}笔)</span>
            </div>
          </div>
          <div className="stat-card paid">
            <div className="stat-icon">📤</div>
            <div className="stat-info">
              <span className="stat-value">{employeeUtils.formatCurrency(statistics.totalPaid)}</span>
              <span className="stat-label">已付款 ({statistics.vendorPaymentCount}笔)</span>
            </div>
          </div>
          <div className="stat-card net">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className={`stat-value ${statistics.netAmount >= 0 ? 'positive' : 'negative'}`}>
                {employeeUtils.formatCurrency(statistics.netAmount)}
              </span>
              <span className="stat-label">净额</span>
            </div>
          </div>
        </div>
      )}

      {/* 过滤器 */}
      <div className="payments-filters">
        <div className="filter-group">
          <select
            value={filters.payment_type}
            onChange={(e) => setFilters(prev => ({ ...prev, payment_type: e.target.value }))}
          >
            <option value="">全部类型</option>
            <option value="customer_payment">客户付款</option>
            <option value="vendor_payment">供应商付款</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            placeholder="开始日期"
          />
        </div>
        <div className="filter-group">
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            placeholder="结束日期"
          />
        </div>
        <div className="filter-group">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="搜索订单号、参考号..."
          />
        </div>
      </div>

      {/* 付款记录列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p>暂无付款记录</p>
          <button className="btn-create" onClick={handleCreate}>
            记录第一笔付款
          </button>
        </div>
      ) : (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>类型</th>
                <th>订单号</th>
                <th>客户/供应商</th>
                <th>金额</th>
                <th>方式</th>
                <th>参考号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{employeeUtils.formatDate(payment.payment_date)}</td>
                  <td>
                    <span className={`type-badge ${payment.payment_type}`}>
                      {payment.payment_type === 'customer_payment' ? '📥 收款' : '📤 付款'}
                    </span>
                  </td>
                  <td className="order-number">{payment.order_number || '-'}</td>
                  <td>
                    {payment.payment_type === 'customer_payment' 
                      ? (payment.customer_name || payment.order_customer_name || '-')
                      : (payment.vendor_name || '-')}
                  </td>
                  <td className={`amount ${payment.payment_type}`}>
                    {payment.payment_type === 'customer_payment' ? '+' : '-'}
                    {employeeUtils.formatCurrency(payment.amount)}
                  </td>
                  <td>{employeeUtils.getPaymentMethodLabel(payment.payment_method)}</td>
                  <td>{payment.reference_number || '-'}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(payment.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            上一页
          </button>
          <span>第 {pagination.page} 页 / 共 {pagination.totalPages} 页</span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            下一页
          </button>
        </div>
      )}

      {/* 创建付款模态框 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <h2>记录付款</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-group">
                  <label>付款类型 *</label>
                  <div className="radio-group">
                    <label className={`radio-option ${formData.payment_type === 'customer_payment' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment_type"
                        value="customer_payment"
                        checked={formData.payment_type === 'customer_payment'}
                        onChange={handleInputChange}
                      />
                      📥 客户付款 (收款)
                    </label>
                    <label className={`radio-option ${formData.payment_type === 'vendor_payment' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment_type"
                        value="vendor_payment"
                        checked={formData.payment_type === 'vendor_payment'}
                        onChange={handleInputChange}
                      />
                      📤 供应商付款 (付款)
                    </label>
                  </div>
                </div>

                {/* 订单搜索 */}
                <div className="form-group">
                  <label>关联订单</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={orderSearchTerm}
                      onChange={(e) => {
                        setOrderSearchTerm(e.target.value);
                        searchOrders(e.target.value);
                      }}
                      placeholder="搜索订单号..."
                    />
                    {orderSuggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {orderSuggestions.map(order => (
                          <li key={order.id} onClick={() => handleSelectOrder(order)}>
                            <span className="order-num">{order.order_number}</span>
                            <span className="order-customer">{order.inquiry_company || order.customer_name}</span>
                            <span className="order-amount">{employeeUtils.formatCurrency(order.ew_final_price)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedOrder && (
                    <div className="selected-info">
                      已选: {selectedOrder.order_number} - {selectedOrder.inquiry_company || selectedOrder.customer_name}
                    </div>
                  )}
                </div>

                {/* 供应商搜索（仅供应商付款时显示） */}
                {formData.payment_type === 'vendor_payment' && (
                  <div className="form-group">
                    <label>供应商</label>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={vendorSearchTerm}
                        onChange={(e) => {
                          setVendorSearchTerm(e.target.value);
                          searchVendors(e.target.value);
                        }}
                        placeholder="搜索供应商..."
                      />
                      {vendorSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                          {vendorSuggestions.map(vendor => (
                            <li key={vendor.id} onClick={() => handleSelectVendor(vendor)}>
                              <span className="vendor-mc">{vendor.mc_number}</span>
                              <span className="vendor-name">{vendor.truck_company_name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {selectedVendor && (
                      <div className="selected-info">
                        已选: {selectedVendor.mc_number} - {selectedVendor.truck_company_name}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>金额 *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>付款日期 *</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>付款方式 *</label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="check">支票 Check</option>
                      <option value="ach">ACH 转账</option>
                      <option value="zelle">Zelle</option>
                      <option value="wire">电汇 Wire</option>
                      <option value="credit_card">信用卡</option>
                      <option value="cash">现金</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>参考号 (支票号/交易号)</label>
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                      placeholder="例: CHK-12345"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>备注</label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-submit">
                  记录付款
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

