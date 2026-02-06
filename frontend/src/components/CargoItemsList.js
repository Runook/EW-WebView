import React, { useState, useEffect, useRef } from 'react';
import './CargoItemsList.css';

/**
 * 货物列表组件 - V2
 * 显示和编辑分开的布局
 * 输入格式：板数, 重量, 尺寸(长×宽×高) - CLASS 自动计算
 */
const CargoItemsList = ({ 
  orderId,
  weightList,      // JSON字符串: [500, 600, ...]
  dimensionsList,  // JSON字符串: [{length, width, height, pieces, freightClass}, ...]
  totalWeightLbs,
  totalVolume,
  actualPallets,
  onSave,          // 保存回调
  readOnly = false
}) => {
  const [useMetric, setUseMetric] = useState(true); // 默认使用公制单位
  const [items, setItems] = useState([]);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  // 单位转换
  const kgToLbs = (kg) => kg * 2.20462;
  const lbsToKg = (lbs) => lbs / 2.20462;
  const cmToIn = (cm) => cm / 2.54;
  const inToCm = (inches) => inches * 2.54;

  // NMFC 货物分类映射表 (基于密度 lbs/cu ft)
  const freightClassMap = [
    { minDensity: 50, class: '50' },
    { minDensity: 35, class: '55' },
    { minDensity: 30, class: '60' },
    { minDensity: 22.5, class: '65' },
    { minDensity: 15, class: '70' },
    { minDensity: 13.5, class: '77.5' },
    { minDensity: 12, class: '85' },
    { minDensity: 10.5, class: '92.5' },
    { minDensity: 9, class: '100' },
    { minDensity: 8, class: '110' },
    { minDensity: 7, class: '125' },
    { minDensity: 6, class: '150' },
    { minDensity: 5, class: '175' },
    { minDensity: 4, class: '200' },
    { minDensity: 3, class: '250' },
    { minDensity: 2, class: '300' },
    { minDensity: 1, class: '400' },
    { minDensity: 0, class: '500' }
  ];

  // 自动计算货物 Class
  const calculateFreightClass = (weight, length, width, height) => {
    if (!weight || !length || !width || !height) return '';
    const cubicFeet = (length * width * height) / 1728;
    if (cubicFeet <= 0) return '';
    const density = weight / cubicFeet;
    for (const entry of freightClassMap) {
      if (density >= entry.minDensity) {
        return entry.class;
      }
    }
    return '500';
  };

  // 解析现有数据
  useEffect(() => {
    try {
      const weights = weightList ? JSON.parse(weightList) : [];
      const dims = dimensionsList ? JSON.parse(dimensionsList) : [];
      
      const merged = [];
      const maxLen = Math.max(weights.length, dims.length);
      
      for (let i = 0; i < maxLen; i++) {
        const dim = dims[i] || {};
        const weight = weights[i] || 0;
        const length = dim.length || 0;
        const width = dim.width || 0;
        const height = dim.height || 0;
        
        let freightClass = dim.freightClass || dim.class || '';
        if (!freightClass && weight && length && width && height) {
          freightClass = calculateFreightClass(weight, length, width, height);
        }
        
        merged.push({
          freightClass,
          pallets: dim.pieces || 1,
          weight: weight,
          length: length,
          width: width,
          height: height
        });
      }
      
      setItems(merged.length > 0 ? merged : []);
      
      // 同步更新编辑文本
      updateEditText(merged, useMetric);
    } catch (e) {
      console.error('解析货物数据失败:', e);
      setItems([]);
      setEditText('');
    }
  }, [weightList, dimensionsList]);

  // 更新编辑文本 - 格式：板数, 重量, 尺寸（不包含CLASS，自动计算）
  const updateEditText = (itemsData, metric) => {
    if (!itemsData || itemsData.length === 0) {
      setEditText('');
      return;
    }
    
    let text = '';
    if (metric) {
      text = itemsData.map(item => {
        const weightKg = lbsToKg(item.weight).toFixed(1);
        const lengthCm = inToCm(item.length).toFixed(0);
        const widthCm = inToCm(item.width).toFixed(0);
        const heightCm = inToCm(item.height).toFixed(0);
        return `${item.pallets}, ${weightKg}, ${lengthCm}×${widthCm}×${heightCm}`;
      }).join('\n');
    } else {
      text = itemsData.map(item => {
        return `${item.pallets}, ${Math.round(item.weight)}, ${Math.round(item.length)}×${Math.round(item.width)}×${Math.round(item.height)}`;
      }).join('\n');
    }
    setEditText(text);
  };

  // 单位切换时更新编辑文本
  useEffect(() => {
    updateEditText(items, useMetric);
  }, [useMetric]);

  // 计算总计
  const calculateTotals = () => {
    let totalPallets = 0;
    let totalWeight = 0;
    let totalCubicFeet = 0;

    items.forEach(item => {
      const pallets = parseInt(item.pallets) || 1;
      const weight = parseFloat(item.weight) || 0;
      const length = parseFloat(item.length) || 0;
      const width = parseFloat(item.width) || 0;
      const height = parseFloat(item.height) || 0;

      totalPallets += pallets;
      totalWeight += weight * pallets;
      totalCubicFeet += (length * width * height / 1728) * pallets;
    });

    return { totalPallets, totalWeight, totalCubicFeet };
  };

  const totals = calculateTotals();

  // 解析编辑文本 - 格式：板数, 重量, 尺寸（CLASS自动计算）
  const parseEditText = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const newItems = [];
    
    for (const line of lines) {
      // 支持中文逗号和各种分隔符
      const parts = line.split(/[,，\s\t]+/).filter(p => p.trim() && p !== '-');
      
      if (parts.length >= 3) {
        // 格式: 板数, 重量, 尺寸
        const pallets = parseInt(parts[0]) || 1;
        const weight = parseFloat(parts[1]) || 0;
        
        let length = 0, width = 0, height = 0;
        const dimStr = parts.slice(2).join('');
        const dimMatch = dimStr.match(/(\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)[×xX*](\d+(?:\.\d+)?)/);
        
        if (dimMatch) {
          length = parseFloat(dimMatch[1]);
          width = parseFloat(dimMatch[2]);
          height = parseFloat(dimMatch[3]);
        } else if (parts.length >= 5) {
          // 也支持 板数, 重量, 长, 宽, 高 格式
          length = parseFloat(parts[2]) || 0;
          width = parseFloat(parts[3]) || 0;
          height = parseFloat(parts[4]) || 0;
        }

        if (useMetric) {
          newItems.push({
            freightClass: '', // 自动计算
            pallets,
            weight: kgToLbs(weight),
            length: cmToIn(length),
            width: cmToIn(width),
            height: cmToIn(height)
          });
        } else {
          newItems.push({ 
            freightClass: '', // 自动计算
            pallets, 
            weight, 
            length, 
            width, 
            height 
          });
        }
      }
    }
    
    return newItems;
  };

  // 应用更改
  const handleApply = async () => {
    if (readOnly) return;
    
    try {
      setIsSaving(true);
      const newItems = parseEditText(editText);
      
      if (newItems.length === 0) {
        alert('请输入至少一行货物数据');
        setIsSaving(false);
        return;
      }

      // 自动计算 Class
      const processedItems = newItems.map(item => {
        let freightClass = item.freightClass || '';
        if (!freightClass && item.weight && item.length && item.width && item.height) {
          freightClass = calculateFreightClass(item.weight, item.length, item.width, item.height);
        }
        return { ...item, freightClass };
      });

      // 转换为保存格式
      const weights = processedItems.map(item => Math.round(item.weight));
      const dims = processedItems.map(item => ({
        length: Math.round(item.length),
        width: Math.round(item.width),
        height: Math.round(item.height),
        pieces: item.pallets,
        volume: (item.length * item.width * item.height / 1728),
        freightClass: item.freightClass
      }));

      const totalWeight = processedItems.reduce((sum, item) => sum + (item.weight * item.pallets), 0);
      const totalVol = dims.reduce((sum, d) => sum + (d.volume * d.pieces), 0);
      const totalPallets = processedItems.reduce((sum, item) => sum + item.pallets, 0);

      if (onSave) {
        await onSave(orderId, {
          weight_list: JSON.stringify(weights),
          dimensions_list: JSON.stringify(dims),
          total_weight_lbs: Math.round(totalWeight),
          total_volume: totalVol.toFixed(2),
          actual_pallets: totalPallets
        });
      }

      setItems(processedItems);
      updateEditText(processedItems, useMetric);
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cargo-items-list cargo-split-view">
      <div className="cargo-list-header">
        <h4>📦 货物明细</h4>
        <div className="unit-toggle">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={useMetric} 
              onChange={(e) => setUseMetric(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="unit-label">
            {useMetric ? 'kg/cm' : 'lbs/in'}
          </span>
        </div>
      </div>

      <div className="cargo-split-container">
        {/* 左侧：显示区域 */}
        <div className="cargo-display-panel">
          <div className="panel-title">📋 当前数据</div>
          {items.length > 0 ? (
            <>
              <table className="cargo-table cargo-compact">
                <thead>
                  <tr>
                    <th className="th-num">#</th>
                    <th className="th-pallets">板数</th>
                    <th className="th-weight">重量</th>
                    <th className="th-dims">尺寸</th>
                    <th className="th-volume">体积</th>
                    <th className="th-class">CLASS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const displayWeight = useMetric 
                      ? lbsToKg(item.weight).toFixed(1) + ' kg'
                      : Math.round(item.weight) + ' lbs';
                    const displayL = useMetric ? inToCm(item.length).toFixed(0) : Math.round(item.length);
                    const displayW = useMetric ? inToCm(item.width).toFixed(0) : Math.round(item.width);
                    const displayH = useMetric ? inToCm(item.height).toFixed(0) : Math.round(item.height);
                    const volumeFt = (item.length * item.width * item.height / 1728) * item.pallets;
                    
                    return (
                      <tr key={idx}>
                        <td className="col-num">{idx + 1}</td>
                        <td className="col-pallets">{item.pallets}p</td>
                        <td className="col-weight">{displayWeight}</td>
                        <td className="col-dims">{displayL}×{displayW}×{displayH}</td>
                        <td className="col-volume">{volumeFt.toFixed(2)} ft³</td>
                        <td className="col-class">{item.freightClass || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="cargo-totals">
                <div className="total-item">
                  <span className="total-label">总板数:</span>
                  <span className="total-value">{totals.totalPallets} 板</span>
                </div>
                <div className="total-item">
                  <span className="total-label">总重量:</span>
                  <span className="total-value">
                    {useMetric 
                      ? `${lbsToKg(totals.totalWeight).toFixed(1)} kg` 
                      : `${Math.round(totals.totalWeight)} lbs`
                    }
                  </span>
                </div>
                <div className="total-item">
                  <span className="total-label">总体积:</span>
                  <span className="total-value">{totals.totalCubicFeet.toFixed(2)} ft³</span>
                </div>
              </div>
            </>
          ) : (
            <div className="cargo-empty">暂无货物数据</div>
          )}
        </div>

        {/* 右侧：编辑区域 */}
        {!readOnly && (
          <div className="cargo-edit-panel">
            <div className="panel-title">✏️ 编辑区</div>
            <div className="edit-hint">
              格式: Class, 板数, {useMetric ? '重量(kg)' : '重量(lbs)'}, 尺寸
              <br />
              <small>例: {useMetric ? '70, 2, 150, 100×80×120' : '70, 2, 330, 40×32×48'}</small>
            </div>
            <textarea
              ref={textareaRef}
              className="cargo-textarea"
              rows="6"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={useMetric 
                ? "每行一个货物\n70, 2, 150, 100×80×120\n85, 3, 200, 80×60×100" 
                : "每行一个货物\n70, 2, 330, 40×32×48\n85, 3, 440, 32×24×40"
              }
            />
            <button 
              className="btn-apply" 
              onClick={handleApply}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '✓ 应用更改'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoItemsList;
