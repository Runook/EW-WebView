// Version: 1.0 - Driver/Carrier load quote (司机报价)
import React, { useState, useEffect, useMemo } from 'react';
import { orderApi } from '../config/employeeApi';
import './DocumentGenerator.css';

const DriverQuoteGenerator = ({ isOpen, onClose, orders }) => {
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
      return [o.ew_quote_number, o.order_number, o.inquiry_company, o.customer_name, o.origin_city, o.destination_city, o.shipment_number, o.truck_company_name]
        .some(v => (v || '').toLowerCase().includes(term));
    });
  }, [orders, searchTerm]);

  const handleToggleOrder = (id) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => {
    const ids = filteredOrders.map(o => o.id);
    const all = ids.every(id => selectedOrders.includes(id));
    setSelectedOrders(all ? prev => prev.filter(id => !ids.includes(id)) : prev => [...new Set([...prev, ...ids])]);
  };

  // 司机报价金额：优先已确认的付卡车价格，否则用司机参考价 + 司机 Extra
  const driverRate = (order) => {
    const pay = parseFloat(order.truck_payment) || 0;
    if (pay > 0) return pay;
    const ref = parseFloat(order.driver_reference_price) || 0;
    const extra = parseFloat(order.driver_extra_fee) || 0;
    return ref + extra;
  };

  const handleGenerate = async () => {
    if (selectedOrders.length === 0) { setError('请至少选择一个订单'); return; }
    setIsGenerating(true); setError(null);
    try {
      const details = await Promise.all(selectedOrders.map(async id => {
        const r = await orderApi.getOrderById(id); return r.data || r;
      }));
      if (details.length === 0) throw new Error('没有获取到订单数据');
      await generateDriverQuote(details);
      onClose();
    } catch (err) { setError(err.message || '生成失败'); }
    finally { setIsGenerating(false); }
  };

  const generateDriverQuote = async (allOrders) => {
    const ExcelJS = await import('exceljs');
    const fileSaver = await import('file-saver');
    const saveAs = fileSaver.default || fileSaver.saveAs;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Driver Quote');
    ws.columns = [{ width: 2 }, { width: 4 }, { width: 13 }, { width: 24 }, { width: 24 }, { width: 12 }, { width: 11 }, { width: 12 }];
    ws.pageSetup = { paperSize: 1, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } };

    const BLUE = 'FF1565C0';
    const GRAY = 'FF666666';
    const fmt = (d) => { if (!d) return new Date().toLocaleDateString('en-US'); const x = new Date(d); return `${x.getUTCMonth()+1}/${x.getUTCDate()}/${x.getUTCFullYear()}`; };
    const fmtCur = (v) => v ? `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-';
    const cols = ['B','C','D','E','F','G','H'];
    const setBorder = (r) => cols.forEach(c => { ws.getCell(`${c}${r}`).border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; });

    // === Header: broker (left) | title + date (right) ===
    ws.mergeCells('B1:D1');
    ws.getCell('B1').value = 'WELOGX TECHNOLOGY INC'; ws.getCell('B1').font = { size: 13, bold: true, color: { argb: BLUE } }; ws.getRow(1).height = 20;
    ws.mergeCells('B2:D2');
    ws.getCell('B2').value = 'www.welogx.com'; ws.getCell('B2').font = { size: 8, color: { argb: GRAY } };
    ws.mergeCells('B3:D3');
    ws.getCell('B3').value = '55 Kennedy Dr, Hauppauge, NY 11788'; ws.getCell('B3').font = { size: 8, color: { argb: GRAY } };

    ws.mergeCells('F1:H1');
    const titleCell = ws.getCell('F1');
    titleCell.value = 'CARRIER RATE QUOTE';
    titleCell.font = { size: 15, bold: true, color: { argb: BLUE } };
    titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

    ws.getCell('F2').value = 'Date:'; ws.getCell('F2').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('F2').alignment = { horizontal: 'right' };
    ws.mergeCells('G2:H2'); ws.getCell('G2').value = fmt(null); ws.getCell('G2').font = { size: 8 }; ws.getCell('G2').alignment = { horizontal: 'right' };
    const vd = new Date(); vd.setDate(vd.getDate() + 2);
    ws.getCell('F3').value = 'Valid Until:'; ws.getCell('F3').font = { bold: true, size: 8, color: { argb: GRAY } }; ws.getCell('F3').alignment = { horizontal: 'right' };
    ws.mergeCells('G3:H3'); ws.getCell('G3').value = fmt(vd.toISOString()); ws.getCell('G3').font = { size: 8 }; ws.getCell('G3').alignment = { horizontal: 'right' };

    cols.forEach(c => { ws.getCell(`${c}4`).border = { bottom: { style: 'medium', color: { argb: BLUE } } }; });

    let row = 6;

    // === Carrier info (only when a single carrier is identifiable) ===
    const carrierNames = [...new Set(allOrders.map(o => o.truck_company_name).filter(Boolean))];
    const firstOrder = allOrders[0];
    if (carrierNames.length === 1 && firstOrder.truck_company_name) {
      ws.getCell(`B${row}`).value = 'CARRIER:'; ws.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: BLUE } }; row++;
      ws.getCell(`B${row}`).value = firstOrder.truck_company_name; ws.getCell(`B${row}`).font = { size: 9, bold: true }; row++;
      const line2 = [firstOrder.mc_number ? `MC# ${firstOrder.mc_number}` : '', firstOrder.truck_contact || ''].filter(Boolean).join('   |   ');
      if (line2) { ws.getCell(`B${row}`).value = line2; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++; }
      row++;
    }

    // === Items table header ===
    ws.getCell(`B${row}`).value = '#';
    ws.getCell(`C${row}`).value = 'WE#';
    ws.getCell(`D${row}`).value = 'Pickup';
    ws.getCell(`E${row}`).value = 'Delivery';
    ws.getCell(`F${row}`).value = 'Commodity';
    ws.getCell(`G${row}`).value = 'Weight / Plts';
    ws.getCell(`H${row}`).value = 'Rate';
    cols.forEach(c => {
      const cell = ws.getCell(`${c}${row}`);
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    setBorder(row); ws.getRow(row).height = 20; row++;

    // === Items rows ===
    let grandTotal = 0;
    allOrders.forEach((order, idx) => {
      const rate = driverRate(order);
      grandTotal += rate;
      const pickup = order.origin_address || `${order.origin_city || ''}, ${order.origin_state || ''} ${order.origin_zipcode || ''}`.trim();
      const delivery = order.destination_address || `${order.destination_city || ''}, ${order.destination_state || ''} ${order.destination_zipcode || ''}`.trim();
      const wt = order.total_weight_lbs ? `${parseFloat(order.total_weight_lbs).toLocaleString()} lbs` : '-';
      const plts = order.actual_pallets || order.total_pallets || '-';
      ws.getCell(`B${row}`).value = idx + 1;
      ws.getCell(`C${row}`).value = order.ew_quote_number || order.order_number || '';
      ws.getCell(`D${row}`).value = pickup || '-';
      ws.getCell(`E${row}`).value = delivery || '-';
      ws.getCell(`F${row}`).value = order.cargo_type || 'Freight';
      ws.getCell(`G${row}`).value = `${wt} / ${plts}P`;
      ws.getCell(`H${row}`).value = fmtCur(rate);
      cols.forEach(c => {
        ws.getCell(`${c}${row}`).font = { size: 9 };
        ws.getCell(`${c}${row}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      ws.getCell(`D${row}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      ws.getCell(`E${row}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      setBorder(row); ws.getRow(row).height = 34; row++;
    });

    // === Total ===
    ws.getCell(`G${row}`).value = 'TOTAL:';
    ws.getCell(`G${row}`).font = { bold: true, size: 11, color: { argb: BLUE } };
    ws.getCell(`G${row}`).alignment = { horizontal: 'right' };
    ws.getCell(`H${row}`).value = fmtCur(grandTotal);
    ws.getCell(`H${row}`).font = { bold: true, size: 11, color: { argb: BLUE } };
    ws.getCell(`H${row}`).alignment = { horizontal: 'center' };
    ws.getCell(`H${row}`).border = { top: { style: 'double', color: { argb: BLUE } } };
    row += 2;

    // === Terms (carrier-facing) ===
    ws.getCell(`B${row}`).value = 'CARRIER TERMS'; ws.getCell(`B${row}`).font = { bold: true, size: 11, color: { argb: BLUE } }; row++;
    [
      '• Rate is all-inclusive (line haul, fuel, tolls) unless otherwise agreed in writing.',
      '• A signed POD (proof of delivery) is required before payment is released.',
      '• Carrier must maintain active MC/DOT authority and required insurance (COI on file).',
      '• Detention / layover / TONU only apply if pre-approved by Welogx dispatch in writing.',
      '• Payment Terms: Net 30 days from receipt of signed POD and carrier invoice.',
      '• This rate quote is valid for 2 days and applies only to the load(s) listed above.',
    ].forEach(t => { ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = t; ws.getCell(`B${row}`).font = { size: 8, color: { argb: GRAY } }; row++; });
    row++;

    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'Please confirm acceptance by signing and returning this rate quote.';
    ws.getCell(`B${row}`).font = { size: 9, italic: true, color: { argb: BLUE } }; row += 2;

    // Signature line
    ws.getCell(`B${row}`).value = 'Carrier Signature: __________________________';
    ws.getCell(`B${row}`).font = { size: 9 };
    ws.getCell(`F${row}`).value = 'Date: ______________';
    ws.getCell(`F${row}`).font = { size: 9 };
    row += 2;

    ws.mergeCells(`B${row}:H${row}`); ws.getCell(`B${row}`).value = 'WELOGX TECHNOLOGY INC | www.welogx.com | 55 Kennedy Dr, Hauppauge, NY 11788';
    ws.getCell(`B${row}`).font = { size: 8, color: { argb: 'FF999999' } }; ws.getCell(`B${row}`).alignment = { horizontal: 'center' };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const tag = carrierNames.length === 1 && firstOrder.truck_company_name
      ? firstOrder.truck_company_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      : `${allOrders.length}loads`;
    saveAs(blob, `DriverQuote_${tag}.xlsx`);
  };

  if (!isOpen) return null;
  const visSel = filteredOrders.filter(o => selectedOrders.includes(o.id)).length;
  const allVisSel = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content doc-generator-modal">
        <div className="modal-header">
          <h2>生成司机报价单 (Carrier Rate Quote)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div className="search-container">
            <input type="text" className="search-input" placeholder="搜索单号、公司名、卡车公司..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                    <span className="order-company">{o.truck_company_name || o.inquiry_company || o.customer_name}</span>
                    <span className="order-route">{o.origin_city} → {o.destination_city}</span>
                    <span className="order-price" style={{ color: '#1565C0', fontWeight: 600 }}>{driverRate(o) ? `$${driverRate(o).toLocaleString()}` : '-'}</span>
                  </div>
                </label>
              </div>
            ))}
            {filteredOrders.length === 0 && <div className="no-results">没有匹配的订单</div>}
          </div>
        </div>
        <div className="floating-generate-btn">
          <button className="btn-primary btn-generate-float" onClick={handleGenerate} disabled={selectedOrders.length === 0 || isGenerating} style={{ background: '#1565C0' }}>
            {isGenerating ? '生成中...' : `生成司机报价单 (${selectedOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverQuoteGenerator;
