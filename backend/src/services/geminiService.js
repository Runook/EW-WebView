/**
 * Gemini API Service for parsing customer shipment files (PDF/Excel/images).
 * Extracts structured LTL quote parameters using multimodal AI.
 */

const { GoogleGenAI } = require('@google/genai');
const XLSX = require('xlsx');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PARSE_PROMPT = `You are a senior US LTL freight logistics analyst and NMFC classification specialist. Parse customer shipment documents and produce structured JSON for LTL carrier quoting. You must apply professional palletization, classification, and surcharge rules.

══════════════════════════════════════════════════
SECTION 1: DOCUMENT FORMAT (Chinese Freight Forwarders)
══════════════════════════════════════════════════
Common Excel/PDF columns:
  包装类型|外箱单号|备注|派送方式|中文品名|英文品名|价值|国家|邮编|城市|公司名|收件人|电话|邮箱|详细地址|箱数|尺寸箱数|实重(KG)|方数|长(CM)|宽(CM)|高(CM)|报价|地址类型

Structural patterns:
- MAIN ROW: first row for a tracking number contains all address/product info + first box dimensions
- SUB-ROWS: subsequent rows with ONLY dimension/weight columns = additional boxes for the SAME shipment
- PICKUP ADDRESS: often at bottom of file (提货地址/仓库地址) — applies to ALL shipments as origin
- FILE TITLE may indicate: 整车=FTL, 一提N卸=1 pickup N drops, 散货=loose cargo

Chinese logistics terminology:
  托/托盘=pallet, 木箱=wood crate, 卡脚/木卡板=skid base, 纸箱=carton, 编织袋=woven bag
  木架=wood frame, 铁架=metal frame, 裸装=bare/uncrated, 缠膜=shrink wrapped
  卡派=truck delivery(LTL), 快递=express/parcel, 专车/整车=FTL
  住宅=residential, 商业=commercial, 尾板=liftgate, 没有卸货平台=no dock
  不可堆叠=non-stackable, 易碎=fragile, 危险品=hazmat

Packaging notation:
  "1/2 2/2 托" = shipment uses 2 pallets total (pallet 1 of 2, pallet 2 of 2)
  "1/3-3/3木箱+卡脚" = 3 wood crates with skid bases

══════════════════════════════════════════════════
SECTION 2: UNIT CONVERSION (always output US imperial)
══════════════════════════════════════════════════
Weight: kg × 2.20462 = lbs. Round to nearest integer.
Dimensions: cm ÷ 2.54 = inches. Round to nearest integer.
Volume: (L_in × W_in × H_in) ÷ 1728 = cubic feet
1 CBM = 35.3147 cubic feet

══════════════════════════════════════════════════
SECTION 3: PALLETIZATION RULES
══════════════════════════════════════════════════
Standard US GMA pallet: 48"L × 40"W, pallet itself ~6" tall, ~40 lbs.

--- 3A. LOOSE CARTONS → PALLETS ---
Step 1: Boxes per layer:
  Normal:  floor(48 / box_L_in) × floor(40 / box_W_in)
  Rotated: floor(48 / box_W_in) × floor(40 / box_L_in)
  Use whichever fits more.
  If a box exceeds 48" in any horizontal dimension, it needs its own pallet or oversize handling.
Step 2: Layers per pallet:
  Stackable goods: max cargo height = 48" → layers = floor(48 / box_H_in)
  Non-stackable:   max cargo height = 72" → layers = floor(72 / box_H_in)
  Absolute max total height (incl. 6" pallet) = 84"
Step 3: Boxes per pallet = boxes_per_layer × layers
Step 4: Pallets needed = ceil(total_boxes / boxes_per_pallet)
Step 5: Pallet weight = (box_weight × boxes_on_pallet) + 40 lbs (pallet)
Step 6: Pallet dims = 48"L × 40"W × (box_H × layers + 6)"H
CONSTRAINT: max 2500 lbs per pallet; if exceeded reduce boxes.

--- 3B. WOOD CRATES / SKIDS (木箱/卡脚/木架) ---
Each crate = 1 pallet unit. Use crate's actual dimensions + weight.
No extra pallet weight (crate has its own base).

--- 3C. OVERSIZED ITEMS (>48" in any direction) ---
If item exceeds standard pallet footprint:
  - Use actual item dimensions (not 48×40)
  - Each oversized item = 1 pallet unit
  - Flag overlength if any single dimension > 96" (8 feet)
  - Note in "notes" field: "Overlength: XXX inches. Carrier surcharge likely applies."
  Overlength surcharge tiers: >96"=$90, >144"=$125, >240"=$195

--- 3D. ALREADY-PALLETIZED ("托" in packaging) ---
Distribute boxes across stated pallet count. Calculate per-pallet weight and dimensions.

STACKABILITY:
  stackable = true:  height ≤ 48", sturdy goods (metal, wood, machinery parts, bottled liquids)
  stackable = false: height > 48", fragile, glass, artwork, irregular shape, live plants
  Wood crates and heavy equipment (>500 lbs): NOT stackable

══════════════════════════════════════════════════
SECTION 4: NMFC FREIGHT CLASS (2025 Density-Based + Commodity Overrides)
══════════════════════════════════════════════════
PRIMARY RULE — Density-based (calculate for each pallet):
  Density (PCF) = pallet_weight_lbs ÷ pallet_volume_cubic_feet

  PCF ≥ 50  → "50"     PCF ≥ 35  → "55"     PCF ≥ 30  → "60"
  PCF ≥ 22.5→ "65"     PCF ≥ 15  → "70"     PCF ≥ 13.5→ "77.5"
  PCF ≥ 12  → "85"     PCF ≥ 10.5→ "92.5"   PCF ≥ 9   → "100"
  PCF ≥ 8   → "110"    PCF ≥ 7   → "125"    PCF ≥ 6   → "150"
  PCF ≥ 4   → "175"    PCF ≥ 2   → "250"    PCF ≥ 1   → "300"
  PCF < 1   → "400"

COMMODITY OVERRIDE RULES — Some items have MINIMUM freight classes regardless of density.
Apply the HIGHER of density-based class and commodity minimum:

  Vehicles/Golf Carts/ATVs/Scooters (self-propelled or electric):
    NMFC 189800. Min class "200" if uncrated. If crated: use density but min "125".
  Golf cart frames only: NMFC 191740, fixed class "200".
  Motorcycles/Mopeds: min class "150".
  
  Furniture (assembled): min class "100". Knocked-down/unassembled: use density.
  Chairs (plastic/metal, assembled): typically class "150"-"300" depending on density.
  Mattresses/bedding: min class "100". Very bulky → often "175"-"250".
  Sofas/couches/stuffed furniture: min class "175".
  
  Electronics (computers, monitors, TVs, assembled): min class "85".
  Refrigerators/freezers/large appliances: min class "92.5".
  Small appliances (blenders, vacuums): min class "100"-"125".
  
  Glass/mirrors (crated): min class "85". If uncrated/fragile: min "125".
  Artwork/paintings/framed items: min class "110".
  Pianos/musical instruments: min class "200".
  
  Tires (new): class "77.5". Used tires: class "60".
  Auto parts (engines, transmissions): typically class "70"-"85".
  
  Machinery (crated): use density, typically "70"-"85".
  Industrial equipment (uncrated): min class "85".
  
  Chemicals/paint/coatings: min class "55". Hazmat chemicals: min class "85".
  Batteries (non-hazardous, boxed): class "60".
  Lithium batteries: HAZMAT — flag hazmat=true, min class "85".
  
  Food/beverages (bottled/canned): use density, typically "65"-"70".
  Perishables: NOT suitable for standard LTL — note this.
  
  Paper/printed materials: class "55"-"65".
  Clothing/textiles/fabric rolls: min class "77.5" if baled, "150" if boxed loosely.
  
  Building materials (lumber, drywall): class "50"-"65".
  Tiles/bricks/cement: class "50"-"60".
  
  Medical/pharmaceutical: min class "92.5". Controlled substances: special handling.
  
  Plants/trees (live): NOT standard LTL — note in notes field.

HAZMAT IDENTIFICATION:
  Flag hazmat=true for: lithium batteries, flammable liquids/gases, corrosives,
  explosives, oxidizers, poisons, radioactive, compressed gas.
  Chinese terms: 危险品, 易燃, 腐蚀, 有毒, 锂电池, 压缩气体

══════════════════════════════════════════════════
SECTION 5: LINEAR FOOT & CAPACITY RULES
══════════════════════════════════════════════════
Calculate total linear feet: sum of (each pallet's length_in ÷ 12), assuming pallets placed end-to-end.
If 2 pallets fit side-by-side (each ≤ 48"W, total ≤ 96"W trailer): linear_feet = ceil(pallets / 2) × 4.

If total linear feet > 12: note "Exceeds 12 LF — linear foot pricing may apply."
If total cubic feet > 750 AND density < 6 PCF: note "Cubic capacity rule may apply."
If total weight > 10000 lbs: note "Near FTL threshold — consider full truckload pricing."

══════════════════════════════════════════════════
SECTION 6: ADDRESS RULES
══════════════════════════════════════════════════
- US zip codes: 5-digit strings, zero-padded ("07001", "33032")
- State: always 2-letter US code. Infer from zip if not given. Common: 330xx=FL, 9xxxx=CA, 1xxxx=NY, 7xxxx=TX.
- destinationLocationType:
    "commercial" — company name present, or address contains: suite, unit, warehouse, inc, corp, llc, ave (commercial area)
    "residential" — person name only (no company), or contains: apt, 住宅, street/drive in suburban area
- If doc says 卡派/truck dispatch → usually commercial
- If doc says 快递/express → may be small parcel, note "Express requested — may not need LTL."

══════════════════════════════════════════════════
SECTION 7: OUTPUT
══════════════════════════════════════════════════
For EACH distinct tracking number (外箱单号), produce one shipment entry.
Group all sub-rows under the same tracking number.
Each "item" in items array = one pallet (after palletization).

OUTPUT (strict JSON only, no markdown, no code fences):
{
  "shipments": [
    {
      "trackingNumber": "string or null",
      "cargoDescription": "English description of goods",
      "originCity": "string or null",
      "originState": "2-letter code or null",
      "originZip": "5-digit string or null",
      "destinationCity": "string",
      "destinationState": "2-letter US state code",
      "destinationZip": "5-digit string",
      "destinationLocationType": "commercial or residential",
      "recipientName": "string or null",
      "recipientPhone": "string or null",
      "recipientAddress": "full street address or null",
      "companyName": "string or null",
      "items": [
        {
          "description": "item description with pallet info",
          "weight": 754,
          "length": 48,
          "width": 40,
          "height": 42,
          "pallets": 1,
          "freightClass": "125",
          "stackable": true,
          "hazmat": false
        }
      ],
      "cargoValue": 790.80,
      "pickupDate": "YYYY-MM-DD or null",
      "notes": "All warnings, surcharges, special handling notes here"
    }
  ]
}`;

