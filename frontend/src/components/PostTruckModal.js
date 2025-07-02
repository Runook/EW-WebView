import React, { useState } from 'react';
import { X, MapPin, Calendar, Truck, Scale, Box, User, Phone } from 'lucide-react';
import './Modal.css';
import { GoogleMapsAddressInput } from './GoogleMapsAddressInput';

const PostTruckModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    serviceType: '',        // 服务类型 - 必填
    currentLocation: '',    // 当前位置 - 必填
    truckType: '',         // 车型 - 必填
    length: '',            // 车长 - 必填
    capacity: '',          // 载重能力 - 必填
    volume: '',            // 货仓体积 - 必填
    preferredOrigin: '',   // 常跑起点 - 必填
    preferredDestination: '', // 常跑终点 - 必填
    contactName: '',       // 联系人 - 必填
    contactPhone: '',      // 手机号码 - 必填
    // 可选字段
    availableDate: '',
    contactEmail: '',
    companyName: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // 服务类型选项
  const serviceTypes = [
    { value: 'FTL', label: 'FTL (整车运输)' },
    { value: 'LTL', label: 'LTL (零担运输)' },
    { value: 'FTL/LTL', label: 'FTL/LTL (都可以)' }
  ];

  // 车型选项
  const truckTypes = [
    { value: '干货车 (Dry Van)', label: '干货车 (Dry Van)' },
    { value: '平板车 (Flatbed)', label: '平板车 (Flatbed)' },
    { value: '冷藏车 (Refrigerated)', label: '冷藏车 (Refrigerated)' },
    { value: '危险品车 (Hazmat)', label: '危险品车 (Hazmat)' },
    { value: '超长车 (Stretch)', label: '超长车 (Stretch)' },
    { value: '超重车 (Heavy Haul)', label: '超重车 (Heavy Haul)' },
    { value: '其他 (Other)', label: '其他 (Other)' }
  ];

  // 车长选项
  const truckLengths = [
    '14 ft', '22 ft', '32 ft', '43 ft', '57 ft', '其他'
  ];

  // 载重能力选项
  const capacityRanges = [
    '2,000 lbs以下', '2,000-6,600 lbs', '6,600-11,000 lbs', '11,000-22,000 lbs', '22,000-44,000 lbs', '44,000-66,000 lbs', '66,000 lbs以上'
  ];

  // 货仓体积选项
  const volumeRanges = [
    '1,800 cu ft以下', '1,800-3,500 cu ft', '3,500-7,000 cu ft', '7,000-10,500 cu ft', '10,500 cu ft以上'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'serviceType', 'currentLocation', 'truckType', 'length', 
      'capacity', 'volume', 'preferredOrigin', 'preferredDestination',
      'contactName', 'contactPhone'
    ];

    const fieldLabels = {
      serviceType: '服务类型',
      currentLocation: '当前位置',
      truckType: '车型',
      length: '车长',
      capacity: '载重能力',
      volume: '货仓体积',
      preferredOrigin: '常跑起点',
      preferredDestination: '常跑终点',
      contactName: '联系人',
      contactPhone: '手机号码'
    };

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = `${fieldLabels[field]}为必填项`;
      }
    });

    // 手机号码格式验证 (美国格式 10位数)
    if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone.replace(/\D/g, ''))) {
      newErrors.contactPhone = '请输入正确的美国手机号码格式(10位数字)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('开始处理车源信息发布...');
      
      // 转换为后端API期望的格式
      const submitData = {
        type: 'truck',
        serviceType: formData.serviceType,
        currentLocation: formData.currentLocation,
        truckType: formData.truckType,
        length: formData.length,
        capacity: formData.capacity,
        volume: formData.volume,
        preferredOrigin: formData.preferredOrigin,
        preferredDestination: formData.preferredDestination,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        availableDate: formData.availableDate || new Date().toISOString().split('T')[0],
        contactEmail: formData.contactEmail || '',
        companyName: formData.companyName || '',
        notes: formData.notes || ''
      };

      await onSubmit(submitData);
      resetForm();
    } catch (error) {
      console.error('发布车源失败:', error);
      alert('发布失败，请重试');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: '',
      currentLocation: '',
      truckType: '',
      length: '',
      capacity: '',
      volume: '',
      preferredOrigin: '',
      preferredDestination: '',
      contactName: '',
      contactPhone: '',
      availableDate: '',
      contactEmail: '',
      companyName: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布车源信息</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 基础信息 */}
          <div className="form-section">
            <h3>基础信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Truck size={16} />
                  服务类型 <span className="required">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className={errors.serviceType ? 'error' : ''}
                >
                  <option value="">请选择服务类型</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <div className="error-message">{errors.serviceType}</div>}
              </div>

              <GoogleMapsAddressInput
                label="当前位置"
                placeholder="输入当前城市名、街道地址或ZIP代码"
                value={formData.currentLocation}
                onChange={(value) => setFormData(prev => ({ ...prev, currentLocation: value }))}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.currentLocation ? 'error' : ''}
              />
              {errors.currentLocation && <div className="error-message">{errors.currentLocation}</div>}

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型 <span className="required">*</span>
                </label>
                <select
                  name="truckType"
                  value={formData.truckType}
                  onChange={handleChange}
                  className={errors.truckType ? 'error' : ''}
                >
                  <option value="">请选择车型</option>
                  {truckTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.truckType && <div className="error-message">{errors.truckType}</div>}
              </div>

              <div className="form-group">
                <label>车长 (ft) <span className="required">*</span></label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className={errors.length ? 'error' : ''}
                >
                  <option value="">请选择车长</option>
                  {truckLengths.map(length => (
                    <option key={length} value={length}>
                      {length}
                    </option>
                  ))}
                </select>
                {errors.length && <div className="error-message">{errors.length}</div>}
              </div>

              <div className="form-group">
                <label>
                  <Scale size={16} />
                  载重能力 (lbs) <span className="required">*</span>
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={errors.capacity ? 'error' : ''}
                >
                  <option value="">请选择载重能力</option>
                  {capacityRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                {errors.capacity && <div className="error-message">{errors.capacity}</div>}
              </div>

              <div className="form-group">
                <label>
                  <Box size={16} />
                  货仓体积 (cu ft) <span className="required">*</span>
                </label>
                <select
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  className={errors.volume ? 'error' : ''}
                >
                  <option value="">请选择货仓体积</option>
                  {volumeRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                {errors.volume && <div className="error-message">{errors.volume}</div>}
              </div>
            </div>
          </div>

          {/* 运营路线 */}
          <div className="form-section">
            <h3>运营路线</h3>
            <div className="form-grid">
              <GoogleMapsAddressInput
                label="常跑起点"
                placeholder="输入常跑起点城市名、街道地址或ZIP代码"
                value={formData.preferredOrigin}
                onChange={(value) => setFormData(prev => ({ ...prev, preferredOrigin: value }))}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.preferredOrigin ? 'error' : ''}
              />
              {errors.preferredOrigin && <div className="error-message">{errors.preferredOrigin}</div>}

              <GoogleMapsAddressInput
                label="常跑终点"
                placeholder="输入常跑终点城市名、街道地址或ZIP代码"
                value={formData.preferredDestination}
                onChange={(value) => setFormData(prev => ({ ...prev, preferredDestination: value }))}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.preferredDestination ? 'error' : ''}
              />
              {errors.preferredDestination && <div className="error-message">{errors.preferredDestination}</div>}
            </div>
          </div>

          {/* 联系信息 */}
          <div className="form-section">
            <h3>联系信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <User size={16} />
                  联系人 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="请输入联系人姓名"
                  className={errors.contactName ? 'error' : ''}
                />
                {errors.contactName && <div className="error-message">{errors.contactName}</div>}
              </div>

              <div className="form-group">
                <label>
                  <Phone size={16} />
                  手机号码 <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="请输入10位美国手机号码"
                  className={errors.contactPhone ? 'error' : ''}
                />
                {errors.contactPhone && <div className="error-message">{errors.contactPhone}</div>}
              </div>

              <div className="form-group">
                <label>联系邮箱</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="请输入邮箱地址（可选）"
                />
              </div>

              <div className="form-group">
                <label>公司名称</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="请输入公司名称（可选）"
                />
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="form-section">
            <h3>其他信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  可用日期
                </label>
                <input
                  type="date"
                  name="availableDate"
                  value={formData.availableDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group full-width">
                <label>备注信息</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="请输入其他备注信息（可选）"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布车源
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTruckModal; 