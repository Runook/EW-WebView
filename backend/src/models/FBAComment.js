const { Model } = require('objection');

class FBAComment extends Model {
  static get tableName() {
    return 'fba_comments';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['fba_location_id', 'user_id', 'content'],
      properties: {
        id: { type: 'integer' },
        fba_location_id: { type: 'integer' },
        user_id: { type: 'integer' },
        parent_id: { type: ['integer', 'null'] },
        content: { type: 'string' },
        media_files: { type: ['object', 'null'] },
        is_deleted: { type: 'boolean', default: false },
        deleted_at: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const FBALocation = require('./FBALocation');
    const FBAMediaFile = require('./FBAMediaFile');
    const FBACommentLike = require('./FBACommentLike');
    
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'fba_comments.user_id',
          to: 'users.id'
        }
      },
      
      fbaLocation: {
        relation: Model.BelongsToOneRelation,
        modelClass: FBALocation,
        join: {
          from: 'fba_comments.fba_location_id',
          to: 'fba_locations.id'
        }
      },
      
      parentComment: {
        relation: Model.BelongsToOneRelation,
        modelClass: FBAComment,
        join: {
          from: 'fba_comments.parent_id',
          to: 'fba_comments.id'
        }
      },
      
      replies: {
        relation: Model.HasManyRelation,
        modelClass: FBAComment,
        join: {
          from: 'fba_comments.id',
          to: 'fba_comments.parent_id'
        }
      },
      
      mediaFiles: {
        relation: Model.HasManyRelation,
        modelClass: FBAMediaFile,
        join: {
          from: 'fba_comments.id',
          to: 'fba_media_files.comment_id'
        }
      },
      
      likes: {
        relation: Model.HasManyRelation,
        modelClass: FBACommentLike,
        join: {
          from: 'fba_comments.id',
          to: 'fba_comment_likes.comment_id'
        }
      }
    };
  }

  // 获取点赞数
  async getLikeCount() {
    const FBACommentLike = require('./FBACommentLike');
    const result = await FBACommentLike.query()
      .where('comment_id', this.id)
      .count('* as count')
      .first();
    return parseInt(result.count) || 0;
  }

  // 检查用户是否已点赞
  async isLikedByUser(userId) {
    if (!userId) return false;
    
    const FBACommentLike = require('./FBACommentLike');
    const like = await FBACommentLike.query()
      .where('comment_id', this.id)
      .where('user_id', userId)
      .first();
    return !!like;
  }

  // 获取回复数量
  async getReplyCount() {
    const result = await FBAComment.query()
      .where('parent_id', this.id)
      .where('is_deleted', false)
      .count('* as count')
      .first();
    return parseInt(result.count) || 0;
  }

  // 软删除
  async softDelete() {
    return await this.$query()
      .patch({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      });
  }
}

module.exports = FBAComment;