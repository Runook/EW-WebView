import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import './FBAExchangeModal.css';

const FBAExchangeModal = ({ isOpen, onClose, location, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('market'); // 'market', 'publish', or 'my-posts'
  const [exchanges, setExchanges] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    exchange_type: '',
    cargo_type: '',
    pricing_strategy: ''
  });

  // 发布表单数据
  const [formData, setFormData] = useState({
    fba_code: location?.code || '',
    exchange_type: '寻求预约',
    pricing_strategy: '', // 改为空值，让用户必须选择
    contact_person: user?.first_name || '',
    contact_phone: user?.phone || '',
    appointment_date: '',
    appointment_time: '',
    time_zone: 'PDT',
    cargo_type: '', // 改为空值，让用户必须选择
    description: '',
    is_urgent: false
  });

  const [formErrors, setFormErrors] = useState({});

  // 获取预约市场数据
  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters
      });
      
      // 只有在筛选器中明确设置了fba_code时才添加
      if (filters.fba_code) {
        params.set('fba_code', filters.fba_code);
      }

      // 移除空值
      Object.keys(params).forEach(key => {
        if (!params.get(key)) params.delete(key);
      });

      const response = await apiClient.get(`/fba-exchange?${params.toString()}`);
      
      if (response.success) {
        console.log('FBA Exchange API 返回数据:', response.data.length, '条记录');
        console.log('前5条数据:', response.data.slice(0, 5));
        setExchanges(response.data);
      }
    } catch (error) {
      console.error('获取预约交换数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取我的发布数据
  const fetchMyExchanges = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/fba-exchange/user/my-exchanges');
      
      if (response.success) {
        console.log('我的发布数据:', response.data.length, '条记录');
        setMyExchanges(response.data);
      }
    } catch (error) {
      console.error('获取我的发布数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除我的发布
  const handleDeleteMyExchange = async (exchangeId) => {
    if (!window.confirm('确定要删除这条预约交换信息吗？')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/fba-exchange/${exchangeId}`);
      
      if (response.success) {
        alert('删除成功！');
        fetchMyExchanges(); // 刷新我的发布列表
        fetchExchanges(); // 刷新预约市场列表
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'market') {
      fetchExchanges();
    } else if (isOpen && activeTab === 'my-posts') {
      fetchMyExchanges();
    }
  }, [isOpen, activeTab, filters, location]);

  useEffect(() => {
    if (isOpen && location) {
      setFormData(prev => ({
        ...prev,
        fba_code: location.code
      }));
    }
  }, [isOpen, location]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.contact_person) errors.contact_person = '请输入联系人/公司';
    if (!formData.contact_phone) errors.contact_phone = '请输入微信联系';
    if (!formData.pricing_strategy) errors.pricing_strategy = '请选择策略';
    if (!formData.appointment_date) errors.appointment_date = '请选择预约日期';
    if (!formData.appointment_time) errors.appointment_time = '请选择预约时间';
    if (!formData.cargo_type) errors.cargo_type = '请选择类型';
    // 移除 description 的必填验证
    // if (!formData.description) errors.description = '请输入详细描述';
    
    // 验证日期不能是过去
    if (formData.appointment_date) {
      const selectedDate = new Date(formData.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.appointment_date = '预约日期不能是过去的日期';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await apiClient.post('/fba-exchange', formData);
      
      if (response.success) {
        alert('预约交换信息发布成功！');
        if (onSuccess) onSuccess();
        // 刷新预约市场数据
        fetchExchanges();
        // 切换到预约市场标签页显示新发布的数据
        setActiveTab('market');
        // 重置表单
        setFormData({
          fba_code: location?.code || '',
          exchange_type: '寻求预约',
          pricing_strategy: '', // 改为空值，让用户必须选择
          contact_person: user?.first_name || '',
          contact_phone: user?.phone || '',
          appointment_date: '',
          appointment_time: '',
          time_zone: 'PDT',
          cargo_type: '', // 改为空值，让用户必须选择
          description: '',
          is_urgent: false
        });
      }
    } catch (error) {
      console.error('发布预约交换信息失败:', error);
      let errorMessage = '发布失败，请重试';
      
      if (error.message.includes('401') || error.message.includes('未提供认证token')) {
        errorMessage = '请先登录后再发布信息';
      } else if (error.message.includes('403')) {
        errorMessage = '权限不足，无法发布信息';
      } else if (error.message) {
        errorMessage = `发布失败：${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (exchangeId) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    try {
      const response = await apiClient.post(`/fba-exchange/${exchangeId}/contact`);
      
      if (response.success) {
        const { contact_person, contact_phone, company_name } = response.data;
        alert(`联系方式：\n联系人：${contact_person}\n电话：${contact_phone}${company_name ? `\n公司：${company_name}` : ''}`);
      } else {
        alert(response.message || '获取联系信息失败，请重试');
      }
    } catch (error) {
      console.error('获取联系信息失败:', error);
      let errorMessage = '获取联系信息失败，请重试';
      
      if (error.message.includes('401') || error.message.includes('未提供认证token')) {
        errorMessage = '请先登录后再获取联系信息';
      } else if (error.message.includes('400')) {
        errorMessage = '不能联系自己发布的信息';
      } else if (error.message) {
        errorMessage = `获取联系信息失败：${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fba-exchange-modal-overlay" onClick={onClose}>
      <div className="fba-exchange-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>FBA预约交换</h2>
          <p>预约互换，合作共赢</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            预约市场
          </button>
          <button 
            className={`tab-btn ${activeTab === 'publish' ? 'active' : ''}`}
            onClick={() => setActiveTab('publish')}
          >
            发布信息
          </button>
          {user && (
            <button 
              className={`tab-btn ${activeTab === 'my-posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-posts')}
            >
              我的发布
            </button>
          )}
        </div>

        {activeTab === 'market' && (
          <div className="market-tab">
            {/* 筛选器 */}
            <div className="filters">
              <div className="filter-row">
                <select 
                  value={filters.exchange_type} 
                  onChange={(e) => handleFilterChange('exchange_type', e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="出让预约">出让预约</option>
                  <option value="寻求预约">寻求预约</option>
                </select>
                <select 
                  value={filters.cargo_type} 
                  onChange={(e) => handleFilterChange('cargo_type', e.target.value)}
                >
                  <option value="">全部类型</option>
                  <option value="地板">地板</option>
                  <option value="卡板">卡板</option>
                </select>
                <select 
                  value={filters.pricing_strategy} 
                  onChange={(e) => handleFilterChange('pricing_strategy', e.target.value)}
                >
                  <option value="">全部策略</option>
                  <option value="急需">急需</option>
                  <option value="好价">好价</option>
                  <option value="市价">市价</option>
                </select>
              </div>
            </div>

            <p className="results-count">共 {exchanges.length} 条记录</p>

            {/* 交换列表 */}
            <div className="exchanges-list">
              {loading ? (
                <div className="loading">加载中...</div>
              ) : exchanges.length === 0 ? (
                <div className="no-results">暂无相关预约交换信息</div>
              ) : (
                exchanges.map((exchange) => (
                  <div key={exchange.id} className="exchange-item">
                    <div className="exchange-info-row">
                      <span className={`exchange-type ${exchange.exchange_type === '出让预约' ? 'supply' : 'demand'}`}>
                        {exchange.exchange_type === '出让预约' ? '出让' : '寻求'}
                      </span>
                      
                      <span className="cargo-type">{exchange.cargo_type}</span>
                      
                      {exchange.pricing_strategy !== '市价' && (
                        <span className={`pricing ${exchange.pricing_strategy === '急需' ? 'urgent' : 'good-price'}`}>
                          {exchange.pricing_strategy}
                        </span>
                      )}
                      
                      <span className="info-item">
                        <span className="info-label">仓库:</span>
                        <span className="info-value">{exchange.fba_code}</span>
                      </span>
                      
                      <span className="info-item">
                        <span className="info-label">日期:</span>
                        <span className="info-value">{new Date(exchange.appointment_date).toLocaleDateString('zh-CN')}</span>
                      </span>
                      
                      <span className="info-item">
                        <span className="info-label">时间:</span>
                        <span className="info-value">
                          {new Date(`2000-01-01T${exchange.appointment_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </span>
                      
                      <span className="info-item">
                        <span className="info-label">联系人:</span>
                        <span className="info-value">{exchange.contact_person}</span>
                      </span>
                      
                      <button 
                        className="contact-btn-inline"
                        onClick={() => handleContact(exchange.id)}
                      >
                        联系TA
                      </button>
                    </div>
                    
                    {exchange.description && (
                      <div className="exchange-description">
                        {exchange.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-posts' && (
          <div className="my-posts-tab">
            {!user ? (
              <div className="login-prompt">
                <p>请先登录后查看我的发布</p>
              </div>
            ) : (
              <>
                <p className="results-count">我的发布：共 {myExchanges.length} 条记录</p>
                
                <div className="exchanges-list">
                  {loading ? (
                    <div className="loading">加载中...</div>
                  ) : myExchanges.length === 0 ? (
                    <div className="no-results">您还没有发布任何预约交换信息</div>
                  ) : (
                    myExchanges.map((exchange) => (
                      <div key={exchange.id} className="exchange-item my-exchange-item">
                        <div className="exchange-info-row">
                          <span className={`exchange-type ${exchange.exchange_type === '出让预约' ? 'supply' : 'demand'}`}>
                            {exchange.exchange_type === '出让预约' ? '出让' : '寻求'}
                          </span>
                          
                          <span className="cargo-type">{exchange.cargo_type}</span>
                          
                          {exchange.pricing_strategy !== '市价' && (
                            <span className={`pricing ${exchange.pricing_strategy === '急需' ? 'urgent' : 'good-price'}`}>
                              {exchange.pricing_strategy}
                            </span>
                          )}
                          
                          <span className="info-item">
                            <span className="info-label">仓库:</span>
                            <span className="info-value">{exchange.fba_code}</span>
                          </span>
                          
                          <span className="info-item">
                            <span className="info-label">日期:</span>
                            <span className="info-value">{new Date(exchange.appointment_date).toLocaleDateString('zh-CN')}</span>
                          </span>
                          
                          <span className="info-item">
                            <span className="info-label">时间:</span>
                            <span className="info-value">
                              {new Date(`2000-01-01T${exchange.appointment_time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </span>
                          
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteMyExchange(exchange.id)}
                          >
                            删除
                          </button>
                        </div>
                        
                        {exchange.description && (
                          <div className="exchange-description">
                            {exchange.description}
                          </div>
                        )}
                        
                        <div className="exchange-meta">
                          <span className="view-count">浏览 {exchange.view_count} 次</span>
                          <span className="created-date">发布于 {new Date(exchange.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'publish' && (
          <div className="publish-tab">
            {!user ? (
              <div className="login-prompt">
                <p>请先登录后再发布预约交换信息</p>
                <button className="login-btn" onClick={() => alert('请到登录页面登录')}>
                  立即登录
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="publish-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>交换类型<span className="required">*</span></label>
                    <select 
                      name="exchange_type" 
                      value={formData.exchange_type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="寻求预约">寻求预约</option>
                      <option value="出让预约">出让预约</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>策略<span className="required">*</span></label>
                    <select 
                      name="pricing_strategy" 
                      value={formData.pricing_strategy}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">请选择策略</option>
                      <option value="市价">市价</option>
                      <option value="好价">好价</option>
                      <option value="急需">急需</option>
                    </select>
                    {formErrors.pricing_strategy && <span className="error">{formErrors.pricing_strategy}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>联系人/公司<span className="required">*</span></label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleFormChange}
                      placeholder="请输入联系人/公司"
                      required
                    />
                    {formErrors.contact_person && <span className="error">{formErrors.contact_person}</span>}
                  </div>
                  <div className="form-group">
                    <label>微信联系<span className="required">*</span></label>
                    <input
                      type="text"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleFormChange}
                      placeholder="请输入微信号"
                      required
                    />
                    {formErrors.contact_phone && <span className="error">{formErrors.contact_phone}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>仓库<span className="required">*</span></label>
                    <input
                      type="text"
                      name="fba_code"
                      value={formData.fba_code}
                      onChange={handleFormChange}
                      placeholder="如: SCK8"
                      disabled={!!location}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>日期<span className="required">*</span></label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.appointment_date && <span className="error">{formErrors.appointment_date}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>时间<span className="required">*</span></label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.appointment_time && <span className="error">{formErrors.appointment_time}</span>}
                  </div>
                  <div className="form-group">
                    <label>类型<span className="required">*</span></label>
                    <select 
                      name="cargo_type" 
                      value={formData.cargo_type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">请选择类型</option>
                      <option value="地板">地板</option>
                      <option value="卡板">卡板</option>
                    </select>
                    {formErrors.cargo_type && <span className="error">{formErrors.cargo_type}</span>}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>详细说明</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="请描述您的交换需求..."
                    rows={4}
                    // 移除 required 属性
                  />
                  {formErrors.description && <span className="error">{formErrors.description}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? '发布中...' : '+ 发布信息'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FBAExchangeModal;