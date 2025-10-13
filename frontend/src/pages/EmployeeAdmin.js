import React, { useState, useEffect } from 'react';
import { employeeApi, employeeUtils } from '../config/employeeApi';
import './EmployeeAdmin.css';

const EmployeeAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSetEmployeeModal, setShowSetEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    userId: '',
    role: 'employee',
    employeeId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await employeeApi.getAllEmployees();
      
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error('加载员工列表失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await employeeApi.searchUsers(query);
      
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (err) {
      console.error('搜索用户失败:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNewEmployee({
      ...newEmployee,
      userId: user.id.toString()
    });
    setSearchQuery(`${user.email} - ${user.first_name} ${user.last_name}`);
    setSearchResults([]);
  };

  const handleSetEmployee = async (e) => {
    e.preventDefault();
    
    if (!newEmployee.userId) {
      alert('请先搜索并选择一个用户');
      return;
    }
    
    try {
      const response = await employeeApi.setUserAsEmployee(
        parseInt(newEmployee.userId),
        newEmployee.role,
        newEmployee.employeeId || null
      );
      
      if (response.success) {
        alert('员工设置成功！');
        setShowSetEmployeeModal(false);
        setNewEmployee({ userId: '', role: 'employee', employeeId: '' });
        setSearchQuery('');
        setSelectedUser(null);
        setSearchResults([]);
        loadEmployees();
      }
    } catch (err) {
      console.error('设置员工失败:', err);
      alert(err.message || '设置失败');
    }
  };

  const handleCloseModal = () => {
    setShowSetEmployeeModal(false);
    setNewEmployee({ userId: '', role: 'employee', employeeId: '' });
    setSearchQuery('');
    setSelectedUser(null);
    setSearchResults([]);
  };

  const handleUpdateRole = async (employeeId, newRole) => {
    if (!window.confirm(`确定要更改员工角色为 ${employeeUtils.getRoleLabel(newRole)} 吗？`)) {
      return;
    }
    
    try {
      await employeeApi.updateEmployee(employeeId, { employee_role: newRole });
      alert('角色更新成功！');
      loadEmployees();
    } catch (err) {
      console.error('更新角色失败:', err);
      alert(err.message || '更新失败');
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!window.confirm('确定要移除该员工身份吗？这不会删除用户账号。')) {
      return;
    }
    
    try {
      await employeeApi.removeEmployee(employeeId);
      alert('员工身份已移除！');
      loadEmployees();
    } catch (err) {
      console.error('移除员工失败:', err);
      alert(err.message || '移除失败');
    }
  };

  if (loading) {
    return (
      <div className="employee-admin-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-admin-container">
      <div className="admin-header">
        <div>
          <h1>系统管理</h1>
          <p>管理员工和系统设置</p>
        </div>
        <button className="btn-add-employee" onClick={() => setShowSetEmployeeModal(true)}>
          <span>➕</span>
          添加员工
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadEmployees}>重试</button>
        </div>
      )}

      {/* 员工列表 */}
      <div className="employees-section">
        <h2>员工列表 ({employees.length})</h2>
        
        <div className="employees-grid">
          {employees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="employee-card-header">
                <div className="employee-info">
                  <h3>{employee.first_name} {employee.last_name}</h3>
                  <p className="employee-email">{employee.email}</p>
                  <p className="employee-id-display">员工编号: {employee.employee_id}</p>
                </div>
                <span className={`role-badge role-${employee.employee_role}`}>
                  {employeeUtils.getRoleLabel(employee.employee_role)}
                </span>
              </div>

              <div className="employee-stats">
                <div className="stat-item">
                  <span className="stat-label">总订单</span>
                  <span className="stat-value">{employee.stats?.totalOrders || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">已完成</span>
                  <span className="stat-value">{employee.stats?.completedOrders || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">总收入</span>
                  <span className="stat-value">${(employee.stats?.totalRevenue || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="employee-actions">
                <select
                  value={employee.employee_role}
                  onChange={(e) => handleUpdateRole(employee.id, e.target.value)}
                  className="role-select"
                >
                  <option value="employee">员工</option>
                  <option value="manager">经理</option>
                  <option value="admin">管理员</option>
                </select>
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveEmployee(employee.id)}
                >
                  移除
                </button>
              </div>

              <div className="employee-meta">
                <small>加入时间: {employeeUtils.formatDate(employee.employee_since)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加员工模态框 */}
      {showSetEmployeeModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加员工</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSetEmployee}>
              <div className="form-group">
                <label>搜索用户 *</label>
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="输入用户的邮箱或姓名搜索"
                  autoComplete="off"
                />
                <small>搜索已注册但还不是员工的用户</small>
                
                {/* 搜索结果下拉列表 */}
                {searching && (
                  <div className="search-results">
                    <div className="search-loading">搜索中...</div>
                  </div>
                )}
                
                {!searching && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="search-result-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="user-info">
                          <strong>{user.email}</strong>
                          <span className="user-name">
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                        <small className="user-id">ID: {user.id}</small>
                      </div>
                    ))}
                  </div>
                )}
                
                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="search-results">
                    <div className="no-results">未找到匹配的用户</div>
                  </div>
                )}
              </div>
              
              {selectedUser && (
                <div className="selected-user-info">
                  <strong>已选择用户：</strong>
                  <div>{selectedUser.email}</div>
                  <div>{selectedUser.first_name} {selectedUser.last_name}</div>
                  <small>用户ID: {selectedUser.id}</small>
                </div>
              )}

              <div className="form-group">
                <label>角色 *</label>
                <select
                  required
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                >
                  <option value="employee">员工</option>
                  <option value="manager">经理</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              <div className="form-group">
                <label>员工编号（可选）</label>
                <input
                  type="text"
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                  placeholder="留空自动生成"
                />
                <small>格式: EWYY0001，留空将自动生成</small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  取消
                </button>
                <button type="submit" className="btn-submit" disabled={!selectedUser}>
                  确定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAdmin;

