const { db } = require('../config/database');

class SourcingChannel {
  static async getAll(includeInactive = false) {
    let query = db('sourcing_channels').orderBy('name', 'asc');
    if (!includeInactive) query = query.where('is_active', true);
    return query;
  }

  static async findById(id) {
    return db('sourcing_channels').where('id', id).first();
  }

  static async create(data) {
    const [row] = await db('sourcing_channels')
      .insert({
        name: data.name,
        description: data.description || null,
        is_active: data.is_active !== false,
      })
      .returning('*');
    return row;
  }

  static async update(id, data) {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.is_active !== undefined) updates.is_active = data.is_active;
    updates.updated_at = new Date();

    const [row] = await db('sourcing_channels')
      .where('id', id)
      .update(updates)
      .returning('*');
    return row;
  }

  static async delete(id) {
    return db('sourcing_channels').where('id', id).del();
  }
}

module.exports = SourcingChannel;
