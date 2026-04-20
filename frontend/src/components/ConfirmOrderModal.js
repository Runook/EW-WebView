import React, { useState, useEffect, useCallback } from 'react';
import { truckContactApi } from '../config/employeeApi';
import './ConfirmOrderModal.css';

const ConfirmOrderModal = ({ order, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    truck_payment: '',
    truck_reference_price: order?.truck_reference_price || '',
    mc_number: '',
    dot_number: '',
    truck_company_name: '',
    truck_contact: '',
    carrier_email: '',
    carrier_address: '',
    driver_name: '',
    driver_phone: '',
    backup_driver_1_name: '',
    backup_driver_1_phone: '',
    backup_driver_2_name: '',
    backup_driver_2_phone: '',
    backup_driver_3_name: '',
    backup_driver_3_phone: ''
  });

  const [errors, setErrors] = useState({});
  const [showContactBook, setShowContactBook] = useState(false);
  const [contactBookSearch, setContactBookSearch] = useState('');
  const [contactBookResults, setContactBookResults] = useState([]);
  const [contactBookLoading, setContactBookLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // 点外面 / ESC 时，如果有改动就二次确认；X 按钮直接关
  const guardedClose = useCallback(() => {
    if (isDirty && !window.confirm('有未保存的改动，确定关闭吗？')) return;
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') guardedClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [guardedClose]);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
  };

  const searchContactBook = async (keyword) => {
    if (!keyword || keyword.trim().length < 1) { setContactBookResults([]); return; }
    setContactBookLoading(true);
    try {
      const response = await truckContactApi.getContacts(keyword);
      if (response.success) setContactBookResults(response.data || []);
    } catch (error) { console.error('搜索联系簿失败:', error); }
    finally { setContactBookLoading(false); }
  };

  const searchSuggestions = async (value, field) => {
    if (!value || value.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const response = await truckContactApi.searchContacts(value, field);
      if (response.success && response.data?.length > 0) { setSuggestions(response.data); setShowSuggestions(true); }
      else { setSuggestions([]); setShowSuggestions(false); }
    } catch { setSuggestions([]); setShowSuggestions(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable debounced search; empty deps intentional
  const debouncedSearchSuggestions = useCallback(
    debounce((value, field) => searchSuggestions(value, field), 300),
    []
  );

  const handleChange = (field, value) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (['mc_number', 'truck_company_name', 'truck_contact', 'dot_number'].includes(field)) {
      setActiveField(field);
      debouncedSearchSuggestions(value, field);
    }
  };

  const selectContact = (contact) => {
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      mc_number: contact.mc_number || prev.mc_number,
      dot_number: contact.dot_number || prev.dot_number,
      truck_company_name: contact.truck_company_name || prev.truck_company_name,
      truck_contact: contact.truck_contact || prev.truck_contact,
      carrier_email: contact.carrier_email || prev.carrier_email
    }));
    setShowContactBook(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setContactBookSearch('');
    setContactBookResults([]);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.truck_payment || formData.truck_payment.trim() === '') newErrors.truck_payment = '付卡车价格不能为空';
    else if (isNaN(parseFloat(formData.truck_payment))) newErrors.truck_payment = '请输入有效的数字';
    if (!formData.mc_number?.trim()) newErrors.mc_number = 'MC# 不能为空';
    if (!formData.dot_number?.trim()) newErrors.dot_number = 'DOT# 不能为空';
    if (!formData.truck_company_name?.trim()) newErrors.truck_company_name = '卡车公司名不能为空';
    if (!formData.truck_contact?.trim()) newErrors.truck_contact = '公司联络方式不能为空';
    if (!formData.carrier_email?.trim()) newErrors.carrier_email = 'Carrier Email 不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onConfirm(formData);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const renderSuggestions = (field) => {
    if (!showSuggestions || activeField !== field || suggestions.length === 0) return null;
    return (
      <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
        {suggestions.map(s => (
          <div key={s.id} className="suggestion-item" onClick={() => selectContact(s)}>
            <span className="suggestion-mc">{s.mc_number}</span>
            <span className="suggestion-company">{s.truck_company_name}</span>
            {s.dot_number && <span className="suggestion-dot">DOT: {s.dot_number}</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay-confirm" onClick={(e) => {
      if (e.target === e.currentTarget) guardedClose();
    }}>
      <div className="modal-content-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-confirm">
          <h2>确认下单</h2>
          <button className="modal-close-confirm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-confirm">
          <div className="order-summary">
            <h3>订单信息</h3>
            <div className="summary-grid">
              <div className="summary-item"><span className="label">WE单号:</span><span className="value">{order.ew_quote_number || '-'}</span></div>
              <div className="summary-item"><span className="label">询价公司:</span><span className="value">{order.inquiry_company || '-'}</span></div>
              <div className="summary-item"><span className="label">日期:</span><span className="value">{order.quote_date ? (() => { const d = new Date(order.quote_date); return `${d.getUTCMonth()+1}/${d.getUTCDate()}/${d.getUTCFullYear()}`; })() : '-'}</span></div>
              <div className="summary-item"><span className="label">WE报价:</span><span className="value">${order.ew_quote_price ? parseFloat(order.ew_quote_price).toLocaleString() : '-'}</span></div>
              <div className="summary-item full-width"><span className="label">线路:</span><span className="value">{order.origin_city || '-'} → {order.destination_city || '-'}</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Carrier Info — required */}
            <div className="form-section">
              <div className="form-section-header">
                <h3>承运商信息 <span className="required">*必填</span></h3>
                <div className="contact-book-actions">
                  <button type="button" className="btn-contact-book" onClick={() => setShowContactBook(!showContactBook)}>📒 联系簿</button>
                </div>
              </div>

              {showContactBook && (
                <div className="contact-book-popup">
                  <div className="contact-book-header">
                    <input type="text" placeholder="搜索 MC# / DOT# / 公司名 / 联络方式..." value={contactBookSearch}
                      onChange={(e) => { setContactBookSearch(e.target.value); searchContactBook(e.target.value); }} autoFocus />
                    <button type="button" onClick={() => setShowContactBook(false)}>✕</button>
                  </div>
                  <div className="contact-book-list">
                    {contactBookLoading ? <div className="contact-book-loading">搜索中...</div> :
                      contactBookResults.length > 0 ? contactBookResults.map(contact => (
                        <div key={contact.id} className="contact-book-item" onClick={() => selectContact(contact)}>
                          <div className="contact-mc">{contact.mc_number}</div>
                          <div className="contact-company">{contact.truck_company_name}</div>
                          <div className="contact-phone">{contact.truck_contact}</div>
                        </div>
                      )) : contactBookSearch ? <div className="contact-book-empty">未找到匹配的联系人</div> :
                        <div className="contact-book-empty">输入关键字搜索联系人</div>}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>付卡车价格 <span className="required">*</span></label>
                  <input type="number" step="0.01" value={formData.truck_payment} onChange={(e) => handleChange('truck_payment', e.target.value)} placeholder="请输入付卡车价格" className={errors.truck_payment ? 'error' : ''} />
                  {errors.truck_payment && <span className="error-message">{errors.truck_payment}</span>}
                </div>
                <div className="form-group">
                  <label>卡车参考价 <span className="optional">(选填)</span></label>
                  <input type="number" step="0.01" value={formData.truck_reference_price} onChange={(e) => handleChange('truck_reference_price', e.target.value)} placeholder="参考报价" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group autocomplete-wrapper">
                  <label>MC# <span className="required">*</span></label>
                  <input type="text" value={formData.mc_number} onChange={(e) => handleChange('mc_number', e.target.value)} onFocus={() => setActiveField('mc_number')} placeholder="1234567" className={errors.mc_number ? 'error' : ''} onClick={(e) => e.stopPropagation()} />
                  {errors.mc_number && <span className="error-message">{errors.mc_number}</span>}
                  {renderSuggestions('mc_number')}
                </div>
                <div className="form-group autocomplete-wrapper">
                  <label>DOT# <span className="required">*</span></label>
                  <input type="text" value={formData.dot_number} onChange={(e) => handleChange('dot_number', e.target.value)} onFocus={() => setActiveField('dot_number')} placeholder="7654321" className={errors.dot_number ? 'error' : ''} onClick={(e) => e.stopPropagation()} />
                  {errors.dot_number && <span className="error-message">{errors.dot_number}</span>}
                  {renderSuggestions('dot_number')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group autocomplete-wrapper">
                  <label>卡车公司名 <span className="required">*</span></label>
                  <input type="text" value={formData.truck_company_name} onChange={(e) => handleChange('truck_company_name', e.target.value)} onFocus={() => setActiveField('truck_company_name')} placeholder="请输入卡车公司名" className={errors.truck_company_name ? 'error' : ''} onClick={(e) => e.stopPropagation()} />
                  {errors.truck_company_name && <span className="error-message">{errors.truck_company_name}</span>}
                  {renderSuggestions('truck_company_name')}
                </div>
                <div className="form-group autocomplete-wrapper">
                  <label>公司联络方式 <span className="required">*</span></label>
                  <input type="text" value={formData.truck_contact} onChange={(e) => handleChange('truck_contact', e.target.value)} onFocus={() => setActiveField('truck_contact')} placeholder="1234567890" className={errors.truck_contact ? 'error' : ''} onClick={(e) => e.stopPropagation()} />
                  {errors.truck_contact && <span className="error-message">{errors.truck_contact}</span>}
                  {renderSuggestions('truck_contact')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Carrier Email <span className="required">*</span></label>
                  <input type="text" value={formData.carrier_email} onChange={(e) => handleChange('carrier_email', e.target.value)} placeholder="carrier@company.com" className={errors.carrier_email ? 'error' : ''} />
                  {errors.carrier_email && <span className="error-message">{errors.carrier_email}</span>}
                </div>
                <div className="form-group">
                  <label>Carrier Address <span className="optional">(选填)</span></label>
                  <input type="text" value={formData.carrier_address} onChange={(e) => handleChange('carrier_address', e.target.value)} placeholder="承运商地址" />
                </div>
              </div>
            </div>

            {/* Driver info — optional */}
            <div className="form-section">
              <h3>司机信息 <span className="optional">(选填)</span></h3>
              <div className="form-row">
                <div className="form-group">
                  <label>司机姓名</label>
                  <input type="text" value={formData.driver_name} onChange={(e) => handleChange('driver_name', e.target.value)} placeholder="司机姓名" />
                </div>
                <div className="form-group">
                  <label>司机电话</label>
                  <input type="tel" value={formData.driver_phone} onChange={(e) => handleChange('driver_phone', e.target.value)} placeholder="司机电话" />
                </div>
              </div>
            </div>

            {/* Backup drivers — unchanged */}
            <div className="form-section backup-section">
              <h3>备用司机信息 <span className="optional">(选填)</span></h3>
              {[1, 2, 3].map(n => (
                <div key={n} className="backup-driver-group">
                  <div className="backup-header">备用司机 {n}</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>姓名</label>
                      <input type="text" value={formData[`backup_driver_${n}_name`]} onChange={(e) => handleChange(`backup_driver_${n}_name`, e.target.value)} placeholder="备用司机姓名" />
                    </div>
                    <div className="form-group">
                      <label>电话</label>
                      <input type="tel" value={formData[`backup_driver_${n}_phone`]} onChange={(e) => handleChange(`backup_driver_${n}_phone`, e.target.value)} placeholder="备用司机电话" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions-confirm">
              <button type="button" className="btn-cancel-confirm" onClick={onClose}>取消</button>
              <button type="submit" className="btn-submit-confirm">确认下单</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;
