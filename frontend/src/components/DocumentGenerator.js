// Version: 3.0 - 浮动生成按钮 + 搜索功能
import React, { useState, useEffect, useMemo } from 'react';
import { orderApi } from '../config/employeeApi';
import { useAuth } from '../contexts/AuthContext';
import './DocumentGenerator.css';

const DocumentGenerator = ({ isOpen, onClose, documentType, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

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
    // 只选择/取消当前过滤后可见的订单
    const visibleIds = filteredOrders.map(o => o.id);
    const allVisibleSelected = visibleIds.every(id => selectedOrders.includes(id));
    
    if (allVisibleSelected) {
      // 取消所有可见订单的选择
      setSelectedOrders(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // 选择所有可见订单（保留已选择的不可见订单）
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
      // 获取选中订单的详细信息
      const orderDetails = await Promise.all(
        selectedOrders.map(async id => {
          const response = await orderApi.getOrderById(id);
          return response.data || response;
        })
      );

      console.log('📦 获取到的订单数据:', orderDetails);
      
      if (orderDetails.length === 0) {
        throw new Error('没有获取到订单数据');
      }

      // 根据文档类型生成
      if (documentType === 'BOL') {
        await generateBOLDocuments(orderDetails);
      } else if (documentType === 'RC') {
        await generateRCDocuments(orderDetails);
      }

      onClose();
    } catch (err) {
      console.error('生成文档失败:', err);
      setError(err.message || '生成文档失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBOLDocuments = async (orderDetails) => {
    try {
      const ExcelJS = await import('exceljs');
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.default || fileSaver.saveAs;

      for (const order of orderDetails) {
        console.log('📄 生成BOL for order:', order);

        // 加载模板文件
        const templatePath = '/BOL-template.xlsx';
        const response = await fetch(templatePath);
        if (!response.ok) {
          throw new Error(`无法加载BOL模板: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.getWorksheet(1);

        // 格式化日期
        const formatDate = (dateStr) => {
          if (!dateStr) return new Date().toLocaleDateString('en-US');
          const date = new Date(dateStr);
          return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
        };

        // 准备数据
        const data = {
          quoteDate: formatDate(order.quote_date),
          shipFrom: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}`.trim() || '',
          shipTo: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}`.trim() || '',
          ewNumber: order.ew_quote_number || order.order_number || '',
          shipmentNumber: order.shipment_number || '',
          totalPieces: String(order.actual_pallets || order.total_pallets || ''),
          totalWeight: order.total_weight_lbs ? String(order.total_weight_lbs) : '',
        };

        const setCellValue = (cell, newValue) => {
          cell.value = newValue;
        };

        // 填充基本数据
        setCellValue(worksheet.getCell('A1'), data.quoteDate);
        setCellValue(worksheet.getCell('A3'), data.shipFrom);
        setCellValue(worksheet.getCell('A5'), data.shipTo);
        setCellValue(worksheet.getCell('F3'), data.ewNumber);
        setCellValue(worksheet.getCell('A13'), data.shipmentNumber);
        setCellValue(worksheet.getCell('D13'), data.totalPieces);
        setCellValue(worksheet.getCell('E13'), data.totalWeight);

        // ====== 货物明细填充 ======
        let cargoItems = [];
        try {
          const weightList = order.weight_list ? JSON.parse(order.weight_list) : [];
          const dimensionsList = order.dimensions_list ? JSON.parse(order.dimensions_list) : [];
          
          const maxLen = Math.max(weightList.length, dimensionsList.length);
          for (let i = 0; i < maxLen; i++) {
            const dim = dimensionsList[i] || {};
            const weight = weightList[i] || 0;
            
            // 提取 freightClass (支持多种字段名)
            let freightClass = dim.freightClass || dim.class || dim.freight_class || '';
            
            // 如果没有 Class，自动计算
            if (!freightClass && weight && dim.length && dim.width && dim.height) {
              const cubicFeet = (dim.length * dim.width * dim.height) / 1728;
              const density = weight / cubicFeet;
              
              // NMFC 分类
              if (density >= 50) freightClass = '50';
              else if (density >= 35) freightClass = '55';
              else if (density >= 30) freightClass = '60';
              else if (density >= 22.5) freightClass = '65';
              else if (density >= 15) freightClass = '70';
              else if (density >= 13.5) freightClass = '77.5';
              else if (density >= 12) freightClass = '85';
              else if (density >= 10.5) freightClass = '92.5';
              else if (density >= 9) freightClass = '100';
              else if (density >= 8) freightClass = '110';
              else if (density >= 7) freightClass = '125';
              else if (density >= 6) freightClass = '150';
              else if (density >= 5) freightClass = '175';
              else if (density >= 4) freightClass = '200';
              else if (density >= 3) freightClass = '250';
              else if (density >= 2) freightClass = '300';
              else if (density >= 1) freightClass = '400';
              else freightClass = '500';
            }
            
            cargoItems.push({
              freightClass,
              pallets: dim.pieces || 1,
              weight: weight,
              dimensions: dim.length && dim.width && dim.height 
                ? `${dim.length}×${dim.width}×${dim.height}` 
                : ''
            });
          }
        } catch (e) {
          console.warn('⚠️ 解析货物明细失败:', e);
        }

        console.log('📦 货物明细:', cargoItems);

        // 填充货物明细到模板 (从第17行开始)
        const startRow = 17;
        const defaultRows = 3;
        
        let totalPallets = 0;
        let totalWeight = 0;
        
        cargoItems.forEach((item, index) => {
          const rowNum = startRow + index;
          
          if (index >= defaultRows) {
            worksheet.insertRow(rowNum, []);
          }
          
          // A列: 板数
          setCellValue(worksheet.getCell(`A${rowNum}`), String(item.pallets || 1));
          // B列: 默认1
          setCellValue(worksheet.getCell(`B${rowNum}`), '1');
          // C列: 重量 (lbs)
          setCellValue(worksheet.getCell(`C${rowNum}`), String(item.weight || ''));
          // D列: 尺寸
          setCellValue(worksheet.getCell(`D${rowNum}`), item.dimensions || '');
          // F列: Class (货物等级)
          setCellValue(worksheet.getCell(`F${rowNum}`), String(item.freightClass || ''));
          
          totalPallets += parseInt(item.pallets) || 1;
          totalWeight += parseFloat(item.weight) || 0;
          
          console.log(`📝 Row ${rowNum}: 板数=${item.pallets}, 重量=${item.weight}, 尺寸=${item.dimensions}, Class=${item.freightClass}`);
        });
        
        // 总计行
        const totalRow = startRow + cargoItems.length;
        if (cargoItems.length >= defaultRows) {
          worksheet.insertRow(totalRow, []);
        }
        setCellValue(worksheet.getCell(`A${totalRow}`), `Total:${totalPallets}P`);
        setCellValue(worksheet.getCell(`B${totalRow}`), `Total: ${totalPallets}`);
        setCellValue(worksheet.getCell(`C${totalRow}`), `Total ${Math.round(totalWeight)} lbs`);

        // 生成文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        // 文件名：发货单号_WE单号.xlsx
        const shipmentNum = order.shipment_number || '';
        const weNum = order.ew_quote_number || order.order_number || '';
        const fileName = shipmentNum && weNum 
          ? `BOL_${shipmentNum}_${weNum}.xlsx`
          : `BOL-${weNum || 'document'}.xlsx`;
        saveAs(blob, fileName);
      }
    } catch (error) {
      console.error('❌ BOL生成失败:', error);
      throw new Error(`BOL生成失败: ${error.message}`);
    }
  };

  const generateRCDocuments = async (orderDetails) => {
    try {
      const ExcelJS = await import('exceljs');
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.default || fileSaver.saveAs;

      for (const order of orderDetails) {
        const templatePath = '/RC-template.xlsx';
        const response = await fetch(templatePath);
        if (!response.ok) {
          throw new Error(`无法加载RC模板: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.getWorksheet(1);

        const attrs = user?.attributes || user || {};
        const operatorName = `${attrs.given_name || attrs.firstName || user?.given_name || ''} ${attrs.family_name || attrs.lastName || user?.family_name || ''}`.trim();
        const operatorPhone = attrs.phone_number || attrs.phone || user?.phone_number || '';
        const operatorEmail = attrs.email || user?.email || '';
        
        const data = {
          shipFrom: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}`.trim() || '',
          shipTo: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}`.trim() || '',
          shipmentNumber: order.shipment_number || '',
          operatorName: operatorName || 'N/A',
          operatorPhone: operatorPhone || '',
          operatorEmail: operatorEmail || '',
          truckPayment: order.truck_payment ? String(order.truck_payment) : '',
          mcNumber: order.mc_number || '',
          truckCompany: order.truck_company_name || '',
          truckContact: order.truck_contact || '',
          backupDriver1Name: order.backup_driver_1_name || '',
          backupDriver1Phone: order.backup_driver_1_phone || '',
        };

        const setCellValue = (cell, newValue) => {
          cell.value = newValue;
        };

        setCellValue(worksheet.getCell('S1'), data.shipmentNumber);
        setCellValue(worksheet.getCell('A8'), data.operatorName);
        setCellValue(worksheet.getCell('G8'), data.operatorPhone);
        setCellValue(worksheet.getCell('M8'), data.operatorEmail);
        setCellValue(worksheet.getCell('A11'), data.mcNumber);
        setCellValue(worksheet.getCell('C11'), data.truckCompany);
        setCellValue(worksheet.getCell('I11'), data.truckContact);
        setCellValue(worksheet.getCell('H15'), data.backupDriver1Name);
        setCellValue(worksheet.getCell('K15'), data.backupDriver1Phone);
        setCellValue(worksheet.getCell('S19'), data.truckPayment);
        setCellValue(worksheet.getCell('A24'), data.shipFrom);
        setCellValue(worksheet.getCell('A26'), data.shipTo);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        // 文件名：发货单号_WE单号.xlsx
        const shipmentNum = order.shipment_number || '';
        const weNum = order.ew_quote_number || order.order_number || '';
        const fileName = shipmentNum && weNum 
          ? `RC_${shipmentNum}_${weNum}.xlsx`
          : `RC-${weNum || 'document'}.xlsx`;
        saveAs(blob, fileName);
      }
    } catch (error) {
      console.error('❌ RC生成失败:', error);
      throw new Error(`RC生成失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const visibleSelectedCount = filteredOrders.filter(o => selectedOrders.includes(o.id)).length;
  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content doc-generator-modal">
        <div className="modal-header">
          <h2>生成{documentType === 'BOL' ? 'Bill of Lading' : 'Rate Confirmation'}</h2>
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
            {isGenerating ? '⏳ 生成中...' : `🚀 生成 ${documentType} (${selectedOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
