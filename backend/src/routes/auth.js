const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 注册
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').isMobilePhone(),
  body('companyName').notEmpty().trim(),
  body('userType').isIn(['shipper', 'carrier'])
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

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      companyType,
      userType,
      address,
      city,
      state,
      zipCode,
      mcNumber,
      dotNumber,
      businessLicense
    } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 如果是承运商，检查MC号码是否已存在
    if (userType === 'carrier' && mcNumber) {
      const existingCarrier = await User.findByMCNumber(mcNumber);
      if (existingCarrier) {
        return res.status(400).json({
          success: false,
          message: '该MC号码已被注册'
        });
      }
    }

    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户数据
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      companyName,
      companyType,
      userType,
      address,
      city,
      state,
      zipCode,
      businessLicense,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 承运商特殊字段
    if (userType === 'carrier') {
      userData.mcNumber = mcNumber;
      userData.dotNumber = dotNumber;
    }

    // 创建用户
    const user = await User.create(userData);
    
    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 返回成功响应（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 登录
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱和密码'
      });
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系客服'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    await User.updateLastLogin(user.id);

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 返回成功响应（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 验证token
router.get('/verify', auth, async (req, res) => {
  try {
    // 获取用户信息（auth中间件已经验证了token）
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Token验证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户资料
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户资料
router.put('/profile', auth, [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().isMobilePhone(),
  body('companyName').optional().notEmpty().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim()
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

    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'companyName', 
      'companyType', 'address', 'city', 'state', 'zipCode'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供需要更新的信息'
      });
    }

    updates.updatedAt = new Date();

    // 更新用户信息
    await User.update(req.user.userId, updates);

    // 获取更新后的用户信息
    const updatedUser = await User.findById(req.user.userId);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: '资料更新成功',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 修改密码
router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('确认密码不匹配');
    }
    return true;
  })
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

    const { currentPassword, newPassword } = req.body;

    // 获取用户信息
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await User.update(req.user.userId, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 注销登录（客户端删除token即可，这里主要用于日志记录）
router.post('/logout', auth, async (req, res) => {
  try {
    // 可以在这里记录注销日志或执行其他清理操作
    res.json({
      success: true,
      message: '注销成功'
    });
  } catch (error) {
    console.error('注销错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 