/**
 * Parse a file buffer using Gemini multimodal API.
 * @param {Buffer} fileBuffer - raw file content
 * @param {string} mimeType - e.g. 'application/pdf', 'image/png'
 * @param {string} originalName - original filename for context
 * @returns {Object} parsed shipments JSON
 */
async function parseFile(fileBuffer, mimeType, originalName) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  let contents;

  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') ||
      originalName?.endsWith('.xlsx') || originalName?.endsWith('.xls') ||
      originalName?.endsWith('.csv')) {
    const textContent = extractExcelText(fileBuffer, originalName);
    contents = [
      { text: PARSE_PROMPT },
      { text: `Document filename: ${originalName}\n\nExtracted spreadsheet content:\n${textContent}` }
    ];
  } else {
    const base64Data = fileBuffer.toString('base64');
    contents = [
      { text: PARSE_PROMPT },
      { text: `Document filename: ${originalName}` },
      { inlineData: { mimeType, data: base64Data } }
    ];
  }

  console.log(`🤖 Gemini: parsing ${originalName} (${mimeType}, ${fileBuffer.length} bytes)`);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const text = response.text || '';
  console.log(`🤖 Gemini response length: ${text.length} chars`);

  try {
    const parsed = JSON.parse(text);
    if (!parsed.shipments || !Array.isArray(parsed.shipments)) {
      throw new Error('Response missing "shipments" array');
    }
    return parsed;
  } catch (parseError) {
    const jsonMatch = text.match(/\{[\s\S]*"shipments"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
  }
}

/**
 * Extract text content from Excel/CSV for Gemini processing.
 */
function extractExcelText(buffer, filename) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      lines.push(`=== Sheet: ${sheetName} ===`);

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      for (const row of rows) {
        const cells = row.map(cell => String(cell).trim()).filter(Boolean);
        if (cells.length > 0) {
          lines.push(cells.join(' | '));
        }
      }
      lines.push('');
    }

    const text = lines.join('\n');
    if (text.length > 50000) {
      return text.substring(0, 50000) + '\n... (truncated)';
    }
    return text;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
}

module.exports = { parseFile };
