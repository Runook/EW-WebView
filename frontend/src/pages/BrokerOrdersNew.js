import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, truckContactApi } from '../config/employeeApi';
import EditableCell from '../components/EditableCell';
import CompanyEditableCell from '../components/CompanyEditableCell';
import ConfirmOrderModal from '../components/ConfirmOrderModal';
import DocumentGenerator from '../components/DocumentGenerator';
import InvoiceGenerator from '../components/InvoiceGenerator';
import QuoteGenerator from '../components/QuoteGenerator';
import QBOSettings from '../components/QBOSettings';
import CargoItemsList from '../components/CargoItemsList';
import AIFileDropZone from '../components/AIFileDropZone';
import { loadGoogleMapsScript, diagnoseGoogleMapsIssues } from '../config/googleMaps';
import './BrokerOrdersNew.css';

const BrokerOrdersNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [stats, setStats] = useState({
    waiting_driver: 0,
    driver_found: 0,
    in_transit: 0
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // 文档生成器状态
  const [showDocGenerator, setShowDocGenerator] = useState(false);
  const [documentType, setDocumentType] = useState(null); // 'BOL' 或 'RC'
  
  // 报价生成器状态
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  
  // Invoice 生成器状态
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  
  // QBO 设置状态
  const [showQBOSettings, setShowQBOSettings] = useState(false);
  
  // POD 状态
  const [podData, setPodData] = useState({}); // { orderId: [pods] }
  const [podUploading, setPodUploading] = useState({});
  
  // 文档管理状态
  const [orderDocs, setOrderDocs] = useState({}); // { orderId: { byType: {...} } }
  const [docUploading, setDocUploading] = useState({});
  
  const currentStatus = searchParams.get('status') || 'quote';
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employee: searchParams.get('employee') || 'all'
  });

  // Handle QBO callback redirect
  useEffect(() => {
    const qboStatus = searchParams.get('qbo');
    if (qboStatus === 'connected') {
      const company = searchParams.get('company');
      alert(`QuickBooks 已连接${company ? ': ' + company : ''}`);
      const params = new URLSearchParams(searchParams);
      params.delete('qbo'); params.delete('company'); params.delete('msg');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    } else if (qboStatus === 'error') {
      alert('QuickBooks 连接失败: ' + (searchParams.get('msg') || '未知错误'));
      const params = new URLSearchParams(searchParams);
      params.delete('qbo'); params.delete('msg');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [searchParams]);

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
        // 已完成订单自动加载文档状态
        if (currentStatus === 'completed' && response.data) {
          response.data.forEach(o => loadDocs(o.id));
        }
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

  // 获取纽约时间的 YYYY-MM-DD 格式日期
  const getNYDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now); // 返回 YYYY-MM-DD 格式
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
        quote_date: getNYDate()
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
    // 找到对应的订单
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      alert('订单不存在');
      return;
    }
    
    // 显示确认下单模态框
    setSelectedOrder(order);
    setShowConfirmModal(true);
  };

  const handleConfirmOrderSubmit = async (formData) => {
    try {
      // 先确认订单
      const response = await orderApi.confirmOrder(selectedOrder.id, 'waiting_driver');
      
      if (response.success) {
        // 然后更新卡车和备用司机信息，同时更新日期为当天（下单日期）
        await orderApi.updateOrder(selectedOrder.id, {
          quote_date: getNYDate(),
          truck_payment: parseFloat(formData.truck_payment),
          mc_number: formData.mc_number,
          dot_number: formData.dot_number || null,
          truck_company_name: formData.truck_company_name,
          truck_contact: formData.truck_contact,
          carrier_email: formData.carrier_email || null,
          carrier_address: formData.carrier_address || null,
          driver_name: formData.driver_name || null,
          driver_phone: formData.driver_phone || null,
          backup_driver_1_name: formData.backup_driver_1_name || null,
          backup_driver_1_phone: formData.backup_driver_1_phone || null,
          backup_driver_2_name: formData.backup_driver_2_name || null,
          backup_driver_2_phone: formData.backup_driver_2_phone || null,
          backup_driver_3_name: formData.backup_driver_3_name || null,
          backup_driver_3_phone: formData.backup_driver_3_phone || null
        });
        
        try {
          await truckContactApi.upsertContact({
            mc_number: formData.mc_number,
            truck_company_name: formData.truck_company_name,
            truck_contact: formData.truck_contact,
            dot_number: formData.dot_number || null,
            carrier_email: formData.carrier_email || null
          });
        } catch (e) {
          console.warn('Auto-save contact failed:', e);
        }

        alert('订单已确认下单，卡车和备用司机信息已保存！');
        
        // 关闭模态框
        setShowConfirmModal(false);
        setSelectedOrder(null);
        
        // 刷新列表
        loadOrders();
        
        // 切换到已下单标签
        navigate('/employee/broker-orders?status=ordered');
      }
    } catch (error) {
      console.error('下单失败:', error);
      alert('操作失败: ' + error.message);
    }
  };

  const toggleRow = (orderId) => {
    const newExpanded = expandedRow === orderId ? null : orderId;
    setExpandedRow(newExpanded);
    // 展开完成订单时自动加载 POD 和文档
    if (newExpanded && currentStatus === 'completed') {
      loadPods(orderId);
      loadDocs(orderId);
    }
  };

  // 计算报价参考及相关字段
  const calculateQuoteReferences = (order) => {
    let totalDat = parseFloat(order.total_dat) || 0;
    const truckPallets = parseFloat(order.truck_pallets) || 1; // 避免除以0
    const totalAreaPallets = parseFloat(order.total_area_pallets) || 0;
    const addressType = order.address_type || '';
    
    // 如果是 Residential，TOTAL DAT 乘以 0.7
    if (addressType === 'Residential') {
      totalDat = totalDat * 0.7;
    }
    
    // 报价参考 = (TOTAL DAT / 车类型) × 总面积板数 + 100
    const quoteReference = (totalDat / truckPallets) * totalAreaPallets + 100;
    
    // 参考+10%, +20%, +30%
    const quoteRef10 = quoteReference * 1.1;
    const quoteRef20 = quoteReference * 1.2;
    const quoteRef30 = quoteReference * 1.3;
    
    return {
      quote_reference: quoteReference,
      quote_ref_10: quoteRef10,
      quote_ref_20: quoteRef20,
      quote_ref_30: quoteRef30
    };
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

  // 单元格更新处理（带自动计算）
  const handleCellUpdateWithCalculation = async (orderId, field, newValue) => {
    try {
      console.log('💾 更新字段并计算:', { orderId, field, newValue });
      
      // 获取当前订单数据
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) return;
      
      // 创建更新后的订单对象
      const updatedOrder = { ...currentOrder, [field]: newValue };
      
      // 计算报价参考及相关字段
      const calculatedFields = calculateQuoteReferences(updatedOrder);
      
      // 合并所有要更新的字段
      const updateData = {
        [field]: newValue,
        ...calculatedFields
      };
      
      const response = await orderApi.updateOrder(orderId, updateData);
      
      if (response.success) {
        // 更新本地state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...updateData }
              : order
          )
        );
        console.log('✅ 更新成功并自动计算完成');
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
      waiting_driver: '寻找司机',
      driver_found: '找到司机',
      sent_to_3pl: '给3PL',
      in_transit: '运输中'
    };
    return (
      <span className={`status-badge sub-status-${subStatus}`}>
        {labels[subStatus]}
      </span>
    );
  };

  const handleUpdateSubStatus = async (orderId, subStatus) => {
    try {
      const response = await orderApi.updateSubStatus(orderId, subStatus);
      if (response.success) {
        console.log('✅ 子状态更新成功:', subStatus);
        await loadOrders();
      }
    } catch (error) {
      console.error('❌ 更新子状态失败:', error);
      alert('更新状态失败: ' + error.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('确定要将此订单标记为"已完成"吗？')) {
      return;
    }
    
    try {
      const response = await orderApi.completeOrder(orderId);
      if (response.success) {
        console.log('✅ 订单已完成');
        await loadOrders();
      }
    } catch (error) {
      console.error('❌ 完成订单失败:', error);
      alert('完成订单失败: ' + error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('确定要取消此订单吗？取消后订单将移到"已取消"标签。')) {
      return;
    }
    
    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        console.log('✅ 订单已取消');
        await loadOrders();
        // 如果需要，切换到已取消标签
        navigate('/employee/broker-orders?status=cancelled');
      }
    } catch (error) {
      console.error('❌ 取消订单失败:', error);
      alert('取消订单失败: ' + error.message);
    }
  };

  const handleRequestClaim = async (orderId) => {
    const claimReason = prompt('请输入索赔原因:');
    if (!claimReason || claimReason.trim() === '') {
      alert('索赔原因不能为空！');
      return;
    }
    
    try {
      const response = await orderApi.requestClaim(orderId, claimReason);
      if (response.success) {
        alert('索赔申请已提交！');
        await loadOrders();
        // 切换到需要索赔标签
        navigate('/employee/broker-orders?status=claim');
      }
    } catch (error) {
      console.error('❌ 申请索赔失败:', error);
      alert('申请索赔失败: ' + error.message);
    }
  };

  const handleReopenOrder = async (orderId) => {
    if (!window.confirm('确定要重新打开此订单吗？订单将回到"已下单"状态。')) {
      return;
    }
    
    try {
      const response = await orderApi.updateOrder(orderId, {
        status: 'ordered',
        sub_status: 'waiting_driver'
      });
      if (response.success) {
        alert('订单已重新打开！');
        await loadOrders();
        // 切换到已下单标签
        navigate('/employee/broker-orders?status=ordered');
      }
    } catch (error) {
      console.error('❌ 重新打开订单失败:', error);
      alert('重新打开订单失败: ' + error.message);
    }
  };

  // ========== 文档管理 ==========
  const DOC_TYPES = [
    { key: 'quote', label: '报价' },
    { key: 'bol', label: 'BOL' },
    { key: 'rc', label: 'RC' },
    { key: 'pod', label: 'POD' },
    { key: 'customer_invoice', label: '发票' },
    { key: 'vendor_invoice', label: '司机发票' },
  ];

  const loadDocs = async (orderId) => {
    try {
      const res = await orderApi.getDocuments(orderId);
      if (res.success) setOrderDocs(prev => ({ ...prev, [orderId]: res.data.byType }));
    } catch (e) { console.error('加载文档失败:', e); }
  };

  const handleDocUpload = async (orderId, file, docType) => {
    const uploadKey = `${orderId}-${docType}`;
    setDocUploading(prev => ({ ...prev, [uploadKey]: true }));
    try {
      await orderApi.uploadDocument(orderId, file, docType);
      await loadDocs(orderId);
    } catch (e) { alert('上传失败: ' + e.message); }
    finally { setDocUploading(prev => ({ ...prev, [uploadKey]: false })); }
  };

  const handleDocDownload = async (orderId, docId, filename) => {
    try { await orderApi.downloadDocument(orderId, docId, filename); }
    catch (e) { alert('下载失败: ' + e.message); }
  };

  const handleDocDelete = async (orderId, docId, docType) => {
    if (!window.confirm('确定删除此文档？')) return;
    try { await orderApi.deleteDocument(orderId, docId); await loadDocs(orderId); }
    catch (e) { alert('删除失败: ' + e.message); }
  };

  // 快速标记付款
  const handleMarkPaid = async (orderId, status) => {
    try {
      await orderApi.markPaid(orderId, { payment_status: status });
      await loadOrders();
    } catch (e) { alert('操作失败: ' + e.message); }
  };

  // ========== POD 相关 ==========
  const loadPods = async (orderId) => {
    try {
      const response = await orderApi.getPods(orderId);
      if (response.success) {
        setPodData(prev => ({ ...prev, [orderId]: response.data }));
      }
    } catch (error) {
      console.error('加载POD失败:', error);
    }
  };

  const handlePodUpload = async (orderId, file) => {
    if (!file) return;
    setPodUploading(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderApi.uploadPod(orderId, file);
      alert('✅ POD 上传成功');
      await loadPods(orderId);
    } catch (error) {
      console.error('POD 上传失败:', error);
      alert('上传失败: ' + error.message);
    } finally {
      setPodUploading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePodDownload = async (orderId, podId, filename) => {
    try {
      await orderApi.downloadPod(orderId, podId, filename);
    } catch (error) {
      console.error('POD 下载失败:', error);
      alert('下载失败: ' + error.message);
    }
  };

  const handlePodDelete = async (orderId, podId) => {
    if (!window.confirm('确定要删除此 POD 文件吗？')) return;
    try {
      await orderApi.deletePod(orderId, podId);
      alert('✅ POD 已删除');
      await loadPods(orderId);
    } catch (error) {
      console.error('POD 删除失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const handleBackToQuote = async (orderId) => {
    if (!window.confirm('确定要回到报价状态吗？这将清除所有卡车信息（付卡车价格、MC Number、卡车公司、联络方式），如需重新下单需重新填写。')) {
      return;
    }
    
    try {
      const response = await orderApi.updateOrder(orderId, {
        status: 'quote',
        sub_status: null,
        truck_payment: null,
        mc_number: null,
        truck_company_name: null,
        truck_contact: null,
        confirmed_by: null,
        confirmed_at: null
      });
      if (response.success) {
        alert('订单已回到报价状态，卡车信息已清除！');
        await loadOrders();
        // 切换到报价单标签
        navigate('/employee/broker-orders?status=quote');
      }
    } catch (error) {
      console.error('❌ 回到报价失败:', error);
      alert('回到报价失败: ' + error.message);
    }
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
          
          <button
            className={`nav-item ${currentStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => handleStatusChange('cancelled')}
          >
            已取消
          </button>
          
          <button
            className={`nav-item ${currentStatus === 'claim' ? 'active' : ''}`}
            onClick={() => handleStatusChange('claim')}
          >
            需索赔
          </button>
        </nav>

        {/* 分割线 */}
        <div className="nav-divider"></div>

        {/* Customers */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/customers')}
        >
          Customers
        </button>

        {/* Vendors */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/vendors')}
        >
          Vendors
        </button>

        {/* 付款管理 */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/payments')}
        >
          付款管理
        </button>

        {/* 地图查单 */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/map-view')}
        >
          地图查单
        </button>

        {/* AI 报价审核 */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/ai-review')}
        >
          AI 报价审核
        </button>

        {/* DAT Load Board */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/dat-loadboard')}
        >
          DAT Load Board
        </button>

        {/* 司机联系簿 */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/driver-contacts')}
        >
          司机联系簿
        </button>

        {/* 广告管理 */}
        <button
          className="nav-item"
          onClick={() => navigate('/employee/ads')}
        >
          广告管理
        </button>

        {/* QuickBooks 设置 */}
        <button
          className="nav-item"
          onClick={() => setShowQBOSettings(true)}
        >
          QuickBooks
        </button>

        {/* 检查逾期 */}
        <button
          className="nav-item"
          onClick={async () => {
            try {
              const res = await orderApi.checkOverdue();
              if (res.success && res.data.length > 0) {
                const list = res.data.map(o => `${o.ew_quote_number || o.order_number}: ${o.inquiry_company} - 逾期${o.days_overdue}天, 欠款$${o.outstanding}, Late Fee$${o.late_fee}`).join('\n');
                alert(`发现 ${res.data.length} 个逾期订单:\n\n${list}`);
              } else {
                alert('没有逾期订单');
              }
            } catch (e) { alert('检查失败: ' + e.message); }
          }}
        >
          检查逾期
        </button>

        {/* 已下单的子状态统计 */}
        {currentStatus === 'ordered' && (
          <div className="sub-status-stats">
            <h3>订单状态</h3>
            <div className="stat-item waiting-driver">
              <span>寻找司机</span>
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

        {/* AI 文件解析区域 - 仅在 quote tab 显示 */}
        {currentStatus === 'quote' && (
          <AIFileDropZone onOrdersCreated={() => loadOrders()} />
        )}

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
                  <th>日期</th>
                  <th>Company</th>
                  <th>发货单号</th>
                  <th>WE单号</th>
                  <th>货物备注</th>
                  <th>发货地</th>
                  <th>收货地</th>
                  <th className="text-right">总重(lbs)</th>
                  <th className="text-right">总体积(ft³)</th>
                  <th className="text-right">总件数</th>
                  <th className="text-right">WE报价</th>
                  <th className="text-right">运输距离</th>
                  {currentStatus === 'ordered' && <th>状态</th>}
                  {currentStatus === 'ordered' && <th>卡车信息</th>}
                  <th>操作员工</th>
                  <th>操作</th>
                  {currentStatus === 'quote' && (
                    <th>
                      <button 
                        className="btn-header btn-quote-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuoteGenerator(true);
                        }}
                        title="批量生成报价"
                      >
                        📋 报价
                      </button>
                    </th>
                  )}
                  {currentStatus === 'ordered' && (
                    <>
                      <th>
                        <button 
                          className="btn-header btn-bol-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentType('BOL');
                            setShowDocGenerator(true);
                          }}
                          title="批量生成BOL"
                        >
                          BOL
                        </button>
                      </th>
                      <th>
                        <button 
                          className="btn-header btn-rc-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentType('RC');
                            setShowDocGenerator(true);
                          }}
                          title="批量生成RC"
                        >
                          RC
                        </button>
                      </th>
                    </>
                  )}
                  {currentStatus === 'completed' && (
                    <>
                      <th>
                        <button 
                          className="btn-header btn-invoice-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInvoiceGenerator(true);
                          }}
                          title="批量生成Invoice"
                        >
                          Invoice
                        </button>
                      </th>
                      <th>付款</th>
                      <th>文档</th>
                    </>
                  )}
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
                            // 使用UTC时间避免时区转换问题
                            const date = new Date(v);
                            return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
                          }}
                        />
                      </td>
                      <td>
                        <CompanyEditableCell
                          value={order.inquiry_company || order.customer_name}
                          orderId={order.id}
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
                      <td className="order-number we-number">
                        <span className="we-number-display">
                          {order.order_number || '-'}
                        </span>
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
                              {order.mc_number && <div className="mc-num">MC# {order.mc_number}</div>}
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td>
                        {currentStatus === 'quote' && (order.creator_info?.name || '-')}
                        {currentStatus === 'ordered' && (order.confirmer_info?.name || order.assignee_info?.name || '-')}
                        {currentStatus === 'completed' && (order.completer_info?.name || '-')}
                        {currentStatus === 'cancelled' && (order.canceller_info?.name || '-')}
                        {currentStatus === 'claim' && (order.assignee_info?.name || order.creator_info?.name || '-')}
                      </td>
                      <td>
                        {order.status === 'quote' ? (
                          <div className="quote-actions">
                            <button
                              className="btn-confirm-order"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmOrder(order.id);
                              }}
                            >
                              下单
                            </button>
                            <button
                              className="btn-navigate-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                const origin = order.origin_address || `${order.origin_city}, ${order.origin_state} ${order.origin_zipcode}`;
                                const dest = order.destination_address || `${order.destination_city}, ${order.destination_state} ${order.destination_zipcode}`;
                                window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`, '_blank');
                              }}
                              title="打开Google Maps导航"
                            >
                              🗺️
                            </button>
                            <button
                              className="btn-delete-order"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(`确定要删除 ${order.order_number} 吗？`)) return;
                                try {
                                  await orderApi.deleteOrder(order.id);
                                  loadOrders();
                                } catch (err) {
                                  alert('删除失败: ' + err.message);
                                }
                              }}
                              title="删除订单"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : order.status === 'ordered' ? (
                          <div className="ordered-actions">
                            <div 
                              className="sub-status-dropdown"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={order.sub_status || 'waiting_driver'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newStatus = e.target.value;
                                  if (newStatus === 'completed') {
                                    handleCompleteOrder(order.id);
                                  } else if (newStatus === 'claim') {
                                    handleRequestClaim(order.id);
                                  } else if (newStatus === 'cancel') {
                                    handleCancelOrder(order.id);
                                  } else if (newStatus === 'back_to_quote') {
                                    handleBackToQuote(order.id);
                                  } else {
                                    handleUpdateSubStatus(order.id, newStatus);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="sub-status-select"
                              >
                                <option value="waiting_driver">寻找司机</option>
                                <option value="driver_found">找到司机</option>
                                <option value="sent_to_3pl">给3PL</option>
                                <option value="in_transit">运输中</option>
                                <option value="completed">已完成</option>
                                <option value="claim">需要索赔</option>
                                <option value="back_to_quote">回到报价</option>
                                <option value="cancel">取消订单</option>
                              </select>
                            </div>
                          </div>
                        ) : order.status === 'completed' ? (
                          <div className="completed-actions">
                            <div 
                              className="sub-status-dropdown"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value="completed"
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newStatus = e.target.value;
                                  if (newStatus === 'reopen') {
                                    handleReopenOrder(order.id);
                                  } else if (newStatus === 'claim') {
                                    handleRequestClaim(order.id);
                                  } else if (newStatus === 'cancel') {
                                    handleCancelOrder(order.id);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="sub-status-select"
                              >
                                <option value="completed">已完成</option>
                                <option value="reopen">重新打开</option>
                                <option value="claim">需要索赔</option>
                                <option value="cancel">取消订单</option>
                              </select>
                            </div>
                          </div>
                        ) : order.status === 'cancelled' ? (
                          <div className="cancelled-actions">
                            <div 
                              className="sub-status-dropdown"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value="cancelled"
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newStatus = e.target.value;
                                  if (newStatus === 'reopen') {
                                    handleReopenOrder(order.id);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="sub-status-select"
                              >
                                <option value="cancelled">已取消</option>
                                <option value="reopen">重新打开</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <span className="no-action">-</span>
                        )}
                      </td>
                      {currentStatus === 'quote' && <td></td>}
                      {currentStatus === 'ordered' && (
                        <>
                          <td></td>
                          <td></td>
                        </>
                      )}
                      {currentStatus === 'completed' && (
                        <>
                          <td></td>
                          {/* 付款状态 */}
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.payment_status || 'unpaid'}
                              onChange={(e) => handleMarkPaid(order.id, e.target.value)}
                              className="payment-status-select"
                              style={{
                                fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer',
                                color: order.payment_status === 'paid' ? '#16a34a' : order.payment_status === 'partial' ? '#f59e0b' : '#ef4444',
                                fontWeight: 600, background: 'white'
                              }}
                            >
                              <option value="unpaid">未付</option>
                              <option value="partial">部分</option>
                              <option value="paid">已付</option>
                            </select>
                          </td>
                          {/* 文档 - 6个紧凑文字链接 */}
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 11 }}>
                              {DOC_TYPES.map(dt => {
                                const doc = orderDocs[order.id]?.[dt.key];
                                const uploading = docUploading[`${order.id}-${dt.key}`];
                                if (uploading) return <span key={dt.key} style={{ color: '#9ca3af' }}>...</span>;
                                if (doc) {
                                  return (
                                    <span key={dt.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                      <span
                                        style={{ color: '#1565C0', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => handleDocDownload(order.id, doc.id, doc.original_filename)}
                                      >{dt.label}</span>
                                      <span
                                        style={{ color: '#ccc', cursor: 'pointer', fontSize: 10 }}
                                        onClick={() => handleDocDelete(order.id, doc.id, dt.key)}
                                      >x</span>
                                    </span>
                                  );
                                }
                                return (
                                  <label key={dt.key} style={{ color: '#ccc', cursor: 'pointer' }}>
                                    {dt.label}
                                    <input type="file" style={{ display: 'none' }}
                                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.tiff,.tif"
                                      onChange={(e) => { if (e.target.files[0]) { handleDocUpload(order.id, e.target.files[0], dt.key); e.target.value = ''; } }}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>

                    {/* 展开行（隐藏字段） */}
                    {expandedRow === order.id && (
                      <tr className="expanded-row">
                        <td colSpan="100%">
                          <div className="expanded-content">
                            {/* 货物明细列表（板数、重量、尺寸）*/}
                            <CargoItemsList
                              orderId={order.id}
                              weightList={order.weight_list}
                              dimensionsList={order.dimensions_list}
                              totalWeightLbs={order.total_weight_lbs}
                              totalVolume={order.total_volume}
                              actualPallets={order.actual_pallets}
                              onSave={async (orderId, updates) => {
                                await orderApi.updateOrder(orderId, updates);
                                setOrders(prevOrders =>
                                  prevOrders.map(o =>
                                    o.id === orderId ? { ...o, ...updates } : o
                                  )
                                );
                                loadOrders();
                              }}
                              readOnly={currentStatus === 'completed' || currentStatus === 'cancelled'}
                            />

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
                                    { value: 'Commercial+Lift', label: 'Commercial+Lift' },
                                    { value: 'Commercial', label: 'Commercial' },
                                    { value: 'Warehouse', label: 'Warehouse' }
                                  ]}
                                  onSave={async (id, field, newValue) => {
                                    // 地址类型与车类型联动
                                    const truckType = newValue === 'Residential' ? '13' : '26';
                                    
                                    // 先更新地址类型
                                    await handleCellUpdate(id, field, newValue);
                                    
                                    // 自动更新车类型
                                    await handleCellUpdate(id, 'truck_pallets', truckType);
                                    
                                    // 获取当前订单并重新计算
                                    const currentOrder = orders.find(o => o.id === id);
                                    if (currentOrder) {
                                      const updatedOrder = { 
                                        ...currentOrder, 
                                        address_type: newValue,
                                        truck_pallets: truckType 
                                      };
                                      const calculations = calculateQuoteReferences(updatedOrder);
                                      
                                      // 更新计算结果
                                      await orderApi.updateOrder(id, calculations);
                                      
                                      // 刷新订单列表
                                      setOrders(prevOrders => 
                                        prevOrders.map(o => 
                                          o.id === id ? { ...o, ...updatedOrder, ...calculations } : o
                                        )
                                      );
                                    }
                                  }}
                                />
                              </div>
                              <div className="detail-item">
                                <label>总面积板数:</label>
                                <EditableCell
                                  value={order.total_area_pallets}
                                  orderId={order.id}
                                  field="total_area_pallets"
                                  type="number"
                                  onSave={handleCellUpdateWithCalculation}
                                  formatDisplay={(v) => formatNumber(v)}
                                />
                              </div>
                              <div className="detail-item">
                                <label>TOTAL DAT:</label>
                                <EditableCell
                                  value={order.total_dat}
                                  orderId={order.id}
                                  field="total_dat"
                                  type="number"
                                  onSave={handleCellUpdateWithCalculation}
                                  formatDisplay={(v) => formatCurrency(v)}
                                />
                              </div>
                              <div className="detail-item">
                                <label>理想报价:</label>
                                <EditableCell
                                  value={order.ideal_quote}
                                  orderId={order.id}
                                  field="ideal_quote"
                                  type="number"
                                  onSave={handleCellUpdate}
                                  formatDisplay={(v) => formatCurrency(v)}
                                />
                              </div>
                              <div className="detail-item">
                                <label>车类型:</label>
                                <EditableCell
                                  value={order.truck_pallets}
                                  orderId={order.id}
                                  field="truck_pallets"
                                  type="select"
                                  options={[
                                    { value: '13', label: '13' },
                                    { value: '18', label: '18' },
                                    { value: '26', label: '26' }
                                  ]}
                                  onSave={handleCellUpdateWithCalculation}
                                  formatDisplay={(v) => v || '-'}
                                />
                              </div>
                              <div className="detail-item">
                                <label>比价平台Low1:</label>
                                <EditableCell
                                  value={order.tql_price_1}
                                  orderId={order.id}
                                  field="tql_price_1"
                                  type="number"
                                  onSave={handleCellUpdate}
                                  formatDisplay={(v) => formatCurrency(v)}
                                />
                              </div>
                              <div className="detail-item">
                                <label>比价平台Low2:</label>
                                <EditableCell
                                  value={order.tql_price_2}
                                  orderId={order.id}
                                  field="tql_price_2"
                                  type="number"
                                  onSave={handleCellUpdate}
                                  formatDisplay={(v) => formatCurrency(v)}
                                />
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
                                <EditableCell
                                  value={order.profit}
                                  orderId={order.id}
                                  field="profit"
                                  type="number"
                                  onSave={handleCellUpdate}
                                  formatDisplay={(v) => <span className="profit-value">{formatCurrency(v)}</span>}
                                />
                              </div>
                            </div>

                            {/* POD 文件列表（已完成订单） */}
                            {currentStatus === 'completed' && podData[order.id] && (
                              <div className="pod-section">
                                <h4>📄 POD (Proof of Delivery) 文件</h4>
                                {podData[order.id].length === 0 ? (
                                  <p className="pod-empty">暂无 POD 文件，点击 📤 上传</p>
                                ) : (
                                  <div className="pod-list">
                                    {podData[order.id].map(pod => (
                                      <div key={pod.id} className="pod-item">
                                        <div className="pod-info">
                                          <span className="pod-filename">{pod.original_filename}</span>
                                          <span className="pod-meta">
                                            {(pod.file_size / 1024).toFixed(1)} KB
                                            {pod.uploaded_by_name && ` · ${pod.uploaded_by_name}`}
                                            {pod.created_at && ` · ${new Date(pod.created_at).toLocaleDateString('zh-CN')}`}
                                          </span>
                                        </div>
                                        <div className="pod-actions">
                                          <button
                                            className="btn-pod-download"
                                            onClick={() => handlePodDownload(order.id, pod.id, pod.original_filename)}
                                            title="下载"
                                          >
                                            ⬇️ 下载
                                          </button>
                                          <button
                                            className="btn-pod-delete"
                                            onClick={() => handlePodDelete(order.id, pod.id)}
                                            title="删除"
                                          >
                                            🗑️ 删除
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <label className="btn-pod-upload-large">
                                  {podUploading[order.id] ? '⏳ 上传中...' : '📤 上传 POD 文件'}
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.tiff,.tif"
                                    onChange={(e) => {
                                      if (e.target.files[0]) {
                                        handlePodUpload(order.id, e.target.files[0]);
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={podUploading[order.id]}
                                  />
                                </label>
                              </div>
                            )}

                            {/* 下单后的卡车信息 */}
                            {currentStatus !== 'quote' && (
                              <div className="truck-details">
                                <h4>承运商信息</h4>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <label>付卡车价格:</label>
                                    <EditableCell
                                      value={order.truck_payment}
                                      orderId={order.id}
                                      field="truck_payment"
                                      type="number"
                                      onSave={handleCellUpdate}
                                      formatDisplay={(v) => formatCurrency(v)}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>MC#:</label>
                                    <EditableCell
                                      value={order.mc_number}
                                      orderId={order.id}
                                      field="mc_number"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>DOT#:</label>
                                    <EditableCell
                                      value={order.dot_number}
                                      orderId={order.id}
                                      field="dot_number"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>卡车公司:</label>
                                    <EditableCell
                                      value={order.truck_company_name}
                                      orderId={order.id}
                                      field="truck_company_name"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>公司联络方式:</label>
                                    <EditableCell
                                      value={order.truck_contact}
                                      orderId={order.id}
                                      field="truck_contact"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>Carrier Email:</label>
                                    <EditableCell
                                      value={order.carrier_email}
                                      orderId={order.id}
                                      field="carrier_email"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>Carrier Address:</label>
                                    <EditableCell
                                      value={order.carrier_address}
                                      orderId={order.id}
                                      field="carrier_address"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                </div>

                                <h4 style={{ marginTop: 12 }}>司机信息</h4>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <label>司机姓名:</label>
                                    <EditableCell
                                      value={order.driver_name}
                                      orderId={order.id}
                                      field="driver_name"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                  <div className="detail-item">
                                    <label>司机电话:</label>
                                    <EditableCell
                                      value={order.driver_phone}
                                      orderId={order.id}
                                      field="driver_phone"
                                      type="text"
                                      onSave={handleCellUpdate}
                                    />
                                  </div>
                                </div>

                                {/* 备用司机信息 */}
                                <div className="backup-drivers-section">
                                  <h4>备用司机信息</h4>
                                  
                                  {/* 备用司机1 */}
                                  <div className="backup-driver-group">
                                    <div className="backup-driver-header">备用司机 1</div>
                                    <div className="detail-grid">
                                      <div className="detail-item">
                                        <label>姓名:</label>
                                        <EditableCell
                                          value={order.backup_driver_1_name}
                                          orderId={order.id}
                                          field="backup_driver_1_name"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                      <div className="detail-item">
                                        <label>电话:</label>
                                        <EditableCell
                                          value={order.backup_driver_1_phone}
                                          orderId={order.id}
                                          field="backup_driver_1_phone"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 备用司机2 */}
                                  <div className="backup-driver-group">
                                    <div className="backup-driver-header">备用司机 2</div>
                                    <div className="detail-grid">
                                      <div className="detail-item">
                                        <label>姓名:</label>
                                        <EditableCell
                                          value={order.backup_driver_2_name}
                                          orderId={order.id}
                                          field="backup_driver_2_name"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                      <div className="detail-item">
                                        <label>电话:</label>
                                        <EditableCell
                                          value={order.backup_driver_2_phone}
                                          orderId={order.id}
                                          field="backup_driver_2_phone"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 备用司机3 */}
                                  <div className="backup-driver-group">
                                    <div className="backup-driver-header">备用司机 3</div>
                                    <div className="detail-grid">
                                      <div className="detail-item">
                                        <label>姓名:</label>
                                        <EditableCell
                                          value={order.backup_driver_3_name}
                                          orderId={order.id}
                                          field="backup_driver_3_name"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                      <div className="detail-item">
                                        <label>电话:</label>
                                        <EditableCell
                                          value={order.backup_driver_3_phone}
                                          orderId={order.id}
                                          field="backup_driver_3_phone"
                                          type="text"
                                          onSave={handleCellUpdate}
                                        />
                                      </div>
                                    </div>
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

      {/* 确认下单模态框 */}
      {showConfirmModal && selectedOrder && (
        <ConfirmOrderModal
          order={selectedOrder}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleConfirmOrderSubmit}
        />
      )}

      {/* 文档生成器对话框 */}
      <DocumentGenerator
        isOpen={showDocGenerator}
        onClose={() => {
          setShowDocGenerator(false);
          setDocumentType(null);
        }}
        documentType={documentType}
        orders={orders}
      />

      {/* Invoice 生成器对话框 */}
      <InvoiceGenerator
        isOpen={showInvoiceGenerator}
        onClose={() => setShowInvoiceGenerator(false)}
        orders={orders}
      />

      {/* 报价生成器对话框 */}
      <QuoteGenerator
        isOpen={showQuoteGenerator}
        onClose={() => setShowQuoteGenerator(false)}
        orders={orders}
      />

      {/* QBO 设置对话框 */}
      <QBOSettings
        isOpen={showQBOSettings}
        onClose={() => setShowQBOSettings(false)}
      />
    </div>
  );
};

export default BrokerOrdersNew;

