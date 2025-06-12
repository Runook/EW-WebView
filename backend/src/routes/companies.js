const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');

// 获取所有分类和子分类
router.get('/categories', async (req, res) => {
  try {
    const categories = {
      '物流货运': ['陆运服务', '海运服务', '空运服务', '多式联运'],
      '仓储货代': ['收货仓', '海外仓', '货代公司'],
      '报关清关': ['中美清关行', 'T86'],
      '卡车服务': ['买卖车行', '维修保养', '交通罚单', '拖车服务', '配件装潢'],
      '保险服务': ['汽车保险', '人身保险', '其他保险'],
      '金融服务': ['设备', '仓库', '生意', '等金融贷款', '税务会计', '理财'],
      '技术服务': ['软件商', '设备商', '硬件配件商'],
      '律师服务': ['交通意外伤害', '综合律师', '民诉律师', '商业律师', '华人事务所']
    };
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

// 获取指定子分类下的公司列表
router.get('/subcategory/:subcategory', async (req, res) => {
  try {
    const { subcategory } = req.params;
    const { search, page = 1, limit = 10 } = req.query;
    
    let query = { subcategory, active: true };
    
    // 搜索功能
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const companies = await Company.find(query)
      .populate('publishedBy', 'username')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Company.countDocuments(query);
    
    res.json({
      success: true,
      data: companies,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: companies.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('获取公司列表失败:', error);
    res.status(500).json({ success: false, message: '获取公司列表失败' });
  }
});

// 获取所有公司（带分页和搜索）
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, search, page = 1, limit = 10 } = req.query;
    
    let query = { active: true };
    
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const companies = await Company.find(query)
      .populate('publishedBy', 'username')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Company.countDocuments(query);
    
    res.json({
      success: true,
      data: companies,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: companies.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('获取公司列表失败:', error);
    res.status(500).json({ success: false, message: '获取公司列表失败' });
  }
});

// 获取单个公司详情
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('publishedBy', 'username');
    
    if (!company) {
      return res.status(404).json({ success: false, message: '公司不存在' });
    }
    
    // 增加浏览次数
    company.viewCount += 1;
    await company.save();
    
    res.json({ success: true, data: company });
  } catch (error) {
    console.error('获取公司详情失败:', error);
    res.status(500).json({ success: false, message: '获取公司详情失败' });
  }
});

// 发布公司信息（需要登录）
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      phone,
      email,
      address,
      website
    } = req.body;
    
    // 验证必填字段
    if (!name || !description || !category || !subcategory || !phone || !email || !address) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }
    
    // 检查是否已存在相同名称的公司
    const existingCompany = await Company.findOne({ name, active: true });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: '该公司名称已存在' });
    }
    
    const company = new Company({
      name,
      description,
      category,
      subcategory,
      phone,
      email,
      address,
      website: website || '',
      publishedBy: req.user.id
    });
    
    await company.save();
    
    const populatedCompany = await Company.findById(company._id)
      .populate('publishedBy', 'username');
    
    res.status(201).json({ success: true, data: populatedCompany });
  } catch (error) {
    console.error('发布公司信息失败:', error);
    res.status(500).json({ success: false, message: '发布公司信息失败' });
  }
});

// 更新公司信息（需要登录且为发布者）
router.put('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ success: false, message: '公司不存在' });
    }
    
    // 检查权限
    if (company.publishedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限修改此公司信息' });
    }
    
    const {
      name,
      description,
      category,
      subcategory,
      phone,
      email,
      address,
      website
    } = req.body;
    
    // 更新字段
    if (name) company.name = name;
    if (description) company.description = description;
    if (category) company.category = category;
    if (subcategory) company.subcategory = subcategory;
    if (phone) company.phone = phone;
    if (email) company.email = email;
    if (address) company.address = address;
    if (website !== undefined) company.website = website;
    
    await company.save();
    
    const updatedCompany = await Company.findById(company._id)
      .populate('publishedBy', 'username');
    
    res.json({ success: true, data: updatedCompany });
  } catch (error) {
    console.error('更新公司信息失败:', error);
    res.status(500).json({ success: false, message: '更新公司信息失败' });
  }
});

// 删除公司信息（软删除）
router.delete('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ success: false, message: '公司不存在' });
    }
    
    // 检查权限
    if (company.publishedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限删除此公司信息' });
    }
    
    company.active = false;
    await company.save();
    
    res.json({ success: true, message: '公司信息已删除' });
  } catch (error) {
    console.error('删除公司信息失败:', error);
    res.status(500).json({ success: false, message: '删除公司信息失败' });
  }
});

// 获取统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments({ active: true });
    
    // 按分类统计
    const categoryStats = await Company.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 按子分类统计
    const subcategoryStats = await Company.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCompanies,
        categoryStats,
        subcategoryStats
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ success: false, message: '获取统计信息失败' });
  }
});

module.exports = router; 