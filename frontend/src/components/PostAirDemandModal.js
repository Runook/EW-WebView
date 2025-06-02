import React, { useState } from 'react';
import { X, Package, Calendar, Scale, DollarSign, MapPin, AlertTriangle } from 'lucide-react';
import './Modal.css';

const PostAirDemandModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    requiredDate: '',
    weight: '',
    cargoType: '',
    urgency: '',
    maxRate: '',
    companyName: '',
    contactPhone: '',
    contactEmail: '',
    specialRequirements: '',
    insurance: '',
    notes: ''
  });

  const cargoTypes = [
    '普货',
    '危险品',
    '生鲜冷冻',
    '贵重物品',
    '大件货物',
    '医疗用品',
    '电子产品',
    '化工品'
  ];

  const urgencyLevels = [
    '普通',
    '加急',
    '紧急',
    '特急'
  ];

  const insuranceOptions = [
    '不需要保险',
    '基础货物保险',
    '高价值货物保险',
    '全险保障'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      type: 'demand',
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    setFormData({
      origin: '',
      destination: '',
      requiredDate: '',
      weight: '',
      cargoType: '',
      urgency: '',
      maxRate: '',
      companyName: '',
      contactPhone: '',
      contactEmail: '',
      specialRequirements: '',
      insurance: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={24} />
            <h2>发布货运需求</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>起飞机场 *</label>
              <div className="input-with-icon">
                <MapPin size={20} />
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="如：广州白云机场 (CAN)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>目的机场 *</label>
              <div className="input-with-icon">
                <MapPin size={20} />
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="如：纽约肯尼迪机场 (JFK)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>要求日期 *</label>
              <div className="input-with-icon">
                <Calendar size={20} />
                <input
                  type="date"
                  name="requiredDate"
                  value={formData.requiredDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>货物重量 *</label>
              <div className="input-with-icon">
                <Scale size={20} />
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="如：2,500 kg"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>货物类型 *</label>
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
              <label>紧急程度 *</label>
              <div className="input-with-icon">
                <AlertTriangle size={20} />
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">选择紧急程度</option>
                  {urgencyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>最高预算 *</label>
              <div className="input-with-icon">
                <DollarSign size={20} />
                <input
                  type="text"
                  name="maxRate"
                  value={formData.maxRate}
                  onChange={handleInputChange}
                  placeholder="如：¥50/kg"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>保险需求</label>
              <select
                name="insurance"
                value={formData.insurance}
                onChange={handleInputChange}
              >
                <option value="">选择保险类型</option>
                {insuranceOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>特殊要求</label>
              <input
                type="text"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder="如：防静电包装、温控运输、危险品处理等"
              />
            </div>

            <div className="form-group full-width">
              <label>公司名称 *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="请输入公司名称"
                required
              />
            </div>

            <div className="form-group">
              <label>联系电话 *</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="请输入联系电话"
                required
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

            <div className="form-group full-width">
              <label>补充说明</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="请详细描述货物信息、包装要求等..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布货运需求
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostAirDemandModal; 