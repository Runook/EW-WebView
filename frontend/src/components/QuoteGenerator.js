// Version: 4.0 - Multi-order combined quotation
import React, { useState, useEffect, useMemo } from 'react';
import { orderApi } from '../config/employeeApi';
import './DocumentGenerator.css';

const QuoteGenerator = ({ isOpen, onClose, orders }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) { setSelectedOrders([]); setError(null); setSearchTerm(''); }
  }, [isOpen]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o => {
      return [o.ew_quote_number, o.order_number, o.inquiry_company, o.customer_name, o.origin_city, o.destination_city, o.shipment_number]
        .some(v => (v || '').toLowerCase().includes(term));
    });
  }, [orders, searchTerm]);

  const handleToggleOrder = (id) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => {
    const ids = filteredOrders.map(o => o.id);
    const all = ids.every(id => selectedOrders.includes(id));
    setSelectedOrders(all ? prev => prev.filter(id => !ids.includes(id)) : prev => [...new Set([...prev, ...ids])]);
  };

  const handleGenerate = async () => {
    if (selectedOrders.length === 0) { setError('请至少选择一个订单'); return; }
    setIsGenerating(true); setError(null);
    try {
      const details = await Promise.all(selectedOrders.map(async id => {
        const r = await orderApi.getOrderById(id); return r.data || r;
      }));
      if (details.length === 0) throw new Error('没有获取到订单数据');
      await generateCombinedQuote(details);
      onClose();
    } catch (err) { setError(err.message || '生成失败'); }
    finally { setIsGenerating(false); }
  };

  const generateCombinedQuote = async (allOrders) => {
    const ExcelJS = await import('exceljs');
    const fileSaver = await import('file-saver');
    const saveAs = fileSaver.default || fileSaver.saveAs;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Quotation');
    // US Letter size columns (~8.5" / 85 chars)
    ws.columns = [{ width: 2 }, { width: 5 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }];
    // Set print area to US Letter
    ws.pageSetup = { paperSize: 1, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } };

    const GREEN = 'FF2E7D32';
    const GRAY = 'FF666666';
    const fmt = (d) => { if (!d) return new Date().toLocaleDateString('en-US'); const x = new Date(d); return `${x.getUTCMonth()+1}/${x.getUTCDate()}/${x.getUTCFullYear()}`; };
    const fmtCur = (v) => v ? `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-';
    const cols = ['B','C','D','E','F','G','H'];
    const setBorder = (r) => cols.forEach(c => { ws.getCell(`${c}${r}`).border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; });

    // === Left: company info | Right: QUOTATION + details ===
    // Left side
    ws.mergeCells('B1:D1');
    ws.getCell('B1').value = 'WELOGX TECHNOLOGY INC'; ws.getCell('B1').font = { size: 13, bold: true, color: { argb: GREEN } }; ws.getRow(1).height = 20;
    ws.mergeCells('B2:D2');
    ws.getCell('B2').value = 'www.welogx.com'; ws.getCell('B2').font = { size: 8, color: { argb: GRAY } };
    ws.mergeCells('B3:D3');
    ws.getCell('B3').value = '55 Kennedy Dr, Hauppauge, NY 11788'; ws.getCell('B3').font = { size: 8, color: { argb: GRAY } };

    // Right side: QUOTATION title
    ws.mergeCells('F1:H1');
    const titleCell = ws.getCell('F1');
    titleCell.value = 'QUOTATION';
    titleCell.font = { size: 16, bold: true, color: { argb: GREEN } };
    titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Right side: Date + Valid Until
    ws.getCell('F2').value = 'Date:'; ws.getCell('F2').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('F2').alignment = { horizontal: 'right' };
    ws.mergeCells('G2:H2'); ws.getCell('G2').value = fmt(null); ws.getCell('G2').font = { size: 8 }; ws.getCell('G2').alignment = { horizontal: 'right' };
    const vd = new Date(); vd.setDate(vd.getDate() + 7);
    ws.getCell('F3').value = 'Valid Until:'; ws.getCell('F3').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('F3').alignment = { horizontal: 'right' };
    ws.mergeCells('G3:H3'); ws.getCell('G3').value = fmt(vd.toISOString()); ws.getCell('G3').font = { size: 8 }; ws.getCell('G3').alignment = { horizontal: 'right' };

    // Separator
    cols.forEach(c => { ws.getCell(`${c}4`).border = { bottom: { style: 'medium', color: { argb: GREEN } } }; });

    // Fetch full customer info
    const firstOrder = allOrders[0];
    const companyName = firstOrder.inquiry_company || firstOrder.customer_name || '';
    let custInfo = null;
    if (companyName) {
      try {
        const { default: api } = await import('../config/employeeApi');
        const res = await api.customerApi.getByName(companyName);
        custInfo = res?.data || null;
      } catch (e) { /* fallback */ }
    }

    let row = 6;
    const company = custInfo?.company_name || companyName;

    ws.getCell(`B${row}`).value = 'QUOTE TO:'; ws.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: GREEN } }; row++;
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

    // Items table header
    ws.getCell(`B${row}`).value = '#';
    ws.getCell(`C${row}`).value = 'WE#';
    ws.getCell(`D${row}`).value = 'Route';
    ws.getCell(`E${row}`).value = 'Cargo';
    ws.getCell(`F${row}`).value = 'Weight';
    ws.getCell(`G${row}`).value = 'Pallets';
    ws.getCell(`H${row}`).value = 'Amount';
    cols.forEach(c => {
      const cell = ws.getCell(`${c}${row}`);
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    setBorder(row); ws.getRow(row).height = 20; row++;

    // Items rows
    let grandTotal = 0;
    allOrders.forEach((order, idx) => {
      const price = parseFloat(order.ew_quote_price) || 0;
      grandTotal += price;
      const route = `${order.origin_city || ''},${order.origin_state || ''} → ${order.destination_city || ''},${order.destination_state || ''}`;
      ws.getCell(`B${row}`).value = idx + 1;
      ws.getCell(`C${row}`).value = order.ew_quote_number || order.order_number || '';
      ws.getCell(`D${row}`).value = route;
      ws.getCell(`E${row}`).value = order.cargo_type || 'Freight';
      ws.getCell(`F${row}`).value = order.total_weight_lbs ? `${parseFloat(order.total_weight_lbs).toLocaleString()} lbs` : '-';
      ws.getCell(`G${row}`).value = order.actual_pallets || '-';
      ws.getCell(`H${row}`).value = fmtCur(price);
      cols.forEach(c => {
        ws.getCell(`${c}${row}`).font = { size: 9 };
        ws.getCell(`${c}${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
      });
      ws.getCell(`D${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
      setBorder(row); ws.getRow(row).height = 18; row++;
    });

    // Total row
    ws.getCell(`G${row}`).value = 'TOTAL:';
    ws.getCell(`G${row}`).font = { bold: true, size: 11, color: { argb: GREEN } };
    ws.getCell(`G${row}`).alignment = { horizontal: 'right' };
    ws.getCell(`H${row}`).value = fmtCur(grandTotal);
    ws.getCell(`H${row}`).font = { bold: true, size: 11, color: { argb: GREEN } };
    ws.getCell(`H${row}`).alignment = { horizontal: 'center' };
    ws.getCell(`H${row}`).border = { top: { style: 'double', color: { argb: GREEN } } };
    row += 2;

    // Terms
    ws.getCell(`B${row}`).value = 'TERMS & CONDITIONS'; ws.getCell(`B${row}`).font = { bold: true, size: 11, color: { argb: GREEN } }; row++;
    ['• This quotation is valid for 7 days from the date of issue.',
     '• Prices are subject to change based on actual cargo weight and dimensions.',
     '• Additional charges may apply for: liftgate, inside delivery, residential, limited access, appointment.',
     '• Payment Terms: Due on Receipt.',
    ].forEach(t => { ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = t; ws.getCell(`B${row}`).font = { size: 8, color: { argb: 'FF666666' } }; row++; });
    row++;

    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'Thank you for choosing Welogx!';
    ws.getCell(`B${row}`).font = { size: 10, italic: true, color: { argb: GREEN } }; ws.getCell(`B${row}`).alignment = { horizontal: 'center' }; row++;
    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'WELOGX TECHNOLOGY INC | www.welogx.com | 55 Kennedy Dr, Hauppauge, NY 11788';
    ws.getCell(`B${row}`).font = { size: 8, color: { argb: 'FF999999' } }; ws.getCell(`B${row}`).alignment = { horizontal: 'center' };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cName = company.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    saveAs(blob, `Quote_${cName}_${allOrders.length}orders.xlsx`);
  };

  if (!isOpen) return null;
  const visSel = filteredOrders.filter(o => selectedOrders.includes(o.id)).length;
  const allVisSel = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content doc-generator-modal">
        <div className="modal-header">
          <h2>生成报价单 (Quotation)</h2>
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
                    <span className="order-price" style={{ color: '#2E7D32', fontWeight: 600 }}>{o.ew_quote_price ? `$${parseFloat(o.ew_quote_price).toLocaleString()}` : '-'}</span>
                  </div>
                </label>
              </div>
            ))}
            {filteredOrders.length === 0 && <div className="no-results">没有匹配的订单</div>}
          </div>
        </div>
        <div className="floating-generate-btn">
          <button className="btn-primary btn-generate-float" onClick={handleGenerate} disabled={selectedOrders.length === 0 || isGenerating} style={{ background: '#2E7D32' }}>
            {isGenerating ? '生成中...' : `生成报价单 (${selectedOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;
