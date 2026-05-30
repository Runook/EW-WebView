import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Loader, Sparkles } from 'lucide-react';
import './CargoItemsList.css';

/**
 * 货物列表组件 - V4
 * - 顶部统一的紧凑工具条（单位切换 + 添加 + 保存中）
 * - 空状态：可拖拽截图/文件/文字的迷你 AI 解析区，自动 kg/cm → lbs/in
 * - 单元格双击编辑，CLASS 按密度自动重算
 */

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

const kgToLbs = (kg) => kg * 2.20462;
const lbsToKg = (lbs) => lbs / 2.20462;
const cmToIn = (cm) => cm / 2.54;
const inToCm = (inches) => inches * 2.54;

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

/* ============================================================
 * 内联 AI 解析（仅货物字段）
 * ============================================================ */
const getApiBase = () => process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const getAuthToken = () => localStorage.getItem('idToken') || localStorage.getItem('authToken') || '';

const CargoAIDropZone = ({ onItemsParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const fileInputRef = useRef(null);

  const callParseFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${getApiBase()}/agent/parse-cargo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`服务器错误 (${res.status}) ${errText.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || '解析失败');
    return data.data;
  };

  const callParseText = async (text) => {
    const res = await fetch(`${getApiBase()}/agent/parse-cargo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`服务器错误 (${res.status}) ${errText.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || '解析失败');
    return data.data;
  };

  const handleParsed = (parsed) => {
    if (!parsed?.items?.length) {
      setError('未识别到货物数据，请尝试更清晰的截图或更完整的描述');
      return;
    }
    onItemsParsed(parsed.items);
    setShowPaste(false);
    setPasteText('');
  };

  const handleFile = useCallback(async (file) => {
    setError(null);
    setParsing(true);
    try {
      const parsed = await callParseFile(file);
      handleParsed(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextSubmit = async () => {
    if (!pasteText.trim()) return;
    setError(null);
    setParsing(true);
    try {
      const parsed = await callParseText(pasteText);
      handleParsed(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (parsing) return;

    // 1) 文件优先
    const file = e.dataTransfer.files?.[0];
    if (file) { handleFile(file); return; }

    // 2) 文本回退
    const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
    if (text && text.trim()) {
      setError(null);
      setParsing(true);
      try {
        const parsed = await callParseText(text);
        handleParsed(parsed);
      } catch (err) {
        setError(err.message);
      } finally {
        setParsing(false);
      }
    }
  };

  const handlePaste = async (e) => {
    if (parsing) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }
    }
  };

  return (
    <div
      className={`cargo-ai-zone ${isDragging ? 'dragging' : ''} ${parsing ? 'parsing' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {parsing ? (
        <div className="cargo-ai-state">
          <Loader size={22} className="spin" />
          <span>AI 正在解析货物数据...</span>
        </div>
      ) : (
        <>
          <div className="cargo-ai-icon">
            <Sparkles size={20} />
          </div>
          <div className="cargo-ai-title">智能解析货物明细</div>
          <div className="cargo-ai-hint">
            拖拽截图 / Excel / PDF 到此处，或粘贴 (⌘V / Ctrl+V) 截图
          </div>
          <div className="cargo-ai-fields">
            支持识别：件数 · 重量 · 长 / 宽 / 高 · 体积 · CLASS（kg/cm 自动换算为 lbs/in）
          </div>
          <div className="cargo-ai-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.xlsx,.xls,.csv,.txt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
              style={{ display: 'none' }}
            />
            <button className="btn-cargo-upload" onClick={() => fileInputRef.current?.click()}>
              <Upload size={13} /> 上传文件
            </button>
            <button className="btn-cargo-paste" onClick={() => setShowPaste((v) => !v)}>
              {showPaste ? '收起' : '粘贴文字'}
            </button>
          </div>

          {showPaste && (
            <div className="cargo-paste-box">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'粘贴货物清单文字，例如：\n件数 重量(kg) 长x宽x高(cm)\n2  500  120x100x90\n1  300  90x80x60'}
                rows={4}
              />
              <button
                className="btn-cargo-parse"
                onClick={handleTextSubmit}
                disabled={!pasteText.trim() || parsing}
              >
                解析
              </button>
            </div>
          )}

          {error && (
            <div className="cargo-ai-error">{error}</div>
          )}
        </>
      )}
    </div>
  );
};

