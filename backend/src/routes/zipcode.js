const express = require('express');
const router = express.Router();

const COMMON_ZIPCODES = {
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '11101': { city: 'Long Island City', state: 'NY' },
  '11201': { city: 'Brooklyn', state: 'NY' },
  '11788': { city: 'Hauppauge', state: 'NY' },
  '11354': { city: 'Flushing', state: 'NY' },
  '90001': { city: 'Los Angeles', state: 'CA' },
  '90007': { city: 'Los Angeles', state: 'CA' },
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '60601': { city: 'Chicago', state: 'IL' },
  '77001': { city: 'Houston', state: 'TX' },
  '85001': { city: 'Phoenix', state: 'AZ' },
  '19101': { city: 'Philadelphia', state: 'PA' },
  '75201': { city: 'Dallas', state: 'TX' },
  '78201': { city: 'San Antonio', state: 'TX' },
  '92101': { city: 'San Diego', state: 'CA' },
  '08601': { city: 'Trenton', state: 'NJ' },
  '07001': { city: 'Newark', state: 'NJ' },
  '33101': { city: 'Miami', state: 'FL' },
  '30301': { city: 'Atlanta', state: 'GA' },
  '98101': { city: 'Seattle', state: 'WA' },
  '02101': { city: 'Boston', state: 'MA' }
};

const stateByPrefix = {
  '00': 'PR', '01': 'MA', '02': 'MA', '03': 'NH', '04': 'ME', '05': 'VT',
  '06': 'CT', '07': 'NJ', '08': 'NJ', '09': 'PR', '10': 'NY', '11': 'NY',
  '12': 'NY', '13': 'NY', '14': 'NY', '15': 'PA', '16': 'PA', '17': 'PA',
  '18': 'PA', '19': 'PA', '20': 'DC', '21': 'MD', '22': 'VA', '23': 'VA',
  '24': 'VA', '25': 'WV', '26': 'WV', '27': 'NC', '28': 'NC', '29': 'SC',
  '30': 'GA', '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL',
  '35': 'AL', '36': 'AL', '37': 'TN', '38': 'TN', '39': 'MS',
  '40': 'KY', '41': 'KY', '42': 'KY', '43': 'OH', '44': 'OH', '45': 'OH',
  '46': 'IN', '47': 'IN', '48': 'MI', '49': 'MI',
  '50': 'IA', '51': 'IA', '52': 'IA', '53': 'WI', '54': 'WI',
  '55': 'MN', '56': 'MN', '57': 'SD', '58': 'ND', '59': 'MT',
  '60': 'IL', '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'MO',
  '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE',
  '70': 'LA', '71': 'LA', '72': 'AR', '73': 'OK', '74': 'OK',
  '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX',
  '80': 'CO', '81': 'CO', '82': 'WY', '83': 'ID', '84': 'UT',
  '85': 'AZ', '86': 'AZ', '87': 'NM', '88': 'NM',
  '89': 'NV', '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA',
  '94': 'CA', '95': 'CA', '96': 'HI', '97': 'OR', '98': 'WA', '99': 'AK'
};

const zipCache = {};

async function lookupZip(zip) {
  const z = String(zip).substring(0, 5);
  if (zipCache[z]) return zipCache[z];
  if (COMMON_ZIPCODES[z]) { zipCache[z] = COMMON_ZIPCODES[z]; return COMMON_ZIPCODES[z]; }

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${z}`);
    if (res.ok) {
      const data = await res.json();
      const place = data.places?.[0];
      if (place) {
        const result = { city: place['place name'], state: place['state abbreviation'] };
        zipCache[z] = result;
        return result;
      }
    }
  } catch (_) { /* ignore */ }

  const prefix = z.substring(0, 2);
  const state = stateByPrefix[prefix] || '';
  return { city: '', state };
}

router.get('/lookup', async (req, res) => {
  const { zip } = req.query;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Valid 5-digit zip required' });
  }
  const result = await lookupZip(zip);
  res.json(result);
});

module.exports = router;
