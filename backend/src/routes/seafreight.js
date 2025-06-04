const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// 生成合理的未来日期
const getRandomFutureDate = (daysFromNow = 5, maxDays = 30) => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysFromNow + Math.floor(Math.random() * maxDays));
  return futureDate.toISOString().split('T')[0];
};

// Mock data storage (在生产环境中应该使用真实数据库)
let seaCargo = [
  {
    id: 1,
    origin: '上海港 (CNSHA)',
    destination: '洛杉矶港 (USLAX)',
    sailingDate: getRandomFutureDate(5),
    vesselName: '中远海运宇宙',
    shippingLine: '中远海运集装箱运输',
    availableSpace: '200 TEU',
    rate: '¥2,800/TEU',
    transitTime: '15天',
    cargoType: '普货/危险品',
    company: '中远海运代理',
    rating: 4.8,
    phone: '(021) 1234-5678',
    vesselType: '集装箱船',
    cutOffDate: getRandomFutureDate(3),
    specialService: 'Door to Door',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    origin: '深圳盐田港 (CNYKA)',
    destination: '汉堡港 (DEHAM)',
    sailingDate: getRandomFutureDate(7),
    vesselName: 'OOCL Hong Kong',
    shippingLine: '东方海外货柜航运',
    availableSpace: '150 TEU',
    rate: '¥3,200/TEU',
    transitTime: '28天',
    cargoType: '普货/冷冻',
    company: '东方海外代理',
    rating: 4.9,
    phone: '(0755) 9876-5432',
    vesselType: '集装箱船',
    cutOffDate: getRandomFutureDate(5),
    specialService: '冷链服务',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    origin: '宁波舟山港 (CNNGB)',
    destination: '鹿特丹港 (NLRTM)',
    sailingDate: getRandomFutureDate(10),
    vesselName: 'MSC Oscar',
    shippingLine: '地中海航运',
    availableSpace: '300 TEU',
    rate: '¥2,600/TEU',
    transitTime: '30天',
    cargoType: '普货/散货',
    company: '地中海航运中国',
    rating: 4.7,
    phone: '(0574) 5555-8888',
    vesselType: '超大型集装箱船',
    cutOffDate: getRandomFutureDate(8),
    specialService: 'LCL拼箱',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    origin: '青岛港 (CNTAO)',
    destination: '纽约港 (USNYC)',
    sailingDate: getRandomFutureDate(12),
    vesselName: 'COSCO SHIPPING Universe',
    shippingLine: '中远海运集装箱运输',
    availableSpace: '180 TEU',
    rate: '¥3,000/TEU',
    transitTime: '18天',
    cargoType: '普货/项目货',
    company: '中远海运青岛',
    rating: 4.6,
    phone: '(0532) 7777-9999',
    vesselType: '集装箱船',
    cutOffDate: getRandomFutureDate(10),
    specialService: '项目物流',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let seaDemands = [
  {
    id: 1,
    origin: '广州南沙港 (CNCAN)',
    destination: '新加坡港 (SGSIN)',
    requiredDate: getRandomFutureDate(8),
    weight: '20 TEU',
    cargoType: '电子产品',
    urgency: '紧急',
    maxRate: '¥1,800/TEU',
    company: '广州科技出口',
    rating: 4.6,
    phone: '(020) 1111-2222',
    specialRequirements: '恒温干燥',
    insurance: '高价值货物保险',
    containerType: '20GP 干箱',
    incoterms: 'FOB',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    origin: '天津港 (CNTSN)',
    destination: '安特卫普港 (BEANR)',
    requiredDate: getRandomFutureDate(10),
    weight: '35 TEU',
    cargoType: '机械设备',
    urgency: '加急',
    maxRate: '¥2,500/TEU',
    company: '京津冀重工',
    rating: 4.8,
    phone: '(022) 3333-4444',
    specialRequirements: '超重货物处理',
    insurance: '基础货物保险',
    containerType: '40HC 超高箱',
    incoterms: 'CIF',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    origin: '厦门港 (CNXMN)',
    destination: '釜山港 (KRPUS)',
    requiredDate: getRandomFutureDate(15),
    weight: '10 TEU',
    cargoType: '食品原料',
    urgency: '普通',
    maxRate: '¥1,200/TEU',
    company: '闽南食品贸易',
    rating: 4.5,
    phone: '(0592) 6666-7777',
    specialRequirements: '冷藏运输',
    insurance: '食品安全保险',
    containerType: '20RF 冷冻箱',
    incoterms: 'EXW',
    userId: null,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// 增强的数据验证函数
const validateSeaCargoData = (data) => {
  const required = ['origin', 'destination', 'sailingDate', 'vesselName', 'shippingLine', 
                   'availableSpace', 'rate', 'cargoType', 'vesselType', 'cutOffDate', 
                   'companyName', 'contactPhone'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  // 验证日期
  const sailingDate = new Date(data.sailingDate);
  const cutOffDate = new Date(data.cutOffDate);
  const today = new Date();
  
  if (sailingDate <= today) {
    return { isValid: false, error: '开船日期必须是未来日期' };
  }
  
  if (cutOffDate >= sailingDate) {
    return { isValid: false, error: '截关日期必须早于开船日期' };
  }
  
  return { isValid: true };
};

const validateSeaDemandData = (data) => {
  const required = ['origin', 'destination', 'requiredDate', 'weight', 'cargoType', 
                   'urgency', 'maxRate', 'companyName', 'contactPhone', 'containerType'];
  
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    return { isValid: false, error: `缺少必填字段: ${missing.join(', ')}` };
  }
  
  // 验证日期
  const requiredDate = new Date(data.requiredDate);
  const today = new Date();
  
  if (requiredDate <= today) {
    return { isValid: false, error: '要求开船日期必须是未来日期' };
  }
  
  return { isValid: true };
};

// GET /api/seafreight/cargo - 获取所有舱位信息
router.get('/cargo', (req, res) => {
  try {
    const { origin, destination, cargoType, vesselType, page = 1, limit = 10, search } = req.query;
    
    let filteredCargo = seaCargo.filter(cargo => cargo.isActive);
    
    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCargo = filteredCargo.filter(cargo => 
        cargo.origin.toLowerCase().includes(searchTerm) ||
        cargo.destination.toLowerCase().includes(searchTerm) ||
        cargo.cargoType.toLowerCase().includes(searchTerm) ||
        cargo.company.toLowerCase().includes(searchTerm) ||
        cargo.vesselName.toLowerCase().includes(searchTerm) ||
        cargo.shippingLine.toLowerCase().includes(searchTerm)
      );
    }
    
    // 应用过滤器
    if (origin) {
      filteredCargo = filteredCargo.filter(cargo => 
        cargo.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filteredCargo = filteredCargo.filter(cargo => 
        cargo.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (cargoType) {
      filteredCargo = filteredCargo.filter(cargo => 
        cargo.cargoType.toLowerCase().includes(cargoType.toLowerCase())
      );
    }
    
    if (vesselType) {
      filteredCargo = filteredCargo.filter(cargo => 
        cargo.vesselType.toLowerCase().includes(vesselType.toLowerCase())
      );
    }
    
    // 按开船日期排序
    filteredCargo.sort((a, b) => new Date(a.sailingDate) - new Date(b.sailingDate));
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCargo = filteredCargo.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedCargo,
      total: filteredCargo.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredCargo.length / limit)
    });
  } catch (error) {
    console.error('获取舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// GET /api/seafreight/demands - 获取所有货运需求
router.get('/demands', (req, res) => {
  try {
    const { origin, destination, cargoType, urgency, page = 1, limit = 10, search } = req.query;
    
    let filteredDemands = seaDemands.filter(demand => demand.isActive);
    
    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredDemands = filteredDemands.filter(demand => 
        demand.origin.toLowerCase().includes(searchTerm) ||
        demand.destination.toLowerCase().includes(searchTerm) ||
        demand.cargoType.toLowerCase().includes(searchTerm) ||
        demand.company.toLowerCase().includes(searchTerm)
      );
    }
    
    // 应用过滤器
    if (origin) {
      filteredDemands = filteredDemands.filter(demand => 
        demand.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filteredDemands = filteredDemands.filter(demand => 
        demand.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (cargoType) {
      filteredDemands = filteredDemands.filter(demand => 
        demand.cargoType.toLowerCase().includes(cargoType.toLowerCase())
      );
    }
    
    if (urgency) {
      filteredDemands = filteredDemands.filter(demand => 
        demand.urgency === urgency
      );
    }
    
    // 按紧急程度和要求日期排序
    filteredDemands.sort((a, b) => {
      const urgencyOrder = { '特急': 4, '紧急': 3, '加急': 2, '普通': 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.requiredDate) - new Date(b.requiredDate);
    });
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedDemands = filteredDemands.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedDemands,
      total: filteredDemands.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredDemands.length / limit)
    });
  } catch (error) {
    console.error('获取货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

// POST /api/seafreight/cargo - 发布舱位信息 (需要认证)
router.post('/cargo', auth, (req, res) => {
  try {
    const validation = validateSeaCargoData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const {
      origin,
      destination,
      sailingDate,
      vesselName,
      shippingLine,
      availableSpace,
      rate,
      transitTime,
      cargoType,
      vesselType,
      cutOffDate,
      companyName,
      contactPhone,
      contactEmail,
      specialService,
      containerTypes,
      notes
    } = req.body;

    // 创建新的舱位信息
    const newCargo = {
      id: Date.now(),
      origin: origin.trim(),
      destination: destination.trim(),
      sailingDate,
      vesselName: vesselName.trim(),
      shippingLine: shippingLine.trim(),
      availableSpace: availableSpace.trim(),
      rate: rate.trim(),
      transitTime: transitTime?.trim() || '',
      cargoType: cargoType.trim(),
      vesselType: vesselType.trim(),
      cutOffDate,
      company: companyName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail?.trim() || '',
      specialService: specialService?.trim() || '',
      containerTypes: containerTypes?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5, // 默认评分
      isActive: true,
      createdAt: new Date().toISOString()
    };

    seaCargo.push(newCargo);

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

// POST /api/seafreight/demands - 发布货运需求 (需要认证)
router.post('/demands', auth, (req, res) => {
  try {
    const validation = validateSeaDemandData(req.body);
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
      containerType,
      incoterms,
      notes
    } = req.body;

    // 创建新的货运需求
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
      containerType: containerType.trim(),
      incoterms: incoterms?.trim() || '',
      notes: notes?.trim() || '',
      userId: req.user.userId,
      rating: 4.5, // 默认评分
      isActive: true,
      createdAt: new Date().toISOString()
    };

    seaDemands.push(newDemand);

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

// GET /api/seafreight/cargo/:id - 获取特定舱位信息
router.get('/cargo/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cargo = seaCargo.find(c => c.id === parseInt(id) && c.isActive);
    
    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: '舱位信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: cargo
    });
  } catch (error) {
    console.error('获取舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/seafreight/demands/:id - 获取特定货运需求
router.get('/demands/:id', (req, res) => {
  try {
    const { id } = req.params;
    const demand = seaDemands.find(d => d.id === parseInt(id) && d.isActive);
    
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: '货运需求不存在'
      });
    }
    
    res.json({
      success: true,
      data: demand
    });
  } catch (error) {
    console.error('获取货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// PUT /api/seafreight/cargo/:id - 更新舱位信息 (需要认证和权限)
router.put('/cargo/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const cargoIndex = seaCargo.findIndex(c => c.id === parseInt(id) && c.isActive);
    
    if (cargoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '舱位信息不存在'
      });
    }
    
    const cargo = seaCargo[cargoIndex];
    
    // 检查用户权限
    if (cargo.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此舱位信息'
      });
    }
    
    // 验证更新数据
    const validation = validateSeaCargoData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // 更新舱位信息
    seaCargo[cargoIndex] = {
      ...cargo,
      ...req.body,
      id: cargo.id,
      userId: cargo.userId,
      createdAt: cargo.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '舱位信息更新成功',
      data: seaCargo[cargoIndex]
    });
  } catch (error) {
    console.error('更新舱位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// PUT /api/seafreight/demands/:id - 更新货运需求 (需要认证和权限)
router.put('/demands/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const demandIndex = seaDemands.findIndex(d => d.id === parseInt(id) && d.isActive);
    
    if (demandIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '货运需求不存在'
      });
    }
    
    const demand = seaDemands[demandIndex];
    
    // 检查用户权限
    if (demand.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此货运需求'
      });
    }
    
    // 验证更新数据
    const validation = validateSeaDemandData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // 更新货运需求
    seaDemands[demandIndex] = {
      ...demand,
      ...req.body,
      id: demand.id,
      userId: demand.userId,
      createdAt: demand.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '货运需求更新成功',
      data: seaDemands[demandIndex]
    });
  } catch (error) {
    console.error('更新货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// DELETE /api/seafreight/cargo/:id - 删除舱位信息 (需要认证和权限)
router.delete('/cargo/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const cargoIndex = seaCargo.findIndex(c => c.id === parseInt(id) && c.isActive);
    
    if (cargoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '舱位信息不存在'
      });
    }
    
    const cargo = seaCargo[cargoIndex];
    
    // 检查用户权限
    if (cargo.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此舱位信息'
      });
    }
    
    // 软删除 - 标记为非活跃状态而不是物理删除
    seaCargo[cargoIndex].isActive = false;
    seaCargo[cargoIndex].deletedAt = new Date().toISOString();
    
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

// DELETE /api/seafreight/demands/:id - 删除货运需求 (需要认证和权限)
router.delete('/demands/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const demandIndex = seaDemands.findIndex(d => d.id === parseInt(id) && d.isActive);
    
    if (demandIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '货运需求不存在'
      });
    }
    
    const demand = seaDemands[demandIndex];
    
    // 检查用户权限
    if (demand.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此货运需求'
      });
    }
    
    // 软删除 - 标记为非活跃状态而不是物理删除
    seaDemands[demandIndex].isActive = false;
    seaDemands[demandIndex].deletedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '货运需求删除成功'
    });
  } catch (error) {
    console.error('删除货运需求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/seafreight/my-posts - 获取用户自己发布的信息 (需要认证)
router.get('/my-posts', auth, (req, res) => {
  try {
    const userCargo = seaCargo.filter(cargo => cargo.userId === req.user.userId && cargo.isActive);
    const userDemands = seaDemands.filter(demand => demand.userId === req.user.userId && demand.isActive);
    
    res.json({
      success: true,
      data: {
        cargo: userCargo,
        demands: userDemands,
        total: userCargo.length + userDemands.length
      }
    });
  } catch (error) {
    console.error('获取用户发布信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET /api/seafreight/stats - 获取平台统计信息
router.get('/stats', (req, res) => {
  try {
    const activeCargo = seaCargo.filter(cargo => cargo.isActive);
    const activeDemands = seaDemands.filter(demand => demand.isActive);
    
    const totalCargo = activeCargo.length;
    const totalDemands = activeDemands.length;
    
    const recentCargo = activeCargo.filter(cargo => {
      const cargoDate = new Date(cargo.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return cargoDate >= weekAgo;
    }).length;
    
    const recentDemands = activeDemands.filter(demand => {
      const demandDate = new Date(demand.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return demandDate >= weekAgo;
    }).length;
    
    res.json({
      success: true,
      data: {
        totalCargo,
        totalDemands,
        recentCargo,
        recentDemands,
        totalPosts: totalCargo + totalDemands,
        averageRating: 4.7,
        activeUsers: new Set([...activeCargo.map(c => c.userId), ...activeDemands.map(d => d.userId)]).size
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 