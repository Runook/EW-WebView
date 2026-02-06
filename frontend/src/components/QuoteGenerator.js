// Version: 2.0 - 浮动生成按钮 + 搜索功能
import React, { useState, useEffect, useMemo } from 'react';
import { orderApi } from '../config/employeeApi';
import './DocumentGenerator.css';

const QuoteGenerator = ({ isOpen, onClose, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrders([]);
      setError(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  // 过滤订单
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    
    const term = searchTerm.toLowerCase();
    return orders.filter(order => {
      const ewNumber = (order.ew_quote_number || order.order_number || '').toLowerCase();
      const company = (order.inquiry_company || order.customer_name || '').toLowerCase();
      const originCity = (order.origin_city || '').toLowerCase();
      const destCity = (order.destination_city || '').toLowerCase();
      const shipmentNumber = (order.shipment_number || '').toLowerCase();
      
      return ewNumber.includes(term) || 
             company.includes(term) || 
             originCity.includes(term) || 
             destCity.includes(term) ||
             shipmentNumber.includes(term);
    });
  }, [orders, searchTerm]);

  const handleToggleOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    const visibleIds = filteredOrders.map(o => o.id);
    const allVisibleSelected = visibleIds.every(id => selectedOrders.includes(id));
    
    if (allVisibleSelected) {
      setSelectedOrders(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedOrders(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleGenerate = async () => {
    if (selectedOrders.length === 0) {
      setError('请至少选择一个订单');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const orderDetails = await Promise.all(
        selectedOrders.map(async id => {
          const response = await orderApi.getOrderById(id);
          return response.data || response;
        })
      );

      console.log('📦 生成报价PDF - 订单数据:', orderDetails);
      await generateQuotePDFs(orderDetails);
      onClose();
    } catch (err) {
      console.error('生成报价失败:', err);
      setError(err.message || '生成报价失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuotePDFs = async (orderDetails) => {
    try {
      const { jsPDF } = await import('jspdf');
      
      for (const order of orderDetails) {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('WE LOGISTICS - QUOTATION', 105, yPos, { align: 'center' });
        yPos += 15;

        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('WE Quote Number:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.ew_quote_number || order.order_number || 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Shipment Number:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.shipment_number || 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Cargo Notes:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.cargo_type || 'N/A', 80, yPos);
        yPos += 15;

        doc.setFont(undefined, 'bold');
        doc.text('SHIP FROM:', 20, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}`, 20, yPos);
        yPos += 12;

        doc.setFont(undefined, 'bold');
        doc.text('SHIP TO:', 20, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}`, 20, yPos);
        yPos += 15;

        doc.setFont(undefined, 'bold');
        doc.text('Total Weight (lbs):', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.total_weight_lbs ? `${order.total_weight_lbs} lbs` : 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Total Volume (ft3):', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.total_volume ? `${order.total_volume} ft3` : 'N/A', 80, yPos);
        yPos += 15;

        // 货物明细
        if (order.dimensions_list) {
          doc.setFont(undefined, 'bold');
          doc.text('Cargo Details:', 20, yPos);
          yPos += 7;
          doc.setFont(undefined, 'normal');
          
          try {
            const dimensions = typeof order.dimensions_list === 'string' ? 
              JSON.parse(order.dimensions_list) : order.dimensions_list;
            const weights = order.weight_list ? 
              (typeof order.weight_list === 'string' ? JSON.parse(order.weight_list) : order.weight_list) : [];
            
            dimensions.forEach((dim, index) => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              const weight = weights[index] || 0;
              const freightClass = dim.freightClass || dim.class || '';
              doc.text(`${index + 1}. ${dim.pieces || 1}P x ${weight}lbs, ${dim.length}x${dim.width}x${dim.height}in${freightClass ? `, Class ${freightClass}` : ''}`, 25, yPos);
              yPos += 7;
            });
          } catch (e) {
            doc.text('Unable to parse cargo details', 25, yPos);
            yPos += 7;
          }
          yPos += 8;
        }

        doc.setFont(undefined, 'bold');
        doc.text('Total Cargo Value:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.cargo_value ? `$${parseFloat(order.cargo_value).toLocaleString()}` : 'N/A', 80, yPos);
        yPos += 15;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('WE Quote Price:', 20, yPos);
        doc.setFontSize(16);
        doc.setTextColor(46, 125, 50);
        doc.text(order.ew_quote_price ? `$${parseFloat(order.ew_quote_price).toLocaleString()}` : 'N/A', 80, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 20;

        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text('Thank you for choosing WE Logistics!', 105, 280, { align: 'center' });

        // 文件名：发货单号_WE单号.pdf
        const shipmentNum = order.shipment_number || '';
        const weNum = order.ew_quote_number || order.order_number || '';
        const fileName = shipmentNum && weNum 
          ? `${shipmentNum}_${weNum}.pdf`
          : `Quote-${weNum || 'document'}.pdf`;
        doc.save(fileName);
      }
    } catch (error) {
      console.error('❌ 生成报价PDF失败:', error);
      throw new Error(`生成报价PDF失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const visibleSelectedCount = filteredOrders.filter(o => selectedOrders.includes(o.id)).length;
  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content doc-generator-modal">
        <div className="modal-header">
          <h2>生成报价单</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 搜索框 */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 搜索单号、公司名、城市..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          <div className="select-all-container">
            <label>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={handleSelectAll}
              />
              <span>全选当前列表 ({visibleSelectedCount}/{filteredOrders.length})</span>
            </label>
            {selectedOrders.length > 0 && (
              <span className="total-selected">已选: {selectedOrders.length}</span>
            )}
          </div>

          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id} className={`order-item ${selectedOrders.includes(order.id) ? 'selected' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleToggleOrder(order.id)}
                  />
                  <div className="order-info">
                    <span className="order-number">{order.ew_quote_number || order.order_number}</span>
                    <span className="order-company">{order.inquiry_company || order.customer_name}</span>
                    <span className="order-route">
                      {order.origin_city} → {order.destination_city}
                    </span>
                  </div>
                </label>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="no-results">没有找到匹配的订单</div>
            )}
          </div>
        </div>

        {/* 浮动生成按钮 */}
        <div className="floating-generate-btn">
          <button
            className="btn-primary btn-generate-float"
            onClick={handleGenerate}
            disabled={selectedOrders.length === 0 || isGenerating}
          >
            {isGenerating ? '⏳ 生成中...' : `🚀 生成报价单 (${selectedOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;
