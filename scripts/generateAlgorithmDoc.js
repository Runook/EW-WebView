#!/usr/bin/env node
/**
 * Generate EW Logistics LTL Pricing Algorithm documentation as .docx
 * Run: node scripts/generateAlgorithmDoc.js
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function headerCell(text) {
  return new TableCell({
    borders: BORDERS,
    shading: { fill: '2563EB' },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18, font: 'Calibri' })] })],
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    borders: BORDERS,
    shading: opts.highlight ? { fill: 'F0FDF4' } : undefined,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), size: 18, font: 'Calibri', bold: opts.bold, color: opts.color })],
    })],
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 100 }, children: [new TextRun({ text, font: 'Calibri' })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spaceAfter || 80 },
    children: [new TextRun({ text, size: opts.size || 20, font: 'Calibri', bold: opts.bold, italics: opts.italics, color: opts.color })],
  });
}

function buildDoc() {
  const sections = [];

  // TITLE
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'EW Logistics LTL Pricing Algorithm', size: 36, bold: true, font: 'Calibri', color: '1D4ED8' })],
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'Version 4.0 — April 2026', size: 22, color: '6B7280', font: 'Calibri' })],
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: 'EW Logistics Service Inc | MC#1094635 | DOT#3398106', size: 18, color: '9CA3AF', font: 'Calibri' })],
  }));

  // TABLE OF CONTENTS
  sections.push(heading('Table of Contents'));
  const tocItems = [
    '1. Algorithm Overview',
    '2. NMFC Density-to-Class Table',
    '3. CWT Rate Table ($/CWT by Class × Weight Break)',
    '4. Distance Factor Bands',
    '5. Deficit Weight Optimization',
    '6. Fuel Surcharge (FSC)',
    '7. Accessorial Charges',
    '8. Overlength Surcharges',
    '9. Cubic Capacity Rule',
    '10. Carrier Eligibility Validation',
    '11. Complete Calculation Formula',
    '12. Example Calculations',
  ];
  tocItems.forEach(t => sections.push(para(t, { size: 20 })));

  // SECTION 1: OVERVIEW
  sections.push(heading('1. Algorithm Overview'));
  sections.push(para('The EW Logistics pricing engine calculates LTL freight rates using a multi-step process:'));
  sections.push(para(''));
  const steps = [
    'Step 1: Calculate shipment density (PCF) and auto-assign NMFC freight class',
    'Step 2: Determine distance factor from origin-destination miles',
    'Step 3: Run deficit weight optimization across all 7 weight-break tiers',
    'Step 4: Apply minimum charge floor',
    'Step 5: Calculate fuel surcharge (FSC) as percentage of linehaul',
    'Step 6: Calculate accessorial charges (residential, liftgate, etc.)',
    'Step 7: Apply overlength surcharge if any dimension > 96"',
    'Step 8: Apply cubic capacity surcharge if applicable',
    'Step 9: Check carrier eligibility and generate warnings',
    'Step 10: Sum all components for grand total',
  ];
  steps.forEach(s => sections.push(para(`  ${s}`, { size: 19 })));

  sections.push(para(''));
  sections.push(para('Grand Total = max(Linehaul, MinCharge) + FSC + Accessorials + Overlength + CubicCapacity', { bold: true, size: 22, color: '1D4ED8' }));

  // SECTION 2: NMFC TABLE
  sections.push(heading('2. NMFC Density-to-Class Table'));
  sections.push(para('Freight class is determined by cargo density (lbs per cubic foot). The system uses the NMFC 18-class standard:'));

  const nmfcRows = [
    new TableRow({ children: [headerCell('Class'), headerCell('Density Min (PCF)'), headerCell('Density Max (PCF)')] }),
  ];
  const nmfcData = [
    [50,50,'∞'],[55,35,50],[60,30,35],[65,22.5,30],[70,15,22.5],[77.5,13.5,15],
    [85,12,13.5],[92.5,10.5,12],[100,9,10.5],[110,8,9],[125,7,8],[150,6,7],
    [175,4,6],[200,3,4],[250,2,3],[300,1,2],[400,0.5,1],[500,0,0.5],
  ];
  nmfcData.forEach(([cls, min, max]) => {
    nmfcRows.push(new TableRow({ children: [cell(String(cls), { bold: true }), cell(String(min), { align: AlignmentType.CENTER }), cell(String(max), { align: AlignmentType.CENTER })] }));
  });
  sections.push(new Table({ rows: nmfcRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  sections.push(para(''));
  sections.push(para('Formula: Density = Total_Weight_lbs ÷ Total_Volume_cuft', { bold: true }));
  sections.push(para('Volume per pallet = (L × W × H) ÷ 1728 cubic feet'));

  // SECTION 3: CWT RATE TABLE
  sections.push(heading('3. CWT Rate Table'));
  sections.push(para('Rates are in dollars per hundredweight (CWT = weight ÷ 100). Columns represent weight-break tiers:'));

  const cwtHeaders = ['Class', 'Min $', '<500', '500', '1M', '2M', '5M', '10M', '20M'];
  const cwtHeaderRow = new TableRow({ children: cwtHeaders.map(h => headerCell(h)) });
  const cwtDataRows = [
    [50,65,42,28,19,13,8.5,6.2,4.5],[55,70,43.35,29.06,20,13.76,9.09,6.63,4.82],
    [65,80,46.06,31.18,22,15.29,10.5,7.49,5.45],[70,85,47.41,32.24,23,16.06,10.85,7.92,5.77],
    [85,95,50.12,34.35,25,17.59,12.03,8.78,6.41],[100,105,52.82,36.47,27,19.12,13.21,9.64,7.04],
    [125,115,55.53,38.59,29,20.65,14.38,10.49,7.68],[150,120,56.88,39.65,30,21.41,14.97,10.92,7.99],
    [200,130,59.59,41.76,32,22.94,16.15,11.78,8.63],[250,135,52,42.82,33,23.71,16.74,12.21,8.95],
    [500,150,65,46,36,26,18.5,13.5,9.9],
  ];
  const cwtRows = [cwtHeaderRow];
  cwtDataRows.forEach(row => {
    cwtRows.push(new TableRow({ children: row.map((v, i) => cell(i === 0 ? String(v) : `$${v}`, i === 0 ? { bold: true } : { align: AlignmentType.RIGHT })) }));
  });
  sections.push(new Table({ rows: cwtRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // SECTION 4: DISTANCE FACTOR
  sections.push(heading('4. Distance Factor Bands'));
  sections.push(para('The base CWT rate is multiplied by a distance factor:'));

  const distRows = [
    new TableRow({ children: [headerCell('Miles'), headerCell('Factor')] }),
    ...[['0 – 250','0.90'],['251 – 500','0.95'],['501 – 1,000','1.00 (base)'],
        ['1,001 – 1,500','1.08'],['1,501 – 2,000','1.20'],['2,001 – 2,500','1.35'],
        ['2,501 – 3,000','1.50'],['3,001+','1.65']].map(([m,f]) =>
      new TableRow({ children: [cell(m), cell(f, { align: AlignmentType.CENTER, bold: true })] })
    ),
  ];
  sections.push(new Table({ rows: distRows, width: { size: 60, type: WidthType.PERCENTAGE } }));

  // SECTION 5: DEFICIT OPTIMIZATION
  sections.push(heading('5. Deficit Weight Optimization'));
  sections.push(para('The algorithm tests all 7 weight-break tiers and selects the one producing the lowest cost:'));
  sections.push(para(''));
  sections.push(para('For each tier i (i = 1..7):', { bold: true }));
  sections.push(para('  Effective_Weight = max(Actual_Weight, Tier_Minimum_Weight)'));
  sections.push(para('  Billable_CWT = Effective_Weight ÷ 100'));
  sections.push(para('  Cost_i = Billable_CWT × CWT_Rate[class][i] × Distance_Factor'));
  sections.push(para(''));
  sections.push(para('Selected_Tier = argmin(Cost_i)', { bold: true }));
  sections.push(para(''));
  sections.push(para('This allows heavier weight breaks with lower per-CWT rates to produce cheaper totals than the natural tier. For example, a 4,500 lb shipment may be cheaper when rated at the 5,000 lb tier.'));

  // SECTION 6: FSC
  sections.push(heading('6. Fuel Surcharge (FSC)'));
  sections.push(para('Applied as a percentage of the base linehaul charge:'));
  sections.push(para('  FSC = Base_Linehaul × FSC_Percentage', { bold: true }));
  sections.push(para('  Default FSC: 29.75% (based on DOE diesel ~$3.75-4.00/gal)'));
  sections.push(para(''));
  sections.push(para('FSC percentage varies with diesel prices. Current lookup table ranges from 18% ($2.50/gal) to 44% ($5.50-6.00/gal).'));

  // SECTION 7: ACCESSORIALS
  sections.push(heading('7. Accessorial Charges'));
  sections.push(para('Accessorial fees are added based on selected services and location types. Weight-scaled charges interpolate between low and high based on shipment weight (500-5000 lbs range).'));

  const accRows = [
    new TableRow({ children: [headerCell('Service'), headerCell('Low'), headerCell('High'), headerCell('Scaling')] }),
    ...Object.entries({
      'Residential Pickup/Delivery': ['$35','$85','Weight'],
      'Liftgate Pickup/Delivery': ['$35','$75','Weight'],
      'Inside Pickup/Delivery': ['$75','$125','Weight'],
      'Limited Access': ['$75','$150','Weight'],
      'Appointment': ['$15','$50','Fixed'],
      'Hazmat': ['$50','$200','Fixed'],
      'Notification': ['$10','$35','Fixed'],
      'Construction Site': ['$75','$150','Weight'],
    }).map(([name, [lo, hi, scale]]) =>
      new TableRow({ children: [cell(name), cell(lo, { align: AlignmentType.RIGHT }), cell(hi, { align: AlignmentType.RIGHT }), cell(scale, { align: AlignmentType.CENTER })] })
    ),
  ];
  sections.push(new Table({ rows: accRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  sections.push(para(''));
  sections.push(para('Auto-Liftgate Rule: Residential destinations automatically include liftgate delivery (industry standard per TForce/SAIA rules).', { bold: true, color: 'DC2626' }));

  // SECTION 8: OVERLENGTH
  sections.push(heading('8. Overlength Surcharges'));
  sections.push(para('Applied when any single dimension of any item exceeds the threshold:'));

  const olRows = [
    new TableRow({ children: [headerCell('Dimension Exceeds'), headerCell('Surcharge')] }),
    new TableRow({ children: [cell('> 96" (8 ft)'), cell('$90', { bold: true, align: AlignmentType.RIGHT })] }),
    new TableRow({ children: [cell('> 144" (12 ft)'), cell('$125', { bold: true, align: AlignmentType.RIGHT })] }),
    new TableRow({ children: [cell('> 240" (20 ft)'), cell('$195', { bold: true, align: AlignmentType.RIGHT })] }),
  ];
  sections.push(new Table({ rows: olRows, width: { size: 60, type: WidthType.PERCENTAGE } }));

  sections.push(para(''));
  sections.push(para('Note: ABF Volume applies surcharges for any dimension > 95". AAA Cooper reduces liability to $0.50/lb for overlength items.'));

  // SECTION 9: CUBIC CAPACITY
  sections.push(heading('9. Cubic Capacity Rule'));
  sections.push(para('Per SAIA-style industry standard, low-density shipments that occupy excessive trailer space incur surcharges:'));
  sections.push(para(''));
  sections.push(para('If 350 ≤ Total_CuFt < 750 AND Density < 4 PCF → $100 surcharge', { bold: true }));
  sections.push(para('If Total_CuFt ≥ 750 AND Density < 6 PCF → $200 surcharge', { bold: true }));
  sections.push(para(''));
  sections.push(para('This protects against shipments that are physically large but extremely light (e.g., foam, inflated items, lightweight furniture).'));

  // SECTION 10: CARRIER ELIGIBILITY
  sections.push(heading('10. Carrier Eligibility Validation'));
  sections.push(para('After calculating the EW quote, the system checks the shipment against all carrier rules and generates warnings:'));

  const ceRows = [
    new TableRow({ children: [headerCell('Carrier'), headerCell('Max Pallet Wt'), headerCell('Max Total Wt'), headerCell('Max LF'), headerCell('Max Pallets'), headerCell('Prohibited')] }),
    ...[ ['AAA Cooper','2,500','—','—','—','Firearms, tobacco, vapes'],
         ['ABF Volume','2,500','15,000','27','—','Vaping, tobacco'],
         ['R&L','—','12,000','12','—','—'],
         ['TForce','3,500','20,000','15','—','Firearms, vaping'],
         ['SAIA','2,500','—','10','6','Hemp, THC, CBD'],
         ['STG','—','12,000','12','6','—'],
         ['EDI Express','—','—','12','6','Hazmat'],
         ['WARP','2,000','—','—','—','—'],
    ].map(row => new TableRow({ children: row.map((v, i) => cell(v, i === 0 ? { bold: true } : { align: AlignmentType.CENTER })) })),
  ];
  sections.push(new Table({ rows: ceRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  sections.push(para(''));
  sections.push(para('Amazon Approved Carriers: ABF, TForce, SAIA, Estes (live-unload only)', { bold: true, color: '16A34A' }));
  sections.push(para('Drop Trailer Carriers: TForce, SAIA, RRTS (limited locations)'));

  // SECTION 11: FORMULA
  sections.push(heading('11. Complete Calculation Formula'));
  sections.push(para(''));
  sections.push(para('1. density = total_weight ÷ total_cubic_feet'));
  sections.push(para('2. freight_class = NMFC_lookup(density) or user-specified'));
  sections.push(para('3. distance_factor = DIST_BAND_lookup(miles)'));
  sections.push(para('4. For each tier i=1..7: cost_i = max(weight, tier_min) ÷ 100 × CWT_rate[class][i] × distance_factor'));
  sections.push(para('5. base_linehaul = max(min(cost_1..cost_7), minimum_charge)'));
  sections.push(para('6. fsc = base_linehaul × 0.2975'));
  sections.push(para('7. accessorials = sum of applicable service charges'));
  sections.push(para('8. overlength = surcharge if max_dimension > 96"'));
  sections.push(para('9. cubic_surcharge = surcharge if low-density + high-volume'));
  sections.push(para('10. GRAND TOTAL = base_linehaul + fsc + accessorials + overlength + cubic_surcharge', { bold: true, size: 22 }));

  // SECTION 12: EXAMPLES
  sections.push(heading('12. Example Calculations'));

  sections.push(para('Example 1: Standard Commercial Shipment', { bold: true, size: 22, color: '1D4ED8' }));
  sections.push(para('3 pallets × 2000 lbs each = 6,000 lbs total, 40"×48"×72" per pallet'));
  sections.push(para('Class 65, Distance: 1,050 miles (NJ → FL)'));
  sections.push(para('  Volume: 3 × (40×48×72)/1728 = 240 cuft'));
  sections.push(para('  Density: 6000/240 = 25 PCF → Class 65'));
  sections.push(para('  Distance Factor: 1.08 (1001-1500 band)'));
  sections.push(para('  Deficit opt: 5M tier → 60 CWT × $10.50/CWT × 1.08 = $680.40'));
  sections.push(para('  FSC: $680.40 × 29.75% = $202.42'));
  sections.push(para('  Total: $680.40 + $202.42 = $882.82', { bold: true, color: '16A34A' }));

  sections.push(para(''));
  sections.push(para('Example 2: Residential Delivery with Overlength', { bold: true, size: 22, color: '1D4ED8' }));
  sections.push(para('1 pallet, 500 lbs, 120"×40"×48"'));
  sections.push(para('Class 70 (auto), Distance: 200 miles, Residential destination'));
  sections.push(para('  Volume: (120×40×48)/1728 = 133.3 cuft'));
  sections.push(para('  Density: 500/133.3 = 3.75 PCF → Class 175'));
  sections.push(para('  Distance Factor: 0.90'));
  sections.push(para('  Linehaul: 5 CWT × $58.24/CWT × 0.90 = $262.08 (but min charge $125, so $262.08)'));
  sections.push(para('  FSC: $262.08 × 29.75% = $77.97'));
  sections.push(para('  Residential: $35, Auto-liftgate: $35, Overlength(120"): $90'));
  sections.push(para('  Total: $262.08 + $77.97 + $35 + $35 + $90 = $500.05', { bold: true, color: '16A34A' }));

  sections.push(para(''));
  sections.push(para(''));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '— End of Document —', size: 18, color: '9CA3AF', font: 'Calibri', italics: true })],
  }));

  return new Document({
    sections: [{ children: sections }],
  });
}

async function main() {
  const doc = buildDoc();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'docs', 'EW_Logistics_LTL_Pricing_Algorithm_V4.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Document generated: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
