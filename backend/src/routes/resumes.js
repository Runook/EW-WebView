const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Resume = require('../models/Resume');
const { auth } = require('../middleware/auth');
const router = express.Router();

// 获取所有简历（带筛选）
router.get('/', [
  query('position').optional().isString(),
  query('location').optional().isString(),
  query('experience').optional().isString(),
  query('workTypePreference').optional().isString(),
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
      position: req.query.position,
      location: req.query.location,
      experience: req.query.experience,
      workTypePreference: req.query.workTypePreference,
      search: req.query.search
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const resumes = await Resume.getAllResumes(filters);

    res.json({
      success: true,
      data: resumes,
      total: resumes.length
    });

  } catch (error) {
    console.error('GET /resumes error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取职位统计
router.get('/stats/positions', async (req, res) => {
  try {
    const stats = await Resume.getPositionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('GET /resumes/stats/positions error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 搜索简历
router.get('/search', [
  query('q').notEmpty().withMessage('搜索关键词不能为空'),
  query('position').optional().isString(),
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
      position: req.query.position,
      location: req.query.location
    };

    // 移除空值
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const resumes = await Resume.searchResumes(searchTerm, filters);

    res.json({
      success: true,
      data: resumes,
      total: resumes.length,
      searchTerm
    });

  } catch (error) {
    console.error('GET /resumes/search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

// 获取用户发布的简历
router.get('/my/posts', auth, async (req, res) => {
  try {
    const resumes = await Resume.getUserResumes(req.user.userId);
    
    res.json({
      success: true,
      data: resumes,
      total: resumes.length
    });
  } catch (error) {
    console.error('GET /resumes/my/posts error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的简历失败'
    });
  }
});

// 获取单个简历详情
router.get('/:id', async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({
        success: false,
        message: '无效的简历ID'
      });
    }

    const resume = await Resume.getResumeById(resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: '简历不存在'
      });
    }

    // 增加浏览量
    await Resume.incrementViews(resumeId);

    res.json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('GET /resumes/:id error:', error);
    res.status(500).json({
      success: false,
      message: '获取简历详情失败'
    });
  }
});

// 创建新简历（需要认证）
router.post('/', auth, [
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('position').notEmpty().withMessage('求职岗位不能为空'),
  body('experience').notEmpty().withMessage('工作经验不能为空'),
  body('location').notEmpty().withMessage('期望地点不能为空'),
  body('phone').notEmpty().withMessage('联系电话不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('skills').notEmpty().withMessage('技能专长不能为空'),
  body('summary').optional().isString(),
  body('expectedSalary').optional().isString(),
  body('workTypePreference').optional().isString()
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

    // 处理技能数据
    let skills = [];
    if (typeof req.body.skills === 'string') {
      skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    } else if (Array.isArray(req.body.skills)) {
      skills = req.body.skills;
    }

    const resumeData = {
      userId: req.user.userId,
      name: req.body.name,
      position: req.body.position,
      experience: req.body.experience,
      location: req.body.location,
      phone: req.body.phone,
      email: req.body.email,
      skills: skills,
      summary: req.body.summary,
      expectedSalary: req.body.expectedSalary,
      workTypePreference: req.body.workTypePreference
    };

    const resume = await Resume.createResume(resumeData);

    res.status(201).json({
      success: true,
      message: '简历发布成功',
      data: resume
    });

  } catch (error) {
    console.error('POST /resumes error:', error);
    res.status(500).json({
      success: false,
      message: '发布简历失败'
    });
  }
});

// 更新简历（需要认证，只能更新自己的）
router.put('/:id', auth, [
  body('name').optional().notEmpty(),
  body('position').optional().notEmpty(),
  body('experience').optional().notEmpty(),
  body('location').optional().notEmpty(),
  body('phone').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('skills').optional(),
  body('summary').optional().isString(),
  body('expectedSalary').optional().isString(),
  body('workTypePreference').optional().isString()
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

    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({
        success: false,
        message: '无效的简历ID'
      });
    }

    // 处理技能数据
    let skills = undefined;
    if (req.body.skills) {
      if (typeof req.body.skills === 'string') {
        skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      } else if (Array.isArray(req.body.skills)) {
        skills = req.body.skills;
      }
    }

    const resumeData = {
      name: req.body.name,
      position: req.body.position,
      experience: req.body.experience,
      location: req.body.location,
      phone: req.body.phone,
      email: req.body.email,
      skills: skills,
      summary: req.body.summary,
      expectedSalary: req.body.expectedSalary,
      workTypePreference: req.body.workTypePreference
    };

    const updatedResume = await Resume.updateResume(resumeId, resumeData, req.user.userId);

    if (!updatedResume) {
      return res.status(404).json({
        success: false,
        message: '简历不存在或无权限修改'
      });
    }

    res.json({
      success: true,
      message: '简历更新成功',
      data: updatedResume
    });

  } catch (error) {
    console.error('PUT /resumes/:id error:', error);
    res.status(500).json({
      success: false,
      message: '更新简历失败'
    });
  }
});

// 删除简历（需要认证，只能删除自己的）
router.delete('/:id', auth, async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({
        success: false,
        message: '无效的简历ID'
      });
    }

    const deleted = await Resume.deleteResume(resumeId, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '简历不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: '简历删除成功'
    });

  } catch (error) {
    console.error('DELETE /resumes/:id error:', error);
    res.status(500).json({
      success: false,
      message: '删除简历失败'
    });
  }
});

module.exports = router; 