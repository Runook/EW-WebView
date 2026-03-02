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
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    mc_number: '', truck_company_name: '', truck_contact: '', notes: '',
    company_address: '', company_city: '', company_state: '', company_zipcode: '', company_country: 'USA',
    payment_method: '', bank_name: '', account_number: '', routing_number: '',
    zelle_info: '', check_payable_to: '', check_mailing_address: '',
    tax_id: '', w9_on_file: false, is_active: true
  });

  useEffect(() => { loadVendors(); }, [searchTerm]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getAll({ search: searchTerm });
      setVendors(response.data || []);
    } catch (error) { console.error('Failed to load vendors:', error); }
    finally { setLoading(false); }
  };

  const handleCreate = () => {
    setEditingVendor(null);
    setFormData({
      mc_number: '', truck_company_name: '', truck_contact: '', notes: '',
      company_address: '', company_city: '', company_state: '', company_zipcode: '', company_country: 'USA',
      payment_method: '', bank_name: '', account_number: '', routing_number: '',
      zelle_info: '', check_payable_to: '', check_mailing_address: '',
      tax_id: '', w9_on_file: false, is_active: true
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      mc_number: vendor.mc_number || '', truck_company_name: vendor.truck_company_name || '',
      truck_contact: vendor.truck_contact || '', notes: vendor.notes || '',
      company_address: vendor.company_address || '', company_city: vendor.company_city || '',
      company_state: vendor.company_state || '', company_zipcode: vendor.company_zipcode || '',
      company_country: vendor.company_country || 'USA',
      payment_method: vendor.payment_method || '', bank_name: vendor.bank_name || '',
      account_number: vendor.account_number || '', routing_number: vendor.routing_number || '',
      zelle_info: vendor.zelle_info || '', check_payable_to: vendor.check_payable_to || '',
      check_mailing_address: vendor.check_mailing_address || '',
      tax_id: vendor.tax_id || '', w9_on_file: vendor.w9_on_file || false,
      is_active: vendor.is_active !== false
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) { await vendorApi.update(editingVendor.id, formData); }
      else { await vendorApi.create(formData); }
      setShowModal(false);
      loadVendors();
    } catch (error) { alert(error.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vendor?')) {
      try { await vendorApi.delete(id); loadVendors(); }
      catch (error) { alert(error.message || 'Delete failed'); }
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
    <div className="vendors-container">
      <div className="vendors-header">
        <div className="header-left">
          <h1>Vendor List</h1>
          <p>Manage trucking companies and driver payment info</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>+ New Vendor</button>
      </div>

      <div className="vendors-toolbar">
        <div className="search-box">
          <input type="text" placeholder="Search MC#, company, contact..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendors yet</p>
          <button className="btn-create" onClick={handleCreate}>Create First Vendor</button>
        </div>
      ) : (
        <div className="vendors-table-container">
          <table className="vendors-table">
            <thead>
              <tr>
                <th>MC Number</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Payment</th>
                <th>W9</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className={!vendor.is_active ? 'inactive' : ''}>
                  <td className="mc-number">{vendor.mc_number}</td>
                  <td>{vendor.truck_company_name}</td>
                  <td>{vendor.truck_contact}</td>
                  <td>{vendor.company_city && vendor.company_state ? `${vendor.company_city}, ${vendor.company_state}` : '-'}</td>
                  <td>{vendor.payment_method ? employeeUtils.getPaymentMethodLabel(vendor.payment_method) : '-'}</td>
                  <td><span className={`w9-badge ${vendor.w9_on_file ? 'yes' : 'no'}`}>{vendor.w9_on_file ? '✓' : '✗'}</span></td>
                  <td><span className={`status-badge ${vendor.is_active ? 'active' : 'inactive'}`}>{vendor.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(vendor)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(vendor.id)}>Delete</button>
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
          <div className="modal-content vendor-modal">
            <div className="modal-header">
              <h2>{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <div className="modal-tabs">
              <button className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Basic Info</button>
              <button className={`tab-btn ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>Address</button>
              <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>Payment</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                {activeTab === 'basic' && (
                  <>
                    <div className="form-row">
                      <div className="form-group"><label>MC Number *</label>
                        <input type="text" name="mc_number" value={formData.mc_number} onChange={handleInputChange} required placeholder="MC123456" /></div>
                      <div className="form-group"><label>Company Name *</label>
                        <input type="text" name="truck_company_name" value={formData.truck_company_name} onChange={handleInputChange} required /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Contact *</label>
                        <input type="text" name="truck_contact" value={formData.truck_contact} onChange={handleInputChange} required placeholder="Phone / Email" /></div>
                      <div className="form-group"><label>Tax ID / EIN</label>
                        <input type="text" name="tax_id" value={formData.tax_id} onChange={handleInputChange} placeholder="XX-XXXXXXX" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group checkbox-group"><label><input type="checkbox" name="w9_on_file" checked={formData.w9_on_file} onChange={handleInputChange} /> W9 On File</label></div>
                      <div className="form-group checkbox-group"><label><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} /> Active</label></div>
                    </div>
                    <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} /></div>
                  </>
                )}

                {activeTab === 'address' && (
                  <>
                    <div className="form-group full-width"><label>Street Address</label>
                      <input type="text" name="company_address" value={formData.company_address} onChange={handleInputChange} /></div>
                    <div className="form-row">
                      <div className="form-group"><label>City</label><input type="text" name="company_city" value={formData.company_city} onChange={handleInputChange} /></div>
                      <div className="form-group"><label>State</label>
                        <select name="company_state" value={formData.company_state} onChange={handleInputChange}>
                          <option value="">Select</option>
                          {usStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </select></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Zip</label><input type="text" name="company_zipcode" value={formData.company_zipcode} onChange={handleInputChange} placeholder="12345" /></div>
                      <div className="form-group"><label>Country</label><input type="text" name="company_country" value={formData.company_country} onChange={handleInputChange} /></div>
                    </div>
                  </>
                )}

                {activeTab === 'payment' && (
                  <>
                    <div className="form-group"><label>Preferred Payment Method</label>
                      <select name="payment_method" value={formData.payment_method} onChange={handleInputChange}>
                        <option value="">Select</option>
                        <option value="check">Check</option>
                        <option value="ach">ACH</option>
                        <option value="zelle">Zelle</option>
                        <option value="wire">Wire</option>
                      </select></div>
                    {(formData.payment_method === 'ach' || formData.payment_method === 'wire') && (
                      <>
                        <div className="form-row">
                          <div className="form-group"><label>Bank Name</label><input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} /></div>
                          <div className="form-group"><label>Routing Number</label><input type="text" name="routing_number" value={formData.routing_number} onChange={handleInputChange} /></div>
                        </div>
                        <div className="form-group"><label>Account Number</label><input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} /></div>
                      </>
                    )}
                    {formData.payment_method === 'zelle' && (
                      <div className="form-group"><label>Zelle Email / Phone</label><input type="text" name="zelle_info" value={formData.zelle_info} onChange={handleInputChange} /></div>
                    )}
                    {formData.payment_method === 'check' && (
                      <>
                        <div className="form-group"><label>Payable To</label><input type="text" name="check_payable_to" value={formData.check_payable_to} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Mailing Address</label><textarea name="check_mailing_address" value={formData.check_mailing_address} onChange={handleInputChange} rows={3} /></div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #e0e0e0', background: '#f8f9fa', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button type="submit"
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {editingVendor ? 'Save' : 'Create'}
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
