import { US_ZIP_CODES } from '../data/zipCodes';

// Create a more efficient lookup map from the zip code data
const zipCodeMap = new Map(US_ZIP_CODES.map(item => [item.zip, { lat: item.lat, lng: item.lon }]));

/**
 * Gets the latitude and longitude for a given zip code.
 * This is a fast, local lookup and does not make an API call.
 * @param {string} zip - The 5-digit zip code.
 * @returns {{lat: number, lng: number} | null} The coordinates or null if not found.
 */
export const getCoordsFromZip = (zip) => {
  if (typeof zip !== 'string' || zip.length < 5) {
    return null;
  }
  const cleanZip = zip.substring(0, 5);
  return zipCodeMap.get(cleanZip) || null;
};

/**
 * Extracts a zip code from a full address string.
 * @param {string} address - The address string.
 * @returns {string | null} The 5-digit zip code or null.
 */
export const extractZipCode = (address) => {
  if (typeof address !== 'string') {
    return null;
  }
  // Regex to find a 5-digit zip code in the address string
  const zipMatch = address.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}; 