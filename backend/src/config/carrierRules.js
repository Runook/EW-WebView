/**
 * Carrier rules, restrictions, and pricing notes.
 * Used by AI parsing, quote validation, and frontend display.
 */

const CARRIER_RULES = {
  'AAA Cooper': {
    ratingType: 'NMFC',
    maxPalletWeight: 2500,
    liabilityPerLb: 1.00,
    overlengthLiability: 0.50,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: ['firearms', 'tobacco', 'vapes'],
    notes: 'NMFC must be entered to validate rate. Legal liability $1.00/lb; overlength items reduced to $0.50/lb.',
    amazonApproved: false,
    dropTrailer: false,
  },
  'ABF LTL': {
    ratingType: 'density',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: ['vaping products', 'tobacco', 'guns/ammo into Canada'],
    notes: 'Dynamic density based rating, NMFC not as important. Also known as ABF Dynamic.',
    amazonApproved: true,
    dropTrailer: false,
    specialNote: 'Currently in collections (~$20k). Amazon approved carrier for live-unload.',
  },
  'ABF Volume': {
    ratingType: 'NMFC',
    maxPalletWeight: 2500,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: 15000,
    maxLinearFeet: 27,
    maxPallets: null,
    prohibited: ['vaping products', 'tobacco', 'guns/ammo into Canada'],
    notes: 'Any dimension over 95" subject to surcharge. Quote invalid if >27ft space or >15,000 lbs. On odd handling units, contact LTL rate support for better rates.',
    amazonApproved: true,
    dropTrailer: false,
  },
  'R&L Carriers': {
    ratingType: 'NMFC',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: 12000,
    maxLinearFeet: 12,
    maxPallets: null,
    prohibited: [],
    notes: 'Valid up to 12,000 lbs and 12ft of trailer space.',
    amazonApproved: false,
    dropTrailer: false,
  },
  'RRTS LTL': {
    ratingType: 'NMFC',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: [],
    notes: 'Class based on total shipment density, not each individual line.',
    amazonApproved: false,
    dropTrailer: true,
    specialNote: 'Has Amazon drop trailer access but limited location list.',
  },
  'RRTS Spot': {
    ratingType: 'density',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: [],
    notes: 'Density based, lower prices via NMFC. Limitations based on cubic ft cap, not weight or pallet amount (possible stacking).',
    amazonApproved: false,
    dropTrailer: false,
  },
  'TForce': {
    ratingType: 'density',
    maxPalletWeight: 3500,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: 20000,
    maxLinearFeet: 15,
    maxPallets: null,
    prohibited: ['firearms', 'vaping products'],
    notes: 'Density based tariff. No quote valid if >20,000 lbs or >15ft space. Liftgate auto-assessed for residential/limited access. Can drop at Amazon FBAs, drop trailer available.',
    amazonApproved: true,
    dropTrailer: true,
    liftgateAuto: true,
  },
  'SAIA': {
    ratingType: 'NMFC',
    maxPalletWeight: 2500,
    liabilityPerLb: null,
    quoteValidity: '2 days',
    maxWeight: null,
    maxLinearFeet: 10,
    maxPallets: 6,
    prohibited: ['hemp', 'THC', 'CBD'],
    notes: 'NMFC must be entered. Quotes only valid 2 days. Max 6 pallet positions or 10ft space. Lumper fees at grocery warehouses. Cubic capacity surcharge: 350-749 cuft with <4 PCF, or ≥750 cuft with <6 PCF. Liftgate auto-applied if personnel unloads by hand. All residential must have liftgate.',
    amazonApproved: true,
    dropTrailer: true,
    liftgateAuto: true,
  },
  'STG': {
    ratingType: 'NMFC',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: 12000,
    maxLinearFeet: 12,
    maxPallets: 6,
    prohibited: [],
    notes: 'LTL: max 6 pallets, 12 linear feet, 12k lbs. Volume shipments need quote via email.',
    amazonApproved: false,
    dropTrailer: false,
  },
  'EDI Express': {
    ratingType: 'density',
    maxPalletWeight: null,
    liabilityPerLb: 2.50,
    quoteValidity: '5 business days',
    maxWeight: null,
    maxLinearFeet: 12,
    maxPallets: 6,
    prohibited: ['hazmat'],
    notes: 'Residential must include appointment or quote voided. Max release value $2.50/lb ($0.10/lb for furniture). Up to 6 pallets, 12 feet. No inside delivery, no lumper, no grocery locations, no Amazon. Max liftgate pallet: 48×72×72, max 2k lbs.',
    amazonApproved: false,
    dropTrailer: false,
    furnitureLiability: 0.10,
  },
  'WARP': {
    ratingType: 'flat_rate_per_pallet',
    maxPalletWeight: 2000,
    liabilityPerLb: 2.50,
    maxLiabilityPerUnit: 1000,
    quoteValidity: '72 hours',
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: [],
    notes: 'Flat rate per pallet. Included: appointment, residential, liftgate, limited access. Max pallet 48×48×85" under 2000 lbs; exceeding = additional pallet. Pickup cutoff 1pm. Cancellation <2hrs before = TONU fee. NMFC not needed (own density calculator). Liability $2.50/lb max $1000 per handling unit.',
    amazonApproved: false,
    dropTrailer: false,
    includedServices: ['appointment', 'residential', 'liftgate', 'limited_access'],
  },
  'Estes': {
    ratingType: 'NMFC',
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: [],
    notes: 'Amazon approved carrier for live-unload. Currently not giving accounts to brokers.',
    amazonApproved: true,
    dropTrailer: false,
    specialNote: 'Not currently available — not giving accounts to brokers.',
  },
  'Forward Air': {
    ratingType: null,
    maxPalletWeight: null,
    liabilityPerLb: null,
    quoteValidity: null,
    maxWeight: null,
    maxLinearFeet: null,
    maxPallets: null,
    prohibited: [],
    notes: 'Account requires $5000 secured credit line deposit.',
    amazonApproved: false,
    dropTrailer: false,
    specialNote: 'Need $5000 deposit for account.',
  },
};

