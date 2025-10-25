import React, { useState, useEffect, useRef } from 'react';
import employeeApiExports from '../config/employeeApi';
import './CompanyEditableCell.css';

const { customerApi } = employeeApiExports;

const CompanyEditableCell = ({ value, orderId, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    company_name: '',
    wechat_group_name: ''
  });
  const [saving, setSaving] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (!showCreateModal) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCreateModal]);

  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    if (newValue.trim().length >= 1) {
      try {
        const response = await customerApi.searchCustomers(newValue);
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('搜索失败:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (customer) => {
    setEditValue(customer.company_name);
    setShowSuggestions(false);
    // 立即保存
    await handleSave(customer.company_name);
  };

  const handleCreateNew = () => {
    setNewCustomerData({
      company_name: editValue,
      wechat_group_name: ''
    });
    setShowCreateModal(true);
    setShowSuggestions(false);
  };

  const handleSubmitNewCustomer = async (e) => {
    e.preventDefault();
    
    try {
      await customerApi.createCustomer(newCustomerData);
      setEditValue(newCustomerData.company_name);
      setShowCreateModal(false);
      // 保存到订单
      await handleSave(newCustomerData.company_name);
    } catch (error) {
      alert('创建客户失败: ' + error.message);
    }
  };

  const handleSave = async (valueToSave = editValue) => {
    if (valueToSave === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(orderId, 'inquiry_company', valueToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showSuggestions) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
      setShowSuggestions(false);
    }
  };

  if (!isEditing) {
    return (
      <div 
        className="editable-cell-display" 
        onDoubleClick={() => setIsEditing(true)}
        title="双击编辑"
      >
        {value || '-'}
      </div>
    );
  }

  return (
    <div className="company-editable-cell" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onBlur={() => {
          if (!showSuggestions && !showCreateModal) {
            setTimeout(() => handleSave(), 100);
          }
        }}
        disabled={saving}
        className="editable-input"
      />

      {showSuggestions && (suggestions.length > 0 || editValue.trim()) && (
        <div className="suggestions-dropdown-small">
          {suggestions.map((customer) => (
            <div
              key={customer.id}
              className="suggestion-item-small"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(customer);
              }}
            >
              <div className="suggestion-company-small">{customer.company_name}</div>
              {customer.wechat_group_name && (
                <div className="suggestion-wechat-small">微信: {customer.wechat_group_name}</div>
              )}
            </div>
          ))}
          {editValue.trim() && (
            <div
              className="suggestion-create-small"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateNew();
              }}
            >
              + 创建新客户 "{editValue}"
            </div>
          )}
        </div>
      )}

      {/* 创建新客户模态框 */}
      {showCreateModal && (
        <div className="modal-overlay-inline" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content-inline">
            <div className="modal-header-inline">
              <h4>创建新客户</h4>
              <button 
                className="close-btn-inline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setIsEditing(false);
                }}
              >×</button>
            </div>

            <form onSubmit={handleSubmitNewCustomer}>
              <div className="modal-body-inline">
                <div className="form-group-inline">
                  <label>询价公司 *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.company_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, company_name: e.target.value})}
                  />
                </div>

                <div className="form-group-inline">
                  <label>微信群名称</label>
                  <input
                    type="text"
                    value={newCustomerData.wechat_group_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, wechat_group_name: e.target.value})}
                    placeholder="可选"
                  />
                </div>
              </div>

              <div className="modal-footer-inline">
                <button 
                  type="button" 
                  className="btn-cancel-inline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsEditing(false);
                  }}
                >
                  取消
                </button>
                <button type="submit" className="btn-submit-inline">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyEditableCell;

