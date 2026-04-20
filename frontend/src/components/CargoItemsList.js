import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CargoItemsList.css';

/**
 * 货物列表组件 - V3 单栏 + 单元格双击编辑
 * - 每个单元格可直接双击编辑（板数 / 重量 / 长 / 宽 / 高 / CLASS）
 * - 修改 weight/长/宽/高 任一字段 → 自动按密度重算 CLASS 并覆盖
 * - 支持 lbs/in 与 kg/cm 切换
 */

// NMFC 货物分类映射表 (基于密度 lbs/cu ft)
const FREIGHT_CLASS_MAP = [
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

const calculateFreightClass = (weight, length, width, height) => {
  if (!weight || !length || !width || !height) return '';
  const cubicFeet = (length * width * height) / 1728;
  if (cubicFeet <= 0) return '';
  const density = weight / cubicFeet;
  for (const entry of FREIGHT_CLASS_MAP) {
    if (density >= entry.minDensity) return entry.class;
  }
  return '500';
};

// 单位换算
const kgToLbs = (kg) => kg * 2.20462;
const lbsToKg = (lbs) => lbs / 2.20462;
const cmToIn = (cm) => cm / 2.54;
const inToCm = (inches) => inches * 2.54;

// 内联可编辑单元格
const InlineEditCell = ({ value, onCommit, type = 'text', align = 'center', className = '', formatter }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const normalized = type === 'number' ? (draft === '' ? 0 : parseFloat(draft)) : draft;
    if (String(normalized) !== String(value)) {
      onCommit(normalized);
    }
  };
  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <td className={className}>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          className="cargo-inline-input"
          style={{ textAlign: align }}
        />
      </td>
    );
  }
  const display = formatter ? formatter(value) : (value || value === 0 ? value : '-');
  return (
    <td
      className={className}
      onDoubleClick={() => { setDraft(value ?? ''); setEditing(true); }}
      title="双击编辑"
      style={{ cursor: 'pointer' }}
    >
      {display}
    </td>
  );
};

