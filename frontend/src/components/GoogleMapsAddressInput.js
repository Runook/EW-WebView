import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Navigation, Map, AlertCircle } from 'lucide-react';
import './GoogleMapsAddressInput.css';
import { getGoogleMapsApiKey, loadGoogleMapsScript, diagnoseGoogleMapsIssues } from '../config/googleMaps';

// 从地址组件中提取城市、州、邮编信息
const extractAddressComponents = (addressComponents) => {
  let city = '';
  let state = '';
  let zipcode = '';
  
  if (addressComponents) {
    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('sublocality_level_1') && !city) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      
      if (types.includes('postal_code')) {
        zipcode = component.long_name;
      }
    });
  }
  
  return { city, state, zipcode };
};

// 格式化显示地址为 "City, State zipcode" 格式
const formatDisplayAddress = (addressComponents) => {
  const { city, state, zipcode } = extractAddressComponents(addressComponents);
  
  let displayAddress = '';
  if (city) displayAddress += city;
  if (state) displayAddress += (displayAddress ? ', ' : '') + state;
  if (zipcode) displayAddress += (displayAddress ? ' ' : '') + zipcode;
  
  return displayAddress || '地址未知';
};

// Google Maps Address Input Component
const GoogleMapsAddressInput = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  onPlaceSelected,
  icon = MapPin 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Initialize Google Maps services
  const initializeGoogleMapsServices = () => {
    try {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setMapsLoaded(true);
        setError(null);
        console.log('✅ Google Maps 服务初始化成功');
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Google Maps 服务初始化失败:', err);
      setError('Google Maps 服务初始化失败');
      return false;
    }
  };

  useEffect(() => {
    console.log('🚀 GoogleMapsAddressInput: 开始初始化...');
    
    // 运行诊断
    diagnoseGoogleMapsIssues();
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps API 已存在');
      initializeGoogleMapsServices();
    } else {
      console.log('📥 正在加载 Google Maps API...');
      setError('正在加载 Google Maps...');
      
      loadGoogleMapsScript()
        .then(() => {
          console.log('✅ Google Maps API 加载完成');
          initializeGoogleMapsServices();
        })
        .catch((err) => {
          console.error('❌ Google Maps API 加载失败:', err);
          setError(`Google Maps 加载失败: ${err.message}`);
        });
    }
  }, []);

  // 清理防抖timeout，防止内存泄漏
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const searchPlaces = (query) => {
    console.log('🔍 搜索地址:', query);
    
    // 检查是否需要触发搜索
    const trimmedQuery = query.trim();
    const isStreetNumberPattern = /^\d+$/.test(trimmedQuery); // 纯数字（可能是门牌号）
    const isStreetAddressStart = /^\d+\s+[a-zA-Z]/.test(trimmedQuery); // 数字+空格+文字开头
    
    // 如果是纯数字且长度小于5（非完整邮编），不触发搜索
    if (isStreetNumberPattern && trimmedQuery.length < 5) {
      console.log('👉 等待更多输入（门牌号）');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // 如果是街道地址格式，需要至少有门牌号和一个字母
    if (!isStreetAddressStart && trimmedQuery.length < 2) {
      console.log('查询字符过短，跳过搜索');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!mapsLoaded || !autocompleteService.current) {
      console.error('❌ Google Maps 服务未初始化，无法搜索');
      setError('Google Maps 服务未就绪，请稍后再试');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('📤 发送自动完成请求...');

    // 检测输入类型并相应调整搜索策略
    const isZipCodePattern = /^\d{1,5}$/.test(trimmedQuery);
    
    // 检测是否是街道地址模式
    // 匹配模式：数字 + 空格 + 文字，例如 "55 kennedy"
    const isStreetAddressPattern = /^\d+\s+[a-zA-Z]/i.test(trimmedQuery);
    
    // 检测是否包含完整的街道信息
    // 匹配如 "street", "st", "avenue", "ave", "road", "rd" 等
    const hasStreetKeyword = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|circle|cir|court|ct|boulevard|blvd)\b/i.test(trimmedQuery);
    
    console.log('🔍 地址分析:', {
      query: trimmedQuery,
      isZipCode: isZipCodePattern,
      isStreetAddress: isStreetAddressPattern,
      hasStreetKeyword: hasStreetKeyword
    });

    let searchTypes = ['address'];
    if (isZipCodePattern) {
      searchTypes = ['postal_code', 'sublocality', 'locality'];
      console.log('🔢 检测到邮编搜索模式');
    } else if (isStreetAddressPattern || hasStreetKeyword) {
      searchTypes = ['address', 'street_address', 'route'];
      console.log('🏠 检测到街道地址搜索模式');
    } else {
      searchTypes = ['address', 'establishment', 'geocode'];
      console.log('📍 检测到一般地址搜索模式');
    }
    
    const request = {
      input: query,
      types: searchTypes,
      componentRestrictions: { country: 'US' } // 限制在美国范围内搜索
    };

    // 如果是邮编搜索，增加区域限制以获得更精确的结果
    if (isZipCodePattern) {
      console.log('🔢 检测到邮编搜索模式');
    } else {
      console.log('📍 检测到地址搜索模式');
    }

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setLoading(false);
      console.log('📥 自动完成响应:', { status, predictions });
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        console.log('✅ 找到', predictions.length, '个地址建议');
        // 增加建议数量，提供更多选择
        setSuggestions(predictions.slice(0, 10));
        setShowSuggestions(true);
        setError(null);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('📭 未找到匹配的地址');
        setSuggestions([]);
        setShowSuggestions(false);
        // 不显示错误提示，让用户继续输入
        setError(null);
      } else if (status === 'INVALID_REQUEST') {
        // 对于无效请求，不显示错误，只在控制台记录
        console.warn('⚠️ 无效的搜索请求:', status);
        setSuggestions([]);
        setShowSuggestions(false);
        setError(null);
      } else {
        // 只在严重错误时显示错误提示
        console.warn('⚠️ 地址搜索出错:', status);
        setSuggestions([]);
        setShowSuggestions(false);
        if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
          setError(`服务暂时不可用，请稍后再试`);
        } else {
          setError(null);
        }
      }
    });
  };

  // 添加防抖机制，避免过于频繁的API调用
  const debounceTimeout = useRef(null);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // 清除之前的延时
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // 设置新的延时
    debounceTimeout.current = setTimeout(() => {
    searchPlaces(inputValue);
    }, 300); // 300ms防抖延时
  };

  const selectPlace = (prediction) => {
    const selectedValue = prediction.description;
    onChange(selectedValue);
    setShowSuggestions(false);
    setLoading(true);

    console.log('🎯 用户选择地址:', selectedValue);

    // Get detailed place information
    if (placesService.current) {
      placesService.current.getDetails(
        { 
          placeId: prediction.place_id,
          fields: ['formatted_address', 'address_components', 'geometry', 'place_id'] // 明确指定需要的字段
        },
        (place, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const displayAddress = formatDisplayAddress(place.address_components);
            
            console.log('✅ 地址详情获取成功:', {
              fullAddress: place.formatted_address,
              displayAddress: displayAddress,
              addressComponents: place.address_components
            });
            
            if (onPlaceSelected) {
              onPlaceSelected({
                fullAddress: place.formatted_address, // 使用Google返回的标准格式化地址
                displayAddress: displayAddress, // 格式化地址用于卡片显示 (City, State zipcode)
                placeId: prediction.place_id,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                place: place,
                addressComponents: place.address_components
              });
            }
          } else {
            console.error('❌ 获取地址详情失败:', status);
            setError('获取地址详情失败，请重新选择');
          }
        }
      );
    }
  };

  const hideSuggestions = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const IconComponent = icon;

  return (
    <div className="form-group address-input-group">
      <label>
        <IconComponent size={16} />
        {label} {required && <span className="required">*</span>}
        {!mapsLoaded && (
          <span className="maps-status loading">
            <div className="loading-dot"></div>
            加载中...
          </span>
        )}
      </label>
      <div className={`address-input-container ${error ? 'error' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={hideSuggestions}
          placeholder={mapsLoaded ? placeholder : "正在加载 Google Maps..."}
          required={required}
          disabled={!mapsLoaded}
        />
        
        {mapsLoaded ? (
          <Search size={16} className={`search-icon ${loading ? 'loading' : ''}`} />
        ) : (
          <div className="maps-loading-icon">
            <div className="loading-spinner-small"></div>
          </div>
        )}
        
        {error && (
          <div className="address-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="address-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onMouseDown={() => selectPlace(suggestion)}
              >
                <div className="suggestion-main">
                  <MapPin size={14} />
                  <div className="suggestion-content">
                  <span className="suggestion-text">{suggestion.description}</span>
                    {/* 显示地址类型提示 */}
                    <span className="suggestion-type">
                      {suggestion.types.includes('postal_code') ? '邮政编码' : 
                       suggestion.types.includes('street_address') ? '街道地址' :
                       suggestion.types.includes('route') ? '街道' :
                       suggestion.types.includes('locality') ? '城市' :
                       suggestion.types.includes('administrative_area_level_1') ? '州' : '地址'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Google Maps Route Display Component
const GoogleMapsRoute = ({ origin, destination, onClose }) => {
  const mapRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

  // 添加调试信息
  useEffect(() => {
    console.log('🗺️ GoogleMapsRoute初始化:', {
      origin,
      destination,
      googleMapsLoaded: !!window.google?.maps,
      apiKey: GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
    });
  }, [origin, destination, GOOGLE_MAPS_API_KEY]);

  // GoogleMapsRoute: 修复 useEffect 依赖和函数声明顺序
  const createMap = React.useCallback(() => {
    console.log('🗺️ 开始创建地图...');
    
    if (!mapRef.current) {
      console.error('❌ mapRef.current 不存在');
      setError('地图容器未就绪');
      setLoading(false);
      return;
    }

    if (!window.google?.maps) {
      console.error('❌ Google Maps API 未加载');
      setError('Google Maps API 未加载');
      setLoading(false);
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 6,
        center: { lat: 39.8283, lng: -98.5795 }, // 美国中心
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        draggable: true,
        panel: document.getElementById('directions-panel')
      });

      directionsRenderer.setMap(map);

      // 处理地址格式
      const originAddress = origin?.fullAddress || origin?.address || origin;
      const destinationAddress = destination?.fullAddress || destination?.address || destination;

      console.log('🚗 准备计算路线:', {
        from: originAddress,
        to: destinationAddress
      });

      const request = {
        origin: originAddress,
        destination: destinationAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, (result, status) => {
        console.log('📍 路线计算结果:', { status, result });
        setLoading(false);
        
        if (status === 'OK' || status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            start_address: leg.start_address,
            end_address: leg.end_address,
            steps: leg.steps
          });
          
          console.log('✅ 路线计算成功:', {
            distance: leg.distance.text,
            duration: leg.duration.text
          });
        } else {
          console.error('❌ 路线计算失败:', status);
          setError('无法计算路线: ' + status);
        }
      });
    } catch (err) {
      console.error('❌ 创建地图时出错:', err);
      setError('地图初始化失败: ' + err.message);
      setLoading(false);
    }
  }, [origin, destination]);

  // 简化初始化逻辑
  const initializeMap = React.useCallback(() => {
    if (window.google?.maps) {
      console.log('✅ Google Maps API 已加载，直接创建地图');
      createMap();
    } else {
      console.log('📥 等待 Google Maps API 加载...');
      // 等待一小段时间再检查
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          console.log('✅ Google Maps API 加载完成');
          clearInterval(checkInterval);
          createMap();
        }
      }, 100);
      
      // 10秒后超时
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps) {
          console.error('❌ Google Maps API 加载超时');
          setError('Google Maps 加载超时，请刷新页面重试');
          setLoading(false);
        }
      }, 10000);
    }
  }, [createMap]);

  useEffect(() => {
    if (origin && destination) {
      initializeMap();
    } else {
      console.error('❌ 缺少起点或终点信息:', { origin, destination });
      setError('缺少起点或终点信息');
      setLoading(false);
    }
  }, [origin, destination, initializeMap]);

  return (
    <div className="route-modal-overlay" onClick={onClose}>
      <div className="route-modal-content" onClick={e => e.stopPropagation()}>
        <div className="route-modal-header">
          <h2>
            <Navigation size={24} />
            导航路线
          </h2>
          <button className="route-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="route-modal-body">
          {loading && (
            <div className="route-loading">
              <div className="loading-spinner"></div>
              <p>正在计算路线...</p>
            </div>
          )}
          
          {error && (
            <div className="route-error">
              <p>{error}</p>
            </div>
          )}
          
          {routeInfo && (
            <div className="route-info">
              <div className="route-summary">
                <div className="route-stat">
                  <strong>距离:</strong> {routeInfo.distance}
                </div>
                <div className="route-stat">
                  <strong>预计时间:</strong> {routeInfo.duration}
                </div>
              </div>
              
              <div className="route-addresses">
                <div className="route-address">
                  <strong>起点:</strong> {routeInfo.start_address}
                </div>
                <div className="route-address">
                  <strong>终点:</strong> {routeInfo.end_address}
                </div>
              </div>
            </div>
          )}
          
          <div className="route-container">
            <div ref={mapRef} className="route-map"></div>
            <div id="directions-panel" className="directions-panel"></div>
          </div>
        </div>
        
        <div className="route-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            关闭
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin.address || origin)}/${encodeURIComponent(destination.address || destination)}`;
              window.open(googleMapsUrl, '_blank');
            }}
          >
            <Map size={16} />
            在Google Maps中打开
          </button>
        </div>
      </div>
    </div>
  );
};

// 地理编码文本地址，获取格式化信息
const geocodeAddress = async (address) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const result = results[0];
        const displayAddress = formatDisplayAddress(result.address_components);
        
        resolve({
          fullAddress: result.formatted_address,
          displayAddress: displayAddress,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng()
          },
          place: result,
          addressComponents: result.address_components
        });
      } else {
        reject(new Error('无法找到地址: ' + status));
      }
    });
  });
};

// 距离计算工具函数
const calculateDistance = async (origin, destination) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK') {
        const element = response.rows[0].elements[0];
        if (element.status === 'OK') {
          resolve({
            distance: element.distance.text,
            duration: element.duration.text,
            distanceValue: element.distance.value, // 米为单位
            durationValue: element.duration.value  // 秒为单位
          });
        } else {
          reject(new Error('无法计算距离'));
        }
      } else {
        reject(new Error('距离计算服务错误: ' + status));
      }
    });
  });
};

export { GoogleMapsAddressInput, GoogleMapsRoute, calculateDistance, geocodeAddress };