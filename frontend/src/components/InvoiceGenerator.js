// Version: 5.0 - Multi-order combined invoice with QBO sync
import React, { useState, useEffect, useMemo } from 'react';
import { orderApi, qboApi } from '../config/employeeApi';
import './DocumentGenerator.css';

const API_BASE = process.env.REACT_APP_EMPLOYEE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const InvoiceGenerator = ({ isOpen, onClose, orders }) => {
  const [step, setStep] = useState(1); // 1=select orders, 2=add fees, 3=done (show sync)
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderFees, setOrderFees] = useState({}); // { orderId: [{name, amount}] }
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState(null);
  const [qboConnected, setQboConnected] = useState(false);
  const [qboSyncing, setQboSyncing] = useState(false);
  const [qboSyncResult, setQboSyncResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedOrders([]); setOrderDetails([]); setOrderFees({});
      setError(null); setSearchTerm(''); setGeneratedInvoiceNumber(null);
      setQboSyncResult(null); setQboSyncing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      qboApi.getStatus().then(res => {
        setQboConnected(res.data?.connected || false);
      }).catch(() => setQboConnected(false));
    }
  }, [isOpen]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o => [o.ew_quote_number, o.order_number, o.inquiry_company, o.customer_name, o.origin_city, o.destination_city, o.shipment_number]
      .some(v => (v || '').toLowerCase().includes(term)));
  }, [orders, searchTerm]);

  const handleToggleOrder = (id) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => {
    const ids = filteredOrders.map(o => o.id);
    const all = ids.every(id => selectedOrders.includes(id));
    setSelectedOrders(all ? prev => prev.filter(id => !ids.includes(id)) : prev => [...new Set([...prev, ...ids])]);
  };

  // Step 1 -> Step 2
  const handleNext = async () => {
    if (selectedOrders.length === 0) { setError('请至少选择一个订单'); return; }
    setError(null);
    try {
      const details = await Promise.all(selectedOrders.map(async id => {
        const r = await orderApi.getOrderById(id); return r.data || r;
      }));
      setOrderDetails(details);
      // 初始化费用列表：若订单自带 customer_extra_fee > 0，预填一条
      // "Extra Fee (from order)"，让员工看到提示并可以编辑/删除
      const fees = {};
      details.forEach(o => {
        const extra = parseFloat(o.customer_extra_fee) || 0;
        fees[o.id] = extra > 0
          ? [{ name: 'Extra Fee', amount: String(extra), autoFromOrder: true }]
          : [];
      });
      setOrderFees(fees);
      setStep(2);
    } catch (err) { setError(err.message); }
  };

  // Fee management
  const addFee = (orderId) => {
    setOrderFees(prev => ({ ...prev, [orderId]: [...(prev[orderId] || []), { name: '', amount: '' }] }));
  };
  const updateFee = (orderId, idx, field, value) => {
    setOrderFees(prev => {
      const fees = [...(prev[orderId] || [])];
      fees[idx] = { ...fees[idx], [field]: value };
      return { ...prev, [orderId]: fees };
    });
  };
  const removeFee = (orderId, idx) => {
    setOrderFees(prev => {
      const fees = [...(prev[orderId] || [])];
      fees.splice(idx, 1);
      return { ...prev, [orderId]: fees };
    });
  };

  // Generate invoice number from backend
  const getInvoiceNumber = async (orderId) => {
    try {
      const token = localStorage.getItem('idToken') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/orders/${orderId}/invoice-number`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return data.data?.invoice_number || null;
    } catch (e) { return null; }
  };

  // Step 2 -> Generate Excel, then go to step 3
  const handleGenerate = async () => {
    setIsGenerating(true); setError(null);
    try {
      const ordersWithInv = await Promise.all(orderDetails.map(async o => {
        const invNum = await getInvoiceNumber(o.id);
        return { ...o, invoice_number: invNum || `INV-${o.id}` };
      }));

      const firstInvNum = ordersWithInv[0]?.invoice_number;
      setGeneratedInvoiceNumber(firstInvNum);

      await generateCombinedInvoice(ordersWithInv);

      if (qboConnected) {
        setStep(3);
      } else {
        onClose();
      }
    } catch (err) { setError(err.message || '生成失败'); }
    finally { setIsGenerating(false); }
  };

  const handleQboSync = async () => {
    setQboSyncing(true); setError(null); setQboSyncResult(null);
    try {
      const res = await qboApi.syncInvoice({
        orderIds: orderDetails.map(o => o.id),
        orderFees,
        invoiceNumber: generatedInvoiceNumber,
      });
      setQboSyncResult({ success: true, data: res.data });
    } catch (err) {
      setQboSyncResult({ success: false, message: err.message });
    } finally {
      setQboSyncing(false);
    }
  };

  const generateCombinedInvoice = async (allOrders) => {
    const ExcelJS = await import('exceljs');
    const fileSaver = await import('file-saver');
    const saveAs = fileSaver.default || fileSaver.saveAs;

    // Fetch full customer info from backend
    const companyName = allOrders[0]?.inquiry_company || allOrders[0]?.customer_name || '';
    let custInfo = null;
    if (companyName) {
      try {
        const { default: api } = await import('../config/employeeApi');
        const res = await api.customerApi.getByName(companyName);
        custInfo = res?.data || null;
      } catch (e) { /* fallback to name only */ }
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Invoice');
    // US Letter size columns
    ws.columns = [{ width: 2 }, { width: 5 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }];
    ws.pageSetup = { paperSize: 1, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } };

    const BLUE = 'FF1565C0';
    const GRAY = 'FF666666';
    const fmtDate = (d) => { if (!d) return new Date().toLocaleDateString('en-US'); const x = new Date(d); return `${x.getUTCMonth()+1}/${x.getUTCDate()}/${x.getUTCFullYear()}`; };
    const fmtCur = (v) => v ? `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
    const cols = ['B','C','D','E','F','G','H'];
    const setBorder = (r) => cols.forEach(c => { ws.getCell(`${c}${r}`).border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; });

    // === Left: company info | Right: INVOICE + details ===
    // Left side
    ws.mergeCells('B1:D1');
    ws.getCell('B1').value = 'WELOGX TECHNOLOGY INC'; ws.getCell('B1').font = { size: 13, bold: true, color: { argb: 'FF2E7D32' } }; ws.getRow(1).height = 20;
    ws.mergeCells('B2:D2');
    ws.getCell('B2').value = 'www.welogx.com'; ws.getCell('B2').font = { size: 8, color: { argb: GRAY } };
    ws.mergeCells('B3:D3');
    ws.getCell('B3').value = '55 Kennedy Dr, Hauppauge, NY 11788'; ws.getCell('B3').font = { size: 8, color: { argb: GRAY } };

    // Right side: INVOICE title
    ws.mergeCells('F1:H1');
    const titleCell = ws.getCell('F1');
    titleCell.value = 'INVOICE';
    titleCell.font = { size: 16, bold: true, color: { argb: BLUE } };
    titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const firstOrder = allOrders[0];

    // Right side: Invoice # + Date + Due Date
    ws.getCell('E2').value = 'Invoice #:'; ws.getCell('E2').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('E2').alignment = { horizontal: 'right' };
    ws.mergeCells('F2:H2'); ws.getCell('F2').value = firstOrder.invoice_number; ws.getCell('F2').font = { size: 9, bold: true }; ws.getCell('F2').alignment = { horizontal: 'right' };
    ws.getCell('E3').value = 'Date:'; ws.getCell('E3').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('E3').alignment = { horizontal: 'right' };
    ws.mergeCells('F3:G3'); ws.getCell('F3').value = fmtDate(null); ws.getCell('F3').font = { size: 8 }; ws.getCell('F3').alignment = { horizontal: 'right' };
    ws.getCell('H3').value = 'Due: On Receipt'; ws.getCell('H3').font = { size: 7, color: { argb: GRAY } }; ws.getCell('H3').alignment = { horizontal: 'right' };

    // Separator
    cols.forEach(c => { ws.getCell(`${c}4`).border = { bottom: { style: 'medium', color: { argb: BLUE } } }; });

    let row = 6;
    const company = custInfo?.company_name || firstOrder.inquiry_company || firstOrder.customer_name || '';

    ws.getCell(`B${row}`).value = 'BILL TO:'; ws.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: BLUE } }; row++;
    ws.getCell(`B${row}`).value = company; ws.getCell(`B${row}`).font = { size: 9, bold: true }; row++;
    if (custInfo?.billing_address) {
      ws.getCell(`B${row}`).value = custInfo.billing_address; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++;
    }
    if (custInfo?.billing_address2) {
      ws.getCell(`B${row}`).value = custInfo.billing_address2; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++;
    }
    if (custInfo?.billing_city || custInfo?.billing_state || custInfo?.billing_zipcode) {
      ws.getCell(`B${row}`).value = [custInfo.billing_city, custInfo.billing_state, custInfo.billing_zipcode].filter(Boolean).join(', ');
      ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++;
    }
    if (custInfo?.contact_phone) {
      ws.getCell(`B${row}`).value = custInfo.contact_phone; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++;
    }
    if (custInfo?.contact_email) {
      ws.getCell(`B${row}`).value = custInfo.contact_email; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++;
    }
    row++;

    // === Order sections ===
    let grandTotal = 0;

    allOrders.forEach((order, orderIdx) => {
      const fees = orderFees[order.id] || [];
      const basePrice = parseFloat(order.ew_quote_price) || 0;
      const feesTotal = fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
      const sectionTotal = basePrice + feesTotal;
      grandTotal += sectionTotal;

      // Section header
      ws.mergeCells(`B${row}:H${row}`);
      ws.getCell(`B${row}`).value = `Order ${orderIdx + 1}: ${order.ew_quote_number || order.order_number || ''} ${order.shipment_number ? '| ' + order.shipment_number : ''}`;
      ws.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: BLUE } };
      ws.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5FF' } };
      row++;

      // Route info
      ws.getCell(`B${row}`).value = 'Route:'; ws.getCell(`B${row}`).font = { bold: true, size: 8, color: { argb: 'FF666666' } };
      ws.mergeCells(`C${row}:H${row}`);
      ws.getCell(`C${row}`).value = `${order.origin_city || ''}, ${order.origin_state || ''} → ${order.destination_city || ''}, ${order.destination_state || ''}`;
      ws.getCell(`C${row}`).font = { size: 8, color: { argb: 'FF666666' } };
      row++;

      // Items table header
      ws.getCell(`B${row}`).value = '#';
      ws.getCell(`C${row}`).value = 'Description';
      ws.getCell(`D${row}`).value = 'Details';
      ws.getCell(`E${row}`).value = 'Weight';
      ws.getCell(`F${row}`).value = 'Pallets';
      ws.getCell(`G${row}`).value = 'Volume';
      ws.getCell(`H${row}`).value = 'Amount';
      cols.forEach(c => {
        const cell = ws.getCell(`${c}${row}`);
        cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      setBorder(row); ws.getRow(row).height = 18; row++;

      // Main cargo line
      ws.getCell(`B${row}`).value = 1;
      ws.getCell(`C${row}`).value = order.cargo_type || 'Freight Transportation';
      ws.getCell(`D${row}`).value = order.address_type || '-';
      ws.getCell(`E${row}`).value = order.total_weight_lbs ? `${parseFloat(order.total_weight_lbs).toLocaleString()} lbs` : '-';
      ws.getCell(`F${row}`).value = order.actual_pallets || '-';
      ws.getCell(`G${row}`).value = order.total_volume ? `${parseFloat(order.total_volume).toFixed(1)} ft³` : '-';
      ws.getCell(`H${row}`).value = fmtCur(basePrice);
      cols.forEach(c => { ws.getCell(`${c}${row}`).font = { size: 8 }; ws.getCell(`${c}${row}`).alignment = { horizontal: 'center', vertical: 'middle' }; });
      ws.getCell(`C${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
      setBorder(row); row++;

      // Extra fee lines
      fees.forEach((fee, fIdx) => {
        if (fee.name && fee.amount) {
          ws.getCell(`B${row}`).value = fIdx + 2;
          ws.getCell(`C${row}`).value = fee.name;
          ws.getCell(`H${row}`).value = fmtCur(fee.amount);
          cols.forEach(c => { ws.getCell(`${c}${row}`).font = { size: 8 }; ws.getCell(`${c}${row}`).alignment = { horizontal: 'center', vertical: 'middle' }; });
          ws.getCell(`C${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
          setBorder(row); row++;
        }
      });

      // Section subtotal
      ws.getCell(`G${row}`).value = 'Subtotal:';
      ws.getCell(`G${row}`).font = { bold: true, size: 8 };
      ws.getCell(`G${row}`).alignment = { horizontal: 'right' };
      ws.getCell(`H${row}`).value = fmtCur(sectionTotal);
      ws.getCell(`H${row}`).font = { bold: true, size: 8 };
      ws.getCell(`H${row}`).alignment = { horizontal: 'center' };
      ws.getCell(`H${row}`).border = { top: { style: 'thin' } };
      row += 2;
    });

    // Grand total
    cols.forEach(c => { ws.getCell(`${c}${row - 1}`).border = { bottom: { style: 'medium', color: { argb: BLUE } } }; });
    ws.getCell(`G${row}`).value = 'TOTAL:';
    ws.getCell(`G${row}`).font = { bold: true, size: 12, color: { argb: BLUE } };
    ws.getCell(`G${row}`).alignment = { horizontal: 'right' };
    ws.getCell(`H${row}`).value = fmtCur(grandTotal);
    ws.getCell(`H${row}`).font = { bold: true, size: 12, color: { argb: BLUE } };
    ws.getCell(`H${row}`).alignment = { horizontal: 'center' };
    ws.getRow(row).height = 24;
    row += 2;

    // Payment info
    ws.getCell(`B${row}`).value = 'PAYMENT INFORMATION'; ws.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: BLUE } }; row++;
    ws.getCell(`B${row}`).value = 'Payment Terms: Due on Receipt'; ws.getCell(`B${row}`).font = { size: 9 }; row++;
    ws.getCell(`B${row}`).value = 'Accepted Methods: Check, ACH, Zelle, Wire Transfer'; ws.getCell(`B${row}`).font = { size: 9 }; row += 2;

    // Footer
    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'Thank you for choosing Welogx!';
    ws.getCell(`B${row}`).font = { size: 10, italic: true, color: { argb: 'FF2E7D32' } }; ws.getCell(`B${row}`).alignment = { horizontal: 'center' }; row++;
    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'WELOGX TECHNOLOGY INC | www.welogx.com | 55 Kennedy Dr, Hauppauge, NY 11788';
    ws.getCell(`B${row}`).font = { size: 8, color: { argb: 'FF999999' } }; ws.getCell(`B${row}`).alignment = { horizontal: 'center' };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const invNum = firstOrder.invoice_number || 'invoice';
    const cName = company.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    saveAs(blob, `Invoice_${invNum}_${cName}.xlsx`);
  };

  if (!isOpen) return null;
  const visSel = filteredOrders.filter(o => selectedOrders.includes(o.id)).length;
  const allVisSel = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));

  // ===== STEP 1: Select Orders =====
  if (step === 1) {
    return (
      <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
        <div className="modal-content doc-generator-modal">
          <div className="modal-header">
            <h2>生成 Invoice - 选择订单</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            <div className="search-container">
              <input type="text" className="search-input" placeholder="搜索单号、公司名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>}
            </div>
            <div className="select-all-container">
              <label><input type="checkbox" checked={allVisSel} onChange={handleSelectAll} /><span>全选 ({visSel}/{filteredOrders.length})</span></label>
              {selectedOrders.length > 0 && <span className="total-selected">已选: {selectedOrders.length}</span>}
            </div>
            <div className="orders-list">
              {filteredOrders.map(o => (
                <div key={o.id} className={`order-item ${selectedOrders.includes(o.id) ? 'selected' : ''}`}>
                  <label>
                    <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => handleToggleOrder(o.id)} />
                    <div className="order-info">
                      <span className="order-number">{o.ew_quote_number || o.order_number}</span>
                      <span className="order-company">{o.inquiry_company || o.customer_name}</span>
                      <span className="order-route">{o.origin_city} → {o.destination_city}</span>
                      <span className="order-price" style={{ color: '#1565C0', fontWeight: 600 }}>{o.ew_quote_price ? `$${parseFloat(o.ew_quote_price).toLocaleString()}` : '-'}</span>
                    </div>
                  </label>
                </div>
              ))}
              {filteredOrders.length === 0 && <div className="no-results">没有匹配的订单</div>}
            </div>
          </div>
          <div className="floating-generate-btn">
            <button className="btn-primary btn-generate-float" onClick={handleNext} disabled={selectedOrders.length === 0} style={{ background: '#1565C0' }}>
              下一步：添加费用项 ({selectedOrders.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== STEP 3: QBO Sync =====
  if (step === 3) {
    return (
      <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
        <div className="modal-content doc-generator-modal" style={{ maxWidth: 500 }}>
          <div className="modal-header">
            <h2>Invoice 已生成</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#9989;</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
              Excel Invoice 已下载
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              {generatedInvoiceNumber} | {orderDetails.length} 个订单
            </p>

            {qboSyncResult?.success ? (
              <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ color: '#10b981', fontWeight: 600, margin: '0 0 6px' }}>已同步到 QuickBooks</p>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
                  QBO Invoice ID: {qboSyncResult.data?.qboInvoiceId} | 
                  Total: ${qboSyncResult.data?.totalAmt}
                </p>
              </div>
            ) : qboSyncResult && !qboSyncResult.success ? (
              <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 6px' }}>同步失败</p>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>{qboSyncResult.message}</p>
              </div>
            ) : (
              <button
                onClick={handleQboSync}
                disabled={qboSyncing}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: '#2ca01c', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: qboSyncing ? 'not-allowed' : 'pointer', opacity: qboSyncing ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(44,160,28,0.3)', marginBottom: 16,
                }}
              >
                {qboSyncing ? '同步中...' : '同步到 QuickBooks Online'}
              </button>
            )}

            <div style={{ marginTop: 8 }}>
              <button onClick={onClose}
                style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontSize: 13 }}>
                {qboSyncResult?.success ? '完成' : '跳过，稍后同步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== STEP 2: Add Fees Per Order =====
  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content doc-generator-modal" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h2>生成 Invoice - 添加附加费用</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            为每个订单添加额外费用项（如 Liftgate、Inside Delivery 等），不需要则直接生成。
          </p>

          {orderDetails.map((order, idx) => {
            const fees = orderFees[order.id] || [];
            const basePrice = parseFloat(order.ew_quote_price) || 0;
            const feesTotal = fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
            const customerExtra = parseFloat(order.customer_extra_fee) || 0;
            return (
              <div key={order.id} style={{ marginBottom: 20, padding: 14, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{order.ew_quote_number || order.order_number}</strong>
                    <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>{order.origin_city} → {order.destination_city}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: '#374151' }}>运费: <strong>${basePrice.toLocaleString()}</strong></span>
                    {feesTotal > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>+附加: <strong>${feesTotal.toLocaleString()}</strong></span>}
                  </div>
                </div>

                {/* Extra Fee 检测状态提示 */}
                {customerExtra > 0 ? (
                  <div style={{
                    marginBottom: 10, padding: '8px 10px', borderRadius: 6,
                    background: '#fef3c7', border: '1px solid #fbbf24',
                    fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ fontWeight: 700 }}>⚠ 检测到客户 Extra Fee ${customerExtra.toFixed(2)}</span>
                    <span>— 已自动添加到下方费用项，可修改金额或删除。</span>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: 10, padding: '6px 10px', borderRadius: 6,
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    fontSize: 12, color: '#6b7280'
                  }}>
                    未检测到 Extra Fee
                  </div>
                )}

                {fees.map((fee, fIdx) => (
                  <div key={fIdx} style={{
                    display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center',
                    padding: fee.autoFromOrder ? '6px 8px' : 0,
                    background: fee.autoFromOrder ? '#fffbeb' : 'transparent',
                    border: fee.autoFromOrder ? '1px dashed #fbbf24' : 'none',
                    borderRadius: fee.autoFromOrder ? 4 : 0,
                  }}>
                    {fee.autoFromOrder && (
                      <span title="订单里已登记的 Extra Fee" style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                        订单
                      </span>
                    )}
                    <input
                      type="text" placeholder="费用名称 (如 Liftgate)"
                      value={fee.name} onChange={e => updateFee(order.id, fIdx, 'name', e.target.value)}
                      style={{ flex: 2, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
                    />
                    <input
                      type="number" placeholder="金额"
                      value={fee.amount} onChange={e => updateFee(order.id, fIdx, 'amount', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
                    />
                    <button onClick={() => removeFee(order.id, fIdx)}
                      style={{ padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 4, background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                      ×
                    </button>
                  </div>
                ))}

                <button onClick={() => addFee(order.id)}
                  style={{ padding: '4px 12px', border: '1px dashed #1565C0', borderRadius: 6, background: 'none', color: '#1565C0', cursor: 'pointer', fontSize: 12, marginTop: 4 }}>
                  + 添加费用项
                </button>
              </div>
            );
          })}
        </div>
        <div className="floating-generate-btn" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn-primary btn-generate-float" onClick={() => setStep(1)} style={{ background: '#6b7280' }}>
            上一步
          </button>
          <button className="btn-primary btn-generate-float" onClick={handleGenerate} disabled={isGenerating} style={{ background: '#1565C0' }}>
            {isGenerating ? '生成中...' : `生成 Invoice (${orderDetails.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
