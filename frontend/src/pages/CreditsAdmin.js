import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Coins, ArrowUpCircle, ArrowDownCircle,
  User, RefreshCw, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';

const CreditsAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canAccess = ['admin', 'accountant'].includes(user?.employeeRole);

  const searchUsers = useCallback(async (term) => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiClient.get('/user-management/admin/credits/users', { search: term || '', limit: 50 });
      if (res.success) {
        setUsers(res.data || []);
        setTotal(res.total || 0);
      }
      setSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setFeedback({ type: 'error', message: 'Failed to search users: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const selectUser = async (u) => {
    setSelectedUser(u);
    setAdjustAmount('');
    setAdjustReason('');
    setFeedback(null);
    try {
      setHistoryLoading(true);
      const res = await apiClient.get(`/user-management/admin/credits/users/${u.id}`, { limit: 50 });
      if (res.success) {
        setUserHistory(res.data.history || []);
        setSelectedUser(prev => ({ ...prev, credits: res.data.user.credits, totalEarned: res.data.user.totalEarned, totalSpent: res.data.user.totalSpent }));
      }
    } catch (err) {
      console.error('Fetch user detail failed:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjust = async () => {
    const amt = parseFloat(adjustAmount);
    if (!amt || amt === 0) return;
    if (!adjustReason.trim()) { setFeedback({ type: 'error', message: 'Please provide a reason' }); return; }

    const action = amt > 0 ? `add ${amt} credits to` : `deduct ${Math.abs(amt)} credits from`;
    if (!window.confirm(`Are you sure you want to ${action} ${selectedUser.name || selectedUser.email}?`)) return;

    try {
      setAdjusting(true);
      setFeedback(null);
      const res = await apiClient.post('/user-management/admin/credits/adjust', {
        userId: selectedUser.id,
        amount: amt,
        description: adjustReason.trim()
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setAdjustAmount('');
        setAdjustReason('');
        await selectUser(selectedUser);
        searchUsers(searchTerm);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Adjustment failed' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setAdjusting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!canAccess) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
        <h2 style={{ color: '#1d2939' }}>Access Denied</h2>
        <p style={{ color: '#6b7280' }}>Only Admin and Accountant roles can access Credits Management.</p>
        <button onClick={() => navigate('/employee')} style={{ marginTop: 16, padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Back to Employee Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <button onClick={() => navigate('/employee')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0, marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1d2939' }}>Credits Management</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.85rem' }}>Search users and manage their credit balances</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.85rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <Coins size={18} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>Admin</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers(searchTerm)}
            placeholder="Search by email, name, or company..."
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
        <button onClick={() => searchUsers(searchTerm)}
          style={{ padding: '0 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search size={16} /> Search
        </button>
        <button onClick={() => searchUsers('')}
          style={{ padding: '0 1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          All Users
        </button>
      </div>

      {/* Main Content — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* Left: User List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading...</p>
            </div>
          ) : searched && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <User size={32} style={{ marginBottom: 8 }} />
              <p>No users found</p>
            </div>
          ) : users.length > 0 ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#6b7280' }}>
                {total} user{total !== 1 ? 's' : ''} found
              </div>
              <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                      background: selectedUser?.id === u.id ? '#eff6ff' : '#fff',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d2939' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{u.email}</div>
                        {u.company && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.company}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1d4ed8' }}>{u.credits}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>credits</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '1px dashed #d1d5db', borderRadius: 10 }}>
              <Search size={32} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Search for users to manage their credits</p>
            </div>
          )}
        </div>

        {/* Right: Selected User Detail */}
        {selectedUser && (
          <div>
            {/* User Info Card */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0c4a6e' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{selectedUser.email}</div>
                  {selectedUser.company && <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{selectedUser.company}</div>}
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                <div style={{ padding: '0.85rem', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8' }}>{selectedUser.credits}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Current Balance</div>
                </div>
                <div style={{ padding: '0.85rem', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{selectedUser.totalEarned}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Total Earned</div>
                </div>
                <div style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>{selectedUser.totalSpent}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Total Spent</div>
                </div>
              </div>
            </div>

            {/* Adjust Credits Form */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#1d2939' }}>Adjust Credits</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Amount (+ to add, − to deduct)"
                  style={{ flex: 1, padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}
                />
              </div>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason (required)..."
                style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.85rem', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { if (!adjustAmount) setAdjustAmount('100'); else handleAdjust(); }}
                  disabled={adjusting}
                  style={{ flex: 1, padding: '0.55rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowUpCircle size={14} /> {adjusting ? 'Processing...' : 'Add Credits'}
                </button>
                <button
                  onClick={() => {
                    if (!adjustAmount) { setAdjustAmount('-100'); }
                    else {
                      const val = parseFloat(adjustAmount);
                      if (val > 0) setAdjustAmount(String(-val));
                      else handleAdjust();
                    }
                  }}
                  disabled={adjusting}
                  style={{ flex: 1, padding: '0.55rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowDownCircle size={14} /> Deduct Credits
                </button>
              </div>
              {feedback && (
                <div style={{ marginTop: 8, padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                  background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: feedback.type === 'success' ? '#15803d' : '#dc2626',
                  border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                  {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {feedback.message}
                </div>
              )}
            </div>

            {/* Credit History */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.88rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Credit History
              </div>
              {historyLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
              ) : userHistory.length > 0 ? (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {userHistory.map((item, idx) => (
                    <div key={item.id || idx} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        {item.type === 'earn' || item.type === 'refund' || (item.type === 'admin_adjust' && item.amount > 0) ? (
                          <ArrowUpCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        ) : (
                          <ArrowDownCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{formatDate(item.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: item.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                          {item.amount >= 0 ? '+' : ''}{item.amount}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>bal: {item.balance_after}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>No credit history</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsAdmin;
