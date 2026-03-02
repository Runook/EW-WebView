import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi } from '../config/employeeApi';
import employeeApiExports from '../config/employeeApi';
import { parseWeightList, parseDimensionsList, calculateTotalVolume, validateWeightDimensionMatch } from '../utils/pasteParser';
import './BrokerOrderForm.css';

const { customerApi } = employeeApiExports;

// 获取纽约时间的 YYYY-MM-DD 格式日期
const getNYDate = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
};

const BrokerOrderForm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const isEditMode = !!orderId;

  const [formData, setFormData] = useState({
    // 基础信息
    quote_date: getNYDate(),
    inquiry_company: '',
    ew_quote_number: '',
    shipment_number: '',
    cargo_description_detailed: '',
    
    // 地址
    origin_address: '',
    origin_city: '',
    origin_state: '',
    origin_zipcode: '',
    destination_address: '',
    destination_city: '',
    destination_state: '',
    destination_zipcode: '',
    address_type: 'Commercial',
    
    // 重量和尺寸（文本输入）
    weight_input: '',
    dimensions_input: '',
    
    // 解析后的数据
    weight_list: [],
    total_weight_lbs: 0,
    dimensions_list: [],
    total_volume: 0,
    
    // 其他信息
    cargo_type: '',
    cargo_value: '',
    ew_quote_price: '',
    actual_pallets: '',
    total_area_pallets: '',
    total_dat: '',
    driver_payment: '',
    truck_size: '',
    transport_distance: '',
    
    // 新增计算字段
    ideal_quote: '',
    truck_pallets: '',
    tql_price_1: '',
    tql_price_2: '',
    other_api_price: '',
    quote_reference: '',
    quote_ref_10: '',
    quote_ref_20: '',
    quote_ref_30: '',
    
    platform_quote_1: '',
    platform_quote_2: '',
    pre_quote_price: '',
    ew_final_price: '',
    dat_sales_1: '',
    dat_sales_2: '',
    dat_sales_3: '',
    profit: '',
    
    // 下单后填写的卡车信息
    truck_payment: '',
    mc_number: '',
    truck_company_name: '',
    truck_contact: '',
    
    // 状态（新建时默认为quote）
    status: 'quote',
    sub_status: null,
    
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Company autocomplete
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustData, setNewCustData] = useState({ company_name: '', billing_address: '', contact_phone: '', contact_email: '' });

  const searchCompany = useCallback(async (keyword) => {
    if (!keyword || keyword.length < 2) { setCompanySuggestions([]); return; }
    try {
      const res = await customerApi.searchCustomers(keyword);
      setCompanySuggestions(res.data || []);
      setShowSuggestions(true);
    } catch (e) { setCompanySuggestions([]); }
  }, []);

  const handleCompanyInput = (value) => {
    handleChange('inquiry_company', value);
    searchCompany(value);
  };

  const selectCompany = (cust) => {
    handleChange('inquiry_company', cust.company_name);
    setShowSuggestions(false);
    setCompanySuggestions([]);
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustData.company_name) { alert('Company name is required'); return; }
    try {
      await customerApi.createCustomer({
        ...newCustData,
        billing_address: newCustData.billing_address,
        contact_phone: newCustData.contact_phone,
        contact_email: newCustData.contact_email,
      });
      handleChange('inquiry_company', newCustData.company_name);
      setShowNewCustomerForm(false);
      setNewCustData({ company_name: '', billing_address: '', contact_phone: '', contact_email: '' });
      alert('Customer created');
    } catch (e) { alert('Failed: ' + e.message); }
  };

  useEffect(() => {
    if (isEditMode) {
      loadOrder();
    }
  }, [orderId]);

  // 重量输入处理
  useEffect(() => {
    if (formData.weight_input) {
      const result = parseWeightList(formData.weight_input);
      setFormData(prev => ({
        ...prev,
        weight_list: result.weights,
        total_weight_lbs: result.total
      }));
    }
  }, [formData.weight_input]);

  // 尺寸输入处理
  useEffect(() => {
    if (formData.dimensions_input) {
      const result = parseDimensionsList(formData.dimensions_input);
      const totalVol = calculateTotalVolume(result);
      setFormData(prev => ({
        ...prev,
        dimensions_list: result,
        total_volume: totalVol
      }));
    }
  }, [formData.dimensions_input]);

  // 验证重量和尺寸匹配
  useEffect(() => {
    const validation = validateWeightDimensionMatch(formData.weight_list, formData.dimensions_list);
    setValidationError(validation.isValid ? '' : validation.message);
  }, [formData.weight_list, formData.dimensions_list]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderById(orderId);
      
      if (response.success) {
        const order = response.data;
        
        // 安全解析JSON字段
        let weightList = [];
        let dimensionsList = [];
        
        try {
          weightList = order.weight_list ? JSON.parse(order.weight_list) : [];
        } catch (e) {
          console.warn('解析weight_list失败:', e);
        }
        
        try {
          dimensionsList = order.dimensions_list ? JSON.parse(order.dimensions_list) : [];
        } catch (e) {
          console.warn('解析dimensions_list失败:', e);
        }
        
        // 将数据填充到表单
        setFormData({
          ...order,
          // 转换为前端格式
          weight_input: weightList.length > 0 ? weightList.join('\n') : '',
          dimensions_input: dimensionsList.length > 0 ? 
            dimensionsList.map(d => d.original || `${d.length}*${d.width}*${d.height}${d.pieces > 1 ? ` ${d.pieces}p` : ''}`).join('\n') : '',
          weight_list: weightList,
          dimensions_list: dimensionsList,
          // 确保数字类型
          total_weight_lbs: parseFloat(order.total_weight_lbs) || 0,
          total_volume: parseFloat(order.total_volume) || 0,
          cargo_value: parseFloat(order.cargo_value) || '',
          ew_quote_price: parseFloat(order.ew_quote_price) || '',
          actual_pallets: parseInt(order.actual_pallets) || '',
          total_dat: parseFloat(order.total_dat) || '',
          driver_payment: parseFloat(order.driver_payment) || '',
          platform_quote_1: parseFloat(order.platform_quote_1) || '',
          platform_quote_2: parseFloat(order.platform_quote_2) || '',
          pre_quote_price: parseFloat(order.pre_quote_price) || '',
          ew_final_price: parseFloat(order.ew_final_price) || '',
          dat_sales_1: parseFloat(order.dat_sales_1) || '',
          dat_sales_2: parseFloat(order.dat_sales_2) || '',
          dat_sales_3: parseFloat(order.dat_sales_3) || '',
          profit: parseFloat(order.profit) || ''
        });
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      alert('加载订单失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validationError) {
      alert(validationError);
      return;
    }

    // 准备提交数据（在 try 外部定义，以便在 catch 块中也能访问）
    const submitData = {
      ...formData,
      weight_list: JSON.stringify(formData.weight_list),
      dimensions_list: JSON.stringify(formData.dimensions_list),
      order_type: 'land_freight',
      customer_name: formData.inquiry_company || '未命名客户',
      // 兼容后端验证（后端还在验证老字段）
      cargo_description: formData.cargo_description_detailed || '货物描述'
    };
    
    // 移除前端临时字段
    delete submitData.weight_input;
    delete submitData.dimensions_input;

    try {
      setLoading(true);
      
      // Debug输出
      console.log('📤 提交订单数据:', {
        customer_name: submitData.customer_name,
        order_type: submitData.order_type,
        cargo_description: submitData.cargo_description,
        cargo_description_detailed: submitData.cargo_description_detailed,
        inquiry_company: submitData.inquiry_company,
        quote_date: submitData.quote_date
      });
      
      let response;
      if (isEditMode) {
        response = await orderApi.updateOrder(orderId, submitData);
      } else {
        response = await orderApi.createOrder(submitData);
      }
      
      if (response.success) {
        alert(isEditMode ? '订单更新成功！' : '订单创建成功！');
        navigate('/employee/broker-orders?status=quote');
      }
    } catch (error) {
      console.error('❌ 保存订单失败:', error);
      console.error('错误详情:', error.response || error);
      
      // 处理需要确认更换操作员的情况
      if (error.response?.code === 'OPERATOR_CHANGE_REQUIRED') {
        const details = error.response.details;
        const message = `此订单不是你的订单！\n\n` +
          `当前操作员：${details.currentOperator.name}\n` +
          `订单编号：${details.orderNumber}\n` +
          `订单状态：${details.status}\n\n` +
          `是否要更换操作员为你自己？`;
        
        if (window.confirm(message)) {
          // 用户确认更换操作员，重新提交
          try {
            submitData.changeOperator = true;
            const retryResponse = await orderApi.updateOrder(orderId, submitData);
            if (retryResponse.success) {
              alert('订单已更换操作员并更新成功！');
              navigate('/employee/broker-orders?status=quote');
            }
          } catch (retryError) {
            console.error('❌ 更换操作员失败:', retryError);
            alert(`更换操作员失败：${retryError.message}`);
          }
        }
        setLoading(false);
        return;
      }
      
      alert(`保存失败：${error.message}\n\n请查看浏览器控制台(F12)了解详情`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('确定要取消吗？未保存的数据将丢失。')) {
      navigate(-1);
    }
  };

  // 确认下单（报价单 → 已下单）
  const handleConfirmOrder = async () => {
    if (!window.confirm('确定要将此订单标记为"已下单"吗？')) {
      return;
    }
    
    try {
      const response = await orderApi.confirmOrder(orderId, 'waiting_driver');
      if (response.success) {
        alert('订单已确认下单！');
        navigate('/employee/broker-orders?status=ordered');
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  // 更新子状态
  const handleUpdateSubStatus = async (subStatus) => {
    try {
      const response = await orderApi.updateSubStatus(orderId, subStatus);
      if (response.success) {
        alert('状态更新成功！');
        // 刷新数据
        loadOrder();
      }
    } catch (error) {
      alert('更新失败: ' + error.message);
    }
  };

  // 标记完成（已下单 → 已完成）
  const handleCompleteOrder = async () => {
    if (!window.confirm('确定要将此订单标记为"已完成"吗？')) {
      return;
    }
    
    try {
      const response = await orderApi.completeOrder(orderId);
      if (response.success) {
        alert('订单已完成！');
        navigate('/employee/broker-orders?status=completed');
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  return (
    <div className="broker-order-form-container">
      <div className="form-header">
        <div className="header-left">
          <h1>{isEditMode ? '编辑订单' : '新建订单'}</h1>
          {isEditMode && formData.status && (
            <span className={`status-indicator status-${formData.status}`}>
              {formData.status === 'quote' && '报价单'}
              {formData.status === 'ordered' && '已下单'}
              {formData.status === 'completed' && '已完成'}
            </span>
          )}
        </div>
        <div className="form-actions-top">
          {/* 状态转换按钮（仅编辑模式）*/}
          {isEditMode && formData.status === 'quote' && (
            <button 
              type="button" 
              className="btn-confirm" 
              onClick={handleConfirmOrder}
            >
              ✓ 确认下单
            </button>
          )}
          
          {isEditMode && formData.status === 'ordered' && (
            <button 
              type="button" 
              className="btn-complete" 
              onClick={handleCompleteOrder}
            >
              ✓ 标记完成
            </button>
          )}
          
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            取消
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        {/* 子状态切换（仅已下单时显示）*/}
        {isEditMode && formData.status === 'ordered' && (
          <div className="status-section">
            <h3>当前运输状态</h3>
            <div className="status-buttons">
              <button
                type="button"
                className={`status-btn ${formData.sub_status === 'waiting_driver' ? 'active' : ''} waiting-driver`}
                onClick={() => handleUpdateSubStatus('waiting_driver')}
              >
                🔴 寻找司机
              </button>
              <button
                type="button"
                className={`status-btn ${formData.sub_status === 'driver_found' ? 'active' : ''} driver-found`}
                onClick={() => handleUpdateSubStatus('driver_found')}
              >
                🟤 找到司机
              </button>
              <button
                type="button"
                className={`status-btn ${formData.sub_status === 'in_transit' ? 'active' : ''} in-transit`}
                onClick={() => handleUpdateSubStatus('in_transit')}
              >
                💚 运输中
              </button>
            </div>
          </div>
        )}

        {/* 卡车信息（仅已下单和已完成时显示）*/}
        {isEditMode && (formData.status === 'ordered' || formData.status === 'completed') && (
          <div className="form-section truck-section">
            <h3 className="section-title">卡车信息（下单后填写）</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>付卡车价格 *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.truck_payment}
                  onChange={(e) => handleChange('truck_payment', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>MC Number *</label>
                <input
                  type="text"
                  placeholder="输入MC号"
                  value={formData.mc_number}
                  onChange={(e) => handleChange('mc_number', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>卡车公司名 *</label>
                <input
                  type="text"
                  placeholder="输入公司名称"
                  value={formData.truck_company_name}
                  onChange={(e) => handleChange('truck_company_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>联络方式 *</label>
                <input
                  type="text"
                  placeholder="电话或邮箱"
                  value={formData.truck_contact}
                  onChange={(e) => handleChange('truck_contact', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 基础信息区块 */}
        <div className="form-section">
          <h3 className="section-title">基础信息</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>日期 *</label>
              <input
                type="date"
                required
                value={formData.quote_date}
                onChange={(e) => handleChange('quote_date', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Company *</label>
              <input
                type="text"
                required
                placeholder="Type company name..."
                value={formData.inquiry_company}
                onChange={(e) => handleCompanyInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => { if (companySuggestions.length > 0) setShowSuggestions(true); }}
              />
              {showSuggestions && companySuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                  {companySuggestions.map(c => (
                    <div key={c.id} onClick={() => selectCompany(c)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f5ff'}
                      onMouseLeave={(e) => e.target.style.background = '#fff'}>
                      <strong>{c.company_name}</strong>
                      {c.contact_phone && <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 11 }}>{c.contact_phone}</span>}
                    </div>
                  ))}
                </div>
              )}
              {formData.inquiry_company && companySuggestions.length === 0 && formData.inquiry_company.length >= 2 && !showNewCustomerForm && (
                <button type="button" onClick={() => { setNewCustData({ ...newCustData, company_name: formData.inquiry_company }); setShowNewCustomerForm(true); }}
                  style={{ marginTop: 4, padding: '4px 10px', fontSize: 11, border: '1px dashed #1565C0', borderRadius: 4, background: 'none', color: '#1565C0', cursor: 'pointer' }}>
                  + Create "{formData.inquiry_company}" as new customer
                </button>
              )}
              {showNewCustomerForm && (
                <div style={{ marginTop: 8, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>New Customer Quick Form</div>
                  <input type="text" placeholder="Company Name *" value={newCustData.company_name}
                    onChange={(e) => setNewCustData({ ...newCustData, company_name: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginBottom: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  <input type="text" placeholder="Address" value={newCustData.billing_address}
                    onChange={(e) => setNewCustData({ ...newCustData, billing_address: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginBottom: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text" placeholder="Phone" value={newCustData.contact_phone}
                      onChange={(e) => setNewCustData({ ...newCustData, contact_phone: e.target.value })}
                      style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                    <input type="email" placeholder="Email" value={newCustData.contact_email}
                      onChange={(e) => setNewCustData({ ...newCustData, contact_email: e.target.value })}
                      style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button type="button" onClick={handleCreateNewCustomer}
                      style={{ padding: '4px 12px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Create</button>
                    <button type="button" onClick={() => setShowNewCustomerForm(false)}
                      style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>WE报价单号 (自动生成)</label>
              <input
                type="text"
                placeholder="自动生成或手动输入"
                value={formData.ew_quote_number}
                onChange={(e) => handleChange('ew_quote_number', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>发货单号</label>
              <input
                type="text"
                placeholder="输入发货单号"
                value={formData.shipment_number}
                onChange={(e) => handleChange('shipment_number', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>货物备注</label>
              <input
                type="text"
                placeholder="例如: Electronics, Furniture"
                value={formData.cargo_type}
                onChange={(e) => handleChange('cargo_type', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>运输距离 (miles)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={formData.transport_distance}
                onChange={(e) => handleChange('transport_distance', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>货物描述 *</label>
            <textarea
              required
              rows="3"
              placeholder="详细描述货物信息"
              value={formData.cargo_description_detailed}
              onChange={(e) => handleChange('cargo_description_detailed', e.target.value)}
            />
          </div>
        </div>

        {/* 地址信息 */}
        <div className="form-section">
          <h3 className="section-title">地址信息</h3>
          <div className="address-grid">
            <div className="address-column">
              <h4>发货地址</h4>
              <div className="form-group">
                <label>详细地址 *</label>
                <input
                  type="text"
                  required
                  placeholder="街道地址"
                  value={formData.origin_address}
                  onChange={(e) => handleChange('origin_address', e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>城市 *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin_city}
                    onChange={(e) => handleChange('origin_city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>州 *</label>
                  <input
                    type="text"
                    required
                    placeholder="CA"
                    value={formData.origin_state}
                    onChange={(e) => handleChange('origin_state', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>邮编</label>
                  <input
                    type="text"
                    placeholder="90001"
                    value={formData.origin_zipcode}
                    onChange={(e) => handleChange('origin_zipcode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="address-column">
              <h4>收货地址</h4>
              <div className="form-group">
                <label>详细地址 *</label>
                <input
                  type="text"
                  required
                  placeholder="街道地址"
                  value={formData.destination_address}
                  onChange={(e) => handleChange('destination_address', e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>城市 *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination_city}
                    onChange={(e) => handleChange('destination_city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>州 *</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={formData.destination_state}
                    onChange={(e) => handleChange('destination_state', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>邮编</label>
                  <input
                    type="text"
                    placeholder="10001"
                    value={formData.destination_zipcode}
                    onChange={(e) => handleChange('destination_zipcode', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>地址类型 *</label>
            <select
              required
              value={formData.address_type}
              onChange={(e) => handleChange('address_type', e.target.value)}
            >
              <option value="Residential">Residential (住宅)</option>
              <option value="Commercial">Commercial (商业)</option>
              <option value="Warehouse">Warehouse (仓库)</option>
            </select>
          </div>
        </div>

        {/* 重量和尺寸（批量粘贴） */}
        <div className="form-section">
          <h3 className="section-title">重量和尺寸</h3>
          <div className="paste-grid">
            <div className="paste-column">
              <div className="form-group">
                <label>
                  重量列表 (lbs) - 支持批量粘贴 *
                  <span className="hint">每行一个重量，可包含total行</span>
                </label>
                <textarea
                  rows="8"
                  className="paste-input"
                  placeholder="4260&#10;2820&#10;677&#10;1493&#10;3482&#10;4046&#10;total: 16778"
                  value={formData.weight_input}
                  onChange={(e) => handleChange('weight_input', e.target.value)}
                />
                <div className="parsed-info">
                  {formData.weight_list.length > 0 && (
                    <>
                      <span>已识别: {formData.weight_list.length} 项</span>
                      <span className="total">总计: {formData.total_weight_lbs.toLocaleString()} lbs</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="paste-column">
              <div className="form-group">
                <label>
                  尺寸列表 - 支持批量粘贴 *
                  <span className="hint">格式: 长*宽*高 件数p （如：16*97*15 1p）</span>
                </label>
                <textarea
                  rows="8"
                  className="paste-input"
                  placeholder="16*97*15 1p&#10;9*41*19 1p&#10;8*73*6 1p&#10;21*39*9 1p&#10;17*80*17 1p&#10;16*95*16 1p"
                  value={formData.dimensions_input}
                  onChange={(e) => handleChange('dimensions_input', e.target.value)}
                />
                <div className="parsed-info">
                  {formData.dimensions_list.length > 0 && (
                    <>
                      <span>已识别: {formData.dimensions_list.length} 项</span>
                      <span className="total">
                        总体积: {(parseFloat(formData.total_volume) || 0).toFixed(2)} ft³
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 验证提示 */}
          {validationError && (
            <div className="validation-error">
              ⚠️ {validationError}
            </div>
          )}
          {!validationError && formData.weight_list.length > 0 && formData.dimensions_list.length > 0 && (
            <div className="validation-success">
              ✅ 重量和尺寸数量匹配
            </div>
          )}
        </div>

        {/* 报价信息 */}
        <div className="form-section">
          <h3 className="section-title">报价信息</h3>
          <div className="form-grid-3">
            <div className="form-group">
              <label>货值</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.cargo_value}
                onChange={(e) => handleChange('cargo_value', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>WE报价</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ew_quote_price}
                onChange={(e) => handleChange('ew_quote_price', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>实际板数</label>
              <input
                type="number"
                placeholder="0"
                value={formData.actual_pallets}
                onChange={(e) => handleChange('actual_pallets', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>总面积板数</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.total_area_pallets}
                onChange={(e) => handleChange('total_area_pallets', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>TOTAL DAT (API)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.total_dat}
                onChange={(e) => handleChange('total_dat', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>理想报价</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ideal_quote}
                onChange={(e) => handleChange('ideal_quote', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>车辆板数</label>
              <select
                value={formData.truck_pallets}
                onChange={(e) => handleChange('truck_pallets', e.target.value)}
              >
                <option value="">选择</option>
                <option value="13">13板</option>
                <option value="18">18板</option>
                <option value="26">26板</option>
              </select>
            </div>

            <div className="form-group">
              <label>TQL价格1</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.tql_price_1}
                onChange={(e) => handleChange('tql_price_1', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>TQL价格2</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.tql_price_2}
                onChange={(e) => handleChange('tql_price_2', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>其他价格 (API)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.other_api_price}
                onChange={(e) => handleChange('other_api_price', e.target.value)}
              />
            </div>

            <div className="form-group highlight">
              <label>报价参考</label>
              <input
                type="number"
                step="0.01"
                placeholder="自动计算或手动输入"
                value={formData.quote_reference}
                onChange={(e) => handleChange('quote_reference', e.target.value)}
              />
              <small>公式: TOTAL DAT ÷ 车辆板数 × 总面积板数 + 100</small>
            </div>

            <div className="form-group">
              <label>报价参考+10%</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quote_ref_10}
                onChange={(e) => handleChange('quote_ref_10', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>报价参考+20%</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quote_ref_20}
                onChange={(e) => handleChange('quote_ref_20', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>报价参考+30%</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quote_ref_30}
                onChange={(e) => handleChange('quote_ref_30', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 平台报价和DAT */}
        <div className="form-section">
          <h3 className="section-title">平台报价 & DAT SALES</h3>
          <div className="form-grid-3">
            <div className="form-group">
              <label>平台第一报价</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.platform_quote_1}
                onChange={(e) => handleChange('platform_quote_1', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>平台第二报价</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.platform_quote_2}
                onChange={(e) => handleChange('platform_quote_2', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>预报价格</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.pre_quote_price}
                onChange={(e) => handleChange('pre_quote_price', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>EW价格</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ew_final_price}
                onChange={(e) => handleChange('ew_final_price', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>DAT SALES 1</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.dat_sales_1}
                onChange={(e) => handleChange('dat_sales_1', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>DAT SALES 2</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.dat_sales_2}
                onChange={(e) => handleChange('dat_sales_2', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>DAT SALES 3</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.dat_sales_3}
                onChange={(e) => handleChange('dat_sales_3', e.target.value)}
              />
            </div>

            <div className="form-group highlight">
              <label>利润</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.profit}
                onChange={(e) => handleChange('profit', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 备注 */}
        <div className="form-section">
          <h3 className="section-title">备注</h3>
          <div className="form-group full-width">
            <textarea
              rows="4"
              placeholder="订单备注..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="form-actions-bottom">
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            取消
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? '保存中...' : '保存订单'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrokerOrderForm;

