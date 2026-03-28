const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadToS3 } = require('../utils/s3Upload');
const { auth } = require('../middleware/auth');
const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

router.post('/single', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const { url } = await uploadToS3(req.file, 'images');

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        url,
        filename: path.basename(url),
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '图片上传失败' });
  }
});

router.post('/multiple', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const results = await Promise.all(req.files.map(async (file) => {
      const { url } = await uploadToS3(file, 'images');
      return {
        url,
        filename: path.basename(url),
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    }));

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 张图片`,
      data: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '图片上传失败' });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件太大，最大允许10MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: '文件数量超过限制' });
    }
  }

  res.status(500).json({ success: false, message: error.message || '上传失败' });
});

module.exports = router;
