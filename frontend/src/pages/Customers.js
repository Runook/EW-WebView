import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import employeeApiExports from '../config/employeeApi';
import './Customers.css';

const { customerApi, employeeUtils } = employeeApiExports;

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // 基本信息
    company_name: '',
    wechat_group_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    // 账单信息 (新增)
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_zipcode: '',
    billing_country: 'USA',
    payment_terms: 'Net 7',
    tax_id: '',
    is_active: true
  });

  useEffect(() => {
    loadCustomers();
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomers(searchTerm);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('加载客户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({
      company_name: '',
      wechat_group_name: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      notes: '',
      billing_address: '',
      billing_city: '',
      billing_state: '',
      billing_zipcode: '',
      billing_country: 'USA',
      payment_terms: 'Net 7',
      tax_id: '',
      is_active: true
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      company_name: customer.company_name || '',
      wechat_group_name: customer.wechat_group_name || '',
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      contact_email: customer.contact_email || '',
      notes: customer.notes || '',
      billing_address: customer.billing_address || '',
      billing_city: customer.billing_city || '',
      billing_state: customer.billing_state || '',
      billing_zipcode: customer.billing_zipcode || '',
      billing_country: customer.billing_country || 'USA',
      payment_terms: customer.payment_terms || 'Net 7',
      tax_id: customer.tax_id || '',
      is_active: customer.is_active !== false
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData);
        alert('客户更新成功！');
      } else {
        await customerApi.createCustomer(formData);
        alert('客户创建成功！');
      }
      
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除此客户吗？')) {
      try {
        await customerApi.deleteCustomer(id);
        alert('客户删除成功！');
        loadCustomers();
      } catch (error) {
        alert('删除失败: ' + error.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 美国各州列表
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="customers-container">
      <div className="customers-header">
        <div className="header-left">
          <h1>👥 客户管理</h1>
          <p>管理客户信息和账单地址</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="搜索公司名称或微信群..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-create" onClick={handleCreate}>
            + 新建客户
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <p>暂无客户信息</p>
          <button className="btn-create" onClick={handleCreate}>
            创建第一个客户
          </button>
        </div>
      ) : (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>询价公司</th>
                <th>微信群名称</th>
                <th>联系人</th>
                <th>联系方式</th>
                <th>所在地</th>
                <th>付款条款</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className={!customer.is_active ? 'inactive' : ''}>
                  <td className="company-name">{customer.company_name}</td>
                  <td>{customer.wechat_group_name || '-'}</td>
                  <td>{customer.contact_person || '-'}</td>
                  <td>
                    <div className="contact-info">
                      {customer.contact_phone && <span>{customer.contact_phone}</span>}
                      {customer.contact_email && <span className="email">{customer.contact_email}</span>}
                      {!customer.contact_phone && !customer.contact_email && '-'}
                    </div>
                  </td>
                  <td>
                    {customer.billing_city && customer.billing_state 
                      ? `${customer.billing_city}, ${customer.billing_state}`
                      : '-'}
                  </td>
                  <td>
                    <span className="terms-badge">
                      {customer.payment_terms || 'Net 7'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${customer.is_active !== false ? 'active' : 'inactive'}`}>
                      {customer.is_active !== false ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(customer)}>
                        编辑
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(customer.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建/编辑客户模态框 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content customer-modal">
            <div className="modal-header">
              <h2>{editingCustomer ? '编辑客户' : '新建客户'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                基本信息
              </button>
              <button 
                className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                账单信息
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 基本信息 */}
              {activeTab === 'basic' && (
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>询价公司 *</label>
                      <input
                        type="text"
                        name="company_name"
                        required
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="输入公司名称"
                      />
                    </div>
                    <div className="form-group">
                      <label>微信群名称</label>
                      <input
                        type="text"
                        name="wechat_group_name"
                        value={formData.wechat_group_name}
                        onChange={handleInputChange}
                        placeholder="输入微信群名称"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>联系人</label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        placeholder="输入联系人姓名"
                      />
                    </div>
                    <div className="form-group">
                      <label>联系电话</label>
                      <input
                        type="text"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="输入联系电话"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>联系邮箱</label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="输入联系邮箱"
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                        />
                        启用此客户
                      </label>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>备注</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="输入备注信息"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* 账单信息 */}
              {activeTab === 'billing' && (
                <div className="modal-body">
                  <div className="form-group full-width">
                    <label>账单地址</label>
                    <input
                      type="text"
                      name="billing_address"
                      value={formData.billing_address}
                      onChange={handleInputChange}
                      placeholder="街道地址"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>城市</label>
                      <input
                        type="text"
                        name="billing_city"
                        value={formData.billing_city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>州</label>
                      <select
                        name="billing_state"
                        value={formData.billing_state}
                        onChange={handleInputChange}
                      >
                        <option value="">选择州</option>
                        {usStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>邮编</label>
                      <input
                        type="text"
                        name="billing_zipcode"
                        value={formData.billing_zipcode}
                        onChange={handleInputChange}
                        placeholder="12345"
                      />
                    </div>
                    <div className="form-group">
                      <label>国家</label>
                      <input
                        type="text"
                        name="billing_country"
                        value={formData.billing_country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>付款条款</label>
                      <select
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleInputChange}
                      >
                        <option value="Due on Receipt">Due on Receipt (收到即付)</option>
                        <option value="Net 7">Net 7 (7天内付款)</option>
                        <option value="Net 15">Net 15 (15天内付款)</option>
                        <option value="Net 30">Net 30 (30天内付款)</option>
                        <option value="Net 45">Net 45 (45天内付款)</option>
                        <option value="Net 60">Net 60 (60天内付款)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>税号 (Tax ID)</label>
                      <input
                        type="text"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleInputChange}
                        placeholder="可选"
                      />
                    </div>
                  </div>

                  <div className="info-note">
                    💡 账单信息将用于生成发票，连接 QuickBooks Online 后会自动同步。
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingCustomer ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
