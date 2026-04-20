const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../config/database');
const { auth, requireEmployee } = require('../middleware/auth');
const { uploadToS3, deleteFromS3, getS3Stream, isS3Url } = require('../utils/s3Upload');
const fs = require('fs');
const router = express.Router();

const VALID_DOC_TYPES = [
  'quote', 'bol', 'rc', 'pod', 'customer_invoice', 'vendor_invoice',
  'driver_id', 'vin_pic', 'coi', 'w9'
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|tiff|tif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error('不支持的文件类型'));
  }
});

router.get('/:orderId/documents', auth, requireEmployee, async (req, res) => {
  try {
    const docs = await db('order_documents')
      .leftJoin('users', 'order_documents.uploaded_by', 'users.id')
      .where('order_documents.order_id', req.params.orderId)
      .select(
        'order_documents.id', 'order_documents.doc_type',
        'order_documents.original_filename', 'order_documents.file_size',
        'order_documents.created_at',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as uploaded_by_name")
      )
      .orderBy('order_documents.created_at', 'desc');

    const grouped = {};
    VALID_DOC_TYPES.forEach(t => { grouped[t] = null; });
    docs.forEach(d => { if (!grouped[d.doc_type]) grouped[d.doc_type] = d; });

    res.json({ success: true, data: { documents: docs, byType: grouped } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取文档失败', error: error.message });
  }
});

router.post('/:orderId/documents', auth, requireEmployee, upload.single('file'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const docType = req.body.doc_type;

    if (!req.file) return res.status(400).json({ success: false, message: '没有上传文件' });
    if (!docType || !VALID_DOC_TYPES.includes(docType)) {
      return res.status(400).json({ success: false, message: `无效的文档类型，允许: ${VALID_DOC_TYPES.join(', ')}` });
    }

    const order = await db('employee_orders').where('id', orderId).where('is_deleted', false).first();
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    const old = await db('order_documents').where({ order_id: parseInt(orderId), doc_type: docType }).first();
    if (old) {
      if (isS3Url(old.file_path)) {
        await deleteFromS3(old.file_path);
      } else if (fs.existsSync(old.file_path)) {
        fs.unlinkSync(old.file_path);
      }
      await db('order_documents').where('id', old.id).delete();
    }

    const { url } = await uploadToS3(req.file, `documents/${orderId}`);

    const [doc] = await db('order_documents').insert({
      order_id: parseInt(orderId),
      doc_type: docType,
      original_filename: req.file.originalname,
      stored_filename: path.basename(url),
      file_path: url,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user.id
    }).returning('*');

    res.status(201).json({ success: true, data: doc, message: '文档上传成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '上传失败', error: error.message });
  }
});

router.get('/:orderId/documents/:docId/download', auth, requireEmployee, async (req, res) => {
  try {
    const doc = await db('order_documents').where('id', req.params.docId).where('order_id', req.params.orderId).first();
    if (!doc) return res.status(404).json({ success: false, message: '文档不存在' });

    if (isS3Url(doc.file_path)) {
      const s3Response = await getS3Stream(doc.file_path);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_filename)}"`);
      res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
      s3Response.Body.pipe(res);
    } else {
      if (!fs.existsSync(doc.file_path)) return res.status(404).json({ success: false, message: '文件已被删除' });
      res.download(doc.file_path, doc.original_filename);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '下载失败', error: error.message });
  }
});

router.delete('/:orderId/documents/:docId', auth, requireEmployee, async (req, res) => {
  try {
    const doc = await db('order_documents').where('id', req.params.docId).where('order_id', req.params.orderId).first();
    if (!doc) return res.status(404).json({ success: false, message: '文档不存在' });

    if (isS3Url(doc.file_path)) {
      await deleteFromS3(doc.file_path);
    } else if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }
    await db('order_documents').where('id', doc.id).delete();
    res.json({ success: true, message: '文档已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: error.message });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: '文件太大，最大20MB' });
  }
  res.status(500).json({ success: false, message: error.message || '操作失败' });
});

module.exports = router;
