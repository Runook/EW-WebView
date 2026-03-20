/**
 * DAT Equipment Type codes and mapping utilities.
 *
 * Official enum from DAT Freight Posting API documentation.
 * These codes are used in freight.equipmentType for posting and searching.
 */

const DAT_EQUIPMENT_TYPES = {
  AC:  { code: 'AC',  name: 'Auto Carrier' },
  C:   { code: 'C',   name: 'Container' },
  CI:  { code: 'CI',  name: 'Container, Insulated' },
  CR:  { code: 'CR',  name: 'Container, Refrigerated' },
  DD:  { code: 'DD',  name: 'Double Drop' },
  LA:  { code: 'LA',  name: 'Drop Deck, Landoll' },
  DT:  { code: 'DT',  name: 'Dump Trailer' },
  F:   { code: 'F',   name: 'Flatbed' },
  FA:  { code: 'FA',  name: 'Flatbed, Air-Ride' },
  BT:  { code: 'BT',  name: 'Flatbed, B-Train' },
  F2:  { code: 'F2',  name: 'Flatbed, Double' },
  FZ:  { code: 'FZ',  name: 'Flatbed, HazMat' },
  FH:  { code: 'FH',  name: 'Flatbed, Hotshot' },
  MX:  { code: 'MX',  name: 'Flatbed, Maxi' },
  FS:  { code: 'FS',  name: 'Flatbed w/Sides' },
  FT:  { code: 'FT',  name: 'Flatbed w/Tarps' },
  FM:  { code: 'FM',  name: 'Flatbed w/Team' },
  FD:  { code: 'FD',  name: 'Flatbed or Step Deck' },
  FR:  { code: 'FR',  name: 'Flatbed/Van/Reefer' },
  FC:  { code: 'FC',  name: 'Flatbed, w/Chains' },
  FO:  { code: 'FO',  name: 'Flatbed, Over Dimension' },
  CN:  { code: 'CN',  name: 'Conestoga' },
  FN:  { code: 'FN',  name: 'Flatbed Conestoga' },
  SN:  { code: 'SN',  name: 'Stepdeck Conestoga' },
  HB:  { code: 'HB',  name: 'Hopper Bottom' },
  LB:  { code: 'LB',  name: 'Lowboy' },
  LO:  { code: 'LO',  name: 'Lowboy, Over Dimension' },
  LR:  { code: 'LR',  name: 'Lowboy or RGN' },
  MV:  { code: 'MV',  name: 'Moving Van' },
  NU:  { code: 'NU',  name: 'Pneumatic' },
  PO:  { code: 'PO',  name: 'Power Only' },
  PT:  { code: 'PT',  name: 'Power Only Towaway' },
  PL:  { code: 'PL',  name: 'Power Only Load Out' },
  R:   { code: 'R',   name: 'Reefer' },
  RA:  { code: 'RA',  name: 'Reefer, Air-Ride' },
  R2:  { code: 'R2',  name: 'Reefer, Double' },
  RZ:  { code: 'RZ',  name: 'Reefer, HazMat' },
  RN:  { code: 'RN',  name: 'Reefer, Intermodal' },
  RL:  { code: 'RL',  name: 'Reefer, Logistics' },
  RM:  { code: 'RM',  name: 'Reefer w/Team' },
  RP:  { code: 'RP',  name: 'Reefer, w/Pallet Exchange' },
  RV:  { code: 'RV',  name: 'Reefer or Vented Van' },
  RG:  { code: 'RG',  name: 'Removable Gooseneck' },
  SD:  { code: 'SD',  name: 'Step Deck' },
  SR:  { code: 'SR',  name: 'Step Deck or RGN' },
  ST:  { code: 'ST',  name: 'Stretch Trailer' },
  TA:  { code: 'TA',  name: 'Tanker, Aluminum' },
  TN:  { code: 'TN',  name: 'Tanker, Intermodal' },
  TS:  { code: 'TS',  name: 'Tanker, Steel' },
  TT:  { code: 'TT',  name: 'Truck and Trailer' },
  V:   { code: 'V',   name: 'Van' },
  VA:  { code: 'VA',  name: 'Van, Air-Ride' },
  VS:  { code: 'VS',  name: 'Van, Conestoga' },
  VC:  { code: 'VC',  name: 'Van, Curtain' },
  V2:  { code: 'V2',  name: 'Van, Double' },
  VZ:  { code: 'VZ',  name: 'Van, HazMat' },
  VH:  { code: 'VH',  name: 'Van, Hotshot' },
  VI:  { code: 'VI',  name: 'Van, Insulated' },
  VN:  { code: 'VN',  name: 'Van, Intermodal' },
  VG:  { code: 'VG',  name: 'Van, Lift-Gate' },
  VL:  { code: 'VL',  name: 'Van, Logistics' },
  OT:  { code: 'OT',  name: 'Van, Open-Top' },
  VB:  { code: 'VB',  name: 'Van, Roller Bed' },
  V3:  { code: 'V3',  name: 'Van, Triple' },
  VV:  { code: 'VV',  name: 'Van, Vented' },
  VM:  { code: 'VM',  name: 'Van w/Team' },
  VT:  { code: 'VT',  name: 'Van or Flatbed w/Tarps' },
  VF:  { code: 'VF',  name: 'Van or Flatbed' },
  VR:  { code: 'VR',  name: 'Van or Reefer' },
  IR:  { code: 'IR',  name: 'Insulated Van or Reefer' },
  VW:  { code: 'VW',  name: 'Van, w/Blanket Wrap' },
  VP:  { code: 'VP',  name: 'Van, w/Pallet Exchange' },
  CV:  { code: 'CV',  name: 'Conveyor' },
  SB:  { code: 'SB',  name: 'Straight Box Truck' },
  SV:  { code: 'SV',  name: 'Sprinter Van' },
  SZ:  { code: 'SZ',  name: 'Sprinter Van Hazmat' },
  SC:  { code: 'SC',  name: 'Sprinter Van Temp-Controlled' },
  SM:  { code: 'SM',  name: 'Sprinter Van Team' },
  BR:  { code: 'BR',  name: 'Straight Box Truck - Reefer' },
  BZ:  { code: 'BZ',  name: 'Straight Box Truck Hazmat' },
};

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
  'container':     'C',
  'tanker':        'TA',
  'hopper':        'HB',
  'hopper bottom': 'HB',
  'power only':    'PO',
  'conestoga':     'CN',
  'hotshot':       'FH',
  'sprinter':      'SV',
  'cargo van':     'SV',
  'box truck':     'SB',
  'straight box':  'SB',
  'dump':          'DT',
  'dump trailer':  'DT',
  'removable gooseneck': 'RG',
  'rgn':           'RG',
  'landoll':       'LA',
  'moving van':    'MV',
  'pneumatic':     'NU',
};

function mapToDATEquipmentCode(ewType) {
  if (!ewType) return 'V';

  const code = String(ewType).toUpperCase().trim();
  if (DAT_EQUIPMENT_TYPES[code]) return code;

  const lower = String(ewType).toLowerCase().trim();
  if (EW_TO_DAT_MAP[lower]) return EW_TO_DAT_MAP[lower];

  for (const [keyword, datCode] of Object.entries(EW_TO_DAT_MAP)) {
    if (lower.includes(keyword)) return datCode;
  }

  return 'V';
}

function getEquipmentInfo(code) {
  return DAT_EQUIPMENT_TYPES[code] || null;
}

function listEquipmentTypes() {
  return Object.values(DAT_EQUIPMENT_TYPES);
}

module.exports = {
  DAT_EQUIPMENT_TYPES,
  mapToDATEquipmentCode,
  getEquipmentInfo,
  listEquipmentTypes,
};
