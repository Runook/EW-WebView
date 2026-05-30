import React, { useState, useEffect, useRef } from 'react';
import employeeApiExports from '../config/employeeApi';
import './CompanyEditableCell.css';

const { customerApi } = employeeApiExports;

const CompanyEditableCell = ({ value, orderId, onSave, tentative = false }) => {
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
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimerRef = useRef(null);

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

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    // 200ms 防抖；以最后一次输入为准，避免快打字时结果错位
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const trimmed = newValue.trim();
    if (trimmed.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }
    setShowSuggestions(true);
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const response = await customerApi.searchCustomers(trimmed);
        setSuggestions(response.data || []);
      } catch (error) {
        console.error('搜索失败:', error);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 200);
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
    // tentative（AI 识别待确认）时，即使值没变也要保存一次以写入"已确认"标记
    if (valueToSave === value && !tentative) {
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
    // 空值或历史遗留的占位文本"新建订单"都显示为灰色提示，引导用户填写
    const isEmpty = !value || value === '新建订单' || value === '-';
    // AI 识别但未确认：灰色显示，点击确认 / 双击编辑后转为正式(黑色)
    const showTentative = tentative && !isEmpty;
    return (
      <div
        className={`editable-cell-display${isEmpty ? ' editable-cell-empty' : ''}${showTentative ? ' editable-cell-tentative' : ''}`}
        onDoubleClick={() => setIsEditing(true)}
        onClick={showTentative ? (e) => { e.stopPropagation(); handleSave(value); } : undefined}
        title={showTentative ? 'AI 识别（待确认）—— 单击确认，双击编辑' : '双击编辑'}
      >
        {isEmpty ? '请输入公司名' : value}
        {showTentative && <span className="tentative-badge">待确认</span>}
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

      {showSuggestions && editValue.trim() && (
        <div className="suggestions-dropdown-small">
          {searching && (
            <div className="suggestion-status-small">搜索中…</div>
          )}

          {!searching && suggestions.length > 0 && (
            <div className="suggestion-header-small">选择已存在的客户：</div>
          )}
          {!searching && suggestions.length === 0 && (
            <div className="suggestion-status-small">未找到匹配的客户</div>
          )}

          {suggestions.map((customer) => {
            const exactMatch = customer.company_name.toLowerCase() === editValue.trim().toLowerCase();
            return (
              <div
                key={customer.id}
                className={`suggestion-item-small${exactMatch ? ' suggestion-exact' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(customer);
                }}
              >
                <div className="suggestion-company-small">
                  {customer.company_name}
                  {exactMatch && <span className="suggestion-badge-small">精确匹配</span>}
                </div>
                {customer.wechat_group_name && (
                  <div className="suggestion-wechat-small">微信: {customer.wechat_group_name}</div>
                )}
              </div>
            );
          })}

          {/* 无精确匹配时才显示"创建新客户" */}
          {!searching && !suggestions.some(
            c => c.company_name.toLowerCase() === editValue.trim().toLowerCase()
          ) && (
            <div
              className="suggestion-create-small"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateNew();
              }}
            >
              + 创建新客户 "{editValue.trim()}"
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

