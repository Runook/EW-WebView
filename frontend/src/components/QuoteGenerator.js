import React, { useState, useEffect } from 'react';
import { orderApi } from '../config/employeeApi';
import './DocumentGenerator.css'; // 复用样式

const QuoteGenerator = ({ isOpen, onClose, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrders([]);
      setError(null);
    }
  }, [isOpen]);

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
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
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
      // 获取订单详情
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
        console.log('📄 生成报价 PDF for:', order);

        const doc = new jsPDF();
        let yPos = 20;

        // 标题（使用英文避免乱码）
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('EW LOGISTICS - QUOTATION', 105, yPos, { align: 'center' });
        yPos += 15;

        // 分割线
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        // 订单信息
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('EW Quote Number:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.ew_quote_number || order.order_number || 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Shipment Number:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.shipment_number || 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Cargo Type:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.cargo_type || 'N/A', 80, yPos);
        yPos += 15;

        // 地址信息
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

        // 货物详情
        doc.setFont(undefined, 'bold');
        doc.text('Total Weight (lbs):', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.total_weight_lbs ? `${order.total_weight_lbs} lbs` : 'N/A', 80, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Total Volume (ft³):', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.total_volume ? `${order.total_volume} ft³` : 'N/A', 80, yPos);
        yPos += 15;

        // 尺寸列表
        if (order.dimensions_list) {
          doc.setFont(undefined, 'bold');
          doc.text('Dimensions List:', 20, yPos);
          yPos += 7;
          doc.setFont(undefined, 'normal');
          
          try {
            const dimensions = typeof order.dimensions_list === 'string' ? 
              JSON.parse(order.dimensions_list) : order.dimensions_list;
            
            dimensions.forEach((dim, index) => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`${index + 1}. ${dim.length}×${dim.width}×${dim.height}${dim.pieces > 1 ? ` (${dim.pieces}p)` : ''}`, 25, yPos);
              yPos += 7;
            });
          } catch (e) {
            doc.text('Unable to parse dimensions', 25, yPos);
            yPos += 7;
          }
          yPos += 8;
        }

        // 总货值
        doc.setFont(undefined, 'bold');
        doc.text('Total Cargo Value:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(order.cargo_value ? `$${parseFloat(order.cargo_value).toLocaleString()}` : 'N/A', 80, yPos);
        yPos += 15;

        // EW报价
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('EW Quote Price:', 20, yPos);
        doc.setFontSize(16);
        doc.setTextColor(46, 125, 50);
        doc.text(order.ew_quote_price ? `$${parseFloat(order.ew_quote_price).toLocaleString()}` : 'N/A', 80, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 20;

        // 页脚
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text('Thank you for choosing EW Logistics!', 105, 280, { align: 'center' });

        // 保存PDF
        const fileName = `Quote-${order.ew_quote_number || order.order_number || 'document'}.pdf`;
        doc.save(fileName);
      }
    } catch (error) {
      console.error('❌ 生成报价PDF失败:', error);
      throw new Error(`生成报价PDF失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
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

          <div className="select-all-container">
            <label>
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length}
                onChange={handleSelectAll}
              />
              <span>全选 ({selectedOrders.length}/{orders.length})</span>
            </label>
          </div>

          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-item">
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
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isGenerating}>
            取消
          </button>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={selectedOrders.length === 0 || isGenerating}
          >
            {isGenerating ? '生成中...' : `生成 (${selectedOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;