const CargoItemsList = ({
  orderId,
  weightList,      // JSON字符串: [500, 600, ...]
  dimensionsList,  // JSON字符串: [{length, width, height, pieces, freightClass}, ...]
  onSave,
  readOnly = false
}) => {
  const [useMetric, setUseMetric] = useState(false);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
          weight,
          length,
          width,
          height
        });
      }
      setItems(merged);
    } catch (e) {
      console.error('解析货物数据失败:', e);
      setItems([]);
    }
  }, [weightList, dimensionsList]);

  // 推送保存（items 始终以 lbs/in 为内部单位）
  const pushSave = useCallback(async (nextItems) => {
    if (!onSave || readOnly) return;
    try {
      setIsSaving(true);
      const weights = nextItems.map(it => Math.round(it.weight) || 0);
      const dims = nextItems.map(it => ({
        length: Math.round(it.length) || 0,
        width: Math.round(it.width) || 0,
        height: Math.round(it.height) || 0,
        pieces: parseInt(it.pallets) || 1,
        volume: (it.length * it.width * it.height / 1728) || 0,
        freightClass: it.freightClass || ''
      }));
      const totalWeight = nextItems.reduce((s, it) => s + (it.weight * (parseInt(it.pallets) || 1) || 0), 0);
      const totalVol = dims.reduce((s, d) => s + (d.volume * d.pieces), 0);
      const totalPallets = nextItems.reduce((s, it) => s + (parseInt(it.pallets) || 0), 0);
      await onSave(orderId, {
        weight_list: JSON.stringify(weights),
        dimensions_list: JSON.stringify(dims),
        total_weight_lbs: Math.round(totalWeight),
        total_volume: Number(totalVol.toFixed(2)),
        actual_pallets: totalPallets
      });
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, orderId, readOnly]);

  // 更新某行某字段；若修改的是 weight/长/宽/高，自动覆盖重算 CLASS
  const updateItem = (idx, field, rawValue, options = {}) => {
    const { skipClassRecalc = false } = options;
    setItems(prev => {
      const next = prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it };
        if (field === 'weight' || field === 'length' || field === 'width' || field === 'height') {
          // 输入可能是当前显示单位（若 metric），转回内部英制
          let val = parseFloat(rawValue);
          if (Number.isNaN(val)) val = 0;
          if (useMetric) {
            if (field === 'weight') val = kgToLbs(val);
            else val = cmToIn(val);
          }
          updated[field] = val;
          if (!skipClassRecalc) {
            updated.freightClass = calculateFreightClass(
              updated.weight, updated.length, updated.width, updated.height
            );
          }
        } else if (field === 'pallets') {
          updated.pallets = parseInt(rawValue) || 1;
        } else if (field === 'freightClass') {
          updated.freightClass = String(rawValue ?? '').trim();
        }
        return updated;
      });
      pushSave(next);
      return next;
    });
  };

  const addRow = () => {
    setItems(prev => {
      const next = [...prev, { freightClass: '', pallets: 1, weight: 0, length: 0, width: 0, height: 0 }];
      pushSave(next);
      return next;
    });
  };

  const removeRow = (idx) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      pushSave(next);
      return next;
    });
  };

  // 计算总计（内部单位 lbs/in）
  const totals = items.reduce((acc, it) => {
    const pallets = parseInt(it.pallets) || 1;
    acc.totalPallets += pallets;
    acc.totalWeight += (parseFloat(it.weight) || 0) * pallets;
    acc.totalCubicFeet += ((parseFloat(it.length) || 0) * (parseFloat(it.width) || 0) * (parseFloat(it.height) || 0) / 1728) * pallets;
    return acc;
  }, { totalPallets: 0, totalWeight: 0, totalCubicFeet: 0 });

  // 展示用格式化
  const fmtWeight = (lbs) => useMetric
    ? `${lbsToKg(lbs || 0).toFixed(1)}`
    : `${Math.round(lbs || 0)}`;
  const fmtLen = (inches) => useMetric
    ? `${inToCm(inches || 0).toFixed(0)}`
    : `${Math.round(inches || 0)}`;

  return (
    <div className="cargo-items-list">
      <div className="cargo-list-header">
        <h4>📦 货物明细</h4>
        <div className="cargo-header-right">
          <div className="unit-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useMetric}
                onChange={(e) => setUseMetric(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="unit-label">{useMetric ? 'kg/cm' : 'lbs/in'}</span>
          </div>
          {!readOnly && (
            <button className="btn-add-row" onClick={addRow} title="添加一行">
              ➕ 添加
            </button>
          )}
          {isSaving && <span className="cargo-saving">💾 保存中...</span>}
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <table className="cargo-table cargo-compact">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th className="th-pallets">板数</th>
                <th className="th-weight">重量 ({useMetric ? 'kg' : 'lbs'})</th>
                <th className="th-dim">长 ({useMetric ? 'cm' : 'in'})</th>
                <th className="th-dim">宽 ({useMetric ? 'cm' : 'in'})</th>
                <th className="th-dim">高 ({useMetric ? 'cm' : 'in'})</th>
                <th className="th-volume">体积 (ft³)</th>
                <th className="th-class">CLASS</th>
                {!readOnly && <th className="th-action"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const volumeFt = ((parseFloat(item.length) || 0) * (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0) / 1728) * (parseInt(item.pallets) || 1);
                return (
                  <tr key={idx}>
                    <td className="col-num">{idx + 1}</td>
                    {readOnly ? (
                      <td className="col-pallets">{item.pallets}</td>
                    ) : (
                      <InlineEditCell
                        value={item.pallets}
                        type="number"
                        className="col-pallets"
                        formatter={(v) => v}
                        onCommit={(v) => updateItem(idx, 'pallets', v)}
                      />
                    )}
                    {readOnly ? (
                      <td className="col-weight">{fmtWeight(item.weight)}</td>
                    ) : (
                      <InlineEditCell
                        value={useMetric ? Number(lbsToKg(item.weight || 0).toFixed(1)) : Math.round(item.weight || 0)}
                        type="number"
                        className="col-weight"
                        formatter={() => fmtWeight(item.weight)}
                        onCommit={(v) => updateItem(idx, 'weight', v)}
                      />
                    )}
                    {readOnly ? (
                      <td className="col-dims">{fmtLen(item.length)}</td>
                    ) : (
                      <InlineEditCell
                        value={useMetric ? Number(inToCm(item.length || 0).toFixed(0)) : Math.round(item.length || 0)}
                        type="number"
                        className="col-dims"
                        formatter={() => fmtLen(item.length)}
                        onCommit={(v) => updateItem(idx, 'length', v)}
                      />
                    )}
                    {readOnly ? (
                      <td className="col-dims">{fmtLen(item.width)}</td>
                    ) : (
                      <InlineEditCell
                        value={useMetric ? Number(inToCm(item.width || 0).toFixed(0)) : Math.round(item.width || 0)}
                        type="number"
                        className="col-dims"
                        formatter={() => fmtLen(item.width)}
                        onCommit={(v) => updateItem(idx, 'width', v)}
                      />
                    )}
                    {readOnly ? (
                      <td className="col-dims">{fmtLen(item.height)}</td>
                    ) : (
                      <InlineEditCell
                        value={useMetric ? Number(inToCm(item.height || 0).toFixed(0)) : Math.round(item.height || 0)}
                        type="number"
                        className="col-dims"
                        formatter={() => fmtLen(item.height)}
                        onCommit={(v) => updateItem(idx, 'height', v)}
                      />
                    )}
                    <td className="col-volume">{volumeFt.toFixed(2)}</td>
                    {readOnly ? (
                      <td className="col-class">{item.freightClass || '-'}</td>
                    ) : (
                      <InlineEditCell
                        value={item.freightClass}
                        type="text"
                        className="col-class"
                        formatter={(v) => v || '-'}
                        onCommit={(v) => updateItem(idx, 'freightClass', v)}
                      />
                    )}
                    {!readOnly && (
                      <td className="col-action">
                        <button
                          className="btn-remove-row"
                          onClick={() => removeRow(idx)}
                          title="删除此行"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
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
                  : `${Math.round(totals.totalWeight)} lbs`}
              </span>
            </div>
            <div className="total-item">
              <span className="total-label">总体积:</span>
              <span className="total-value">{totals.totalCubicFeet.toFixed(2)} ft³</span>
            </div>
          </div>

          {!readOnly && (
            <div className="cargo-hint">
              提示：双击任意单元格即可编辑。修改「重量」或「长/宽/高」时，CLASS 会按密度自动重算并覆盖。
            </div>
          )}
        </>
      ) : (
        <div className="cargo-empty">
          暂无货物数据
          {!readOnly && (
            <button className="btn-add-empty" onClick={addRow}>
              ➕ 添加第一行
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CargoItemsList;
