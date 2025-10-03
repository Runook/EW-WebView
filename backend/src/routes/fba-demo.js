const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth: authenticateToken } = require('../middleware/auth');

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
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    
    if (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。只允许图片和视频文件。'));
    }
  }
});

// 模拟数据存储
let fbaLocations = [
  {
    id: 'ABE2',
    code: 'ABE2',
    name: 'Hazleton Fulfillment Center',
    type: 'FC',
    address: '25 Commerce Point',
    city: 'Hazleton',
    state: 'Pennsylvania',
    zip_code: '18202',
    country: 'US',
    description: 'Amazon FBA配送中心，处理标准尺寸商品',
    is_active: true
  },
  {
    id: 'DFW7',
    code: 'DFW7',
    name: 'Haslet Fulfillment Center',
    type: 'FC',
    address: '1400 Alliance Gateway Fwy',
    city: 'Haslet',
    state: 'Texas',
    zip_code: '76052',
    country: 'US',
    description: 'Amazon FBA配送中心，支持大件商品处理',
    is_active: true
  },
  {
    id: 'LAX9',
    code: 'LAX9',
    name: 'Redlands Fulfillment Center',
    type: 'FC',
    address: '1910 W Lugonia Ave',
    city: 'Redlands',
    state: 'California',
    zip_code: '92374',
    country: 'US',
    description: 'Amazon FBA配送中心，服务西海岸地区',
    is_active: true
  },
  {
    id: 'JFK8',
    code: 'JFK8',
    name: 'Staten Island Fulfillment Center',
    type: 'FC',
    address: '2775 Richmond Ave',
    city: 'Staten Island',
    state: 'New York',
    zip_code: '10314',
    country: 'US',
    description: 'Amazon FBA配送中心，服务东海岸大都市区',
    is_active: true
  }
];

let comments = [
  {
    id: 1,
    fba_location_id: 'ABE2',
    user_id: 1,
    parent_id: null,
    content: '这个仓库处理速度很快，通常在24小时内就能处理完入库。推荐！',
    created_at: '2024-01-15T10:30:00Z',
    is_deleted: false,
    user: {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com'
    },
    mediaFiles: [],
    like_count: 5,
    is_liked: false,
    replies: []
  },
  {
    id: 2,
    fba_location_id: 'ABE2',
    user_id: 2,
    parent_id: null,
    content: '位置很方便，离高速公路很近。不过有时候排队时间比较长。',
    created_at: '2024-01-10T14:20:00Z',
    is_deleted: false,
    user: {
      id: 2,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@example.com'
    },
    mediaFiles: [],
    like_count: 3,
    is_liked: false,
    replies: []
  },
  {
    id: 3,
    fba_location_id: 'ABE2',
    user_id: 3,
    parent_id: 2,
    content: '建议避开周一和周五，这两天最忙。',
    created_at: '2024-01-11T09:15:00Z',
    is_deleted: false,
    user: {
      id: 3,
      first_name: 'Mike',
      last_name: 'Wilson',
      email: 'mike@example.com'
    },
    mediaFiles: [],
    like_count: 2,
    is_liked: false
  }
];

let commentLikes = [];
let nextCommentId = 4;
let nextLikeId = 1;

