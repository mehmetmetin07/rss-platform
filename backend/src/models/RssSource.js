const db = require('../config/database');

class RssSource {
  static findAll() {
    return db.prepare('SELECT * FROM rss_sources WHERE is_active = 1 ORDER BY name').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM rss_sources WHERE id = ?').get(id);
  }

  static create({ name, url, category }) {
    const result = db.prepare('INSERT INTO rss_sources (name, url, category) VALUES (?, ?, ?)').run(name, url, category);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const { name, url, category, is_active } = data;
    db.prepare(`
      UPDATE rss_sources 
      SET name = COALESCE(?, name),
          url = COALESCE(?, url),
          category = COALESCE(?, category),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, url, category, is_active, id);
    return this.findById(id);
  }

  static delete(id) {
    const source = this.findById(id);
    db.prepare('DELETE FROM rss_sources WHERE id = ?').run(id);
    return source;
  }

  static updateLastFetched(id, status) {
    db.prepare('UPDATE rss_sources SET last_fetched = CURRENT_TIMESTAMP, health_status = ? WHERE id = ?').run(status, id);
  }
}

module.exports = RssSource;
