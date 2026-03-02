const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { auth, requireEmployee } = require('../middleware/auth');
const router = express.Router();

// 确保 uploads/pods 目录存在
const podUploadDir = path.join(__dirname, '../../uploads/pods');
if (!fs.existsSync(podUploadDir)) {
  fs.mkdirSync(podUploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, podUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pod-${req.params.orderId}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器 - 允许 PDF、图片和常见文档
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|tiff|tif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMime = /image\/(jpeg|jpg|png|gif|webp|tiff)|application\/(pdf|msword|vnd\.openxmlformats|vnd\.ms-excel)/;
  const mimetype = allowedMime.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传 PDF、图片或文档文件'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: fileFilter
});

/**
 * POST /api/orders/:orderId/pods
 * 上传 POD 文件
 */
router.post('/:orderId/pods', auth, requireEmployee, upload.single('pod'), async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    // 检查订单是否存在
    const order = await db('employee_orders').where('id', orderId).where('is_deleted', false).first();
    if (!order) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 保存到数据库
    const [pod] = await db('order_pods').insert({
      order_id: parseInt(orderId),
      original_filename: req.file.originalname,
      stored_filename: req.file.filename,
      file_path: req.file.path,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user.id
    }).returning('*');

    res.status(201).json({
      success: true,
      message: 'POD 上传成功',
      data: {
        id: pod.id,
        original_filename: pod.original_filename,
        file_size: pod.file_size,
        mime_type: pod.mime_type,
        created_at: pod.created_at
      }
    });
  } catch (error) {
    console.error('POD 上传失败:', error);
    res.status(500).json({ success: false, message: 'POD 上传失败', error: error.message });
  }
});

/**
 * GET /api/orders/:orderId/pods
 * 获取订单的所有 POD 文件列表
 */
router.get('/:orderId/pods', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId } = req.params;

    const pods = await db('order_pods')
      .leftJoin('users', 'order_pods.uploaded_by', 'users.id')
      .where('order_pods.order_id', orderId)
      .select(
        'order_pods.id',
        'order_pods.original_filename',
        'order_pods.stored_filename',
        'order_pods.mime_type',
        'order_pods.file_size',
        'order_pods.created_at',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as uploaded_by_name")
      )
      .orderBy('order_pods.created_at', 'desc');

    res.json({ success: true, data: pods });
  } catch (error) {
    console.error('获取 POD 列表失败:', error);
    res.status(500).json({ success: false, message: '获取 POD 列表失败', error: error.message });
  }
});

/**
 * GET /api/orders/:orderId/pods/:podId/download
 * 下载 POD 文件
 */
router.get('/:orderId/pods/:podId/download', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId, podId } = req.params;

    const pod = await db('order_pods')
      .where('id', podId)
      .where('order_id', orderId)
      .first();

    if (!pod) {
      return res.status(404).json({ success: false, message: 'POD 文件不存在' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(pod.file_path)) {
      return res.status(404).json({ success: false, message: 'POD 文件已被删除' });
    }

    res.download(pod.file_path, pod.original_filename);
  } catch (error) {
    console.error('下载 POD 失败:', error);
    res.status(500).json({ success: false, message: '下载 POD 失败', error: error.message });
  }
});

/**
 * DELETE /api/orders/:orderId/pods/:podId
 * 删除 POD 文件
 */
router.delete('/:orderId/pods/:podId', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId, podId } = req.params;

    const pod = await db('order_pods')
      .where('id', podId)
      .where('order_id', orderId)
      .first();

    if (!pod) {
      return res.status(404).json({ success: false, message: 'POD 文件不存在' });
    }

    // 删除物理文件
    if (fs.existsSync(pod.file_path)) {
      fs.unlinkSync(pod.file_path);
    }

    // 删除数据库记录
    await db('order_pods').where('id', podId).delete();

    res.json({ success: true, message: 'POD 文件已删除' });
  } catch (error) {
    console.error('删除 POD 失败:', error);
    res.status(500).json({ success: false, message: '删除 POD 失败', error: error.message });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件太大，最大允许 20MB' });
    }
  }
  res.status(500).json({ success: false, message: error.message || '上传失败' });
});

module.exports = router;
