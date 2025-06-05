import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Package, 
  Truck, 
  Scale,
  Layers,
  Hash,
  Home,
  Building,
  Shield
} from 'lucide-react';
import './Modal.css';

const PostLoadModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'load',
    serviceType: 'FTL', // FTL 或 LTL
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    cargoType: '',
    truckType: '',
    weight: '',
    // LTL专用字段
    originLocationType: 'commercial', // commercial, residential, elevator, gated
    destinationLocationType: 'commercial',
    pallets: '',
    volume: '',
    freightClass: '',
    stackable: true,
    allowMixedLoad: true,
    // 联系信息
    contactPhone: '',
    contactEmail: '',
    notes: ''
  });

  // 货物类型选项
  const cargoTypes = [
    '电子设备', '机械设备', '汽车配件', '建材', '化工原料',
    '纺织品', '食品饮料', '医药用品', '日用百货', '其他'
  ];

  // 车型要求选项
  const truckTypes = [
    '厢式货车', '平板车', '高栏车', '冷藏车', '危险品车', 
    '超长货车', '超重货车', '不限'
  ];

  // 地址类型选项
  const locationTypes = [
    { value: 'commercial', label: '商业地址', icon: Building },
    { value: 'residential', label: '住宅地址', icon: Home },
    { value: 'elevator', label: '需要升降机', icon: Layers },
    { value: 'gated', label: '有门禁/安保', icon: Shield }
  ];

  // 分类代码选项
  const freightClasses = [
    { value: '50', label: 'Class 50 - 高密度货物' },
    { value: '55', label: 'Class 55 - 金属制品' },
    { value: '60', label: 'Class 60 - 汽车配件' },
    { value: '65', label: 'Class 65 - 机械设备' },
    { value: '70', label: 'Class 70 - 电器设备' },
    { value: '77.5', label: 'Class 77.5 - 轮胎' },
    { value: '85', label: 'Class 85 - 包装货物' },
    { value: '92.5', label: 'Class 92.5 - 家具' },
    { value: '100', label: 'Class 100 - 纸制品' },
    { value: '110', label: 'Class 110 - 纺织品' },
    { value: '125', label: 'Class 125 - 小家电' },
    { value: '150', label: 'Class 150 - 服装' },
    { value: '175', label: 'Class 175 - 易碎品' },
    { value: '200', label: 'Class 200 - 包装食品' },
    { value: '250', label: 'Class 250 - 易损品' },
    { value: '300', label: 'Class 300 - 木制品' },
    { value: '400', label: 'Class 400 - 塑料制品' },
    { value: '500', label: 'Class 500 - 低密度货物' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 基础验证
    const requiredFields = ['origin', 'destination', 'pickupDate', 'deliveryDate', 'cargoType', 'truckType', 'weight'];
    
    // LTL额外必填字段
    if (formData.serviceType === 'LTL') {
      requiredFields.push('pallets', 'volume', 'freightClass');
    }
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`请填写所有必填字段: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit(formData);
    onClose();
    
    // 重置表单
    setFormData({
      type: 'load',
      serviceType: 'FTL',
      origin: '',
      destination: '',
      pickupDate: '',
      deliveryDate: '',
      cargoType: '',
      truckType: '',
      weight: '',
      originLocationType: 'commercial',
      destinationLocationType: 'commercial',
      pallets: '',
      volume: '',
      freightClass: '',
      stackable: true,
      allowMixedLoad: true,
      contactPhone: '',
      contactEmail: '',
      notes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布货源信息</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 运输类型选择 */}
          <div className="form-section">
            <h3>运输类型</h3>
            <div className="service-type-selection">
              <label className={`service-type-option ${formData.serviceType === 'FTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="FTL"
                  checked={formData.serviceType === 'FTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Truck size={24} />
                  <div>
                    <strong>整车运输 (FTL)</strong>
                    <p>独享整车，适合大批量货物</p>
                  </div>
                </div>
              </label>
              
              <label className={`service-type-option ${formData.serviceType === 'LTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="LTL"
                  checked={formData.serviceType === 'LTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Package size={24} />
                  <div>
                    <strong>零担运输 (LTL)</strong>
                    <p>与其他货物拼车，经济实惠</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 基础信息 - FTL和LTL都需要 */}
          <div className="form-section">
            <h3>基础信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  起点 *
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="请输入起点城市"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  终点 *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="请输入终点城市"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  提货日期 *
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  送达日期 *
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Package size={16} />
                  货物类型 *
                </label>
                <select
                  name="cargoType"
                  value={formData.cargoType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">选择货物类型</option>
                  {cargoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型要求 *
                </label>
                <select
                  name="truckType"
                  value={formData.truckType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">选择车型要求</option>
                  {truckTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Scale size={16} />
                  货物重量 * (吨)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="例如: 15.5"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* LTL专用信息 */}
          {formData.serviceType === 'LTL' && (
            <>
              {/* 地址类型 */}
              <div className="form-section">
                <h3>地址类型</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>起点地址类型</label>
                    <div className="location-type-grid">
                      {locationTypes.map(({ value, label, icon: Icon }) => (
                        <label key={`origin-${value}`} className={`location-type-option ${formData.originLocationType === value ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="originLocationType"
                            value={value}
                            checked={formData.originLocationType === value}
                            onChange={handleInputChange}
                          />
                          <Icon size={20} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>终点地址类型</label>
                    <div className="location-type-grid">
                      {locationTypes.map(({ value, label, icon: Icon }) => (
                        <label key={`dest-${value}`} className={`location-type-option ${formData.destinationLocationType === value ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="destinationLocationType"
                            value={value}
                            checked={formData.destinationLocationType === value}
                            onChange={handleInputChange}
                          />
                          <Icon size={20} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* LTL详细信息 */}
              <div className="form-section">
                <h3>货物详情</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Layers size={16} />
                      托盘数量 *
                    </label>
                    <input
                      type="number"
                      name="pallets"
                      value={formData.pallets}
                      onChange={handleInputChange}
                      placeholder="例如: 8"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Package size={16} />
                      货物体积 * (立方米)
                    </label>
                    <input
                      type="number"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      placeholder="例如: 25.5"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Hash size={16} />
                      分类代码 (Freight Class) *
                    </label>
                    <select
                      name="freightClass"
                      value={formData.freightClass}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">选择货物分类</option>
                      {freightClasses.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="stackable"
                        checked={formData.stackable}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      可否堆叠
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="allowMixedLoad"
                        checked={formData.allowMixedLoad}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      是否可与其他货物拼单
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 联系信息 */}
          <div className="form-section">
            <h3>联系信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>联系电话</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="请输入联系电话"
                />
              </div>

              <div className="form-group">
                <label>联系邮箱</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="请输入联系邮箱"
                />
              </div>
            </div>

            <div className="form-group">
              <label>备注信息</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="请输入特殊要求或备注信息"
                rows="3"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布货源信息
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .large-modal {
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .form-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .service-type-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .service-type-option {
          display: block;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .service-type-option:hover {
          border-color: #34C759;
          background-color: #f8f9fa;
        }

        .service-type-option.selected {
          border-color: #34C759;
          background-color: #e8f5e8;
        }

        .service-type-option input[type="radio"] {
          display: none;
        }

        .service-type-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .service-type-content > svg {
          color: #34C759;
          flex-shrink: 0;
        }

        .service-type-content strong {
          color: #333;
          margin-bottom: 0.25rem;
          display: block;
        }

        .service-type-content p {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .location-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .location-type-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .location-type-option:hover {
          border-color: #34C759;
          background-color: #f8f9fa;
        }

        .location-type-option.selected {
          border-color: #34C759;
          background-color: #e8f5e8;
          color: #2d5016;
        }

        .location-type-option input[type="radio"] {
          display: none;
        }

        .location-type-option svg {
          flex-shrink: 0;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #34C759;
        }

        @media (max-width: 768px) {
          .large-modal {
            max-width: 95vw;
            margin: 1rem;
          }

          .service-type-selection,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .location-type-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PostLoadModal; 