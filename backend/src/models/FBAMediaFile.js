const { Model } = require('objection');

class FBAMediaFile extends Model {
  static get tableName() {
    return 'fba_media_files';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['comment_id', 'file_type', 'file_name', 'file_path', 'file_url'],
      properties: {
        id: { type: 'integer' },
        comment_id: { type: 'integer' },
        file_type: { type: 'string', enum: ['image', 'video'] },
        file_name: { type: 'string', maxLength: 255 },
        file_path: { type: 'string', maxLength: 500 },
        file_url: { type: 'string', maxLength: 500 },
        file_size: { type: ['integer', 'null'] },
        mime_type: { type: ['string', 'null'], maxLength: 100 },
        width: { type: ['integer', 'null'] },
        height: { type: ['integer', 'null'] },
        duration: { type: ['integer', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const FBAComment = require('./FBAComment');
    
    return {
      comment: {
        relation: Model.BelongsToOneRelation,
        modelClass: FBAComment,
        join: {
          from: 'fba_media_files.comment_id',
          to: 'fba_comments.id'
        }
      }
    };
  }

  // 获取文件完整URL
  getFullUrl() {
    // 如果已经是完整URL，直接返回
    if (this.file_url.startsWith('http')) {
      return this.file_url;
    }
    
    // 否则拼接基础URL
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    return `${baseUrl}${this.file_url}`;
  }

  // 检查是否为图片
  isImage() {
    return this.file_type === 'image';
  }

  // 检查是否为视频
  isVideo() {
    return this.file_type === 'video';
  }

  // 格式化文件大小
  getFormattedSize() {
    if (!this.file_size) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.file_size === 0) return '0 Byte';
    
    const i = Math.floor(Math.log(this.file_size) / Math.log(1024));
    return Math.round(this.file_size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = FBAMediaFile;