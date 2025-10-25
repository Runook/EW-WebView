import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import employeeApiExports from '../config/employeeApi';
import './Customers.css';

const { customerApi } = employeeApiExports;

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    wechat_group_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: ''
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
      notes: ''
    });
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
      notes: customer.notes || ''
    });
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

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>客户表</h1>
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
                <th>联系电话</th>
                <th>联系邮箱</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.company_name}</td>
                  <td>{customer.wechat_group_name || '-'}</td>
                  <td>{customer.contact_person || '-'}</td>
                  <td>{customer.contact_phone || '-'}</td>
                  <td>{customer.contact_email || '-'}</td>
                  <td className="notes-cell">{customer.notes || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(customer)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(customer.id)}
                      >
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCustomer ? '编辑客户' : '新建客户'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>询价公司 *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="输入公司名称"
                  />
                </div>

                <div className="form-group">
                  <label>微信群名称</label>
                  <input
                    type="text"
                    value={formData.wechat_group_name}
                    onChange={(e) => setFormData({...formData, wechat_group_name: e.target.value})}
                    placeholder="输入微信群名称"
                  />
                </div>

                <div className="form-group">
                  <label>联系人</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="输入联系人姓名"
                  />
                </div>

                <div className="form-group">
                  <label>联系电话</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="输入联系电话"
                  />
                </div>

                <div className="form-group">
                  <label>联系邮箱</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    placeholder="输入联系邮箱"
                  />
                </div>

                <div className="form-group">
                  <label>备注</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="输入备注信息"
                    rows="3"
                  />
                </div>
              </div>

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

