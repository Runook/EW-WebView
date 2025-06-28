import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Scale, 
  Package, 
  Info, 
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import './FreightCalculator.css';

const FreightCalculator = () => {
  const [formData, setFormData] = useState({
    weight: '',
    weightKg: '',
    length: '',
    lengthCm: '',
    width: '',
    widthCm: '',
    height: '',
    heightCm: '',
    hazmat: false,
    fragile: false
  });

  const [results, setResults] = useState({
    volume: '',
    density: '',
    freightClass: '',
    classDescription: ''
  });

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

  // 单位转换工具
  const unitConverter = {
    kgToLbs: (kg) => kg ? (parseFloat(kg) * 2.20462).toFixed(1) : '',
    lbsToKg: (lbs) => lbs ? (parseFloat(lbs) / 2.20462).toFixed(1) : '',
    cmToInches: (cm) => cm ? (parseFloat(cm) / 2.54).toFixed(1) : '',
    inchesToCm: (inches) => inches ? (parseFloat(inches) * 2.54).toFixed(1) : ''
  };

  // 计算货运等级
  const calculateFreightClass = () => {
    const { weight, length, width, height, hazmat, fragile } = formData;
    
    if (!weight || !length || !width || !height) {
      setResults({
        volume: '',
        density: '',
        freightClass: '',
        classDescription: ''
      });
      return;
    }
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) {
      setResults({
        volume: '',
        density: '',
        freightClass: '',
        classDescription: ''
      });
      return;
    }
    
    // 计算立方英尺和密度
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    const density = weightNum / cubicFeet;
    
    // 根据密度确定分类代码
    let selectedClass = freightClassMap[freightClassMap.length - 1];
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    // 危险品或易碎品调整
    let finalClass = parseFloat(selectedClass.class);
    if (hazmat) finalClass = Math.max(finalClass, 85);
    if (fragile) finalClass = Math.max(finalClass, 125);
    
    setResults({
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass.toString(),
      classDescription: selectedClass.description + (hazmat || fragile ? ' (特殊货物调整)' : '')
    });
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    let updatedData = {
      ...formData,
      [field]: value
    };
    
    // 处理单位转换
    switch (field) {
      case 'weightKg':
        updatedData.weight = unitConverter.kgToLbs(value);
        break;
      case 'weight':
        updatedData.weightKg = unitConverter.lbsToKg(value);
        break;
      case 'lengthCm':
        updatedData.length = unitConverter.cmToInches(value);
        break;
      case 'length':
        updatedData.lengthCm = unitConverter.inchesToCm(value);
        break;
      case 'widthCm':
        updatedData.width = unitConverter.cmToInches(value);
        break;
      case 'width':
        updatedData.widthCm = unitConverter.inchesToCm(value);
        break;
      case 'heightCm':
        updatedData.height = unitConverter.cmToInches(value);
        break;
      case 'height':
        updatedData.heightCm = unitConverter.inchesToCm(value);
        break;
      default:
        break;
    }
    
    setFormData(updatedData);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      weight: '',
      weightKg: '',
      length: '',
      lengthCm: '',
      width: '',
      widthCm: '',
      height: '',
      heightCm: '',
      hazmat: false,
      fragile: false
    });
    setResults({
      volume: '',
      density: '',
      freightClass: '',
      classDescription: ''
    });
  };

  // 监听输入变化，自动计算
  useEffect(() => {
    calculateFreightClass();
  }, [formData.weight, formData.length, formData.width, formData.height, formData.hazmat, formData.fragile]);

  // 当有计算结果时，在移动端自动滚动到结果区域
  useEffect(() => {
    if (results.freightClass && window.innerWidth <= 480) {
      setTimeout(() => {
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300); // 延迟确保渲染完成
    }
  }, [results.freightClass]);

  return (
    <div className="freight-calculator-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Calculator size={40} />
            </div>
            <div className="header-text">
              <h1>货运计算器</h1>
              <p>专业的LTL货运分类等级计算工具，支持单位自动转换和NMFC标准分类</p>
            </div>
          </div>
        </div>

        <div className="calculator-container">
          <div className="calculator-grid">
            {/* 输入区域 */}
            <div className="input-section">
              <div className="section-header">
                <Package size={24} />
                <h2>货物信息输入</h2>
              </div>
              
              <div className="info-banner">
                <Info size={16} />
                <p>请输入货物的重量和尺寸信息，系统将自动计算NMFC分类等级。支持公制和英制单位自动转换。</p>
              </div>

              <div className="input-form">
                {/* 重量输入 */}
                <div className="input-group">
                  <label className="input-label">
                    <Scale size={18} />
                    重量 (Weight)
                  </label>
                  <div className="dual-unit-input">
                    <div className="unit-input">
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="重量"
                        min="0"
                        step="0.1"
                      />
                      <span className="unit-label">磅 (lbs)</span>
                    </div>
                    <ArrowRight size={16} className="conversion-arrow" />
                    <div className="unit-input">
                      <input
                        type="number"
                        value={formData.weightKg}
                        onChange={(e) => handleInputChange('weightKg', e.target.value)}
                        placeholder="重量"
                        min="0"
                        step="0.1"
                      />
                      <span className="unit-label">公斤 (kg)</span>
                    </div>
                  </div>
                </div>

                {/* 尺寸输入 */}
                <div className="dimensions-group">
                  <h3>尺寸 (Dimensions)</h3>
                  
                  {/* 长度 */}
                  <div className="input-group">
                    <label className="input-label">长度 (Length)</label>
                    <div className="dual-unit-input">
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.length}
                          onChange={(e) => handleInputChange('length', e.target.value)}
                          placeholder="长度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">英寸 (in)</span>
                      </div>
                      <ArrowRight size={16} className="conversion-arrow" />
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.lengthCm}
                          onChange={(e) => handleInputChange('lengthCm', e.target.value)}
                          placeholder="长度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">厘米 (cm)</span>
                      </div>
                    </div>
                  </div>

                  {/* 宽度 */}
                  <div className="input-group">
                    <label className="input-label">宽度 (Width)</label>
                    <div className="dual-unit-input">
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.width}
                          onChange={(e) => handleInputChange('width', e.target.value)}
                          placeholder="宽度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">英寸 (in)</span>
                      </div>
                      <ArrowRight size={16} className="conversion-arrow" />
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.widthCm}
                          onChange={(e) => handleInputChange('widthCm', e.target.value)}
                          placeholder="宽度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">厘米 (cm)</span>
                      </div>
                    </div>
                  </div>

                  {/* 高度 */}
                  <div className="input-group">
                    <label className="input-label">高度 (Height)</label>
                    <div className="dual-unit-input">
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => handleInputChange('height', e.target.value)}
                          placeholder="高度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">英寸 (in)</span>
                      </div>
                      <ArrowRight size={16} className="conversion-arrow" />
                      <div className="unit-input">
                        <input
                          type="number"
                          value={formData.heightCm}
                          onChange={(e) => handleInputChange('heightCm', e.target.value)}
                          placeholder="高度"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit-label">厘米 (cm)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 特殊属性 */}
                <div className="special-attributes">
                  <h3>特殊属性 (Special Characteristics)</h3>
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.fragile}
                        onChange={(e) => handleInputChange('fragile', e.target.checked)}
                      />
                      <span>易碎品 (Fragile)</span>
                    </label>
                    
                    <label className="checkbox-item hazmat">
                      <input
                        type="checkbox"
                        checked={formData.hazmat}
                        onChange={(e) => handleInputChange('hazmat', e.target.checked)}
                      />
                      <span>危险品 (Hazmat)</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={resetForm} className="btn secondary">
                    重置 (Reset)
                  </button>
                </div>
              </div>
            </div>

            {/* 结果区域 */}
            <div className="results-section">
              <div className="section-header">
                <TrendingUp size={24} />
                <h2>计算结果</h2>
              </div>

              {results.freightClass ? (
                <div className="results-content">
                  <div className="results-grid">
                    <div className="result-card">
                      <div className="result-icon">
                        <Layers size={24} />
                      </div>
                      <div className="result-info">
                        <h3>体积</h3>
                        <p className="result-value">{results.volume} ft³</p>
                        <p className="result-description">立方英尺</p>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-icon">
                        <Scale size={24} />
                      </div>
                      <div className="result-info">
                        <h3>密度</h3>
                        <p className="result-value">{results.density} lbs/ft³</p>
                        <p className="result-description">磅每立方英尺</p>
                      </div>
                    </div>

                    <div className="result-card primary">
                      <div className="result-icon">
                        <Package size={24} />
                      </div>
                      <div className="result-info">
                        <h3>NMFC等级</h3>
                        <p className="result-value">Class {results.freightClass}</p>
                        <p className="result-description">运费分类等级</p>
                      </div>
                    </div>
                  </div>

                  <div className="class-description">
                    <div className="description-header">
                      <Info size={20} />
                      <h3>分类说明</h3>
                    </div>
                    <p>{results.classDescription}</p>
                  </div>

                  <div className="calculation-note">
                    <AlertCircle size={16} />
                    <p>
                      NMFC分类基于货物密度自动计算。易碎品最低Class 125，危险品最低Class 85。
                      实际运费可能因承运商政策而有所不同。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-results">
                  <Calculator size={48} />
                  <h3>等待输入</h3>
                  <p>请在左侧输入货物的重量和尺寸信息，系统将自动计算NMFC分类等级。</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 帮助信息 */}
        <div className="help-section">
          <h2>关于NMFC分类</h2>
          <div className="help-grid">
            <div className="help-card">
              <h3>什么是NMFC？</h3>
              <p>NMFC（National Motor Freight Classification）是美国国家汽车货运分类标准，用于确定LTL运输的运费等级。</p>
            </div>
            <div className="help-card">
              <h3>分类依据</h3>
              <p>分类主要基于货物密度（重量/体积比），密度越高，等级越低，运费越便宜。</p>
            </div>
            <div className="help-card">
              <h3>特殊货物</h3>
              <p>易碎品和危险品会自动调整到更高的分类等级，以反映额外的运输风险和成本。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreightCalculator; 