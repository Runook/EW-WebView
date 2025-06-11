import React, { useState } from 'react';
import { X, MapPin, Calendar, DollarSign, Truck, Star, Scale, Box, Navigation } from 'lucide-react';
import './Modal.css';
import { GoogleMapsAddressInput, GoogleMapsRoute } from './GoogleMapsAddressInput';

const PostTruckModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    currentLocation: '',
    availableDate: '',
    serviceType: '', // FTL, LTL 或 FTL/LTL
    equipment: '',
    length: '',
    capacity: '',
    volume: '',
    preferredOrigin: '',
    preferredDestination: '',
    rateRange: '',
    specialServices: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: '',
    notes: ''
  });

  // Google Maps 相关状态
  const [selectedPlaces, setSelectedPlaces] = useState({
    currentLocation: null,
    preferredOrigin: null,
    preferredDestination: null
  });

  const [showRouteModal, setShowRouteModal] = useState(false);

  const serviceTypes = [
    { value: 'FTL', label: 'FTL (整车运输)' },
    { value: 'LTL', label: 'LTL (零担运输)' },
    { value: 'FTL/LTL', label: 'FTL/LTL (都可以)' }
  ];

  const equipmentTypes = [
    { value: '厢式货车', label: '厢式货车' },
    { value: '冷藏车', label: '冷藏车' },
    { value: '平板车', label: '平板车' },
    { value: '高栏车', label: '高栏车' },
    { value: '低板车', label: '低板车' },
    { value: '油罐车', label: '油罐车' }
  ];

  const truckLengths = [
    '4.2米', '6.8米', '9.6米', '13米', '17.5米'
  ];

  const capacityRanges = [
    '5吨以下', '5-10吨', '10-20吨', '20-30吨', '30吨以上'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Google Maps 地址选择处理
  const handleCurrentLocationSelected = (placeData) => {
    setSelectedPlaces(prev => ({
      ...prev,
      currentLocation: placeData
    }));
  };

  const handlePreferredOriginSelected = (placeData) => {
    setSelectedPlaces(prev => ({
      ...prev,
      preferredOrigin: placeData
    }));
  };

  const handlePreferredDestinationSelected = (placeData) => {
    setSelectedPlaces(prev => ({
      ...prev,
      preferredDestination: placeData
    }));
  };

  // 显示路线功能
  const showRoute = () => {
    // 检查是否有Google Maps选择的地址数据，或者至少有输入的地址文本
    const hasOrigin = selectedPlaces.preferredOrigin || formData.preferredOrigin;
    const hasDestination = selectedPlaces.preferredDestination || formData.preferredDestination;
    
    if (hasOrigin && hasDestination) {
      setShowRouteModal(true);
    } else {
      alert('请先输入常跑起点和终点地址');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证必填字段
    const requiredFields = [
      'currentLocation', 'availableDate', 'equipment', 'capacity', 
      'rateRange', 'serviceType', 'companyName', 'contactPhone'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`请填写所有必填字段: ${missingFields.join(', ')}`);
      return;
    }

    // 转换为后端API期望的格式
    const submitData = {
      type: 'truck',
      // 后端必填字段
      origin: formData.currentLocation,
      destination: formData.preferredDestination || '全国各地',
      availableDate: formData.availableDate,
      truckType: formData.equipment,
      capacity: formData.capacity,
      rate: formData.rateRange,
      serviceType: formData.serviceType,
      companyName: formData.companyName,
      contactPhone: formData.contactPhone,
      // 可选字段
      contactEmail: formData.contactEmail || '',
      driverLicense: '',
      truckFeatures: formData.specialServices || '',
      notes: formData.notes || '',
      // 保留原始数据用于显示
      originalData: {
        ...formData,
        id: Date.now(),
        postedDate: new Date().toISOString(),
        location: formData.currentLocation,
        preferredLanes: `${formData.preferredOrigin || '任意地点'} 至 ${formData.preferredDestination || '全国各地'}`
      }
    };

    onSubmit(submitData);
    
    // 重置表单
    setFormData({
      currentLocation: '',
      availableDate: '',
      serviceType: '',
      equipment: '',
      length: '',
      capacity: '',
      volume: '',
      preferredOrigin: '',
      preferredDestination: '',
      rateRange: '',
      specialServices: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      notes: ''
    });
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
          <div className="form-section">
            <h3>车辆信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Truck size={16} />
                  服务类型
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择服务类型</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <GoogleMapsAddressInput
                label="当前位置"
                placeholder="输入当前城市名、街道地址或ZIP代码"
                value={formData.currentLocation}
                onChange={(value) => setFormData(prev => ({ ...prev, currentLocation: value }))}
                onPlaceSelected={handleCurrentLocationSelected}
                required={true}
                icon={MapPin}
              />

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
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型
                </label>
                <select
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择车型</option>
                  {equipmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>车长</label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择车长</option>
                  {truckLengths.map(length => (
                    <option key={length} value={length}>
                      {length}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Scale size={16} />
                  载重能力
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择载重</option>
                  {capacityRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Box size={16} />
                  货舱体积 (立方米)
                </label>
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  placeholder="例如: 45"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  运费区间 (¥/公里)
                </label>
                <input
                  type="text"
                  name="rateRange"
                  value={formData.rateRange}
                  onChange={handleChange}
                  placeholder="例如: ¥6-12/公里"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>运营范围</h3>
            <div className="form-grid">
              <GoogleMapsAddressInput
                label="常跑起点"
                placeholder="经常发货的地区"
                value={formData.preferredOrigin}
                onChange={(value) => setFormData(prev => ({ ...prev, preferredOrigin: value }))}
                onPlaceSelected={handlePreferredOriginSelected}
                required={false}
                icon={MapPin}
              />

              <GoogleMapsAddressInput
                label="常跑终点"
                placeholder="经常送货的地区"
                value={formData.preferredDestination}
                onChange={(value) => setFormData(prev => ({ ...prev, preferredDestination: value }))}
                onPlaceSelected={handlePreferredDestinationSelected}
                required={false}
                icon={MapPin}
              />
            </div>

            {/* 路线查看按钮 */}
            {formData.preferredOrigin && formData.preferredDestination && (
              <div className="route-section">
                <button
                  type="button"
                  className="btn route-btn"
                  onClick={showRoute}
                >
                  <Navigation size={16} />
                  查看常跑路线
                </button>
                <p className="route-description">
                  点击查看Google Maps导航路线和距离估算
                </p>
              </div>
            )}

            <div className="form-group full-width">
              <label>
                <Star size={16} />
                特殊服务
              </label>
              <textarea
                name="specialServices"
                value={formData.specialServices}
                onChange={handleChange}
                placeholder="如: 恒温运输、GPS跟踪、危险品运输资质、保险服务等"
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>联系信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>公司名称</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>联系人</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>手机号码</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布车源
            </button>
          </div>
        </form>
      </div>

      {/* Google Maps 路线模态框 */}
      {showRouteModal && (
        <GoogleMapsRoute
          origin={selectedPlaces.preferredOrigin || { address: formData.preferredOrigin }}
          destination={selectedPlaces.preferredDestination || { address: formData.preferredDestination }}
          onClose={() => setShowRouteModal(false)}
        />
      )}
    </div>
  );
};

export default PostTruckModal; 