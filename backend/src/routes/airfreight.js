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
let airCargo = [
  {
    id: 1,
    origin: '上海浦东机场 (PVG)',
    destination: '洛杉矶国际机场 (LAX)',
    flightDate: getRandomFutureDate(1),
    flightNumber: 'CA987',
    airline: '中国国际航空',
    availableWeight: '5,000 kg',
    rate: '¥45/kg',
    cargoType: '普货',
    company: '国际航空货运',
    rating: 4.8,
    phone: '(021) 1234-5678',
    transitTime: '12小时',
    specialService: '温控货舱',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    origin: '北京首都机场 (PEK)',
    destination: '法兰克福机场 (FRA)',
    flightDate: getRandomFutureDate(2),
    flightNumber: 'LH720',
    airline: '汉莎航空',
    availableWeight: '3,200 kg',
    rate: '¥52/kg',
    cargoType: '普货/危险品',
    company: '欧洲航空物流',
    rating: 4.9,
    phone: '(010) 9876-5432',
    transitTime: '10小时',
    specialService: '危险品认证',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    origin: '深圳宝安机场 (SZX)',
    destination: '迪拜国际机场 (DXB)',
    flightDate: getRandomFutureDate(3),
    flightNumber: 'EK362',
    airline: '阿联酋航空',
    availableWeight: '8,500 kg',
    rate: '¥38/kg',
    cargoType: '普货/生鲜',
    company: '中东快运',
    rating: 4.7,
    phone: '(0755) 5555-8888',
    transitTime: '8小时',
    specialService: '冷链运输',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  }
];

let airDemands = [
  {
    id: 1,
    origin: '广州白云机场 (CAN)',
    destination: '纽约肯尼迪机场 (JFK)',
    requiredDate: getRandomFutureDate(4),
    weight: '2,500 kg',
    cargoType: '电子产品',
    urgency: '紧急',
    maxRate: '¥50/kg',
    company: '科技出口公司',
    rating: 4.6,
    phone: '(020) 1111-2222',
    specialRequirements: '防静电包装',
    insurance: '需要货物保险',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    origin: '成都双流机场 (CTU)',
    destination: '东京羽田机场 (HND)',
    requiredDate: getRandomFutureDate(5),
    weight: '1,800 kg',
    cargoType: '医疗器械',
    urgency: '特急',
    maxRate: '¥65/kg',
    company: '医疗设备有限公司',
    rating: 4.8,
    phone: '(028) 3333-4444',
    specialRequirements: '温控运输',
    insurance: '高价值货物保险',
    isActive: true,
    userId: null,
    createdAt: new Date().toISOString()
  }
];

