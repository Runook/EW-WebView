/**
 * Welogx LTL Freight Pricing Service
 *
 * Ported from generate_ltl_calculator.py V3.
 * Implements: NMFC class lookup, CWT rate table, distance factor,
 * deficit weight optimization, FSC, and accessorial charges.
 */

// No external API dependencies -- distance is provided by the frontend
// (Google Distance Matrix is already called in GetQuoteLTL.js)

// ---------------------------------------------------------------------------
// NMFC Density-to-Class table (18 classes, sorted descending by density min)
// Each entry: [class, densityMin, densityMax]
// ---------------------------------------------------------------------------
const NMFC_CLASS_TABLE = [
  { cls: 50,   dMin: 50,   dMax: Infinity },
  { cls: 55,   dMin: 35,   dMax: 50 },
  { cls: 60,   dMin: 30,   dMax: 35 },
  { cls: 65,   dMin: 22.5, dMax: 30 },
  { cls: 70,   dMin: 15,   dMax: 22.5 },
  { cls: 77.5, dMin: 13.5, dMax: 15 },
  { cls: 85,   dMin: 12,   dMax: 13.5 },
  { cls: 92.5, dMin: 10.5, dMax: 12 },
  { cls: 100,  dMin: 9,    dMax: 10.5 },
  { cls: 110,  dMin: 8,    dMax: 9 },
  { cls: 125,  dMin: 7,    dMax: 8 },
  { cls: 150,  dMin: 6,    dMax: 7 },
  { cls: 175,  dMin: 4,    dMax: 6 },
  { cls: 200,  dMin: 3,    dMax: 4 },
  { cls: 250,  dMin: 2,    dMax: 3 },
  { cls: 300,  dMin: 1,    dMax: 2 },
  { cls: 400,  dMin: 0.5,  dMax: 1 },
  { cls: 500,  dMin: 0,    dMax: 0.5 },
];

// ---------------------------------------------------------------------------
// CWT Rate Table — market-level net rates ($/CWT)
// Columns: [minCharge, <500, 500, 1M, 2M, 5M, 10M, 20M]
// ---------------------------------------------------------------------------
const CWT_RATES = {
  50:   [65,  42.00, 28.00, 19.00, 13.00,  8.50,  6.20,  4.50],
  55:   [70,  43.35, 29.06, 20.00, 13.76,  9.09,  6.63,  4.82],
  60:   [75,  44.71, 30.12, 21.00, 14.53,  9.68,  7.06,  5.14],
  65:   [80,  46.06, 31.18, 22.00, 15.29, 10.50,  7.49,  5.45],
  70:   [85,  47.41, 32.24, 23.00, 16.06, 10.85,  7.92,  5.77],
  77.5: [90,  48.76, 33.29, 24.00, 16.82, 11.44,  8.35,  6.09],
  85:   [95,  50.12, 34.35, 25.00, 17.59, 12.03,  8.78,  6.41],
  92.5: [100, 51.47, 35.41, 26.00, 18.35, 12.62,  9.21,  6.72],
  100:  [105, 52.82, 36.47, 27.00, 19.12, 13.21,  9.64,  7.04],
  110:  [110, 54.18, 37.53, 28.00, 19.88, 13.79, 10.06,  7.36],
  125:  [115, 55.53, 38.59, 29.00, 20.65, 14.38, 10.49,  7.68],
  150:  [120, 56.88, 39.65, 30.00, 21.41, 14.97, 10.92,  7.99],
  175:  [125, 58.24, 40.71, 31.00, 22.18, 15.56, 11.35,  8.31],
  200:  [130, 59.59, 41.76, 32.00, 22.94, 16.15, 11.78,  8.63],
  250:  [135, 52.00, 42.82, 33.00, 23.71, 16.74, 12.21,  8.95],
  300:  [140, 62.29, 43.88, 34.00, 24.47, 17.32, 12.64,  9.26],
  400:  [145, 63.65, 44.94, 35.00, 25.24, 17.91, 13.07,  9.58],
  500:  [150, 65.00, 46.00, 36.00, 26.00, 18.50, 13.50,  9.90],
};

// Weight-break minimum weights (index 0 = minCharge, 1 = <500, etc.)
const WB_MINS = [0, 0, 500, 1000, 2000, 5000, 10000, 20000];

