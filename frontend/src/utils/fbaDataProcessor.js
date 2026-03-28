// 处理原始FBA位置数据的工具函数

/**
 * 清理和标准化FBA位置数据
 * @param {Array|Object} rawData - 原始Excel转换的JSON数据或按州分组的新格式数据
 * @returns {Array} - 处理后的标准化数据
 */
export const processLocationData = (rawData) => {
  if (!rawData) {
    return [];
  }

  // 检查是否为新的按州分组格式
  if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    console.log('使用新的按州分组的FBA数据格式');
    return processGroupedData(rawData);
  }

  // 处理原来的数组格式
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .map((item, index) => {
      try {
        // 尝试从混乱的数据中提取有用信息
        const values = Object.values(item).filter(v => v !== null && v !== undefined && v !== '');
        
        if (values.length < 2) return null;
        
        // 第一个值通常是州名
        let state = values[0] || 'Unknown';
        // 第二个值通常是代码
        let code = values[1] || `LOC${index + 1}`;
        // 最后一个值通常是地址
        let address = values[values.length - 1] || 'Address not available';
        
        // 清理数据
        state = cleanStateName(state);
        code = cleanCode(code);
        address = cleanAddress(address);
        
        // 跳过无效数据
        if (!isValidData(state, code, address)) {
          return null;
        }
        
        // 从地址中提取城市信息
        const cityInfo = extractCityFromAddress(address);
        
        // 判断设施类型
        const type = determineFacilityType(code, item);
        
        // 提取地理信息
        const geoInfo = extractGeographicInfo(address);
        
        return {
          id: generateUniqueId(state, code, index),
          state: state,
          city: cityInfo.city,
          code: code,
          type: type,
          address: address,
          stateCode: geoInfo.stateCode,
          zipCode: geoInfo.zipCode,
          county: geoInfo.county,
          description: generateDescription(type, cityInfo.city, state),
          coordinates: geoInfo.coordinates,
          // 模拟额外信息
          operatingHours: '24/7',
          capacity: getCapacityByType(type),
          services: getServicesByType(type),
          contact: getContactInfo(),
          features: getFeaturesbyType(type, cityInfo.city),
          lastUpdated: new Date().toISOString(),
          isActive: true
        };
      } catch (error) {
        console.warn(`处理数据项 ${index} 时出错:`, error);
        return null;
      }
    })
    .filter(item => item !== null) // 过滤掉无效数据
    .sort((a, b) => {
      // 按州名和代码排序
      if (a.state !== b.state) {
        return a.state.localeCompare(b.state);
      }
      return a.code.localeCompare(b.code);
    });
};

/**
 * 处理新的按州分组格式的数据
 * @param {Object} groupedData - 按州分组的数据对象
 * @returns {Array} - 处理后的标准化数据
 */
const processGroupedData = (groupedData) => {
  const allLocations = [];
  let index = 0;

  // 遍历每个州的数据
  for (const [stateName, stateLocations] of Object.entries(groupedData)) {
    if (!Array.isArray(stateLocations)) continue;
    for (const location of stateLocations) {
      try {
        // 直接使用新格式的数据，无需复杂的解析
        const processedLocation = {
          id: location.code || generateUniqueId(stateName, location.code || `LOC${index}`, index),
          state: stateName,
          city: location.city || 'Unknown City',
          code: location.code || `LOC${index}`,
          type: location.type || 'FC',
          address: location.address || 'Address not available',
          stateCode: stateName, // 使用州名作为代码
          zipCode: location.zip || location.zip_code || 'N/A',
          county: null, // 新格式中没有县信息
          description: location.description || generateDescription(location.type || 'FC', location.city, stateName),
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          // 保持与原有格式的兼容性
          operatingHours: '24/7',
          capacity: getCapacityByType(location.type || 'FC'),
          services: getServicesByType(location.type || 'FC'),
          contact: getContactInfo(),
          features: getFeaturesbyType(location.type || 'FC', location.city || 'Unknown City'),
          lastUpdated: new Date().toISOString(),
          isActive: location.is_active !== false,
          // 新格式特有的字段
          name: location.name || `${location.code} - ${location.city}`,
          country: location.country || 'US'
        };

        allLocations.push(processedLocation);
        index++;
      } catch (error) {
        console.warn(`处理位置数据时出错 (${stateName}):`, error, location);
      }
    }
  }

  // 按州名和代码排序
  return allLocations.sort((a, b) => {
    if (a.state !== b.state) {
      return a.state.localeCompare(b.state);
    }
    return a.code.localeCompare(b.code);
  });
};

/**
 * 清理州名
 */
const cleanStateName = (state) => {
  if (typeof state !== 'string') return 'Unknown';
  
  const stateMap = {
    'AL': 'State', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };
  
  const cleaned = state.trim();
  return stateMap[cleaned] || cleaned;
};

/**
 * 清理代码
 */
const cleanCode = (code) => {
  if (typeof code !== 'string') return `LOC${Date.now()}`;
  return code.trim().toUpperCase();
};

/**
 * 清理地址
 */
const cleanAddress = (address) => {
  if (typeof address !== 'string') return 'Address not available';
  return address.trim().replace(/\s+/g, ' ');
};

/**
 * 验证数据有效性
 */
