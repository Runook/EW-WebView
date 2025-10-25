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
      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableCell, TableRow, WidthType } = docx;
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.default || fileSaver.saveAs;

      for (const order of orderDetails) {
        console.log('📄 生成BOL for order:', order);
        console.log('👤 当前用户信息:', user);

        // 格式化日期为 月-日-年
        const formatDate = (dateStr) => {
          if (!dateStr) return new Date().toLocaleDateString('en-US');
          const date = new Date(dateStr);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        };

        // 准备数据
        const data = {
          Date: formatDate(order.quote_date),
          BillOfLadingNumber: order.ew_quote_number || order.order_number || '',
          ShipFrom: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}` || '',
          ShipTo: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}` || '',
          SpecialInstructions: order.cargo_type || '',
          Contact: `${user?.given_name || user?.firstName || user?.first_name || ''} ${user?.family_name || user?.lastName || user?.last_name || ''}`.trim(),
          ContactPhone: user?.phone_number || user?.phone || '',
          CustomerOrderNo: order.shipment_number || '',
          NumOfPackages: String(order.actual_pallets || order.total_pallets || ''),
          Weight: order.total_weight_lbs ? `${order.total_weight_lbs}` : '',
        };

        console.log('📋 BOL数据:', data);

        // 创建符合BOL模板格式的Word文档
        const doc = new Document({
          sections: [{
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              // 标题
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                children: [
                  new TextRun({
                    text: 'BILL OF LADING',
                    bold: true,
                    size: 28,
                  }),
                ],
              }),

              // Date
              new Paragraph({
                children: [
                  new TextRun({ text: 'Date: ', bold: true }),
                  new TextRun({ text: data.Date }),
                ],
                spacing: { after: 100 },
              }),

              // Bill of Lading Number
              new Paragraph({
                children: [
                  new TextRun({ text: 'Bill of Lading Number: ', bold: true }),
                  new TextRun({ text: data.BillOfLadingNumber }),
                ],
                spacing: { after: 300 },
              }),

              // SHIP FROM
              new Paragraph({
                children: [
                  new TextRun({ text: 'SHIP FROM:', bold: true, underline: {} }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: data.ShipFrom,
                spacing: { after: 300 },
              }),

              // SHIP TO
              new Paragraph({
                children: [
                  new TextRun({ text: 'SHIP TO:', bold: true, underline: {} }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: data.ShipTo,
                spacing: { after: 300 },
              }),

              // Customer Order No.
              new Paragraph({
                children: [
                  new TextRun({ text: 'Customer Order No.: ', bold: true }),
                  new TextRun({ text: data.CustomerOrderNo }),
                ],
                spacing: { after: 200 },
              }),

              // # of Packages
              new Paragraph({
                children: [
                  new TextRun({ text: '# of Packages: ', bold: true }),
                  new TextRun({ text: data.NumOfPackages }),
                ],
                spacing: { after: 100 },
              }),

              // Weight
              new Paragraph({
                children: [
                  new TextRun({ text: 'Weight: ', bold: true }),
                  new TextRun({ text: `${data.Weight} lbs` }),
                ],
                spacing: { after: 300 },
              }),

              // Special Instructions
              new Paragraph({
                children: [
                  new TextRun({ text: 'Special Instructions:', bold: true, underline: {} }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: data.SpecialInstructions,
                spacing: { after: 300 },
              }),

              // Contact
              new Paragraph({
                children: [
                  new TextRun({ text: 'Contact: ', bold: true }),
                  new TextRun({ text: data.Contact }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Phone: ', bold: true }),
                  new TextRun({ text: data.ContactPhone }),
                ],
                spacing: { after: 300 },
              }),
            ],
          }],
        });

        // 生成并保存
        const blob = await Packer.toBlob(doc);
        const fileName = `BOL-${order.ew_quote_number || order.order_number || 'document'}.docx`;
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
        console.log('👤 用户详细字段:', {
          given_name: user?.given_name,
          firstName: user?.firstName,
          family_name: user?.family_name,
          lastName: user?.lastName,
          phone_number: user?.phone_number,
          phone: user?.phone,
          email: user?.email
        });

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

        // 格式化日期为 月-日-年
        const formatDate = (dateStr) => {
          if (!dateStr) return new Date().toLocaleDateString('en-US');
          const date = new Date(dateStr);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        };

        // 准备数据
        const dispatcherName = `${user?.given_name || user?.firstName || user?.first_name || ''} ${user?.family_name || user?.lastName || user?.last_name || ''}`.trim();
        const dispatcherPhone = user?.phone_number || user?.phone || '';
        
        const data = {
          Date: formatDate(order.quote_date),
          EW: order.ew_quote_number || order.order_number || '',
          Dispatcher: dispatcherName || user?.email || 'N/A',
          Tel: dispatcherPhone || 'N/A',
          CarrierName: order.truck_company_name || '',
          CarrierTel: order.truck_contact || '',
          PickUp: order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''}` || '',
          DropOff: order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''}` || '',
        };

        console.log('📋 RC数据:', data);
        console.log('📋 Dispatcher构建:', { dispatcherName, dispatcherPhone, finalDispatcher: data.Dispatcher });

        console.log('🔍 模板工作表信息:', {
          name: worksheet.name,
          rowCount: worksheet.rowCount,
          columnCount: worksheet.columnCount
        });

        // 填充数据到指定单元格
        // Row 1: Date在H1，EW在I1
        const h1 = worksheet.getCell('H1');
        const currentH1 = h1.value;
        console.log('📝 H1原值:', currentH1);
        h1.value = data.Date;
        
        const i1 = worksheet.getCell('I1');
        const currentI1 = i1.value;
        console.log('📝 I1原值:', currentI1);
        i1.value = data.EW;
        
        // Row 2: Dispatcher（填充F2-I2合并单元格区域的起始单元格）
        const f2 = worksheet.getCell('F2');
        console.log('📝 F2原值:', f2.value);
        // 保留原有的"Dispatcher : "文本，在后面追加名字
        const f2Current = String(f2.value || '');
        if (f2Current.includes('Dispatcher')) {
          f2.value = f2Current.replace(/Dispatcher\s*:\s*$/, `Dispatcher : ${data.Dispatcher}`);
        } else {
          f2.value = `Dispatcher : ${data.Dispatcher}`;
        }
        
        // Row 3: Tel (需要保留原有的richText内容)
        const f3 = worksheet.getCell('F3');
        console.log('📝 F3原值:', f3.value);
        const f3Current = f3.value;
        if (f3Current && typeof f3Current === 'object' && f3Current.richText) {
          // 创建新的richText，在Tel:后面添加电话号码
          const newRichText = f3Current.richText.map(item => {
            if (item.text && item.text.includes('Tel:')) {
              return { ...item, text: `Tel: ${data.Tel}\n${item.text.replace(/Tel:\s*/g, '')}` };
            }
            return item;
          });
          f3.value = { richText: newRichText };
        } else {
          const originalText = String(f3Current || '').replace(/Tel:\s*/g, '');
          f3.value = `Tel: ${data.Tel}\n${originalText}`;
        }
        
        // Row 4: Carrier Name和TEL
        const a4 = worksheet.getCell('A4');
        console.log('📝 A4原值:', a4.value);
        a4.value = `Carrier Name: ${data.CarrierName}           TEL: ${data.CarrierTel}`;
        
        // Row 6: Pick up（不添加额外换行）
        const a6 = worksheet.getCell('A6');
        console.log('📝 A6原值:', a6.value);
        a6.value = `Pick up: ${data.PickUp}`;
        
        // Row 7: Drop off（不添加额外换行）
        const a7 = worksheet.getCell('A7');
        console.log('📝 A7原值:', a7.value);
        a7.value = `Drop off: ${data.DropOff}`;

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
