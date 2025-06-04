import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../config/api';
import { filterData, sortData, handleApiError } from '../utils/dataUtils';

// 通用平台数据管理Hook
export const usePlatformData = (platform, initialFilters = {}) => {
  const [data, setData] = useState({
    primary: [],
    secondary: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [sortType, setSortType] = useState('date');
  const [userPosts, setUserPosts] = useState([]);

  // 获取API服务
  const getApiService = useCallback(() => {
    switch (platform) {
      case 'land':
        return ApiService.landFreight;
      case 'sea':
        return ApiService.seaFreight;
      case 'air':
        return ApiService.airFreight;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }, [platform]);

  // 获取数据字段名称映射
  const getDataFields = useCallback(() => {
    switch (platform) {
      case 'land':
        return { primary: 'loads', secondary: 'trucks' };
      case 'sea':
        return { primary: 'demands', secondary: 'cargo' };
      case 'air':
        return { primary: 'demands', secondary: 'cargo' };
      default:
        return { primary: 'primary', secondary: 'secondary' };
    }
  }, [platform]);

  // 获取API方法映射
  const getApiMethods = useCallback(() => {
    const service = getApiService();
    const fields = getDataFields();
    
    switch (platform) {
      case 'land':
        return {
          getPrimary: service.getLoads,
          getSecondary: service.getTrucks,
          createPrimary: service.createLoad,
          createSecondary: service.createTruck
        };
      case 'sea':
        return {
          getPrimary: service.getDemands,
          getSecondary: service.getCargo,
          createPrimary: service.createDemand,
          createSecondary: service.createCargo
        };
      case 'air':
        return {
          getPrimary: service.getDemands,
          getSecondary: service.getCargo,
          createPrimary: service.createDemand,
          createSecondary: service.createCargo
        };
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }, [platform, getApiService, getDataFields]);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const methods = getApiMethods();
      const [primaryData, secondaryData] = await Promise.all([
        methods.getPrimary(),
        methods.getSecondary()
      ]);

      setData({
        primary: primaryData.data || primaryData,
        secondary: secondaryData.data || secondaryData
      });
    } catch (err) {
      const errorMessage = handleApiError(err, '加载数据失败');
      setError(errorMessage);
      console.error('数据加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, [getApiMethods]);

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理筛选条件变化
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 清空所有筛选条件
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters(initialFilters);
  }, [initialFilters]);

  // 应用筛选和排序
  const getFilteredData = useCallback((dataType) => {
    const rawData = data[dataType] || [];
    const allData = [...rawData, ...userPosts.filter(post => 
      (dataType === 'primary' && (post.type === 'load' || post.type === 'demand')) ||
      (dataType === 'secondary' && (post.type === 'truck' || post.type === 'cargo'))
    )];
    
    const filtered = filterData(allData, searchQuery, filters);
    const sorted = sortData(filtered, sortType, platform);
    
    return sorted;
  }, [data, userPosts, searchQuery, filters, sortType, platform]);

  // 发布新信息
  const handlePostSubmit = useCallback(async (postData) => {
    try {
      const methods = getApiMethods();
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('请先登录再发布信息');
      }

      let response;
      if (postData.type === 'load' || postData.type === 'demand') {
        response = await methods.createPrimary(postData);
      } else {
        response = await methods.createSecondary(postData);
      }

      // 重新加载数据
      await loadData();
      
      return { success: true, message: '发布成功！', data: response };
    } catch (error) {
      const errorMessage = handleApiError(error, '发布失败');
      
      // 如果API调用失败，至少更新本地状态
      setUserPosts(prev => [...prev, { ...postData, id: Date.now() }]);
      
      return { success: false, message: errorMessage };
    }
  }, [getApiMethods, loadData]);

  // 获取统计信息
  const getStats = useCallback(() => {
    const primaryData = getFilteredData('primary');
    const secondaryData = getFilteredData('secondary');
    
    return {
      primaryCount: primaryData.length,
      secondaryCount: secondaryData.length,
      totalCount: primaryData.length + secondaryData.length,
      hasFilters: searchQuery || Object.values(filters).some(f => f)
    };
  }, [getFilteredData, searchQuery, filters]);

  return {
    // 数据状态
    data: {
      primary: getFilteredData('primary'),
      secondary: getFilteredData('secondary'),
      raw: data
    },
    
    // 加载状态
    loading,
    error,
    
    // 搜索和筛选
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
    
    // 排序
    sortType,
    setSortType,
    
    // 操作方法
    loadData,
    handlePostSubmit,
    
    // 统计信息
    stats: getStats(),
    
    // 工具方法
    refresh: loadData,
    hasFilters: searchQuery || Object.values(filters).some(f => f)
  };
};

// 专用Hook
export const useLandFreightData = (initialFilters = {}) => {
  return usePlatformData('land', {
    origin: '',
    destination: '',
    equipment: '',
    loadType: '',
    serviceType: '',
    ...initialFilters
  });
};

export const useSeaFreightData = (initialFilters = {}) => {
  return usePlatformData('sea', {
    origin: '',
    destination: '',
    cargoType: '',
    vesselType: '',
    urgency: '',
    ...initialFilters
  });
};

export const useAirFreightData = (initialFilters = {}) => {
  return usePlatformData('air', {
    origin: '',
    destination: '',
    cargoType: '',
    urgency: '',
    airline: '',
    ...initialFilters
  });
};

export default usePlatformData; 