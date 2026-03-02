const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth, optionalAuth, requireEmployee } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/cache');
const { deleteCachePattern } = require('../config/redis');

// ============================
// 辅助函数
// ============================

// 生成 slug
const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
};

// 作者信息查询片段
const authorSelect = db.raw(`json_build_object(
  'id', u.id,
  'name', CONCAT(u.first_name, ' ', u.last_name),
  'email', u.email,
  'company_name', u.company_name,
  'user_type', u.user_type,
  'avatar_url', up.avatar_url,
  'bio', up.bio,
  'article_count', COALESCE(up.article_count, 0)
) as author`);

// ============================
// 公开接口（无需登录）
// ============================

/**
 * GET /api/articles
 * 获取文章列表（公开）
 */
router.get('/', cacheResponse(120, 'articles'), optionalAuth, async (req, res) => {
  try {
    const {
      category, tag, search, tab = 'latest',
      page = 1, limit = 20, author_id
    } = req.query;

    let query = db('articles as a')
      .leftJoin('users as u', 'a.author_id', 'u.id')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where('a.status', 'published')
      .select(
        'a.id', 'a.slug', 'a.title', 'a.summary', 'a.cover_image',
        'a.category', 'a.tags', 'a.view_count', 'a.like_count',
        'a.comment_count', 'a.share_count', 'a.is_pinned', 'a.is_featured',
        'a.published_at', 'a.created_at',
        authorSelect
      );

    // 如果登录了，查询是否已点赞/收藏
    if (req.user) {
      query = query
        .select(
          db.raw(`EXISTS(SELECT 1 FROM article_likes WHERE article_id = a.id AND user_id = ?) as is_liked`, [req.user.id]),
          db.raw(`EXISTS(SELECT 1 FROM article_bookmarks WHERE article_id = a.id AND user_id = ?) as is_bookmarked`, [req.user.id])
        );
    }

    if (category && category !== 'all') query = query.where('a.category', category);
    if (author_id) query = query.where('a.author_id', author_id);
    if (tag) query = query.whereRaw('? = ANY(a.tags)', [tag]);
    if (search) {
      query = query.where(function() {
        this.where('a.title', 'ilike', `%${search}%`)
          .orWhere('a.summary', 'ilike', `%${search}%`)
          .orWhere('a.content', 'ilike', `%${search}%`)
          .orWhereRaw(`EXISTS (SELECT 1 FROM unnest(a.tags) t WHERE t ILIKE ?)`, [`%${search}%`]);
      });
    }

    // 排序
    if (tab === 'hot') {
      query = query.orderByRaw('a.is_pinned DESC, (a.like_count * 3 + a.comment_count * 5 + a.view_count) DESC');
    } else {
      query = query.orderByRaw('a.is_pinned DESC, a.published_at DESC NULLS LAST');
    }

    // 总数
    const countQuery = db('articles as a').where('a.status', 'published');
    if (category && category !== 'all') countQuery.where('a.category', category);
    if (search) countQuery.where(function() {
      this.where('a.title', 'ilike', `%${search}%`).orWhere('a.summary', 'ilike', `%${search}%`);
    });
    const [{ count }] = await countQuery.count('* as count');

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const articles = await query.limit(parseInt(limit)).offset(offset);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ success: false, message: '获取文章列表失败', error: error.message });
  }
});

/**
 * GET /api/articles/categories
 * 获取分类统计
 */
