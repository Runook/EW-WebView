const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const UserManagement = require('../models/UserManagement');
const { auth } = require('../middleware/auth');
const router = express.Router();

// 获取所有职位（带筛选）
router.get('/', [
  query('category').optional().isString(),
  query('location').optional().isString(),
  query('workType').optional().isString(),
  query('experience').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数错误',
        errors: errors.array()
      });
    }

    const filters = {
      category: req.query.category,
      location: req.query.location,
      workType: req.query.workType,
      experience: req.query.experience,
      search: req.query.search
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const jobs = await Job.getAllJobs(filters);

    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });

  } catch (error) {
    console.error('GET /jobs error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await Job.getCategoryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('GET /jobs/stats/categories error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 搜索职位
router.get('/search', [
  query('q').notEmpty().withMessage('搜索关键词不能为空'),
  query('category').optional().isString(),
  query('location').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '搜索参数错误',
        errors: errors.array()
      });
    }

    const searchTerm = req.query.q;
    const filters = {
      category: req.query.category,
      location: req.query.location
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const jobs = await Job.searchJobs(searchTerm, filters);

    res.json({
      success: true,
      data: jobs,
      total: jobs.length,
      searchTerm
    });

  } catch (error) {
    console.error('GET /jobs/search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

// 获取用户发布的职位
router.get('/my/posts', auth, async (req, res) => {
  try {
    const jobs = await Job.getUserJobs(req.user.userId);
    
    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });
  } catch (error) {
    console.error('GET /jobs/my/posts error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的职位失败'
    });
  }
});

// 获取单个职位详情
router.get('/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: '无效的职位ID'
      });
    }

    const job = await Job.getJobById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: '职位不存在'
      });
    }

    // 增加浏览量
    await Job.incrementViews(jobId);

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('GET /jobs/:id error:', error);
    res.status(500).json({
      success: false,
      message: '获取职位详情失败'
    });
  }
});

// 创建新职位（需要认证）
router.post('/', auth, [
  body('title').notEmpty().withMessage('职位名称不能为空'),
  body('category').notEmpty().withMessage('职位分类不能为空'),
  body('company').notEmpty().withMessage('公司名称不能为空'),
  body('location').notEmpty().withMessage('工作地点不能为空'),
  body('salary').notEmpty().withMessage('薪资不能为空'),
  body('workType').notEmpty().withMessage('工作类型不能为空'),
  body('experience').notEmpty().withMessage('经验要求不能为空'),
  body('description').notEmpty().withMessage('职位描述不能为空'),
  body('contactPhone').optional(),
  body('contactEmail').optional().isEmail(),
  body('contactPerson').optional().isString()
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入信息有误',
        errors: errors.array()
      });
    }

    // 检查积分余额
    const postCost = await UserManagement.getSystemConfig('post_costs.job');
    const userCredits = await UserManagement.getUserCredits(req.user.userId);
    
    if (userCredits.current < postCost) {
      return res.status(400).json({
        success: false,
        message: '积分余额不足',
        data: {
          requiredCredits: postCost,
          currentCredits: userCredits.current,
          shortfall: postCost - userCredits.current
        }
      });
    }

    const jobData = {
      userId: req.user.userId,
      title: req.body.title,
      category: req.body.category,
      company: req.body.company,
      location: req.body.location,
      salary: req.body.salary,
      workType: req.body.workType,
      experience: req.body.experience,
      description: req.body.description,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      contactPerson: req.body.contactPerson
    };

    const job = await Job.createJob(jobData);
    
    let totalCreditsSpent = postCost;
    let premiumInfo = null;
    
    // 扣除基本发布积分
    await UserManagement.chargeForPost(req.user.userId, 'job', job.id);

    // 处理Premium选项
    if (req.body.premium && req.body.premium.type) {
      try {
        console.log('🌟 处理Premium选项:', req.body.premium);
        
        const premiumType = req.body.premium.type;
        const duration = req.body.premium.duration || 24; // 默认24小时
        
        const premiumResult = await UserManagement.makePremium(
          req.user.userId, 
          'job', 
          job.id, 
          premiumType, 
          duration
        );
        
        console.log('✅ Premium功能开通成功:', premiumResult);
        totalCreditsSpent += premiumResult.cost;
        premiumInfo = {
          type: premiumType,
          duration: duration,
          cost: premiumResult.cost,
          endTime: premiumResult.endTime
        };
      } catch (premiumError) {
        console.error('❌ Premium功能开通失败:', premiumError);
        // 不影响主要发布流程，但要在响应中告知用户
      }
    }

    res.status(201).json({
      success: true,
      message: '职位发布成功' + (premiumInfo ? `，${premiumInfo.type === 'top' ? '置顶' : '高亮'}功能已开通` : ''),
      data: job,
      creditsSpent: totalCreditsSpent,
      premium: premiumInfo
    });

  } catch (error) {
    console.error('POST /jobs error:', error);
    res.status(500).json({
      success: false,
      message: '发布职位失败'
    });
  }
});

// 更新职位（需要认证，只能更新自己的）
router.put('/:id', auth, [
  body('title').optional().notEmpty(),
  body('category').optional().notEmpty(),
  body('company').optional().notEmpty(),
  body('location').optional().notEmpty(),
  body('salary').optional().notEmpty(),
  body('workType').optional().notEmpty(),
  body('experience').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('contactPhone').optional(),
  body('contactEmail').optional().isEmail(),
  body('contactPerson').optional().isString()
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入信息有误',
        errors: errors.array()
      });
    }

    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: '无效的职位ID'
      });
    }

    const jobData = {
      title: req.body.title,
      category: req.body.category,
      company: req.body.company,
      location: req.body.location,
      salary: req.body.salary,
      workType: req.body.workType,
      experience: req.body.experience,
      description: req.body.description,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      contactPerson: req.body.contactPerson
    };

    const updatedJob = await Job.updateJob(jobId, jobData, req.user.userId);

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: '职位不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      message: '职位更新成功',
      data: updatedJob
    });

  } catch (error) {
    console.error('PUT /jobs/:id error:', error);
    res.status(500).json({
      success: false,
      message: '更新职位失败'
    });
  }
});

// 删除职位（需要认证，只能删除自己的）
router.delete('/:id', auth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: '无效的职位ID'
      });
    }

    const deleted = await Job.deleteJob(jobId, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '职位不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '职位删除成功'
    });

  } catch (error) {
    console.error('DELETE /jobs/:id error:', error);
    res.status(500).json({
      success: false,
      message: '删除职位失败'
    });
  }
});

module.exports = router; 