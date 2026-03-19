/**
 * DAT Equipment Type codes and mapping utilities.
 *
 * DAT classifies equipment into types and classes. The Freight Posting and
 * Search APIs require these codes when creating posts or filtering results.
 *
 * Reference: DAT Developer Portal — Equipment Types
 */

const DAT_EQUIPMENT_TYPES = {
  V:   { code: 'V',   name: 'Van',              class: 'Van' },
  VV:  { code: 'VV',  name: 'Vented Van',       class: 'Van' },
  VA:  { code: 'VA',  name: 'Van - Air Ride',    class: 'Van' },
  VR:  { code: 'VR',  name: 'Van or Reefer',     class: 'Van' },
  VI:  { code: 'VI',  name: 'Van - Insulated',   class: 'Van' },
  VB:  { code: 'VB',  name: 'Van - Blanket Wrap', class: 'Van' },

  R:   { code: 'R',   name: 'Reefer',            class: 'Reefer' },

  F:   { code: 'F',   name: 'Flatbed',           class: 'Flatbed' },
  FA:  { code: 'FA',  name: 'Flatbed - Air Ride', class: 'Flatbed' },
  FM:  { code: 'FM',  name: 'Flatbed - Maxi',    class: 'Flatbed' },
  FS:  { code: 'FS',  name: 'Flatbed - Sides',   class: 'Flatbed' },
  FT:  { code: 'FT',  name: 'Flatbed with Tarps', class: 'Flatbed' },
  FN:  { code: 'FN',  name: 'Flatbed - Conestoga', class: 'Flatbed' },
  FH:  { code: 'FH',  name: 'Flatbed - HotShot',  class: 'Flatbed' },

  SD:  { code: 'SD',  name: 'Step Deck',         class: 'Flatbed' },
  ST:  { code: 'ST',  name: 'Step Deck with Tarps', class: 'Flatbed' },
  SN:  { code: 'SN',  name: 'Step Deck - Conestoga', class: 'Flatbed' },

  DD:  { code: 'DD',  name: 'Double Drop',       class: 'Flatbed' },
  LB:  { code: 'LB',  name: 'Lowboy',            class: 'Flatbed' },
  RGN: { code: 'RGN', name: 'Removable Gooseneck', class: 'Flatbed' },
  MX:  { code: 'MX',  name: 'Maxi Flat / Stretch', class: 'Flatbed' },

  AC:  { code: 'AC',  name: 'Auto Carrier',      class: 'Specialized' },
  CN:  { code: 'CN',  name: 'Container',         class: 'Specialized' },
  DT:  { code: 'DT',  name: 'Dump Trailer',      class: 'Specialized' },
  HB:  { code: 'HB',  name: 'Hopper Bottom',     class: 'Specialized' },
  LA:  { code: 'LA',  name: 'Landoll',           class: 'Specialized' },
  PO:  { code: 'PO',  name: 'Power Only',        class: 'Specialized' },
  TK:  { code: 'TK',  name: 'Tanker',            class: 'Specialized' },
  NU:  { code: 'NU',  name: 'Moving Van / Furniture', class: 'Specialized' },
  CV:  { code: 'CV',  name: 'Cargo Van / Sprinter',   class: 'Specialized' },
  BT:  { code: 'BT',  name: 'B-Train / Double',  class: 'Specialized' },
};

const EQUIPMENT_CLASSES = ['Van', 'Reefer', 'Flatbed', 'Specialized'];

/**
 * Map EW internal truck type / equipment strings to a DAT equipment code.
 * Performs case-insensitive partial matching.
 */
const EW_TO_DAT_MAP = {
  'dry van':       'V',
  'van':           'V',
  'reefer':        'R',
  'refrigerated':  'R',
  'flatbed':       'F',
  'flat bed':      'F',
  'step deck':     'SD',
  'stepdeck':      'SD',
  'double drop':   'DD',
  'lowboy':        'LB',
  'auto carrier':  'AC',
  'container':     'CN',
  'tanker':        'TK',
  'hopper':        'HB',
  'hopper bottom': 'HB',
  'power only':    'PO',
  'conestoga':     'FN',
  'hotshot':       'FH',
  'sprinter':      'CV',
  'cargo van':     'CV',
  'box truck':     'V',
  'dump':          'DT',
  'dump trailer':  'DT',
  'removable gooseneck': 'RGN',
  'rgn':           'RGN',
  'landoll':       'LA',
  'moving van':    'NU',
};

/**
 * Convert an EW truck type string to a DAT equipment code.
 * Returns 'V' (Van) as default when no match is found.
 */
function mapToDATEquipmentCode(ewType) {
  if (!ewType) return 'V';

  const code = String(ewType).toUpperCase();
  if (DAT_EQUIPMENT_TYPES[code]) return code;

  const lower = String(ewType).toLowerCase().trim();
  if (EW_TO_DAT_MAP[lower]) return EW_TO_DAT_MAP[lower];

  for (const [keyword, datCode] of Object.entries(EW_TO_DAT_MAP)) {
    if (lower.includes(keyword)) return datCode;
  }

  return 'V';
}

/**
 * Get the full equipment type object for a DAT code.
 */
function getEquipmentInfo(code) {
  return DAT_EQUIPMENT_TYPES[code] || null;
}

/**
 * List all equipment types, optionally filtered by class.
 */
function listEquipmentTypes(filterClass) {
  const types = Object.values(DAT_EQUIPMENT_TYPES);
  if (!filterClass) return types;
  return types.filter(t => t.class === filterClass);
}

module.exports = {
  DAT_EQUIPMENT_TYPES,
  EQUIPMENT_CLASSES,
  mapToDATEquipmentCode,
  getEquipmentInfo,
  listEquipmentTypes,
};
