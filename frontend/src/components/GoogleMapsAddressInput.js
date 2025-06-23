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

  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

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

  const searchPlaces = (query) => {
    console.log('🔍 搜索地址:', query);
    
    if (!query || query.length < 3) {
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

    const request = {
      input: query,
      types: ['address', 'establishment', 'geocode']
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setLoading(false);
      console.log('📥 自动完成响应:', { status, predictions });
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        console.log('✅ 找到', predictions.length, '个地址建议');
        setSuggestions(predictions.slice(0, 8)); // 限制显示8个建议
        setShowSuggestions(true);
        setError(null);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('📭 未找到匹配的地址');
        setSuggestions([]);
        setShowSuggestions(false);
        setError('未找到匹配的地址，请尝试其他关键词');
      } else {
        console.warn('⚠️ 地址搜索出错:', status);
        setSuggestions([]);
        setShowSuggestions(false);
        setError(`地址搜索失败: ${status}`);
      }
    });
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    searchPlaces(inputValue);
  };

  const selectPlace = (prediction) => {
    const selectedValue = prediction.description;
    onChange(selectedValue);
    setShowSuggestions(false);

    // Get detailed place information
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: prediction.place_id },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const displayAddress = formatDisplayAddress(place.address_components);
            
            if (onPlaceSelected) {
              onPlaceSelected({
                fullAddress: selectedValue, // 完整地址用于详情页
                displayAddress: displayAddress, // 格式化地址用于卡片显示
                placeId: prediction.place_id,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                place: place,
                addressComponents: place.address_components
              });
            }
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
                  <span className="suggestion-text">{suggestion.description}</span>
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

  // GoogleMapsRoute: 修复 useEffect 依赖和函数声明顺序
  const createMap = React.useCallback(() => {
    if (!mapRef.current) return;

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

    const request = {
      origin: origin.address || origin,
      destination: destination.address || destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL,
      avoidHighways: false,
      avoidTolls: false
    };

    directionsService.route(request, (result, status) => {
      setLoading(false);
      
      if (status === 'OK') {
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
      } else {
        setError('无法计算路线: ' + status);
      }
    });
  }, [origin, destination]);

  const loadGoogleMapsAPI = React.useCallback((callback) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_API_KEY]);

  const initializeMap = React.useCallback(() => {
    if (!window.google) {
      loadGoogleMapsAPI(() => {
        createMap();
      });
    } else {
      createMap();
    }
  }, [loadGoogleMapsAPI, createMap]);

  useEffect(() => {
    if (origin && destination) {
      initializeMap();
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