/**
 * Match a carrier name from quote results to our rules database.
 * Handles partial matches and common aliases.
 */
function getCarrierRules(carrierName) {
  if (!carrierName) return null;
  const name = carrierName.toLowerCase().trim();

  for (const [key, rules] of Object.entries(CARRIER_RULES)) {
    if (name === key.toLowerCase()) return { name: key, ...rules };
  }

  const ALIASES = {
    'aaa cooper': 'AAA Cooper',
    'aaa cooper transportation': 'AAA Cooper',
    'abf': 'ABF LTL',
    'abf freight': 'ABF LTL',
    'abf dynamic': 'ABF LTL',
    'abf vol': 'ABF Volume',
    'r+l': 'R&L Carriers',
    'r+l carriers': 'R&L Carriers',
    'rl carriers': 'R&L Carriers',
    'rrts': 'RRTS LTL',
    'roadrunner': 'RRTS LTL',
    'tforce': 'TForce',
    'tforce freight': 'TForce',
    'tforce ltl': 'TForce',
    't-force': 'TForce',
    'saia': 'SAIA',
    'saia ltl': 'SAIA',
    'stg': 'STG',
    'stg logistics': 'STG',
    'edi': 'EDI Express',
    'edi express': 'EDI Express',
    'warp': 'WARP',
    'estes': 'Estes',
    'estes express': 'Estes',
    'forward air': 'Forward Air',
  };

  for (const [alias, key] of Object.entries(ALIASES)) {
    if (name.includes(alias)) {
      const rules = CARRIER_RULES[key];
      if (rules) return { name: key, ...rules };
    }
  }

  return null;
}

/**
 * Generate a text summary of carrier rules for AI prompts.
 */
function getCarrierRulesPromptText() {
  const lines = ['CARRIER-SPECIFIC RULES AND RESTRICTIONS:'];
  for (const [name, r] of Object.entries(CARRIER_RULES)) {
    lines.push(`\n${name}:`);
    lines.push(`  Rating: ${r.ratingType || 'unknown'}`);
    if (r.maxPalletWeight) lines.push(`  Max pallet weight: ${r.maxPalletWeight} lbs`);
    if (r.maxWeight) lines.push(`  Max shipment weight: ${r.maxWeight} lbs`);
    if (r.maxLinearFeet) lines.push(`  Max linear feet: ${r.maxLinearFeet} ft`);
    if (r.maxPallets) lines.push(`  Max pallets: ${r.maxPallets}`);
    if (r.quoteValidity) lines.push(`  Quote validity: ${r.quoteValidity}`);
    if (r.prohibited.length > 0) lines.push(`  Prohibited: ${r.prohibited.join(', ')}`);
    if (r.amazonApproved) lines.push(`  Amazon approved: YES`);
    if (r.dropTrailer) lines.push(`  Drop trailer: YES`);
    lines.push(`  Notes: ${r.notes}`);
  }
  return lines.join('\n');
}

module.exports = { CARRIER_RULES, getCarrierRules, getCarrierRulesPromptText };
