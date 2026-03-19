const { db } = require('../config/database');

class DATPost {
  /**
   * Get all DAT posts for a specific employee, optionally filtered by status.
   */
  static async getByEmployee(employeeId, filters = {}) {
    let query = db('dat_posts')
      .where('employee_id', employeeId)
      .orderBy('created_at', 'desc');

    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.post_type) {
      query = query.where('post_type', filters.post_type);
    }

    const posts = await query;
    return posts.map(p => this.format(p));
  }

  /**
   * Get active DAT posts linked to a specific employee order.
   */
  static async getByOrderId(employeeOrderId) {
    const posts = await db('dat_posts')
      .where('employee_order_id', employeeOrderId)
      .where('status', 'active')
      .orderBy('created_at', 'desc');

    return posts.map(p => this.format(p));
  }

  /**
   * Get a single DAT post by its DAT post ID.
   */
  static async getByDATPostId(datPostId) {
    const post = await db('dat_posts')
      .where('dat_post_id', String(datPostId))
      .first();

    return post ? this.format(post) : null;
  }

  /**
   * Get counts of active posts by employee.
   */
  static async getActiveCountByEmployee(employeeId) {
    const [result] = await db('dat_posts')
      .where('employee_id', employeeId)
      .where('status', 'active')
      .count('* as total');

    return parseInt(result.total) || 0;
  }

  /**
   * Get summary statistics for an employee's DAT posts.
   */
  static async getStats(employeeId) {
    const rows = await db('dat_posts')
      .where('employee_id', employeeId)
      .select('status')
      .count('* as count')
      .groupBy('status');

    const stats = { active: 0, refreshed: 0, deleted: 0, matched: 0, total: 0 };
    for (const row of rows) {
      const count = parseInt(row.count) || 0;
      stats[row.status] = count;
      stats.total += count;
    }
    return stats;
  }

  static format(post) {
    let payload = post.dat_payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { payload = null; }
    }

    return {
      id: post.id,
      datPostId: post.dat_post_id,
      postType: post.post_type,
      localPostId: post.local_post_id,
      employeeOrderId: post.employee_order_id,
      employeeId: post.employee_id,
      equipmentType: post.dat_equipment_type,
      payload: payload,
      status: post.status,
      lastRefreshedAt: post.last_refreshed_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }
}

module.exports = DATPost;
