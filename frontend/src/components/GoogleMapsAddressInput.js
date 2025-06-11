import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Navigation, Map } from 'lucide-react';
import './GoogleMapsAddressInput.css';

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
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE';

  // Initialize Google Maps services
  useEffect(() => {
    console.log('GoogleMapsAddressInput: Initializing...');
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      console.log('Services initialized successfully');
    } else {
      console.log('Loading Google Maps API...');
      loadGoogleMapsAPI();
    }
  }, []);

  const loadGoogleMapsAPI = () => {
    if (window.google) {
      console.log('Google Maps API already exists');
      return;
    }

    console.log('Creating Google Maps API script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      console.log('Services initialized after API load');
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
    };
    document.head.appendChild(script);
  };

  const searchPlaces = (query) => {
    console.log('Searching for:', query);
    
    if (!query || query.length < 3) {
      console.log('Query too short, skipping search');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteService.current) {
      console.error('AutocompleteService not initialized');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    console.log('Making autocomplete request...');

    const request = {
      input: query,
      types: ['address', 'establishment', 'geocode']
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setLoading(false);
      console.log('Autocomplete response:', { status, predictions });
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        console.log('Found', predictions.length, 'suggestions');
        setSuggestions(predictions.slice(0, 8)); // 限制显示8个建议
        setShowSuggestions(true);
      } else {
        console.warn('No suggestions found or error:', status);
        setSuggestions([]);
        setShowSuggestions(false);
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
            if (onPlaceSelected) {
              onPlaceSelected({
                address: selectedValue,
                placeId: prediction.place_id,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                place: place
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
      </label>
      <div className="address-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={hideSuggestions}
          placeholder={placeholder}
          required={required}
        />
        <Search size={16} className={`search-icon ${loading ? 'loading' : ''}`} />
        
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

  const GOOGLE_MAPS_API_KEY = 'AIzaSyB-uQvzsiFeJOr37qYg2EenJbaKUG7-KfE';

  useEffect(() => {
    if (origin && destination) {
      initializeMap();
    }
  }, [origin, destination]);

  const initializeMap = () => {
    if (!window.google) {
      loadGoogleMapsAPI(() => {
        createMap();
      });
    } else {
      createMap();
    }
  };

  const loadGoogleMapsAPI = (callback) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  };

  const createMap = () => {
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
  };

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

export { GoogleMapsAddressInput, GoogleMapsRoute }; 