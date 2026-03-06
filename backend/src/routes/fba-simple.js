const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    auth(req, res, (err) => {
      if (err) req.user = null;
      next();
    });
  } else {
    req.user = null;
    next();
  }
};

// Load FBA location data from JSON (was 14,478 lines of inline data)
const mockLocations = require('../data/fba-mock-locations.json');

const mockComments = [
  {
    id: 1, fba_location_id: 'ABE2', user_id: 1, parent_id: null,
    content: '这个仓库收货速度很快，一般1-2天就能入库。推荐使用他们的预约系统。',
    created_at: '2024-03-15T08:30:00Z', is_deleted: false,
    user: { id: 1, first_name: 'John', last_name: 'Smith', email: 'john@example.com' },
    mediaFiles: [], like_count: 5, is_liked: false, replies: []
  },
  {
    id: 2, fba_location_id: 'ABE2', user_id: 2, parent_id: null,
    content: '注意这个仓库对箱标要求很严格，一定要按照Amazon的标准贴好标签。',
    created_at: '2024-03-16T10:15:00Z', is_deleted: false,
    user: { id: 2, first_name: 'Sarah', last_name: 'Lee', email: 'sarah@example.com' },
    mediaFiles: [], like_count: 3, is_liked: false, replies: []
  },
  {
    id: 3, fba_location_id: 'ABE2', user_id: 3, parent_id: 1,
    content: '同意！他们的预约系统很方便，直接在Carrier Central上操作就行。',
    created_at: '2024-03-17T14:20:00Z', is_deleted: false,
    user: { id: 3, first_name: 'Mike', last_name: 'Wang', email: 'mike@example.com' },
    mediaFiles: [], like_count: 1, is_liked: false
  }
];

let commentStorage = [...mockComments];
let commentLikes = [];
let nextCommentId = 4;
let nextLikeId = 1;

router.get('/test', (req, res) => {
  res.json({ message: 'FBA API is working!' });
});

router.get('/locations', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: mockLocations,
      pagination: { page: 1, limit: 20, total: mockLocations.length, pages: 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取FBA位置列表失败', error: error.message });
  }
});

router.get('/locations/:code', optionalAuth, (req, res) => {
  try {
    const location = mockLocations.find(loc => loc.code === req.params.code);
    if (!location) {
      return res.status(404).json({ success: false, message: 'FBA位置不存在' });
    }
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取FBA位置详情失败', error: error.message });
  }
});

router.get('/locations/:code/comments', optionalAuth, (req, res) => {
  try {
    const { code } = req.params;
    const location = mockLocations.find(loc => loc.code === code);
    if (!location) {
      return res.status(404).json({ success: false, message: 'FBA位置不存在' });
    }

    const parentComments = commentStorage.filter(c =>
      c.fba_location_id === code && !c.is_deleted && !c.parent_id
    );

    const commentsWithReplies = parentComments.map(parent => {
      const replies = commentStorage.filter(c =>
        c.fba_location_id === code && !c.is_deleted && c.parent_id === parent.id
      );

      const repliesWithLikes = replies.map(reply => {
        const likeCount = commentLikes.filter(l => l.comment_id === reply.id).length;
        const isLiked = req.user ? commentLikes.some(l => l.comment_id === reply.id && l.user_id === req.user.id) : false;
        return { ...reply, like_count: likeCount, is_liked: isLiked };
      });

      const likeCount = commentLikes.filter(l => l.comment_id === parent.id).length;
      const isLiked = req.user ? commentLikes.some(l => l.comment_id === parent.id && l.user_id === req.user.id) : false;
      return { ...parent, like_count: likeCount, is_liked: isLiked, replies: repliesWithLikes };
    });

    res.json({
      success: true,
      data: commentsWithReplies,
      pagination: { page: 1, limit: 10, total: commentsWithReplies.length, pages: 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取评论列表失败', error: error.message });
  }
});

router.post('/locations/:code/comments', upload.array('media', 5), auth, (req, res) => {
  try {
    const { code } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const location = mockLocations.find(loc => loc.code === code);
    if (!location) {
      return res.status(404).json({ success: false, message: 'FBA位置不存在' });
    }

    if (parent_id) {
      const parentComment = commentStorage.find(c =>
        c.id === parseInt(parent_id) && c.fba_location_id === code && !c.is_deleted
      );
      if (!parentComment) {
        return res.status(404).json({ success: false, message: '父评论不存在' });
      }
    }

    const newComment = {
      id: nextCommentId++,
      fba_location_id: code,
      user_id: userId,
      parent_id: parent_id ? parseInt(parent_id) : null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      user: { id: userId, first_name: req.user.first_name, last_name: req.user.last_name, email: req.user.email },
      mediaFiles: [],
      like_count: 0,
      is_liked: false
    };

    if (!parent_id) newComment.replies = [];
    commentStorage.push(newComment);

    res.status(201).json({ success: true, message: '评论发表成功', data: newComment });
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({ success: false, message: '发表评论失败', error: error.message });
  }
});

router.post('/comments/:commentId/like', auth, (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;

    const comment = commentStorage.find(c => c.id === commentId && !c.is_deleted);
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    const existingLike = commentLikes.find(l => l.comment_id === commentId && l.user_id === userId);

    if (existingLike) {
      commentLikes.splice(commentLikes.findIndex(l => l.id === existingLike.id), 1);
      const likeCount = commentLikes.filter(l => l.comment_id === commentId).length;
      res.json({ success: true, message: '取消点赞成功', data: { is_liked: false, like_count: likeCount } });
    } else {
      commentLikes.push({ id: nextLikeId++, comment_id: commentId, user_id: userId, created_at: new Date().toISOString() });
      const likeCount = commentLikes.filter(l => l.comment_id === commentId).length;
      res.json({ success: true, message: '点赞成功', data: { is_liked: true, like_count: likeCount } });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ success: false, message: '点赞操作失败', error: error.message });
  }
});

router.delete('/comments/:commentId', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const comment = commentStorage.find(c =>
      c.id === parseInt(req.params.commentId) && c.user_id === userId && !c.is_deleted
    );

    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在或无权限删除' });
    }

    comment.is_deleted = true;
    comment.deleted_at = new Date().toISOString();
    res.json({ success: true, message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: '删除评论失败', error: error.message });
  }
});

module.exports = router;
