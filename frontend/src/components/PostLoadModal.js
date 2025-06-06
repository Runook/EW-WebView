import React, { useState, useEffect } from 'react';
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
  Shield,
  Calculator,
  AlertCircle,
  Info,
  Phone,
  DollarSign,
  Clock
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
    cargoValue: '', // FTL 货物估价
    // LTL专用字段 - 按照NMFC标准
    originLocationType: 'commercial',
    destinationLocationType: 'commercial',
    pallets: '',
    // 尺寸字段 - 分别输入长宽高
    length: '', // 英寸
    width: '',  // 英寸
    height: '', // 英寸
    // 自动计算字段
    volume: '', // 自动计算的立方英尺
    density: '', // 自动计算的磅/立方英尺
    freightClass: '', // 自动计算的NMFC分类
    // LTL特性
    stackable: true,
    allowMixedLoad: true,
    hazmat: false,
    fragile: false,
    // 联系信息
    contactPhone: '',
    contactEmail: '',
    notes: '',
    companyName: '',
    maxRate: '',
    urgency: '普通'
  });

  const [densityInfo, setDensityInfo] = useState({
    calculated: false,
    density: 0,
    suggestedClass: '',
    classDescription: ''
  });

  // 货物类型选项 - 按照NMFC标准分类
  const cargoTypes = [
    '机械设备 (Machinery)', 
    '汽车配件 (Auto Parts)', 
    '电子设备 (Electronics)', 
    '建筑材料 (Building Materials)',
    '纺织品 (Textiles)', 
    '家具 (Furniture)', 
    '食品饮料 (Food & Beverages)', 
    '化工原料 (Chemicals)',
    '金属制品 (Metal Products)', 
    '纸制品 (Paper Products)', 
    '塑料制品 (Plastic Products)',
    '医药用品 (Pharmaceuticals)', 
    '日用百货 (General Merchandise)', 
    '危险品 (Hazmat)', 
    '其他 (Other)'
  ];

  // 车型要求选项
  const truckTypes = [
    '干货车 (Dry Van)', 
    '平板车 (Flatbed)', 
    '冷藏车 (Refrigerated)', 
    '危险品车 (Hazmat)',
    '超长车 (Stretch)', 
    '超重车 (Heavy Haul)', 
    '升降尾板 (Liftgate Required)', 
    '不限 (Any)'
  ];

  // 地址类型选项
  const locationTypes = [
    { value: 'commercial', label: '商业地址 (Commercial)', icon: Building },
    { value: 'residential', label: '住宅地址 (Residential)', icon: Home },
    { value: 'elevator', label: '需要升降机 (Elevator Required)', icon: Layers },
    { value: 'gated', label: '有门禁/安保 (Gated/Secured)', icon: Shield }
  ];

  // NMFC分类代码映射表 - 基于密度
  const freightClassMap = [
    { minDensity: 50, class: '50', description: 'Class 50 - 高密度货物 (Over 50 lbs/cu ft)' },
    { minDensity: 35, class: '55', description: 'Class 55 - 金属制品 (35-50 lbs/cu ft)' },
    { minDensity: 30, class: '60', description: 'Class 60 - 汽车配件 (30-35 lbs/cu ft)' },
    { minDensity: 22.5, class: '65', description: 'Class 65 - 机械设备 (22.5-30 lbs/cu ft)' },
    { minDensity: 15, class: '70', description: 'Class 70 - 电器设备 (15-22.5 lbs/cu ft)' },
    { minDensity: 13.5, class: '77.5', description: 'Class 77.5 - 轮胎 (13.5-15 lbs/cu ft)' },
    { minDensity: 12, class: '85', description: 'Class 85 - 包装货物 (12-13.5 lbs/cu ft)' },
    { minDensity: 10.5, class: '92.5', description: 'Class 92.5 - 家具 (10.5-12 lbs/cu ft)' },
    { minDensity: 9, class: '100', description: 'Class 100 - 纸制品 (9-10.5 lbs/cu ft)' },
    { minDensity: 8, class: '110', description: 'Class 110 - 纺织品 (8-9 lbs/cu ft)' },
    { minDensity: 7, class: '125', description: 'Class 125 - 小家电 (7-8 lbs/cu ft)' },
    { minDensity: 6, class: '150', description: 'Class 150 - 服装 (6-7 lbs/cu ft)' },
    { minDensity: 5, class: '175', description: 'Class 175 - 易碎品 (5-6 lbs/cu ft)' },
    { minDensity: 4, class: '200', description: 'Class 200 - 包装食品 (4-5 lbs/cu ft)' },
    { minDensity: 3, class: '250', description: 'Class 250 - 易损品 (3-4 lbs/cu ft)' },
    { minDensity: 2, class: '300', description: 'Class 300 - 木制品 (2-3 lbs/cu ft)' },
    { minDensity: 1, class: '400', description: 'Class 400 - 塑料制品 (1-2 lbs/cu ft)' },
    { minDensity: 0, class: '500', description: 'Class 500 - 低密度货物 (Under 1 lb/cu ft)' }
  ];

  // 计算密度和分类代码
  const calculateFreightClass = () => {
    const { weight, length, width, height } = formData;
    
    if (!weight || !length || !width || !height) return;
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) return;
    
    // 计算立方英尺 (长x宽x高 英寸 / 1728)
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    
    // 计算密度 (磅/立方英尺)
    const density = weightNum / cubicFeet;
    
    // 根据密度确定分类代码
    let selectedClass = freightClassMap[freightClassMap.length - 1]; // 默认最低分类
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    // 危险品或易碎品需要特殊处理
    let finalClass = selectedClass.class;
    let classDescription = selectedClass.description;
    
    if (formData.hazmat) {
      // 危险品通常分类更高
      const hazmatClassNum = Math.max(parseFloat(finalClass), 85);
      finalClass = hazmatClassNum.toString();
      classDescription += ' (危险品调整)';
    }
    
    if (formData.fragile) {
      // 易碎品可能需要更高分类
      const fragileClassNum = Math.max(parseFloat(finalClass), 125);
      finalClass = fragileClassNum.toString();
      classDescription += ' (易碎品调整)';
    }
    
    setFormData(prev => ({
      ...prev,
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass
    }));
    
    setDensityInfo({
      calculated: true,
      density: density.toFixed(2),
      suggestedClass: finalClass,
      classDescription: classDescription
    });
  };

  // 监听尺寸和重量变化，自动计算
  useEffect(() => {
    if (formData.serviceType === 'LTL') {
      calculateFreightClass();
    }
  }, [formData.weight, formData.length, formData.width, formData.height, formData.hazmat, formData.fragile, formData.serviceType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 基础验证 - 包含所有必填字段
    const requiredFields = [
      'origin', 'destination', 'pickupDate', 'deliveryDate', 
      'cargoType', 'truckType', 'weight', 'companyName', 
      'contactPhone', 'maxRate', 'urgency'
    ];
    
    // LTL额外必填字段
    if (formData.serviceType === 'LTL') {
      requiredFields.push('pallets', 'length', 'width', 'height');
      
      if (!formData.freightClass) {
        alert('请确保填写完整的尺寸和重量信息，以便自动计算NMFC分类代码');
        return;
      }
    }
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`请填写所有必填字段: ${missingFields.join(', ')}`);
      return;
    }

    // 转换为后端API期望的格式
    const submitData = {
      type: 'load',
      // 后端必填字段
      origin: formData.origin,
      destination: formData.destination,
      requiredDate: formData.pickupDate, // 使用取货日期作为要求日期
      weight: formData.weight,
      cargoType: formData.cargoType,
      urgency: formData.urgency,
      maxRate: formData.maxRate,
      companyName: formData.companyName,
      contactPhone: formData.contactPhone,
      // 可选字段
      contactEmail: formData.contactEmail || '',
      specialRequirements: formData.notes || '',
      serviceType: formData.serviceType,
      cargoValue: formData.cargoValue, // FTL货物估价
      // 保留原始表单数据用于显示
      originalData: {
        ...formData,
        calculatedDensity: densityInfo.density,
        calculatedClass: densityInfo.suggestedClass,
        classDescription: densityInfo.classDescription,
        cargoValue: formData.cargoValue
      }
    };

    onSubmit(submitData);
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
      cargoValue: '',
      originLocationType: 'commercial',
      destinationLocationType: 'commercial',
      pallets: '',
      length: '',
      width: '',
      height: '',
      volume: '',
      density: '',
      freightClass: '',
      stackable: true,
      allowMixedLoad: true,
      hazmat: false,
      fragile: false,
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      maxRate: '',
      urgency: '普通',
      notes: ''
    });
    
    setDensityInfo({
      calculated: false,
      density: 0,
      suggestedClass: '',
      classDescription: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布货源信息 (Post Load)</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 运输类型选择 - 突出显示 */}
          <div className="form-section">
            <h3>运输类型 (Service Type)</h3>
            <div className="service-type-selection">
              <label className={`service-type-option ftl-option ${formData.serviceType === 'FTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="FTL"
                  checked={formData.serviceType === 'FTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Truck size={28} />
                  <div>
                    <strong>整车运输 (FTL)</strong>
                    <p>Full Truckload - 独享整车，适合大批量货物</p>
                    <small>通常 {'>'}10,000 磅或 {'>'} 24 线性英尺</small>
                  </div>
                </div>
              </label>
              
              <label className={`service-type-option ltl-option ${formData.serviceType === 'LTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="LTL"
                  checked={formData.serviceType === 'LTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Package size={28} />
                  <div>
                    <strong>零担运输 (LTL)</strong>
                    <p>Less Than Truckload - 与其他货物拼车，经济实惠</p>
                    <small>通常 150-10,000 磅，需要NMFC分类</small>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 基础信息 */}
          <div className="form-section">
            <h3>基础信息 (Basic Information)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  起点 (Origin) *
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="输入城市或邮编 (City, State or ZIP)"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  终点 (Destination) *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="输入城市或邮编 (City, State or ZIP)"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  取货日期 (Pickup Date) *
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
                  送达日期 (Delivery Date) *
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
            </div>
          </div>

          {/* 货物信息 */}
          <div className="form-section">
            <h3>货物信息 (Commodity Information)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Package size={16} />
                  货物类型 (Commodity Type) *
                </label>
                <select
                  name="cargoType"
                  value={formData.cargoType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">请选择货物类型</option>
                  {cargoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Scale size={16} />
                  重量 (Weight) * (磅)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="输入重量 (lbs)"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  车型要求 (Equipment Type) *
                </label>
                <select
                  name="truckType"
                  value={formData.truckType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">请选择车型要求</option>
                  {truckTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {formData.serviceType === 'FTL' && (
                <div className="form-group">
                  <label>
                    <DollarSign size={16} />
                    货物估价 (Cargo Value)
                  </label>
                  <input
                    type="text"
                    name="cargoValue"
                    value={formData.cargoValue}
                    onChange={handleInputChange}
                    placeholder="如：$50,000 或 50万元"
                  />
                </div>
              )}

              {formData.serviceType === 'LTL' && (
                <div className="form-group">
                  <label>
                    <Layers size={16} />
                    托盘数量 (Pallets) *
                  </label>
                  <input
                    type="number"
                    name="pallets"
                    value={formData.pallets}
                    onChange={handleInputChange}
                    placeholder="托盘数量"
                    min="1"
                    required={formData.serviceType === 'LTL'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* LTL专用 - 尺寸和NMFC计算 */}
          {formData.serviceType === 'LTL' && (
            <div className="form-section ltl-section">
              <h3>
                <Calculator size={20} />
                LTL尺寸计算 & NMFC分类 (LTL Dimensions & NMFC Classification)
              </h3>
              
              <div className="nmfc-info">
                <Info size={16} />
                <p>根据美国NMFC标准，系统将自动计算密度和分类代码。请准确输入货物的长、宽、高尺寸。</p>
              </div>

              <div className="form-grid dimensions-grid">
                <div className="form-group">
                  <label>长度 (Length) * (英寸)</label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    placeholder="长度 (inches)"
                    min="1"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>宽度 (Width) * (英寸)</label>
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    placeholder="宽度 (inches)"
                    min="1"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>高度 (Height) * (英寸)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="高度 (inches)"
                    min="1"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              {/* 自动计算结果显示 */}
              {densityInfo.calculated && (
                <div className="calculation-results">
                  <h4>自动计算结果 (Calculated Results)</h4>
                  <div className="results-grid">
                    <div className="result-item">
                      <strong>体积 (Volume):</strong>
                      <span>{formData.volume} 立方英尺</span>
                    </div>
                    <div className="result-item">
                      <strong>密度 (Density):</strong>
                      <span>{densityInfo.density} lbs/cu ft</span>
                    </div>
                    <div className="result-item freight-class">
                      <strong>NMFC分类 (Freight Class):</strong>
                      <span className="class-badge">Class {densityInfo.suggestedClass}</span>
                    </div>
                    <div className="result-description">
                      <small>{densityInfo.classDescription}</small>
                    </div>
                  </div>
                </div>
              )}

              {/* LTL特殊属性 */}
              <div className="ltl-attributes">
                <h4>特殊属性 (Special Characteristics)</h4>
                <div className="checkbox-grid">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      name="stackable"
                      checked={formData.stackable}
                      onChange={handleInputChange}
                    />
                    <span>可堆叠 (Stackable)</span>
                  </label>
                  
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      name="allowMixedLoad"
                      checked={formData.allowMixedLoad}
                      onChange={handleInputChange}
                    />
                    <span>允许拼车 (Mixed Load OK)</span>
                  </label>
                  
                  <label className="checkbox-item hazmat">
                    <input
                      type="checkbox"
                      name="hazmat"
                      checked={formData.hazmat}
                      onChange={handleInputChange}
                    />
                    <span>危险品 (Hazmat)</span>
                  </label>
                  
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      name="fragile"
                      checked={formData.fragile}
                      onChange={handleInputChange}
                    />
                    <span>易碎品 (Fragile)</span>
                  </label>
                </div>
              </div>

              {/* 地址类型 */}
              <div className="location-types">
                <h4>地址类型 (Location Types)</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>起点类型 (Origin Type)</label>
                    <select
                      name="originLocationType"
                      value={formData.originLocationType}
                      onChange={handleInputChange}
                    >
                      {locationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>终点类型 (Destination Type)</label>
                    <select
                      name="destinationLocationType"
                      value={formData.destinationLocationType}
                      onChange={handleInputChange}
                    >
                      {locationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 联系信息 */}
          <div className="form-section">
            <h3>发布人信息 (Contact Information)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Building size={16} />
                  公司名称 (Company Name) *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="您的公司名称"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Phone size={16} />
                  联系电话 (Phone) *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="form-group">
                <label>联系邮箱 (Email)</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  预估运费 (Estimated Rate) *
                </label>
                <input
                  type="text"
                  name="maxRate"
                  value={formData.maxRate}
                  onChange={handleInputChange}
                  placeholder="如：$2,500 或 面议"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Clock size={16} />
                  紧急程度 (Urgency) *
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="普通">普通 (Normal)</option>
                  <option value="加急">加急 (Urgent)</option>
                  <option value="紧急">紧急 (Critical)</option>
                  <option value="特急">特急 (Emergency)</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>备注信息 (Notes)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="特殊要求、装卸说明等..."
                rows="3"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn secondary">
              取消 (Cancel)
            </button>
            <button type="submit" className="btn primary">
              发布货源 (Post Load)
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