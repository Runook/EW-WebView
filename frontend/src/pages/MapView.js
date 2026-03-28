import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../config/employeeApi';
import { loadGoogleMapsScript } from '../config/googleMaps';
import './MapView.css';

// 状态颜色映射 - 红绿蓝黄主题
const STATUS_COLORS = {
  waiting_driver: '#e74c3c',   // 红色 - 寻找司机
  driver_found: '#3498db',     // 蓝色 - 找到司机
  in_transit: '#27ae60',       // 绿色 - 运输中
  sent_to_3pl: '#f1c40f'       // 黄色 - 给3PL
};

const STATUS_LABELS = {
  waiting_driver: '寻找司机',
  driver_found: '找到司机',
  in_transit: '运输中',
  sent_to_3pl: '给3PL'
};

// 坐标缓存
const coordsCache = new Map();

const MapView = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const infoWindowRef = useRef(null);
  const geocoderRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [ordersWithCoords, setOrdersWithCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    waiting_driver: 0,
    driver_found: 0,
    in_transit: 0,
    sent_to_3pl: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 使用 Google Maps Geocoder 获取坐标
  const geocodeZipcode = useCallback((zipcode) => {
    return new Promise((resolve) => {
      if (!zipcode || !geocoderRef.current) {
        resolve(null);
        return;
      }
      if (coordsCache.has(zipcode)) {
        resolve(coordsCache.get(zipcode));
        return;
      }
      geocoderRef.current.geocode(
        { address: zipcode + ', USA' },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            coordsCache.set(zipcode, coords);
            resolve(coords);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, []);

  // 批量获取订单坐标
  const geocodeOrders = useCallback(async (orderList) => {
    if (!window.google || !geocoderRef.current) return [];
    setGeocoding(true);
    const results = [];
    for (const order of orderList) {
      const originZip = order.origin_zipcode;
      const destZip = order.destination_zipcode;
      if (!originZip || !destZip) continue;
      const originCoords = await geocodeZipcode(originZip);
      await new Promise(r => setTimeout(r, 100));
      const destCoords = await geocodeZipcode(destZip);
      if (originCoords && destCoords) {
        results.push({ ...order, originCoords, destCoords });
      }
    }
    setGeocoding(false);
    return results;
  }, [geocodeZipcode]);

  // 加载 Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        setMapLoaded(true);
      } catch (error) {
        console.error('Google Maps 加载失败:', error);
      }
    };
    initMap();
  }, []);

  // 初始化地图
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ],
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false
      });
      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow({
        maxWidth: 650,
        disableAutoPan: false
      });
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [mapLoaded]);

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (orders.length > 0 && geocoderRef.current) {
      geocodeOrders(orders).then(setOrdersWithCoords);
    }
  }, [orders, mapLoaded, geocodeOrders]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mapInstanceRef.current && ordersWithCoords.length > 0) {
      drawOrderRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersWithCoords, filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrders({ status: 'ordered' });
      if (response.success) {
        const validOrders = (response.data || []).filter(order => 
          order.origin_zipcode && order.destination_zipcode
        );
        setOrders(validOrders);
        const newStats = { waiting_driver: 0, driver_found: 0, in_transit: 0, sent_to_3pl: 0 };
        validOrders.forEach(order => {
          if (order.sub_status && newStats[order.sub_status] !== undefined) {
            newStats[order.sub_status]++;
          }
        });
        setStats(newStats);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMap = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach(polyline => {
      if (polyline._animationId) clearInterval(polyline._animationId);
      polyline.setMap(null);
    });
    polylinesRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();
  };

  const drawOrderRoutes = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return;
    clearMap();
    
    const filteredOrders = filter === 'all' 
      ? ordersWithCoords 
      : ordersWithCoords.filter(o => o.sub_status === filter);
    
    if (filteredOrders.length === 0) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    
    filteredOrders.forEach(order => {
      const { originCoords, destCoords } = order;
      const color = STATUS_COLORS[order.sub_status] || '#999';
      const originLatLng = new window.google.maps.LatLng(originCoords.lat, originCoords.lng);
      const destLatLng = new window.google.maps.LatLng(destCoords.lat, destCoords.lng);
      
      // 发货地标记
      const originMarker = new window.google.maps.Marker({
        position: originLatLng,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: `发货: ${order.origin_zipcode}`
      });
      
      // 收货地标记
      const destMarker = new window.google.maps.Marker({
        position: destLatLng,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.5,
          strokeColor: color,
          strokeWeight: 3
        },
        title: `收货: ${order.destination_zipcode}`
      });
      
      // 光晕线
      const glowLine = new window.google.maps.Polyline({
        path: [originLatLng, destLatLng],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.3,
        strokeWeight: 12
      });
      glowLine.setMap(mapInstanceRef.current);
      
      // 主线条
      const mainLine = new window.google.maps.Polyline({
        path: [originLatLng, destLatLng],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 4
      });
      mainLine.setMap(mapInstanceRef.current);
      
      // 流动线
      const flowLine = new window.google.maps.Polyline({
        path: [originLatLng, destLatLng],
        geodesic: true,
        strokeColor: '#fff',
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [
          { icon: { path: 'M 0,-0.5 0,0.5', strokeOpacity: 0.8, strokeColor: '#fff', scale: 3 }, offset: '0%', repeat: '15px' },
          { icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, fillColor: '#fff', fillOpacity: 1, strokeColor: color, strokeWeight: 2 }, offset: '100%' }
        ]
      });
      flowLine.setMap(mapInstanceRef.current);
      
      // 动画
      let offset = 0;
      const animationId = setInterval(() => {
        offset = (offset + 0.5) % 100;
        flowLine.set('icons', [
          { icon: { path: 'M 0,-0.5 0,0.5', strokeOpacity: 0.6, strokeColor: '#fff', scale: 3 }, offset: offset + '%', repeat: '15px' },
          { icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, fillColor: '#fff', fillOpacity: 1, strokeColor: color, strokeWeight: 2 }, offset: '100%' }
        ]);
      }, 50);
      flowLine._animationId = animationId;
      
      // 获取WE单号（优先 ew_quote_number，后备 order_number）
      const ewNumber = order.ew_quote_number || order.order_number || `#${order.id}`;
      
      // 构建弹窗内容 - 清晰可读的设计
      const buildInfoContent = () => {
        const formatDate = (d) => d ? `${new Date(d).getUTCMonth()+1}/${new Date(d).getUTCDate()}/${new Date(d).getUTCFullYear()}` : '-';
        const formatMoney = (v) => v ? '$' + Number(v).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        const formatNum = (v) => v ? Number(v).toLocaleString('en-US') : '-';
        
        const originAddr = order.origin_address || `${order.origin_city || ''} ${order.origin_state || ''} ${order.origin_zipcode}`;
        const destAddr = order.destination_address || `${order.destination_city || ''} ${order.destination_state || ''} ${order.destination_zipcode}`;
        const popupId = `popup-${order.id}`;
        
        return `
          <div style="padding:14px;width:580px;max-height:520px;overflow-y:auto;font-size:13px;line-height:1.6;color:#333;background:#fff;box-sizing:border-box;">
            <!-- 头部：WE单号 + 状态 -->
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${color};padding-bottom:10px;margin-bottom:14px;">
              <span style="font-size:18px;font-weight:bold;color:#222;">${ewNumber}</span>
              <span style="background:${color};color:#fff;padding:5px 14px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;">${STATUS_LABELS[order.sub_status]||order.sub_status||'-'}</span>
            </div>
            
            <!-- 主要信息 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-bottom:14px;">
              <div><span style="color:#888;">日期:</span> <strong style="color:#333;">${formatDate(order.quote_date)}</strong></div>
              <div><span style="color:#888;">WE报价:</span> <strong style="color:#2e7d32;">${formatMoney(order.ew_quote_price)}</strong></div>
              <div style="grid-column:span 2;"><span style="color:#888;">询价公司:</span> <strong style="color:#333;">${order.inquiry_company||order.customer_name||'-'}</strong></div>
              <div><span style="color:#888;">发货单号:</span> <span style="color:#333;">${order.shipment_number||'-'}</span></div>
              <div><span style="color:#888;">货物备注:</span> <span style="color:#333;">${order.cargo_type||'-'}</span></div>
            </div>
            
            <!-- 路线信息 -->
            <div style="background:#f0f4f8;padding:12px;border-radius:6px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;margin-bottom:8px;">
                <span style="display:inline-block;width:14px;height:14px;background:${color};border-radius:50%;margin-right:8px;flex-shrink:0;"></span>
                <span style="color:#333;"><strong>发货:</strong> ${order.origin_city||''}, ${order.origin_state||''} ${order.origin_zipcode||''}</span>
              </div>
              <div style="text-align:center;color:#666;font-size:12px;margin:8px 0;">
                ↓ <strong>${order.transport_distance?formatNum(order.transport_distance)+' mi':'-'}</strong>
              </div>
              <div style="display:flex;align-items:center;">
                <span style="display:inline-block;width:14px;height:14px;background:${color};opacity:0.5;border-radius:50%;margin-right:8px;flex-shrink:0;"></span>
                <span style="color:#333;"><strong>收货:</strong> ${order.destination_city||''}, ${order.destination_state||''} ${order.destination_zipcode||''}</span>
              </div>
            </div>
            
            <!-- 数据卡片 - 2x2布局更紧凑 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
              <div style="background:#e3f2fd;padding:10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#666;font-size:12px;">总重(lbs)</span>
                <strong style="color:#1565c0;">${order.total_weight_lbs?formatNum(order.total_weight_lbs):'-'}</strong>
              </div>
              <div style="background:#e3f2fd;padding:10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#666;font-size:12px;">总体积(ft³)</span>
                <strong style="color:#1565c0;">${order.total_volume?parseFloat(order.total_volume).toFixed(1):'-'}</strong>
              </div>
              <div style="background:#fff8e1;padding:10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#666;font-size:12px;">总件数</span>
                <strong style="color:#f57c00;">${order.actual_pallets||'-'}</strong>
              </div>
              <div style="background:#e8f5e9;padding:10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#666;font-size:12px;">运输距离</span>
                <strong style="color:#2e7d32;">${order.transport_distance?formatNum(order.transport_distance):'-'} mi</strong>
              </div>
            </div>
            
            <!-- 卡车信息 -->
            ${order.truck_company_name?`
            <div style="background:#fce4ec;padding:10px 12px;border-radius:4px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
              <strong style="color:#c2185b;">🚚 卡车:</strong> 
              <span style="color:#333;">${order.truck_company_name}</span>
              ${order.mc_number?`<span style="color:#666;background:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">MC: ${order.mc_number}</span>`:''}
            </div>
            `:''}
            
            <!-- 展开按钮 -->
            <div style="border-top:1px solid #e0e0e0;padding-top:10px;margin-top:6px;">
              <button onclick="var el=document.getElementById('${popupId}');el.style.display=el.style.display==='none'?'block':'none';this.innerHTML=el.style.display==='none'?'▼ 展开更多详情':'▲ 收起详情'" 
                style="width:100%;padding:8px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:12px;color:#555;font-weight:500;">
                ▼ 展开更多详情
              </button>
            </div>
            
            <!-- 隐藏详情区域 -->
            <div id="${popupId}" style="display:none;margin-top:10px;padding:12px;background:#fafafa;border-radius:6px;font-size:12px;">
              <!-- 详细地址 -->
              <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed #ddd;">
                <div style="color:#666;margin-bottom:4px;">📍 发货详细地址:</div>
                <div style="color:#333;margin-left:20px;margin-bottom:8px;word-break:break-word;">${order.origin_address||'-'}</div>
                <div style="color:#666;margin-bottom:4px;">📍 收货详细地址:</div>
                <div style="color:#333;margin-left:20px;word-break:break-word;">${order.destination_address||'-'}</div>
              </div>
              
              <!-- 报价相关 - 改为更紧凑的布局 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="color:#555;">总货值: <strong>${formatMoney(order.cargo_value)}</strong></div>
                <div style="color:#555;">地址类型: <strong>${order.address_type||'-'}</strong></div>
                <div style="color:#555;">面积板数: <strong>${order.total_area_pallets||'-'}</strong></div>
                <div style="color:#555;">车类型: <strong>${order.truck_pallets||'-'}</strong></div>
                <div style="color:#555;">TOTAL DAT: <strong>${formatMoney(order.total_dat)}</strong></div>
                <div style="color:#555;">理想报价: <strong>${formatMoney(order.ideal_quote)}</strong></div>
                <div style="color:#555;">比价Low1: <strong>${formatMoney(order.tql_price_1)}</strong></div>
                <div style="color:#555;">比价Low2: <strong>${formatMoney(order.tql_price_2)}</strong></div>
                <div style="color:#555;">报价参考: <strong style="color:#1976d2;">${formatMoney(order.quote_reference)}</strong></div>
                <div style="color:#555;">利润: <strong style="color:#388e3c;">${formatMoney(order.profit)}</strong></div>
              </div>
              
              <!-- 卡车详情 -->
              ${order.truck_company_name?`
              <div style="background:#fff;padding:10px;border-radius:4px;margin-bottom:10px;border:1px solid #eee;">
                <div style="color:#555;font-weight:bold;margin-bottom:8px;">🚚 卡车详情</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                  <div style="color:#555;">付卡车: <strong>${formatMoney(order.truck_payment)}</strong></div>
                  <div style="color:#555;">MC号: <strong>${order.mc_number||'-'}</strong></div>
                  <div style="color:#555;">公司: <strong>${order.truck_company_name||'-'}</strong></div>
                  <div style="color:#555;">联系: <strong>${order.truck_contact||'-'}</strong></div>
                </div>
              </div>
              `:''}
              
              <!-- 操作员工 -->
              <div style="color:#555;">👤 操作员工: <strong style="color:#333;">${order.confirmer_info?.name||order.assignee_info?.name||order.creator_info?.name||'-'}</strong></div>
            </div>
            
            <!-- Google Maps 按钮 -->
            <button onclick="window.openGoogleMaps('${originAddr.replace(/'/g,"\\'")}','${destAddr.replace(/'/g,"\\'")}')" 
              style="margin-top:12px;width:100%;padding:10px;background:#4285f4;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
              📍 打开 Google Maps 导航
            </button>
          </div>
        `;
      };
      
      // 点击事件
      const showInfo = (position) => {
        setSelectedOrder(order);
        infoWindowRef.current.setContent(buildInfoContent());
        infoWindowRef.current.setPosition(position);
        infoWindowRef.current.open(mapInstanceRef.current);
      };
      
      originMarker.addListener('click', () => showInfo(originLatLng));
      destMarker.addListener('click', () => showInfo(destLatLng));
      [glowLine, mainLine, flowLine].forEach(line => {
        line.addListener('click', (e) => showInfo(e.latLng));
      });
      
      markersRef.current.push(originMarker, destMarker);
      polylinesRef.current.push(glowLine, mainLine, flowLine);
      bounds.extend(originLatLng);
      bounds.extend(destLatLng);
    });
    
    mapInstanceRef.current.fitBounds(bounds);
    const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
      if (mapInstanceRef.current.getZoom() > 10) mapInstanceRef.current.setZoom(10);
      window.google.maps.event.removeListener(listener);
    });
  }, [ordersWithCoords, filter]);

  // 全局函数
  useEffect(() => {
    window.openGoogleMaps = (origin, destination) => {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`, '_blank');
    };
    return () => { delete window.openGoogleMaps; };
  }, []);

  const handleBack = () => navigate('/employee/broker-orders?status=ordered');

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    if (order.originCoords && order.destCoords && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(new window.google.maps.LatLng(
        (order.originCoords.lat + order.destCoords.lat) / 2,
        (order.originCoords.lng + order.destCoords.lng) / 2
      ));
      mapInstanceRef.current.setZoom(7);
    }
  };

  const getFilteredOrders = () => {
    let result = filter === 'all' ? ordersWithCoords : ordersWithCoords.filter(o => o.sub_status === filter);
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter(o => 
        (o.ew_quote_number || '').toLowerCase().includes(keyword) ||
        (o.inquiry_company || '').toLowerCase().includes(keyword) ||
        (o.customer_name || '').toLowerCase().includes(keyword) ||
        (o.shipment_number || '').toLowerCase().includes(keyword) ||
        (o.origin_city || '').toLowerCase().includes(keyword) ||
        (o.destination_city || '').toLowerCase().includes(keyword) ||
        (o.origin_zipcode || '').toLowerCase().includes(keyword) ||
        (o.destination_zipcode || '').toLowerCase().includes(keyword) ||
        (o.truck_company_name || '').toLowerCase().includes(keyword) ||
        (o.mc_number || '').toLowerCase().includes(keyword)
      );
    }
    return result;
  };

  return (
    <div className="map-view-container">
      {/* 地图区域 - 全屏 */}
      <div className="map-wrapper">
        {(loading || geocoding) && (
          <div className="map-loading">
            <div className="loading-bar"></div>
            <span>{loading ? '加载订单...' : '获取坐标...'}</span>
          </div>
        )}
        {!mapLoaded && !loading && (
          <div className="map-loading"><span>加载 Google Maps...</span></div>
        )}
        <div ref={mapRef} className="map-canvas"></div>
      </div>

      {/* 右侧栏 - 整合所有控制 */}
      <div className="map-sidebar">
        {/* 头部 */}
        <div className="sidebar-header">
          <button className="back-btn" onClick={handleBack}>←</button>
          <h2>地图查单</h2>
          <button className="refresh-btn" onClick={loadOrders} disabled={loading || geocoding}>
            {loading || geocoding ? '⏳' : '↻'}
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="sidebar-search">
          <input 
            type="text" 
            placeholder="🔍 搜索 EW#/公司/城市/MC..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button className="clear-search" onClick={() => setSearchKeyword('')}>×</button>
          )}
        </div>
        
        {/* 筛选 */}
        <div className="sidebar-filters">
          <button className={`filter-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>
            {ordersWithCoords.length}
          </button>
          <button className={`filter-btn filter-red ${filter==='waiting_driver'?'active':''}`} onClick={()=>setFilter('waiting_driver')} title="寻找司机">
            <span className="dot"></span>{stats.waiting_driver}
          </button>
          <button className={`filter-btn filter-blue ${filter==='driver_found'?'active':''}`} onClick={()=>setFilter('driver_found')} title="找到司机">
            <span className="dot"></span>{stats.driver_found}
          </button>
          <button className={`filter-btn filter-green ${filter==='in_transit'?'active':''}`} onClick={()=>setFilter('in_transit')} title="运输中">
            <span className="dot"></span>{stats.in_transit}
          </button>
          <button className={`filter-btn filter-yellow ${filter==='sent_to_3pl'?'active':''}`} onClick={()=>setFilter('sent_to_3pl')} title="给3PL">
            <span className="dot"></span>{stats.sent_to_3pl}
          </button>
        </div>
        
        {/* 订单列表 - 极简显示 */}
        <div className="sidebar-list">
          {getFilteredOrders().map(order => (
            <div 
              key={order.id} 
              className={`map-order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
              onClick={() => handleOrderClick(order)}
            >
              <span className="map-status-dot" style={{ background: STATUS_COLORS[order.sub_status] || '#999' }}></span>
              <span className="map-order-ew">{order.ew_quote_number || order.order_number || `#${order.id}`}</span>
              <span className="map-order-route">{order.origin_city || order.origin_zipcode}→{order.destination_city || order.destination_zipcode}</span>
              {(order.inquiry_company || order.customer_name) && (
                <span className="map-order-company" title={order.inquiry_company || order.customer_name}>
                  {(order.inquiry_company || order.customer_name).substring(0, 8)}
                </span>
              )}
            </div>
          ))}
          {getFilteredOrders().length === 0 && !loading && !geocoding && (
            <div className="map-no-orders">{searchKeyword ? '无匹配结果' : '暂无订单'}</div>
          )}
        </div>
        
        {/* 图例 */}
        <div className="sidebar-legend">
          <span><span className="dot red"></span>寻司机</span>
          <span><span className="dot blue"></span>已找到</span>
          <span><span className="dot green"></span>运输中</span>
          <span><span className="dot yellow"></span>3PL</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
