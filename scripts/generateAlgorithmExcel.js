#!/usr/bin/env node
/**
 * Generate EW Logistics LTL Pricing Algorithm as Excel (.xlsx)
 * for import into Google Sheets.
 * Run: node scripts/generateAlgorithmExcel.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFF' }, size: 11, name: 'Calibri' };
const WARN_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
const GREEN_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
const BORDER_THIN = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

function styleHeader(row) {
  row.eachCell(c => { c.fill = HEADER_FILL; c.font = HEADER_FONT; c.border = BORDERS; c.alignment = { horizontal: 'center' }; });
  row.height = 22;
}

function styleCells(sheet, startRow, endRow) {
  for (let r = startRow; r <= endRow; r++) {
    sheet.getRow(r).eachCell(c => { c.border = BORDERS; c.font = { size: 10, name: 'Calibri' }; });
  }
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EW Logistics';
  wb.created = new Date();

  // ========== Sheet 1: NMFC Class Table ==========
  const s1 = wb.addWorksheet('NMFC Classes');
  s1.columns = [
    { header: 'Class', key: 'cls', width: 10 },
    { header: 'Density Min (PCF)', key: 'dMin', width: 18 },
    { header: 'Density Max (PCF)', key: 'dMax', width: 18 },
    { header: 'Formula', key: 'formula', width: 40 },
  ];
  styleHeader(s1.getRow(1));

  const nmfc = [
    [50,50,'∞'],[55,35,50],[60,30,35],[65,22.5,30],[70,15,22.5],[77.5,13.5,15],
    [85,12,13.5],[92.5,10.5,12],[100,9,10.5],[110,8,9],[125,7,8],[150,6,7],
    [175,4,6],[200,3,4],[250,2,3],[300,1,2],[400,0.5,1],[500,0,0.5],
  ];
  nmfc.forEach(([cls, min, max]) => {
    s1.addRow({ cls, dMin: min, dMax: max, formula: `Density = Weight_lbs ÷ Volume_cuft` });
  });
  s1.addRow({});
  s1.addRow({ cls: 'Volume per pallet:', dMin: '', dMax: '', formula: '= (Length × Width × Height) ÷ 1728 cubic feet' });
  s1.addRow({ cls: 'Density:', dMin: '', dMax: '', formula: '= Total_Weight ÷ Total_Volume' });
  styleCells(s1, 2, s1.rowCount);

  // ========== Sheet 2: CWT Rate Table ==========
  const s2 = wb.addWorksheet('CWT Rates');
  s2.columns = [
    { header: 'Class', key: 'cls', width: 8 },
    { header: 'Min Charge', key: 'min', width: 12 },
    { header: '<500 lbs', key: 'w1', width: 10 },
    { header: '500 lbs', key: 'w2', width: 10 },
    { header: '1,000 lbs', key: 'w3', width: 10 },
    { header: '2,000 lbs', key: 'w4', width: 10 },
    { header: '5,000 lbs', key: 'w5', width: 10 },
    { header: '10,000 lbs', key: 'w6', width: 10 },
    { header: '20,000 lbs', key: 'w7', width: 10 },
  ];
  styleHeader(s2.getRow(1));

  const cwtData = {
    50:[65,42,28,19,13,8.5,6.2,4.5], 55:[70,43.35,29.06,20,13.76,9.09,6.63,4.82],
    60:[75,44.71,30.12,21,14.53,9.68,7.06,5.14], 65:[80,46.06,31.18,22,15.29,10.5,7.49,5.45],
    70:[85,47.41,32.24,23,16.06,10.85,7.92,5.77], 77.5:[90,48.76,33.29,24,16.82,11.44,8.35,6.09],
    85:[95,50.12,34.35,25,17.59,12.03,8.78,6.41], 92.5:[100,51.47,35.41,26,18.35,12.62,9.21,6.72],
    100:[105,52.82,36.47,27,19.12,13.21,9.64,7.04], 110:[110,54.18,37.53,28,19.88,13.79,10.06,7.36],
    125:[115,55.53,38.59,29,20.65,14.38,10.49,7.68], 150:[120,56.88,39.65,30,21.41,14.97,10.92,7.99],
    175:[125,58.24,40.71,31,22.18,15.56,11.35,8.31], 200:[130,59.59,41.76,32,22.94,16.15,11.78,8.63],
    250:[135,52,42.82,33,23.71,16.74,12.21,8.95], 300:[140,62.29,43.88,34,24.47,17.32,12.64,9.26],
    400:[145,63.65,44.94,35,25.24,17.91,13.07,9.58], 500:[150,65,46,36,26,18.5,13.5,9.9],
  };
  for (const [cls, rates] of Object.entries(cwtData)) {
    const row = s2.addRow({ cls: Number(cls), min: rates[0], w1: rates[1], w2: rates[2], w3: rates[3], w4: rates[4], w5: rates[5], w6: rates[6], w7: rates[7] });
    row.eachCell((c, i) => { if (i > 1) c.numFmt = '$#,##0.00'; });
  }
  styleCells(s2, 2, s2.rowCount);
  s2.addRow({});
  s2.addRow({ cls: 'Formula:', min: '', w1: 'Linehaul = Billable_CWT × Rate × Distance_Factor' });
  s2.addRow({ cls: 'Deficit:', min: '', w1: 'Test all 7 tiers, pick lowest cost. Billable_CWT = max(actual, tier_min) ÷ 100' });

  // ========== Sheet 3: Distance Factors ==========
  const s3 = wb.addWorksheet('Distance Factors');
  s3.columns = [
    { header: 'Miles From', key: 'lo', width: 12 },
    { header: 'Miles To', key: 'hi', width: 12 },
    { header: 'Factor', key: 'factor', width: 10 },
    { header: 'Note', key: 'note', width: 30 },
  ];
  styleHeader(s3.getRow(1));
  [
    [0,250,0.90,'Short haul'],[251,500,0.95,'Regional'],[501,1000,1.00,'Base rate'],
    [1001,1500,1.08,'Mid-range'],[1501,2000,1.20,'Long haul'],[2001,2500,1.35,'Cross-country'],
    [2501,3000,1.50,'Coast-to-coast'],[3001,99999,1.65,'Maximum'],
  ].forEach(([lo,hi,f,n]) => s3.addRow({ lo, hi, factor: f, note: n }));
  styleCells(s3, 2, s3.rowCount);

  // ========== Sheet 4: FSC Table ==========
  const s4 = wb.addWorksheet('Fuel Surcharge');
  s4.columns = [
    { header: 'Diesel $/gal From', key: 'lo', width: 16 },
    { header: 'Diesel $/gal To', key: 'hi', width: 16 },
    { header: 'FSC %', key: 'pct', width: 10 },
  ];
  styleHeader(s4.getRow(1));
  [
    [2.50,2.75,0.18],[2.75,3.00,0.20],[3.00,3.25,0.22],[3.25,3.50,0.24],
    [3.50,3.75,0.2675],[3.75,4.00,0.2975],[4.00,4.25,0.32],[4.25,4.50,0.34],
    [4.50,4.75,0.36],[4.75,5.00,0.38],[5.00,5.50,0.41],[5.50,6.00,0.44],
  ].forEach(([lo,hi,pct]) => {
    const row = s4.addRow({ lo, hi, pct });
    row.getCell(3).numFmt = '0.00%';
  });
  styleCells(s4, 2, s4.rowCount);
  s4.addRow({});
  s4.addRow({ lo: 'Current Default:', hi: '', pct: 0.2975 });
  s4.getRow(s4.rowCount).getCell(3).numFmt = '0.00%';
  s4.getRow(s4.rowCount).getCell(1).font = { bold: true, size: 11 };

  // ========== Sheet 5: Accessorials ==========
  const s5 = wb.addWorksheet('Accessorials');
  s5.columns = [
    { header: 'Service', key: 'svc', width: 28 },
    { header: 'Low ($)', key: 'lo', width: 10 },
    { header: 'High ($)', key: 'hi', width: 10 },
    { header: 'Default ($)', key: 'dflt', width: 12 },
    { header: 'Scaling', key: 'scale', width: 12 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];
  styleHeader(s5.getRow(1));
  [
    ['Residential Pickup',35,85,35,'Weight',''],
    ['Residential Delivery',35,85,35,'Weight','Auto-added for residential destinations'],
    ['Liftgate Pickup',35,75,35,'Weight',''],
    ['Liftgate Delivery',35,75,35,'Weight','Auto-added for residential (TForce/SAIA rule)'],
    ['Inside Pickup',75,125,75,'Weight',''],
    ['Inside Delivery',75,125,75,'Weight','EDI Express: no inside delivery'],
    ['Limited Access Pickup',75,150,75,'Weight',''],
    ['Limited Access Delivery',75,150,75,'Weight','WARP: included in flat rate'],
    ['Appointment',15,50,25,'Fixed','EDI Express: required for residential'],
    ['Hazmat',50,200,100,'Fixed','EDI Express/WARP: prohibited'],
    ['Notification',10,35,15,'Fixed',''],
    ['Construction Site',75,150,75,'Weight',''],
    ['Trade Show',75,150,75,'Weight',''],
    ['Overlength (>96")',90,90,90,'Fixed','Per item surcharge'],
    ['Overlength (>144")',125,125,125,'Fixed','Per item surcharge'],
    ['Overlength (>240")',195,195,195,'Fixed','Per item surcharge'],
    ['Cubic Capacity (350-749cuft <4PCF)',100,100,100,'Fixed','SAIA-style rule'],
    ['Cubic Capacity (≥750cuft <6PCF)',200,200,200,'Fixed','SAIA-style rule'],
  ].forEach(([svc,lo,hi,dflt,scale,notes]) => {
    const row = s5.addRow({ svc, lo, hi, dflt, scale, notes });
    [2,3,4].forEach(i => { row.getCell(i).numFmt = '$#,##0'; });
  });
  styleCells(s5, 2, s5.rowCount);
  s5.addRow({});
  s5.addRow({ svc: 'Weight scaling formula:', lo: '', hi: '', dflt: '', scale: '', notes: 'charge = low + (high - low) × min(1, (weight - 500) / 4500)' });

  // ========== Sheet 6: Carrier Rules ==========
  const s6 = wb.addWorksheet('Carrier Rules');
  s6.columns = [
    { header: 'Carrier', key: 'name', width: 16 },
    { header: 'Rating Type', key: 'rating', width: 14 },
    { header: 'Max Pallet Wt', key: 'maxPW', width: 14 },
    { header: 'Max Total Wt', key: 'maxW', width: 14 },
    { header: 'Max LF', key: 'maxLF', width: 8 },
    { header: 'Max Pallets', key: 'maxP', width: 12 },
    { header: 'Quote Valid', key: 'valid', width: 12 },
    { header: 'Liability $/lb', key: 'liab', width: 12 },
    { header: 'Amazon', key: 'amz', width: 8 },
    { header: 'Drop Trailer', key: 'dt', width: 12 },
    { header: 'Prohibited', key: 'prohib', width: 30 },
    { header: 'Notes', key: 'notes', width: 50 },
  ];
  styleHeader(s6.getRow(1));

  const { CARRIER_RULES } = require(path.join(__dirname, '..', 'backend', 'src', 'config', 'carrierRules'));
  for (const [name, r] of Object.entries(CARRIER_RULES)) {
    const row = s6.addRow({
      name, rating: r.ratingType || '—',
      maxPW: r.maxPalletWeight || '—', maxW: r.maxWeight || '—',
      maxLF: r.maxLinearFeet || '—', maxP: r.maxPallets || '—',
      valid: r.quoteValidity || '—', liab: r.liabilityPerLb ? `$${r.liabilityPerLb}` : '—',
      amz: r.amazonApproved ? 'YES' : '—', dt: r.dropTrailer ? 'YES' : '—',
      prohib: (r.prohibited || []).join(', ') || '—', notes: r.notes || '',
    });
    if (r.amazonApproved) row.getCell(9).fill = GREEN_FILL;
    if ((r.prohibited || []).length > 0) row.getCell(11).fill = WARN_FILL;
  }
  styleCells(s6, 2, s6.rowCount);

  // ========== Sheet 7: Formula & Examples ==========
  const s7 = wb.addWorksheet('Formula & Examples');
  s7.getColumn(1).width = 35;
  s7.getColumn(2).width = 50;

  const addLine = (label, value, opts = {}) => {
    const row = s7.addRow([label, value]);
    if (opts.bold) row.getCell(1).font = { bold: true, size: 11 };
    if (opts.header) { row.getCell(1).fill = HEADER_FILL; row.getCell(1).font = HEADER_FONT; row.getCell(2).fill = HEADER_FILL; row.getCell(2).font = HEADER_FONT; }
    if (opts.green) row.getCell(2).fill = GREEN_FILL;
    row.eachCell(c => { c.border = BORDERS; c.font = { ...c.font, name: 'Calibri' }; });
  };

  addLine('Section', 'Description', { header: true });
  addLine('COMPLETE FORMULA', '', { bold: true });
  addLine('1. Density', '= Total_Weight ÷ Total_Volume_CuFt');
  addLine('2. Freight Class', '= NMFC_Lookup(density) or user-specified');
  addLine('3. Distance Factor', '= DIST_BAND_Lookup(miles)');
  addLine('4. For each tier i=1..7', '= max(weight, tier_min) ÷ 100 × CWT[class][i] × dist_factor');
  addLine('5. Base Linehaul', '= max( min(cost_1..cost_7), minimum_charge )');
  addLine('6. FSC', '= base_linehaul × 29.75%');
  addLine('7. Accessorials', '= sum of applicable charges');
  addLine('8. Overlength', '= $90/$125/$195 if max_dim > 96"/144"/240"');
  addLine('9. Cubic Capacity', '= $100 if 350-749cuft<4PCF; $200 if ≥750cuft<6PCF');
  addLine('GRAND TOTAL', '= linehaul + FSC + accessorials + overlength + cubic', { bold: true, green: true });

  s7.addRow([]);
  addLine('EXAMPLE 1', 'Standard Commercial', { header: true });
  addLine('Cargo', '3 pallets × 2000 lbs = 6,000 lbs, 40×48×72" each');
  addLine('Route', 'NJ → FL, 1,050 miles');
  addLine('Volume', '3 × (40×48×72)/1728 = 240 cuft');
  addLine('Density', '6000/240 = 25 PCF → Class 65');
  addLine('Distance Factor', '1.08 (1001-1500 band)');
  addLine('Deficit Optimization', '5M tier: 60 CWT × $10.50 × 1.08 = $680.40');
  addLine('FSC', '$680.40 × 29.75% = $202.42');
  addLine('TOTAL', '$882.82', { bold: true, green: true });

  s7.addRow([]);
  addLine('EXAMPLE 2', 'Residential + Overlength', { header: true });
  addLine('Cargo', '1 pallet, 500 lbs, 120×40×48"');
  addLine('Route', '200 miles, residential destination');
  addLine('Volume', '(120×40×48)/1728 = 133.3 cuft');
  addLine('Density', '500/133.3 = 3.75 PCF → Class 175');
  addLine('Distance Factor', '0.90');
  addLine('Linehaul', '5 CWT × $58.24 × 0.90 = $262.08');
  addLine('FSC', '$262.08 × 29.75% = $77.97');
  addLine('Residential', '$35');
  addLine('Auto-Liftgate', '$35 (residential = auto liftgate)');
  addLine('Overlength (120")', '$90');
  addLine('TOTAL', '$500.05', { bold: true, green: true });

  // Save
  const outPath = path.join(__dirname, '..', 'docs', 'EW_Logistics_LTL_Pricing_Algorithm_V4.xlsx');
  await wb.xlsx.writeFile(outPath);
  const stats = require('fs').statSync(outPath);
  console.log(`✅ Excel generated: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('   → Import to Google Sheets: File > Import > Upload');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