// 数据验证函数
const validateAirCargoData = (data) => {
  const required = ['origin', 'destination', 'flightDate', 'flightNumber', 
                   'airline', 'availableWeight', 'rate', 'cargoType', 
                   'companyName', 'contactPhone'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  const flightDate = new Date(data.flightDate);
  const today = new Date();
  
  if (flightDate <= today) {
    return { isValid: false, error: '航班日期必须是未来日期' };
  }
  
  return { isValid: true };
};

const validateAirDemandData = (data) => {
  const required = ['origin', 'destination', 'requiredDate', 'weight', 
                   'cargoType', 'urgency', 'maxRate', 'companyName', 'contactPhone'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  const requiredDate = new Date(data.requiredDate);
  const today = new Date();
  
  if (requiredDate <= today) {
    return { isValid: false, error: '要求日期必须是未来日期' };
  }
  
  return { isValid: true };
};

// GET /api/airfreight/cargo - 获取舱位信息
router.get('/cargo', (req, res) => {
  try {
    const { search, origin, destination, cargoType, airline } = req.query;
    
    let filtered = airCargo.filter(cargo => cargo.isActive);
    
    // 搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(cargo => 
        cargo.origin.toLowerCase().includes(searchLower) ||
        cargo.destination.toLowerCase().includes(searchLower) ||
        cargo.cargoType.toLowerCase().includes(searchLower) ||
        cargo.company.toLowerCase().includes(searchLower) ||
        cargo.flightNumber.toLowerCase().includes(searchLower) ||
        cargo.airline.toLowerCase().includes(searchLower)
      );
    }
    
    // 筛选功能
    if (origin) {
      filtered = filtered.filter(cargo => 
        cargo.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filtered = filtered.filter(cargo => 
        cargo.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (cargoType) {
      filtered = filtered.filter(cargo => 
        cargo.cargoType.toLowerCase().includes(cargoType.toLowerCase())
      );
    }
    
    if (airline) {
      filtered = filtered.filter(cargo => 
        cargo.airline.toLowerCase().includes(airline.toLowerCase())
      );
    }
    
    // 按航班日期排序
    filtered.sort((a, b) => new Date(a.flightDate) - new Date(b.flightDate));
    
    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('获取舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/airfreight/demands - 获取货运需求
router.get('/demands', (req, res) => {
  try {
    const { search, origin, destination, cargoType, urgency } = req.query;
    
    let filtered = airDemands.filter(demand => demand.isActive);
    
    // 搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(demand => 
        demand.origin.toLowerCase().includes(searchLower) ||
        demand.destination.toLowerCase().includes(searchLower) ||
        demand.cargoType.toLowerCase().includes(searchLower) ||
        demand.company.toLowerCase().includes(searchLower)
      );
    }
    
    // 筛选功能
    if (origin) {
      filtered = filtered.filter(demand => 
        demand.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filtered = filtered.filter(demand => 
        demand.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (cargoType) {
      filtered = filtered.filter(demand => 
        demand.cargoType.toLowerCase().includes(cargoType.toLowerCase())
      );
    }
    
    if (urgency) {
      filtered = filtered.filter(demand => demand.urgency === urgency);
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
    console.error('获取货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// POST /api/airfreight/cargo - 发布舱位信息 (需要认证)
router.post('/cargo', auth, (req, res) => {
  try {
    const validation = validateAirCargoData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const {
      origin,
      destination,
      flightDate,
      flightNumber,
      airline,
      availableWeight,
      rate,
      cargoType,
      companyName,
      contactPhone,
      contactEmail,
      transitTime,
      specialService,
      notes
    } = req.body;

    const newCargo = {
      id: Date.now(),
      origin: origin.trim(),
      destination: destination.trim(),
      flightDate,
      flightNumber: flightNumber.trim(),
      airline: airline.trim(),
      availableWeight: availableWeight.trim(),
      rate: rate.trim(),
      cargoType: cargoType.trim(),
      company: companyName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail?.trim() || '',
      transitTime: transitTime?.trim() || '',
      specialService: specialService?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    airCargo.push(newCargo);

    res.status(201).json({
      success: true,
      message: '舱位信息发布成功',
      data: newCargo
    });
  } catch (error) {
    console.error('发布舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// POST /api/airfreight/demands - 发布货运需求 (需要认证)
router.post('/demands', auth, (req, res) => {
  try {
    const validation = validateAirDemandData(req.body);
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
      insurance,
      notes
    } = req.body;

    const newDemand = {
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
      insurance: insurance?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    airDemands.push(newDemand);

    res.status(201).json({
      success: true,
      message: '货运需求发布成功',
      data: newDemand
    });
  } catch (error) {
    console.error('发布货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// PUT /api/airfreight/cargo/:id - 更新舱位信息 (需要认证)
router.put('/cargo/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const cargoIndex = airCargo.findIndex(c => c.id === parseInt(id) && c.isActive);
    
    if (cargoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '舱位信息不存在'
      });
    }
    
    const cargo = airCargo[cargoIndex];
    
    // 检查用户权限
    if (cargo.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此信息'
      });
    }
    
    const validation = validateAirCargoData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // 更新舱位信息
    const updatedCargo = {
      ...cargo,
      ...req.body,
      id: cargo.id,
      userId: cargo.userId,
      rating: cargo.rating,
      createdAt: cargo.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    airCargo[cargoIndex] = updatedCargo;
    
    res.json({
      success: true,
      message: '舱位信息更新成功',
      data: updatedCargo
    });
  } catch (error) {
    console.error('更新舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// DELETE /api/airfreight/cargo/:id - 删除舱位信息 (需要认证)
router.delete('/cargo/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const cargo = airCargo.find(c => c.id === parseInt(id) && c.isActive);
    
    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: '舱位信息不存在'
      });
    }
    
    // 检查用户权限
    if (cargo.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此信息'
      });
    }
    
    // 软删除
    cargo.isActive = false;
    cargo.deletedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '舱位信息删除成功'
    });
  } catch (error) {
    console.error('删除舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/airfreight/my-posts - 获取用户发布的信息 (需要认证)
router.get('/my-posts', auth, (req, res) => {
  try {
    const userCargo = airCargo.filter(cargo => cargo.userId === req.user.userId && cargo.isActive);
    const userDemands = airDemands.filter(demand => demand.userId === req.user.userId && demand.isActive);
    
    res.json({
      success: true,
      data: {
        cargo: userCargo,
        demands: userDemands
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