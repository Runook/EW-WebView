const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// 生成合理的未来日期
const getRandomFutureDate = (daysFromNow = 1, maxDays = 7) => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysFromNow + Math.floor(Math.random() * maxDays));
  return futureDate.toISOString().split('T')[0];
};

// Mock data storage (在生产环境中应该使用真实数据库)
let landTrucks = [
  {
    id: 1,
    origin: '北京',
    destination: '上海',
    availableDate: getRandomFutureDate(1),
    truckType: '17.5米平板',
    capacity: '32吨',
    rate: '¥8,000',
    serviceType: 'FTL',
    company: '北京快运物流',
    rating: 4.8,
    phone: '(010) 1234-5678',
    driverLicense: 'A2',
    truckFeatures: '带尾板,GPS定位',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    origin: '广州',
    destination: '深圳',
    availableDate: getRandomFutureDate(2),
    truckType: '6.8米厢式货车',
    capacity: '5吨',
    rate: '¥800',
    serviceType: 'LTL',
    company: '珠三角配送',
    rating: 4.7,
    phone: '(020) 9876-5432',
    driverLicense: 'B2',
    truckFeatures: '冷链,保温',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  }
];

let landLoads = [
  {
    id: 1,
    origin: '天津',
    destination: '青岛',
    requiredDate: getRandomFutureDate(3),
    weight: '25吨',
    cargoType: '建材',
    urgency: '普通',
    maxRate: '¥6,000',
    company: '华北建材贸易',
    rating: 4.6,
    phone: '(022) 5555-8888',
    specialRequirements: '需要吊装',
    serviceType: 'FTL',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  }
];

