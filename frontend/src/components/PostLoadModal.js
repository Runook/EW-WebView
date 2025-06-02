import React, { useState } from 'react';
import { X, MapPin, Package, Calendar, DollarSign, Truck, Scale, Box } from 'lucide-react';
import './Modal.css';

const PostLoadModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    loadType: '', // FTL或LTL
    equipment: '',
    weight: '',
    volume: '',
    pallets: '',
    rate: '',
    distance: '',
    commodity: '',
    requirements: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: ''
  });

  const loadTypes = [
    { value: 'FTL', label: 'FTL (整车运输)' },
    { value: 'LTL', label: 'LTL (零担运输)' }
  ];

  const equipmentTypes = [
    { value: '厢式货车', label: '厢式货车' },
    { value: '冷藏车', label: '冷藏车' },
    { value: '平板车', label: '平板车' },
    { value: '高栏车', label: '高栏车' },
    { value: '低板车', label: '低板车' },
    { value: '油罐车', label: '油罐车' }
  ];

  const commodityTypes = [
    '电子设备', '机械设备', '生鲜食品', '日用百货', 
    '化工产品', '建材', '汽车配件', '纺织品', '医疗器械', '其他'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Date.now(),
      type: 'load',
      postedDate: new Date().toISOString()
    });
    setFormData({
      origin: '',
      destination: '',
      pickupDate: '',
      deliveryDate: '',
      loadType: '',
      equipment: '',
      weight: '',
      volume: '',
      pallets: '',
      rate: '',
      distance: '',
      commodity: '',
      requirements: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布货源信息</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3>货源详情</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Package size={16} />
                  运输类型
                </label>
                <select
                  name="loadType"
                  value={formData.loadType}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择运输类型</option>
                  {loadTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  起点
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="起始城市或地区"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  终点
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="目的城市或地区"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  提货日期
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  送达日期
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型要求
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
                <label>
                  <Scale size={16} />
                  货物重量 (吨)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="例如: 22"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Box size={16} />
                  货物体积 (立方米)
                </label>
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  placeholder="例如: 35"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>
                  <Package size={16} />
                  托盘数量
                </label>
                <input
                  type="number"
                  name="pallets"
                  value={formData.pallets}
                  onChange={handleChange}
                  placeholder="例如: 20"
                />
              </div>

              <div className="form-group">
                <label>货物类型</label>
                <select
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择货物类型</option>
                  {commodityTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  预算价格 ($)
                </label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="例如: 8500"
                  required
                />
              </div>

              <div className="form-group">
                <label>距离 (公里)</label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  placeholder="例如: 1463"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>特殊要求</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="如: 恒温运输、GPS跟踪、保险要求等"
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
              发布货源
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostLoadModal; 