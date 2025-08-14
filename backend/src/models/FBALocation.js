const { Model } = require('objection');

class FBALocation extends Model {
  static get tableName() {
    return 'fba_locations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code'],
      properties: {
        id: { type: 'integer' },
        code: { type: 'string', maxLength: 20 },
        name: { type: ['string', 'null'], maxLength: 255 },
        type: { type: ['string', 'null'], maxLength: 50 },
        address: { type: ['string', 'null'], maxLength: 500 },
        city: { type: ['string', 'null'], maxLength: 100 },
        state: { type: ['string', 'null'], maxLength: 50 },
        zip_code: { type: ['string', 'null'], maxLength: 20 },
        country: { type: 'string', maxLength: 50, default: 'US' },
        latitude: { type: ['number', 'null'] },
        longitude: { type: ['number', 'null'] },
        description: { type: ['string', 'null'] },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const FBAComment = require('./FBAComment');
    
    return {
      comments: {
        relation: Model.HasManyRelation,
        modelClass: FBAComment,
        join: {
          from: 'fba_locations.id',
          to: 'fba_comments.fba_location_id'
        }
      }
    };
  }

  // 获取评论统计
  async getCommentStats() {
    const FBAComment = require('./FBAComment');
    const stats = await FBAComment.query()
      .where('fba_location_id', this.id)
      .where('is_deleted', false)
      .groupBy('fba_location_id')
      .count('* as total_comments')
      .first();

    return {
      total_comments: stats ? parseInt(stats.total_comments) : 0
    };
  }
}

module.exports = FBALocation;