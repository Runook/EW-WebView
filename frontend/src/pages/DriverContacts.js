import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Truck, Phone, Building, Hash, Plus, Edit, Trash2, X, ChevronDown, ChevronRight,
  MapPin, Package, Calendar, DollarSign, FileText, Save, Loader
} from 'lucide-react';
import { truckContactApi } from '../config/employeeApi';
import './DriverContacts.css';

const DriverContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ mc_number: '', truck_company_name: '', truck_contact: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [orderHistory, setOrderHistory] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await truckContactApi.getContacts(search);
      if (res.success) setContacts(res.data || []);
    } catch (e) {
      console.error('Failed to load contacts:', e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleAdd = async () => {
    if (!addForm.mc_number.trim() || !addForm.truck_company_name.trim() || !addForm.truck_contact.trim()) {
      setAddError('MC Number、卡车公司名、联络方式均为必填');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      const res = await truckContactApi.saveContact(addForm);
      if (res.success) {
        setAddForm({ mc_number: '', truck_company_name: '', truck_contact: '', notes: '' });
        setShowAddForm(false);
        fetchContacts();
      } else {
        setAddError(res.message || '添加失败');
      }
    } catch (e) {
      setAddError(e.message || '添加失败');
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditContact(c.truck_contact || '');
    setEditNotes(c.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContact('');
    setEditNotes('');
  };

  const saveEdit = async (id) => {
    if (!editContact.trim()) return;
    setEditLoading(true);
    try {
      const res = await truckContactApi.updateContact(id, { truck_contact: editContact, notes: editNotes });
      if (res.success) {
        cancelEdit();
        fetchContacts();
      }
    } catch (e) {
      console.error('Update failed:', e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条联系记录？')) return;
    try {
      const res = await truckContactApi.deleteContact(id);
      if (res.success) fetchContacts();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!orderHistory[id]) {
      setOrdersLoading(id);
      try {
        const res = await truckContactApi.getContactOrders(id);
        if (res.success) {
          setOrderHistory(prev => ({ ...prev, [id]: res.data || [] }));
        }
      } catch (e) {
        console.error('Failed to load orders:', e);
        setOrderHistory(prev => ({ ...prev, [id]: [] }));
      } finally {
        setOrdersLoading(null);
      }
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-';

  return (
    <div className="dc-page">
      <div className="dc-hero">
        <div className="dc-hero-bg"><div className="dc-orb dc-orb-1" /><div className="dc-orb dc-orb-2" /></div>
        <div className="dc-hero-content">
          <h1>司机联系簿</h1>
          <p>管理卡车公司与司机联络方式 · 查看历史合作订单</p>
        </div>
      </div>

      <div className="dc-body">
        <div className="dc-toolbar">
          <div className="dc-search">
            <Search size={16} />
            <input type="text" placeholder="搜索 MC Number、公司名、联络方式..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="dc-count">{contacts.length} 条记录</span>
          <button className="dc-add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? '取消' : '新增司机'}
          </button>
        </div>

        {showAddForm && (
          <div className="dc-add-form">
            <div className="dc-add-row">
              <div className="dc-add-field">
                <label>MC Number *</label>
                <input value={addForm.mc_number} onChange={(e) => setAddForm(p => ({ ...p, mc_number: e.target.value }))} placeholder="如：MC-123456" />
              </div>
              <div className="dc-add-field">
                <label>卡车公司名 *</label>
                <input value={addForm.truck_company_name} onChange={(e) => setAddForm(p => ({ ...p, truck_company_name: e.target.value }))} placeholder="如：ABC Trucking" />
              </div>
              <div className="dc-add-field">
                <label>联络方式 *</label>
                <input value={addForm.truck_contact} onChange={(e) => setAddForm(p => ({ ...p, truck_contact: e.target.value }))} placeholder="电话/邮箱" />
              </div>
              <div className="dc-add-field">
                <label>备注</label>
                <input value={addForm.notes} onChange={(e) => setAddForm(p => ({ ...p, notes: e.target.value }))} placeholder="选填" />
              </div>
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
          <div className="dc-empty">
            <Truck size={48} />
            <h3>暂无联系记录</h3>
            <p>点击"新增司机"手动添加，或下单确认时自动保存</p>
          </div>
        ) : (
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th><Hash size={13} /> MC Number</th>
                  <th><Building size={13} /> 卡车公司</th>
                  <th><Phone size={13} /> 联络方式</th>
                  <th>历史单量</th>
                  <th>最近合作</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr className={expandedId === c.id ? 'dc-row-expanded' : ''}>
                      <td>
                        <button className="dc-expand-btn" onClick={() => toggleExpand(c.id)} title="查看历史订单">
                          {expandedId === c.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                      <td className="dc-mc">{c.mc_number}</td>
                      <td>{c.truck_company_name}</td>
                      <td>
                        {editingId === c.id ? (
                          <div className="dc-edit-inline">
                            <input className="dc-edit-input" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                          </div>
                        ) : (
                          c.truck_contact
                        )}
                      </td>
                      <td className="dc-order-count">{c.order_count || 0}</td>
                      <td className="dc-date">{c.last_order_date ? fmtDate(c.last_order_date) : '-'}</td>
                      <td>
                        <div className="dc-actions">
                          {editingId === c.id ? (
                            <>
                              <button className="dc-act save" onClick={() => saveEdit(c.id)} disabled={editLoading} title="保存">
                                {editLoading ? <Loader size={13} className="spin" /> : <Save size={13} />}
                              </button>
                              <button className="dc-act cancel" onClick={cancelEdit} title="取消"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button className="dc-act edit" onClick={() => startEdit(c)} title="修改联系方式"><Edit size={13} /></button>
                              <button className="dc-act delete" onClick={() => handleDelete(c.id)} title="删除"><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="dc-orders-row">
                        <td colSpan={7}>
                          <div className="dc-orders-panel">
                            <h4><FileText size={14} /> {c.truck_company_name} 的历史订单</h4>
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
