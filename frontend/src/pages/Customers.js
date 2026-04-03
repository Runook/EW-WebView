import React, { useState, useEffect } from 'react';
import employeeApiExports from '../config/employeeApi';
import './Customers.css';

const { customerApi } = employeeApiExports;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showBilling, setShowBilling] = useState(false);
  const [customerBalances, setCustomerBalances] = useState({});
  const [formData, setFormData] = useState({
    company_name: '',
    billing_address: '',
    billing_address2: '',
    billing_city: '',
    billing_state: '',
    billing_zipcode: '',
    billing_country: 'USA',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    wechat_group_name: '',
    notes: '',
    payment_terms: 'Net 7',
    tax_id: '',
    late_fee_rate: 0,
    late_fee_fixed: 0,
    is_active: true
  });

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomers(searchTerm);
      const custs = response.data || [];
      setCustomers(custs);
      custs.forEach(async (c) => {
        try {
          const { orderApi } = require('../config/employeeApi');
          const balRes = await orderApi.getCustomerBalance(c.company_name);
          if (balRes.success) {
            setCustomerBalances(prev => ({ ...prev, [c.company_name]: balRes.data }));
          }
        } catch (e) { /* ignore */ }
      });
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({
      company_name: '', billing_address: '', billing_address2: '',
      billing_city: '', billing_state: '', billing_zipcode: '', billing_country: 'USA',
      contact_person: '', contact_phone: '', contact_email: '',
      wechat_group_name: '', notes: '',
      payment_terms: 'Net 7', tax_id: '', late_fee_rate: 0, late_fee_fixed: 0, is_active: true
    });
    setShowBilling(false);
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      company_name: customer.company_name || '',
      billing_address: customer.billing_address || '',
      billing_address2: customer.billing_address2 || '',
      billing_city: customer.billing_city || '',
      billing_state: customer.billing_state || '',
      billing_zipcode: customer.billing_zipcode || '',
      billing_country: customer.billing_country || 'USA',
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      contact_email: customer.contact_email || '',
      wechat_group_name: customer.wechat_group_name || '',
      notes: customer.notes || '',
      payment_terms: customer.payment_terms || 'Net 7',
      tax_id: customer.tax_id || '',
      late_fee_rate: customer.late_fee_rate || 0,
      late_fee_fixed: customer.late_fee_fixed || 0,
      is_active: customer.is_active !== false
    });
    setShowBilling(!!customer.tax_id || !!customer.late_fee_rate || !!customer.late_fee_fixed);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData);
        alert('Customer updated successfully');
      } else {
        await customerApi.createCustomer(formData);
        alert('Customer created successfully');
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await customerApi.deleteCustomer(id);
        loadCustomers();
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const usStates = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];

  return (
    <div className="customers-container">
      <div className="customers-header">
        <div className="header-left">
          <h1>Customer List</h1>
          <p>Manage customer info, addresses, and billing</p>
        </div>
        <div className="header-actions">
          <input type="text" className="search-input" placeholder="Search company name..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="btn-create" onClick={handleCreate}>+ New Customer</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <p>No customers yet</p>
          <button className="btn-create" onClick={handleCreate}>Create First Customer</button>
        </div>
      ) : (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone / Email</th>
                <th>Address</th>
                <th>Terms</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className={!customer.is_active ? 'inactive' : ''}>
                  <td className="company-name">{customer.company_name}</td>
                  <td>{customer.contact_person || '-'}</td>
                  <td>
                    <div className="contact-info">
                      {customer.contact_phone && <span>{customer.contact_phone}</span>}
                      {customer.contact_email && <span className="email">{customer.contact_email}</span>}
                      {!customer.contact_phone && !customer.contact_email && '-'}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {customer.billing_address
                      ? `${customer.billing_address}${customer.billing_city ? ', ' + customer.billing_city : ''}${customer.billing_state ? ', ' + customer.billing_state : ''}`
                      : '-'}
                  </td>
                  <td><span className="terms-badge">{customer.payment_terms || 'Net 7'}</span></td>
                  <td>
                    {(() => {
                      const bal = customerBalances[customer.company_name];
                      if (!bal) return <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>;
                      const amount = bal.balance || 0;
                      return (
                        <span style={{ color: amount > 0 ? '#ef4444' : '#16a34a', fontWeight: 600, fontSize: 12 }}>
                          {amount > 0 ? `$${amount.toLocaleString()}` : '$0'}
                          {bal.unpaid_orders > 0 && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>({bal.unpaid_orders})</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span className={`status-badge ${customer.is_active !== false ? 'active' : 'inactive'}`}>
                      {customer.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(customer)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(customer.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content customer-modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group full-width">
                  <label>Company Name *</label>
                  <input type="text" name="company_name" required value={formData.company_name}
                    onChange={handleInputChange} placeholder="Formal legal company name" />
                </div>

                <div className="form-group full-width">
                  <label>Address Line 1 *</label>
                  <input type="text" name="billing_address" required value={formData.billing_address}
                    onChange={handleInputChange} placeholder="Street address" />
                </div>

                <div className="form-group full-width">
                  <label>Address Line 2</label>
                  <input type="text" name="billing_address2" value={formData.billing_address2}
                    onChange={handleInputChange} placeholder="Suite, district, etc." />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="billing_city" value={formData.billing_city} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <select name="billing_state" value={formData.billing_state} onChange={handleInputChange}>
                      <option value="">Select</option>
                      {usStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Zip</label>
                    <input type="text" name="billing_zipcode" value={formData.billing_zipcode}
                      onChange={handleInputChange} placeholder="12345" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input type="text" name="contact_phone" required value={formData.contact_phone}
                      onChange={handleInputChange} placeholder="Phone number" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="contact_email" required value={formData.contact_email}
                      onChange={handleInputChange} placeholder="Email address" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input type="text" name="contact_person" value={formData.contact_person}
                      onChange={handleInputChange} placeholder="Name" />
                  </div>
                  <div className="form-group">
                    <label>WeChat Group</label>
                    <input type="text" name="wechat_group_name" value={formData.wechat_group_name}
                      onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Terms</label>
                    <select name="payment_terms" value={formData.payment_terms} onChange={handleInputChange}>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                      Active
                    </label>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" />
                </div>

                {/* Collapsible billing settings */}
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => setShowBilling(!showBilling)}
                    style={{ background: 'none', border: 'none', color: '#1565C0', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                    {showBilling ? '▼' : '▶'} Billing Settings (Tax ID, Late Fees)
                  </button>
                  {showBilling && (
                    <div style={{ marginTop: 10 }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Tax ID</label>
                          <input type="text" name="tax_id" value={formData.tax_id} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label>Country</label>
                          <input type="text" name="billing_country" value={formData.billing_country} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Late Fee Rate (%/mo)</label>
                          <input type="number" name="late_fee_rate" value={formData.late_fee_rate}
                            onChange={handleInputChange} step="0.1" />
                        </div>
                        <div className="form-group">
                          <label>Late Fee Fixed ($)</label>
                          <input type="number" name="late_fee_fixed" value={formData.late_fee_fixed}
                            onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #e0e0e0', background: '#f8f9fa', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button type="submit"
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {editingCustomer ? 'Save' : 'Create'}
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
