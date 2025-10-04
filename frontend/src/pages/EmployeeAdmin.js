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

  const handleSetEmployee = async (e) => {
    e.preventDefault();
    
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
        loadEmployees();
      }
    } catch (err) {
      console.error('设置员工失败:', err);
      alert(err.message || '设置失败');
    }
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
        <div className="modal-overlay" onClick={() => setShowSetEmployeeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加员工</h2>
              <button className="modal-close" onClick={() => setShowSetEmployeeModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSetEmployee}>
              <div className="form-group">
                <label>用户ID *</label>
                <input
                  type="number"
                  required
                  value={newEmployee.userId}
                  onChange={(e) => setNewEmployee({...newEmployee, userId: e.target.value})}
                  placeholder="输入现有用户的ID"
                />
                <small>请输入系统中已存在用户的ID</small>
              </div>

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
                <button type="button" onClick={() => setShowSetEmployeeModal(false)} className="btn-cancel">
                  取消
                </button>
                <button type="submit" className="btn-submit">
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

