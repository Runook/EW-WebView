const path = require('path');
const fs = require('fs');

const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_ENABLED = !!S3_BUCKET;

let s3 = null;
if (S3_ENABLED) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3 = new S3Client({ region: S3_REGION });
}

async function uploadToS3(file, prefix = 'uploads') {
  if (!S3_ENABLED) {
    return uploadToLocal(file, prefix);
  }

  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${prefix}/${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return {
    url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
    key
  };
}

function uploadToLocal(file, prefix) {
  const uploadDir = path.join(__dirname, '../../uploads', prefix);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  const baseUrl = process.env.FRONTEND_URL || 'https://welogx.com';
  return {
    url: `${baseUrl}/api/uploads/${prefix}/${filename}`,
    key: filePath
  };
}

async function deleteFromS3(fileUrl) {
  if (!S3_ENABLED || !isS3Url(fileUrl)) {
    if (!isS3Url(fileUrl)) {
      try { fs.unlinkSync(fileUrl); } catch (_e) { /* ignore */ }
    }
    return;
  }
  try {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
}

async function getS3Stream(fileUrl) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const url = new URL(fileUrl);
  const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  return response;
}

function isS3Url(urlStr) {
  return urlStr && urlStr.includes('.s3.') && urlStr.includes('amazonaws.com');
}

if (S3_ENABLED) {
  console.log(`[Upload] S3 storage enabled → bucket: ${S3_BUCKET}`);
} else {
  console.log('[Upload] S3 not configured, using local disk storage (files may be lost on redeploy)');
}

module.exports = { uploadToS3, deleteFromS3, getS3Stream, isS3Url, S3_ENABLED, S3_BUCKET, S3_REGION };
