import React from 'react';
import { Truck, Scale, Box, User, Phone, MapPin, Calendar } from 'lucide-react';
import { GoogleMapsAddressInput } from './GoogleMapsAddressInput';
import { useForm, createValidationRules, commonValidations } from '../hooks';
import { Button, Modal } from './common';
import { useNotification } from './common/Notification';
import { apiLogger } from '../utils/logger';

const PostTruckModal = ({ isOpen, onClose, onSubmit }) => {
  // 通知和日志系统
  const { error: showError } = useNotification();
  
  // 初始表单数据
  const initialData = {
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
  };

  // 表单验证规则
  const validationRules = createValidationRules({
    serviceType: commonValidations.required('服务类型'),
    currentLocation: commonValidations.required('当前位置'),
    truckType: commonValidations.required('车型'),
    length: commonValidations.required('车长'),
    capacity: commonValidations.required('载重能力'),
    volume: commonValidations.required('货仓体积'),
    preferredOrigin: commonValidations.required('常跑起点'),
    preferredDestination: commonValidations.required('常跑终点'),
    contactName: commonValidations.required('联系人'),
    contactPhone: {
      required: true,
      type: 'phone',
      label: '手机号码',
      message: '请输入正确的美国手机号码格式(10位数字)'
    },
    contactEmail: {
      type: 'email',
      label: '联系邮箱'
    }
  });

  const {
    formData,
    errors,
    handleInputChange,
    validateForm,
    resetForm,
    setFieldValue,
    isSubmitting,
    setIsSubmitting
  } = useForm(initialData, validationRules);

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



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      apiLogger.debug('开始处理车源信息发布');
      
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
      handleReset();
    } catch (error) {
      apiLogger.error('发布车源失败', error);
      showError('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布车源信息"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={handleInputChange}
                  className={`form-input ${errors.serviceType ? 'error' : ''}`}
                >
                  <option value="">请选择服务类型</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <div className="form-error">{errors.serviceType}</div>}
              </div>

              <GoogleMapsAddressInput
                label="当前位置"
                placeholder="输入当前城市名、街道地址或ZIP代码"
                value={formData.currentLocation}
                onChange={(value) => setFieldValue('currentLocation', value)}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.currentLocation ? 'error' : ''}
              />
              {errors.currentLocation && <div className="form-error">{errors.currentLocation}</div>}

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型 <span className="required">*</span>
                </label>
                <select
                  name="truckType"
                  value={formData.truckType}
                  onChange={handleInputChange}
                  className={`form-input ${errors.truckType ? 'error' : ''}`}
                >
                  <option value="">请选择车型</option>
                  {truckTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.truckType && <div className="form-error">{errors.truckType}</div>}
              </div>

              <div className="form-group">
                <label>车长 (ft) <span className="required">*</span></label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleInputChange}
                  className={`form-input ${errors.length ? 'error' : ''}`}
                >
                  <option value="">请选择车长</option>
                  {truckLengths.map(length => (
                    <option key={length} value={length}>
                      {length}
                    </option>
                  ))}
                </select>
                {errors.length && <div className="form-error">{errors.length}</div>}
              </div>

              <div className="form-group">
                <label>
                  <Scale size={16} />
                  载重能力 (lbs) <span className="required">*</span>
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`form-input ${errors.capacity ? 'error' : ''}`}
                >
                  <option value="">请选择载重能力</option>
                  {capacityRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                {errors.capacity && <div className="form-error">{errors.capacity}</div>}
              </div>

              <div className="form-group">
                <label>
                  <Box size={16} />
                  货仓体积 (cu ft) <span className="required">*</span>
                </label>
                <select
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
                  className={`form-input ${errors.volume ? 'error' : ''}`}
                >
                  <option value="">请选择货仓体积</option>
                  {volumeRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                {errors.volume && <div className="form-error">{errors.volume}</div>}
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
                onChange={(value) => setFieldValue('preferredOrigin', value)}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.preferredOrigin ? 'error' : ''}
              />
              {errors.preferredOrigin && <div className="form-error">{errors.preferredOrigin}</div>}

              <GoogleMapsAddressInput
                label="常跑终点"
                placeholder="输入常跑终点城市名、街道地址或ZIP代码"
                value={formData.preferredDestination}
                onChange={(value) => setFieldValue('preferredDestination', value)}
                onPlaceSelected={() => {}}
                required={true}
                icon={MapPin}
                className={errors.preferredDestination ? 'error' : ''}
              />
              {errors.preferredDestination && <div className="form-error">{errors.preferredDestination}</div>}
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
                  onChange={handleInputChange}
                  placeholder="请输入联系人姓名"
                  className={`form-input ${errors.contactName ? 'error' : ''}`}
                />
                {errors.contactName && <div className="form-error">{errors.contactName}</div>}
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
                  onChange={handleInputChange}
                  placeholder="请输入10位美国手机号码"
                  className={`form-input ${errors.contactPhone ? 'error' : ''}`}
                />
                {errors.contactPhone && <div className="form-error">{errors.contactPhone}</div>}
              </div>

              <div className="form-group">
                <label>联系邮箱</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="请输入邮箱地址（可选）"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>公司名称</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="请输入公司名称（可选）"
                  className="form-input"
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
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>备注信息</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="请输入其他备注信息（可选）"
                  rows="3"
                  className="form-input"
                />
              </div>
            </div>
          </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            发布车源
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PostTruckModal; 