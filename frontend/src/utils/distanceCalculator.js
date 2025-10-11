/**
 * Google Maps 距离计算工具
 */

/**
 * 计算两个地址之间的距离
 * @param {string} originAddress - 起始地址
 * @param {string} destinationAddress - 目的地址
 * @returns {Promise<Object>} { distance, distanceMiles, duration }
 */
export const calculateDistance = async (originAddress, destinationAddress) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API未加载'));
      return;
    }

    if (!originAddress || !destinationAddress) {
      reject(new Error('地址不能为空'));
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [originAddress],
      destinations: [destinationAddress],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL, // 英里
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      console.log('🗺️ Distance API响应:', { status, response });
      
      if (status === 'OK') {
        const element = response.rows[0].elements[0];
        if (element.status === 'OK') {
          // 提取距离值（英里）
          const distanceText = element.distance.text; // "1,234 mi"
          const distanceValue = element.distance.value; // 米
          const distanceMiles = distanceValue * 0.000621371; // 转换为英里
          
          resolve({
            distance: distanceText,
            distanceMiles: Math.round(distanceMiles),
            distanceValue: distanceValue,
            duration: element.duration.text,
            durationValue: element.duration.value
          });
        } else {
          reject(new Error(`无法计算距离: ${element.status}`));
        }
      } else {
        reject(new Error(`距离计算失败: ${status}`));
      }
    });
  });
};

/**
 * 从完整地址提取城市和州
 * @param {string} address - 完整地址
 * @returns {Promise<Object>} { city, state, zipcode }
 */
export const extractCityState = async (address) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API未加载'));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addressComponents = results[0].address_components;
        
        let city = '';
        let state = '';
        let zipcode = '';
        
        for (const component of addressComponents) {
          const types = component.types;
          
          if (types.includes('locality')) {
            city = component.long_name;
          }
          
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name; // CA, NY 等
          }
          
          if (types.includes('postal_code')) {
            zipcode = component.long_name;
          }
        }
        
        resolve({ city, state, zipcode });
      } else {
        reject(new Error('无法解析地址'));
      }
    });
  });
};

/**
 * 格式化地址字符串
 * @param {string} address - 详细地址
 * @param {string} city - 城市
 * @param {string} state - 州
 * @param {string} zipcode - 邮编
 * @returns {string} 完整地址
 */
export const formatFullAddress = (address, city, state, zipcode) => {
  const parts = [address, city, state, zipcode].filter(Boolean);
  return parts.join(', ');
};

export default {
  calculateDistance,
  extractCityState,
  formatFullAddress
};

