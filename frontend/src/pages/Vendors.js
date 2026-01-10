import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vendorApi, employeeUtils } from '../config/employeeApi';
import './Vendors.css';

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // basic, address, payment
  const [formData, setFormData] = useState({
    // 基本信息
    mc_number: '',
    truck_company_name: '',
    truck_contact: '',
    notes: '',
    // 地址信息
    company_address: '',
    company_city: '',
    company_state: '',
    company_zipcode: '',
    company_country: 'USA',
    // 付款信息
    payment_method: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
    zelle_info: '',
    check_payable_to: '',
    check_mailing_address: '',
    // 税务信息
    tax_id: '',
    w9_on_file: false,
    is_active: true
  });

  useEffect(() => {
    loadVendors();
  }, [searchTerm]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getAll({ search: searchTerm });
      setVendors(response.data || []);
    } catch (error) {
      console.error('加载供应商失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVendor(null);
    setFormData({
      mc_number: '',
      truck_company_name: '',
      truck_contact: '',
      notes: '',
      company_address: '',
      company_city: '',
      company_state: '',
      company_zipcode: '',
      company_country: 'USA',
      payment_method: '',
      bank_name: '',
      account_number: '',
      routing_number: '',
      zelle_info: '',
      check_payable_to: '',
      check_mailing_address: '',
      tax_id: '',
      w9_on_file: false,
      is_active: true
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      mc_number: vendor.mc_number || '',
      truck_company_name: vendor.truck_company_name || '',
      truck_contact: vendor.truck_contact || '',
      notes: vendor.notes || '',
      company_address: vendor.company_address || '',
      company_city: vendor.company_city || '',
      company_state: vendor.company_state || '',
      company_zipcode: vendor.company_zipcode || '',
      company_country: vendor.company_country || 'USA',
      payment_method: vendor.payment_method || '',
      bank_name: vendor.bank_name || '',
      account_number: vendor.account_number || '',
      routing_number: vendor.routing_number || '',
      zelle_info: vendor.zelle_info || '',
      check_payable_to: vendor.check_payable_to || '',
      check_mailing_address: vendor.check_mailing_address || '',
      tax_id: vendor.tax_id || '',
      w9_on_file: vendor.w9_on_file || false,
      is_active: vendor.is_active !== false
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorApi.update(editingVendor.id, formData);
      } else {
        await vendorApi.create(formData);
      }
      setShowModal(false);
      loadVendors();
    } catch (error) {
      console.error('保存供应商失败:', error);
      alert(error.message || '保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个供应商吗？')) {
      try {
        await vendorApi.delete(id);
        loadVendors();
      } catch (error) {
        console.error('删除供应商失败:', error);
        alert(error.message || '删除失败');
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
    <div className="vendors-container">
      <div className="vendors-header">
        <div className="header-left">
          <h1>🚚 供应商管理</h1>
          <p>管理卡车公司和司机付款信息</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          + 新建供应商
        </button>
      </div>

      <div className="vendors-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索 MC#、公司名、联络方式..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <p>暂无供应商信息</p>
          <button className="btn-create" onClick={handleCreate}>
            创建第一个供应商
          </button>
        </div>
      ) : (
        <div className="vendors-table-container">
          <table className="vendors-table">
            <thead>
              <tr>
                <th>MC Number</th>
                <th>公司名称</th>
                <th>联络方式</th>
                <th>所在地</th>
                <th>付款方式</th>
                <th>W9</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className={!vendor.is_active ? 'inactive' : ''}>
                  <td className="mc-number">{vendor.mc_number}</td>
                  <td>{vendor.truck_company_name}</td>
                  <td>{vendor.truck_contact}</td>
                  <td>
                    {vendor.company_city && vendor.company_state 
                      ? `${vendor.company_city}, ${vendor.company_state}`
                      : '-'}
                  </td>
                  <td>
                    {vendor.payment_method 
                      ? employeeUtils.getPaymentMethodLabel(vendor.payment_method)
                      : '-'}
                  </td>
                  <td>
                    <span className={`w9-badge ${vendor.w9_on_file ? 'yes' : 'no'}`}>
                      {vendor.w9_on_file ? '✓' : '✗'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${vendor.is_active ? 'active' : 'inactive'}`}>
                      {vendor.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(vendor)}>
                        编辑
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(vendor.id)}>
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

      {/* 创建/编辑供应商模态框 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content vendor-modal">
            <div className="modal-header">
              <h2>{editingVendor ? '编辑供应商' : '新建供应商'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                基本信息
              </button>
              <button 
                className={`tab-btn ${activeTab === 'address' ? 'active' : ''}`}
                onClick={() => setActiveTab('address')}
              >
                地址信息
              </button>
              <button 
                className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                付款信息
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 基本信息 */}
              {activeTab === 'basic' && (
                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label>MC Number *</label>
                      <input
                        type="text"
                        name="mc_number"
                        value={formData.mc_number}
                        onChange={handleInputChange}
                        required
                        placeholder="例: MC123456"
                      />
                    </div>
                    <div className="form-group">
                      <label>公司名称 *</label>
                      <input
                        type="text"
                        name="truck_company_name"
                        value={formData.truck_company_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>联络方式 *</label>
                      <input
                        type="text"
                        name="truck_contact"
                        value={formData.truck_contact}
                        onChange={handleInputChange}
                        required
                        placeholder="电话/微信/邮箱"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tax ID / EIN</label>
                      <input
                        type="text"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleInputChange}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="w9_on_file"
                          checked={formData.w9_on_file}
                          onChange={handleInputChange}
                        />
                        W9表格已存档
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                        />
                        启用此供应商
                      </label>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>备注</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* 地址信息 */}
              {activeTab === 'address' && (
                <div className="form-section">
                  <div className="form-group full-width">
                    <label>街道地址</label>
                    <input
                      type="text"
                      name="company_address"
                      value={formData.company_address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>城市</label>
                      <input
                        type="text"
                        name="company_city"
                        value={formData.company_city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>州</label>
                      <select
                        name="company_state"
                        value={formData.company_state}
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
                        name="company_zipcode"
                        value={formData.company_zipcode}
                        onChange={handleInputChange}
                        placeholder="12345"
                      />
                    </div>
                    <div className="form-group">
                      <label>国家</label>
                      <input
                        type="text"
                        name="company_country"
                        value={formData.company_country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 付款信息 */}
              {activeTab === 'payment' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>首选付款方式</label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                    >
                      <option value="">选择付款方式</option>
                      <option value="check">支票 Check</option>
                      <option value="ach">ACH 转账</option>
                      <option value="zelle">Zelle</option>
                      <option value="wire">电汇 Wire</option>
                    </select>
                  </div>

                  {/* ACH/Wire 信息 */}
                  {(formData.payment_method === 'ach' || formData.payment_method === 'wire') && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>银行名称</label>
                          <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Routing Number</label>
                          <input
                            type="text"
                            name="routing_number"
                            value={formData.routing_number}
                            onChange={handleInputChange}
                            placeholder="9位数字"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          name="account_number"
                          value={formData.account_number}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Zelle 信息 */}
                  {formData.payment_method === 'zelle' && (
                    <div className="form-group">
                      <label>Zelle 邮箱或电话</label>
                      <input
                        type="text"
                        name="zelle_info"
                        value={formData.zelle_info}
                        onChange={handleInputChange}
                        placeholder="邮箱或手机号"
                      />
                    </div>
                  )}

                  {/* 支票信息 */}
                  {formData.payment_method === 'check' && (
                    <>
                      <div className="form-group">
                        <label>支票抬头 (Payable To)</label>
                        <input
                          type="text"
                          name="check_payable_to"
                          value={formData.check_payable_to}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>支票邮寄地址</label>
                        <textarea
                          name="check_mailing_address"
                          value={formData.check_mailing_address}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="完整邮寄地址"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-submit">
                  {editingVendor ? '保存修改' : '创建供应商'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;