// 数据验证函数
const validateTruckData = (data) => {
  const required = ['origin', 'destination', 'availableDate', 'truckType', 
                   'capacity', 'rate', 'serviceType', 'companyName', 'contactPhone'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  const availableDate = new Date(data.availableDate);
  const today = new Date();
  
  if (availableDate < today) {
    return { isValid: false, error: '可用日期不能是过去的日期' };
  }
  
  return { isValid: true };
};

const validateLoadData = (data) => {
  const required = ['origin', 'destination', 'requiredDate', 'weight', 
                   'cargoType', 'urgency', 'maxRate', 'companyName', 'contactPhone'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  const requiredDate = new Date(data.requiredDate);
  const today = new Date();
  
  if (requiredDate < today) {
    return { isValid: false, error: '要求日期不能是过去的日期' };
  }
  
  return { isValid: true };
};

// GET /api/landfreight/trucks - 获取车源信息
router.get('/trucks', (req, res) => {
  try {
    const { search, origin, destination, truckType, serviceType } = req.query;
    
    let filtered = landTrucks.filter(truck => truck.isActive);
    
    // 搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(truck => 
        truck.origin.toLowerCase().includes(searchLower) ||
        truck.destination.toLowerCase().includes(searchLower) ||
        truck.truckType.toLowerCase().includes(searchLower) ||
        truck.company.toLowerCase().includes(searchLower)
      );
    }
    
    // 筛选功能
    if (origin) {
      filtered = filtered.filter(truck => 
        truck.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filtered = filtered.filter(truck => 
        truck.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (truckType) {
      filtered = filtered.filter(truck => 
        truck.truckType.toLowerCase().includes(truckType.toLowerCase())
      );
    }
    
    if (serviceType) {
      filtered = filtered.filter(truck => truck.serviceType === serviceType);
    }
    
    // 按可用日期排序
    filtered.sort((a, b) => new Date(a.availableDate) - new Date(b.availableDate));
    
    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('获取车源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/landfreight/loads - 获取货源信息
router.get('/loads', (req, res) => {
  try {
    const { search, origin, destination, cargoType, urgency } = req.query;
    
    let filtered = landLoads.filter(load => load.isActive);
    
    // 搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(load => 
        load.origin.toLowerCase().includes(searchLower) ||
        load.destination.toLowerCase().includes(searchLower) ||
        load.cargoType.toLowerCase().includes(searchLower) ||
        load.company.toLowerCase().includes(searchLower)
      );
    }
    
    // 筛选功能
    if (origin) {
      filtered = filtered.filter(load => 
        load.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filtered = filtered.filter(load => 
        load.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (cargoType) {
      filtered = filtered.filter(load => 
        load.cargoType.toLowerCase().includes(cargoType.toLowerCase())
      );
    }
    
    if (urgency) {
      filtered = filtered.filter(load => load.urgency === urgency);
    }
    
    // 按紧急程度和要求日期排序
    const urgencyOrder = { '特急': 0, '紧急': 1, '加急': 2, '普通': 3 };
    filtered.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.requiredDate) - new Date(b.requiredDate);
    });
    
    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('获取货源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// POST /api/landfreight/trucks - 发布车源信息 (需要认证)
router.post('/trucks', auth, (req, res) => {
  try {
    const validation = validateTruckData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const {
      origin,
      destination,
      availableDate,
      truckType,
      capacity,
      rate,
      serviceType,
      companyName,
      contactPhone,
      contactEmail,
      driverLicense,
      truckFeatures,
      notes
    } = req.body;

    const newTruck = {
      id: Date.now(),
      origin: origin.trim(),
      destination: destination.trim(),
      availableDate,
      truckType: truckType.trim(),
      capacity: capacity.trim(),
      rate: rate.trim(),
      serviceType: serviceType.trim(),
      company: companyName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail?.trim() || '',
      driverLicense: driverLicense?.trim() || '',
      truckFeatures: truckFeatures?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    landTrucks.push(newTruck);

    res.status(201).json({
      success: true,
      message: '车源信息发布成功',
      data: newTruck
    });
  } catch (error) {
    console.error('发布车源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// POST /api/landfreight/loads - 发布货源信息 (需要认证)
router.post('/loads', auth, (req, res) => {
  try {
    const validation = validateLoadData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const {
      origin,
      destination,
      requiredDate,
      weight,
      cargoType,
      urgency,
      maxRate,
      companyName,
      contactPhone,
      contactEmail,
      specialRequirements,
      serviceType,
      notes
    } = req.body;

    const newLoad = {
      id: Date.now(),
      origin: origin.trim(),
      destination: destination.trim(),
      requiredDate,
      weight: weight.trim(),
      cargoType: cargoType.trim(),
      urgency: urgency.trim(),
      maxRate: maxRate.trim(),
      company: companyName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail?.trim() || '',
      specialRequirements: specialRequirements?.trim() || '',
      serviceType: serviceType?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    landLoads.push(newLoad);

    res.status(201).json({
      success: true,
      message: '货源信息发布成功',
      data: newLoad
    });
  } catch (error) {
    console.error('发布货源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// PUT /api/landfreight/trucks/:id - 更新车源信息 (需要认证)
router.put('/trucks/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const truckIndex = landTrucks.findIndex(t => t.id === parseInt(id) && t.isActive);
    
    if (truckIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '车源信息不存在'
      });
    }
    
    const truck = landTrucks[truckIndex];
    
    // 检查用户权限
    if (truck.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此信息'
      });
    }
    
    const validation = validateTruckData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // 更新车源信息
    const updatedTruck = {
      ...truck,
      ...req.body,
      id: truck.id,
      userId: truck.userId,
      rating: truck.rating,
      createdAt: truck.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    landTrucks[truckIndex] = updatedTruck;
    
    res.json({
      success: true,
      message: '车源信息更新成功',
      data: updatedTruck
    });
  } catch (error) {
    console.error('更新车源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// DELETE /api/landfreight/trucks/:id - 删除车源信息 (需要认证)
router.delete('/trucks/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const truck = landTrucks.find(t => t.id === parseInt(id) && t.isActive);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: '车源信息不存在'
      });
    }
    
    // 检查用户权限
    if (truck.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此信息'
      });
    }
    
    // 软删除
    truck.isActive = false;
    truck.deletedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '车源信息删除成功'
    });
  } catch (error) {
    console.error('删除车源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/landfreight/my-posts - 获取用户发布的信息 (需要认证)
router.get('/my-posts', auth, (req, res) => {
  try {
    const userTrucks = landTrucks.filter(truck => truck.userId === req.user.userId && truck.isActive);
    const userLoads = landLoads.filter(load => load.userId === req.user.userId && load.isActive);
    
    res.json({
      success: true,
      data: {
        trucks: userTrucks,
        loads: userLoads
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 