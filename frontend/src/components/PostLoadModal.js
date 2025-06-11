import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Package, 
  Truck, 
  Scale,
  Layers,
  Hash,
  Home,
  Building,
  Shield,
  Calculator,
  AlertCircle,
  Info,
  Phone,
  DollarSign,
  Clock,
  Plus,
  Minus,
  Navigation
} from 'lucide-react';
import './Modal.css';
import { GoogleMapsAddressInput, GoogleMapsRoute, calculateDistance, geocodeAddress } from './GoogleMapsAddressInput';

const PostLoadModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'load',
    serviceType: 'FTL', // FTL 或 LTL
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    cargoType: '',
    truckType: '',
    weight: '',
    cargoValue: '', // FTL 货物估价
    shippingNumber: '', // 初始单号
    // FTL单位转换辅助字段
    weightKg: '',
    // LTL专用字段 - 按照NMFC标准
    originLocationTypes: [], // 改为数组
    destinationLocationTypes: [], // 改为数组
    pallets: '',
    // LTL多货物支持
    cargoItems: [
      {
        id: 1,
        description: '',
        weight: '', // 磅
        length: '', // 英寸
        width: '',  // 英寸
        height: '', // 英寸
        volume: '', // 自动计算的立方英尺
        density: '', // 自动计算的磅/立方英尺
        freightClass: '', // 自动计算的NMFC分类
        pallets: '', // 这个货物的托盘数
        estimatedRate: '', // 每个货物项目的预估价格
        stackable: true,
        fragile: false,
        hazmat: false,
        shippingNumber: '', // LTL货物初始单号
        // 单位转换辅助字段
        weightKg: '',
        lengthCm: '',
        widthCm: '',
        heightCm: ''
      }
    ],
    // FTL单货物字段（保留向后兼容）
    length: '', // 英寸
    width: '',  // 英寸
    height: '', // 英寸
    // 自动计算字段
    volume: '', // 自动计算的立方英尺
    density: '', // 自动计算的磅/立方英尺
    freightClass: '', // 自动计算的NMFC分类
    // LTL特性
    stackable: true,
    allowMixedLoad: true,
    hazmat: false,
    fragile: false,
    // 联系信息
    contactPhone: '',
    contactEmail: '',
    notes: '',
    companyName: '',
    maxRate: ''
  });

  const [densityInfo, setDensityInfo] = useState({
    calculated: false,
    density: 0,
    suggestedClass: '',
    classDescription: ''
  });

  // Google Maps 相关状态
  const [selectedPlaces, setSelectedPlaces] = useState({
    origin: null,
    destination: null
  });

  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // 距离信息状态
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  
  // 提交处理状态
  const [submitting, setSubmitting] = useState(false);

  // 货物类型选项 - 按照NMFC标准分类
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

  // 车型要求选项
  const truckTypes = [
    '干货车 (Dry Van)', 
    '平板车 (Flatbed)', 
    '冷藏车 (Refrigerated)', 
    '危险品车 (Hazmat)',
    '超长车 (Stretch)', 
    '超重车 (Heavy Haul)', 
    '升降尾板 (Liftgate Required)', 
    '其他 (Other)'
  ];

  // 地址类型选项 - 改为勾选形式
  const locationTypeOptions = [
    { value: 'appointment', label: '预约', icon: Clock },
    { value: 'commercial', label: '商业地址', icon: Building },
    { value: 'residential', label: '住宅地址', icon: Home },
    { value: 'gated', label: '门禁', icon: Shield },
    { value: 'elevator', label: '升降机', icon: Layers }
  ];

  // NMFC分类代码映射表 - 基于密度
  const freightClassMap = [
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
  ];

  // 货物估价选项
  const cargoValueOptions = [
    { value: '', label: '请选择货物估价范围' },
    { value: '0k-25k', label: '$0k - $25k' },
    { value: '25k-50k', label: '$25k - $50k' },
    { value: '50k-75k', label: '$50k - $75k' },
    { value: '75k-100k', label: '$75k - $100k' },
    { value: '100k-125k', label: '$100k - $125k' },
    { value: '125k-150k', label: '$125k - $150k' },
    { value: '150k-175k', label: '$150k - $175k' },
    { value: '175k-200k', label: '$175k - $200k' },
    { value: '200k-225k', label: '$200k - $225k' },
    { value: '225k-250k', label: '$225k - $250k' },
    { value: '250k-500k', label: '$250k - $500k' },
    { value: '500k-1M', label: '$500k - $1M' },
    { value: '1M-2M', label: '$1M - $2M' },
    { value: '2M-3M', label: '$2M - $3M' },
    { value: '3M-4M', label: '$3M - $4M' },
    { value: '4M-5M', label: '$4M - $5M' },
    { value: '5M+', label: '$5M+' }
  ];

  // 单位转换函数
  const convertKgToLbs = (kg) => {
    return kg ? (parseFloat(kg) * 2.20462).toFixed(1) : '';
  };

  const convertCmToInches = (cm) => {
    return cm ? (parseFloat(cm) / 2.54).toFixed(1) : '';
  };

  const convertLbsToKg = (lbs) => {
    return lbs ? (parseFloat(lbs) / 2.20462).toFixed(1) : '';
  };

  const convertInchesToCm = (inches) => {
    return inches ? (parseFloat(inches) * 2.54).toFixed(1) : '';
  };

  // 计算密度和分类代码
  const calculateFreightClass = () => {
    const { weight, length, width, height } = formData;
    
    if (!weight || !length || !width || !height) return;
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) return;
    
    // 计算立方英尺 (长x宽x高 英寸 / 1728)
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    
    // 计算密度 (磅/立方英尺)
    const density = weightNum / cubicFeet;
    
    // 根据密度确定分类代码
    let selectedClass = freightClassMap[freightClassMap.length - 1]; // 默认最低分类
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    // 危险品或易碎品需要特殊处理
    let finalClass = selectedClass.class;
    let classDescription = selectedClass.description;
    
    if (formData.hazmat) {
      // 危险品通常分类更高
      const hazmatClassNum = Math.max(parseFloat(finalClass), 85);
      finalClass = hazmatClassNum.toString();
      classDescription += ' (危险品调整)';
    }
    
    if (formData.fragile) {
      // 易碎品可能需要更高分类
      const fragileClassNum = Math.max(parseFloat(finalClass), 125);
      finalClass = fragileClassNum.toString();
      classDescription += ' (易碎品调整)';
    }
    
    setFormData(prev => ({
      ...prev,
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass
    }));
    
    setDensityInfo({
      calculated: true,
      density: density.toFixed(2),
      suggestedClass: finalClass,
      classDescription: classDescription
    });
  };

  // 计算单个货物项目的密度和分类代码
  const calculateCargoItemClass = (item) => {
    const { weight, length, width, height, hazmat, fragile } = item;
    
    if (!weight || !length || !width || !height) return item;
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) return item;
    
    // 计算立方英尺 (长x宽x高 英寸 / 1728)
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    
    // 计算密度 (磅/立方英尺)
    const density = weightNum / cubicFeet;
    
    // 根据密度确定分类代码
    let selectedClass = freightClassMap[freightClassMap.length - 1]; // 默认最低分类
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    // 危险品或易碎品需要特殊处理
    let finalClass = selectedClass.class;
    
    if (hazmat) {
      // 危险品通常分类更高
      const hazmatClassNum = Math.max(parseFloat(finalClass), 85);
      finalClass = hazmatClassNum.toString();
    }
    
    if (fragile) {
      // 易碎品可能需要更高分类
      const fragileClassNum = Math.max(parseFloat(finalClass), 125);
      finalClass = fragileClassNum.toString();
    }
    
    return {
      ...item,
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass
    };
  };

  // 添加新的货物项目
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
      estimatedRate: '',
      stackable: true,
      fragile: false,
      hazmat: false,
      shippingNumber: '',
      // 单位转换辅助字段
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
      alert('至少需要保留一个货物项目');
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
            [field]: field === 'stackable' || field === 'fragile' || field === 'hazmat' 
              ? value 
              : value
          };
          
          // 处理单位转换
          if (field === 'weightKg') {
            updatedItem.weight = convertKgToLbs(value);
          } else if (field === 'lengthCm') {
            updatedItem.length = convertCmToInches(value);
          } else if (field === 'widthCm') {
            updatedItem.width = convertCmToInches(value);
          } else if (field === 'heightCm') {
            updatedItem.height = convertCmToInches(value);
          }
          
          // 如果更新的是尺寸或重量相关字段，重新计算分类
          if (['weight', 'length', 'width', 'height', 'hazmat', 'fragile', 'weightKg', 'lengthCm', 'widthCm', 'heightCm'].includes(field)) {
            return calculateCargoItemClass(updatedItem);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // 监听尺寸和重量变化，自动计算
  useEffect(() => {
    if (formData.serviceType === 'LTL') {
      calculateFreightClass();
    }
  }, [formData.weight, formData.length, formData.width, formData.height, formData.hazmat, formData.fragile, formData.serviceType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    // 处理FTL重量单位转换
    if (name === 'weightKg') {
      updatedData.weight = convertKgToLbs(value);
    } else if (name === 'weight' && formData.serviceType === 'FTL') {
      updatedData.weightKg = convertLbsToKg(value);
    }
    
    setFormData(updatedData);
  };

  // 处理地址类型勾选变化
  const handleLocationTypeChange = (locationType, fieldName) => {
    return (e) => {
      const isChecked = e.target.checked;
      setFormData(prev => {
        const currentTypes = prev[fieldName] || [];
        if (isChecked) {
          // 添加类型
          if (!currentTypes.includes(locationType)) {
            return {
              ...prev,
              [fieldName]: [...currentTypes, locationType]
            };
          }
        } else {
          // 移除类型
          return {
            ...prev,
            [fieldName]: currentTypes.filter(type => type !== locationType)
          };
        }
        return prev;
      });
    };
  };

  // Google Maps 地址选择处理
  const handleOriginPlaceSelected = (placeData) => {
    setSelectedPlaces(prev => {
      const newState = {
        ...prev,
        origin: placeData
      };
      
      // 如果两个地址都已选择，计算距离
      if (newState.destination) {
        calculateDistanceBetweenPoints(placeData, newState.destination);
      }
      
      return newState;
    });
  };

  const handleDestinationPlaceSelected = (placeData) => {
    setSelectedPlaces(prev => {
      const newState = {
        ...prev,
        destination: placeData
      };
      
      // 如果两个地址都已选择，计算距离
      if (newState.origin) {
        calculateDistanceBetweenPoints(newState.origin, placeData);
      }
      
      return newState;
    });
  };

  // 计算两点之间的距离
  const calculateDistanceBetweenPoints = async (origin, destination) => {
    try {
      setCalculatingDistance(true);
      const result = await calculateDistance(
        origin.fullAddress || origin.displayAddress,
        destination.fullAddress || destination.displayAddress
      );
      setDistanceInfo(result);
      console.log('距离计算结果:', result);
    } catch (error) {
      console.error('距离计算失败:', error);
      setDistanceInfo(null);
    } finally {
      setCalculatingDistance(false);
    }
  };

  // 显示路线功能
  const showRoute = () => {
    // 检查是否有Google Maps选择的地址数据，或者至少有输入的地址文本
    const hasOrigin = selectedPlaces.origin || formData.origin;
    const hasDestination = selectedPlaces.destination || formData.destination;
    
    if (hasOrigin && hasDestination) {
      setShowRouteModal(true);
    } else {
      alert('请先输入起点和终点地址');
    }
  };

  // 地址搜索函数 - 保留为了向后兼容，但不再使用
  const searchAddresses = (query, field) => {
    // 已由 GoogleMapsAddressInput 组件处理
  };

  // 处理地址输入变化 - 保留为了向后兼容，但不再使用
  const handleAddressInput = (e, field) => {
    // 已由 GoogleMapsAddressInput 组件处理
  };

  // 选择地址建议 - 保留为了向后兼容，但不再使用
  const selectAddressSuggestion = (suggestion, field) => {
    // 已由 GoogleMapsAddressInput 组件处理
  };

  // 隐藏建议 - 保留为了向后兼容，但不再使用
  const hideSuggestions = (field) => {
    // 已由 GoogleMapsAddressInput 组件处理
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 防止重复提交
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      // 基础验证 - 包含所有必填字段
      const requiredFields = [
        'origin', 'destination', 'pickupDate', 
        'weight', 'companyName', 
        'contactPhone', 
      ];
      
      // LTL额外验证
      if (formData.serviceType === 'LTL') {
        // 移除单个重量字段和全局价格字段的验证，改为验证货物项目
        const requiredFieldsLTL = requiredFields.filter(field => field !== 'weight');
        
        // 验证每个货物项目 - 只验证必要字段
        const invalidItems = formData.cargoItems.filter(item => 
          !item.weight || !item.length || 
          !item.width || !item.height || !item.pallets 
        );
        
        if (invalidItems.length > 0) {
          alert('请填写所有货物项目的必要信息：重量、尺寸、托盘数量');
          return;
        }
        
        // 检查是否都计算出了分类代码
        const unclassifiedItems = formData.cargoItems.filter(item => !item.freightClass);
        if (unclassifiedItems.length > 0) {
          alert('请确保所有货物项目都已计算出NMFC分类代码');
          return;
        }
        
        const missingFields = requiredFieldsLTL.filter(field => !formData[field]);
        if (missingFields.length > 0) {
          alert(`请填写所有必填字段: ${missingFields.join(', ')}`);
          return;
        }
      } else {
        // FTL验证 - 包含车型要求
        const requiredFieldsFTL = [...requiredFields, 'truckType'];
        const missingFields = requiredFieldsFTL.filter(field => !formData[field]);
        if (missingFields.length > 0) {
          alert(`请填写所有必填字段: ${missingFields.join(', ')}`);
          return;
        }
      }

      // 自动处理地址和距离计算
      console.log('开始处理地址和距离计算...');
      
      let originData = selectedPlaces.origin;
      let destinationData = selectedPlaces.destination;
      let calculatedDistance = distanceInfo;

      // 如果没有从建议中选择地址，则进行地理编码
      if (!originData && formData.origin) {
        console.log('地理编码起点地址:', formData.origin);
        originData = await geocodeAddress(formData.origin);
      }

      if (!destinationData && formData.destination) {
        console.log('地理编码终点地址:', formData.destination);
        destinationData = await geocodeAddress(formData.destination);
      }

      // 如果还没有距离信息，则计算距离
      if (!calculatedDistance && originData && destinationData) {
        console.log('计算两地距离...');
        calculatedDistance = await calculateDistance(
          originData.fullAddress || originData.displayAddress || formData.origin,
          destinationData.fullAddress || destinationData.displayAddress || formData.destination
        );
      }

      console.log('地址和距离处理完成:', { originData, destinationData, calculatedDistance });

      // 现在处理提交数据
      await processFormSubmission(originData, destinationData, calculatedDistance);
      
    } catch (error) {
      console.error('处理地址或距离时出错:', error);
      // 即使地址处理失败，也允许继续提交，但提醒用户
      const proceed = confirm('地址解析或距离计算失败，是否继续发布？（将使用原始地址信息）');
      if (proceed) {
        await processFormSubmission(selectedPlaces.origin, selectedPlaces.destination, distanceInfo);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 处理表单提交的核心逻辑
  const processFormSubmission = async (originData, destinationData, calculatedDistance) => {
    // 根据服务类型处理提交数据
    if (formData.serviceType === 'LTL') {
      // LTL: 为每个货物项目创建单独的提交数据
      formData.cargoItems.forEach((item, index) => {
        const submitData = {
          type: 'load',
          origin: formData.origin,
          destination: formData.destination,
          // 新增格式化地址字段
          originDisplay: originData?.displayAddress || formData.origin,
          destinationDisplay: destinationData?.displayAddress || formData.destination,
          // 距离信息
          distanceInfo: calculatedDistance,
          requiredDate: formData.pickupDate,
          weight: item.weight,
          cargoType: `${formData.cargoType} - ${item.description}`,
          maxRate: item.estimatedRate,
          companyName: formData.companyName,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail || '',
          specialRequirements: formData.notes || '',
          serviceType: formData.serviceType,
          truckType: formData.truckType,
          // 保留原始表单数据用于显示
          originalData: {
            ...formData,
            // 当前货物项目的特定数据
            currentItem: item,
            itemIndex: index + 1,
            totalItems: formData.cargoItems.length,
            calculatedDensity: item.density,
            calculatedClass: item.freightClass,
            classDescription: `Class ${item.freightClass} - 基于密度 ${item.density} lbs/cu ft`,
            weight: item.weight,
            length: item.length,
            width: item.width,
            height: item.height,
            volume: item.volume,
            freightClass: item.freightClass,
            pallets: item.pallets,
            stackable: item.stackable,
            fragile: item.fragile,
            hazmat: item.hazmat,
            // 完整地址信息
            fullOrigin: originData?.fullAddress || formData.origin,
            fullDestination: destinationData?.fullAddress || formData.destination,
            selectedPlaces: { origin: originData, destination: destinationData }
          }
        };
        
        onSubmit(submitData);
      });
    } else {
      // FTL: 单个提交数据（保持原有逻辑）
      const submitData = {
        type: 'load',
        origin: formData.origin,
        destination: formData.destination,
        // 新增格式化地址字段
        originDisplay: originData?.displayAddress || formData.origin,
        destinationDisplay: destinationData?.displayAddress || formData.destination,
        // 距离信息
        distanceInfo: calculatedDistance,
        requiredDate: formData.pickupDate,
        weight: formData.weight,
        cargoType: formData.cargoType,
        maxRate: formData.maxRate,
        companyName: formData.companyName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail || '',
        specialRequirements: formData.notes || '',
        serviceType: formData.serviceType,
        cargoValue: formData.cargoValue,
        truckType: formData.truckType,
        originalData: {
          ...formData,
          calculatedDensity: densityInfo.density,
          calculatedClass: densityInfo.suggestedClass,
          classDescription: densityInfo.classDescription,
          cargoValue: formData.cargoValue,
          // 完整地址信息
          fullOrigin: originData?.fullAddress || formData.origin,
          fullDestination: destinationData?.fullAddress || formData.destination,
          selectedPlaces: { origin: originData, destination: destinationData }
        }
      };
      
      onSubmit(submitData);
    }
    
    onClose();
    
    // 重置表单
    setFormData({
      type: 'load',
      serviceType: 'FTL',
      origin: '',
      destination: '',
      pickupDate: '',
      deliveryDate: '',
      cargoType: '',
      truckType: '',
      weight: '',
      cargoValue: '',
      shippingNumber: '',
      weightKg: '',
      originLocationTypes: [],
      destinationLocationTypes: [],
      pallets: '',
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
          estimatedRate: '',
          stackable: true,
          fragile: false,
          hazmat: false,
          shippingNumber: '',
          // 单位转换辅助字段
          weightKg: '',
          lengthCm: '',
          widthCm: '',
          heightCm: ''
        }
      ],
      length: '',
      width: '',
      height: '',
      volume: '',
      density: '',
      freightClass: '',
      stackable: true,
      allowMixedLoad: true,
      hazmat: false,
      fragile: false,
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      maxRate: '',
      notes: ''
    });
    
    setDensityInfo({
      calculated: false,
      density: 0,
      suggestedClass: '',
      classDescription: ''
    });

    setSelectedPlaces({
      origin: null,
      destination: null
    });

    setDistanceInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布货源信息 (Post Load)</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 运输类型选择 - 突出显示 */}
          <div className="form-section">
            <h3>运输类型 (Service Type)</h3>
            <div className="service-type-selection">
              <label className={`service-type-option ftl-option ${formData.serviceType === 'FTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="FTL"
                  checked={formData.serviceType === 'FTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Truck size={28} />
                  <div>
                    <strong>整车运输 (FTL)</strong>
                    <p>Full Truckload - 独享整车，适合大批量货物</p>
                    <small>通常 {'>'}10,000 磅或 {'>'} 24 线性英尺</small>
                  </div>
                </div>
              </label>
              
              <label className={`service-type-option ltl-option ${formData.serviceType === 'LTL' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="LTL"
                  checked={formData.serviceType === 'LTL'}
                  onChange={handleInputChange}
                />
                <div className="service-type-content">
                  <Package size={28} />
                  <div>
                    <strong>零担运输 (LTL)</strong>
                    <p>Less Than Truckload - 与其他货物拼车，经济实惠</p>
                    <small>通常 150-10,000 磅，需要NMFC分类</small>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 基础信息 */}
          <div className="form-section">
            <h3>基础信息 (Basic Information)</h3>
            <div className="form-grid">
              <GoogleMapsAddressInput
                label="起点 (Origin)"
                placeholder="输入城市名、街道地址或ZIP代码"
                value={formData.origin}
                onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                onPlaceSelected={handleOriginPlaceSelected}
                required={true}
                icon={MapPin}
              />

              <GoogleMapsAddressInput
                label="终点 (Destination)"
                placeholder="输入城市名、街道地址或ZIP代码"
                value={formData.destination}
                onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                onPlaceSelected={handleDestinationPlaceSelected}
                required={true}
                icon={MapPin}
              />

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  取货日期 (Pickup Date) <span className="required">*</span>
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

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  送达日期 (Delivery Date) 
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

            {/* 路线查看按钮 */}
            {formData.origin && formData.destination && (
              <div className="route-section">
                <button
                  type="button"
                  className="btn route-btn"
                  onClick={showRoute}
                >
                  <Navigation size={16} />
                  查看导航路线
                </button>
                <p className="route-description">
                  点击查看Google Maps导航路线和距离估算
                </p>
                
                {/* 距离显示 */}
                {calculatingDistance && (
                  <div className="distance-calculating">
                    <div className="loading-spinner-small"></div>
                    <span>正在计算距离...</span>
                  </div>
                )}
                
                {distanceInfo && (
                  <div className="distance-info">
                    <div className="distance-summary">
                      <span className="distance-text">
                        <strong>距离:</strong> {distanceInfo.distance}
                      </span>
                      <span className="duration-text">
                        <strong>预计时间:</strong> {distanceInfo.duration}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 货物信息 */}
          <div className="form-section">
            <h3>货物信息 (Commodity Information)</h3>
            <div className="form-grid">
              {/* 车型要求 - 只在FTL时显示且必填 */}
              {formData.serviceType === 'FTL' && (
                <div className="form-group">
                  <label>
                    <Truck size={16} />
                    车型要求 (Equipment Type) <span className="required">*</span>
                  </label>
                  <select
                    name="truckType"
                    value={formData.truckType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">请选择车型要求</option>
                    {truckTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>
                  <Package size={16} />
                  货物类型 (Commodity Type) 
                </label>
                <select
                  name="cargoType"
                  value={formData.cargoType}
                  onChange={handleInputChange}
                >
                  <option value="">请选择货物类型</option>
                  {cargoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {formData.serviceType === 'FTL' && (
                <div className="form-group">
                  <label>
                    <Scale size={16} />
                    重量 (Weight) <span className="required">*</span> (磅)
                  </label>
                  <div className="dimension-input-group">
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="输入重量 (lbs)"
                      min="1"
                      required
                    />
                    <div className="conversion-input">
                      <input
                        type="number"
                        name="weightKg"
                        value={formData.weightKg}
                        onChange={handleInputChange}
                        placeholder="kg"
                        step="0.1"
                        className="unit-converter"
                      />
                      <span className="unit-label">kg</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.serviceType === 'FTL' && (
                <div className="form-group">
                  <label>
                    <DollarSign size={16} />
                    货物估价 (Cargo Value)
                  </label>
                  <select
                    name="cargoValue"
                    value={formData.cargoValue}
                    onChange={handleInputChange}
                  >
                    {cargoValueOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.serviceType === 'FTL' && (
                <div className="form-group">
                  <label>
                    <Hash size={16} />
                    初始单号 (Shipping Number)
                  </label>
                  <input
                    type="text"
                    name="shippingNumber"
                    value={formData.shippingNumber}
                    onChange={handleInputChange}
                    placeholder="如：SH123456789"
                  />
                </div>
              )}

              {formData.serviceType === 'LTL' && (
                <div className="form-group full-width">
                  <label>
                    <Info size={16} />
                    LTL模式说明
                  </label>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
                    LTL零担运输支持多个不同规格的货物。请为每个货物单独填写尺寸和重量信息，系统会自动计算NMFC分类等级。
                  </p>
                </div>
              )}


            </div>
          </div>

          {/* LTL专用 - 多货物管理 */}
          {formData.serviceType === 'LTL' && (
            <div className="form-section ltl-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>
                  <Package size={20} />
                  货物清单管理 (Cargo Items Management)
                </h3>

              </div>
              
              <div className="nmfc-info">
                <Info size={16} />
                <p>LTL零担运输可以包含多个不同规格的货物。每个货物都会根据NMFC标准自动计算分类等级。</p>
              </div>

              {formData.cargoItems.map((item, index) => (
                <div key={item.id} className="cargo-item-card" style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#34C759' }}>
                      货物 #{index + 1}
                    </h4>

                  </div>

                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>托板数量 (Pallets) <span className="required">*</span></label>
                      <input
                        type="number"
                        value={item.pallets}
                        onChange={(e) => updateCargoItem(item.id, 'pallets', e.target.value)}
                        placeholder="托板数量"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>货物描述 (Description) </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateCargoItem(item.id, 'description', e.target.value)}
                        placeholder="如：电子设备、机械部件等"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <Hash size={16} />
                        初始单号 (Shipper)
                      </label>
                      <input
                        type="text"
                        value={item.shippingNumber}
                        onChange={(e) => updateCargoItem(item.id, 'shippingNumber', e.target.value)}
                        placeholder="如：SH123456789"
                      />
                    </div>
                  </div>

                  <div className="form-grid dimensions-grid">
                    <div className="form-group">
                      <label>重量 (Weight) <span className="required">*</span> (磅)</label>
                      <div className="dimension-input-group">
                        <input
                          type="number"
                          value={item.weight}
                          onChange={(e) => updateCargoItem(item.id, 'weight', e.target.value)}
                          placeholder="重量 (lbs)"
                          min="1"
                          step="0.1"
                          required
                        />
                        <div className="conversion-input">
                          <input
                            type="number"
                            value={item.weightKg}
                            onChange={(e) => updateCargoItem(item.id, 'weightKg', e.target.value)}
                            placeholder="kg"
                            step="0.1"
                            className="unit-converter"
                          />
                          <span className="unit-label">kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>长度 (Length) <span className="required">*</span> (英寸)</label>
                      <div className="dimension-input-group">
                        <input
                          type="number"
                          value={item.length}
                          onChange={(e) => updateCargoItem(item.id, 'length', e.target.value)}
                          placeholder="长度 (inches)"
                          min="1"
                          step="0.1"
                          required
                        />
                        <div className="conversion-input">
                          <input
                            type="number"
                            value={item.lengthCm}
                            onChange={(e) => updateCargoItem(item.id, 'lengthCm', e.target.value)}
                            placeholder="cm"
                            step="0.1"
                            className="unit-converter"
                          />
                          <span className="unit-label">cm</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>宽度 (Width) <span className="required">*</span> (英寸)</label>
                      <div className="dimension-input-group">
                        <input
                          type="number"
                          value={item.width}
                          onChange={(e) => updateCargoItem(item.id, 'width', e.target.value)}
                          placeholder="宽度 (inches)"
                          min="1"
                          step="0.1"
                          required
                        />
                        <div className="conversion-input">
                          <input
                            type="number"
                            value={item.widthCm}
                            onChange={(e) => updateCargoItem(item.id, 'widthCm', e.target.value)}
                            placeholder="cm"
                            step="0.1"
                            className="unit-converter"
                          />
                          <span className="unit-label">cm</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>高度 (Height) <span className="required">*</span> (英寸)</label>
                      <div className="dimension-input-group">
                        <input
                          type="number"
                          value={item.height}
                          onChange={(e) => updateCargoItem(item.id, 'height', e.target.value)}
                          placeholder="高度 (inches)"
                          min="1"
                          step="0.1"
                          required
                        />
                        <div className="conversion-input">
                          <input
                            type="number"
                            value={item.heightCm}
                            onChange={(e) => updateCargoItem(item.id, 'heightCm', e.target.value)}
                            placeholder="cm"
                            step="0.1"
                            className="unit-converter"
                          />
                          <span className="unit-label">cm</span>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* 计算结果显示 */}
                  {item.freightClass && (
                    <div className="calculation-results" style={{
                      background: 'linear-gradient(135deg, #e8f5e8, #f0faf0)',
                      border: '1px solid #34C759',
                      borderRadius: '6px',
                      padding: '1rem',
                      marginTop: '1rem'
                    }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#34C759' }}>
                        <Calculator size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        计算结果
                      </h5>
                      <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>体积</div>
                          <div style={{ fontWeight: '600' }}>{item.volume} ft³</div>
                        </div>
                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>密度</div>
                          <div style={{ fontWeight: '600' }}>{item.density} lbs/ft³</div>
                        </div>
                        <div style={{ background: '#34C759', color: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem' }}>NMFC等级</div>
                          <div style={{ fontWeight: '700' }}>Class {item.freightClass}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 特殊属性 */}
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>特殊属性 (Special Characteristics)</h5>
                    <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      <label className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.stackable}
                          onChange={(e) => updateCargoItem(item.id, 'stackable', e.target.checked)}
                        />
                        <span>可堆叠</span>
                      </label>
                      
                      <label className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.fragile}
                          onChange={(e) => updateCargoItem(item.id, 'fragile', e.target.checked)}
                        />
                        <span>易碎品</span>
                      </label>
                      
                      <label className="checkbox-item hazmat" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.hazmat}
                          onChange={(e) => updateCargoItem(item.id, 'hazmat', e.target.checked)}
                        />
                        <span>危险品</span>
                      </label>
                <button
                  type="button"
                  onClick={addCargoItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#34C759',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >  
                  <Plus size={16} />
                  添加货物
                </button>
                                    {formData.cargoItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCargoItem(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <Minus size={14} />
                        删除
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              ))}


            </div>
          )}

          {/* 联系信息 */}
          <div className="form-section">
            <h3>发布人信息 (Contact Information)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Building size={16} />
                  发布人名称 (Contact Name) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="您的名称"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Phone size={16} />
                  发布人电话 (Phone) <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="form-group">
                <label>发布人邮箱 (Email)</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
              </div>


            </div>
            
            <div className="form-group">
              <label>备注信息 (Notes)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="特殊要求、装卸说明等..."
                rows="3"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn secondary" disabled={submitting}>
              取消 (Cancel)
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="loading-spinner-small"></div>
                  正在处理地址信息...
                </>
              ) : (
                '发布货源 (Post Load)'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .large-modal {
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .form-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .required {
          color: #ff4444;
          font-weight: bold;
        }

        .dimension-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .dimension-input-group > input {
          flex: 1;
        }

        .conversion-input {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          min-width: 80px;
        }

        .unit-converter {
          width: 60px !important;
          padding: 0.25rem !important;
          font-size: 0.8rem !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
        }

        .unit-label {
          font-size: 0.8rem;
          color: #666;
          min-width: 20px;
        }

        .service-type-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .service-type-option {
          display: block;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .service-type-option:hover {
          border-color: #34C759;
          background-color: #f8f9fa;
        }

        .service-type-option.selected {
          border-color: #34C759;
          background-color: #e8f5e8;
        }

        .service-type-option input[type="radio"] {
          display: none;
        }

        .service-type-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .service-type-content > svg {
          color: #34C759;
          flex-shrink: 0;
        }

        .service-type-content strong {
          color: #333;
          margin-bottom: 0.25rem;
          display: block;
        }

        .service-type-content p {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .location-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .location-type-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .location-type-option:hover {
          border-color: #34C759;
          background-color: #f8f9fa;
        }

        .location-type-option.selected {
          border-color: #34C759;
          background-color: #e8f5e8;
          color: #2d5016;
        }

        .location-type-option input[type="radio"] {
          display: none;
        }

        .location-type-option svg {
          flex-shrink: 0;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #34C759;
        }

        @media (max-width: 768px) {
          .large-modal {
            max-width: 95vw;
            margin: 1rem;
          }

          .service-type-selection,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .location-type-grid {
            grid-template-columns: 1fr;
          }

          .dimension-input-group {
            flex-direction: column;
            align-items: stretch;
          }
        }

        /* 地址类型勾选框样式 */
        .location-types-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .location-types-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1rem;
          font-weight: 600;
        }

        .location-types-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .location-type-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .location-type-header {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
          margin: 0;
        }

        .checkbox-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .checkbox-option:hover {
          background-color: rgba(52, 199, 89, 0.1);
        }

        .checkbox-option input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #34C759;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.85rem;
          color: #555;
          cursor: pointer;
          user-select: none;
        }

        @media (max-width: 768px) {
          .location-types-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .checkbox-label {
            font-size: 0.8rem;
          }
        }

        .service-type-selection {
        }

        /* 地址输入组件样式 */
        .address-input-group {
          position: relative;
        }

        .address-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .address-input-container input {
          padding-right: 2.5rem;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          right: 0.75rem;
          color: #666;
          pointer-events: none;
        }

        .address-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }

        .suggestion-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background-color: #f8f9fa;
        }

        .suggestion-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .suggestion-main svg {
          color: #34C759;
          flex-shrink: 0;
        }

        .city-state {
          font-weight: 500;
          color: #333;
        }

        .zip-code {
          font-size: 0.8rem;
          color: #666;
          background: #f0f0f0;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
        }

        /* 路线查看按钮样式 */
        .route-section {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          text-align: center;
        }

        .route-btn {
          background: linear-gradient(135deg, #34C759, #28a745);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
        }

        .route-btn:hover {
          background: linear-gradient(135deg, #28a745, #1e7e34);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
        }

        .route-description {
          margin: 0.75rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        /* 距离计算样式 */
        .distance-calculating {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: #e3f2fd;
          border-radius: 6px;
          color: #1976d2;
          font-size: 0.9rem;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #bbdefb;
          border-top: 2px solid #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .distance-info {
          margin-top: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #e8f5e8, #f0faf0);
          border: 1px solid #34C759;
          border-radius: 8px;
        }

        .distance-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          text-align: center;
        }

        .distance-text, .duration-text {
          background: white;
          padding: 0.75rem;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-size: 0.9rem;
        }

        .distance-text strong, .duration-text strong {
          color: #34C759;
          display: block;
          margin-bottom: 0.25rem;
        }
      `}</style>

      {/* Google Maps 路线模态框 */}
      {showRouteModal && (
        <GoogleMapsRoute
          origin={selectedPlaces.origin || { address: formData.origin }}
          destination={selectedPlaces.destination || { address: formData.destination }}
          onClose={() => setShowRouteModal(false)}
        />
      )}
    </div>
  );
};

export default PostLoadModal; 