// 获取所有FBA位置
router.get('/locations', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, state, type } = req.query;
    let filteredLocations = fbaLocations.filter(loc => loc.is_active);

    // 搜索过滤
    if (search) {
      filteredLocations = filteredLocations.filter(loc => 
        loc.code.toLowerCase().includes(search.toLowerCase()) ||
        loc.name.toLowerCase().includes(search.toLowerCase()) ||
        loc.city.toLowerCase().includes(search.toLowerCase()) ||
        loc.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (state) {
      filteredLocations = filteredLocations.filter(loc => loc.state === state);
    }

    if (type) {
      filteredLocations = filteredLocations.filter(loc => loc.type === type);
    }

    // 分页
    const offset = (page - 1) * limit;
    const paginatedLocations = filteredLocations.slice(offset, offset + parseInt(limit));

    // 添加评论统计
    paginatedLocations.forEach(location => {
      const locationComments = comments.filter(c => 
        c.fba_location_id === location.code && !c.is_deleted && !c.parent_id
      );
      location.comment_stats = {
        total_comments: locationComments.length
      };
    });

    res.json({
      success: true,
      data: paginatedLocations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLocations.length,
        pages: Math.ceil(filteredLocations.length / limit)
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
    const location = fbaLocations.find(loc => loc.code === code && loc.is_active);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    // 添加评论统计
    const locationComments = comments.filter(c => 
      c.fba_location_id === code && !c.is_deleted && !c.parent_id
    );
    location.comment_stats = {
      total_comments: locationComments.length
    };

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
    const userId = req.user?.id;

    // 检查位置是否存在
    const location = fbaLocations.find(loc => loc.code === code && loc.is_active);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    // 获取主评论
    let mainComments = comments.filter(c => 
      c.fba_location_id === code && 
      !c.is_deleted && 
      !c.parent_id
    );

    // 排序
    if (sort === 'latest') {
      mainComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      mainComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    // 分页
    const offset = (page - 1) * limit;
    const paginatedComments = mainComments.slice(offset, offset + parseInt(limit));

    // 为每个评论添加回复和点赞信息
    paginatedComments.forEach(comment => {
      // 获取回复
      comment.replies = comments.filter(c => 
        c.parent_id === comment.id && 
        !c.is_deleted
      ).map(reply => ({
        ...reply,
        like_count: commentLikes.filter(l => l.comment_id === reply.id).length,
        is_liked: userId ? commentLikes.some(l => l.comment_id === reply.id && l.user_id === userId) : false
      }));

      // 点赞信息
      comment.like_count = commentLikes.filter(l => l.comment_id === comment.id).length;
      comment.is_liked = userId ? commentLikes.some(l => l.comment_id === comment.id && l.user_id === userId) : false;
    });

    res.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mainComments.length,
        pages: Math.ceil(mainComments.length / limit)
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

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    // 检查位置是否存在
    const location = fbaLocations.find(loc => loc.code === code && loc.is_active);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'FBA位置不存在'
      });
    }

    // 如果是回复，检查父评论
    if (parent_id) {
      const parentComment = comments.find(c => 
        c.id === parseInt(parent_id) && 
        c.fba_location_id === code && 
        !c.is_deleted
      );
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
    }

    // 创建新评论
    const newComment = {
      id: nextCommentId++,
      fba_location_id: code,
      user_id: userId,
      parent_id: parent_id ? parseInt(parent_id) : null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      user: {
        id: userId,
        first_name: req.user.first_name || 'User',
        last_name: req.user.last_name || '',
        email: req.user.email
      },
      mediaFiles: [],
      like_count: 0,
      is_liked: false
    };

    // 处理上传的媒体文件
    if (req.files && req.files.length > 0) {
      newComment.mediaFiles = req.files.map(file => ({
        file_type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        file_name: file.originalname,
        file_url: `/uploads/fba-comments/${file.filename}`,
        file_size: file.size,
        mime_type: file.mimetype
      }));
    }

    if (!parent_id) {
      newComment.replies = [];
    }

    comments.push(newComment);

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: newComment
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

    const comment = comments.find(c => c.id === parseInt(commentId) && !c.is_deleted);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const existingLike = commentLikes.find(l => 
      l.comment_id === parseInt(commentId) && l.user_id === userId
    );

    if (existingLike) {
      // 取消点赞
      const index = commentLikes.findIndex(l => l.id === existingLike.id);
      commentLikes.splice(index, 1);

      const likeCount = commentLikes.filter(l => l.comment_id === parseInt(commentId)).length;
      
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
      commentLikes.push({
        id: nextLikeId++,
        comment_id: parseInt(commentId),
        user_id: userId,
        created_at: new Date().toISOString()
      });

      const likeCount = commentLikes.filter(l => l.comment_id === parseInt(commentId)).length;
      
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

// 删除评论
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = comments.find(c => 
      c.id === parseInt(commentId) && 
      c.user_id === userId && 
      !c.is_deleted
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权限删除'
      });
    }

    // 软删除
    comment.is_deleted = true;
    comment.deleted_at = new Date().toISOString();

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

// 获取州列表
router.get('/states', async (req, res) => {
  try {
    const states = [...new Set(fbaLocations.filter(loc => loc.is_active).map(loc => loc.state))].sort();
    res.json({
      success: true,
      data: states
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

// 获取类型列表
router.get('/types', async (req, res) => {
  try {
    const types = [...new Set(fbaLocations.filter(loc => loc.is_active).map(loc => loc.type))].sort();
    res.json({
      success: true,
      data: types
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