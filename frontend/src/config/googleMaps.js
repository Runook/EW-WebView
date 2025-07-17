// Google Maps API 配置
// 请在此处添加您的 Google Maps API Key
export const GOOGLE_MAPS_CONFIG = {
  // 🔑 从环境变量读取 Google Maps API Key，如果没有则使用默认值
  API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE',
  
  // Google Maps 库配置
  LIBRARIES: ['places', 'geometry'],
  
  // 地图默认配置
  DEFAULT_CENTER: {
    lat: 39.8283, // 美国中心位置
    lng: -98.5795
  },
  
  // 地图样式选项
  MAP_OPTIONS: {
    zoom: 4,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    gestureHandling: 'cooperative'
  },

  // 地址搜索配置
  AUTOCOMPLETE_OPTIONS: {
    componentRestrictions: { country: 'us' },
    fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
    types: ['address']
  }
};

// API Key 验证函数
export const validateApiKey = () => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps API Key 未设置');
    console.warn('💡 请设置环境变量 REACT_APP_GOOGLE_MAPS_API_KEY 或在配置文件中添加API Key');
    return false;
  }
  
  if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.error('❌ 请替换默认的 Google Maps API Key');
    return false;
  }
  
  if (apiKey.length < 30) {
    console.error('❌ Google Maps API Key 格式不正确，长度过短');
    return false;
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.error('❌ Google Maps API Key 格式不正确，应以 "AIza" 开头');
    return false;
  }
  
  console.log('✅ API Key 格式验证通过:', apiKey.substring(0, 10) + '...');
  return true;
};

// 新增：反向地理编码函数
export const reverseGeocode = (lat, lng) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps?.Geocoder) {
      return reject(new Error('Google Maps Geocoder not available.'));
    }
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          const address = results[0].formatted_address;
          const postalCodeComponent = results[0].address_components.find(c => c.types.includes('postal_code'));
          const cityComponent = results[0].address_components.find(c => c.types.includes('locality'));
          const locationName = cityComponent?.long_name || postalCodeComponent?.long_name || address.split(',')[0];
          resolve({ address, locationName });
        } else {
          reject(new Error('No results found for reverse geocoding.'));
        }
      } else {
        reject(new Error(`Geocoder failed due to: ${status}`));
      }
    });
  });
};

// 新增：地址转码函数 (正向)
export const geocodeAddress = (address) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps?.Geocoder) {
      return reject(new Error('Google Maps Geocoder not available.'));
    }
    const geocoder = new window.google.maps.Geocoder();
    // 添加区域偏向，提高美国地址的准确性
    geocoder.geocode({ address: address, componentRestrictions: { country: 'us' } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng(), formattedAddress: results[0].formatted_address });
      } else {
        reject(new Error(`Geocode was not successful for the following reason: ${status}`));
      }
    });
  });
};


// 新增：计算两点之间距离的函数
export const calculateDistanceBetweenPoints = (point1, point2) => {
  if (!window.google || !window.google.maps?.geometry?.spherical) {
    console.warn('Google Maps Geometry library not loaded, cannot calculate distance.');
    return null;
  }
  const from = new window.google.maps.LatLng(point1.lat, point1.lng);
  const to = new window.google.maps.LatLng(point2.lat, point2.lng);
  const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
  const distanceInMiles = distanceInMeters * 0.000621371;
  return distanceInMiles;
};

// Google Maps API 加载函数
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 开始加载 Google Maps API...');
    
    // 验证 API Key
    if (!validateApiKey()) {
      reject(new Error('API Key 验证失败'));
      return;
    }

    // 检查是否已经加载
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps API 已经加载');
      resolve(window.google);
      return;
    }

    // 检查是否已经有脚本标签
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('📄 发现已存在的 Google Maps 脚本，等待加载完成...');
      existingScript.addEventListener('load', () => {
        console.log('✅ 已存在脚本加载完成');
        resolve(window.google);
      });
      existingScript.addEventListener('error', (e) => {
        console.error('❌ 已存在脚本加载失败:', e);
        reject(new Error('Google Maps 脚本加载失败'));
      });
      return;
    }

    // 创建唯一的回调函数名
    const callbackName = `initGoogleMap_${Date.now()}`;
    console.log('📝 创建回调函数:', callbackName);
    
    // 构建完整的 API URL
    const apiUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.API_KEY}&libraries=${GOOGLE_MAPS_CONFIG.LIBRARIES.join(',')}&callback=${callbackName}`;
    console.log('🔗 API URL:', apiUrl.replace(GOOGLE_MAPS_CONFIG.API_KEY, 'AIza****'));
    
    // 创建新的脚本标签
    const script = document.createElement('script');
    script.src = apiUrl;
    script.async = true;
    script.defer = true;

    // 全局回调函数
    window[callbackName] = () => {
      console.log('✅ Google Maps API 回调函数执行成功');
      delete window[callbackName]; // 清理回调函数
      
      // 验证 Google Maps 对象
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps 对象验证成功');
        console.log('📚 可用的 Google Maps 服务:', Object.keys(window.google.maps));
        resolve(window.google);
      } else {
        console.error('❌ Google Maps 对象验证失败');
        reject(new Error('Google Maps 对象未正确初始化'));
      }
    };

    script.onerror = (event) => {
      console.error('❌ Google Maps 脚本加载失败:', event);
      console.error('🔍 可能的原因:');
      console.error('   1. API Key 无效或已过期');
      console.error('   2. 未启用必要的 Google Maps API');
      console.error('   3. Google Cloud 项目未配置账单');
      console.error('   4. 网络连接问题');
      console.error('   5. API 配额已用完');
      console.error('   6. 域名限制问题');
      
      delete window[callbackName]; // 清理回调函数
      reject(new Error('Google Maps API 加载失败 - 请检查控制台错误信息'));
    };

    console.log('📤 正在添加 Google Maps 脚本到页面...');
    document.head.appendChild(script);
    
    // 设置超时
    setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.error('⏱️ Google Maps API 加载超时');
        reject(new Error('Google Maps API 加载超时'));
      }
    }, 15000); // 增加到15秒超时
  });
};

// 提供统一的 API Key 获取函数
export const getGoogleMapsApiKey = () => {
  return GOOGLE_MAPS_CONFIG.API_KEY;
};

// 诊断函数
export const diagnoseGoogleMapsIssues = () => {
  console.log('🔍 Google Maps 诊断开始...');
  
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  console.log('📋 API Key:', apiKey ? (apiKey.substring(0, 10) + '...') : '未设置');
  
  // 检查环境变量
  console.log('📋 环境变量 REACT_APP_GOOGLE_MAPS_API_KEY:', 
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? '已设置' : '未设置');
  
  // 检查API Key格式
  validateApiKey();
  
  // 检查脚本是否加载
  const script = document.querySelector('script[src*="maps.googleapis.com"]');
  console.log('📋 Google Maps 脚本标签:', script ? '存在' : '不存在');
  
  // 检查Google对象
  console.log('📋 window.google:', window.google ? '存在' : '不存在');
  console.log('📋 window.google.maps:', window.google?.maps ? '存在' : '不存在');
  
  if (window.google?.maps) {
    console.log('📋 Places服务:', window.google.maps.places ? '可用' : '不可用');
    console.log('📋 Geocoder服务:', window.google.maps.Geocoder ? '可用' : '不可用');
    console.log('📋 DirectionsService:', window.google.maps.DirectionsService ? '可用' : '不可用');
  }
  
  console.log('🔍 Google Maps 诊断完成');
};