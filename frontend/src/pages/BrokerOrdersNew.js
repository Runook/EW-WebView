import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../config/employeeApi';
import EditableCell from '../components/EditableCell';
import { parseWeightList, parseDimensionsList, calculateTotalVolume } from '../utils/pasteParser';
import { loadGoogleMapsScript, diagnoseGoogleMapsIssues } from '../config/googleMaps';
import './BrokerOrdersNew.css';

const BrokerOrdersNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingList, setEditingList] = useState({ orderId: null, type: null }); // 'weight' or 'dimensions'
  const [listInput, setListInput] = useState('');
  const [stats, setStats] = useState({
    waiting_driver: 0,
    driver_found: 0,
    in_transit: 0
  });
  
  const currentStatus = searchParams.get('status') || 'quote';
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employee: searchParams.get('employee') || 'all'
  });

  // 加载Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        console.log('🗺️ 开始加载Google Maps API...');
        await loadGoogleMapsScript();
        console.log('✅ Google Maps API加载成功');
      } catch (error) {
        console.error('❌ Google Maps API加载失败:', error);
        console.log('🔍 运行诊断...');
        diagnoseGoogleMapsIssues();
      }
    };

    initGoogleMaps();
  }, []);

  useEffect(() => {
    loadOrders();
    if (currentStatus === 'ordered') {
      loadStats();
    }
  }, [currentStatus, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrders({
        status: currentStatus,
        ...filters
      });
      
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderApi.getStatistics({ status: 'ordered' });
      if (response.success) {
        setStats({
          waiting_driver: response.data.waitingDriverCount || 0,
          driver_found: response.data.driverFoundCount || 0,
          in_transit: response.data.inTransitCount || 0
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleStatusChange = (status) => {
    navigate(`/employee/broker-orders?status=${status}`);
    setExpandedRow(null);
  };

  const handleEdit = (orderId) => {
    // 不再跳转到表单页面，直接展开行编辑
    setExpandedRow(orderId);
    // 滚动到该行
    setTimeout(() => {
      const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // 创建空白订单
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      
      // 创建最小必填字段的订单
      const response = await orderApi.createOrder({
        customer_name: '新建订单',
        inquiry_company: '新建订单',
        cargo_description: '待填写',
        cargo_description_detailed: '待填写',
        order_type: 'land_freight',
        status: 'quote',
        quote_date: new Date().toISOString().split('T')[0]
      });
      
      if (response.success) {
        console.log('✅ 空白订单创建成功:', response.data);
        // 刷新列表
        await loadOrders();
        // 自动展开新订单
        setExpandedRow(response.data.id);
        // 提示用户
        alert('✅ 已创建空白订单，请双击各字段填写信息');
      }
    } catch (error) {
      console.error('❌ 创建订单失败:', error);
      alert('创建失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('确定要将此订单标记为"已下单"吗？')) {
      return;
    }
    
    try {
      const response = await orderApi.confirmOrder(orderId, 'waiting_driver');
      if (response.success) {
        alert('订单已确认下单！');
        // 刷新列表
        loadOrders();
        // 如果需要，切换到已下单标签
        navigate('/employee/broker-orders?status=ordered');
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    }
  };

  const toggleRow = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  // 编辑重量/尺寸列表
  const handleEditList = (orderId, type, currentData) => {
    setEditingList({ orderId, type });
    if (type === 'weight') {
      const weights = currentData ? JSON.parse(currentData) : [];
      setListInput(weights.join('\n'));
    } else if (type === 'dimensions') {
      const dims = currentData ? JSON.parse(currentData) : [];
      setListInput(dims.map(d => {
        const pieces = d.pieces > 1 ? ` ${d.pieces}p` : '';
        return `${d.length}*${d.width}*${d.height}${pieces}`;
      }).join('\n'));
    }
  };

  const handleSaveList = async () => {
    try {
      const { orderId, type } = editingList;
      let updates = {};

      if (type === 'weight') {
        const result = parseWeightList(listInput);
        updates.weight_list = JSON.stringify(result.weights);
        updates.total_weight_lbs = result.total;
      } else if (type === 'dimensions') {
        const result = parseDimensionsList(listInput);
        const totalVol = calculateTotalVolume(result);
        const totalPallets = result.reduce((sum, d) => sum + (d.pieces || 1), 0);
        
        updates.dimensions_list = JSON.stringify(result);
        updates.total_volume = totalVol;
        updates.actual_pallets = totalPallets; // 总板数 = 所有p的总和
      }

      await orderApi.updateOrder(orderId, updates);
      
      // 更新本地state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      );

      setEditingList({ orderId: null, type: null });
      setListInput('');
      alert('✅ 列表更新成功！');
      loadOrders(); // 刷新列表
    } catch (error) {
      alert('❌ 保存失败: ' + error.message);
    }
  };

  const handleCancelList = () => {
    setEditingList({ orderId: null, type: null });
    setListInput('');
  };

  // 单元格更新处理
  const handleCellUpdate = async (orderId, field, newValue) => {
    try {
      console.log('💾 更新字段:', { orderId, field, newValue });
      
      const response = await orderApi.updateOrder(orderId, {
        [field]: newValue
      });
      
      if (response.success) {
        // 更新本地state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, [field]: newValue }
              : order
          )
        );
        console.log('✅ 更新成功');
      }
    } catch (error) {
      console.error('❌ 更新失败:', error);
      throw error;
    }
  };

  // Google Maps 地址处理和距离计算
  const calculateAddressDetails = async (orderId, type, originAddr, destAddr) => {
    try {
      if (!window.google || !window.google.maps) {
        console.warn('⚠️ Google Maps API未加载，跳过自动计算');
        return;
      }

      console.log('🗺️ 开始计算地址详情...', { type, originAddr, destAddr });

      // 1. Geocoding提取城市、州、邮编
      const geocoder = new window.google.maps.Geocoder();
      
      const geocodePromise = (address) => {
        return new Promise((resolve, reject) => {
          // 清理地址（移除多余空格和换行，智能格式化）
          let cleanAddress = address.trim()
            .replace(/\n+/g, ' ')      // 换行变空格
            .replace(/\s+/g, ' ')      // 多个空格变单个
            .replace(/\s*,\s*/g, ', '); // 统一逗号格式
          
          console.log('🗺️ 清理后的地址:', cleanAddress);
          
          geocoder.geocode({ address: cleanAddress }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const components = results[0].address_components;
              let city = '', state = '', zipcode = '';
              
              components.forEach(component => {
                // 城市可能在locality或sublocality
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (!city && component.types.includes('sublocality')) {
                  city = component.long_name;
                }
                
                // 州
                if (component.types.includes('administrative_area_level_1')) {
                  state = component.short_name; // CA, NY, ID等
                }
                
                // 邮编
                if (component.types.includes('postal_code')) {
                  zipcode = component.long_name;
                }
              });
              
              console.log('🗺️ 地址解析成功:', { city, state, zipcode, address: cleanAddress });
              resolve({ city, state, zipcode });
            } else {
              console.warn('⚠️ 地址解析失败:', status);
              reject(new Error('地址解析失败: ' + status));
            }
          });
        });
      };

      // 2. 使用zipcode计算距离（更可靠）
      const distanceService = new window.google.maps.DistanceMatrixService();
      
      const calculateDistByZipcode = (originZip, destZip) => {
        return new Promise((resolve, reject) => {
          if (!originZip || !destZip) {
            reject(new Error('缺少邮编'));
            return;
          }
          
          console.log('🗺️ 使用邮编计算距离:', { originZip, destZip });
          
          distanceService.getDistanceMatrix({
            origins: [originZip],
            destinations: [destZip],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.IMPERIAL
          }, (response, status) => {
            console.log('🗺️ 距离API响应:', { status, response });
            
            if (status === 'OK') {
              const element = response.rows[0].elements[0];
              if (element.status === 'OK') {
                const distanceValue = element.distance.value; // 米
                const distanceMiles = Math.round(distanceValue * 0.000621371); // 转换为英里
                console.log('✅ 距离计算成功:', distanceMiles, 'miles');
                resolve(distanceMiles);
              } else {
                console.warn('⚠️ 距离计算元素错误:', element.status);
                reject(new Error('无法计算距离: ' + element.status));
              }
            } else {
              console.warn('⚠️ 距离计算失败:', status);
              reject(new Error('距离计算失败: ' + status));
            }
          });
        });
      };

      // 3. 先解析地址获取zipcode
      let originInfo = null;
      let destInfo = null;
      let originZip = null;
      let destZip = null;
      
      // 解析当前更新的地址
      if (type === 'origin') {
        originInfo = await geocodePromise(originAddr);
        originZip = originInfo.zipcode;
      }
      
      if (type === 'destination') {
        destInfo = await geocodePromise(destAddr);
        destZip = destInfo.zipcode;
      }
      
      // 4. 获取另一个地址的zipcode（从数据库或刚解析的）
      if (!originZip && type === 'destination') {
        // 从订单数据获取发货zipcode
        const currentOrder = orders.find(o => o.id === orderId);
        originZip = currentOrder?.origin_zipcode;
      }
      
      if (!destZip && type === 'origin') {
        // 从订单数据获取收货zipcode
        const currentOrder = orders.find(o => o.id === orderId);
        destZip = currentOrder?.destination_zipcode;
      }
      
      // 5. 使用zipcode计算距离
      let distance = null;
      if (originZip && destZip) {
        try {
          console.log('🗺️ 准备用邮编计算距离:', { originZip, destZip });
          distance = await calculateDistByZipcode(originZip, destZip);
        } catch (err) {
          console.warn('⚠️ 距离计算失败:', err);
        }
      } else {
        console.warn('⚠️ 缺少邮编，无法计算距离:', { originZip, destZip });
      }

      // 6. 更新所有相关字段
      const updates = {};
      if (originInfo) {
        updates.origin_city = originInfo.city;
        updates.origin_state = originInfo.state;
        updates.origin_zipcode = originInfo.zipcode;
      }
      if (destInfo) {
        updates.destination_city = destInfo.city;
        updates.destination_state = destInfo.state;
        updates.destination_zipcode = destInfo.zipcode;
      }
      if (distance !== null) {
        updates.transport_distance = distance;
      }

      console.log('🗺️ 计算结果:', updates);

      if (Object.keys(updates).length > 0) {
        const response = await orderApi.updateOrder(orderId, updates);
        
        if (response.success) {
          console.log('✅ 地址详情已自动更新，刷新列表...');
          
          // 重新加载整个订单列表以确保UI同步
          await loadOrders();
          
          // 显示成功提示
          const updateMsg = [];
          if (updates.origin_city || updates.destination_city) {
            updateMsg.push('城市/州已提取');
          }
          if (updates.transport_distance) {
            updateMsg.push(`距离: ${updates.transport_distance} mi`);
          }
          
          if (updateMsg.length > 0) {
            alert('✅ ' + updateMsg.join(', '));
          }
        }
      }
    } catch (error) {
      console.error('❌ 地址计算失败:', error);
      alert('⚠️ 地址自动计算失败，请检查地址格式或手动输入');
    }
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    return parseFloat(num).toLocaleString();
  };

  const formatCurrency = (num) => {
    if (!num) return '-';
    return `$${parseFloat(num).toLocaleString()}`;
  };

  const getSubStatusBadge = (subStatus) => {
    if (!subStatus) return null;
    const labels = {
      waiting_driver: '等待司机',
      driver_found: '找到司机',
      in_transit: '运输中'
    };
    return (
      <span className={`status-badge sub-status-${subStatus}`}>
        {labels[subStatus]}
      </span>
    );
  };

  return (
    <div className="broker-orders-container">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>订单管理</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentStatus === 'quote' ? 'active' : ''}`}
            onClick={() => handleStatusChange('quote')}
          >
            报价单
          </button>
          
          <button
            className={`nav-item ${currentStatus === 'ordered' ? 'active' : ''}`}
            onClick={() => handleStatusChange('ordered')}
          >
            已下单
          </button>
          
          <button
            className={`nav-item ${currentStatus === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatusChange('completed')}
          >
            已完成
          </button>
        </nav>

        {/* 已下单的子状态统计 */}
        {currentStatus === 'ordered' && (
          <div className="sub-status-stats">
            <h3>订单状态</h3>
            <div className="stat-item waiting-driver">
              <span>等待司机</span>
              <strong>{stats.waiting_driver}</strong>
            </div>
            <div className="stat-item driver-found">
              <span>找到司机</span>
              <strong>{stats.driver_found}</strong>
            </div>
            <div className="stat-item in-transit">
              <span>运输中</span>
              <strong>{stats.in_transit}</strong>
            </div>
          </div>
        )}

        {/* 系统管理 */}
        {user?.employeeRole === 'admin' && (
          <div className="sidebar-footer">
            <button
              className="nav-item nav-admin"
              onClick={() => navigate('/employee/admin')}
            >
              ⚙️ 系统管理
            </button>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 工具栏 */}
        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="搜索订单号、公司..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          
          <select
            className="filter-select"
            value={filters.employee}
            onChange={(e) => setFilters({...filters, employee: e.target.value})}
          >
            <option value="all">所有订单</option>
            <option value="mine">我的订单</option>
          </select>

          <button 
            className="btn-create" 
            onClick={handleCreateOrder}
            disabled={loading}
          >
            {loading ? '创建中...' : '+ 新建报价单'}
          </button>
        </div>

        {/* 订单表格 */}
        {loading ? (
          <div className="loading">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>暂无订单</p>
            <button className="btn-create" onClick={handleCreateOrder}>
              创建第一个订单
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th width="30"></th>
                  <th>报价日期</th>
                  <th>询价公司</th>
                  <th>EW单号</th>
                  <th>发货单号</th>
                  <th>货物类型</th>
                  <th>发货地</th>
                  <th>收货地</th>
                  <th className="text-right">总重(lbs)</th>
                  <th className="text-right">总体积(ft³)</th>
                  <th className="text-right">总板数</th>
                  <th className="text-right">EW报价</th>
                  <th className="text-right">运输距离</th>
                  {currentStatus === 'ordered' && <th>状态</th>}
                  {currentStatus === 'ordered' && <th>卡车信息</th>}
                  <th>操作员工</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    {/* 主行 */}
                    <tr 
                      className={`order-row ${order.sub_status ? `sub-status-${order.sub_status}` : ''}`}
                      data-order-id={order.id}
                      onClick={() => toggleRow(order.id)}
                    >
                      <td>
                        <button className="expand-btn">
                          {expandedRow === order.id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>
                        <EditableCell
                          value={order.quote_date}
                          orderId={order.id}
                          field="quote_date"
                          type="date"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => {
                            if (!v) return '-';
                            const date = new Date(v);
                            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                          }}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={order.inquiry_company || order.customer_name}
                          orderId={order.id}
                          field="inquiry_company"
                          type="text"
                          onSave={handleCellUpdate}
                        />
                      </td>
                      <td className="order-number">
                        <EditableCell
                          value={order.ew_quote_number || order.order_number}
                          orderId={order.id}
                          field="ew_quote_number"
                          type="text"
                          onSave={handleCellUpdate}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={order.shipment_number}
                          orderId={order.id}
                          field="shipment_number"
                          type="text"
                          onSave={handleCellUpdate}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={order.cargo_type}
                          orderId={order.id}
                          field="cargo_type"
                          type="text"
                          onSave={handleCellUpdate}
                        />
                      </td>
                      <td>{order.origin_city}, {order.origin_state}</td>
                      <td>{order.destination_city}, {order.destination_state}</td>
                      <td className="text-right">{formatNumber(order.total_weight_lbs)}</td>
                      <td className="text-right">
                        <EditableCell
                          value={order.total_volume}
                          orderId={order.id}
                          field="total_volume"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => v ? `${parseFloat(v).toFixed(2)}` : '-'}
                        />
                      </td>
                      <td className="text-right">
                        <EditableCell
                          value={order.actual_pallets}
                          orderId={order.id}
                          field="actual_pallets"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => v || '-'}
                        />
                      </td>
                      <td className="text-right price">
                        <EditableCell
                          value={order.ew_quote_price}
                          orderId={order.id}
                          field="ew_quote_price"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => formatCurrency(v)}
                        />
                      </td>
                      <td className="text-right">
                        <EditableCell
                          value={order.transport_distance}
                          orderId={order.id}
                          field="transport_distance"
                          type="number"
                          onSave={handleCellUpdate}
                          formatDisplay={(v) => v ? `${formatNumber(v)} mi` : '-'}
                        />
                      </td>
                      {currentStatus === 'ordered' && (
                        <td>{getSubStatusBadge(order.sub_status)}</td>
                      )}
                      {currentStatus === 'ordered' && (
                        <td>
                          {order.truck_company_name ? (
                            <div className="truck-info-mini">
                              {order.truck_company_name}
                              {order.mc_number && <div className="mc-num">MC: {order.mc_number}</div>}
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td>
                        {currentStatus === 'quote' && order.creator_info?.name}
                        {currentStatus === 'ordered' && order.confirmed_by && `确认: ${order.confirmed_by}`}
                        {currentStatus === 'completed' && order.completed_by && `完成: ${order.completed_by}`}
                      </td>
                      <td>
                        {order.status === 'quote' ? (
                          <button
                            className="btn-confirm-order"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmOrder(order.id);
                            }}
                          >
                            下单
                          </button>
                        ) : (
                          <button
                            className="btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(order.id);
                            }}
                          >
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* 展开行（隐藏字段） */}
                    {expandedRow === order.id && (
                      <tr className="expanded-row">
                        <td colSpan="100%">
                          <div className="expanded-content">
                            {/* 重量和尺寸列表（支持粘贴编辑）*/}
                            <div className="lists-section">
                              <div className="list-column">
                                <div className="list-header">
                                  <h4>重量列表 (lbs)</h4>
                                  <button 
                                    className="btn-edit-list"
                                    onClick={() => handleEditList(order.id, 'weight', order.weight_list)}
                                  >
                                    ✏️ 编辑
                                  </button>
                                </div>
                                
                                {editingList.orderId === order.id && editingList.type === 'weight' ? (
                                  <div className="list-edit-mode">
                                    <textarea
                                      className="list-textarea"
                                      rows="8"
                                      value={listInput}
                                      onChange={(e) => setListInput(e.target.value)}
                                      placeholder="每行一个重量&#10;4260&#10;2820&#10;677&#10;...&#10;total: 7757"
                                      autoFocus
                                    />
                                    <div className="list-edit-actions">
                                      <button className="btn-save" onClick={handleSaveList}>保存</button>
                                      <button className="btn-cancel" onClick={handleCancelList}>取消</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="list-content">
                                    {order.weight_list ? (
                                      <>
                                        {JSON.parse(order.weight_list).map((weight, idx) => (
                                          <div key={idx} className="list-item">
                                            {idx + 1}. {formatNumber(weight)} lbs
                                          </div>
                                        ))}
                                        <div className="list-total">
                                          总计: {formatNumber(order.total_weight_lbs)} lbs
                                        </div>
                                      </>
                                    ) : (
                                      <div className="list-empty">未填写（点击编辑）</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="list-column">
                                <div className="list-header">
                                  <h4>尺寸列表</h4>
                                  <button 
                                    className="btn-edit-list"
                                    onClick={() => handleEditList(order.id, 'dimensions', order.dimensions_list)}
                                  >
                                    ✏️ 编辑
                                  </button>
                                </div>
                                
                                {editingList.orderId === order.id && editingList.type === 'dimensions' ? (
                                  <div className="list-edit-mode">
                                    <textarea
                                      className="list-textarea"
                                      rows="8"
                                      value={listInput}
                                      onChange={(e) => setListInput(e.target.value)}
                                      placeholder="每行一个尺寸&#10;16*97*15 1p&#10;9*41*19 1p&#10;8*73*6 1p&#10;..."
                                      autoFocus
                                    />
                                    <div className="list-edit-actions">
                                      <button className="btn-save" onClick={handleSaveList}>保存</button>
                                      <button className="btn-cancel" onClick={handleCancelList}>取消</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="list-content">
                                    {order.dimensions_list ? (
                                      <>
                                        {JSON.parse(order.dimensions_list).map((dim, idx) => (
                                          <div key={idx} className="list-item">
                                            {idx + 1}. {dim.length}×{dim.width}×{dim.height} 
                                            {dim.pieces > 1 && ` (${dim.pieces}p)`}
                                            <span className="dim-volume">
                                              = {dim.volume?.toFixed(2)} ft³
                                            </span>
                                          </div>
                                        ))}
                                        <div className="list-total">
                                          总件数: {JSON.parse(order.dimensions_list).reduce((sum, d) => sum + (d.pieces || 1), 0)}p
                                          <br />
                                          总体积: {order.total_volume ? `${parseFloat(order.total_volume).toFixed(2)} ft³` : '-'}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="list-empty">未填写（点击编辑）</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 详细地址（可编辑） */}
                            <div className="address-detail-section">
                              <h4>详细地址（双击编辑）</h4>
                              <div className="address-detail-grid">
                                <div className="address-detail-item">
                                  <label>发货详细地址:</label>
                                  <EditableCell
                                    value={order.origin_address}
                                    orderId={order.id}
                                    field="origin_address"
                                    type="text"
                                    onSave={async (id, field, newValue) => {
                                      // 先保存地址
                                      await handleCellUpdate(id, field, newValue);
                                      
                                      // 获取最新的订单数据（更新后的）
                                      const updatedOrder = orders.find(o => o.id === id);
                                      const destAddr = updatedOrder?.destination_address || order.destination_address;
                                      
                                      // 调用Google Maps计算
                                      console.log('🗺️ 发货地址已更新，准备计算...', { newValue, destAddr });
                                      if (newValue && destAddr) {
                                        setTimeout(() => {
                                          calculateAddressDetails(id, 'origin', newValue, destAddr);
                                        }, 500);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="address-detail-item">
                                  <label>收货详细地址:</label>
                                  <EditableCell
                                    value={order.destination_address}
                                    orderId={order.id}
                                    field="destination_address"
                                    type="text"
                                    onSave={async (id, field, newValue) => {
                                      // 先保存地址
                                      await handleCellUpdate(id, field, newValue);
                                      
                                      // 获取最新的订单数据
                                      const updatedOrder = orders.find(o => o.id === id);
                                      const originAddr = updatedOrder?.origin_address || order.origin_address;
                                      
                                      // 调用Google Maps计算
                                      console.log('🗺️ 收货地址已更新，准备计算...', { originAddr, newValue });
                                      if (originAddr && newValue) {
                                        setTimeout(() => {
                                          calculateAddressDetails(id, 'destination', originAddr, newValue);
                                        }, 500);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="detail-grid">
                              <div className="detail-item">
                                <label>总货值:</label>
                                <EditableCell
                                  value={order.cargo_value}
                                  orderId={order.id}
                                  field="cargo_value"
                                  type="number"
                                  onSave={handleCellUpdate}
                                  formatDisplay={(v) => formatCurrency(v)}
                                />
                              </div>
                              <div className="detail-item">
                                <label>地址类型:</label>
                                <EditableCell
                                  value={order.address_type}
                                  orderId={order.id}
                                  field="address_type"
                                  type="select"
                                  options={[
                                    { value: 'Residential', label: 'Residential' },
                                    { value: 'Commercial', label: 'Commercial' },
                                    { value: 'Warehouse', label: 'Warehouse' }
                                  ]}
                                  onSave={handleCellUpdate}
                                />
                              </div>
                              <div className="detail-item">
                                <label>总面积板:</label>
                                <span>{formatNumber(order.total_area_pallets)}</span>
                              </div>
                              <div className="detail-item">
                                <label>TOTAL DAT:</label>
                                <span>{formatCurrency(order.total_dat)}</span>
                              </div>
                              <div className="detail-item">
                                <label>理想报价:</label>
                                <span>{formatCurrency(order.ideal_quote)}</span>
                              </div>
                              <div className="detail-item">
                                <label>车辆板数:</label>
                                <span>{order.truck_pallets || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <label>TQL价格1:</label>
                                <span>{formatCurrency(order.tql_price_1)}</span>
                              </div>
                              <div className="detail-item">
                                <label>TQL价格2:</label>
                                <span>{formatCurrency(order.tql_price_2)}</span>
                              </div>
                              <div className="detail-item">
                                <label>其他价格(API):</label>
                                <span>{formatCurrency(order.other_api_price)}</span>
                              </div>
                              <div className="detail-item highlight">
                                <label>报价参考:</label>
                                <span>{formatCurrency(order.quote_reference)}</span>
                              </div>
                              <div className="detail-item">
                                <label>参考+10%:</label>
                                <span>{formatCurrency(order.quote_ref_10)}</span>
                              </div>
                              <div className="detail-item">
                                <label>参考+20%:</label>
                                <span>{formatCurrency(order.quote_ref_20)}</span>
                              </div>
                              <div className="detail-item">
                                <label>参考+30%:</label>
                                <span>{formatCurrency(order.quote_ref_30)}</span>
                              </div>
                              <div className="detail-item profit">
                                <label>利润:</label>
                                <span className="profit-value">{formatCurrency(order.profit)}</span>
                              </div>
                            </div>

                            {/* 下单后的卡车信息 */}
                            {currentStatus !== 'quote' && (
                              <div className="truck-details">
                                <h4>卡车信息</h4>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <label>付卡车价格:</label>
                                    <span>{formatCurrency(order.truck_payment)}</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>MC Number:</label>
                                    <span>{order.mc_number || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>卡车公司:</label>
                                    <span>{order.truck_company_name || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>联络方式:</label>
                                    <span>{order.truck_contact || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerOrdersNew;