router.get('/categories', cacheResponse(600, 'articles-cat'), async (req, res) => {
  try {
    const stats = await db('articles')
      .where('status', 'published')
      .groupBy('category')
      .select('category', db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc');

    const total = await db('articles').where('status', 'published').count('* as count').first();

    res.json({
      success: true,
      data: { categories: stats, total: parseInt(total.count) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取分类统计失败' });
  }
});

/**
 * GET /api/articles/hot-tags
 * 获取热门标签
 */
router.get('/hot-tags', cacheResponse(600, 'articles-tags'), async (req, res) => {
  try {
    const tags = await db.raw(`
      SELECT tag, COUNT(*) as count
      FROM articles, unnest(tags) as tag
      WHERE status = 'published'
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `);
    res.json({ success: true, data: tags.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取热门标签失败' });
  }
});

// ============================
// 用户资料接口（必须在 /:slug 之前）
// ============================

/**
 * GET /api/articles/profile/me
 * 获取自己的完整资料
 */
router.get('/profile/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db('users as u')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where('u.id', userId)
      .select(
        'u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.phone',
        'u.company_name', 'u.user_type', 'u.city', 'u.state',
        'u.is_verified', 'u.employee_role', 'u.employee_id', 'u.created_at as member_since',
        'up.avatar_url', 'up.bio', 'up.location', 'up.website', 'up.wechat',
        'up.specialties', 'up.article_count', 'up.comment_count',
        'up.like_received', 'up.follower_count', 'up.following_count'
      )
      .first();

    const recentArticles = await db('articles')
      .where('author_id', userId)
      .whereNot('status', 'archived')
      .select('id', 'slug', 'title', 'category', 'view_count', 'like_count', 'comment_count', 'published_at', 'status')
      .orderBy('created_at', 'desc')
      .limit(10);

    const bookmarks = await db('article_bookmarks as ab')
      .join('articles as a', 'ab.article_id', 'a.id')
      .where('ab.user_id', userId)
      .select('a.id', 'a.slug', 'a.title', 'a.category', 'a.like_count', 'a.published_at')
      .orderBy('ab.created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: { ...user, recentArticles, bookmarks }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取资料失败', error: error.message });
  }
});

/**
 * PUT /api/articles/profile
 * 更新自己的资料
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url, bio, location, website, wechat, specialties, first_name, last_name, company_name, phone } = req.body;

    const userUpdate = {};
    if (first_name !== undefined) userUpdate.first_name = first_name;
    if (last_name !== undefined) userUpdate.last_name = last_name;
    if (company_name !== undefined) userUpdate.company_name = company_name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0) {
      await db('users').where('id', userId).update(userUpdate);
    }

    const profileData = { updated_at: new Date() };
    if (avatar_url !== undefined) profileData.avatar_url = avatar_url;
    if (bio !== undefined) profileData.bio = bio;
    if (location !== undefined) profileData.location = location;
    if (website !== undefined) profileData.website = website;
    if (wechat !== undefined) profileData.wechat = wechat;
    if (specialties !== undefined) profileData.specialties = specialties;

    const existing = await db('user_profiles').where('user_id', userId).first();
    if (existing) {
      await db('user_profiles').where('user_id', userId).update(profileData);
    } else {
      await db('user_profiles').insert({ user_id: userId, ...profileData });
    }

    res.json({ success: true, message: '资料更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新资料失败', error: error.message });
  }
});

/**
 * GET /api/articles/user/:userId/profile
 * 获取用户公开资料
 */
router.get('/user/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db('users as u')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where('u.id', userId)
      .select(
        'u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.company_name',
        'u.user_type', 'u.city', 'u.state', 'u.created_at as member_since',
        'up.avatar_url', 'up.bio', 'up.location', 'up.website', 'up.wechat',
        'up.specialties', 'up.article_count', 'up.comment_count',
        'up.like_received', 'up.follower_count', 'up.following_count'
      )
      .first();

    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户资料失败' });
  }
});

// ============================

/**
 * GET /api/articles/:slug
 * 获取文章详情（通过 slug，公开）
 */
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    // 支持 slug 或 id
    const isId = /^\d+$/.test(slug);
    let query = db('articles as a')
      .leftJoin('users as u', 'a.author_id', 'u.id')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .select('a.*', authorSelect);

    if (isId) {
      query = query.where('a.id', parseInt(slug));
    } else {
      query = query.where('a.slug', slug);
    }

    const article = await query.first();

    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    // 增加浏览量
    await db('articles').where('id', article.id).increment('view_count', 1);
    article.view_count += 1;

    // 查询是否已点赞/收藏
    if (req.user) {
      const liked = await db('article_likes').where({ article_id: article.id, user_id: req.user.id }).first();
      const bookmarked = await db('article_bookmarks').where({ article_id: article.id, user_id: req.user.id }).first();
      article.is_liked = !!liked;
      article.is_bookmarked = !!bookmarked;
    }

    // 获取评论
    const comments = await db('article_comments as c')
      .leftJoin('users as cu', 'c.user_id', 'cu.id')
      .leftJoin('user_profiles as cup', 'cu.id', 'cup.user_id')
      .where('c.article_id', article.id)
      .where('c.is_deleted', false)
      .select(
        'c.*',
        db.raw(`json_build_object('id', cu.id, 'name', CONCAT(cu.first_name, ' ', cu.last_name), 'avatar_url', cup.avatar_url, 'company_name', cu.company_name) as user_info`)
      )
      .orderBy('c.created_at', 'asc');

    article.comments = comments;

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({ success: false, message: '获取文章详情失败', error: error.message });
  }
});

// ============================
// 需要登录的接口
// ============================

/**
 * POST /api/articles
 * 发布文章（仅员工）
 */
router.post('/', auth, requireEmployee, async (req, res) => {
  try {
    const { title, summary, content, cover_image, category, tags, status, seo_title, seo_description, seo_keywords } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const slug = generateSlug(title);

    const [article] = await db('articles').insert({
      slug,
      title,
      summary: summary || content.substring(0, 200),
      content,
      cover_image: cover_image || null,
      category: category || 'industry-news',
      tags: tags || [],
      author_id: req.user.id,
      status: status || 'published',
      seo_title: seo_title || title,
      seo_description: seo_description || summary || content.substring(0, 160),
      seo_keywords: seo_keywords || tags || [],
      published_at: status === 'draft' ? null : new Date()
    }).returning('*');

    // 更新作者文章数
    await db('user_profiles')
      .where('user_id', req.user.id)
      .increment('article_count', 1)
      .catch(() => {
        // 如果 profile 不存在，创建一个
        return db('user_profiles').insert({
          user_id: req.user.id,
          article_count: 1
        }).onConflict('user_id').merge({ article_count: db.raw('user_profiles.article_count + 1') });
      });

    // 清除文章相关缓存
    await deleteCachePattern('cache:articles*');
    
    res.status(201).json({ success: true, data: article, message: '文章发布成功' });
  } catch (error) {
    console.error('发布文章失败:', error);
    res.status(500).json({ success: false, message: '发布文章失败', error: error.message });
  }
});

