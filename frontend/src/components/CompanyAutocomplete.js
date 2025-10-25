import React, { useState, useEffect, useRef } from 'react';
import employeeApiExports from '../config/employeeApi';
import './CompanyAutocomplete.css';

const { customerApi } = employeeApiExports;

const CompanyAutocomplete = ({ value, onChange, placeholder = "输入询价公司或微信群名称..." }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    company_name: '',
    wechat_group_name: ''
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // 点击外部关闭建议列表
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim().length >= 1) {
      try {
        const response = await customerApi.searchCustomers(newValue);
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('搜索客户失败:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (customer) => {
    setInputValue(customer.company_name);
    onChange(customer.company_name);
    setShowSuggestions(false);
  };

  const handleCreateNew = () => {
    setNewCustomerData({
      company_name: inputValue,
      wechat_group_name: ''
    });
    setShowCreateModal(true);
    setShowSuggestions(false);
  };

  const handleSubmitNewCustomer = async (e) => {
    e.preventDefault();
    
    try {
      const response = await customerApi.createCustomer(newCustomerData);
      alert('客户创建成功！');
      setInputValue(newCustomerData.company_name);
      onChange(newCustomerData.company_name);
      setShowCreateModal(false);
    } catch (error) {
      alert('创建失败: ' + error.message);
    }
  };

  return (
    <div className="company-autocomplete" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue && setShowSuggestions(true)}
        placeholder={placeholder}
        className="autocomplete-input"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((customer) => (
            <div
              key={customer.id}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(customer)}
            >
              <div className="suggestion-company">{customer.company_name}</div>
              {customer.wechat_group_name && (
                <div className="suggestion-wechat">微信群: {customer.wechat_group_name}</div>
              )}
            </div>
          ))}
          <div className="suggestion-create" onClick={handleCreateNew}>
            + 创建新客户 "{inputValue}"
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && inputValue.trim() && (
        <div className="suggestions-dropdown">
          <div className="suggestion-create" onClick={handleCreateNew}>
            + 创建新客户 "{inputValue}"
          </div>
        </div>
      )}

      {/* 创建新客户模态框 */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content-small">
            <div className="modal-header">
              <h3>创建新客户</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitNewCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>询价公司 *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.company_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, company_name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>微信群名称</label>
                  <input
                    type="text"
                    value={newCustomerData.wechat_group_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, wechat_group_name: e.target.value})}
                    placeholder="可选"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
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

export default CompanyAutocomplete;