// ---------------------------------------------------------------------------
// Distance factor bands
// ---------------------------------------------------------------------------
const DIST_BANDS = [
  { lo: 0,    hi: 250,  factor: 0.90 },
  { lo: 251,  hi: 500,  factor: 0.95 },
  { lo: 501,  hi: 1000, factor: 1.00 },
  { lo: 1001, hi: 1500, factor: 1.08 },
  { lo: 1501, hi: 2000, factor: 1.20 },
  { lo: 2001, hi: 2500, factor: 1.35 },
  { lo: 2501, hi: 3000, factor: 1.50 },
  { lo: 3001, hi: 99999, factor: 1.65 },
];

// ---------------------------------------------------------------------------
// FSC lookup by DOE diesel price ($/gal)
// ---------------------------------------------------------------------------
const DEFAULT_FSC_PCT = 0.2975;

const FSC_LOOKUP = [
  { lo: 2.50, hi: 2.75, pct: 0.18 },
  { lo: 2.75, hi: 3.00, pct: 0.20 },
  { lo: 3.00, hi: 3.25, pct: 0.22 },
  { lo: 3.25, hi: 3.50, pct: 0.24 },
  { lo: 3.50, hi: 3.75, pct: 0.2675 },
  { lo: 3.75, hi: 4.00, pct: 0.2975 },
  { lo: 4.00, hi: 4.25, pct: 0.32 },
  { lo: 4.25, hi: 4.50, pct: 0.34 },
  { lo: 4.50, hi: 4.75, pct: 0.36 },
  { lo: 4.75, hi: 5.00, pct: 0.38 },
  { lo: 5.00, hi: 5.50, pct: 0.41 },
  { lo: 5.50, hi: 6.00, pct: 0.44 },
];

// ---------------------------------------------------------------------------
// Accessorial rates: [name, low, high, default, per, scaleByWeight]
// ---------------------------------------------------------------------------
const ACCESSORIAL_RATES = {
  residential_pickup:   { low: 35,  high: 85,  dflt: 35,  per: 'shipment', scale: true },
  residential_delivery: { low: 35,  high: 85,  dflt: 35,  per: 'shipment', scale: true },
  liftgate_pickup:      { low: 35,  high: 75,  dflt: 35,  per: 'shipment', scale: true },
  liftgate_delivery:    { low: 35,  high: 75,  dflt: 35,  per: 'shipment', scale: true },
  inside_pickup:        { low: 75,  high: 125, dflt: 75,  per: 'shipment', scale: true },
  inside_delivery:      { low: 75,  high: 125, dflt: 75,  per: 'shipment', scale: true },
  limited_access_pickup:  { low: 75,  high: 150, dflt: 75,  per: 'shipment', scale: true },
  limited_access_delivery:{ low: 75,  high: 150, dflt: 75,  per: 'shipment', scale: true },
  appointment:          { low: 15,  high: 50,  dflt: 25,  per: 'shipment', scale: false },
  hazmat:               { low: 50,  high: 200, dflt: 100, per: 'shipment', scale: false },
  notify:               { low: 10,  high: 35,  dflt: 15,  per: 'shipment', scale: false },
  construction_site:    { low: 75,  high: 150, dflt: 75,  per: 'shipment', scale: true },
  trade_show:           { low: 75,  high: 150, dflt: 75,  per: 'shipment', scale: true },
};

// Map from frontend service codes to our accessorial keys
const SERVICE_CODE_MAP = {
  'lift_gate':           'liftgate',
  'liftgate':            'liftgate',
  'inside_delivery':     'inside_delivery',
  'inside_pickup':       'inside_pickup',
  'appointment_delivery':'appointment',
  'appointment':         'appointment',
  'residential':         'residential',
  'limited_access':      'limited_access',
  'hazmat':              'hazmat',
  'notify':              'notify',
  'construction':        'construction_site',
  'trade_show':          'trade_show',
};

// ---------------------------------------------------------------------------
// Core calculation functions
// ---------------------------------------------------------------------------

/**
 * Determine NMFC freight class from density (lbs/ft³)
 */
function densityToClass(density) {
  for (const entry of NMFC_CLASS_TABLE) {
    if (density >= entry.dMin) return entry.cls;
  }
  return 500;
}

/**
 * Calculate total density and auto-class from a list of cargo items.
 * Each item: { weight, length, width, height, pallets, freightClass }
 * weight = total weight for this line item (all pallets combined), dimensions = per pallet
 */