/**
 * PUT /api/articles/:id
 * 编辑文章（仅作者或管理员）
 */
router.put('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await db('articles').where('id', id).first();
    if (!article) return res.status(404).json({ success: false, message: '文章不存在' });

    const { title, summary, content, cover_image, category, tags, status, seo_title, seo_description, seo_keywords } = req.body;

    const updateData = { updated_at: new Date() };
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !article.published_at) {
        updateData.published_at = new Date();
      }
    }
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;

    const [updated] = await db('articles').where('id', id).update(updateData).returning('*');

    res.json({ success: true, data: updated, message: '文章更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新文章失败', error: error.message });
  }
});

/**
 * DELETE /api/articles/:id
 * 删除文章
 */
router.delete('/:id', auth, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    await db('articles').where('id', id).update({ status: 'archived' });
    res.json({ success: true, message: '文章已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: error.message });
  }
});

// ============================
// 互动接口
// ============================

/**
 * POST /api/articles/:id/like
 * 点赞/取消点赞
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await db('article_likes').where({ article_id: articleId, user_id: userId }).first();

    if (existing) {
      await db('article_likes').where({ article_id: articleId, user_id: userId }).delete();
      await db('articles').where('id', articleId).decrement('like_count', 1);
      res.json({ success: true, liked: false, message: '已取消点赞' });
    } else {
      await db('article_likes').insert({ article_id: articleId, user_id: userId });
      await db('articles').where('id', articleId).increment('like_count', 1);
      res.json({ success: true, liked: true, message: '已点赞' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

/**
 * POST /api/articles/:id/bookmark
 * 收藏/取消收藏
 */
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await db('article_bookmarks').where({ article_id: articleId, user_id: userId }).first();

    if (existing) {
      await db('article_bookmarks').where({ article_id: articleId, user_id: userId }).delete();
      res.json({ success: true, bookmarked: false, message: '已取消收藏' });
    } else {
      await db('article_bookmarks').insert({ article_id: articleId, user_id: userId });
      res.json({ success: true, bookmarked: true, message: '已收藏' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

/**
 * POST /api/articles/:id/share
 * 记录分享
 */
router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const { platform = 'link' } = req.body;

    await db('article_shares').insert({
      article_id: articleId,
      user_id: req.user?.id || null,
      platform
    });
    await db('articles').where('id', articleId).increment('share_count', 1);

    res.json({ success: true, message: '分享已记录' });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

/**
 * POST /api/articles/:id/comments
 * 发表评论（需要登录）
 */
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const { content, parent_id } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const [comment] = await db('article_comments').insert({
      article_id: articleId,
      user_id: req.user.id,
      parent_id: parent_id || null,
      content: content.trim()
    }).returning('*');

    await db('articles').where('id', articleId).increment('comment_count', 1);

    // 获取评论者信息
    const userInfo = await db('users as u')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where('u.id', req.user.id)
      .select(
        'u.id', db.raw("CONCAT(u.first_name, ' ', u.last_name) as name"),
        'up.avatar_url', 'u.company_name'
      )
      .first();

    res.status(201).json({
      success: true,
      data: { ...comment, user_info: userInfo },
      message: '评论发表成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '发表评论失败', error: error.message });
  }
});

/**
 * DELETE /api/articles/:articleId/comments/:commentId
 * 删除评论
 */
router.delete('/:articleId/comments/:commentId', auth, async (req, res) => {
  try {
    const { articleId, commentId } = req.params;
    const comment = await db('article_comments').where('id', commentId).first();
    if (!comment) return res.status(404).json({ success: false, message: '评论不存在' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ success: false, message: '无权删除' });

    await db('article_comments').where('id', commentId).update({ is_deleted: true });
    await db('articles').where('id', articleId).decrement('comment_count', 1);

    res.json({ success: true, message: '评论已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除评论失败' });
  }
});

/**
 * POST /api/articles/comments/:id/like
 * 评论点赞
 */
router.post('/comments/:id/like', auth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await db('comment_likes').where({ comment_id: commentId, user_id: userId }).first();

    if (existing) {
      await db('comment_likes').where({ comment_id: commentId, user_id: userId }).delete();
      await db('article_comments').where('id', commentId).decrement('like_count', 1);
      res.json({ success: true, liked: false });
    } else {
      await db('comment_likes').insert({ comment_id: commentId, user_id: userId });
      await db('article_comments').where('id', commentId).increment('like_count', 1);
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// ============================
// 用户资料接口
// ============================

module.exports = router;
