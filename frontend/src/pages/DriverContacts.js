import React, { useState, useEffect, useCallback } from 'react';
import { Search, Truck, Phone, Building, Hash } from 'lucide-react';
import { truckContactApi } from '../config/employeeApi';
import './DriverContacts.css';

const DriverContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="dc-page">
      <div className="dc-hero">
        <div className="dc-hero-bg">
          <div className="dc-orb dc-orb-1"></div>
          <div className="dc-orb dc-orb-2"></div>
        </div>
        <div className="dc-hero-content">
          <h1>司机联系簿</h1>
          <p>下单时自动保存的卡车公司与司机联络方式</p>
        </div>
      </div>

      <div className="dc-body">
        <div className="dc-toolbar">
          <div className="dc-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索 MC Number、公司名、联络方式..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="dc-count">{contacts.length} 条记录</span>
        </div>

        {loading ? (
          <div className="dc-loading">加载中...</div>
        ) : contacts.length === 0 ? (
          <div className="dc-empty">
            <Truck size={48} />
            <h3>暂无联系记录</h3>
            <p>下单确认时会自动保存卡车公司信息到此处</p>
          </div>
        ) : (
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th><Hash size={13} /> MC Number</th>
                  <th><Building size={13} /> 卡车公司</th>
                  <th><Phone size={13} /> 联络方式</th>
                  <th>保存时间</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td className="dc-mc">{c.mc_number}</td>
                    <td>{c.truck_company_name}</td>
                    <td>{c.truck_contact}</td>
                    <td className="dc-date">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                  </tr>
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
