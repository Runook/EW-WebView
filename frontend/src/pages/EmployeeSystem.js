import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { employeeApi } from '../config/employeeApi';
import './EmployeeSystem.css';

const EmployeeSystem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkEmployeeStatus();
  }, []);

  const checkEmployeeStatus = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getCurrentEmployee();
      
      if (response.success) {
        setEmployeeInfo(response.data);
      }
    } catch (err) {
      console.error('获取员工信息失败:', err);
      setError('您不是员工或获取信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-system-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !employeeInfo) {
    return (
      <div className="employee-system-container">
        <div className="error-message">
          <h2>⚠️ 访问受限</h2>
          <p>{error || '您没有访问员工系统的权限'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const { stats, employee_role } = employeeInfo;

  return (
    <div className="employee-system-container">
      <div className="employee-header">
        <div className="employee-welcome">
          <h1>EW 员工系统</h1>
          <p>欢迎回来, {employeeInfo.first_name} {employeeInfo.last_name}</p>
          <span className={`role-badge role-${employee_role}`}>
            {employee_role === 'admin' ? '管理员' : employee_role === 'manager' ? '经理' : '员工'}
          </span>
        </div>
        <div className="employee-id">
          <span>员工编号: {employeeInfo.employee_id}</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats?.totalOrders || 0}</h3>
            <p>总订单数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.completedOrders || 0}</h3>
            <p>已完成订单</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats?.inProgressOrders || 0}</h3>
            <p>进行中订单</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${(stats?.totalRevenue || 0).toLocaleString()}</h3>
            <p>总收入</p>
          </div>
        </div>
      </div>

      {/* 功能菜单 - 简洁版 */}
      <div className="function-menu">
        <h2>功能菜单</h2>
        <div className="menu-grid">
          <div 
            className="menu-card menu-card-primary" 
            onClick={() => navigate('/employee/broker-orders?status=quote')}
          >
            <h3>📋 订单管理</h3>
            <p>专业的陆运订单管理系统</p>
            <div className="menu-subtitle">报价单 · 已下单 · 已完成</div>
          </div>

          <div 
            className="menu-card menu-card-customers" 
            onClick={() => navigate('/employee/customers')}
          >
            <h3>👥 客户表</h3>
            <p>客户信息管理</p>
            <div className="menu-subtitle">询价公司 · 账单地址 · 付款条款</div>
          </div>

          <div 
            className="menu-card menu-card-vendors" 
            onClick={() => navigate('/employee/vendors')}
          >
            <h3>🚚 供应商管理</h3>
            <p>卡车公司和司机信息</p>
            <div className="menu-subtitle">MC# · 付款信息 · W9</div>
          </div>

          <div 
            className="menu-card menu-card-payments" 
            onClick={() => navigate('/employee/payments')}
          >
            <h3>💰 付款管理</h3>
            <p>收款和付款记录</p>
            <div className="menu-subtitle">客户收款 · 供应商付款</div>
          </div>

          {employee_role === 'admin' && (
            <div 
              className="menu-card" 
              onClick={() => navigate('/employee/admin')}
            >
              <h3>⚙️ 系统管理</h3>
              <p>员工管理和权限设置</p>
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="quick-actions">
        <h2>快捷操作</h2>
        <div className="actions-list">
          <button 
            className="action-btn"
            onClick={() => navigate('/employee/broker-orders/new')}
          >
            ➕ 新建报价单
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/employee/broker-orders?status=ordered&sub_status=waiting_driver')}
          >
            🚨 寻找司机
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/employee/broker-orders?status=ordered&sub_status=in_transit')}
          >
            🚚 运输中
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSystem;

