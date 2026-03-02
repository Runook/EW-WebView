import React, { useState, useEffect } from 'react';
import { employeeApi, employeeUtils } from '../config/employeeApi';
import './EmployeeAdmin.css';

const EmployeeAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSetEmployeeModal, setShowSetEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ userId: '', role: 'employee', employeeId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Stats dashboard
  const [statsPeriod, setStatsPeriod] = useState('monthly');
  const [statsDateFrom, setStatsDateFrom] = useState('');
  const [statsDateTo, setStatsDateTo] = useState('');
  const [employeeStats, setEmployeeStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedEmployeeForStats, setSelectedEmployeeForStats] = useState(null);
  const [periodData, setPeriodData] = useState([]);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true); setError(null);
      const response = await employeeApi.getAllEmployees();
      if (response.success) setEmployees(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  const loadDetailedStats = async (empId) => {
    setStatsLoading(true);
    try {
      const params = { period: statsPeriod };
      if (statsDateFrom) params.date_from = statsDateFrom;
      if (statsDateTo) params.date_to = statsDateTo;
      const res = await employeeApi.getEmployeeDetailedStats(empId, params);
      if (res.success) {
        setEmployeeStats(prev => ({ ...prev, [empId]: res.data.summary }));
        setPeriodData(res.data.periods || []);
      }
    } catch (e) { console.error('Stats load failed:', e); }
    finally { setStatsLoading(false); }
  };

  useEffect(() => {
    if (selectedEmployeeForStats) loadDetailedStats(selectedEmployeeForStats);
  }, [statsPeriod, statsDateFrom, statsDateTo, selectedEmployeeForStats]);

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const response = await employeeApi.searchUsers(query);
      if (response.success) setSearchResults(response.data);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNewEmployee({ ...newEmployee, userId: user.id.toString() });
    setSearchQuery(`${user.email} - ${user.first_name} ${user.last_name}`);
    setSearchResults([]);
  };

  const handleSetEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.userId) { alert('Please search and select a user first'); return; }
    try {
      const response = await employeeApi.setUserAsEmployee(parseInt(newEmployee.userId), newEmployee.role, newEmployee.employeeId || null);
      if (response.success) {
        alert('Employee added!');
        handleCloseModal();
        loadEmployees();
      }
    } catch (err) { alert(err.message || 'Failed'); }
  };

  const handleCloseModal = () => {
    setShowSetEmployeeModal(false);
    setNewEmployee({ userId: '', role: 'employee', employeeId: '' });
    setSearchQuery(''); setSelectedUser(null); setSearchResults([]);
  };

  const handleUpdateRole = async (employeeId, newRole) => {
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try { await employeeApi.updateEmployee(employeeId, { employee_role: newRole }); loadEmployees(); }
    catch (err) { alert(err.message || 'Failed'); }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!window.confirm('Remove this employee? This does not delete the user account.')) return;
    try { await employeeApi.removeEmployee(employeeId); loadEmployees(); }
    catch (err) { alert(err.message || 'Failed'); }
  };

  const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const fmtPeriod = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (statsPeriod === 'daily') return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (statsPeriod === 'weekly') return `Week of ${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (statsPeriod === 'yearly') return dt.getFullYear().toString();
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  if (loading) {
    return <div className="employee-admin-container"><div className="loading"><div style={{ fontSize: 20, fontWeight: 700, color: '#34C759' }}>Welogx</div><div className="loading-bar"></div></div></div>;
  }

  return (
    <div className="employee-admin-container">
      <div className="admin-header">
        <div><h1>System Admin</h1><p>Manage employees and view statistics</p></div>
        <button className="btn-add-employee" onClick={() => setShowSetEmployeeModal(true)}>+ Add Employee</button>
      </div>

      {error && <div className="error-message"><p>{error}</p><button onClick={loadEmployees}>Retry</button></div>}

      {/* Employee List */}
      <div className="employees-section">
        <h2 style={{ marginBottom: 12 }}>Employees ({employees.length})</h2>
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={empThStyle}>Name</th>
                <th style={empThStyle}>Email</th>
                <th style={empThStyle}>ID</th>
                <th style={empThStyle}>Role</th>
                <th style={empThStyle}>Orders</th>
                <th style={empThStyle}>Completed</th>
                <th style={empThStyle}>Revenue</th>
                <th style={empThStyle}>Since</th>
                <th style={empThStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}
                  onClick={() => setSelectedEmployeeForStats(emp.id)}
                  style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: selectedEmployeeForStats === emp.id ? '#eff6ff' : '#fff' }}>
                  <td style={empTdStyle}><strong>{emp.first_name} {emp.last_name}</strong></td>
                  <td style={{ ...empTdStyle, color: '#6b7280', fontSize: 12 }}>{emp.email}</td>
                  <td style={{ ...empTdStyle, fontFamily: 'monospace', fontSize: 11 }}>{emp.employee_id}</td>
                  <td style={empTdStyle}>
                    <select value={emp.employee_role}
                      onChange={(e) => { e.stopPropagation(); handleUpdateRole(emp.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '3px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, background: '#fff' }}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ ...empTdStyle, textAlign: 'center' }}>{emp.stats?.totalOrders || 0}</td>
                  <td style={{ ...empTdStyle, textAlign: 'center', color: '#10b981' }}>{emp.stats?.completedOrders || 0}</td>
                  <td style={{ ...empTdStyle, textAlign: 'right', color: '#1565C0', fontWeight: 600 }}>${(emp.stats?.totalRevenue || 0).toLocaleString()}</td>
                  <td style={{ ...empTdStyle, fontSize: 11, color: '#9ca3af' }}>{fmtDate(emp.employee_since)}</td>
                  <td style={empTdStyle}>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveEmployee(emp.id); }}
                      style={{ padding: '3px 10px', border: '1px solid #fecaca', borderRadius: 4, background: '#fef2f2', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Dashboard */}
      {selectedEmployeeForStats && (
        <div className="stats-dashboard" style={{ marginTop: 24, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Stats: {employees.find(e => e.id === selectedEmployeeForStats)?.first_name} {employees.find(e => e.id === selectedEmployeeForStats)?.last_name}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                <button key={p} onClick={() => setStatsPeriod(p)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: statsPeriod === p ? '2px solid #1565C0' : '1px solid #ddd',
                    background: statsPeriod === p ? '#e3f2fd' : '#fff', color: statsPeriod === p ? '#1565C0' : '#666',
                    fontWeight: statsPeriod === p ? 600 : 400, cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' }}>
                  {p}
                </button>
              ))}
              <input type="date" value={statsDateFrom} onChange={(e) => setStatsDateFrom(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }} />
              <span style={{ color: '#999', fontSize: 12 }}>to</span>
              <input type="date" value={statsDateTo} onChange={(e) => setStatsDateTo(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }} />
            </div>
          </div>

          {/* Summary Cards */}
          {(() => {
            const s = employeeStats[selectedEmployeeForStats] || {};
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Orders', value: s.totalOrders || 0, color: '#374151' },
                  { label: 'Completed', value: s.completedOrders || 0, color: '#10b981' },
                  { label: 'In Progress', value: s.orderedOrders || 0, color: '#3b82f6' },
                  { label: 'Revenue', value: `$${(s.totalRevenue || 0).toLocaleString()}`, color: '#1565C0' },
                  { label: 'Profit', value: `$${(s.totalProfit || 0).toLocaleString()}`, color: '#059669' },
                  { label: 'Paid', value: s.paidCount || 0, color: '#10b981' },
                  { label: 'Unpaid', value: s.unpaidCount || 0, color: '#ef4444' },
                  { label: 'Partial', value: s.partialCount || 0, color: '#f59e0b' },
                ].map((card, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Period Breakdown Table */}
          {statsLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Loading...</div>
          ) : periodData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={thStyle}>Period</th>
                    <th style={thStyle}>Orders</th>
                    <th style={thStyle}>Completed</th>
                    <th style={thStyle}>Revenue</th>
                    <th style={thStyle}>Profit</th>
                    <th style={thStyle}>Paid</th>
                    <th style={thStyle}>Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {periodData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={tdStyle}>{fmtPeriod(row.period)}</td>
                      <td style={tdStyle}>{row.totalOrders}</td>
                      <td style={tdStyle}>{row.completed}</td>
                      <td style={{ ...tdStyle, color: '#1565C0', fontWeight: 600 }}>${parseFloat(row.revenue).toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: '#059669' }}>${parseFloat(row.profit).toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: '#10b981' }}>{row.paid}</td>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{row.unpaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>No data for this period</div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showSetEmployeeModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="modal-close" onClick={handleCloseModal}>&#10005;</button>
            </div>
            <form onSubmit={handleSetEmployee}>
              <div className="form-group">
                <label>Search User *</label>
                <input type="text" required value={searchQuery} onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Search by email or name" autoComplete="off" />
                <small>Search registered users who are not yet employees</small>
                {searching && <div className="search-results"><div className="search-loading">Searching...</div></div>}
                {!searching && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user) => (
                      <div key={user.id} className="search-result-item" onClick={() => handleSelectUser(user)}>
                        <div className="user-info"><strong>{user.email}</strong><span className="user-name">{user.first_name} {user.last_name}</span></div>
                        <small className="user-id">ID: {user.id}</small>
                      </div>
                    ))}
                  </div>
                )}
                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="search-results"><div className="no-results">No matching users found</div></div>
                )}
              </div>
              {selectedUser && (
                <div className="selected-user-info">
                  <strong>Selected:</strong> {selectedUser.email} ({selectedUser.first_name} {selectedUser.last_name})
                </div>
              )}
              <div className="form-group">
                <label>Role *</label>
                <select required value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Employee ID (optional)</label>
                <input type="text" value={newEmployee.employeeId} onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})} placeholder="Auto-generated if empty" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit" disabled={!selectedUser}>Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#444', fontSize: 12, borderBottom: '2px solid #e5e7eb' };
const tdStyle = { padding: '10px 12px', fontSize: 13 };
const empThStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' };
const empTdStyle = { padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap' };

export default EmployeeAdmin;
