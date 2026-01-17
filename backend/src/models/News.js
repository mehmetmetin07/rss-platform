const db = require('../config/database');

class News {
  static findAll(filters = {}) {
    let query = `
      SELECT n.*, s.name as source_name, s.category as source_category
      FROM news n
      LEFT JOIN rss_sources s ON n.source_id = s.id
      WHERE n.is_duplicate = 0
    `;
    const params = [];

    if (filters.source_id) {
      query += ' AND n.source_id = ?';
      params.push(filters.source_id);
    }

    if (filters.category) {
      query += ' AND s.category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }

    query += ' ORDER BY n.publish_date DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return db.prepare(query).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT n.*, s.name as source_name, s.category as source_category
      FROM news n
      LEFT JOIN rss_sources s ON n.source_id = s.id
      WHERE n.id = ?
    `).get(id);
  }

  static findByUrl(url) {
    return db.prepare('SELECT * FROM news WHERE url = ?').get(url);
  }

  static create(data) {
    const { title, content, url, source_id, publish_date, summary, sentiment_score, sentiment_category, image_url } = data;

    const existing = this.findByUrl(url);
    if (existing) {
      db.prepare(`
        UPDATE news SET title = ?, content = ?, publish_date = ?, image_url = ? WHERE url = ?
      `).run(title, content, publish_date, image_url || null, url);
      return this.findByUrl(url);
    }

    const result = db.prepare(`
      INSERT INTO news (title, content, url, source_id, publish_date, summary, sentiment_score, sentiment_category, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, content || '', url, source_id, publish_date, summary || '', sentiment_score || 0, sentiment_category || 'neutral', image_url || null);

    return this.findById(result.lastInsertRowid);
  }

  static getStats() {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_news,
        SUM(CASE WHEN sentiment_score > 0 THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment_score < 0 THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN sentiment_score = 0 THEN 1 ELSE 0 END) as neutral
      FROM news WHERE is_duplicate = 0
    `).get();
  }

  static getRecentNews(limit = 10) {
    return db.prepare(`
      SELECT n.*, s.name as source_name
      FROM news n
      LEFT JOIN rss_sources s ON n.source_id = s.id
      WHERE n.is_duplicate = 0
      ORDER BY n.publish_date DESC
      LIMIT ?
    `).all(limit);
  }
}

module.exports = News;
