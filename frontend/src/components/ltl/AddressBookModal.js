import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Trash2, Plus } from 'lucide-react';

const AddressBookModal = ({ isOpen, onClose, onSelectAddress, addressType, currentZipCode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Mock data - 实际应该从 API 获取
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 1,
      name: 'John Smith',
      address1: '123 Main Street',
      address2: 'Suite 100',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      phone: '(212) 555-1234',
      type: 'pickup'
    },
    {
      id: 2,
      name: 'ABC Company',
      address1: '456 Broadway Ave',
      address2: '',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'USA',
      phone: '(323) 555-5678',
      type: 'delivery'
    },
    {
      id: 3,
      name: 'XYZ Warehouse',
      address1: '789 Industrial Pkwy',
      address2: 'Building A',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA',
      phone: '(312) 555-9012',
      type: 'pickup'
    }
  ]);

  // 新地址表单数据
  const [newAddress, setNewAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    phone: '',
    type: addressType
  });

  // 当打开地址簿时，自动设置搜索词为当前zipcode
  useEffect(() => {
    if (isOpen && currentZipCode) {
      setSearchTerm(currentZipCode);
    }
  }, [isOpen, currentZipCode]);

  if (!isOpen) return null;

  // 过滤地址 - 如果有zipcode，优先显示匹配的地址
  const filteredAddresses = savedAddresses.filter(addr => {
    const searchLower = searchTerm.toLowerCase();
    return (
      addr.name.toLowerCase().includes(searchLower) ||
      addr.address1.toLowerCase().includes(searchLower) ||
      addr.city.toLowerCase().includes(searchLower) ||
      addr.state.toLowerCase().includes(searchLower) ||
      addr.zip.includes(searchLower)
    );
  });

  const handleSelectAddress = (address) => {
    onSelectAddress(address);
    onClose();
  };

  const handleDeleteAddress = (e, addressId) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个地址吗？')) {
      setSavedAddresses(prev => prev.filter(addr => addr.id !== addressId));
      // TODO: 调用API删除地址
    }
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!newAddress.name || !newAddress.address1 || !newAddress.city || 
        !newAddress.state || !newAddress.zip || !newAddress.phone) {
      alert('请填写所有必填字段');
      return;
    }

    // 添加新地址
    const newId = Math.max(...savedAddresses.map(a => a.id), 0) + 1;
    const addressToAdd = {
      ...newAddress,
      id: newId,
      type: addressType
    };
    
    setSavedAddresses(prev => [...prev, addressToAdd]);
    
    // 重置表单
    setNewAddress({
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
      phone: '',
      type: addressType
    });
    
    setShowAddForm(false);
    
    // TODO: 调用API保存地址
    alert('地址已添加到地址簿');
  };

  return (
    <div className="address-book-modal-overlay" onClick={onClose}>
      <div className="address-book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <MapPin size={24} />
            地址簿 - Address Book
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-toolbar">
          <div className="modal-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索地址、姓名、城市、邮编..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn-add-address"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={18} />
            {showAddForm ? '取消' : '添加新地址'}
          </button>
        </div>

        {/* 添加新地址表单 */}
        {showAddForm && (
          <div className="add-address-form">
            <h3>添加新地址</h3>
            <form onSubmit={handleAddNewAddress}>
              <div className="form-row">
                <div className="form-group-small">
                  <label>姓名/公司 <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={newAddress.name}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
                <div className="form-group-small">
                  <label>联系电话 <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={newAddress.phone}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
                <div className="form-group-small">
                  <label>地址 1 <span className="required">*</span></label>
                  <input
                    type="text"
                    name="address1"
                    value={newAddress.address1}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
                <div className="form-group-small">
                  <label>地址 2</label>
                  <input
                    type="text"
                    name="address2"
                    value={newAddress.address2}
                    onChange={handleNewAddressChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-small">
                  <label>城市 <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
                <div className="form-group-small">
                  <label>州 <span className="required">*</span></label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                    maxLength="2"
                    required
                  />
                </div>
                <div className="form-group-small">
                  <label>邮编 <span className="required">*</span></label>
                  <input
                    type="text"
                    name="zip"
                    value={newAddress.zip}
                    onChange={handleNewAddressChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions-inline">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn-save">
                  保存地址
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="modal-body">
          {filteredAddresses.length === 0 ? (
            <div className="no-results">
              <p>未找到匹配的地址</p>
            </div>
          ) : (
            <div className="address-list">
              {filteredAddresses.map((address) => (
                <div
                  key={address.id}
                  className="address-card"
                  onClick={() => handleSelectAddress(address)}
                >
                  <button
                    className="btn-delete-address"
                    onClick={(e) => handleDeleteAddress(e, address.id)}
                    title="删除地址"
                  >
                    <Trash2 />
                  </button>
                  <div className="address-card-content">
                    <div className="address-card-header">
                      <h3>{address.name}</h3>
                      <span className="address-type-badge">
                        {address.type === 'pickup' ? '取货地址' : '送货地址'}
                      </span>
                    </div>
                    <div className="address-card-body">
                      <p className="address-line">
                        <strong>地址:</strong> 
                        <span>{address.address1}{address.address2 && `, ${address.address2}`}</span>
                      </p>
                      <p className="address-line">
                        <strong>城市:</strong> 
                        <span>{address.city}, {address.state} {address.zip}</span>
                      </p>
                      <p className="address-line">
                        <strong>电话:</strong> 
                        <span>{address.phone}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressBookModal;