function calculateDensityAndClass(items) {
  let totalWeight = 0;
  let totalCuFt = 0;

  for (const item of items) {
    const pallets = parseInt(item.pallets) || 1;
    const itemWeight = parseFloat(item.weight) || 0;
    const l = parseFloat(item.length) || 48;
    const w = parseFloat(item.width) || 40;
    const h = parseFloat(item.height) || 48;

    const cuFtPerUnit = (l * w * h) / 1728;
    const itemTotalCuFt = cuFtPerUnit * pallets;

    totalWeight += itemWeight;
    totalCuFt += itemTotalCuFt;
  }

  const density = totalCuFt > 0 ? totalWeight / totalCuFt : 0;
  const autoClass = densityToClass(density);

  return { totalWeight, totalCuFt, density, autoClass };
}

/**
 * Determine the weight-break tier index (1-7) for a given total weight.
 * Index 0 = minCharge (handled separately), 1 = <500, 2 = 500, ... 7 = 20M
 */
function getWeightBreakIndex(totalWeight) {
  if (totalWeight < 500) return 1;
  if (totalWeight < 1000) return 2;
  if (totalWeight < 2000) return 3;
  if (totalWeight < 5000) return 4;
  if (totalWeight < 10000) return 5;
  if (totalWeight < 20000) return 6;
  return 7;
}

/**
 * Look up CWT rate for a given class and weight-break index
 */
function lookupCWTRate(freightClass, tierIndex) {
  const rates = CWT_RATES[freightClass];
  if (!rates) return null;
  return rates[tierIndex];
}

/**
 * Get distance factor from miles
 */
function getDistanceFactor(miles) {
  for (const band of DIST_BANDS) {
    if (miles >= band.lo && miles <= band.hi) return band.factor;
  }
  return 1.0;
}

/**
 * Deficit weight optimization: test all 7 weight-break tiers and pick the
 * one that yields the lowest total linehaul cost.
 */
function calculateDeficitOptimized(freightClass, totalWeight, distFactor) {
  const rates = CWT_RATES[freightClass];
  if (!rates) return { cost: 0, tierUsed: -1, billableCWT: 0 };

  let bestCost = Infinity;
  let bestTier = -1;
  let bestCWT = 0;

  // Tier indices 1..7 (skip 0 = minCharge, that's checked separately)
  for (let ti = 1; ti <= 7; ti++) {
    const tierMinWeight = WB_MINS[ti];
    const effectiveWeight = Math.max(totalWeight, tierMinWeight);
    const billableCWT = effectiveWeight / 100;
    const cwtRate = rates[ti];
    const cost = billableCWT * cwtRate * distFactor;

    if (cost < bestCost) {
      bestCost = cost;
      bestTier = ti;
      bestCWT = billableCWT;
    }
  }

  return { cost: bestCost, tierUsed: bestTier, billableCWT: bestCWT };
}

/**
 * Estimate transit days from distance
 */
function estimateTransitDays(miles) {
  if (miles <= 250) return 2;
  if (miles <= 500) return 3;
  if (miles <= 1000) return 4;
  if (miles <= 1500) return 5;
  if (miles <= 2000) return 7;
  if (miles <= 2500) return 8;
  return 10;
}

/**
 * Calculate accessorial charges based on selected services and total weight.
 * Accepts pickup/delivery services from the frontend and location types.
 */
function calculateAccessorials(pickupServices, deliveryServices, originType, destinationType, totalWeight) {
  let total = 0;
  const details = [];

  const allServices = new Set();

  // Map frontend service codes
  if (pickupServices) {
    for (const svc of pickupServices) {
      const mapped = SERVICE_CODE_MAP[svc];
      if (mapped) allServices.add(`${mapped}_pickup`);
    }
  }
  if (deliveryServices) {
    for (const svc of deliveryServices) {
      const mapped = SERVICE_CODE_MAP[svc];
      if (mapped) allServices.add(`${mapped}_delivery`);
    }
  }

  // Auto-add residential based on location types
  if (originType === 'residential') allServices.add('residential_pickup');
  if (destinationType === 'residential') allServices.add('residential_delivery');

  for (const key of allServices) {
    const rate = ACCESSORIAL_RATES[key];
    if (!rate) continue;

    let charge;
    if (rate.scale && totalWeight > 0) {
      const weightRatio = Math.min(1, Math.max(0, (totalWeight - 500) / 4500));
      charge = rate.low + (rate.high - rate.low) * weightRatio;
    } else {
      charge = rate.dflt;
    }

    charge = Math.round(charge * 100) / 100;
    total += charge;
    details.push({ name: key, charge });
  }

  return { total: Math.round(total * 100) / 100, details };
}

