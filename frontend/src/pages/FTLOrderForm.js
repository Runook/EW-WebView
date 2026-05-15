import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi, datLoadBoardApi } from '../config/employeeApi';
import employeeApiExports from '../config/employeeApi';
import './BrokerOrderForm.css';
import './FTLOrderForm.css';

const { customerApi } = employeeApiExports;

const getNYDate = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

// DAT 常用设备类型（与后端 datEquipmentTypes.js 保持一致）
const EQUIPMENT_OPTIONS = [
  { code: 'V', name: 'Van' },
  { code: 'R', name: 'Reefer' },
  { code: 'F', name: 'Flatbed' },
  { code: 'VR', name: 'Van or Reefer' },
  { code: 'SD', name: 'Step Deck' },
  { code: 'FT', name: 'Flatbed w/Tarps' },
  { code: 'DD', name: 'Double Drop' },
  { code: 'LB', name: 'Lowboy' },
  { code: 'RG', name: 'Removable Gooseneck' },
  { code: 'AC', name: 'Auto Carrier' },
  { code: 'C', name: 'Container' },
  { code: 'PO', name: 'Power Only' },
  { code: 'HB', name: 'Hopper Bottom' },
  { code: 'TA', name: 'Tanker, Aluminum' },
  { code: 'SV', name: 'Sprinter Van' },
  { code: 'SB', name: 'Straight Box Truck' },
  { code: 'FH', name: 'Flatbed, Hotshot' },
  { code: 'CN', name: 'Conestoga' },
];

const REEFER_EQUIPMENT_CODES = new Set([
  'R', 'RA', 'R2', 'RZ', 'RN', 'RL', 'RM', 'RP', 'RV', 'CR', 'IR', 'BR', 'SC',
]);

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt$ = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

