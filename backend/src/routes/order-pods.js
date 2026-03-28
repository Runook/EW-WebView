const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { auth, requireEmployee } = require('../middleware/auth');
const { uploadToS3, deleteFromS3, getS3Stream, isS3Url } = require('../utils/s3Upload');
const router = express.Router();

const storage = multer.memoryStorage();

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
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

router.post('/:orderId/pods', auth, requireEmployee, upload.single('pod'), async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const order = await db('employee_orders').where('id', orderId).where('is_deleted', false).first();
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const { url } = await uploadToS3(req.file, `pods/${orderId}`);

    const [pod] = await db('order_pods').insert({
      order_id: parseInt(orderId),
      original_filename: req.file.originalname,
      stored_filename: path.basename(url),
      file_path: url,
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

router.get('/:orderId/pods/:podId/download', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId, podId } = req.params;

    const pod = await db('order_pods').where('id', podId).where('order_id', orderId).first();
    if (!pod) return res.status(404).json({ success: false, message: 'POD 文件不存在' });

    if (isS3Url(pod.file_path)) {
      const s3Response = await getS3Stream(pod.file_path);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(pod.original_filename)}"`);
      res.setHeader('Content-Type', pod.mime_type || 'application/octet-stream');
      s3Response.Body.pipe(res);
    } else {
      if (!fs.existsSync(pod.file_path)) return res.status(404).json({ success: false, message: 'POD 文件已被删除' });
      res.download(pod.file_path, pod.original_filename);
    }
  } catch (error) {
    console.error('下载 POD 失败:', error);
    res.status(500).json({ success: false, message: '下载 POD 失败', error: error.message });
  }
});

router.delete('/:orderId/pods/:podId', auth, requireEmployee, async (req, res) => {
  try {
    const { orderId, podId } = req.params;

    const pod = await db('order_pods').where('id', podId).where('order_id', orderId).first();
    if (!pod) return res.status(404).json({ success: false, message: 'POD 文件不存在' });

    if (isS3Url(pod.file_path)) {
      await deleteFromS3(pod.file_path);
    } else if (fs.existsSync(pod.file_path)) {
      fs.unlinkSync(pod.file_path);
    }
    await db('order_pods').where('id', podId).delete();
    res.json({ success: true, message: 'POD 文件已删除' });
  } catch (error) {
    console.error('删除 POD 失败:', error);
    res.status(500).json({ success: false, message: '删除 POD 失败', error: error.message });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件太大，最大允许 20MB' });
    }
  }
  res.status(500).json({ success: false, message: error.message || '上传失败' });
});

module.exports = router;