const CargoItemsList = ({
  orderId,
  weightList,
  dimensionsList,
  onSave,
  readOnly = false
}) => {
  const [useMetric, setUseMetric] = useState(false);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const updateItem = (idx, field, rawValue, options = {}) => {
    const { skipClassRecalc = false } = options;
    setItems(prev => {
      const next = prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it };
        if (field === 'weight' || field === 'length' || field === 'width' || field === 'height') {
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

  // AI 解析返回的 items 已经是 lbs/in 内部单位
  const handleAIParsed = (parsedItems) => {
    setItems(prev => {
      const cleaned = parsedItems.map(it => {
        const weight = Number(it.weight) || 0;
        const length = Number(it.length) || 0;
        const width = Number(it.width) || 0;
        const height = Number(it.height) || 0;
        const pallets = parseInt(it.pallets) || 1;
        let freightClass = String(it.freightClass || '').trim();
        if (!freightClass && weight && length && width && height) {
          freightClass = calculateFreightClass(weight, length, width, height);
        }
        return { freightClass, pallets, weight, length, width, height };
      });
      const next = [...prev, ...cleaned];
      pushSave(next);
      return next;
    });
  };

  const totals = items.reduce((acc, it) => {
    const pallets = parseInt(it.pallets) || 1;
    acc.totalPallets += pallets;
    acc.totalWeight += (parseFloat(it.weight) || 0) * pallets;
    acc.totalCubicFeet += ((parseFloat(it.length) || 0) * (parseFloat(it.width) || 0) * (parseFloat(it.height) || 0) / 1728) * pallets;
    return acc;
  }, { totalPallets: 0, totalWeight: 0, totalCubicFeet: 0 });

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
          {isSaving && <span className="cargo-saving">💾 保存中</span>}
          <div
            className={`unit-toggle-group ${useMetric ? 'metric' : 'imperial'}`}
            role="tablist"
            aria-label="单位切换"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!useMetric}
              className={`unit-pill ${!useMetric ? 'active' : ''}`}
              onClick={() => setUseMetric(false)}
            >
              lbs/in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={useMetric}
              className={`unit-pill ${useMetric ? 'active' : ''}`}
              onClick={() => setUseMetric(true)}
            >
              kg/cm
            </button>
          </div>
          {!readOnly && items.length > 0 && (
            <button className="btn-add-row" onClick={addRow} title="添加一行">
              ＋ 添加
            </button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <table className="cargo-table cargo-compact">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th className="th-pallets">件数</th>
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
                          ×
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
              <span className="total-label">总件数</span>
              <span className="total-value">{totals.totalPallets}</span>
            </div>
            <div className="total-item">
              <span className="total-label">总重量</span>
              <span className="total-value">
                {useMetric
                  ? `${lbsToKg(totals.totalWeight).toFixed(1)} kg`
                  : `${Math.round(totals.totalWeight)} lbs`}
              </span>
            </div>
            <div className="total-item">
              <span className="total-label">总体积</span>
              <span className="total-value">{totals.totalCubicFeet.toFixed(2)} ft³</span>
            </div>
            <div className="total-item">
              <span className="total-label">总体积(m³)</span>
              <span className="total-value">{(totals.totalCubicFeet * 0.0283168).toFixed(2)} m³</span>
            </div>
          </div>
        </>
      ) : (
        !readOnly ? (
          <CargoAIDropZone onItemsParsed={handleAIParsed} />
        ) : (
          <div className="cargo-empty">暂无货物数据</div>
        )
      )}
    </div>
  );
};

export default CargoItemsList;
