// Version: 2.0 - Updated to use real templates and fill data correctly
import React, { useState, useEffect } from 'react';
import { orderApi } from '../config/employeeApi';
import { useAuth } from '../contexts/AuthContext';
import './DocumentGenerator.css';

const DocumentGenerator = ({ isOpen, onClose, documentType, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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
      // 获取选中订单的详细信息
      const orderDetails = await Promise.all(
        selectedOrders.map(async id => {
          const response = await orderApi.getOrderById(id);
          // response 是 { success: true, data: {...} } 格式
          // 我们需要提取 data 字段
          return response.data || response;
        })
      );

      console.log('📦 获取到的订单数据:', orderDetails);
      console.log('👤 当前用户:', user);
      
      // 验证数据
      if (orderDetails.length === 0) {
        throw new Error('没有获取到订单数据');
      }
      
      console.log('✅ 成功获取', orderDetails.length, '个订单的详细信息');

      // 根据文档类型生成
      if (documentType === 'BOL') {
        await generateBOLDocuments(orderDetails);
      } else if (documentType === 'RC') {
        await generateRCDocuments(orderDetails);
      }

      // 成功后关闭对话框
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

        // 格式化日期为 月-日-年
        const formatDate = (dateStr) => {
          if (!dateStr) return new Date().toLocaleDateString('en-US');
          const date = new Date(dateStr);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        };

        // 准备数据 - 根据用户提供的配对规则
        // 调试：打印订单中所有相关字段
        console.log('🔍 订单原始数据 - BOL相关字段:', {
          quote_date: order.quote_date,
          origin_address: order.origin_address,
          origin_city: order.origin_city,
          origin_state: order.origin_state,
          destination_address: order.destination_address,
          destination_city: order.destination_city,
          destination_state: order.destination_state,
          ew_quote_number: order.ew_quote_number,
          order_number: order.order_number,
          shipment_number: order.shipment_number,
          actual_pallets: order.actual_pallets,
          total_pallets: order.total_pallets,
          total_weight_lbs: order.total_weight_lbs
        });

        const data = {
          quoteDate: formatDate(order.quote_date),                                    // A1 - 报价日期
          shipFrom: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}`.trim() || '',  // A3 - 发货地
          shipTo: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}`.trim() || '',  // A5 - 收货地
          ewNumber: order.ew_quote_number || order.order_number || '',               // F3 - EW单号
          shipmentNumber: order.shipment_number || '',                               // A13 - 发货单号
          totalPieces: String(order.actual_pallets || order.total_pallets || ''),    // D13 - 总件数
          totalWeight: order.total_weight_lbs ? String(order.total_weight_lbs) : '', // E13 - 总重(lbs)
        };

        console.log('📋 BOL填充数据:', data);

        console.log('🔍 模板工作表信息:', {
          name: worksheet.name,
          rowCount: worksheet.rowCount,
          columnCount: worksheet.columnCount
        });

        // 辅助函数：安全地设置单元格值（处理richText等复杂格式）
        const setCellValue = (cell, newValue) => {
          const oldValue = cell.value;
          const oldType = typeof oldValue;
          const isRichText = oldValue && typeof oldValue === 'object' && oldValue.richText;
          
          console.log('📝 设置单元格', cell.address, {
            原值类型: oldType,
            是否richText: isRichText,
            原值: oldValue,
            新值: newValue,
            新值是否为空: !newValue || newValue === ''
          });
          
          // 直接覆盖，不管原值是什么类型
          cell.value = newValue;
          
          // 验证设置是否成功
          console.log('✓ 设置后验证:', cell.address, '=', cell.value);
        };

        // 填充数据到指定单元格 - 根据用户提供的配对规则
        // A1 - 报价日期
        setCellValue(worksheet.getCell('A1'), data.quoteDate);

        // A3 - 发货地
        setCellValue(worksheet.getCell('A3'), data.shipFrom);

        // A5 - 收货地
        setCellValue(worksheet.getCell('A5'), data.shipTo);

        // F3 - EW单号
        setCellValue(worksheet.getCell('F3'), data.ewNumber);

        // A13 - 发货单号
        setCellValue(worksheet.getCell('A13'), data.shipmentNumber);

        // D13 - 总件数
        setCellValue(worksheet.getCell('D13'), data.totalPieces);

        // E13 - 总重(lbs)
        setCellValue(worksheet.getCell('E13'), data.totalWeight);

        console.log('✅ BOL数据填充完成');

        // 生成文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const fileName = `BOL-${order.ew_quote_number || order.order_number || 'document'}.xlsx`;
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
        console.log('📊 生成RC for order:', order);
        console.log('👤 当前用户信息:', user);

        // 加载模板文件
        const templatePath = '/RC-template.xlsx';
        const response = await fetch(templatePath);
        if (!response.ok) {
          throw new Error(`无法加载RC模板: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.getWorksheet(1);

        // 调试：打印订单中所有相关字段
        console.log('🔍 订单原始数据 - RC相关字段:', {
          origin_address: order.origin_address,
          origin_city: order.origin_city,
          origin_state: order.origin_state,
          destination_address: order.destination_address,
          destination_city: order.destination_city,
          destination_state: order.destination_state,
          shipment_number: order.shipment_number,
          truck_payment: order.truck_payment,
          mc_number: order.mc_number,
          truck_company_name: order.truck_company_name,
          truck_contact: order.truck_contact,
          backup_driver_1_name: order.backup_driver_1_name,
          backup_driver_1_phone: order.backup_driver_1_phone
        });

        // 调试：打印用户信息结构
        console.log('👤 用户完整信息:', user);
        console.log('👤 用户attributes:', user?.attributes);

        // 准备数据 - 根据新的配对规则
        // 用户信息在 user.attributes 中
        const attrs = user?.attributes || user || {};
        const operatorName = `${attrs.given_name || attrs.firstName || user?.given_name || ''} ${attrs.family_name || attrs.lastName || user?.family_name || ''}`.trim();
        const operatorPhone = attrs.phone_number || attrs.phone || user?.phone_number || '';
        const operatorEmail = attrs.email || user?.email || '';
        
        console.log('👤 提取的用户信息:', { operatorName, operatorPhone, operatorEmail });
        
        const data = {
          // A24 - 发货地
          shipFrom: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}`.trim() || '',
          // A26 - 收货地
          shipTo: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}`.trim() || '',
          // S1 - 发货单号
          shipmentNumber: order.shipment_number || '',
          // A8 - 操作员工
          operatorName: operatorName || 'N/A',
          // G8 - 注册账号电话
          operatorPhone: operatorPhone || '',
          // M8 - 注册账号邮箱
          operatorEmail: operatorEmail || '',
          // S19 - 付卡车价格
          truckPayment: order.truck_payment ? String(order.truck_payment) : '',
          // A11 - MC number
          mcNumber: order.mc_number || '',
          // C11 - 卡车公司
          truckCompany: order.truck_company_name || '',
          // I11 - 联络方式
          truckContact: order.truck_contact || '',
          // H15 - 备用司机1姓名
          backupDriver1Name: order.backup_driver_1_name || '',
          // K15 - 备用司机1电话
          backupDriver1Phone: order.backup_driver_1_phone || '',
        };

        console.log('📋 RC填充数据:', data);

        console.log('🔍 模板工作表信息:', {
          name: worksheet.name,
          rowCount: worksheet.rowCount,
          columnCount: worksheet.columnCount
        });

        // 辅助函数：安全地设置单元格值
        const setCellValue = (cell, newValue) => {
          const oldValue = cell.value;
          const oldType = typeof oldValue;
          const isRichText = oldValue && typeof oldValue === 'object' && oldValue.richText;
          
          console.log('📝 设置单元格', cell.address, {
            原值类型: oldType,
            是否richText: isRichText,
            原值: oldValue,
            新值: newValue,
            新值是否为空: !newValue || newValue === ''
          });
          
          // 直接覆盖，不管原值是什么类型
          cell.value = newValue;
          
          // 验证设置是否成功
          console.log('✓ 设置后验证:', cell.address, '=', cell.value);
        };

        // 填充数据到指定单元格 - 根据新的配对规则
        // S1 - 发货单号
        setCellValue(worksheet.getCell('S1'), data.shipmentNumber);

        // A8 - 操作员工
        setCellValue(worksheet.getCell('A8'), data.operatorName);

        // G8 - 注册账号电话
        setCellValue(worksheet.getCell('G8'), data.operatorPhone);

        // M8 - 注册账号邮箱
        setCellValue(worksheet.getCell('M8'), data.operatorEmail);

        // A11 - MC number
        setCellValue(worksheet.getCell('A11'), data.mcNumber);

        // C11 - 卡车公司
        setCellValue(worksheet.getCell('C11'), data.truckCompany);

        // I11 - 联络方式
        setCellValue(worksheet.getCell('I11'), data.truckContact);

        // H15 - 备用司机1姓名
        setCellValue(worksheet.getCell('H15'), data.backupDriver1Name);

        // K15 - 备用司机1电话
        setCellValue(worksheet.getCell('K15'), data.backupDriver1Phone);

        // S19 - 付卡车价格
        setCellValue(worksheet.getCell('S19'), data.truckPayment);

        // A24 - 发货地
        setCellValue(worksheet.getCell('A24'), data.shipFrom);

        // A26 - 收货地
        setCellValue(worksheet.getCell('A26'), data.shipTo);

        console.log('✅ RC数据填充完成');

        // 生成文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const fileName = `RC-${order.ew_quote_number || order.order_number || 'document'}.xlsx`;
        saveAs(blob, fileName);
      }
    } catch (error) {
      console.error('❌ RC生成失败:', error);
      throw new Error(`RC生成失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
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

export default DocumentGenerator;