const isValidData = (state, code, address) => {
  return state && state !== 'Unknown' && 
         code && code.length > 1 && 
         address && address !== 'Address not available' &&
         address.length > 10;
};

/**
 * 从地址中提取城市信息
 */
const extractCityFromAddress = (address) => {
  // 匹配格式: "地址, 城市, 州 邮编"
  const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
  const city = cityMatch ? cityMatch[1].trim() : 'Unknown City';
  
  return {
    city: city,
    formattedCity: city.replace(/\b\w/g, l => l.toUpperCase())
  };
};

/**
 * 判断设施类型
 */
const determineFacilityType = (code, originalData) => {
  // 从原始数据中查找类型信息
  if (originalData.FC) return originalData.FC;
  
  // 从代码中推断类型
  if (code.includes('FC')) return 'FC';
  if (code.includes('DC')) return 'DC';
  if (code.includes('SC')) return 'SC';
  if (code.includes('DS')) return 'DS';
  
  return 'FC'; // 默认为配送中心
};

/**
 * 提取地理信息
 */
const extractGeographicInfo = (address) => {
  // 匹配邮编和州代码
  const zipMatch = address.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
  const stateCode = zipMatch ? zipMatch[1] : 'N/A';
  const zipCode = zipMatch ? zipMatch[2] : 'N/A';
  
  // 尝试提取县信息
  const countyMatch = address.match(/,\s*([^,]+)\s+County/i);
  const county = countyMatch ? countyMatch[1] + ' County' : null;
  
  return {
    stateCode,
    zipCode,
    county,
    coordinates: null // 可以后期集成地理编码服务
  };
};

/**
 * 生成唯一ID
 */
const generateUniqueId = (state, code, index) => {
  const stateCode = state.substring(0, 2).toUpperCase();
  return `${stateCode}_${code}_${index}`.replace(/[^A-Z0-9_]/g, '');
};

/**
 * 生成描述
 */
const generateDescription = (type, city, state) => {
  const typeNames = {
    'FC': '配送中心',
    'DC': '分发中心',
    'SC': '分拣中心',
    'DS': '配送站点'
  };
  
  const typeName = typeNames[type] || '设施';
  return `位于${state}${city}的Amazon ${typeName}`;
};

/**
 * 根据类型获取容量信息
 */
const getCapacityByType = (type) => {
  const capacities = {
    'FC': '大型配送中心 - 100万+ 件商品存储能力',
    'DC': '分发中心 - 50万+ 件商品处理能力',
    'SC': '分拣中心 - 日处理包裹 10万+ 件',
    'DS': '配送站点 - 本地配送服务'
  };
  
  return capacities[type] || '标准设施 - 详细容量信息请联系 Amazon';
};

/**
 * 根据类型获取服务
 */
const getServicesByType = (type) => {
  const baseServices = ['商品接收', '库存管理', '订单处理'];
  
  const typeServices = {
    'FC': [...baseServices, '包装服务', '当日配送', '客户退货处理', '质量检查'],
    'DC': [...baseServices, '商品分拣', '运输调度', '库存转移'],
    'SC': [...baseServices, '包裹分拣', '路线优化', '运输管理'],
    'DS': [...baseServices, '本地配送', '客户服务', '包裹追踪']
  };
  
  return typeServices[type] || baseServices;
};

/**
 * 获取联系信息
 */
const getContactInfo = () => ({
  phone: '1-800-AMAZON',
  email: 'fba-support@amazon.com',
  website: 'https://sellercentral.amazon.com'
});

/**
 * 根据类型和城市获取特色功能
 */
const getFeaturesbyType = (type, city) => {
  const baseFeatures = ['自动化分拣系统', '实时库存跟踪', '温控环境'];
  const specialFeatures = [];
  
  // 根据设施类型添加功能
  const typeFeatures = {
    'FC': ['机器人拣选系统', '快速包装线', '多层存储系统'],
    'DC': ['大型货物处理', '跨码头操作', '批量分拣系统'],
    'SC': ['高速分拣设备', '条码扫描系统', '路线优化软件'],
    'DS': ['本地配送优化', '客户取件服务', '实时追踪系统']
  };
  
  if (typeFeatures[type]) {
    specialFeatures.push(...typeFeatures[type]);
  }
  
  // 根据城市添加特殊功能
  const majorCities = ['Los Angeles', 'New York', 'Chicago', 'Dallas', 'Atlanta', 'Seattle'];
  if (majorCities.some(major => city.includes(major))) {
    specialFeatures.push('同城配送服务', '高峰期加急处理', '24小时客服支持');
  }
  
  return [...baseFeatures, ...specialFeatures];
};

/**
 * 获取处理统计信息
 */
export const getDataStatistics = (processedData) => {
  if (!processedData || !Array.isArray(processedData)) {
    return {
      totalLocations: 0,
      stateCount: 0,
      typeCount: 0,
      byState: {},
      byType: {}
    };
  }
  
  const byState = {};
  const byType = {};
  
  processedData.forEach(location => {
    // 按州统计
    byState[location.state] = (byState[location.state] || 0) + 1;
    
    // 按类型统计
    byType[location.type] = (byType[location.type] || 0) + 1;
  });
  
  return {
    totalLocations: processedData.length,
    stateCount: Object.keys(byState).length,
    typeCount: Object.keys(byType).length,
    byState,
    byType
  };
}; 