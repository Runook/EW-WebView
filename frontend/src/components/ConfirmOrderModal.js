import React, { useState, useEffect, useCallback } from 'react';
import { truckContactApi } from '../config/employeeApi';
import './ConfirmOrderModal.css';

const ConfirmOrderModal = ({ order, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    truck_payment: '',
    truck_reference_price: '', // 卡车参考价（选填）
    mc_number: '',
    truck_company_name: '',
    truck_contact: '',
    backup_driver_1_name: '',
    backup_driver_1_phone: '',
    backup_driver_2_name: '',
    backup_driver_2_phone: '',
    backup_driver_3_name: '',
    backup_driver_3_phone: ''
  });

  const [errors, setErrors] = useState({});
  
  // 联系簿相关状态
  const [showContactBook, setShowContactBook] = useState(false);
  const [contactBookSearch, setContactBookSearch] = useState('');
  const [contactBookResults, setContactBookResults] = useState([]);
  const [contactBookLoading, setContactBookLoading] = useState(false);
  
  // 自动补全相关状态
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null);
  

  // 防抖搜索
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // 搜索联系簿
  const searchContactBook = async (keyword) => {
    if (!keyword || keyword.trim().length < 1) {
      setContactBookResults([]);
      return;
    }
    
    setContactBookLoading(true);
    try {
      const response = await truckContactApi.getContacts(keyword);
      if (response.success) {
        setContactBookResults(response.data || []);
      }
    } catch (error) {
      console.error('搜索联系簿失败:', error);
    } finally {
      setContactBookLoading(false);
    }
  };

  // 搜索自动补全建议
  const searchSuggestions = async (value, field) => {
    if (!value || value.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const response = await truckContactApi.searchContacts(value, field);
      if (response.success && response.data?.length > 0) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('搜索建议失败:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 防抖版本的搜索
  const debouncedSearchSuggestions = useCallback(
    debounce((value, field) => searchSuggestions(value, field), 300),
    []
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // 触发自动补全（仅对 MC Number、公司名、联络方式）
    if (['mc_number', 'truck_company_name', 'truck_contact'].includes(field)) {
      setActiveField(field);
      debouncedSearchSuggestions(value, field);
    }
  };

  // 选择联系人（从联系簿或建议中）
  const selectContact = (contact) => {
    setFormData(prev => ({
      ...prev,
      mc_number: contact.mc_number || prev.mc_number,
      truck_company_name: contact.truck_company_name || prev.truck_company_name,
      truck_contact: contact.truck_contact || prev.truck_contact
    }));
    setShowContactBook(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setContactBookSearch('');
    setContactBookResults([]);
  };


  const validate = () => {
    const newErrors = {};
    
    if (!formData.truck_payment || formData.truck_payment.trim() === '') {
      newErrors.truck_payment = '付卡车价格不能为空';
    } else if (isNaN(parseFloat(formData.truck_payment))) {
      newErrors.truck_payment = '请输入有效的数字';
    }
    
    if (!formData.mc_number || formData.mc_number.trim() === '') {
      newErrors.mc_number = 'MC Number不能为空';
    }
    
    if (!formData.truck_company_name || formData.truck_company_name.trim() === '') {
      newErrors.truck_company_name = '卡车公司名不能为空';
    }
    
    if (!formData.truck_contact || formData.truck_contact.trim() === '') {
      newErrors.truck_contact = '联络方式不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onConfirm(formData);
    }
  };

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="modal-overlay-confirm" onClick={onClose}>
      <div className="modal-content-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-confirm">
          <h2>确认下单</h2>
          <button className="modal-close-confirm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-confirm">
          {/* 订单信息概览 */}
          <div className="order-summary">
            <h3>订单信息</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">WE单号:</span>
                <span className="value">{order.ew_quote_number || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">询价公司:</span>
                <span className="value">{order.inquiry_company || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">日期:</span>
                <span className="value">{order.quote_date ? new Date(order.quote_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">WE报价:</span>
                <span className="value">${order.ew_quote_price ? parseFloat(order.ew_quote_price).toLocaleString() : '-'}</span>
              </div>
              <div className="summary-item full-width">
                <span className="label">线路:</span>
                <span className="value">{order.origin_city || '-'} → {order.destination_city || '-'}</span>
              </div>
            </div>
          </div>

          {/* 下单表单 */}
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-section-header">
                <h3>卡车信息 <span className="required">*必填</span></h3>
                <div className="contact-book-actions">
                  <button 
                    type="button" 
                    className="btn-contact-book"
                    onClick={() => setShowContactBook(!showContactBook)}
                  >
                    📒 联系簿
                  </button>
                </div>
              </div>
              
              
              {/* 联系簿弹出框 */}
              {showContactBook && (
                <div className="contact-book-popup">
                  <div className="contact-book-header">
                    <input
                      type="text"
                      placeholder="搜索 MC Number / 公司名 / 联络方式..."
                      value={contactBookSearch}
                      onChange={(e) => {
                        setContactBookSearch(e.target.value);
                        searchContactBook(e.target.value);
                      }}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowContactBook(false)}>✕</button>
                  </div>
                  <div className="contact-book-list">
                    {contactBookLoading ? (
                      <div className="contact-book-loading">搜索中...</div>
                    ) : contactBookResults.length > 0 ? (
                      contactBookResults.map(contact => (
                        <div 
                          key={contact.id} 
                          className="contact-book-item"
                          onClick={() => selectContact(contact)}
                        >
                          <div className="contact-mc">{contact.mc_number}</div>
                          <div className="contact-company">{contact.truck_company_name}</div>
                          <div className="contact-phone">{contact.truck_contact}</div>
                        </div>
                      ))
                    ) : contactBookSearch ? (
                      <div className="contact-book-empty">未找到匹配的联系人</div>
                    ) : (
                      <div className="contact-book-empty">输入关键字搜索联系人</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label>付卡车价格 <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.truck_payment}
                    onChange={(e) => handleChange('truck_payment', e.target.value)}
                    placeholder="请输入付卡车价格"
                    className={errors.truck_payment ? 'error' : ''}
                  />
                  {errors.truck_payment && <span className="error-message">{errors.truck_payment}</span>}
                </div>

                <div className="form-group">
                  <label>卡车参考价 <span className="optional">(选填)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.truck_reference_price}
                    onChange={(e) => handleChange('truck_reference_price', e.target.value)}
                    placeholder="参考报价"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group autocomplete-wrapper">
                  <label>MC Number <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.mc_number}
                    onChange={(e) => handleChange('mc_number', e.target.value)}
                    onFocus={() => setActiveField('mc_number')}
                    placeholder="请输入MC Number"
                    className={errors.mc_number ? 'error' : ''}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {errors.mc_number && <span className="error-message">{errors.mc_number}</span>}
                  
                  {/* 自动补全建议 */}
                  {showSuggestions && activeField === 'mc_number' && suggestions.length > 0 && (
                    <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
                      {suggestions.map(s => (
                        <div key={s.id} className="suggestion-item" onClick={() => selectContact(s)}>
                          <span className="suggestion-mc">{s.mc_number}</span>
                          <span className="suggestion-company">{s.truck_company_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group autocomplete-wrapper">
                  <label>卡车公司名 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.truck_company_name}
                    onChange={(e) => handleChange('truck_company_name', e.target.value)}
                    onFocus={() => setActiveField('truck_company_name')}
                    placeholder="请输入卡车公司名"
                    className={errors.truck_company_name ? 'error' : ''}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {errors.truck_company_name && <span className="error-message">{errors.truck_company_name}</span>}
                  
                  {/* 自动补全建议 */}
                  {showSuggestions && activeField === 'truck_company_name' && suggestions.length > 0 && (
                    <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
                      {suggestions.map(s => (
                        <div key={s.id} className="suggestion-item" onClick={() => selectContact(s)}>
                          <span className="suggestion-company">{s.truck_company_name}</span>
                          <span className="suggestion-mc">{s.mc_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group autocomplete-wrapper">
                  <label>联络方式 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.truck_contact}
                    onChange={(e) => handleChange('truck_contact', e.target.value)}
                    onFocus={() => setActiveField('truck_contact')}
                    placeholder="请输入联络方式"
                    className={errors.truck_contact ? 'error' : ''}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {errors.truck_contact && <span className="error-message">{errors.truck_contact}</span>}
                  
                  {/* 自动补全建议 */}
                  {showSuggestions && activeField === 'truck_contact' && suggestions.length > 0 && (
                    <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
                      {suggestions.map(s => (
                        <div key={s.id} className="suggestion-item" onClick={() => selectContact(s)}>
                          <span className="suggestion-phone">{s.truck_contact}</span>
                          <span className="suggestion-company">{s.truck_company_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 备用司机信息 */}
            <div className="form-section backup-section">
              <h3>备用司机信息 <span className="optional">(选填)</span></h3>
              
              {/* 备用司机1 */}
              <div className="backup-driver-group">
                <div className="backup-header">备用司机 1</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      value={formData.backup_driver_1_name}
                      onChange={(e) => handleChange('backup_driver_1_name', e.target.value)}
                      placeholder="备用司机姓名"
                    />
                  </div>
                  <div className="form-group">
                    <label>电话</label>
                    <input
                      type="tel"
                      value={formData.backup_driver_1_phone}
                      onChange={(e) => handleChange('backup_driver_1_phone', e.target.value)}
                      placeholder="备用司机电话"
                    />
                  </div>
                </div>
              </div>

              {/* 备用司机2 */}
              <div className="backup-driver-group">
                <div className="backup-header">备用司机 2</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      value={formData.backup_driver_2_name}
                      onChange={(e) => handleChange('backup_driver_2_name', e.target.value)}
                      placeholder="备用司机姓名"
                    />
                  </div>
                  <div className="form-group">
                    <label>电话</label>
                    <input
                      type="tel"
                      value={formData.backup_driver_2_phone}
                      onChange={(e) => handleChange('backup_driver_2_phone', e.target.value)}
                      placeholder="备用司机电话"
                    />
                  </div>
                </div>
              </div>

              {/* 备用司机3 */}
              <div className="backup-driver-group">
                <div className="backup-header">备用司机 3</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      value={formData.backup_driver_3_name}
                      onChange={(e) => handleChange('backup_driver_3_name', e.target.value)}
                      placeholder="备用司机姓名"
                    />
                  </div>
                  <div className="form-group">
                    <label>电话</label>
                    <input
                      type="tel"
                      value={formData.backup_driver_3_phone}
                      onChange={(e) => handleChange('backup_driver_3_phone', e.target.value)}
                      placeholder="备用司机电话"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="modal-actions-confirm">
              <button type="button" className="btn-cancel-confirm" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn-submit-confirm">
                确认下单
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;
