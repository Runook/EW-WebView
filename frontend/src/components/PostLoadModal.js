/* 
 * =============================================================================
 * PostLoadModal.js - 货源发布模态框组件
 * =============================================================================
 * 
 * 【文件分析】
 * 总行数: 1954行 - 过于庞大！
 * 主要功能: 发布货源信息的表单
 * 支持类型: FTL(整车) 和 LTL(零担)
 * 
 * 【可优化点】
 * 1. 配置数据过多 (约300行) - 应该外部化
 * 2. 状态管理复杂 (约100行) - 可拆分为多个Hook
 * 3. 表单处理逻辑重复 - 需要抽象
 * 4. UI代码冗长 - 应该组件化
 * 5. 样式代码过多 (约600行) - 应该独立CSS文件
 * =============================================================================
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { 
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
  Info,
  Phone,
  DollarSign,
  Clock,
  Plus,
  Minus,
  Navigation
} from 'lucide-react';
import './PostLoadModal.css';
import { GoogleMapsAddressInput, GoogleMapsRoute, calculateDistance, geocodeAddress } from './GoogleMapsAddressInput';
import { useForm, useToggle, useConfirmDialog, useAsyncState } from '../hooks';
import { Modal, Button } from './common';
import { geocodeAddress as geocodeUtil } from '../config/googleMaps'; // Corrected path

const PostLoadModal = ({ isOpen, onClose, onSubmit, fbaDestination }) => {
  // 表单初始数据
  const initialFormData = {
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
    pallets: 0,
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
    notes: '',
    companyName: '',
    maxRate: ''
  };

  // 使用新的Hook系统
  const { 
    formData, 
    setFormData, 
    handleInputChange, 
    resetForm,
    setFieldValue, 
    isSubmitting,
    setIsSubmitting
  } = useForm(initialFormData);

  const [showRouteModal, toggleRouteModal] = useToggle(false);
  const [calculatingDistance, setCalculatingDistance] = React.useState(false);

  // 异步提交状态
  const { loading: submitting, execute: executeSubmit } = useAsyncState(async (submissionData) => {
    await processFormSubmission(
      submissionData.originData, 
      submissionData.destinationData, 
      submissionData.calculatedDistance
    );
  });

  // 确认对话框
  const { 
    showConfirm 
  } = useConfirmDialog();

  // 复杂状态保持原样（需要更深入的重构）
  const [densityInfo, setDensityInfo] = React.useState({
    calculated: false,
    density: 0,
    suggestedClass: '',
    classDescription: ''
  });

  const [selectedPlaces, setSelectedPlaces] = React.useState({
    origin: null,
    destination: null
  });

  const [distanceInfo, setDistanceInfo] = React.useState(null);

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

  // 单位转换工具
  const unitConverter = React.useMemo(() => ({
    kgToLbs: (kg) => kg ? (parseFloat(kg) * 2.20462).toFixed(1) : '',
    lbsToKg: (lbs) => lbs ? (parseFloat(lbs) / 2.20462).toFixed(1) : '',
    cmToInches: (cm) => cm ? (parseFloat(cm) / 2.54).toFixed(1) : '',
    inchesToCm: (inches) => inches ? (parseFloat(inches) * 2.54).toFixed(1) : ''
  }), []);

  /*
   * =====================================================================
   * 业务逻辑函数部分 (约200行) - 🚨 逻辑过于复杂
   * =====================================================================
   */

  // ====== 密度和分类代码计算 (约50行 - 🤔 算法复杂，是否可以简化？) ======
  const calculateFreightClass = React.useCallback((data, isItem = false) => {
    const { weight, length, width, height, hazmat, fragile } = data;
    
    if (!weight || !length || !width || !height) return isItem ? data : null;
    
    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    if (weightNum <= 0 || lengthNum <= 0 || widthNum <= 0 || heightNum <= 0) return isItem ? data : null;
    
    // 计算立方英尺和密度
    const cubicInches = lengthNum * widthNum * heightNum;
    const cubicFeet = cubicInches / 1728;
    const density = weightNum / cubicFeet;
    
    // 根据密度确定分类代码
    let selectedClass = freightClassMap[freightClassMap.length - 1];
    for (const classEntry of freightClassMap) {
      if (density >= classEntry.minDensity) {
        selectedClass = classEntry;
        break;
      }
    }
    
    // 危险品或易碎品调整
    let finalClass = parseFloat(selectedClass.class);
    if (hazmat) finalClass = Math.max(finalClass, 85);
    if (fragile) finalClass = Math.max(finalClass, 125);
    
    const result = {
      volume: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass: finalClass.toString()
    };
    
    if (isItem) {
      return { ...data, ...result };
    } else {
      // 更新FTL表单数据
      setFormData(prev => ({ ...prev, ...result }));
      setDensityInfo({
        calculated: true,
        density: density.toFixed(2),
        suggestedClass: finalClass.toString(),
        classDescription: selectedClass.description + (hazmat || fragile ? ' (特殊货物调整)' : '')
      });
    }
  }, [freightClassMap, setFormData]);

  // ====== LTL货物管理函数 (约50行 - 🤔 是否需要这么复杂的货物管理？) ======
  
  // 添加新的货物项目 - 🚨 创建的默认对象过于复杂
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

  // 删除货物项目 - ✅ 逻辑简单
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

  // 更新货物项目 - 🚨 逻辑过于复杂，包含单位转换
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
          
          // 处理单位转换 - 支持双向转换
          const conversionMap = {
            // kg/cm to lbs/inches
            weightKg: () => updatedItem.weight = unitConverter.kgToLbs(value),
            lengthCm: () => updatedItem.length = unitConverter.cmToInches(value),
            widthCm: () => updatedItem.width = unitConverter.cmToInches(value),
            heightCm: () => updatedItem.height = unitConverter.cmToInches(value),
            // lbs/inches to kg/cm
            weight: () => updatedItem.weightKg = unitConverter.lbsToKg(value),
            length: () => updatedItem.lengthCm = unitConverter.inchesToCm(value),
            width: () => updatedItem.widthCm = unitConverter.inchesToCm(value),
            height: () => updatedItem.heightCm = unitConverter.inchesToCm(value)
          };
          if (conversionMap[field]) conversionMap[field]();
          
          // 如果更新的是尺寸或重量相关字段，重新计算分类
          if (['weight', 'length', 'width', 'height', 'hazmat', 'fragile', 'weightKg', 'lengthCm', 'widthCm', 'heightCm'].includes(field)) {
            return calculateFreightClass(updatedItem, true);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // ====== React副作用处理 ======
  
  // 监听尺寸和重量变化，自动计算 - 🤔 是否需要实时计算？可能影响性能
  useEffect(() => {
    if (formData.serviceType === 'FTL') {
      calculateFreightClass(formData, false);
    }
  }, [formData.weight, formData.length, formData.width, formData.height, formData.hazmat, formData.fragile, formData.serviceType, calculateFreightClass, formData]);

  // Handle FBA destination when modal opens with FBA data
  useEffect(() => {
    if (isOpen && fbaDestination) {
      // Only use FBA code as destination
      const fbaCode = fbaDestination.code;
      
      // Update the form with FBA destination
      setFormData(prev => ({ 
        ...prev, 
        destination: fbaCode,
        destinationLocationTypes: ['fba'] // Mark as FBA location
      }));
    }
  }, [isOpen, fbaDestination, setFormData]);

  // ====== 表单事件处理函数 (约100行) ======
  
  // 创建自定义的输入处理函数，用于处理单位转换
  const handleInputChangeWithConversion = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // 处理单位转换
    if (name === 'weightKg' && formData.serviceType === 'FTL') {
      setFieldValue('weightKg', newValue);
      setFieldValue('weight', unitConverter.kgToLbs(newValue));
    } else if (name === 'weight' && formData.serviceType === 'FTL') {
      setFieldValue('weight', newValue);
      setFieldValue('weightKg', unitConverter.lbsToKg(newValue));
    } else {
      // 使用原始的handleInputChange
      const event = { target: { name, value: newValue, type, checked } };
      handleInputChange(event);
    }
  }, [formData.serviceType, handleInputChange, setFieldValue, unitConverter]);

  // 处理地址类型勾选变化 - 🤔 这个功能是否过于细致？用户真的需要这么多地址类型？
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

  // ====== Google Maps 地址处理 (约60行) - 🤔 是否过于复杂？ ======
  
  // 起点地址选择处理 - 🚨 包含自动距离计算，可能不必要
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

  // 终点地址选择处理 - 🚨 与起点处理逻辑重复
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

  // 计算两点之间的距离 - 🤔 这个功能是否必要？可能只是噱头
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

  // 简化的表单验证函数
  const validateFormData = () => {
    const baseRequiredFields = ['origin', 'destination', 'pickupDate', 'companyName', 'contactPhone'];
    
    if (formData.serviceType === 'LTL') {
      // LTL验证
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
        return `请填写所有必填字段: ${missingFields.join(', ')}`;
      }
    } else {
      // FTL验证
      const requiredFields = [...baseRequiredFields, 'weight', 'truckType'];      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        return `请填写所有必填字段: ${missingFields.join(', ')}`;
      }
    }
    
    return null; // 没有错误
  };

  // 显示路线功能
  const showRoute = () => {
    const hasOrigin = selectedPlaces.origin || formData.origin;
    const hasDestination = selectedPlaces.destination || formData.destination;
    
    if (hasOrigin && hasDestination) {
      toggleRouteModal();
    } else {
      alert('请先输入起点和终点地址');
    }
  };

  /*
   * =====================================================================
   * 表单提交处理 (约200行) - 🚨 过于复杂，应该拆分
   * =====================================================================
   */
   
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError =  validateFormData();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      // Geocode origin and destination addresses
      const [originCoords, destinationCoords] = await Promise.all([
        geocodeUtil(formData.origin).catch(err => {
          console.error("Geocoding origin failed:", err);
          return null; // Don't block submission if one fails
        }),
        geocodeUtil(formData.destination).catch(err => {
          console.error("Geocoding destination failed:", err);
          return null;
        })
      ]);

      const submissionData = {
        ...formData,
        origin_lat: originCoords ? originCoords.lat : null,
        origin_lng: originCoords ? originCoords.lng : null,
        origin_formatted_address: originCoords ? originCoords.formattedAddress : formData.origin,
        destination_lat: destinationCoords ? destinationCoords.lat : null,
        destination_lng: destinationCoords ? destinationCoords.lng : null,
        destination_formatted_address: destinationCoords ? destinationCoords.formattedAddress : formData.destination,
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Submission failed after geocoding:', error);
      // The onSubmit function should handle error notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理表单提交的核心逻辑 - 🚨 超级复杂，包含LTL和FTL不同处理
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
          pallets: item.pallets,

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
      pallets: 0,
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

  /*
   * =====================================================================
   * UI渲染部分 (约800行) - 🚨 JSX过于庞大，应该组件化
   * =====================================================================
   */
   
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布货源信息 (Post Load)"
      size="xlarge"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="输入城市名、街道地址或邮编（如：90210 或 123 Main St）"
                value={formData.origin}
                onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                onPlaceSelected={handleOriginPlaceSelected}
                required={true}
                icon={MapPin}
              />

              <GoogleMapsAddressInput
                label={formData.destinationLocationTypes?.includes('fba') ? "终点 (Destination) - 🏭 FBA仓库" : "终点 (Destination)"}
                placeholder="输入城市名、街道地址或邮编（如：10001 或 Wall Street）"
                value={formData.destination}
                onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                onPlaceSelected={handleDestinationPlaceSelected}
                required={true}
                icon={MapPin}
                className={formData.destinationLocationTypes?.includes('fba') ? 'fba-destination' : ''}
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

            {/* 地址类型选择 - 新增的多选功能 */}
            <div className="location-types-section">
              <h4>
                <Info size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                地址类型特殊要求 (Location Type Requirements)
              </h4>
              <div className="location-types-grid">
                <div className="location-type-group">
                  <h5 className="location-type-header">起点要求 (Origin Requirements)</h5>
                  <div className="checkbox-options">
                    {locationTypeOptions.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <label key={`origin-${option.value}`} className="checkbox-option">
                          <input
                            type="checkbox"
                            checked={formData.originLocationTypes.includes(option.value)}
                            onChange={handleLocationTypeChange(option.value, 'originLocationTypes')}
                          />
                          <IconComponent size={14} />
                          <span className="checkbox-label">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="location-type-group">
                  <h5 className="location-type-header">终点要求 (Destination Requirements)</h5>
                  <div className="checkbox-options">
                    {locationTypeOptions.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <label key={`destination-${option.value}`} className="checkbox-option">
                          <input
                            type="checkbox"
                            checked={formData.destinationLocationTypes.includes(option.value)}
                            onChange={handleLocationTypeChange(option.value, 'destinationLocationTypes')}
                          />
                          <IconComponent size={14} />
                          <span className="checkbox-label">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 地址确认显示 */}
            {(selectedPlaces.origin || selectedPlaces.destination) && (
              <div className="address-confirmation">
                <h4>
                  <Info size={16} />
                  已识别地址
                </h4>
                {selectedPlaces.origin && (
                  <div className="confirmed-address">
                    <strong>起点:</strong>
                    <span className="display-address">{selectedPlaces.origin.displayAddress}</span>
                    <span className="full-address">({selectedPlaces.origin.fullAddress})</span>
                  </div>
                )}
                {selectedPlaces.destination && (
                  <div className="confirmed-address">
                    <strong>终点:</strong>
                    <span className="display-address">{selectedPlaces.destination.displayAddress}</span>
                    <span className="full-address">({selectedPlaces.destination.fullAddress})</span>
                  </div>
                )}
              </div>
            )}

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
                      onChange={handleInputChangeWithConversion}
                      placeholder="输入重量 (lbs)"
                      min="1"
                      required
                    />
                    <div className="conversion-input">
                      <input
                        type="number"
                        name="weightKg"
                        value={formData.weightKg}
                        onChange={handleInputChangeWithConversion}
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
                <div key={item.id} className="cargo-item-card">
                                      <div className="cargo-item-header">
                    <h4 className="cargo-item-title">
                      货物 #{index + 1}
                    </h4>
                  </div>

                  <div className="form-grid cargo-basic-grid">
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

                  {/* 计算结果显示 */}
                  {item.freightClass && (
                    <div className="calculation-results">
                      <h5 className="calculation-title">
                        <Calculator size={16} />
                        计算结果
                      </h5>
                      <div className="results-grid">
                        <div className="result-item">
                          <div className="result-label">体积</div>
                          <div className="result-value">{item.volume} ft³</div>
                        </div>
                        <div className="result-item">
                          <div className="result-label">密度</div>
                          <div className="result-value">{item.density} lbs/ft³</div>
                        </div>
                        <div className="result-item primary">
                          <div className="result-label">NMFC等级</div>
                          <div className="result-value">Class {item.freightClass}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 特殊属性 */}
                  <div className="special-attributes">
                    <h5>特殊属性 (Special Characteristics)</h5>
                    <div className="checkbox-grid">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={item.stackable}
                          onChange={(e) => updateCargoItem(item.id, 'stackable', e.target.checked)}
                        />
                        <span>可堆叠</span>
                      </label>
                      
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={item.fragile}
                          onChange={(e) => updateCargoItem(item.id, 'fragile', e.target.checked)}
                        />
                        <span>易碎品</span>
                      </label>
                      
                      <label className="checkbox-item hazmat">
                        <input
                          type="checkbox"
                          checked={item.hazmat}
                          onChange={(e) => updateCargoItem(item.id, 'hazmat', e.target.checked)}
                        />
                        <span>危险品</span>
                      </label>
                    </div>
                    
                    <div className="cargo-item-actions">
                      <button type="button" onClick={addCargoItem} className="btn add-cargo-btn">  
                        <Plus size={16} />
                        添加货物
                      </button>
                      {formData.cargoItems.length > 1 && (
                        <button type="button" onClick={() => removeCargoItem(item.id)} className="btn remove-cargo-btn">
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

        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            取消 (Cancel)
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
          >
            发布货源 (Post Load)
          </Button>
        </div>
      </form>

      {/* Google Maps 路线模态框 */}
      {showRouteModal && (
        <GoogleMapsRoute
          origin={selectedPlaces.origin || { address: formData.origin }}
          destination={selectedPlaces.destination || { address: formData.destination }}
          onClose={toggleRouteModal}
        />
      )}
    </Modal>
  );
  };

export default PostLoadModal; 