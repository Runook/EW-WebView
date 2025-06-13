const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // 分类信息
  category: {
    type: String,
    required: true,
    enum: ['物流货运', '仓储货代', '报关清关', '卡车服务', '保险服务', '金融服务', '技术服务', '律师服务', '其他']
  },
  subcategory: {
    type: String,
    required: true
  },
  
  // 联系信息
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true
  },
  website: {
    type: String,
    default: ''
  },
  
  // 状态信息
  verified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  
  // 评价信息
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // 统计信息
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  
  // 发布者信息
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
companySchema.index({ category: 1, subcategory: 1 });
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ createdAt: -1 });
companySchema.index({ rating: -1 });

module.exports = mongoose.model('Company', companySchema); 