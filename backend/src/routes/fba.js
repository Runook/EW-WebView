const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth: authenticateToken } = require('../middleware/auth');
const FBALocation = require('../models/FBALocation');
const FBAComment = require('../models/FBAComment');
const FBACommentLike = require('../models/FBACommentLike');
const FBAMediaFile = require('../models/FBAMediaFile');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/fba-comments');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${randomString}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // 最多5个文件
  },
  fileFilter: (req, file, cb) => {
    // 允许的图片类型
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    // 允许的视频类型
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    
    if (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。只允许图片(jpg, png, gif, webp)和视频(mp4, avi, mov, wmv, webm)文件。'));
    }
  }
});

// 获取所有FBA位置（带分页和搜索）
router.get('/locations', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, state, type } = req.query;
    const offset = (page - 1) * limit;

    let query = FBALocation.query()
      .where('is_active', true)
      .withGraphJoined('comments(active)')
      .modifyGraph('comments', builder => {
        builder.where('is_deleted', false);
      });

    // 搜索条件
    if (search) {
      query = query.where(function() {
        this.where('code', 'ilike', `%${search}%`)
            .orWhere('name', 'ilike', `%${search}%`)
            .orWhere('city', 'ilike', `%${search}%`)
            .orWhere('address', 'ilike', `%${search}%`);
      });
    }

    if (state) {
      query = query.where('state', state);
    }

    if (type) {
      query = query.where('type', type);
    }

    const locations = await query
      .orderBy('code')
      .page(page - 1, parseInt(limit));

    // 为每个位置添加评论统计
    for (let location of locations.results) {
      const stats = await location.getCommentStats();
      location.comment_stats = stats;
    }

    res.json({
      success: true,
      data: locations.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: locations.total,
        pages: Math.ceil(locations.total / limit)
      }
    });
  } catch (error) {
    console.error('获取FBA位置列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取FBA位置列表失败',
      error: error.message
    });
  }
});

// 获取单个FBA位置详情
router.get('/locations/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const location = await FBALocation.query()
      .where('code', code)
      .where('is_active', true)
      .first();

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    // 获取评论统计
    const stats = await location.getCommentStats();
    location.comment_stats = stats;

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('获取FBA位置详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取FBA位置详情失败',
      error: error.message
    });
  }
});

// 获取FBA位置的评论列表
router.get('/locations/:code/comments', async (req, res) => {
  try {
    const { code } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // 先找到FBA位置
    const location = await FBALocation.query()
      .where('code', code)
      .where('is_active', true)
      .first();

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    let query = FBAComment.query()
      .where('fba_location_id', location.id)
      .where('is_deleted', false)
      .where('parent_id', null) // 只获取主评论
      .withGraphJoined('[user(basic), mediaFiles, replies(active).[user(basic), mediaFiles]]')
      .modifyGraph('user', builder => {
        builder.select('id', 'first_name', 'last_name', 'email');
      })
      .modifyGraph('replies', builder => {
        builder.where('is_deleted', false);
      })
      .modifyGraph('replies.user', builder => {
        builder.select('id', 'first_name', 'last_name', 'email');
      });

    // 排序
    if (sort === 'latest') {
      query = query.orderBy('created_at', 'desc');
    } else if (sort === 'oldest') {
      query = query.orderBy('created_at', 'asc');
    }

    const comments = await query.page(page - 1, parseInt(limit));

    // 为每个评论添加点赞信息
    const userId = req.user?.id;
    for (let comment of comments.results) {
      comment.like_count = await comment.getLikeCount();
      comment.is_liked = userId ? await comment.isLikedByUser(userId) : false;
      
      // 为回复也添加点赞信息
      if (comment.replies) {
        for (let reply of comment.replies) {
          reply.like_count = await reply.getLikeCount();
          reply.is_liked = userId ? await reply.isLikedByUser(userId) : false;
        }
      }
    }

    res.json({
      success: true,
      data: comments.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: comments.total,
        pages: Math.ceil(comments.total / limit)
      }
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败',
      error: error.message
    });
  }
});

