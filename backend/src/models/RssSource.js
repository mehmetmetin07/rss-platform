const pool = require('../config/database');

class RssSource {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM rss_sources WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM rss_sources WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create({ name, url, category }) {
    const result = await pool.query(
      `INSERT INTO rss_sources (name, url, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, url, category]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, url, category, is_active } = data;
    const result = await pool.query(
      `UPDATE rss_sources 
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           category = COALESCE($3, category),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, url, category, is_active, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM rss_sources WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async updateHealthStatus(id, status, uptime) {
    await pool.query(
      `UPDATE rss_sources 
       SET health_status = $1,
           uptime_percentage = $2,
           last_updated = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, uptime, id]
    );
  }
}

module.exports = RssSource;
