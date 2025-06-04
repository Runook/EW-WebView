// 海运信息数据模型
// 这是为将来数据库集成准备的模型定义

const SeaCargoSchema = {
  id: {
    type: 'INTEGER',
    primaryKey: true,
    autoIncrement: true
  },
  origin: {
    type: 'STRING',
    allowNull: false,
    comment: '起始港'
  },
  destination: {
    type: 'STRING',
    allowNull: false,
    comment: '目的港'
  },
  sailingDate: {
    type: 'DATE',
    allowNull: false,
    comment: '开船日期'
  },
  cutOffDate: {
    type: 'DATE',
    allowNull: false,
    comment: '截关日期'
  },
  vesselName: {
    type: 'STRING',
    allowNull: false,
    comment: '船名'
  },
  shippingLine: {
    type: 'STRING',
    allowNull: false,
    comment: '船公司'
  },
  vesselType: {
    type: 'STRING',
    allowNull: false,
    comment: '船舶类型'
  },
  availableSpace: {
    type: 'STRING',
    allowNull: false,
    comment: '可用舱位'
  },
  rate: {
    type: 'STRING',
    allowNull: false,
    comment: '运费报价'
  },
  transitTime: {
    type: 'STRING',
    comment: '航程时间'
  },
  cargoType: {
    type: 'STRING',
    allowNull: false,
    comment: '货物类型'
  },
  containerTypes: {
    type: 'STRING',
    comment: '集装箱类型'
  },
  specialService: {
    type: 'STRING',
    comment: '特殊服务'
  },
  company: {
    type: 'STRING',
    allowNull: false,
    comment: '公司名称'
  },
  phone: {
    type: 'STRING',
    allowNull: false,
    comment: '联系电话'
  },
  email: {
    type: 'STRING',
    comment: '联系邮箱'
  },
  notes: {
    type: 'TEXT',
    comment: '备注信息'
  },
  rating: {
    type: 'DECIMAL(2,1)',
    defaultValue: 4.5,
    comment: '评分'
  },
  isActive: {
    type: 'BOOLEAN',
    defaultValue: true,
    comment: '是否有效'
  },
  userId: {
    type: 'INTEGER',
    allowNull: false,
    comment: '发布用户ID',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: 'DATE',
    allowNull: false,
    defaultValue: 'NOW()'
  },
  updatedAt: {
    type: 'DATE',
    allowNull: false,
    defaultValue: 'NOW()'
  }
};

const SeaDemandSchema = {
  id: {
    type: 'INTEGER',
    primaryKey: true,
    autoIncrement: true
  },
  origin: {
    type: 'STRING',
    allowNull: false,
    comment: '起始港'
  },
  destination: {
    type: 'STRING',
    allowNull: false,
    comment: '目的港'
  },
  requiredDate: {
    type: 'DATE',
    allowNull: false,
    comment: '要求开船日期'
  },
  weight: {
    type: 'STRING',
    allowNull: false,
    comment: '货物重量/数量'
  },
  cargoType: {
    type: 'STRING',
    allowNull: false,
    comment: '货物类型'
  },
  containerType: {
    type: 'STRING',
    allowNull: false,
    comment: '集装箱类型'
  },
  urgency: {
    type: 'STRING',
    allowNull: false,
    comment: '紧急程度'
  },
  maxRate: {
    type: 'STRING',
    allowNull: false,
    comment: '最高预算'
  },
  incoterms: {
    type: 'STRING',
    comment: '贸易条款'
  },
  specialRequirements: {
    type: 'STRING',
    comment: '特殊要求'
  },
  insurance: {
    type: 'STRING',
    comment: '保险需求'
  },
  company: {
    type: 'STRING',
    allowNull: false,
    comment: '公司名称'
  },
  phone: {
    type: 'STRING',
    allowNull: false,
    comment: '联系电话'
  },
  email: {
    type: 'STRING',
    comment: '联系邮箱'
  },
  notes: {
    type: 'TEXT',
    comment: '补充说明'
  },
  rating: {
    type: 'DECIMAL(2,1)',
    defaultValue: 4.5,
    comment: '评分'
  },
  isActive: {
    type: 'BOOLEAN',
    defaultValue: true,
    comment: '是否有效'
  },
  userId: {
    type: 'INTEGER',
    allowNull: false,
    comment: '发布用户ID',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: 'DATE',
    allowNull: false,
    defaultValue: 'NOW()'
  },
  updatedAt: {
    type: 'DATE',
    allowNull: false,
    defaultValue: 'NOW()'
  }
};

// 数据库表创建 SQL (适用于 MySQL/PostgreSQL)
const createSeaCargoTableSQL = `
CREATE TABLE IF NOT EXISTS sea_cargo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(255) NOT NULL COMMENT '起始港',
  destination VARCHAR(255) NOT NULL COMMENT '目的港',
  sailing_date DATE NOT NULL COMMENT '开船日期',
  cut_off_date DATE NOT NULL COMMENT '截关日期',
  vessel_name VARCHAR(255) NOT NULL COMMENT '船名',
  shipping_line VARCHAR(255) NOT NULL COMMENT '船公司',
  vessel_type VARCHAR(100) NOT NULL COMMENT '船舶类型',
  available_space VARCHAR(100) NOT NULL COMMENT '可用舱位',
  rate VARCHAR(100) NOT NULL COMMENT '运费报价',
  transit_time VARCHAR(50) COMMENT '航程时间',
  cargo_type VARCHAR(100) NOT NULL COMMENT '货物类型',
  container_types VARCHAR(255) COMMENT '集装箱类型',
  special_service VARCHAR(255) COMMENT '特殊服务',
  company VARCHAR(255) NOT NULL COMMENT '公司名称',
  phone VARCHAR(50) NOT NULL COMMENT '联系电话',
  email VARCHAR(255) COMMENT '联系邮箱',
  notes TEXT COMMENT '备注信息',
  rating DECIMAL(2,1) DEFAULT 4.5 COMMENT '评分',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效',
  user_id INT NOT NULL COMMENT '发布用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_origin (origin),
  INDEX idx_destination (destination),
  INDEX idx_sailing_date (sailing_date),
  INDEX idx_cargo_type (cargo_type),
  INDEX idx_vessel_type (vessel_type),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const createSeaDemandTableSQL = `
