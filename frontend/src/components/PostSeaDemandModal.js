import React, { useState } from 'react';
import { X, Package, Calendar, Scale, DollarSign, MapPin, AlertTriangle, Anchor, Container, Shield } from 'lucide-react';
import './Modal.css';

const PostSeaDemandModal = ({ isOpen, onClose, onSubmit }) => {
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
    containerType: '',
    incoterms: '',
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
    '食品安全保险',
    '全险保障'
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
    '20TK (罐箱)',
    'LCL (散货拼箱)',
    '散货船'
  ];

  const incotermsOptions = [
    'EXW (工厂交货)',
    'FCA (货交承运人)',
    'FAS (船边交货)',
    'FOB (船上交货)',
    'CFR (成本加运费)',
    'CIF (成本保险费加运费)',
    'CPT (运费付至)',
    'CIP (运费保险费付至)',
    'DAP (目的地交货)',
    'DPU (目的地卸货交货)',
    'DDP (完税后交货)'
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
      containerType: '',
      incoterms: '',
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
              <label>起始港 *</label>
              <div className="input-with-icon">
                <Anchor size={20} />
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="如：广州南沙港 (CNCAN)"
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
                  placeholder="如：新加坡港 (SGSIN)"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>要求开船日期 *</label>
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
              <label>货物重量/数量 *</label>
              <div className="input-with-icon">
                <Container size={20} />
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="如：20 TEU 或 1000 吨"
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
              <label>集装箱类型 *</label>
              <div className="input-with-icon">
                <Container size={20} />
                <select
                  name="containerType"
                  value={formData.containerType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">选择集装箱类型</option>
                  {containerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>贸易条款</label>
              <select
                name="incoterms"
                value={formData.incoterms}
                onChange={handleInputChange}
              >
                <option value="">选择贸易条款</option>
                {incotermsOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
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
                  placeholder="如：¥1,800/TEU"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>保险需求</label>
              <div className="input-with-icon">
                <Shield size={20} />
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
            </div>

            <div className="form-group full-width">
              <label>特殊要求</label>
              <input
                type="text"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder="如：恒温干燥、超重货物处理、冷藏运输、危险品处理等"
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
                placeholder="请详细描述货物信息、包装要求、时间要求等..."
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

export default PostSeaDemandModal; 