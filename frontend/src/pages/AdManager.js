import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiServices } from '../utils/apiClient';

const POSITIONS = [
  { value: 'home-banner', label: '首页横幅' },
  { value: 'forum-sidebar', label: '论坛侧栏' },
  { value: 'forum-top', label: '论坛顶部' },
  { value: 'article-bottom', label: '文章底部' },
];

const AdManager = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    slot_position: 'forum-sidebar',
    title: '',
    image_url: '',
    link_url: '',
    description: '',
    is_active: true,
    sort_order: 0,
    start_date: '',
    end_date: ''
  });

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await apiServices.ads.getAll();
      setAds(res.data || []);
    } catch (e) {
      console.error('加载广告失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad) => {
    setEditing(ad);
    setForm({
      slot_position: ad.slot_position,
      title: ad.title || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      description: ad.description || '',
      is_active: ad.is_active,
      sort_order: ad.sort_order || 0,
      start_date: ad.start_date ? ad.start_date.substring(0, 10) : '',
      end_date: ad.end_date ? ad.end_date.substring(0, 10) : ''
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setForm({ slot_position: 'forum-sidebar', title: '', image_url: '', link_url: '', description: '', is_active: true, sort_order: 0, start_date: '', end_date: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
      if (editing) {
        await apiServices.ads.update(editing.id, data);
      } else {
        await apiServices.ads.create(data);
      }
      setShowForm(false);
      loadAds();
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除此广告？')) return;
    try {
      await apiServices.ads.delete(id);
      loadAds();
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleToggle = async (ad) => {
    try {
      await apiServices.ads.update(ad.id, { is_active: !ad.is_active });
      loadAds();
    } catch (e) {
      alert('操作失败');
    }
  };

  const s = {
    page: { padding: '20px', maxWidth: 960, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    h1: { fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 },
    btnG: { padding: '8px 18px', background: '#34C759', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    btnS: { padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' },
    btnD: { padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#ef4444' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '2px solid #f3f4f6', background: '#f9fafb' },
    td: { padding: '10px 14px', borderBottom: '1px solid #f5f5f5', fontSize: 13, color: '#374151' },
    badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: active ? '#dcfce7' : '#fee2e2', color: active ? '#16a34a' : '#dc2626' }),
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: 10, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 0 },
    mh: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    mb: { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
    mf: { padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: '#f9fafb' },
    fg: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    input: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 },
    back: { padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13 },
    img: { width: 60, height: 36, objectFit: 'cover', borderRadius: 4, background: '#f3f4f6' }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.back} onClick={() => navigate('/employee/broker-orders')}>← 返回</button>
          <h1 style={s.h1}>广告管理</h1>
        </div>
        <button style={s.btnG} onClick={handleCreate}>+ 添加广告</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>加载中...</div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 10 }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>暂无广告</p>
          <button style={s.btnG} onClick={handleCreate}>添加第一个广告</button>
        </div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>预览</th>
              <th style={s.th}>标题</th>
              <th style={s.th}>位置</th>
              <th style={s.th}>状态</th>
              <th style={s.th}>点击</th>
              <th style={s.th}>浏览</th>
              <th style={s.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.id}>
                <td style={s.td}>
                  {ad.image_url ? <img src={ad.image_url} alt="" style={s.img} /> : <span style={{ color: '#9ca3af' }}>无图</span>}
                </td>
                <td style={{ ...s.td, fontWeight: 600 }}>{ad.title}</td>
                <td style={s.td}>{POSITIONS.find(p => p.value === ad.slot_position)?.label || ad.slot_position}</td>
                <td style={s.td}><span style={s.badge(ad.is_active)}>{ad.is_active ? '启用' : '停用'}</span></td>
                <td style={s.td}>{ad.click_count || 0}</td>
                <td style={s.td}>{ad.view_count || 0}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={s.btnS} onClick={() => handleToggle(ad)}>{ad.is_active ? '停用' : '启用'}</button>
                    <button style={s.btnS} onClick={() => handleEdit(ad)}>编辑</button>
                    <button style={s.btnD} onClick={() => handleDelete(ad.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mh}>
              <h2 style={{ margin: 0, fontSize: 16 }}>{editing ? '编辑广告' : '添加广告'}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={s.mb}>
                <div style={s.fg}>
                  <label style={s.label}>广告位置 *</label>
                  <select style={s.input} value={form.slot_position} onChange={e => setForm({...form, slot_position: e.target.value})}>
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div style={s.fg}>
                  <label style={s.label}>广告标题 *</label>
                  <input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="广告标题" required />
                </div>
                <div style={s.fg}>
                  <label style={s.label}>图片URL</label>
                  <input style={s.input} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                </div>
                <div style={s.fg}>
                  <label style={s.label}>链接URL</label>
                  <input style={s.input} value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} placeholder="https://..." />
                </div>
                <div style={s.fg}>
                  <label style={s.label}>描述</label>
                  <input style={s.input} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="广告描述" />
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label style={s.label}>开始日期</label>
                    <input type="date" style={s.input} value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                  </div>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label style={s.label}>结束日期</label>
                    <input type="date" style={s.input} value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label style={s.label}>排序（数字越小越前）</label>
                    <input type="number" style={s.input} value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} />
                  </div>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label style={s.label}>状态</label>
                    <select style={s.input} value={form.is_active ? 'true' : 'false'} onChange={e => setForm({...form, is_active: e.target.value === 'true'})}>
                      <option value="true">启用</option>
                      <option value="false">停用</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={s.mf}>
                <button type="button" style={{ ...s.btnS, padding: '8px 16px' }} onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" style={s.btnG}>{editing ? '保存修改' : '创建广告'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdManager;
