/**
 * Gemini API Service for parsing customer shipment files (PDF/Excel/images).
 * Extracts structured LTL quote parameters using multimodal AI.
 */

const { GoogleGenAI } = require('@google/genai');
const XLSX = require('xlsx');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PARSE_PROMPT = `You are an expert freight logistics data extractor. Analyze the uploaded document (customer inquiry for LTL freight shipping) and extract ALL shipment records into structured JSON.

IMPORTANT RULES:
- One document may contain MULTIPLE shipments (rows). Extract every one.
- Weights: convert to lbs. If given in kg, multiply by 2.20462.
- Dimensions: convert to inches. If given in cm, divide by 2.54.
- If a shipment has multiple boxes/pallets with different dimensions, list each as a separate item in the "items" array.
- If origin info is missing, leave origin fields as null.
- Zip codes must be strings, zero-padded to 5 digits (e.g. "07001").
- freightClass: calculate from density (weight_per_pallet / cubic_feet). Use NMFC table:
    >=50 pcf -> "50", >=35 -> "55", >=30 -> "60", >=22.5 -> "65", >=15 -> "70",
    >=13.5 -> "77.5", >=12 -> "85", >=10.5 -> "92.5", >=9 -> "100", >=8 -> "110",
    >=7 -> "125", >=6 -> "150", >=5 -> "175", >=4 -> "200", >=3 -> "250",
    >=2 -> "300", >=1 -> "400", <1 -> "500".
  If you cannot determine density, use "70" as default.
- destinationLocationType: "commercial" or "residential". Infer from context.
- The document may be in Chinese, English, or mixed. Handle both.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "shipments": [
    {
      "trackingNumber": "string or null",
      "cargoDescription": "brief description in English",
      "originCity": "string or null",
      "originState": "2-letter US state code or null",
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
          "description": "item description",
          "weight": 500,
          "length": 48,
          "width": 40,
          "height": 48,
          "pallets": 1,
          "freightClass": "85",
          "stackable": true,
          "hazmat": false
        }
      ],
      "cargoValue": 0,
      "pickupDate": "YYYY-MM-DD or null",
      "notes": "any special instructions"
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