CREATE TABLE IF NOT EXISTS sea_demands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(255) NOT NULL COMMENT '起始港',
  destination VARCHAR(255) NOT NULL COMMENT '目的港',
  required_date DATE NOT NULL COMMENT '要求开船日期',
  weight VARCHAR(100) NOT NULL COMMENT '货物重量/数量',
  cargo_type VARCHAR(100) NOT NULL COMMENT '货物类型',
  container_type VARCHAR(100) NOT NULL COMMENT '集装箱类型',
  urgency VARCHAR(50) NOT NULL COMMENT '紧急程度',
  max_rate VARCHAR(100) NOT NULL COMMENT '最高预算',
  incoterms VARCHAR(50) COMMENT '贸易条款',
  special_requirements VARCHAR(255) COMMENT '特殊要求',
  insurance VARCHAR(100) COMMENT '保险需求',
  company VARCHAR(255) NOT NULL COMMENT '公司名称',
  phone VARCHAR(50) NOT NULL COMMENT '联系电话',
  email VARCHAR(255) COMMENT '联系邮箱',
  notes TEXT COMMENT '补充说明',
  rating DECIMAL(2,1) DEFAULT 4.5 COMMENT '评分',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效',
  user_id INT NOT NULL COMMENT '发布用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_origin (origin),
  INDEX idx_destination (destination),
  INDEX idx_required_date (required_date),
  INDEX idx_cargo_type (cargo_type),
  INDEX idx_urgency (urgency),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

// 验证函数
const validateSeaCargo = (data) => {
  const required = ['origin', 'destination', 'sailingDate', 'vesselName', 'shippingLine', 
                   'availableSpace', 'rate', 'cargoType', 'vesselType', 'cutOffDate', 
                   'company', 'phone'];
  
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      return { isValid: false, error: `${field} 是必填字段` };
    }
  }
  
  // 验证日期格式
  if (new Date(data.sailingDate) <= new Date()) {
    return { isValid: false, error: '开船日期必须是未来日期' };
  }
  
  if (new Date(data.cutOffDate) >= new Date(data.sailingDate)) {
    return { isValid: false, error: '截关日期必须早于开船日期' };
  }
  
  // 验证电话号码格式
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(data.phone)) {
    return { isValid: false, error: '电话号码格式不正确' };
  }
  
  // 验证邮箱格式（如果提供）
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { isValid: false, error: '邮箱格式不正确' };
    }
  }
  
  return { isValid: true };
};

const validateSeaDemand = (data) => {
  const required = ['origin', 'destination', 'requiredDate', 'weight', 'cargoType', 
                   'urgency', 'maxRate', 'company', 'phone', 'containerType'];
  
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      return { isValid: false, error: `${field} 是必填字段` };
    }
  }
  
  // 验证日期格式
  if (new Date(data.requiredDate) <= new Date()) {
    return { isValid: false, error: '要求开船日期必须是未来日期' };
  }
  
  // 验证电话号码格式
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(data.phone)) {
    return { isValid: false, error: '电话号码格式不正确' };
  }
  
  // 验证邮箱格式（如果提供）
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { isValid: false, error: '邮箱格式不正确' };
    }
  }
  
  return { isValid: true };
};

// 数据常量
const CARGO_TYPES = [
  '普货', '危险品', '冷冻货物', '散货', '液体货物', '超重超限',
  '电子产品', '机械设备', '化工品', '食品原料', '纺织品', '汽车及配件'
];

const VESSEL_TYPES = [
  '集装箱船', '散货船', '液货船', '滚装船', '多用途船', '超大型集装箱船'
];

const CONTAINER_TYPES = [
  '20GP (干货集装箱)', '40GP (干货集装箱)', '40HC (高箱)',
  '20RF (冷冻箱)', '40RF (冷冻箱)', '20OT (开顶箱)', '40OT (开顶箱)',
  '20FR (框架箱)', '40FR (框架箱)', '20TK (罐箱)', 'LCL (散货拼箱)', '散货船'
];

const URGENCY_LEVELS = ['普通', '加急', '紧急', '特急'];

const INCOTERMS = [
  'EXW (工厂交货)', 'FCA (货交承运人)', 'FAS (船边交货)', 'FOB (船上交货)',
  'CFR (成本加运费)', 'CIF (成本保险费加运费)', 'CPT (运费付至)', 'CIP (运费保险费付至)',
  'DAP (目的地交货)', 'DPU (目的地卸货交货)', 'DDP (完税后交货)'
];

const SHIPPING_LINES = [
  '中远海运集装箱运输', '东方海外货柜航运', '地中海航运', '马士基航运',
  '达飞轮船', '赫伯罗特', '阳明海运', '现代商船', '万海航运'
];

module.exports = {
  SeaCargoSchema,
  SeaDemandSchema,
  createSeaCargoTableSQL,
  createSeaDemandTableSQL,
  validateSeaCargo,
  validateSeaDemand,
  CARGO_TYPES,
  VESSEL_TYPES,
  CONTAINER_TYPES,
  URGENCY_LEVELS,
  INCOTERMS,
  SHIPPING_LINES
}; 