// Parse "Hauppauge, NY 11788" → { city, state, zip }
const parseCombinedLocation = (input) => {
  if (!input) return { city: '', state: '', zip: '' };
  const s = input.trim();
  // Try "City, ST ZIP"
  const m1 = s.match(/^([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)?\s*$/);
  if (m1) return { city: m1[1].trim(), state: m1[2].toUpperCase(), zip: m1[3] || '' };
  // "City, ST"
  const m2 = s.match(/^([^,]+),\s*([A-Za-z]{2})\s*$/);
  if (m2) return { city: m2[1].trim(), state: m2[2].toUpperCase(), zip: '' };
  // just ZIP
  if (/^\d{5}$/.test(s)) return { city: '', state: '', zip: s };
  return { city: s, state: '', zip: '' };
};

const combineLocation = (city, state, zip) =>
  [city, state && `, ${state}`, zip && ` ${zip}`].filter(Boolean).join('').trim();

const initialState = {
  freight_mode: 'FTL',
  quote_date: getNYDate(),
  inquiry_company: '',
  ew_quote_number: '',
  shipment_number: '',

  equipment_type: 'V',
  truck_length_ft: 53,
  team_required: false,
  hazmat: false,
  oversize: false,
  tarp_required: false,
  trailer_vin: '',

  commodity: '',
  cargo_description_detailed: '',
  cargo_value: '',
  total_weight_lbs: '',
  pieces_total: '',
  palletized: false,
  temperature_min: '',
  temperature_max: '',

  origin_city: '',
  origin_state: '',
  origin_zipcode: '',
  destination_city: '',
  destination_state: '',
  destination_zipcode: '',
  transport_distance: '',

  pickup_date: '',
  delivery_date: '',
  pickup_window_start: '',
  pickup_window_end: '',
  pickup_appointment_required: false,
  pickup_reference: '',
  pickup_hours: '',
  delivery_window_start: '',
  delivery_window_end: '',
  delivery_appointment_required: false,
  delivery_reference: '',
  delivery_hours: '',

  // 简化的报价
  ew_quote_price: '',     // 客户总价
  truck_payment: '',      // 司机总付款

  // 详细拆分（高级）
  line_haul_rate: '',
  fuel_surcharge: '',
  customer_accessorials: '',
  customer_extra_fee: '',
  carrier_line_haul: '',
  carrier_fuel_surcharge: '',
  carrier_accessorials: '',
  driver_extra_fee: '',

  rate_per_mile: '',
  profit: '',

  mc_number: '',
  dot_number: '',
  truck_company_name: '',
  truck_contact: '',
  carrier_email: '',
  driver_name: '',
  driver_phone: '',

  status: 'quote',
  sub_status: null,
  notes: '',
};

const FTLOrderForm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const isEditMode = !!orderId;

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Combined Origin / Destination input
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');

  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isReefer = REEFER_EQUIPMENT_CODES.has(formData.equipment_type);

  // 计算利润：
  //   优先用顶层 ew_quote_price / truck_payment（简化报价区填的）
  //   如果空了，再回退到拆分字段（line_haul + FSC + Accessorials + Extra）
  const customerTotal = useMemo(() => {
    const top = num(formData.ew_quote_price);
    if (top > 0) return top + num(formData.customer_extra_fee);
    return (
      num(formData.line_haul_rate) +
      num(formData.fuel_surcharge) +
      num(formData.customer_accessorials) +
      num(formData.customer_extra_fee)
    );
  }, [
    formData.ew_quote_price,
    formData.line_haul_rate,
    formData.fuel_surcharge,
    formData.customer_accessorials,
    formData.customer_extra_fee,
  ]);

  const driverTotal = useMemo(() => {
    const top = num(formData.truck_payment);
    if (top > 0) return top + num(formData.driver_extra_fee);
    return (
      num(formData.carrier_line_haul) +
      num(formData.carrier_fuel_surcharge) +
      num(formData.carrier_accessorials) +
      num(formData.driver_extra_fee)
    );
  }, [
    formData.truck_payment,
    formData.carrier_line_haul,
    formData.carrier_fuel_surcharge,
    formData.carrier_accessorials,
    formData.driver_extra_fee,
  ]);

  const derivedProfit = useMemo(() => customerTotal - driverTotal, [customerTotal, driverTotal]);

  const derivedRpm = useMemo(() => {
    const dist = num(formData.transport_distance);
    if (dist <= 0) return 0;
    return customerTotal / dist;
  }, [customerTotal, formData.transport_distance]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 综合地址输入 → 自动 parse 到 city/state/zip
  const handleOriginText = (value) => {
    setOriginText(value);
    const { city, state, zip } = parseCombinedLocation(value);
    setFormData((prev) => ({
      ...prev,
      origin_city: city || prev.origin_city,
      origin_state: state || prev.origin_state,
      origin_zipcode: zip || prev.origin_zipcode,
    }));
  };

  const handleDestText = (value) => {
    setDestText(value);
    const { city, state, zip } = parseCombinedLocation(value);
    setFormData((prev) => ({
      ...prev,
      destination_city: city || prev.destination_city,
      destination_state: state || prev.destination_state,
      destination_zipcode: zip || prev.destination_zipcode,
    }));
  };

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderById(orderId);
      if (response.success) {
        const o = response.data || {};
        const toLocalDt = (v) => {
          if (!v) return '';
          try {
            const d = new Date(v);
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } catch {
            return '';
          }
        };
        const toDate = (v) => (v ? String(v).slice(0, 10) : '');

        setFormData({
          ...initialState,
          ...o,
          quote_date: (o.quote_date || '').slice(0, 10) || getNYDate(),
          pickup_date: toDate(o.pickup_date),
          delivery_date: toDate(o.delivery_date),
          pickup_window_start: toLocalDt(o.pickup_window_start),
          pickup_window_end: toLocalDt(o.pickup_window_end),
          delivery_window_start: toLocalDt(o.delivery_window_start),
          delivery_window_end: toLocalDt(o.delivery_window_end),
          total_weight_lbs: o.total_weight_lbs || '',
          pieces_total: o.pieces_total || '',
          temperature_min: o.temperature_min ?? '',
          temperature_max: o.temperature_max ?? '',
          transport_distance: o.transport_distance || '',
          ew_quote_price: o.ew_quote_price || '',
          truck_payment: o.truck_payment || '',
          line_haul_rate: o.line_haul_rate || '',
          fuel_surcharge: o.fuel_surcharge || '',
          customer_accessorials: o.customer_accessorials || '',
          customer_extra_fee: o.customer_extra_fee || '',
          carrier_line_haul: o.carrier_line_haul || '',
          carrier_fuel_surcharge: o.carrier_fuel_surcharge || '',
          carrier_accessorials: o.carrier_accessorials || '',
          driver_extra_fee: o.driver_extra_fee || '',
          rate_per_mile: o.rate_per_mile || '',
          profit: o.profit || '',
          truck_length_ft: o.truck_length_ft || 53,
          equipment_type: o.equipment_type || 'V',
          freight_mode: o.freight_mode || 'FTL',
        });
        setOriginText(combineLocation(o.origin_city, o.origin_state, o.origin_zipcode));
        setDestText(combineLocation(o.destination_city, o.destination_state, o.destination_zipcode));
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      alert('加载订单失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isEditMode) loadOrder();
  }, [isEditMode, loadOrder]);

  const searchCompany = useCallback(async (keyword) => {
    if (!keyword || keyword.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    try {
      const res = await customerApi.searchCustomers(keyword);
      setCompanySuggestions(res.data || []);
      setShowSuggestions(true);
    } catch {
      setCompanySuggestions([]);
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      setLoading(true);
      const submitData = {
        ...formData,
        freight_mode: 'FTL',
        order_type: 'land_freight',
        customer_name: formData.inquiry_company || '未命名客户',
        cargo_description: formData.commodity || formData.cargo_description_detailed || 'FTL 整车',
        total_weight_lbs: formData.total_weight_lbs === '' ? null : formData.total_weight_lbs,
        pieces_total: formData.pieces_total === '' ? null : formData.pieces_total,
        temperature_min: formData.temperature_min === '' ? null : formData.temperature_min,
        temperature_max: formData.temperature_max === '' ? null : formData.temperature_max,
        transport_distance: formData.transport_distance === '' ? null : formData.transport_distance,
        ew_quote_price: formData.ew_quote_price === '' ? null : formData.ew_quote_price,
        truck_payment: formData.truck_payment === '' ? null : formData.truck_payment,
        line_haul_rate: formData.line_haul_rate === '' ? null : formData.line_haul_rate,
        fuel_surcharge: formData.fuel_surcharge === '' ? null : formData.fuel_surcharge,
        customer_accessorials: formData.customer_accessorials === '' ? null : formData.customer_accessorials,
        carrier_line_haul: formData.carrier_line_haul === '' ? null : formData.carrier_line_haul,
        carrier_fuel_surcharge: formData.carrier_fuel_surcharge === '' ? null : formData.carrier_fuel_surcharge,
        carrier_accessorials: formData.carrier_accessorials === '' ? null : formData.carrier_accessorials,
        truck_length_ft: formData.truck_length_ft === '' ? null : formData.truck_length_ft,
        pickup_window_start: formData.pickup_window_start || null,
        pickup_window_end: formData.pickup_window_end || null,
        delivery_window_start: formData.delivery_window_start || null,
        delivery_window_end: formData.delivery_window_end || null,
      };

      let response;
      if (isEditMode) {
        response = await orderApi.updateOrder(orderId, submitData);
      } else {
        response = await orderApi.createOrder(submitData);
      }
      if (response.success) {
        alert(isEditMode ? 'FTL 订单已更新' : 'FTL 订单已创建');
        navigate('/employee/ftl-orders?status=quote');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!window.confirm('确定将此 FTL 订单标记为"已下单"？')) return;
    try {
      const response = await orderApi.confirmOrder(orderId, 'waiting_driver');
      if (response.success) navigate('/employee/ftl-orders?status=ordered');
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  const handleCompleteOrder = async () => {
    if (!window.confirm('确定将此 FTL 订单标记为"已完成"？')) return;
    try {
      const response = await orderApi.completeOrder(orderId);
      if (response.success) navigate('/employee/ftl-orders?status=completed');
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  const handlePostToDAT = async () => {
    if (!isEditMode) {
      alert('请先保存订单再 Post 到 DAT');
      return;
    }
    if (!window.confirm('将此 FTL 订单 Post 到 DAT Load Board?')) return;
    setPosting(true);
    try {
      const res = await datLoadBoardApi.postFromOrder(orderId);
      if (res.success) alert(`已 Post 到 DAT，Post ID: ${res.data.datPostId}`);
    } catch (err) {
      alert(`Post 失败: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="broker-order-form-container ftl-form-v2">
      <div className="form-header">
        <div className="header-left">
          <h1>{isEditMode ? '编辑 FTL 整车订单' : '新建 FTL 整车订单'}</h1>
          <span className="ftl-badge">FTL</span>
          {isEditMode && formData.status && (
            <span className={`status-indicator status-${formData.status}`}>
              {formData.status === 'quote' && '报价单'}
              {formData.status === 'ordered' && '已下单'}
              {formData.status === 'completed' && '已完成'}
              {formData.status === 'cancelled' && '已取消'}
            </span>
          )}
        </div>
        <div className="form-actions-top">
          {isEditMode && (
            <button type="button" className="btn-dat" onClick={handlePostToDAT} disabled={posting}>
              {posting ? 'Posting...' : 'Post to DAT'}
            </button>
          )}
          {isEditMode && formData.status === 'quote' && (
            <button type="button" className="btn-confirm" onClick={handleConfirmOrder}>
              确认下单
            </button>
          )}
          {isEditMode && formData.status === 'ordered' && (
            <button type="button" className="btn-complete" onClick={handleCompleteOrder}>
              标记完成
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => navigate('/employee/ftl-orders')}>
            返回列表
          </button>
          <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <form className="order-form ftl-form-compact" onSubmit={handleSubmit}>

        {/* === 基础信息 (一行紧凑) === */}
        <div className="ftl-card">
          <div className="ftl-row">
            <div className="ftl-field" style={{ flex: 2, position: 'relative' }}>
              <label>询价公司 *</label>
              <input
                type="text"
                placeholder="公司名称"
                value={formData.inquiry_company}
                onChange={(e) => {
                  handleChange('inquiry_company', e.target.value);
                  searchCompany(e.target.value);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && companySuggestions.length > 0 && (
                <div className="company-suggestions">
                  {companySuggestions.map((c) => (
                    <div
                      key={c.id}
                      className="suggestion-item"
                      onMouseDown={() => {
                        handleChange('inquiry_company', c.company_name);
                        setShowSuggestions(false);
                      }}
                    >
                      {c.company_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ftl-field">
              <label>WE 报价单号</label>
              <input
                type="text"
                value={formData.ew_quote_number}
                onChange={(e) => handleChange('ew_quote_number', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>报价日期</label>
              <input
                type="date"
                value={formData.quote_date}
                onChange={(e) => handleChange('quote_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === Shipment Details (DAT 风格) === */}
        <div className="ftl-card">
          <h3 className="ftl-section-title">Shipment Details</h3>
          <div className="ftl-row">
            <div className="ftl-field" style={{ flex: 1 }}>
              <label>Origin (City, ST, ZIP) *</label>
              <input
                type="text"
                placeholder="如：Hauppauge, NY 11788"
                value={originText}
                onChange={(e) => handleOriginText(e.target.value)}
              />
            </div>
            <div className="ftl-field" style={{ flex: 1 }}>
              <label>Destination (City, ST, ZIP) *</label>
              <input
                type="text"
                placeholder="如：Flushing, NY 11354"
                value={destText}
                onChange={(e) => handleDestText(e.target.value)}
              />
            </div>
          </div>
          <div className="ftl-row">
            <div className="ftl-field">
              <label>Pickup Earliest *</label>
              <input
                type="date"
                value={formData.pickup_date}
                onChange={(e) => handleChange('pickup_date', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>Pickup Latest</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => handleChange('delivery_date', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>Pickup Hours</label>
              <input
                type="text"
                placeholder="如：08:00-17:00"
                value={formData.pickup_hours}
                onChange={(e) => handleChange('pickup_hours', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>Drop Off Hours</label>
              <input
                type="text"
                placeholder="如：08:00-17:00"
                value={formData.delivery_hours}
                onChange={(e) => handleChange('delivery_hours', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === Equipment Details (DAT 风格) === */}
        <div className="ftl-card">
          <h3 className="ftl-section-title">Equipment Details</h3>
          <div className="ftl-row">
            <div className="ftl-field" style={{ flex: 1.2 }}>
              <label>Equipment Type *</label>
              <select
                value={formData.equipment_type}
                onChange={(e) => handleChange('equipment_type', e.target.value)}
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq.code} value={eq.code}>
                    {eq.name} — {eq.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="ftl-field">
              <label>Length (ft) *</label>
              <input
                type="number"
                placeholder="53"
                value={formData.truck_length_ft}
                onChange={(e) => handleChange('truck_length_ft', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>Weight (lbs) *</label>
              <input
                type="number"
                placeholder="40000"
                value={formData.total_weight_lbs}
                onChange={(e) => handleChange('total_weight_lbs', e.target.value)}
              />
            </div>
          </div>
          <div className="ftl-row">
            <div className="ftl-field" style={{ flex: 1 }}>
              <label>Commodity 货物</label>
              <input
                type="text"
                placeholder="如：General Freight"
                value={formData.commodity}
                onChange={(e) => handleChange('commodity', e.target.value)}
              />
            </div>
            <div className="ftl-field" style={{ flex: 1 }}>
              <label>Reference ID</label>
              <input
                type="text"
                placeholder="PO / Reference"
                value={formData.pickup_reference}
                onChange={(e) => handleChange('pickup_reference', e.target.value)}
              />
            </div>
          </div>
          <div className="ftl-row">
            <div className="ftl-field" style={{ flex: 1 }}>
              <label>Comments</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === 报价（broker 业务核心，简化版）=== */}
        <div className="ftl-card ftl-pricing-card">
          <h3 className="ftl-section-title">报价 / Booking & Rate</h3>
          <div className="ftl-row">
            <div className="ftl-field">
              <label>客户报价 (Total)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ew_quote_price}
                onChange={(e) => handleChange('ew_quote_price', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>司机付款 (Total)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.truck_payment}
                onChange={(e) => handleChange('truck_payment', e.target.value)}
              />
            </div>
            <div className="ftl-field">
              <label>运输距离 (mi)</label>
              <input
                type="number"
                placeholder="800"
                value={formData.transport_distance}
                onChange={(e) => handleChange('transport_distance', e.target.value)}
              />
            </div>
          </div>
          <div className="ftl-summary-row">
            <div className="summary-item">
              <span className="label">客户总价</span>
              <span className="value customer">{fmt$(customerTotal)}</span>
            </div>
            <div className="summary-item">
              <span className="label">司机付款</span>
              <span className="value driver">{fmt$(driverTotal)}</span>
            </div>
            <div className="summary-item">
              <span className="label">RPM</span>
              <span className="value">${derivedRpm.toFixed(2)}</span>
            </div>
            <div className="summary-item profit-item">
              <span className="label">利润 Profit</span>
              <span className={`value profit ${derivedProfit < 0 ? 'negative' : ''}`}>
                {fmt$(derivedProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* === 高级选项（折叠）=== */}
        <details className="ftl-advanced">
          <summary>▶ 高级选项（旗标 / 详细时间窗 / 定价拆分）</summary>

          {/* 旗标 */}
          <div className="ftl-card ftl-card-nested">
            <h4 className="ftl-subsection-title">附加旗标</h4>
            <div className="flags-row">
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={formData.hazmat}
                  onChange={(e) => handleChange('hazmat', e.target.checked)}
                />
                Hazmat 危险品
              </label>
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={formData.team_required}
                  onChange={(e) => handleChange('team_required', e.target.checked)}
                />
                Team 双司机
              </label>
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={formData.oversize}
                  onChange={(e) => handleChange('oversize', e.target.checked)}
                />
                Oversize 超尺寸
              </label>
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={formData.tarp_required}
                  onChange={(e) => handleChange('tarp_required', e.target.checked)}
                />
                Tarp 篷布
              </label>
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={formData.palletized}
                  onChange={(e) => handleChange('palletized', e.target.checked)}
                />
                Palletized 板装
              </label>
            </div>

            {/* Reefer 温度 */}
            {isReefer && (
              <div className="ftl-row" style={{ marginTop: 12 }}>
                <div className="ftl-field">
                  <label>温度下限 (°F)</label>
                  <input
                    type="number"
                    value={formData.temperature_min}
                    onChange={(e) => handleChange('temperature_min', e.target.value)}
                  />
                </div>
                <div className="ftl-field">
                  <label>温度上限 (°F)</label>
                  <input
                    type="number"
                    value={formData.temperature_max}
                    onChange={(e) => handleChange('temperature_max', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 详细时间窗 */}
          <div className="ftl-card ftl-card-nested">
            <h4 className="ftl-subsection-title">详细取货 & 送货</h4>
            <div className="ftl-row">
              <div className="ftl-field">
                <label>取货时间窗 - 起</label>
                <input
                  type="datetime-local"
                  value={formData.pickup_window_start}
                  onChange={(e) => handleChange('pickup_window_start', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>取货时间窗 - 止</label>
                <input
                  type="datetime-local"
                  value={formData.pickup_window_end}
                  onChange={(e) => handleChange('pickup_window_end', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label className="flag-toggle" style={{ marginTop: 24 }}>
                  <input
                    type="checkbox"
                    checked={formData.pickup_appointment_required}
                    onChange={(e) => handleChange('pickup_appointment_required', e.target.checked)}
                  />
                  取货需预约
                </label>
              </div>
            </div>
            <div className="ftl-row">
              <div className="ftl-field">
                <label>送货时间窗 - 起</label>
                <input
                  type="datetime-local"
                  value={formData.delivery_window_start}
                  onChange={(e) => handleChange('delivery_window_start', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>送货时间窗 - 止</label>
                <input
                  type="datetime-local"
                  value={formData.delivery_window_end}
                  onChange={(e) => handleChange('delivery_window_end', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label className="flag-toggle" style={{ marginTop: 24 }}>
                  <input
                    type="checkbox"
                    checked={formData.delivery_appointment_required}
                    onChange={(e) => handleChange('delivery_appointment_required', e.target.checked)}
                  />
                  送货需预约
                </label>
              </div>
            </div>
            <div className="ftl-row">
              <div className="ftl-field" style={{ flex: 1 }}>
                <label>送货 Reference</label>
                <input
                  type="text"
                  value={formData.delivery_reference}
                  onChange={(e) => handleChange('delivery_reference', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 定价拆分 */}
          <div className="ftl-card ftl-card-nested">
            <h4 className="ftl-subsection-title">定价拆分（覆盖顶层"客户报价/司机付款"）</h4>
            <div className="ftl-pricing-grid">
              <div>
                <div className="ftl-pricing-label customer">客户侧</div>
                <div className="ftl-row">
                  <div className="ftl-field">
                    <label>Line Haul</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.line_haul_rate}
                      onChange={(e) => handleChange('line_haul_rate', e.target.value)}
                    />
                  </div>
                  <div className="ftl-field">
                    <label>FSC</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fuel_surcharge}
                      onChange={(e) => handleChange('fuel_surcharge', e.target.value)}
                    />
                  </div>
                </div>
                <div className="ftl-row">
                  <div className="ftl-field">
                    <label>Accessorials</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.customer_accessorials}
                      onChange={(e) => handleChange('customer_accessorials', e.target.value)}
                    />
                  </div>
                  <div className="ftl-field">
                    <label>其他</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.customer_extra_fee}
                      onChange={(e) => handleChange('customer_extra_fee', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="ftl-pricing-label driver">司机侧</div>
                <div className="ftl-row">
                  <div className="ftl-field">
                    <label>Line Haul</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.carrier_line_haul}
                      onChange={(e) => handleChange('carrier_line_haul', e.target.value)}
                    />
                  </div>
                  <div className="ftl-field">
                    <label>FSC</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.carrier_fuel_surcharge}
                      onChange={(e) => handleChange('carrier_fuel_surcharge', e.target.value)}
                    />
                  </div>
                </div>
                <div className="ftl-row">
                  <div className="ftl-field">
                    <label>Accessorials</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.carrier_accessorials}
                      onChange={(e) => handleChange('carrier_accessorials', e.target.value)}
                    />
                  </div>
                  <div className="ftl-field">
                    <label>其他</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.driver_extra_fee}
                      onChange={(e) => handleChange('driver_extra_fee', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* === 承运商信息（仅下单后）=== */}
        {isEditMode && (formData.status === 'ordered' || formData.status === 'completed') && (
          <div className="ftl-card">
            <h3 className="ftl-section-title">承运商 / 卡车信息</h3>
            <div className="ftl-row">
              <div className="ftl-field">
                <label>MC Number</label>
                <input
                  type="text"
                  value={formData.mc_number}
                  onChange={(e) => handleChange('mc_number', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>DOT</label>
                <input
                  type="text"
                  value={formData.dot_number}
                  onChange={(e) => handleChange('dot_number', e.target.value)}
                />
              </div>
              <div className="ftl-field" style={{ flex: 2 }}>
                <label>卡车公司</label>
                <input
                  type="text"
                  value={formData.truck_company_name}
                  onChange={(e) => handleChange('truck_company_name', e.target.value)}
                />
              </div>
            </div>
            <div className="ftl-row">
              <div className="ftl-field">
                <label>联系人</label>
                <input
                  type="text"
                  value={formData.truck_contact}
                  onChange={(e) => handleChange('truck_contact', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.carrier_email}
                  onChange={(e) => handleChange('carrier_email', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>司机姓名</label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => handleChange('driver_name', e.target.value)}
                />
              </div>
              <div className="ftl-field">
                <label>司机电话</label>
                <input
                  type="text"
                  value={formData.driver_phone}
                  onChange={(e) => handleChange('driver_phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FTLOrderForm;
