import React, { useState } from 'react';
import { Book, Trash2 } from 'lucide-react';
import AddressBookModal from './AddressBookModal';

const ShipmentDetailsForm = ({ 
  selectedQuote, 
  shipmentDetails, 
  formData,
  selectedPlaces,
  onChange, 
  onSubmit, 
  onBack, 
  isSubmitting,
  setShipmentDetails 
}) => {
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [addressBookType, setAddressBookType] = useState('pickup'); // 'pickup' or 'delivery'
  const [itemDetails, setItemDetails] = useState(
    formData?.cargoItems?.map(item => ({
      ...item,
      description: item.description || '' // Make description editable in step 3
    })) || []
  );

  // 服务选项映射
  const serviceLabels = {
    inside_pickup: 'Inside Pickup',
    lift_gate: 'Lift Gate',
    appointment_delivery: 'Appointment Delivery',
    delivery_call_ahead: 'Delivery Call Ahead',
    inside_delivery: 'Inside Delivery',
    sort_and_segregate: 'Sort and Segregate'
  };

  // 将服务值转换为可读标签
  const formatServices = (services) => {
    if (!services || services.length === 0) return '';
    return services
      .map(service => serviceLabels[service] || service)
      .join(', ');
  };

  // 从Google Maps addressComponents中提取城市、州、邮编
  const extractAddressComponents = (addressComponents) => {
    let city = '';
    let state = '';
    let zip = '';
    
    if (addressComponents) {
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('sublocality_level_1') && !city) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name;
        }
        
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        
        if (types.includes('postal_code')) {
          zip = component.long_name;
        }
      });
    }
    
    return { city, state, zip };
  };

  // 从第一步获取的预填数据（只读）
  const originComponents = selectedPlaces?.origin?.addressComponents 
    ? extractAddressComponents(selectedPlaces.origin.addressComponents)
    : { city: '', state: '', zip: '' };

  const destinationComponents = selectedPlaces?.destination?.addressComponents
    ? extractAddressComponents(selectedPlaces.destination.addressComponents)
    : { city: '', state: '', zip: '' };

  const prefilledPickupData = {
    city: originComponents.city,
    state: originComponents.state,
    zip: originComponents.zip,
    country: 'USA',
    locationType: formData?.originLocationType || '',
    services: formData?.pickupServices || []
  };

  const prefilledDeliveryData = {
    city: destinationComponents.city,
    state: destinationComponents.state,
    zip: destinationComponents.zip,
    country: 'USA',
    locationType: formData?.destinationLocationType || '',
    services: formData?.deliveryServices || []
  };

  const handleAddressBookClick = (type) => {
    setAddressBookType(type);
    setShowAddressBook(true);
  };

  const handleSelectAddress = (address) => {
    if (addressBookType === 'pickup') {
      setShipmentDetails(prev => ({
        ...prev,
        pickupContactName: address.name,
        pickupAddress: address.address1,
        pickupAddress2: address.address2,
        pickupCity: address.city,
        pickupState: address.state,
        pickupZip: address.zip,
        pickupCountry: address.country,
        pickupContactPhone: address.phone,
        pickupContactPerson: address.name
      }));
    } else {
      setShipmentDetails(prev => ({
        ...prev,
        deliveryContactName: address.name,
        deliveryAddress: address.address1,
        deliveryAddress2: address.address2,
        deliveryCity: address.city,
        deliveryState: address.state,
        deliveryZip: address.zip,
        deliveryCountry: address.country,
        deliveryContactPhone: address.phone,
        deliveryContactPerson: address.name
      }));
    }
  };

  const handleSaveAddress = (type) => {
    // TODO: 实现保存地址到后端的逻辑
    alert(`保存${type === 'pickup' ? '取货' : '送货'}地址到地址簿`);
  };

  const handleItemDetailChange = (itemId, field, value) => {
    setItemDetails(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    if (itemDetails.length <= 1) {
      alert('至少需要保留一个货物项目');
      return;
    }
    setItemDetails(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // 验证货物描述是否都已填写
    const missingDescriptions = itemDetails.filter(item => !item.description?.trim());
    if (missingDescriptions.length > 0) {
      alert('请为所有货物填写描述信息');
      return;
    }
    
    // 验证必填字段：Shipper Name 和 Receiver Name，Address 1
    if (!shipmentDetails.pickupContactName?.trim()) {
      alert('请填写发货人姓名 (Shipper Name)');
      return;
    }
    
    if (!shipmentDetails.pickupAddress?.trim()) {
      alert('请填写取货详细地址 (Pickup Address 1)');
      return;
    }
    
    if (!shipmentDetails.deliveryContactName?.trim()) {
      alert('请填写收货人姓名 (Receiver Name)');
      return;
    }
    
    if (!shipmentDetails.deliveryAddress?.trim()) {
      alert('请填写送货详细地址 (Delivery Address 1)');
      return;
    }
    
    if (!shipmentDetails.pickupDate?.trim()) {
      alert('请选择取货日期 (Shipment Date)');
      return;
    }
    
    // 将更新后的货物信息传递回父组件
    onSubmit(e, itemDetails);
  };

  return (
    <div className="shipment-details-form">
      <h2>发货详情</h2>
      <p className="form-intro">
        您已选择 <strong>{selectedQuote.carrier}</strong> 的服务，价格 <strong>${selectedQuote.price.toFixed(2)}</strong>。
        请填写详细的发货和收货信息。
      </p>

      <form onSubmit={handleFormSubmit} className="details-form">
        {/* 取货详情 PICKUP DETAILS */}
        <div className="form-section">
          <div className="section-header-with-action">
            <h3>PICKUP DETAILS - 取货详情</h3>
            <button 
              type="button"
              className="address-book-btn"
              onClick={() => handleAddressBookClick('pickup')}
            >
              <Book size={16} />
              地址簿 Address Book
            </button>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>
                Shipper Name - 发货人名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                name="pickupContactName"
                value={shipmentDetails.pickupContactName || ''}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Address 1 - 详细地址 <span className="required">*</span>
              </label>
              <input
                type="text"
                name="pickupAddress"
                value={shipmentDetails.pickupAddress || ''}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address 2 - 地址补充</label>
              <input
                type="text"
                name="pickupAddress2"
                value={shipmentDetails.pickupAddress2 || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>City - 城市</label>
              <input
                type="text"
                value={prefilledPickupData.city}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>State/Province - 州/省</label>
              <input
                type="text"
                value={prefilledPickupData.state}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Postal Code - 邮编</label>
              <input
                type="text"
                value={prefilledPickupData.zip}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Country - 国家</label>
              <input
                type="text"
                value={prefilledPickupData.country}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Contact Name - 联系人姓名</label>
              <input
                type="text"
                name="pickupContactPerson"
                value={shipmentDetails.pickupContactPerson || shipmentDetails.pickupContactName || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone - 联系电话</label>
              <input
                type="tel"
                name="pickupContactPhone"
                value={shipmentDetails.pickupContactPhone || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>EXT - 分机号</label>
              <input
                type="text"
                name="pickupExt"
                value={shipmentDetails.pickupExt || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group full-width">
              <label>
                Shipment Date - 取货日期 <span className="required">*</span>
              </label>
              <div className="date-time-group">
                <input
                  type="date"
                  name="pickupDate"
                  value={shipmentDetails.pickupDate || ''}
                  onChange={onChange}
                  required
                />
                <div className="time-inputs">
                  <input
                    type="text"
                    name="pickupTimeStart"
                    value={shipmentDetails.pickupTimeStart || ''}
                    onChange={onChange}
                    placeholder="HH"
                    maxLength="2"
                  />
                  <span>:</span>
                  <input
                    type="text"
                    name="pickupTimeStartMin"
                    value={shipmentDetails.pickupTimeStartMin || ''}
                    onChange={onChange}
                    placeholder="MM"
                    maxLength="2"
                  />
                  <select
                    name="pickupTimeStartPeriod"
                    value={shipmentDetails.pickupTimeStartPeriod || 'AM'}
                    onChange={onChange}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <span>To</span>
                  <input
                    type="text"
                    name="pickupTimeEnd"
                    value={shipmentDetails.pickupTimeEnd || ''}
                    onChange={onChange}
                    placeholder="HH"
                    maxLength="2"
                  />
                  <span>:</span>
                  <input
                    type="text"
                    name="pickupTimeEndMin"
                    value={shipmentDetails.pickupTimeEndMin || ''}
                    onChange={onChange}
                    placeholder="MM"
                    maxLength="2"
                  />
                  <select
                    name="pickupTimeEndPeriod"
                    value={shipmentDetails.pickupTimeEndPeriod || 'PM'}
                    onChange={onChange}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Pickup # - 取货单号</label>
              <input
                type="text"
                name="pickupNumber"
                value={shipmentDetails.pickupNumber || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>Location Type - 地址类型</label>
              <input
                type="text"
                value={prefilledPickupData.locationType || 'Commercial'}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            {prefilledPickupData.services && prefilledPickupData.services.length > 0 && (
              <div className="form-group">
                <label>Pickup Services - 取货服务</label>
                <input
                  type="text"
                  value={formatServices(prefilledPickupData.services)}
                  readOnly
                  disabled
                  className="readonly-field"
                />
              </div>
            )}
          </div>

          <div className="address-actions">
            <button 
              type="button"
              className="save-address-btn-compact"
              onClick={() => handleSaveAddress('pickup')}
            >
              📋 SAVE ADDRESS
            </button>
          </div>
        </div>

        {/* 送货详情 DELIVERY DETAILS */}
        <div className="form-section">
          <div className="section-header-with-action">
            <h3>DELIVERY DETAILS - 送货详情</h3>
            <button 
              type="button"
              className="address-book-btn"
              onClick={() => handleAddressBookClick('delivery')}
            >
              <Book size={16} />
              地址簿 Address Book
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Receiver Name - 收货人名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                name="deliveryContactName"
                value={shipmentDetails.deliveryContactName || ''}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Address 1 - 详细地址 <span className="required">*</span>
              </label>
              <input
                type="text"
                name="deliveryAddress"
                value={shipmentDetails.deliveryAddress || ''}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address 2 - 地址补充</label>
              <input
                type="text"
                name="deliveryAddress2"
                value={shipmentDetails.deliveryAddress2 || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>City - 城市</label>
              <input
                type="text"
                value={prefilledDeliveryData.city}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>State/Province - 州/省</label>
              <input
                type="text"
                value={prefilledDeliveryData.state}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Postal Code - 邮编</label>
              <input
                type="text"
                value={prefilledDeliveryData.zip}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Country - 国家</label>
              <input
                type="text"
                value={prefilledDeliveryData.country}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Contact Name - 联系人姓名</label>
              <input
                type="text"
                name="deliveryContactPerson"
                value={shipmentDetails.deliveryContactPerson || shipmentDetails.deliveryContactName || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone - 联系电话</label>
              <input
                type="tel"
                name="deliveryContactPhone"
                value={shipmentDetails.deliveryContactPhone || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>EXT - 分机号</label>
              <input
                type="text"
                name="deliveryExt"
                value={shipmentDetails.deliveryExt || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Receiver Hours - 收货时间</label>
              <div className="time-inputs">
                <input
                  type="text"
                  name="deliveryTimeStart"
                  value={shipmentDetails.deliveryTimeStart || ''}
                  onChange={onChange}
                  placeholder="HH"
                  maxLength="2"
                />
                <span>:</span>
                <input
                  type="text"
                  name="deliveryTimeStartMin"
                  value={shipmentDetails.deliveryTimeStartMin || ''}
                  onChange={onChange}
                  placeholder="MM"
                  maxLength="2"
                />
                <select
                  name="deliveryTimeStartPeriod"
                  value={shipmentDetails.deliveryTimeStartPeriod || 'AM'}
                  onChange={onChange}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <span>To</span>
                <input
                  type="text"
                  name="deliveryTimeEnd"
                  value={shipmentDetails.deliveryTimeEnd || ''}
                  onChange={onChange}
                  placeholder="HH"
                  maxLength="2"
                />
                <span>:</span>
                <input
                  type="text"
                  name="deliveryTimeEndMin"
                  value={shipmentDetails.deliveryTimeEndMin || ''}
                  onChange={onChange}
                  placeholder="MM"
                  maxLength="2"
                />
                <select
                  name="deliveryTimeEndPeriod"
                  value={shipmentDetails.deliveryTimeEndPeriod || 'PM'}
                  onChange={onChange}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Delivery # - 送货单号</label>
              <input
                type="text"
                name="deliveryNumber"
                value={shipmentDetails.deliveryNumber || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>Location Type - 地址类型</label>
              <input
                type="text"
                value={prefilledDeliveryData.locationType || 'Commercial'}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>

            {prefilledDeliveryData.services && prefilledDeliveryData.services.length > 0 && (
              <div className="form-group">
                <label>Delivery Services - 送货服务</label>
                <input
                  type="text"
                  value={formatServices(prefilledDeliveryData.services)}
                  readOnly
                  disabled
                  className="readonly-field"
                />
              </div>
            )}
          </div>

          <div className="address-actions">
            <button 
              type="button"
              className="save-address-btn-compact"
              onClick={() => handleSaveAddress('delivery')}
            >
              📋 SAVE ADDRESS
            </button>
          </div>
        </div>

        {/* 货物详情 ITEM DETAILS */}
        <div className="form-section">
          <h3>ITEM DETAILS - 货物详情</h3>
          
          {itemDetails.map((item, index) => (
            <div key={item.id} className="item-detail-card">
              <div className="item-detail-header">
                <h4>货物 #{index + 1}</h4>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Description - 货物描述 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemDetailChange(item.id, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Qty - 数量</label>
                  <input
                    type="number"
                    value={item.pallets || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Units - 单位</label>
                  <input
                    type="text"
                    value="Pallets"
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Weight (lbs) - 重量</label>
                  <input
                    type="text"
                    value={`${item.weight} lbs`}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Dimensions - 尺寸</label>
                  <input
                    type="text"
                    value={`${item.length}x${item.width}x${item.height} in`}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Class - 等级</label>
                  <input
                    type="text"
                    value={item.freightClass || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>NMFC Code</label>
                  <input
                    type="text"
                    value={item.nmfcCode || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Piece/Case Count</label>
                  <input
                    type="text"
                    value={item.pieceCount || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Stackable - 可堆叠</label>
                  <input
                    type="text"
                    value={item.stackable ? 'Yes' : 'No'}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="item-totals">
                <div className="total-item">
                  <span className="label">Total Qty:</span>
                  <span className="value">{item.pallets || 0}</span>
                </div>
                <div className="total-item">
                  <span className="label">Total Weight:</span>
                  <span className="value">{item.weight || 0} lbs</span>
                </div>
                <div className="total-item">
                  <span className="label">Total Linear Feet:</span>
                  <span className="value">{((parseFloat(item.length) || 0) / 12 * (parseInt(item.pallets) || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 附加信息 ADDITIONAL DETAILS */}
        <div className="form-section">
          <h3>ADDITIONAL DETAILS - 附加信息</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Reference(s) - 客户参考号</label>
              <input
                type="text"
                name="customerReference"
                value={shipmentDetails.customerReference || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>PO Number(s) - 采购订单号</label>
              <input
                type="text"
                name="poNumber"
                value={shipmentDetails.poNumber || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>SO Number(s) - 销售订单号</label>
              <input
                type="text"
                name="soNumber"
                value={shipmentDetails.soNumber || ''}
                onChange={onChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Special Instructions - 特殊说明</label>
              <textarea
                name="specialInstructions"
                value={shipmentDetails.specialInstructions || ''}
                onChange={onChange}
                rows="4"
                maxLength="500"
              />
              <div className="char-count">
                {(shipmentDetails.specialInstructions || '').length}/500
              </div>
            </div>
          </div>
        </div>

        {/* 服务条款 */}
        <div className="form-section">
          <h3>TERMS OF SERVICE - 服务条款</h3>
          <p className="terms-text">
            By tendering a shipment to TOL, you acknowledge and understand TOL's LTL terms and conditions 
            and knowingly, voluntarily and willfully agree to the terms and conditions.
          </p>
          <p className="terms-text">
            提交货物即表示您确认并理解TOL的零担运输条款和条件，并自愿同意这些条款和条件。
          </p>
          <a href="#" className="terms-link">General Terms and Conditions - 通用条款和条件</a>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← 返回选择承运商
          </button>
          <button 
            type="button"
            className="btn-secondary"
            disabled={isSubmitting}
          >
            保存 SAVE
          </button>
          <button 
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交货运 TENDER SHIPMENT'}
          </button>
        </div>
      </form>

      {/* 地址簿弹窗 */}
      <AddressBookModal
        isOpen={showAddressBook}
        onClose={() => setShowAddressBook(false)}
        onSelectAddress={handleSelectAddress}
        addressType={addressBookType}
        currentZipCode={addressBookType === 'pickup' ? prefilledPickupData.zip : prefilledDeliveryData.zip}
      />
    </div>
  );
};

export default ShipmentDetailsForm;
