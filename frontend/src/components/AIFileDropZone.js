import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Loader, CheckCircle, AlertCircle, X,
  MapPin, Package, Scale, Ruler, Truck, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { freightApi } from '../config/freightApi';
import './AIFileDropZone.css';

const AIFileDropZone = ({ onOrdersCreated }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filename, setFilename] = useState('');
  const [creating, setCreating] = useState(false);

  // Get Quote modal state
  const [quoteModalIdx, setQuoteModalIdx] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteResults, setQuoteResults] = useState([]);
  const [quoteSortBy, setQuoteSortBy] = useState('price');

  const fileInputRef = useRef(null);

  const getApiBase = () => process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const getAuthToken = () => localStorage.getItem('idToken') || localStorage.getItem('authToken') || '';

  const handleFile = useCallback(async (file) => {
    setError(null);
    setParsing(true);
    setShipments([]);
    setFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${getApiBase()}/agent/parse-file`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status === 504) {
          throw new Error('AI 解析超时，请尝试上传更小的文件，或将大文件拆分后重试');
        }
        throw new Error(`服务器错误 (${res.status})，请稍后重试`);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Parse failed');
      }

      setShipments(data.data.shipments || []);
    } catch (err) {
      console.error('File parse error:', err);
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleClick = () => fileInputRef.current?.click();
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const updateShipment = (idx, field, value) => {
    setShipments(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const updateItem = (shipIdx, itemIdx, field, value) => {
    setShipments(prev => prev.map((s, si) => {
      if (si !== shipIdx) return s;
      const newItems = s.items.map((item, ii) =>
        ii === itemIdx ? { ...item, [field]: field === 'stackable' || field === 'hazmat' ? value : (isNaN(Number(value)) ? value : Number(value)) } : item
      );
      return { ...s, items: newItems };
    }));
  };

  const removeShipment = (idx) => {
    setShipments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateOrders = async () => {
    if (shipments.length === 0) return;
    setCreating(true);
    try {
      const items = shipments.map(s => ({
        tracking_number: s.trackingNumber,
        product_name_en: s.cargoDescription,
        origin_city: s.originCity,
        origin_state: s.originState,
        origin_zip: s.originZip,
        destination_city: s.destinationCity,
        destination_state: s.destinationState,
        destination_zip: s.destinationZip,
        destination_country: 'US',
        company_name: s.companyName,
        recipient_name: s.recipientName,
        phone: s.recipientPhone,
        address: s.recipientAddress,
        address_type: s.destinationLocationType === 'residential' ? 'Residential' : 'Commercial',
        cargo_value: s.cargoValue,
        notes: s.notes,
        dimensions: s.items.map(item => ({
          length: item.length,
          width: item.width,
          height: item.height,
          pieces: item.pallets,
          weight: item.weight
        })),
        total_pieces: s.items.reduce((sum, item) => sum + (item.pallets || 1), 0)
      }));

      const res = await fetch(`${getApiBase()}/agent/parse-and-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items, sourceFile: filename, autoApprove: true })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');

      setShipments([]);
      setFilename('');
      if (onOrdersCreated) onOrdersCreated(data.data.orders);
    } catch (err) {
      console.error('Create orders error:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Get Quote for a specific shipment
  const handleGetQuote = async (idx) => {
    const s = shipments[idx];
    setQuoteModalIdx(idx);
    setQuoteLoading(true);
    setQuoteResults([]);

    try {
      const today = new Date().toISOString().split('T')[0];
      const quoteRequestData = {
        originCity: s.originCity || '',
        originState: s.originState || '',
        originZip: s.originZip || '',
        originCountry: 'US',
        originLocationType: 'commercial',
        destinationCity: s.destinationCity || '',
        destinationState: s.destinationState || '',
        destinationZip: s.destinationZip || '',
        destinationCountry: 'US',
        destinationLocationType: s.destinationLocationType || 'commercial',
        pickupDate: s.pickupDate || today,
        items: s.items.map(item => ({
          description: item.description || s.cargoDescription || 'Freight',
          weight: String(item.weight || 500),
          length: String(item.length || 48),
          width: String(item.width || 40),
          height: String(item.height || 48),
          pallets: String(item.pallets || 1),
          freightClass: item.freightClass || '70',
          stackable: item.stackable !== false,
          hazmat: item.hazmat || false
        })),
        pickupServices: [],
        deliveryServices: [],
        distanceMiles: null
      };

      const quotes = await freightApi.getAllLTLQuotes(quoteRequestData);
      setQuoteResults(quotes || []);
    } catch (err) {
      console.error('Get quote error:', err);
      setError(`获取报价失败: ${err.message}`);
    } finally {
      setQuoteLoading(false);
    }
  };

  const sortedQuoteResults = [...quoteResults].sort((a, b) => {
    if (quoteSortBy === 'price') return (a.price || 0) - (b.price || 0);
    if (quoteSortBy === 'time') {
      const dA = parseInt(String(a.transitDays || '').match(/\d+/)?.[0] || '999');
      const dB = parseInt(String(b.transitDays || '').match(/\d+/)?.[0] || '999');
      return dA - dB;
    }
    if (quoteSortBy === 'name') return (a.carrier || '').localeCompare(b.carrier || '');
    return 0;
  });

  const handleReset = () => {
    setShipments([]);
    setFilename('');
    setError(null);
  };

  // ====== RENDER ======
  return (
    <div className="ai-dropzone-wrapper">
      {/* Drop Zone */}
      {shipments.length === 0 && !parsing && (
        <div
          className={`ai-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.xlsx,.xls,.csv,.txt"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <Upload size={32} className="dropzone-icon" />
          <div className="dropzone-title">AI 智能解析询价文件</div>
          <div className="dropzone-hint">
            拖拽 PDF / Excel / 图片 到此处，或点击上传
          </div>
          <div className="dropzone-formats">
            支持格式: PDF, Excel (.xlsx/.xls), 图片 (PNG/JPG), CSV, TXT
          </div>
        </div>
      )}

      {/* Parsing spinner */}
      {parsing && (
        <div className="ai-parsing">
          <Loader size={28} className="spin" />
          <span>AI 正在解析 <strong>{filename}</strong> ...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="ai-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Parsed Results */}
      {shipments.length > 0 && (
        <div className="ai-results">
          <div className="ai-results-header">
            <div className="results-title">
              <CheckCircle size={18} />
              从 <strong>{filename}</strong> 解析出 {shipments.length} 条货物
            </div>
            <div className="results-actions">
              <button className="btn-create-all" onClick={handleCreateOrders} disabled={creating}>
                {creating ? <Loader size={14} className="spin" /> : <Truck size={14} />}
                {creating ? '创建中...' : '确认创建全部报价单'}
              </button>
              <button className="btn-reset" onClick={handleReset}>
                <X size={14} /> 清除
              </button>
            </div>
          </div>

          {shipments.map((s, idx) => (
            <div key={idx} className="ai-shipment-card">
              <div className="card-header">
                <span className="card-index">#{idx + 1}</span>
                {s.trackingNumber && <span className="card-tracking">{s.trackingNumber}</span>}
                <span className="card-desc">{s.cargoDescription || '未知货物'}</span>
                <div className="card-header-actions">
                  <button
                    className="btn-get-quote"
                    onClick={() => handleGetQuote(idx)}
                    disabled={!s.destinationZip}
                    title={!s.destinationZip ? '需要目的地邮编' : '获取9家运输商报价'}
                  >
                    <Truck size={14} /> Get Quote
                  </button>
                  <button className="btn-remove-card" onClick={() => removeShipment(idx)}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Route */}
                <div className="card-section">
                  <div className="section-label"><MapPin size={13} /> 路线</div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Origin City</label>
                      <input value={s.originCity || ''} onChange={e => updateShipment(idx, 'originCity', e.target.value)} placeholder="City" />
                    </div>
                    <div className="field-group narrow">
                      <label>State</label>
                      <input value={s.originState || ''} onChange={e => updateShipment(idx, 'originState', e.target.value)} placeholder="ST" />
                    </div>
                    <div className="field-group">
                      <label>Zip</label>
                      <input value={s.originZip || ''} onChange={e => updateShipment(idx, 'originZip', e.target.value)} placeholder="Zip" />
                    </div>
                    <span className="route-arrow">→</span>
                    <div className="field-group">
                      <label>Dest City</label>
                      <input value={s.destinationCity || ''} onChange={e => updateShipment(idx, 'destinationCity', e.target.value)} placeholder="City" />
                    </div>
                    <div className="field-group narrow">
                      <label>State</label>
                      <input value={s.destinationState || ''} onChange={e => updateShipment(idx, 'destinationState', e.target.value)} placeholder="ST" />
                    </div>
                    <div className="field-group">
                      <label>Zip</label>
                      <input value={s.destinationZip || ''} onChange={e => updateShipment(idx, 'destinationZip', e.target.value)} placeholder="Zip" />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>地址类型</label>
                      <select value={s.destinationLocationType || 'commercial'} onChange={e => updateShipment(idx, 'destinationLocationType', e.target.value)}>
                        <option value="commercial">Commercial</option>
                        <option value="residential">Residential</option>
                        <option value="limited_access">Limited Access</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>收件人</label>
                      <input value={s.recipientName || ''} onChange={e => updateShipment(idx, 'recipientName', e.target.value)} placeholder="Name" />
                    </div>
                    <div className="field-group">
                      <label>电话</label>
                      <input value={s.recipientPhone || ''} onChange={e => updateShipment(idx, 'recipientPhone', e.target.value)} placeholder="Phone" />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="card-section">
                  <div className="section-label"><Package size={13} /> 货物明细</div>
                  {s.items.map((item, ii) => (
                    <div key={ii} className="item-row">
                      <div className="field-group">
                        <label>Weight (lbs)</label>
                        <input type="number" value={item.weight || ''} onChange={e => updateItem(idx, ii, 'weight', e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label>L (in)</label>
                        <input type="number" value={item.length || ''} onChange={e => updateItem(idx, ii, 'length', e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label>W (in)</label>
                        <input type="number" value={item.width || ''} onChange={e => updateItem(idx, ii, 'width', e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label>H (in)</label>
                        <input type="number" value={item.height || ''} onChange={e => updateItem(idx, ii, 'height', e.target.value)} />
                      </div>
                      <div className="field-group narrow">
                        <label>Pallets</label>
                        <input type="number" value={item.pallets || ''} onChange={e => updateItem(idx, ii, 'pallets', e.target.value)} />
                      </div>
                      <div className="field-group narrow">
                        <label>Class</label>
                        <input value={item.freightClass || ''} onChange={e => updateItem(idx, ii, 'freightClass', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {s.notes && (
                  <div className="card-notes">
                    <span className="notes-label">备注:</span> {s.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {quoteModalIdx !== null && (
        <div className="quote-modal-overlay" onClick={() => { setQuoteModalIdx(null); setQuoteResults([]); }}>
          <div className="quote-modal" onClick={e => e.stopPropagation()}>
            <div className="quote-modal-header">
              <h3>
                <Truck size={18} />
                报价结果 — {shipments[quoteModalIdx]?.cargoDescription || `#${quoteModalIdx + 1}`}
              </h3>
              <div className="quote-route-info">
                {shipments[quoteModalIdx]?.originZip || '?'} → {shipments[quoteModalIdx]?.destinationCity}, {shipments[quoteModalIdx]?.destinationState} {shipments[quoteModalIdx]?.destinationZip}
              </div>
              <button className="quote-modal-close" onClick={() => { setQuoteModalIdx(null); setQuoteResults([]); }}>
                <X size={20} />
              </button>
            </div>

            <div className="quote-modal-body">
              {quoteLoading ? (
                <div className="quote-loading">
                  <Loader size={28} className="spin" />
                  <span>正在从 9 家运输商获取报价...</span>
                </div>
              ) : quoteResults.length > 0 ? (
                <>
                  <div className="quote-sort-bar">
                    <span>排序:</span>
                    <button className={quoteSortBy === 'price' ? 'active' : ''} onClick={() => setQuoteSortBy('price')}>最低价格</button>
                    <button className={quoteSortBy === 'time' ? 'active' : ''} onClick={() => setQuoteSortBy('time')}>最快到达</button>
                    <button className={quoteSortBy === 'name' ? 'active' : ''} onClick={() => setQuoteSortBy('name')}>A-Z</button>
                    <span className="quote-count">{sortedQuoteResults.length} 个报价</span>
                  </div>
                  <div className="quote-list">
                    {sortedQuoteResults.map(q => (
                      <div key={q.id} className="quote-row">
                        <div className="quote-carrier">
                          {q.logo && <img src={q.logo} alt={q.carrier} className="quote-carrier-logo" />}
                          <div>
                            <div className="quote-carrier-name">{q.carrier}</div>
                            <div className="quote-service-type">{q.serviceType}</div>
                          </div>
                        </div>
                        <div className="quote-price">${(q.price || 0).toFixed(2)}</div>
                        <div className="quote-transit">
                          <Clock size={13} /> {q.transitDays || 'TBD'}
                        </div>
                        <div className="quote-extra">
                          {q.isGuaranteed && <span className="badge-guaranteed">Guaranteed</span>}
                          {q.maxLiability && (
                            <span className="badge-liability">
                              Liability: ${q.maxLiability.new?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="quote-empty">未获取到报价，请检查地址和货物信息是否完整。</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFileDropZone;
