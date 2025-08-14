const { Model } = require('objection');

class FBACommentLike extends Model {
  static get tableName() {
    return 'fba_comment_likes';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['comment_id', 'user_id'],
      properties: {
        id: { type: 'integer' },
        comment_id: { type: 'integer' },
        user_id: { type: 'integer' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const FBAComment = require('./FBAComment');
    
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'fba_comment_likes.user_id',
          to: 'users.id'
        }
      },
      
      comment: {
        relation: Model.BelongsToOneRelation,
        modelClass: FBAComment,
        join: {
          from: 'fba_comment_likes.comment_id',
          to: 'fba_comments.id'
        }
      }
    };
  }
}

module.exports = FBACommentLike;