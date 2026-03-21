import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Truck, Phone, Building, Hash, Plus, Edit, Trash2, X, ChevronDown, ChevronRight,
  MapPin, Package, Calendar, DollarSign, FileText, Save, Loader, User, Mail, ShieldCheck
} from 'lucide-react';
import { truckContactApi } from '../config/employeeApi';
import { useAuth } from '../contexts/AuthContext';
import './DriverContacts.css';

const DriverContacts = () => {
  const { user } = useAuth();
  const isAdmin = user?.employeeRole === 'admin' || user?.employee_role === 'admin';

  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ mc_number: '', dot_number: '', truck_company_name: '', truck_contact: '', carrier_email: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [orderHistory, setOrderHistory] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(null);

  // Driver management per contact
  const [addDriverFor, setAddDriverFor] = useState(null);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [driverSaving, setDriverSaving] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverPhone, setEditDriverPhone] = useState('');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await truckContactApi.getContacts(search);
      if (res.success) setContacts(res.data || []);
    } catch (e) { console.error('Failed to load contacts:', e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  // Add contact
  const handleAdd = async () => {
    if (!addForm.mc_number.trim() || !addForm.truck_company_name.trim() || !addForm.truck_contact.trim()) {
      setAddError('MC#、卡车公司名、公司电话均为必填'); return;
    }
    setAddLoading(true); setAddError('');
    try {
      const res = await truckContactApi.saveContact(addForm);
      if (res.success) { setAddForm({ mc_number: '', dot_number: '', truck_company_name: '', truck_contact: '', carrier_email: '', notes: '' }); setShowAddForm(false); fetchContacts(); }
      else setAddError(res.message || '添加失败');
    } catch (e) { setAddError(e.message || '添加失败'); }
    finally { setAddLoading(false); }
  };

  // Edit contact (only phone, email, notes)
  const startEdit = (c) => { setEditingId(c.id); setEditContact(c.truck_contact || ''); setEditEmail(c.carrier_email || ''); setEditNotes(c.notes || ''); };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id) => {
    if (!editContact.trim()) return;
    setEditLoading(true);
    try {
      const res = await truckContactApi.updateContact(id, { truck_contact: editContact, carrier_email: editEmail, notes: editNotes });
      if (res.success) { cancelEdit(); fetchContacts(); }
    } catch (e) { console.error('Update failed:', e); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条联系记录？')) return;
    try { const res = await truckContactApi.deleteContact(id); if (res.success) fetchContacts(); } catch (e) { console.error('Delete failed:', e); }
  };

  // Expand / order history
  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!orderHistory[id]) {
      setOrdersLoading(id);
      try {
        const res = await truckContactApi.getContactOrders(id);
        if (res.success) setOrderHistory(prev => ({ ...prev, [id]: res.data || [] }));
      } catch { setOrderHistory(prev => ({ ...prev, [id]: [] })); }
      finally { setOrdersLoading(null); }
    }
  };

  // Driver CRUD
  const handleAddDriver = async (contactId) => {
    if (!newDriverName.trim()) return;
    setDriverSaving(true);
    try {
      const res = await truckContactApi.addDriver(contactId, { driver_name: newDriverName, driver_phone: newDriverPhone });
      if (res.success) { setNewDriverName(''); setNewDriverPhone(''); setAddDriverFor(null); fetchContacts(); }
    } catch (e) { alert('添加司机失败: ' + e.message); }
    finally { setDriverSaving(false); }
  };

  const startEditDriver = (d) => { setEditingDriver(d.id); setEditDriverName(d.driver_name); setEditDriverPhone(d.driver_phone || ''); };
  const saveEditDriver = async (contactId, driverId) => {
    if (!editDriverName.trim()) return;
    try {
      await truckContactApi.updateDriver(contactId, driverId, { driver_name: editDriverName, driver_phone: editDriverPhone });
      setEditingDriver(null); fetchContacts();
    } catch (e) { alert('修改司机失败: ' + e.message); }
  };
  const deleteDriver = async (contactId, driverId) => {
    if (!window.confirm('确定删除该司机？')) return;
    try { await truckContactApi.deleteDriver(contactId, driverId); fetchContacts(); } catch (e) { alert('删除司机失败: ' + e.message); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-';
  const fmtMoney = (v) => v ? `$${parseFloat(v).toLocaleString()}` : '-';

  return (
    <div className="dc-page">
      <div className="dc-hero">
        <div className="dc-hero-bg"><div className="dc-orb dc-orb-1" /><div className="dc-orb dc-orb-2" /></div>
        <div className="dc-hero-content">
          <h1>司机联系簿</h1>
          <p>管理承运商信息、司机联络方式、查看历史合作订单</p>
        </div>
      </div>

      <div className="dc-body">
        <div className="dc-toolbar">
          <div className="dc-search">
            <Search size={16} />
            <input type="text" placeholder="搜索 MC#、DOT#、公司名、电话..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="dc-count">{contacts.length} 条记录</span>
          <button className="dc-add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? '取消' : '新增承运商'}
          </button>
        </div>

        {showAddForm && (
          <div className="dc-add-form">
            <div className="dc-add-row">
              <div className="dc-add-field"><label>MC# *</label><input value={addForm.mc_number} onChange={(e) => setAddForm(p => ({ ...p, mc_number: e.target.value }))} placeholder="1234567" /></div>
              <div className="dc-add-field"><label>DOT#</label><input value={addForm.dot_number} onChange={(e) => setAddForm(p => ({ ...p, dot_number: e.target.value }))} placeholder="7654321" /></div>
              <div className="dc-add-field"><label>卡车公司名 *</label><input value={addForm.truck_company_name} onChange={(e) => setAddForm(p => ({ ...p, truck_company_name: e.target.value }))} placeholder="ABC Trucking" /></div>
              <div className="dc-add-field"><label>公司电话 *</label><input value={addForm.truck_contact} onChange={(e) => setAddForm(p => ({ ...p, truck_contact: e.target.value }))} placeholder="1234567890" /></div>
              <div className="dc-add-field"><label>Carrier Email</label><input value={addForm.carrier_email} onChange={(e) => setAddForm(p => ({ ...p, carrier_email: e.target.value }))} placeholder="carrier@co.com" /></div>
              <div className="dc-add-field"><label>备注</label><input value={addForm.notes} onChange={(e) => setAddForm(p => ({ ...p, notes: e.target.value }))} placeholder="选填" /></div>
            </div>
            {addError && <div className="dc-add-error">{addError}</div>}
            <button className="dc-add-submit" onClick={handleAdd} disabled={addLoading}>
              {addLoading ? <Loader size={14} className="spin" /> : <Plus size={14} />} 添加
            </button>
          </div>
        )}

        {loading ? (
          <div className="dc-loading">加载中...</div>
        ) : contacts.length === 0 ? (
          <div className="dc-empty"><Truck size={48} /><h3>暂无联系记录</h3><p>点击"新增承运商"手动添加，或下单确认时自动保存</p></div>
        ) : (
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th><Hash size={13} /> MC#</th>
                  <th>DOT#</th>
                  <th><Building size={13} /> 公司名</th>
                  <th><Phone size={13} /> 公司电话</th>
                  <th><Mail size={13} /> Email</th>
                  <th>历史单量</th>
                  <th>累计成交</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr className={expandedId === c.id ? 'dc-row-expanded' : ''}>
                      <td>
                        <button className="dc-expand-btn" onClick={() => toggleExpand(c.id)}>
                          {expandedId === c.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                      <td className="dc-mc">{c.mc_number}</td>
                      <td className="dc-dot">{c.dot_number || '-'}</td>
                      <td>{c.truck_company_name}</td>
                      <td>
                        {editingId === c.id ? (
                          <input className="dc-edit-input" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                        ) : c.truck_contact}
                      </td>
                      <td>
                        {editingId === c.id ? (
                          <input className="dc-edit-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email" style={{ width: 140 }} />
                        ) : (c.carrier_email || '-')}
                      </td>
                      <td className="dc-order-count">{c.order_count || 0}</td>
                      <td className="dc-revenue">{fmtMoney(c.total_revenue)}</td>
                      <td>
                        <div className="dc-actions">
                          {editingId === c.id ? (
                            <>
                              <button className="dc-act save" onClick={() => saveEdit(c.id)} disabled={editLoading}>{editLoading ? <Loader size={13} className="spin" /> : <Save size={13} />}</button>
                              <button className="dc-act cancel" onClick={cancelEdit}><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button className="dc-act edit" onClick={() => startEdit(c)} title="修改公司电话/Email"><Edit size={13} /></button>
                              <button className="dc-act delete" onClick={() => handleDelete(c.id)} title="删除"><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === c.id && (
                      <tr className="dc-orders-row">
                        <td colSpan={9}>
                          <div className="dc-orders-panel">
                            {/* Drivers section */}
                            <div className="dc-drivers-section">
                              <h4><User size={14} /> 司机列表</h4>
                              {(c.drivers || []).length > 0 && (
                                <div className="dc-drivers-list">
                                  {c.drivers.map((d, idx) => (
                                    <div key={d.id} className="dc-driver-chip">
                                      {editingDriver === d.id ? (
                                        <div className="dc-driver-edit-inline">
                                          <input value={editDriverName} onChange={(e) => setEditDriverName(e.target.value)} placeholder="姓名" className="dc-driver-input" />
                                          <input value={editDriverPhone} onChange={(e) => setEditDriverPhone(e.target.value)} placeholder="电话" className="dc-driver-input" />
                                          <button className="dc-act save" onClick={() => saveEditDriver(c.id, d.id)}><Save size={12} /></button>
                                          <button className="dc-act cancel" onClick={() => setEditingDriver(null)}><X size={12} /></button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="dc-driver-label">司机{idx + 1}</span>
                                          <span className="dc-driver-name">{d.driver_name}</span>
                                          {d.driver_phone && <span className="dc-driver-phone"><Phone size={11} /> {d.driver_phone}</span>}
                                          {isAdmin && (
                                            <span className="dc-driver-acts">
                                              <button onClick={() => startEditDriver(d)} title="修改"><Edit size={11} /></button>
                                              <button onClick={() => deleteDriver(c.id, d.id)} title="删除"><Trash2 size={11} /></button>
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {addDriverFor === c.id ? (
                                <div className="dc-add-driver-inline">
                                  <input value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="司机姓名 *" className="dc-driver-input" />
                                  <input value={newDriverPhone} onChange={(e) => setNewDriverPhone(e.target.value)} placeholder="电话" className="dc-driver-input" />
                                  <button className="dc-act save" onClick={() => handleAddDriver(c.id)} disabled={driverSaving}>{driverSaving ? <Loader size={12} className="spin" /> : <Save size={12} />}</button>
                                  <button className="dc-act cancel" onClick={() => { setAddDriverFor(null); setNewDriverName(''); setNewDriverPhone(''); }}><X size={12} /></button>
                                </div>
                              ) : (
                                <button className="dc-add-driver-btn" onClick={() => setAddDriverFor(c.id)}><Plus size={13} /> 添加司机</button>
                              )}
                            </div>

                            {/* Order history */}
                            <h4 style={{ marginTop: 16 }}><FileText size={14} /> 历史订单</h4>
                            {ordersLoading === c.id ? (
                              <div className="dc-orders-loading">加载订单中...</div>
                            ) : (orderHistory[c.id] || []).length === 0 ? (
                              <div className="dc-orders-empty">暂无关联订单</div>
                            ) : (
                              <div className="dc-orders-list">
                                {(orderHistory[c.id] || []).map(o => (
                                  <div key={o.id} className="dc-order-card">
                                    <div className="dc-order-top">
                                      <span className="dc-order-num">{o.ew_quote_number || `#${o.id}`}</span>
                                      <span className={`dc-order-status st-${o.status}`}>{o.status}</span>
                                      {o.driver_name && <span className="dc-order-driver"><User size={12} /> {o.driver_name}{o.driver_phone ? ` (${o.driver_phone})` : ''}</span>}
                                      <span className="dc-order-date"><Calendar size={12} /> {fmtDate(o.pickup_date || o.quote_date || o.created_at)}</span>
                                    </div>
                                    <div className="dc-order-detail">
                                      <span><Building size={12} /> {o.customer_name || '-'}</span>
                                      <span><MapPin size={12} /> {o.origin_city}{o.origin_state ? `, ${o.origin_state}` : ''} → {o.destination_city}{o.destination_state ? `, ${o.destination_state}` : ''}</span>
                                      {o.truck_size && <span><Truck size={12} /> {o.truck_size}</span>}
                                      {o.total_weight_lbs && <span><Package size={12} /> {o.total_weight_lbs} lbs</span>}
                                      {o.dimensions_list && <span>尺寸: {o.dimensions_list}</span>}
                                    </div>
                                    <div className="dc-order-prices">
                                      {o.ew_final_price && <span><DollarSign size={12} /> 报价: ${o.ew_final_price}</span>}
                                      {o.truck_payment && <span>付卡车: ${o.truck_payment}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverContacts;