// ---------------------------------------------------------------------------
// Distance fallback — rough estimate from ZIP prefix when frontend doesn't
// provide the Google-calculated distance
// ---------------------------------------------------------------------------

function estimateDistanceFromZips(originZip, destZip) {
  const o = parseInt(String(originZip).substring(0, 3)) || 0;
  const d = parseInt(String(destZip).substring(0, 3)) || 0;
  const est = Math.abs(o - d) * 5;
  return Math.max(est, 100);
}

// ---------------------------------------------------------------------------
// Main quote calculation
// ---------------------------------------------------------------------------

function calculateQuote(quoteData) {
  const {
    originZip,
    destinationZip,
    distanceMiles: frontendDistance,
    items,
    pickupServices,
    deliveryServices,
    originType,
    destinationType,
  } = quoteData;

  // 1. Calculate totals, density, auto class
  const { totalWeight, totalCuFt, density, autoClass } = calculateDensityAndClass(items);

  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  // Use the freight class from items if provided, otherwise auto-calculated
  const firstItemClass = parseFloat(items[0]?.freightClass);
  const freightClass = firstItemClass && CWT_RATES[firstItemClass] ? firstItemClass : autoClass;

  // 2. Distance — use the value already calculated by Google Maps on the frontend
  let distanceMiles = frontendDistance;
  if (!distanceMiles || distanceMiles <= 0) {
    distanceMiles = estimateDistanceFromZips(originZip, destinationZip);
    console.log(`📏 Using ZIP fallback distance: ${distanceMiles} miles`);
  }

  const distFactor = getDistanceFactor(distanceMiles);

  // 3. Deficit-optimized linehaul
  const { cost: optimizedLinehaul, tierUsed, billableCWT } =
    calculateDeficitOptimized(freightClass, totalWeight, distFactor);

  // Minimum charge
  const minCharge = CWT_RATES[freightClass]?.[0] || 65;

  // Base linehaul = max of optimized cost and minimum charge
  const baseLinehaul = Math.max(optimizedLinehaul, minCharge);

  // 4. FSC
  const fscPct = DEFAULT_FSC_PCT;
  const fuelSurcharge = Math.round(baseLinehaul * fscPct * 100) / 100;

  // 5. Accessorials
  const accessorials = calculateAccessorials(
    pickupServices, deliveryServices, originType, destinationType, totalWeight
  );

  // 6. Grand total
  const grandTotal = Math.round((baseLinehaul + fuelSurcharge + accessorials.total) * 100) / 100;

  // 7. Transit estimate
  const transitDays = estimateTransitDays(distanceMiles);

  // Actual CWT rate used (for the chosen tier)
  const baseCWTRate = lookupCWTRate(freightClass, tierUsed) || 0;
  const adjustedCWTRate = Math.round(baseCWTRate * distFactor * 100) / 100;

  return {
    carrier: 'EW Logistics',
    carrierCode: 'WELOGX',
    quoteId: `WLX-${Date.now()}`,
    netCharge: grandTotal,
    transitDays,
    serviceType: 'EW Logistics Standard LTL',
    fuelSurcharge,
    distanceMiles,
    distanceFactor: distFactor,
    freightClass,
    totalWeight: Math.round(totalWeight),
    totalCuFt: Math.round(totalCuFt * 100) / 100,
    density: Math.round(density * 100) / 100,
    breakdown: {
      baseCWT: baseCWTRate,
      adjustedCWT: adjustedCWTRate,
      billableCWT: Math.round(billableCWT * 100) / 100,
      baseLinehaul: Math.round(baseLinehaul * 100) / 100,
      fuelSurcharge,
      fscPct,
      accessorials: accessorials.total,
      accessorialDetails: accessorials.details,
      minimumCharge: minCharge,
      grandTotal,
    },
  };
}

module.exports = {
  calculateQuote,
  calculateDensityAndClass,
  densityToClass,
  getDistanceFactor,
  calculateDeficitOptimized,
  calculateAccessorials,
  estimateTransitDays,
  estimateDistanceFromZips,
};
