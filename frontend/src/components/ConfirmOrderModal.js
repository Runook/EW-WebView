import React, { useState } from 'react';
import './ConfirmOrderModal.css';

const ConfirmOrderModal = ({ order, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    truck_payment: '',
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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
                <span className="label">EW单号:</span>
                <span className="value">{order.ew_quote_number || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">询价公司:</span>
                <span className="value">{order.inquiry_company || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">报价日期:</span>
                <span className="value">{order.quote_date || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">EW报价:</span>
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
              <h3>卡车信息 <span className="required">*必填</span></h3>
              
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
                  <label>MC Number <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.mc_number}
                    onChange={(e) => handleChange('mc_number', e.target.value)}
                    placeholder="请输入MC Number"
                    className={errors.mc_number ? 'error' : ''}
                  />
                  {errors.mc_number && <span className="error-message">{errors.mc_number}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>卡车公司名 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.truck_company_name}
                    onChange={(e) => handleChange('truck_company_name', e.target.value)}
                    placeholder="请输入卡车公司名"
                    className={errors.truck_company_name ? 'error' : ''}
                  />
                  {errors.truck_company_name && <span className="error-message">{errors.truck_company_name}</span>}
                </div>

                <div className="form-group">
                  <label>联络方式 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.truck_contact}
                    onChange={(e) => handleChange('truck_contact', e.target.value)}
                    placeholder="请输入联络方式"
                    className={errors.truck_contact ? 'error' : ''}
                  />
                  {errors.truck_contact && <span className="error-message">{errors.truck_contact}</span>}
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