// 发表评论
router.post('/locations/:code/comments', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { code } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    // 验证输入
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    // 找到FBA位置
    const location = await FBALocation.query()
      .where('code', code)
      .where('is_active', true)
      .first();

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    // 如果是回复，检查父评论是否存在
    if (parent_id) {
      const parentComment = await FBAComment.query()
        .where('id', parent_id)
        .where('fba_location_id', location.id)
        .where('is_deleted', false)
        .first();

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
    }

    // 创建评论
    const comment = await FBAComment.query().insertAndFetch({
      fba_location_id: location.id,
      user_id: userId,
      parent_id: parent_id || null,
      content: content.trim()
    });

    // 处理上传的媒体文件
    if (req.files && req.files.length > 0) {
      const mediaFiles = [];
      
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const fileUrl = `/uploads/fba-comments/${file.filename}`;
        
        const mediaFile = await FBAMediaFile.query().insertAndFetch({
          comment_id: comment.id,
          file_type: fileType,
          file_name: file.originalname,
          file_path: file.path,
          file_url: fileUrl,
          file_size: file.size,
          mime_type: file.mimetype
        });
        
        mediaFiles.push(mediaFile);
      }
      
      comment.media_files = mediaFiles;
    }

    // 获取完整的评论信息
    const fullComment = await FBAComment.query()
      .where('id', comment.id)
      .withGraphJoined('[user(basic), mediaFiles]')
      .modifyGraph('user', builder => {
        builder.select('id', 'first_name', 'last_name', 'email');
      })
      .first();

    // 添加点赞信息
    fullComment.like_count = await fullComment.getLikeCount();
    fullComment.is_liked = false;

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: fullComment
    });
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({
      success: false,
      message: '发表评论失败',
      error: error.message
    });
  }
});

// 点赞/取消点赞评论
router.post('/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 检查评论是否存在
    const comment = await FBAComment.query()
      .where('id', commentId)
      .where('is_deleted', false)
      .first();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查是否已经点赞
    const existingLike = await FBACommentLike.query()
      .where('comment_id', commentId)
      .where('user_id', userId)
      .first();

    if (existingLike) {
      // 取消点赞
      await FBACommentLike.query()
        .where('comment_id', commentId)
        .where('user_id', userId)
        .delete();

      const likeCount = await comment.getLikeCount();
      
      res.json({
        success: true,
        message: '取消点赞成功',
        data: {
          is_liked: false,
          like_count: likeCount
        }
      });
    } else {
      // 添加点赞
      await FBACommentLike.query().insert({
        comment_id: commentId,
        user_id: userId
      });

      const likeCount = await comment.getLikeCount();
      
      res.json({
        success: true,
        message: '点赞成功',
        data: {
          is_liked: true,
          like_count: likeCount
        }
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败',
      error: error.message
    });
  }
});

// 删除评论（软删除）
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 检查评论是否存在且属于当前用户
    const comment = await FBAComment.query()
      .where('id', commentId)
      .where('user_id', userId)
      .where('is_deleted', false)
      .first();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权限删除'
      });
    }

    // 软删除评论
    await comment.softDelete();

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败',
      error: error.message
    });
  }
});

// 获取FBA位置的州列表
router.get('/states', async (req, res) => {
  try {
    const states = await FBALocation.query()
      .where('is_active', true)
      .whereNotNull('state')
      .distinct('state')
      .orderBy('state');

    res.json({
      success: true,
      data: states.map(row => row.state)
    });
  } catch (error) {
    console.error('获取州列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取州列表失败',
      error: error.message
    });
  }
});

// 获取FBA位置的类型列表
router.get('/types', async (req, res) => {
  try {
    const types = await FBALocation.query()
      .where('is_active', true)
      .whereNotNull('type')
      .distinct('type')
      .orderBy('type');

    res.json({
      success: true,
      data: types.map(row => row.type)
    });
  } catch (error) {
    console.error('获取类型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取类型列表失败',
      error: error.message
    });
  }
});

module.exports = router;