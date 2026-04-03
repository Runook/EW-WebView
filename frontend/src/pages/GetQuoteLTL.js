import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Package, 
  Hash,
  Info,
  Phone,
  Plus,
  Minus,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  List
} from 'lucide-react';
import './GetQuote.css';
import { GoogleMapsAddressInput, calculateDistance } from '../components/GoogleMapsAddressInput';
import { useForm } from '../hooks';
import { Button } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/common/Notification';
import { orderApi } from '../config/employeeApi';
import ProgressSteps from '../components/ltl/ProgressSteps';
import ShipmentSummary from '../components/ltl/ShipmentSummary';
import ShipmentDetailsForm from '../components/ltl/ShipmentDetailsForm';
import { freightApi } from '../config/freightApi';

const GetQuoteLTL = ({ fbaDestination }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { success, error: showError } = useNotification();
  
  // 表单初始数据 - LTL专用
  const initialFormData = {
    type: 'quote',
    serviceType: 'LTL',
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    cargoType: '',
    originLocationType: '',
    destinationLocationType: '',
    pickupServices: [],
    deliveryServices: [],
    cargoItems: [
      {
        id: 1,
        description: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        volume: '',
        density: '',
        freightClass: '',
        pallets: '',
        stackable: true,
        hazmat: false,
        shippingNumber: '',
        weightKg: '',
        lengthCm: '',
        widthCm: '',
        heightCm: ''
      }
    ],
    contactPhone: '',
    contactEmail: '',
    notes: '',
    companyName: ''
  };

  const { 
    formData, 
    setFormData, 
    handleInputChange, 
    resetForm,
    isSubmitting,
    setIsSubmitting
  } = useForm(initialFormData);

  const [, setCalculatingDistance] = React.useState(false);
  const [selectedPlaces, setSelectedPlaces] = React.useState({
    origin: null,
    destination: null
  });
  const [distanceInfo, setDistanceInfo] = React.useState(null);
  
  // 报价结果状态
  const [showQuoteResults, setShowQuoteResults] = React.useState(false);
  const [quoteResults, setQuoteResults] = React.useState([]);
  const [expandedQuoteId, setExpandedQuoteId] = React.useState(null);
  const [breakdownQuoteId, setBreakdownQuoteId] = React.useState(null);
  const [sortBy, setSortBy] = React.useState('price'); // 'price', 'time', 'name'
  
  // 步骤状态管理
  const [currentStep, setCurrentStep] = React.useState(1); // 1: Quote Details, 2: Carrier Selection, 3: Shipment Details
  const [selectedQuote, setSelectedQuote] = React.useState(null);
  const [shipmentDetails, setShipmentDetails] = React.useState({
    companyName: '',
    contactPhone: '',
    contactEmail: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupContactEmail: '',
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupZip: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    deliveryContactEmail: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZip: '',
    specialInstructions: ''
  });

  // 货物类型选项
  const cargoTypes = [
    '机械设备 (Machinery)', 
    '汽车配件 (Auto Parts)', 
    '电子设备 (Electronics)', 
    '建筑材料 (Building Materials)',
    '纺织品 (Textiles)', 
    '家具 (Furniture)', 
    '食品饮料 (Food & Beverages)', 
    '化工原料 (Chemicals)',
    '金属制品 (Metal Products)', 
    '纸制品 (Paper Products)', 
    '塑料制品 (Plastic Products)',
    '医药用品 (Pharmaceuticals)', 
    '日用百货 (General Merchandise)', 
    '危险品 (Hazmat)', 
    '其他 (Other)'
  ];

  // 地址类型选项（下拉菜单）
  const locationTypes = [
    { value: '', label: '请选择地址类型' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'limited_access', label: 'Limited Access' },
    { value: 'residential', label: 'Residential' },
    { value: 'trade_show', label: 'Trade Show' }
  ];

  // 取货服务选项（勾选框）
  const pickupServices = [
    { value: 'inside_pickup', label: 'Inside Pickup' },
    { value: 'lift_gate', label: 'Lift Gate' }
  ];

  // 收货服务选项（勾选框）
  const deliveryServices = [
    { value: 'appointment_delivery', label: 'Appointment Delivery' },
    { value: 'delivery_call_ahead', label: 'Delivery Call Ahead' },
    { value: 'inside_delivery', label: 'Inside Delivery' },
    { value: 'lift_gate', label: 'Lift Gate' },
    { value: 'sort_and_segregate', label: 'Sort and Segregate' }
  ];

  // NMFC分类代码映射表
  const freightClassMap = useMemo(() => [
    { minDensity: 50, class: '50', description: 'Class 50 - 高密度货物 (Over 50 lbs/cu ft)' },
    { minDensity: 35, class: '55', description: 'Class 55 - 金属制品 (35-50 lbs/cu ft)' },
    { minDensity: 30, class: '60', description: 'Class 60 - 汽车配件 (30-35 lbs/cu ft)' },
    { minDensity: 22.5, class: '65', description: 'Class 65 - 机械设备 (22.5-30 lbs/cu ft)' },
    { minDensity: 15, class: '70', description: 'Class 70 - 电器设备 (15-22.5 lbs/cu ft)' },
    { minDensity: 13.5, class: '77.5', description: 'Class 77.5 - 轮胎 (13.5-15 lbs/cu ft)' },
    { minDensity: 12, class: '85', description: 'Class 85 - 包装货物 (12-13.5 lbs/cu ft)' },
    { minDensity: 10.5, class: '92.5', description: 'Class 92.5 - 家具 (10.5-12 lbs/cu ft)' },
    { minDensity: 9, class: '100', description: 'Class 100 - 纸制品 (9-10.5 lbs/cu ft)' },
    { minDensity: 8, class: '110', description: 'Class 110 - 纺织品 (8-9 lbs/cu ft)' },
    { minDensity: 7, class: '125', description: 'Class 125 - 小家电 (7-8 lbs/cu ft)' },
    { minDensity: 6, class: '150', description: 'Class 150 - 服装 (6-7 lbs/cu ft)' },
    { minDensity: 5, class: '175', description: 'Class 175 - 易碎品 (5-6 lbs/cu ft)' },
    { minDensity: 4, class: '200', description: 'Class 200 - 包装食品 (4-5 lbs/cu ft)' },
    { minDensity: 3, class: '250', description: 'Class 250 - 易损品 (3-4 lbs/cu ft)' },
    { minDensity: 2, class: '300', description: 'Class 300 - 木制品 (2-3 lbs/cu ft)' },
    { minDensity: 1, class: '400', description: 'Class 400 - 塑料制品 (1-2 lbs/cu ft)' },
    { minDensity: 0, class: '500', description: 'Class 500 - 低密度货物 (Under 1 lb/cu ft)' }
  ], []);

  // 单位转换工具
  const unitConverter = React.useMemo(() => ({
    kgToLbs: (kg) => kg ? (parseFloat(kg) * 2.20462).toFixed(1) : '',
    lbsToKg: (lbs) => lbs ? (parseFloat(lbs) / 2.20462).toFixed(1) : '',
    cmToInches: (cm) => cm ? (parseFloat(cm) / 2.54).toFixed(1) : '',
    inchesToCm: (inches) => inches ? (parseFloat(inches) * 2.54).toFixed(1) : ''
  }), []);

  // 计算货物分类 (skip if user manually overrode)
  const calculateFreightClass = React.useCallback((data) => {
    const { weight, length, width, height, pallets, hazmat, fragile, freightClassManual } = data;
    
    if (!weight || !length || !width || !height) return data;
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const palletCount = parseInt(pallets) || 1;
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) return data;
    
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    const weightPerPallet = weightNum / palletCount;
    const density = weightPerPallet / cubicFeet;
    
    if (freightClassManual) {
      return { ...data, volume: cubicFeet.toFixed(2), density: density.toFixed(2) };
    }
    
    let selectedClass = freightClassMap[freightClassMap.length - 1];
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    let finalClass = parseFloat(selectedClass.class);
    if (hazmat) finalClass = Math.max(finalClass, 85);
    if (fragile) finalClass = Math.max(finalClass, 125);
    
    return {
      ...data,
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass.toString()
    };
  }, [freightClassMap]);

  const NMFC_CLASSES = ['50', '55', '60', '65', '70', '77.5', '85', '92.5', '100', '110', '125', '150', '175', '200', '250', '300', '400', '500'];

  // 添加货物项目
  const addCargoItem = () => {
    const newId = Math.max(...formData.cargoItems.map(item => item.id)) + 1;
    const newItem = {
      id: newId,
      description: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      volume: '',
      density: '',
      freightClass: '',
      pallets: '',
      stackable: true,
      fragile: false,
      hazmat: false,
      shippingNumber: '',
      weightKg: '',
      lengthCm: '',
      widthCm: '',
      heightCm: ''
    };
    
    setFormData(prev => ({
      ...prev,
      cargoItems: [...prev.cargoItems, newItem]
    }));
  };

  // 删除货物项目
  const removeCargoItem = (itemId) => {
    if (formData.cargoItems.length <= 1) {
      showError('至少需要保留一个货物项目');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.filter(item => item.id !== itemId)
    }));
  };

  // 更新货物项目
  const updateCargoItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.map(item => {
        if (item.id === itemId) {
          let updatedItem = {
            ...item,
            [field]: value
          };
          
          // 处理单位转换
          const conversionMap = {
            weightKg: () => updatedItem.weight = unitConverter.kgToLbs(value),
            lengthCm: () => updatedItem.length = unitConverter.cmToInches(value),
            widthCm: () => updatedItem.width = unitConverter.cmToInches(value),
            heightCm: () => updatedItem.height = unitConverter.cmToInches(value),
            weight: () => updatedItem.weightKg = unitConverter.lbsToKg(value),
            length: () => updatedItem.lengthCm = unitConverter.inchesToCm(value),
            width: () => updatedItem.widthCm = unitConverter.inchesToCm(value),
            height: () => updatedItem.heightCm = unitConverter.inchesToCm(value)
          };
          if (conversionMap[field]) conversionMap[field]();
          
          // 重新计算分类
          if (['weight', 'length', 'width', 'height', 'hazmat', 'fragile', 'weightKg', 'lengthCm', 'widthCm', 'heightCm'].includes(field)) {
            return calculateFreightClass(updatedItem);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // 处理地址类型下拉菜单变化
  const handleLocationTypeChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 处理服务勾选框变化
  const handleServiceChange = (fieldName, service) => {
    return (e) => {
      const isChecked = e.target.checked;
      setFormData(prev => {
        const currentServices = prev[fieldName] || [];
        if (isChecked) {
          if (!currentServices.includes(service)) {
            return {
              ...prev,
              [fieldName]: [...currentServices, service]
            };
          }
        } else {
          return {
            ...prev,
            [fieldName]: currentServices.filter(s => s !== service)
          };
        }
        return prev;
      });
    };
  };

  // Handle FBA destination
  useEffect(() => {
    if (fbaDestination) {
      const fbaCode = fbaDestination.code;
      setFormData(prev => ({ 
        ...prev, 
        destination: fbaCode,
        destinationLocationTypes: ['fba']
      }));
    }
  }, [fbaDestination, setFormData]);

  // 起点地址选择处理
  const handleOriginPlaceSelected = (placeData) => {
    setSelectedPlaces(prev => {
      const newState = { ...prev, origin: placeData };
      if (newState.destination) {
        calculateDistanceBetweenPoints(placeData, newState.destination);
      }
      return newState;
    });
  };

  // 终点地址选择处理
  const handleDestinationPlaceSelected = (placeData) => {
    setSelectedPlaces(prev => {
      const newState = { ...prev, destination: placeData };
      if (newState.origin) {
        calculateDistanceBetweenPoints(newState.origin, placeData);
      }
      return newState;
    });
  };

  // 计算距离
  const calculateDistanceBetweenPoints = async (origin, destination) => {
    try {
      setCalculatingDistance(true);
      const result = await calculateDistance(
        origin.fullAddress || origin.displayAddress,
        destination.fullAddress || destination.displayAddress
      );
      setDistanceInfo(result);
    } catch (error) {
      console.error('距离计算失败:', error);
      setDistanceInfo(null);
    } finally {
      setCalculatingDistance(false);
    }
  };

  // 表单验证
  const validateFormData = () => {
    const baseRequiredFields = ['origin', 'destination', 'pickupDate', 'originLocationType', 'destinationLocationType'];
    
    const invalidItems = formData.cargoItems.filter(item => 
      !item.weight || !item.length || !item.width || !item.height || !item.pallets 
    );
    if (invalidItems.length > 0) {
      return '请填写所有货物项目的必要信息：重量、尺寸、托盘数量';
    }
    
    const unclassifiedItems = formData.cargoItems.filter(item => !item.freightClass);
    if (unclassifiedItems.length > 0) {
      return '请确保所有货物项目都已计算出NMFC分类代码';
    }
    
    const missingFields = baseRequiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      const fieldNames = {
        origin: '起点',
        destination: '终点',
        pickupDate: '取货日期',
        originLocationType: '起点地址类型',
        destinationLocationType: '终点地址类型'
      };
      const missingFieldNames = missingFields.map(f => fieldNames[f] || f);
      return `请填写所有必填字段: ${missingFieldNames.join(', ')}`;
    }
    
    return null;
  };

  // 开始新报价 - 重置所有状态
  const handleNewQuote = () => {
    resetForm();
    setQuoteResults([]);
    setShowQuoteResults(false);
    setCurrentStep(1);
    setSelectedQuote(null);
    setDistanceInfo(null);
    setSelectedPlaces({ origin: null, destination: null });
    setExpandedQuoteId(null);
    setBreakdownQuoteId(null);
    setSortBy('price');
  };

  // 处理选择报价
  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    setCurrentStep(3); // 进入步骤3: 发货详情
    // 不再预填Address 1，让用户自己填写
  };

  // 处理发货详情表单变化
  const handleShipmentDetailChange = (e) => {
    const { name, value } = e.target;
    setShipmentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交最终订单
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填字段
    const requiredFields = [
      'companyName', 'contactPhone',
      'pickupContactName', 'pickupContactPhone', 'pickupAddress',
      'deliveryContactName', 'deliveryContactPhone', 'deliveryAddress'
    ];
    
    const missingFields = requiredFields.filter(field => !shipmentDetails[field]);
    if (missingFields.length > 0) {
      showError('请填写所有必填字段');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 这里调用API保存订单
      // const orderData = {
      //   ...formData,
      //   selectedQuote,
      //   shipmentDetails
      // };
      // await apiServices.orders.create(orderData);
      
      success('订单已提交！我们会尽快与您联系。');
      
      // 重置并返回首页
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('订单提交失败:', error);
      showError('订单提交失败: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算总重量、托盘数等
  const calculateTotals = () => {
    const totalWeight = formData.cargoItems.reduce((sum, item) => {
      return sum + (parseFloat(item.weight || 0));
    }, 0);
    
    // 总托盘数
    const totalPallets = formData.cargoItems.reduce((sum, item) => sum + parseInt(item.pallets || 0), 0);
    
    // 总线性英尺 = 每个货物的 (长度/12 × 托盘数) 之和
    const totalLinearFeet = formData.cargoItems.reduce((sum, item) => {
      const length = parseFloat(item.length || 0) / 12; // 转换为英尺
      const pallets = parseInt(item.pallets || 0);
      return sum + (length * pallets);
    }, 0);
    
    // 总体积 (立方英尺)
    const totalCubicFeet = formData.cargoItems.reduce((sum, item) => {
      const length = parseFloat(item.length || 0);
      const width = parseFloat(item.width || 0);
      const height = parseFloat(item.height || 0);
      const pallets = parseInt(item.pallets || 0);
      return sum + ((length * width * height / 1728) * pallets); // 1728 = 12^3
    }, 0);
    
    // 最高的货运分类
    const highestClass = Math.max(...formData.cargoItems.map(item => parseFloat(item.freightClass || 0)));
    
    return {
      totalWeight: totalWeight.toFixed(2),
      totalPallets,
      totalLinearFeet: totalLinearFeet.toFixed(2),
      totalCubicFeet: totalCubicFeet.toFixed(2),
      freightClass: highestClass
    };
  };

  const totals = calculateTotals();

  const sortedQuotes = React.useMemo(() => {
    const quotes = [...quoteResults];
    switch (sortBy) {
      case 'price':
        return quotes.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'time':
        return quotes.sort((a, b) => {
          const daysA = parseInt(String(a.transitDays || '').match(/\d+/)?.[0] || '999');
          const daysB = parseInt(String(b.transitDays || '').match(/\d+/)?.[0] || '999');
          return daysA - daysB;
        });
      case 'name':
        return quotes.sort((a, b) => (a.carrier || '').localeCompare(b.carrier || ''));
      default:
        return quotes;
    }
  }, [quoteResults, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showError('请先登录再获取报价');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const validationError = validateFormData();
    if (validationError) {
      showError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      // 从selectedPlaces提取城市、州、邮编信息
      const extractAddressComponents = (addressComponents) => {
        let city = '', state = '', zip = '';
        if (addressComponents) {
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality')) city = component.long_name;
            else if (types.includes('sublocality_level_1') && !city) city = component.long_name;
            if (types.includes('administrative_area_level_1')) state = component.short_name;
            if (types.includes('postal_code')) zip = component.long_name;
          });
        }
        return { city, state, zip };
      };

      let originComponents = selectedPlaces?.origin?.addressComponents 
        ? extractAddressComponents(selectedPlaces.origin.addressComponents)
        : { city: '', state: '', zip: '' };

      let destinationComponents = selectedPlaces?.destination?.addressComponents
        ? extractAddressComponents(selectedPlaces.destination.addressComponents)
        : { city: '', state: '', zip: '' };

      // Fallback: extract zipcode from text input if user didn't select a suggestion
      const parseZipFromInput = (input) => {
        const match = (input || '').match(/\b(\d{5})\b/);
        return match ? match[1] : '';
      };

      if (!originComponents.zip) {
        originComponents = { ...originComponents, zip: parseZipFromInput(formData.origin) };
      }
      if (!destinationComponents.zip) {
        destinationComponents = { ...destinationComponents, zip: parseZipFromInput(formData.destination) };
      }

      // If city/state missing but zip available, try zipcode lookup via backend
      if (originComponents.zip && (!originComponents.city || !originComponents.state)) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/zipcode/lookup?zip=${originComponents.zip}`);
          if (res.ok) {
            const data = await res.json();
            originComponents = { ...originComponents, city: data.city || originComponents.city, state: data.state || originComponents.state };
          }
        } catch (err) { console.warn('Origin zipcode lookup failed:', err); }
      }
      if (destinationComponents.zip && (!destinationComponents.city || !destinationComponents.state)) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/zipcode/lookup?zip=${destinationComponents.zip}`);
          if (res.ok) {
            const data = await res.json();
            destinationComponents = { ...destinationComponents, city: data.city || destinationComponents.city, state: data.state || destinationComponents.state };
          }
        } catch (err) { console.warn('Destination zipcode lookup failed:', err); }
      }

      // Always recalculate distance using zipcodes via Google Maps Distance Matrix
      let distanceMiles = null;
      const originAddr = originComponents.zip || formData.origin;
      const destAddr = destinationComponents.zip || formData.destination;
      try {
        setCalculatingDistance(true);
        const freshDistance = await calculateDistance(originAddr, destAddr);
        setDistanceInfo(freshDistance);
        if (freshDistance?.distance) {
          const distStr = freshDistance.distance.replace(/,/g, '');
          const distMatch = distStr.match(/[\d.]+/);
          if (distMatch) distanceMiles = Math.round(parseFloat(distMatch[0]));
        }
      } catch (distError) {
        console.warn('Distance recalculation failed, using cached value:', distError);
        if (distanceInfo?.distance) {
          const distStr = distanceInfo.distance.replace(/,/g, '');
          const distMatch = distStr.match(/[\d.]+/);
          if (distMatch) distanceMiles = Math.round(parseFloat(distMatch[0]));
        }
      } finally {
        setCalculatingDistance(false);
      }

      // 准备多承运商 API 请求数据
      const quoteRequestData = {
        originCity: originComponents.city,
        originState: originComponents.state,
        originZip: originComponents.zip,
        originCountry: 'US',
        originLocationType: formData.originLocationType,
        destinationCity: destinationComponents.city,
        destinationState: destinationComponents.state,
        destinationZip: destinationComponents.zip,
        destinationCountry: 'US',
        destinationLocationType: formData.destinationLocationType,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        items: formData.cargoItems,
        pickupServices: formData.pickupServices,
        deliveryServices: formData.deliveryServices,
        distanceMiles
      };

      console.log('🚚 准备调用 5 家运输商API获取LTL报价...', quoteRequestData);
      console.log('📋 运输商列表: Warp, Roadrunner, R+L Carriers, Saia, TForce');

      // 调用统一接口获取所有运输商报价
      const quotes = await freightApi.getAllLTLQuotes(quoteRequestData);
      
      if (quotes && quotes.length > 0) {
        setQuoteResults(quotes);
        setShowQuoteResults(true);
        setCurrentStep(2);
        success(`成功获取 ${quotes.length} 个报价（来自多家运输商）！`);
        
        // ====== 自动在员工系统创建报价单 + 保存报价会话 ======
        const weights = formData.cargoItems.map(item => 
          Math.round(parseFloat(item.weight || 0))
        );
        const dimensions = formData.cargoItems.map(item => ({
          length: Math.round(parseFloat(item.length || 0)),
          width: Math.round(parseFloat(item.width || 0)),
          height: Math.round(parseFloat(item.height || 0)),
          pieces: parseInt(item.pallets || 1),
          volume: (parseFloat(item.length || 0) * parseFloat(item.width || 0) * parseFloat(item.height || 0) / 1728),
          freightClass: item.freightClass || ''
        }));
        const totals = calculateTotals();
        const userEmail = user?.email || user?.attributes?.email || '未知用户';
        const getNYDate = () => {
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          return formatter.format(new Date());
        };
        let transportDistance = null;
        if (distanceInfo?.distance) {
          const distanceStr = distanceInfo.distance.replace(/,/g, '');
          const distanceMatch = distanceStr.match(/[\d.]+/);
          if (distanceMatch) {
            transportDistance = Math.round(parseFloat(distanceMatch[0]));
          }
        }

        let employeeOrderId = null;
        try {
          const orderData = {
            customer_name: userEmail,
            inquiry_company: userEmail,
            cargo_description: formData.cargoItems[0]?.description || 'LTL货物',
            cargo_description_detailed: formData.cargoItems.map((item, idx) => 
              `货物${idx + 1}: ${item.pallets || 1}托盘, ${item.weight || 0}lbs, ${item.length}×${item.width}×${item.height}in`
            ).join('; '),
            order_type: 'land_freight',
            status: 'quote',
            quote_date: getNYDate(),
            origin_city: originComponents.city,
            origin_state: originComponents.state,
            origin_zipcode: originComponents.zip,
            destination_city: destinationComponents.city,
            destination_state: destinationComponents.state,
            destination_zipcode: destinationComponents.zip,
            address_type: formData.destinationLocationType || 'commercial',
            weight_list: JSON.stringify(weights),
            dimensions_list: JSON.stringify(dimensions),
            total_weight_lbs: parseFloat(totals.totalWeight),
            total_volume: parseFloat(totals.totalCubicFeet),
            actual_pallets: totals.totalPallets,
            transport_distance: transportDistance,
            ew_quote_price: quotes[0]?.price || 0,
            cargo_type: `LTL报价 - ${quotes.length}家运输商`,
            pickup_date: formData.pickupDate,
            delivery_date: formData.deliveryDate
          };
          
          console.log('📋 创建报价单到员工系统:', orderData);
          const createResponse = await orderApi.createOrder(orderData);
          if (createResponse.success) {
            console.log('✅ 报价单已同步到员工系统:', createResponse.data);
            employeeOrderId = createResponse.data?.id;
          }
        } catch (syncError) {
          console.error('⚠️ 同步报价单到员工系统失败:', syncError);
        }

        // Always save quote session regardless of employee order sync result
        try {
          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
          const sessionPayload = {
            userEmail,
            originCity: originComponents.city,
            originState: originComponents.state,
            originZip: originComponents.zip,
            destinationCity: destinationComponents.city,
            destinationState: destinationComponents.state,
            destinationZip: destinationComponents.zip,
            originLocationType: formData.originLocationType,
            destinationLocationType: formData.destinationLocationType,
            distanceMiles: transportDistance,
            pickupDate: formData.pickupDate,
            deliveryDate: formData.deliveryDate,
            items: formData.cargoItems.map(item => ({
              id: item.id,
              description: item.description,
              weight: item.weight,
              length: item.length,
              width: item.width,
              height: item.height,
              pallets: item.pallets,
              freightClass: item.freightClass,
              stackable: item.stackable,
              hazmat: item.hazmat
            })),
            pickupServices: formData.pickupServices || [],
            deliveryServices: formData.deliveryServices || [],
            totalWeight: parseFloat(totals.totalWeight),
            totalPallets: totals.totalPallets,
            quoteResults: quotes.map(q => ({
              id: q.id,
              carrier: q.carrier,
              carrierCode: q.carrierCode,
              logo: q.logo,
              quoteId: q.quoteId,
              price: q.price,
              currency: q.currency,
              transitDays: q.transitDays,
              serviceType: q.serviceType,
              serviceLevel: q.serviceLevel,
              serviceBadge: q.serviceBadge,
              serviceColor: q.serviceColor,
              isGuaranteed: q.isGuaranteed,
              expDate: q.expDate,
              fuelSurcharge: q.fuelSurcharge,
              charges: q.charges,
              breakdown: q.breakdown,
              maxLiability: q.maxLiability,
              pickupTerminal: q.pickupTerminal,
              dropTerminal: q.dropTerminal,
              source: q.source
            })),
            lowestPrice: quotes[0]?.price || 0,
            employeeOrderId
          };
          console.log('📤 Saving quote session, userEmail:', userEmail);
          const saveRes = await fetch(`${apiBase}/ltl-quotes/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionPayload)
          });
          const saveData = await saveRes.json();
          if (saveRes.ok && saveData.success) {
            console.log('✅ Quote session saved:', saveData.data?.session_id);
          } else {
            console.error('❌ Quote session save failed:', saveRes.status, saveData);
          }
        } catch (sessionError) {
          console.error('❌ Failed to save quote session:', sessionError);
        }
        // ====== 同步结束 ======
        
      } else {
        showError('未找到可用的报价，请检查运输信息或稍后重试');
      }
      
    } catch (error) {
      console.error('❌ 多承运商API调用失败:', error);
      showError('获取报价失败: ' + error.message);
      
      // 如果API失败，降级使用Mock数据进行测试
      console.log('⚠️ 降级使用Mock数据（仅用于演示）...');
      const mockQuotes = [
        {
          id: 1,
          carrier: 'XPO Logistics',
          logo: 'https://via.placeholder.com/120x50?text=XPO',
          serviceLevel: 'Standard LTL',
          price: 837.44,
          serviceType: '(S) Guaranteed 5 PM',
          transitDays: '5 Days Guaranteed',
          transitType: 'Direct',
          maxLiability: { new: 1742.00, used: 355.00 },
          expDate: '11/28/2025',
          pickupTerminal: {
            name: 'BROOKLYN [XBY]',
            address1: '1313 GRAND STREET',
            address2: '',
            city: 'BROOKLYN',
            state: 'NY',
            zip: '11211',
            country: 'USA',
            phone: '718-381-3700',
            tollFree: '800-896-8423'
          },
          dropTerminal: {
            name: 'LOS ANGELES [ULX]',
            address1: '1955 E WASHINGTON BLVD',
            address2: '',
            city: 'LOS ANGELES',
            state: 'CA',
            zip: '90021',
            country: 'USA',
            phone: '213-744-0664',
            tollFree: '800-221-6084'
          }
        }
      ];
      setQuoteResults(mockQuotes);
      setShowQuoteResults(true);
      setCurrentStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };
   
  return (
    <div className="get-quote-page">
      <div className="get-quote-container">
        {!showQuoteResults ? (
          <>
            {/* 进度条 - 步骤1 */}
            <ProgressSteps currentStep={1} />
            
            {/* 简化的小标题 */}
            <div className="page-title-simple">
              <h1>获取LTL报价</h1>
            </div>

        <form onSubmit={handleSubmit} className="quote-form">
          {/* 起点信息 */}
          <div className="form-section">
            <h3>起点信息 (Origin)</h3>
            <div className="form-grid">
              <GoogleMapsAddressInput
                label="起点 (Origin)"
                placeholder="输入城市名、街道地址或邮编"
                value={formData.origin}
                onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                onPlaceSelected={handleOriginPlaceSelected}
                required={true}
                icon={MapPin}
              />
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  取货日期 <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>起点地址类型 <span className="required">*</span></label>
                <select
                  value={formData.originLocationType}
                  onChange={(e) => handleLocationTypeChange('originLocationType', e.target.value)}
                  required
                >
                  {locationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>取货服务</label>
                <div className="service-checkboxes">
                  {pickupServices.map(service => (
                    <label key={service.value} className="service-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.pickupServices?.includes(service.value) || false}
                        onChange={handleServiceChange('pickupServices', service.value)}
                      />
                      <span>{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 终点信息 */}
          <div className="form-section">
            <h3>终点信息 (Destination)</h3>
            <div className="form-grid">
              <GoogleMapsAddressInput
                label="终点 (Destination)"
                placeholder="输入城市名、街道地址或邮编"
                value={formData.destination}
                onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                onPlaceSelected={handleDestinationPlaceSelected}
                required={true}
                icon={MapPin}
              />
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  送达日期
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>终点地址类型 <span className="required">*</span></label>
                <select
                  value={formData.destinationLocationType}
                  onChange={(e) => handleLocationTypeChange('destinationLocationType', e.target.value)}
                  required
                >
                  {locationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>收货服务</label>
                <div className="service-checkboxes">
                  {deliveryServices.map(service => (
                    <label key={service.value} className="service-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.deliveryServices?.includes(service.value) || false}
                        onChange={handleServiceChange('deliveryServices', service.value)}
                      />
                      <span>{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 货物信息 */}
          <div className="form-section">
            <h3>货物信息</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Package size={16} />
                  货物类型
                </label>
                <select name="cargoType" value={formData.cargoType} onChange={handleInputChange}>
                  <option value="">请选择货物类型</option>
                  {cargoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="nmfc-info">
              <Info size={16} />
              <p>每个货物会根据NMFC标准自动计算分类等级，您也可以手动修改。</p>
            </div>

            {formData.cargoItems.map((item, index) => (
              <div key={item.id} className="cargo-item-card">
                <div className="cargo-item-header">
                  <h4 className="cargo-item-title">货物 #{index + 1}</h4>
                </div>

                <div className="form-grid cargo-basic-grid">
                  <div className="form-group">
                    <label>托盘数量 <span className="required">*</span></label>
                    <input
                      type="number"
                      className="input-narrow"
                      value={item.pallets}
                      onChange={(e) => updateCargoItem(item.id, 'pallets', e.target.value)}
                      placeholder="数量"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>货物描述</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateCargoItem(item.id, 'description', e.target.value)}
                      placeholder="如：电子设备、机械部件等"
                    />
                  </div>
                  <div className="form-group">
                    <label><Hash size={16} /> 初始单号</label>
                    <input
                      type="text"
                      value={item.shippingNumber}
                      onChange={(e) => updateCargoItem(item.id, 'shippingNumber', e.target.value)}
                      placeholder="如：SH123456789"
                    />
                  </div>
                </div>

                {/* Imperial units row */}
                <div className="dimensions-unit-row">
                  <span className="unit-row-label">lbs / inches</span>
                  <div className="dimension-compact-group">
                    <div className="dimension-compact-item">
                      <label>重量(lbs) <span className="required">*</span></label>
                      <input type="number" className="input-medium" value={item.weight}
                        onChange={(e) => updateCargoItem(item.id, 'weight', e.target.value)}
                        placeholder="lbs" min="1" step="0.1" required />
                    </div>
                    <div className="dimension-compact-item">
                      <label>长(in) <span className="required">*</span></label>
                      <input type="number" className="input-medium" value={item.length}
                        onChange={(e) => updateCargoItem(item.id, 'length', e.target.value)}
                        placeholder="in" min="1" step="0.1" required />
                    </div>
                    <div className="dimension-compact-item">
                      <label>宽(in) <span className="required">*</span></label>
                      <input type="number" className="input-medium" value={item.width}
                        onChange={(e) => updateCargoItem(item.id, 'width', e.target.value)}
                        placeholder="in" min="1" step="0.1" required />
                    </div>
                    <div className="dimension-compact-item">
                      <label>高(in) <span className="required">*</span></label>
                      <input type="number" className="input-medium" value={item.height}
                        onChange={(e) => updateCargoItem(item.id, 'height', e.target.value)}
                        placeholder="in" min="1" step="0.1" required />
                    </div>
                  </div>
                </div>

                {/* Metric units row */}
                <div className="dimensions-unit-row metric-row">
                  <span className="unit-row-label">kg / cm</span>
                  <div className="dimension-compact-group">
                    <div className="dimension-compact-item">
                      <label>重量(kg)</label>
                      <input type="number" className="input-medium" value={item.weightKg}
                        onChange={(e) => updateCargoItem(item.id, 'weightKg', e.target.value)}
                        placeholder="kg" step="0.1" />
                    </div>
                    <div className="dimension-compact-item">
                      <label>长(cm)</label>
                      <input type="number" className="input-medium" value={item.lengthCm}
                        onChange={(e) => updateCargoItem(item.id, 'lengthCm', e.target.value)}
                        placeholder="cm" step="0.1" />
                    </div>
                    <div className="dimension-compact-item">
                      <label>宽(cm)</label>
                      <input type="number" className="input-medium" value={item.widthCm}
                        onChange={(e) => updateCargoItem(item.id, 'widthCm', e.target.value)}
                        placeholder="cm" step="0.1" />
                    </div>
                    <div className="dimension-compact-item">
                      <label>高(cm)</label>
                      <input type="number" className="input-medium" value={item.heightCm}
                        onChange={(e) => updateCargoItem(item.id, 'heightCm', e.target.value)}
                        placeholder="cm" step="0.1" />
                    </div>
                  </div>
                </div>

                {parseInt(item.pallets) > 1 && item.weight && (
                  <div className="calculated-total-weight">
                    <span className="total-label">每托盘:</span>
                    <span className="total-value">
                      {(parseFloat(item.weight) / parseInt(item.pallets)).toFixed(1)} lbs
                    </span>
                  </div>
                )}

                {/* NMFC result with editable class */}
                {(item.volume || item.freightClass) && (
                  <div className="calculation-results-compact">
                    {item.volume && (
                      <div className="result-compact">
                        <span className="label">体积:</span>
                        <span className="value">{item.volume} ft³</span>
                      </div>
                    )}
                    {item.density && (
                      <div className="result-compact">
                        <span className="label">密度:</span>
                        <span className="value">{item.density} lbs/ft³</span>
                      </div>
                    )}
                    <div className="result-compact primary">
                      <span className="label">NMFC等级:</span>
                      <select
                        className="nmfc-select"
                        value={item.freightClass || ''}
                        onChange={(e) => {
                          updateCargoItem(item.id, 'freightClass', e.target.value);
                          updateCargoItem(item.id, 'freightClassManual', true);
                        }}
                      >
                        <option value="">自动</option>
                        {NMFC_CLASSES.map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="special-attributes-compact">
                  <label className="checkbox-item">
                    <input type="checkbox" checked={item.stackable}
                      onChange={(e) => updateCargoItem(item.id, 'stackable', e.target.checked)} />
                    <span>可堆叠</span>
                  </label>
                  <label className="checkbox-item hazmat">
                    <input type="checkbox" checked={item.hazmat}
                      onChange={(e) => updateCargoItem(item.id, 'hazmat', e.target.checked)} />
                    <span>危险品</span>
                  </label>
                </div>

                <div className="cargo-item-actions">
                  <button type="button" onClick={addCargoItem} className="btn add-cargo-btn">
                    <Plus size={16} /> 添加货物
                  </button>
                  {formData.cargoItems.length > 1 && (
                    <button type="button" onClick={() => removeCargoItem(item.id)} className="btn remove-cargo-btn">
                      <Minus size={14} /> 删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              获取LTL报价
            </Button>
          </div>
        </form>
          </>
        ) : (
          /* 报价结果展示 */
          <div className="quote-results-section">
            {/* 进度条 */}
            <ProgressSteps currentStep={currentStep} />

            {/* SHIPMENT SUMMARY */}
            {currentStep >= 2 && (
              <ShipmentSummary 
                formData={formData}
                totals={totals}
                currentStep={currentStep}
                onBackClick={currentStep === 2 ? () => {
                  setShowQuoteResults(false);
                  setCurrentStep(1);
                } : null}
              />
            )}

            {/* 步骤2: 承运商选择 */}
            {currentStep === 2 && (
              <div className="carrier-rates-section">
                <div className="carrier-rates-header">
                  <h2>CARRIER RATES</h2>
                  <div className="carrier-rates-nav">
                    <button type="button" className="btn-new-quote" onClick={handleNewQuote}>
                      <RefreshCw size={16} /> New Quote
                    </button>
                    <button type="button" className="btn-all-quotes" onClick={() => navigate('/my-quotes')}>
                      <List size={16} /> All Quotes
                    </button>
                  </div>
                </div>
                
                <div className="sort-controls">
                  <label>排序方式：</label>
                  <div className="sort-buttons">
                    <button 
                      className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
                      onClick={() => setSortBy('price')}
                    >
                      最低价格
                    </button>
                    <button 
                      className={`sort-btn ${sortBy === 'time' ? 'active' : ''}`}
                      onClick={() => setSortBy('time')}
                    >
                      最快到达
                    </button>
                    <button 
                      className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                      onClick={() => setSortBy('name')}
                    >
                      A-Z排序
                    </button>
                  </div>
                </div>

                <div className="quote-cards-container">
                  {sortedQuotes.map((quote) => (
                    <div key={quote.id} className="quote-card-ltl">
                      <div className="quote-card-main">
                        {/* 展开/收起箭头 - 左上角 */}
                        <button 
                          className="btn-expand-corner"
                          onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                          aria-label={expandedQuoteId === quote.id ? "收起" : "展开"}
                        >
                          {expandedQuoteId === quote.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {/* 第一列：承运商信息 */}
                        <div className="col-carrier">
                          <img src={quote.logo} alt={quote.carrier} className="carrier-logo" />
                          <div className="carrier-details">
                            <div className="carrier-name">{quote.carrier}</div>
                            <a href="#restrictions" className="view-restrictions">View Restrictions</a>
                          </div>
                        </div>

                        {/* 第二列：服务等级和价格 */}
                        <div className="col-price">
                          <div 
                            className={`service-level-badge ${quote.serviceBadge || 'standard'}`}
                            style={{ backgroundColor: quote.serviceColor || '#4CAF50' }}
                          >
                            {quote.isGuaranteed && <span className="guarantee-icon">✓</span>}
                            {quote.serviceLevel || 'Standard LTL'}
                          </div>
                          <div className="price-big">
                            ${(quote.price || 0).toFixed(2)}
                          </div>
                          <button
                            className="btn-price-breakdown"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBreakdownQuoteId(breakdownQuoteId === quote.id ? null : quote.id);
                            }}
                          >
                            {breakdownQuoteId === quote.id ? '收起明细' : '价格明细'}
                          </button>
                          <div className="exp-date-small">有效期: {quote.expDate || 'N/A'}</div>
                        </div>

                        {/* 第三列：服务类型和运输时间 */}
                        <div className="col-service">
                          <div className="service-type-text">{quote.serviceType || 'LTL Service'}</div>
                          <div className="transit-time">
                            <Clock size={14} className="inline-icon" />
                            {quote.transitDays || 'TBD'}
                          </div>
                        </div>

                        {/* 第四列：运输方式和Quote ID */}
                        <div className="col-transit">
                          <div className="transit-label">{quote.isGuaranteed ? '保证送达' : '标准运输'}</div>
                          <div className="quote-id-small">#{quote.quoteId?.slice(-8) || 'N/A'}</div>
                        </div>

                        {/* 第五列：最大责任险 */}
                        {quote.maxLiability && (
                          <div className="col-liability">
                            <div className="liability-title">Max Liability</div>
                            <div className="liability-amount">
                              New: ${quote.maxLiability.new?.toLocaleString()}
                            </div>
                            <div className="liability-amount used">
                              Used: ${quote.maxLiability.used?.toLocaleString()}
                            </div>
                          </div>
                        )}

                        {/* 预订按钮 */}
                        <div className="col-action">
                          <button 
                            className="btn-book-it"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectQuote(quote);
                            }}
                          >
                            立即预订
                          </button>
                        </div>
                      </div>

                      {/* 价格明细 - 点击显示 */}
                      {breakdownQuoteId === quote.id && (
                        <div className="quote-price-breakdown">
                          <h4>价格明细 (Price Breakdown)</h4>
                          <div className="breakdown-list">
                            {quote.charges && quote.charges.length > 0 ? (
                              <>
                                {quote.charges.map((charge, idx) => (
                                  <div key={idx} className="breakdown-item">
                                    <span className="breakdown-desc">{charge.description}</span>
                                    <span className="breakdown-amount">${parseFloat(charge.amount || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                                {quote.fuelSurcharge && !quote.charges.some(c => (c.description || '').toLowerCase().includes('fuel')) && (
                                  <div className="breakdown-item">
                                    <span className="breakdown-desc">Fuel Surcharge</span>
                                    <span className="breakdown-amount">${parseFloat(quote.fuelSurcharge).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="breakdown-item breakdown-total">
                                  <span className="breakdown-desc">Total</span>
                                  <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                {quote.fuelSurcharge ? (
                                  <>
                                    <div className="breakdown-item">
                                      <span className="breakdown-desc">Base Freight</span>
                                      <span className="breakdown-amount">${(Math.round((quote.price - parseFloat(quote.fuelSurcharge)) * 100) / 100).toFixed(2)}</span>
                                    </div>
                                    <div className="breakdown-item">
                                      <span className="breakdown-desc">Fuel Surcharge</span>
                                      <span className="breakdown-amount">${parseFloat(quote.fuelSurcharge).toFixed(2)}</span>
                                    </div>
                                    <div className="breakdown-item breakdown-total">
                                      <span className="breakdown-desc">Total</span>
                                      <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="breakdown-item breakdown-total">
                                    <span className="breakdown-desc">Total Charge</span>
                                    <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 展开的终端信息 */}
                      {expandedQuoteId === quote.id && (
                        <div className="quote-card-expanded">
                          <div className="terminals-container">
                            {/* 取货终端 */}
                            {quote.pickupTerminal && Object.keys(quote.pickupTerminal).length > 0 ? (
                              <div className="terminal-card">
                                <div className="terminal-header">
                                  <MapPin size={14} />
                                  <h4>取货终端</h4>
                                </div>
                                <div className="terminal-body">
                                  <div className="terminal-item">
                                    <span className="label">名称：</span>
                                    <span className="value">{quote.pickupTerminal.name || 'N/A'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">地址：</span>
                                    <span className="value">
                                      {quote.pickupTerminal.address1 || 'N/A'}
                                      {quote.pickupTerminal.address2 && `, ${quote.pickupTerminal.address2}`}
                                    </span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">城市：</span>
                                    <span className="value">
                                      {quote.pickupTerminal.city || ''}, {quote.pickupTerminal.state || ''} {quote.pickupTerminal.zip || ''}
                                    </span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">国家：</span>
                                    <span className="value">{quote.pickupTerminal.country || 'USA'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">
                                      <Phone size={12} className="inline-icon" />
                                      电话：
                                    </span>
                                    <span className="value">{quote.pickupTerminal.phone || 'N/A'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">
                                      <Phone size={12} className="inline-icon" />
                                      免费：
                                    </span>
                                    <span className="value">{quote.pickupTerminal.tollFree || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="terminal-card terminal-na">
                                <div className="terminal-header">
                                  <MapPin size={14} />
                                  <h4>取货终端</h4>
                                </div>
                                <div className="terminal-body">
                                  <p className="no-terminal-info">终端信息暂不可用</p>
                                </div>
                              </div>
                            )}

                            {/* 送货终端 */}
                            {quote.dropTerminal && Object.keys(quote.dropTerminal).length > 0 ? (
                              <div className="terminal-card">
                                <div className="terminal-header">
                                  <MapPin size={14} />
                                  <h4>送货终端</h4>
                                </div>
                                <div className="terminal-body">
                                  <div className="terminal-item">
                                    <span className="label">名称：</span>
                                    <span className="value">{quote.dropTerminal.name || 'N/A'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">地址：</span>
                                    <span className="value">
                                      {quote.dropTerminal.address1 || 'N/A'}
                                      {quote.dropTerminal.address2 && `, ${quote.dropTerminal.address2}`}
                                    </span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">城市：</span>
                                    <span className="value">
                                      {quote.dropTerminal.city || ''}, {quote.dropTerminal.state || ''} {quote.dropTerminal.zip || ''}
                                    </span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">国家：</span>
                                    <span className="value">{quote.dropTerminal.country || 'USA'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">
                                      <Phone size={12} className="inline-icon" />
                                      电话：
                                    </span>
                                    <span className="value">{quote.dropTerminal.phone || 'N/A'}</span>
                                  </div>
                                  <div className="terminal-item">
                                    <span className="label">
                                      <Phone size={12} className="inline-icon" />
                                      免费：
                                    </span>
                                    <span className="value">{quote.dropTerminal.tollFree || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="terminal-card terminal-na">
                                <div className="terminal-header">
                                  <MapPin size={14} />
                                  <h4>送货终端</h4>
                                </div>
                                <div className="terminal-body">
                                  <p className="no-terminal-info">终端信息暂不可用</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="results-footer">
                  <p className="disclaimer">
                    * 以上报价为估算价格，实际价格可能因货物具体情况、附加服务等因素有所调整。
                  </p>
                  <p className="disclaimer">
                    * 所有报价将自动保存至您的个人中心。选择承运商后，请填写详细的发货和收货信息。
                  </p>
                </div>

                <div className="results-actions">
                  <button type="button" className="btn-new-quote" onClick={handleNewQuote}>
                    <RefreshCw size={16} /> New Quote
                  </button>
                  <button type="button" className="btn-all-quotes" onClick={() => navigate('/my-quotes')}>
                    <List size={16} /> All Quotes
                  </button>
                </div>
              </div>
            )}

            {/* 步骤3: 发货详情表单 */}
            {currentStep === 3 && selectedQuote && (
              <ShipmentDetailsForm
                selectedQuote={selectedQuote}
                shipmentDetails={shipmentDetails}
                formData={formData}
                selectedPlaces={selectedPlaces}
                onChange={handleShipmentDetailChange}
                onSubmit={handleFinalSubmit}
                onBack={() => setCurrentStep(2)}
                isSubmitting={isSubmitting}
                setShipmentDetails={setShipmentDetails}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetQuoteLTL;

