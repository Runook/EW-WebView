// 数据处理工具函数

// 生成未来日期
export const getRandomFutureDate = (daysFromNow = 1, maxDays = 7) => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysFromNow + Math.floor(Math.random() * maxDays));
  return futureDate.toISOString().split('T')[0];
};

// 格式化日期显示
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 格式化相对时间
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  if (diffDays > 0) return `${diffDays}天后`;
  return formatDate(dateString);
};

// 搜索和筛选函数
export const filterData = (data, searchQuery, filters = {}) => {
  let filtered = [...data];

  // 搜索筛选
  if (searchQuery?.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      const searchFields = [
        item.origin,
        item.destination,
        item.location,
        item.commodity,
        item.cargoType,
        item.equipment,
        item.company,
        item.flightNumber,
        item.airline,
        item.vesselName,
        item.shippingLine
      ].filter(Boolean);
      
      return searchFields.some(field => 
        field.toLowerCase().includes(query)
      );
    });
  }

  // 应用其他筛选条件
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value && value.trim()) {
      filtered = filtered.filter(item => {
        switch (key) {
          case 'origin':
            return item.origin?.toLowerCase().includes(value.toLowerCase()) ||
                   item.location?.toLowerCase().includes(value.toLowerCase());
          case 'destination':
            return item.destination?.toLowerCase().includes(value.toLowerCase());
          case 'equipment':
          case 'truckType':
            return item.equipment?.toLowerCase().includes(value.toLowerCase()) ||
                   item.truckType?.toLowerCase().includes(value.toLowerCase());
          case 'cargoType':
            return item.cargoType?.toLowerCase().includes(value.toLowerCase());
          case 'loadType':
          case 'serviceType':
            return item.loadType === value || 
                   item.serviceType === value ||
                   item.serviceType?.includes(value);
          case 'urgency':
            return item.urgency === value;
          case 'vesselType':
            return item.vesselType?.toLowerCase().includes(value.toLowerCase());
          case 'airline':
            return item.airline?.toLowerCase().includes(value.toLowerCase());
          default:
            return true;
        }
      });
    }
  });

  return filtered;
};

// 排序函数
export const sortData = (data, sortType = 'date', platform = 'land') => {
  return [...data].sort((a, b) => {
    switch (sortType) {
      case 'date':
        const dateA = new Date(a.availableDate || a.requiredDate || a.flightDate || a.sailingDate);
        const dateB = new Date(b.availableDate || b.requiredDate || b.flightDate || b.sailingDate);
        return dateA - dateB;
        
      case 'urgency':
        const urgencyOrder = { '特急': 0, '紧急': 1, '加急': 2, '普通': 3 };
        const urgencyDiff = (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
        if (urgencyDiff !== 0) return urgencyDiff;
        // 紧急程度相同时按日期排序
        const dateA2 = new Date(a.requiredDate || a.availableDate);
        const dateB2 = new Date(b.requiredDate || b.availableDate);
        return dateA2 - dateB2;
        
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
        
      case 'price':
        // 提取价格数字进行比较
        const priceA = parseFloat((a.rate || a.maxRate || '0').replace(/[^\d.]/g, ''));
        const priceB = parseFloat((b.rate || b.maxRate || '0').replace(/[^\d.]/g, ''));
        return priceA - priceB;
        
      default:
        return 0;
    }
  });
};

// 数据验证函数
export const validateFormData = (data, requiredFields = []) => {
  const missing = requiredFields.filter(field => !data[field] || data[field].trim() === '');
  
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  // 验证日期
  const dateFields = ['availableDate', 'requiredDate', 'flightDate', 'sailingDate', 'cutOffDate'];
  for (const field of dateFields) {
    if (data[field]) {
      const date = new Date(data[field]);
      const today = new Date();
      
      if (field === 'cutOffDate' && data.sailingDate) {
        const sailingDate = new Date(data.sailingDate);
        if (date >= sailingDate) {
          return { isValid: false, error: '截关日期必须早于开船日期' };
        }
      } else if (date <= today) {
        return { isValid: false, error: `${field}必须是未来日期` };
      }
    }
  }
  
  // 验证邮箱格式
  if (data.contactEmail && data.contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      return { isValid: false, error: '邮箱格式不正确' };
    }
  }
  
  // 验证手机号格式
  if (data.contactPhone && data.contactPhone.trim()) {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(data.contactPhone)) {
      return { isValid: false, error: '电话号码格式不正确' };
    }
  }
  
  return { isValid: true };
};

// 数据统计函数
export const getDataStats = (data) => {
  const total = data.length;
  const activeToday = data.filter(item => {
    const itemDate = new Date(item.availableDate || item.requiredDate || item.flightDate || item.sailingDate);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  }).length;
  
  const thisWeek = data.filter(item => {
    const itemDate = new Date(item.availableDate || item.requiredDate || item.flightDate || item.sailingDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return itemDate >= today && itemDate <= weekFromNow;
  }).length;
  
  const urgentItems = data.filter(item => 
    item.urgency === '紧急' || item.urgency === '特急'
  ).length;
  
  return {
    total,
    activeToday,
    thisWeek,
    urgentItems
  };
};

// 本地存储工具
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// 错误处理工具
export const handleApiError = (error, customMessage = '操作失败') => {
  console.error('API Error:', error);
  
  if (error.message?.includes('Failed to fetch')) {
    return '网络连接失败，请检查网络后重试';
  }
  
  if (error.message?.includes('401')) {
    return '认证失败，请重新登录';
  }
  
  if (error.message?.includes('403')) {
    return '权限不足，无法执行此操作';
  }
  
  if (error.message?.includes('404')) {
    return '请求的资源不存在';
  }
  
  if (error.message?.includes('500')) {
    return '服务器内部错误，请稍后重试';
  }
  
  return error.message || customMessage;
};

export default {
  getRandomFutureDate,
  formatDate,
  formatRelativeTime,
  filterData,
  sortData,
  validateFormData,
  getDataStats,
  storage,
  debounce,
  throttle,
  handleApiError
}; 