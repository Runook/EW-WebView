/**
 * Gemini API Service for parsing customer shipment files (PDF/Excel/images).
 * Extracts structured LTL quote parameters using multimodal AI.
 */

const { GoogleGenAI } = require('@google/genai');
const XLSX = require('xlsx');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PARSE_PROMPT = `You are an expert US LTL freight logistics analyst. Parse customer shipment documents and produce structured JSON for LTL carrier quoting.

═══════════════════════════════════════════
1. DOCUMENT FORMAT UNDERSTANDING
═══════════════════════════════════════════
Documents come from Chinese freight forwarders. Common patterns:
- HEADER ROW: 包装类型|外箱单号|派送方式|中文品名|英文品名|价值|邮编|城市|收件人|电话|地址|箱数|尺寸箱数|实重(KG)|方数|长(CM)|宽(CM)|高(CM)|地址类型
- MAIN ROW: contains all shipment info (tracking#, address, first box dimensions)
- SUB-ROWS: additional boxes for the SAME shipment (only dimension/weight columns filled)
- PICKUP ADDRESS: often at the bottom of the file (提货地址/仓库地址), applies to ALL shipments
- FILE TITLE may indicate service type: 整车=FTL, 一提N卸=1 pickup N drop-offs

Key Chinese terms:
  托/托盘 = pallet, 木箱 = wood crate, 卡脚 = skid/pallet feet, 纸箱 = carton
  卡派 = truck delivery (LTL), 快递 = express/parcel, 专车 = dedicated FTL
  住宅/residential, 商业/commercial, 尾板 = liftgate, 没有卸货平台 = no dock

═══════════════════════════════════════════
2. UNIT CONVERSION (always output in US imperial)
═══════════════════════════════════════════
- Weight: kg × 2.20462 = lbs. Add 40 lbs per pallet for pallet weight.
- Dimensions: cm ÷ 2.54 = inches. Round to nearest integer.
- Volume: (L_in × W_in × H_in) ÷ 1728 = cubic feet

═══════════════════════════════════════════
3. PALLETIZATION RULES (critical for LTL quoting)
═══════════════════════════════════════════
Standard US pallet: 48"L × 40"W (122cm × 102cm), pallet itself ~6" tall, ~40 lbs.

FOR LOOSE CARTONS/BOXES — calculate pallets:
  Step 1: Boxes per layer = floor(48 / box_L_in) × floor(40 / box_W_in).
           Also try 90° rotation: floor(48 / box_W_in) × floor(40 / box_L_in).
           Use whichever orientation fits more boxes.
  Step 2: Max cargo height = 48" for stackable freight, 72" for non-stackable.
           Layers = floor(max_cargo_height / box_H_in).
  Step 3: Boxes per pallet = boxes_per_layer × layers.
  Step 4: Number of pallets = ceil(total_boxes / boxes_per_pallet).
  Step 5: Each pallet weight = (per_box_weight × boxes_on_this_pallet) + 40 lbs pallet weight.
  Step 6: Pallet dimensions = 48"L × 40"W × (box_H_in × layers + 6)" H.
  
  WEIGHT LIMIT: Max 2500 lbs per pallet. If exceeded, reduce boxes per pallet.
  HEIGHT LIMIT: Max 84" total (including 6" pallet). If exceeded, reduce layers.

FOR WOOD CRATES / SKIDS (木箱/卡脚):
  Each crate counts as 1 pallet unit. Use the crate's actual dimensions.
  Weight = crate weight (no extra pallet weight needed, crate has its own base).

FOR ALREADY-PALLETIZED ITEMS (packaging says "托" or pallet notation like "1/2 2/2托"):
  The "X/Y" notation means "pallet X of Y total pallets" for this shipment.
  If packaging says "1/2 2/2 托", it means 2 pallets total.
  Use the total box count and dimensions to distribute across the stated pallet count.

STACKABILITY RULES:
  - stackable = true if: pallet height ≤ 48", goods are sturdy (machinery, metal, furniture frames)
  - stackable = false if: height > 48", fragile goods, irregular shape, "不可堆叠" noted
  - Wood crates/heavy equipment: generally NOT stackable

═══════════════════════════════════════════
4. NMFC FREIGHT CLASS (2025 density-based rules)
═══════════════════════════════════════════
Density = total_pallet_weight_lbs ÷ total_cubic_feet
(Use the PALLET dimensions for volume, not individual box dimensions)

PCF → Class mapping:
  ≥50 → "50"    ≥35 → "55"    ≥30 → "60"    ≥22.5 → "65"
  ≥15 → "70"    ≥13.5 → "77.5" ≥12 → "85"    ≥10.5 → "92.5"
  ≥9 → "100"    ≥8 → "110"    ≥7 → "125"    ≥6 → "150"
  ≥4 → "175"    ≥2 → "250"    ≥1 → "300"    <1 → "400"

If density cannot be determined, default to "70".

═══════════════════════════════════════════
5. ADDRESS AND LOCATION RULES
═══════════════════════════════════════════
- US zip codes: 5-digit strings, zero-padded (e.g. "07001", "33032")
- State: 2-letter US code (FL, CA, TX, NY...)
- Infer state from zip code if not explicitly given
- destinationLocationType: 
    "commercial" if company name present, address has suite/unit/warehouse/inc/corp/llc
    "residential" if appears to be home address, has "apt", "住宅" mentioned, or person name only
- If file says "卡派" (truck delivery), it's likely commercial unless stated otherwise
- If file says "快递" (express), check — may not need LTL quote (note this in notes field)

═══════════════════════════════════════════
6. OUTPUT STRUCTURE
═══════════════════════════════════════════
For EACH distinct destination (unique tracking number / 外箱单号), produce one shipment.
Group all boxes/sub-rows under the same tracking number into one shipment.

Each "item" in the items array = one pallet (after palletization calculation).
  weight = total weight ON that pallet (in lbs, including ~40 lbs pallet weight)
  length/width/height = pallet footprint and stacked height (in inches)
  pallets = 1 (each item entry represents one pallet)
  freightClass = calculated from density of THIS pallet

OUTPUT FORMAT (strict JSON, no markdown, no code fences):
{
  "shipments": [
    {
      "trackingNumber": "GXUS776236",
      "cargoDescription": "Plastic Chairs",
      "originCity": "City of Industry",
      "originState": "CA",
      "originZip": "91744",
      "destinationCity": "Homestead",
      "destinationState": "FL",
      "destinationZip": "33032",
      "destinationLocationType": "residential",
      "recipientName": "John Smith",
      "recipientPhone": "786-781-3977",
      "recipientAddress": "11365 SW 233rd Street",
      "companyName": null,
      "items": [
        {
          "description": "Plastic Chairs - Pallet 1 of 2 (12 cartons 44x13x19in)",
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
      "pickupDate": null,
      "notes": "Express delivery requested (快递). 22 cartons total on 2 pallets."
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
