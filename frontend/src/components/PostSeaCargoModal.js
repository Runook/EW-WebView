import React, { useState } from 'react';
import { X, Ship, Calendar, Scale, DollarSign, MapPin, Anchor, Container, Clock } from 'lucide-react';
import './Modal.css';

const PostSeaCargoModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    sailingDate: '',
    vesselName: '',
    shippingLine: '',
    availableSpace: '',
    rate: '',
    transitTime: '',
    cargoType: '',
    vesselType: '',
    cutOffDate: '',
    companyName: '',
    contactPhone: '',
    contactEmail: '',
    specialService: '',
    containerTypes: '',
    notes: ''
  });

  const cargoTypes = [
    '普货',
    '危险品',
    '冷冻货物',
    '散货',
    '液体货物',
    '超重超限',
    '电子产品',
    '机械设备',
    '化工品',
    '食品原料',
    '纺织品',
    '汽车及配件'
  ];

  const shippingLines = [
    '中远海运集装箱运输',
    '东方海外货柜航运',
    '地中海航运',
    '马士基航运',
    '达飞轮船',
    '赫伯罗特',
    '阳明海运',
    '现代商船',
    '万海航运',
    '其他'
  ];

  const vesselTypes = [
    '集装箱船',
    '散货船',
    '液货船',
    '滚装船',
    '多用途船',
    '超大型集装箱船'
  ];

  const containerTypes = [
    '20GP (干货集装箱)',
    '40GP (干货集装箱)',
    '40HC (高箱)',
    '20RF (冷冻箱)',
    '40RF (冷冻箱)',
    '20OT (开顶箱)',
    '40OT (开顶箱)',
    '20FR (框架箱)',
    '40FR (框架箱)',
    '20TK (罐箱)'
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
      sailingDate: '',
      vesselName: '',
      shippingLine: '',
      availableSpace: '',
      rate: '',
      transitTime: '',
      cargoType: '',
      vesselType: '',
      cutOffDate: '',
      companyName: '',
      contactPhone: '',
      contactEmail: '',
      specialService: '',
      containerTypes: '',
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
            <Ship size={24} />
            <h2>发布舱位信息</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>起始港 *</label>
              <div className="input-with-icon">
                <Anchor size={20} />
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="如：上海港 (CNSHA)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>目的港 *</label>
              <div className="input-with-icon">
                <Anchor size={20} />
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="如：洛杉矶港 (USLAX)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>开船日期 *</label>
              <div className="input-with-icon">
                <Calendar size={20} />
                <input
                  type="date"
                  name="sailingDate"
                  value={formData.sailingDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>截关日期 *</label>
              <div className="input-with-icon">
                <Calendar size={20} />
                <input
                  type="date"
                  name="cutOffDate"
                  value={formData.cutOffDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>船名 *</label>
              <div className="input-with-icon">
                <Ship size={20} />
                <input
                  type="text"
                  name="vesselName"
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  placeholder="如：中远海运宇宙"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>船公司 *</label>
              <select
                name="shippingLine"
                value={formData.shippingLine}
                onChange={handleInputChange}
                required
              >
                <option value="">选择船公司</option>
                {shippingLines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>船舶类型 *</label>
              <select
                name="vesselType"
                value={formData.vesselType}
                onChange={handleInputChange}
                required
              >
                <option value="">选择船舶类型</option>
                {vesselTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>可用舱位 *</label>
              <div className="input-with-icon">
                <Container size={20} />
                <input
                  type="text"
                  name="availableSpace"
                  value={formData.availableSpace}
                  onChange={handleInputChange}
                  placeholder="如：200 TEU 或 5000 吨"
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
                  placeholder="如：¥2,800/TEU"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>航程时间</label>
              <div className="input-with-icon">
                <Clock size={20} />
                <input
                  type="text"
                  name="transitTime"
                  value={formData.transitTime}
                  onChange={handleInputChange}
                  placeholder="如：15天"
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
              <label>集装箱类型</label>
              <select
                name="containerTypes"
                value={formData.containerTypes}
                onChange={handleInputChange}
              >
                <option value="">选择集装箱类型</option>
                {containerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>特殊服务</label>
              <input
                type="text"
                name="specialService"
                value={formData.specialService}
                onChange={handleInputChange}
                placeholder="如：Door to Door、冷链服务、LCL拼箱、项目物流等"
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
                placeholder="其他需要说明的信息，如装卸港要求、订舱条件等..."
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

export default PostSeaCargoModal; 