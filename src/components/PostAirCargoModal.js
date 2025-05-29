import React, { useState } from 'react';
import { X, Plane, Calendar, Scale, DollarSign, MapPin } from 'lucide-react';
import './Modal.css';

const PostAirCargoModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    flightDate: '',
    flightNumber: '',
    airline: '',
    availableWeight: '',
    rate: '',
    cargoType: '',
    companyName: '',
    contactPhone: '',
    contactEmail: '',
    transitTime: '',
    specialService: '',
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

  const airlines = [
    '中国国际航空',
    '中国东方航空',
    '中国南方航空',
    '海南航空',
    '深圳航空',
    '厦门航空',
    '汉莎航空',
    '阿联酋航空',
    '新加坡航空',
    '其他'
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
      type: 'cargo',
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    setFormData({
      origin: '',
      destination: '',
      flightDate: '',
      flightNumber: '',
      airline: '',
      availableWeight: '',
      rate: '',
      cargoType: '',
      companyName: '',
      contactPhone: '',
      contactEmail: '',
      transitTime: '',
      specialService: '',
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
            <Plane size={24} />
            <h2>发布舱位信息</h2>
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
                  placeholder="如：上海浦东机场 (PVG)"
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
                  placeholder="如：洛杉矶国际机场 (LAX)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>起飞日期 *</label>
              <div className="input-with-icon">
                <Calendar size={20} />
                <input
                  type="date"
                  name="flightDate"
                  value={formData.flightDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>航班号 *</label>
              <input
                type="text"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleInputChange}
                placeholder="如：CA987"
                required
              />
            </div>

            <div className="form-group">
              <label>航空公司 *</label>
              <select
                name="airline"
                value={formData.airline}
                onChange={handleInputChange}
                required
              >
                <option value="">选择航空公司</option>
                {airlines.map(airline => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>可载重量 *</label>
              <div className="input-with-icon">
                <Scale size={20} />
                <input
                  type="text"
                  name="availableWeight"
                  value={formData.availableWeight}
                  onChange={handleInputChange}
                  placeholder="如：5,000 kg"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>运费报价 *</label>
              <div className="input-with-icon">
                <DollarSign size={20} />
                <input
                  type="text"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="如：¥45/kg"
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
              <label>飞行时长</label>
              <input
                type="text"
                name="transitTime"
                value={formData.transitTime}
                onChange={handleInputChange}
                placeholder="如：12小时"
              />
            </div>

            <div className="form-group">
              <label>特殊服务</label>
              <input
                type="text"
                name="specialService"
                value={formData.specialService}
                onChange={handleInputChange}
                placeholder="如：温控货舱、危险品认证"
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
              <label>备注信息</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="其他需要说明的信息..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布舱位信息
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostAirCargoModal; 