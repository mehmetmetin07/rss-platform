const pool = require('../config/database');

class News {
  static async findAll(filters = {}) {
    let query = `
      SELECT n.*, s.name as source_name, s.category as source_category
      FROM news n
      LEFT JOIN rss_sources s ON n.source_id = s.id
      WHERE n.is_duplicate = false
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.source_id) {
      query += ` AND n.source_id = $${paramIndex++}`;
      params.push(filters.source_id);
    }

    if (filters.category) {
      query += ` AND s.category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.sentiment_category) {
      query += ` AND n.sentiment_category = $${paramIndex++}`;
      params.push(filters.sentiment_category);
    }

    if (filters.stock) {
      query += ` AND $${paramIndex++} = ANY(n.related_stocks)`;
      params.push(filters.stock);
    }

    if (filters.search) {
      query += ` AND (n.title ILIKE $${paramIndex++} OR n.content ILIKE $${paramIndex++})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY n.publish_date DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT n.*, s.name as source_name, s.category as source_category
       FROM news n
       LEFT JOIN rss_sources s ON n.source_id = s.id
       WHERE n.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUrl(url) {
    const result = await pool.query(
      'SELECT * FROM news WHERE url = $1',
      [url]
    );
    return result.rows[0];
  }

  static async create(data) {
    const {
      title,
      content,
      url,
      source_id,
      publish_date,
      summary,
      sentiment_score,
      sentiment_category,
      key_phrases,
      related_stocks
    } = data;

    const result = await pool.query(
      `INSERT INTO news (title, content, url, source_id, publish_date, 
                        summary, sentiment_score, sentiment_category, key_phrases, related_stocks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (url) DO UPDATE
         SET title = EXCLUDED.title,
             content = EXCLUDED.content,
             publish_date = EXCLUDED.publish_date,
             updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [title, content, url, source_id, publish_date, summary,
       sentiment_score, sentiment_category, key_phrases, related_stocks]
    );
    return result.rows[0];
  }

  static async markAsDuplicate(newsId, originalNewsId) {
    await pool.query(
      `UPDATE news 
       SET is_duplicate = true, 
           duplicate_of = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [originalNewsId, newsId]
    );
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_news,
        COUNT(CASE WHEN sentiment_score > 0 THEN 1 END) as positive,
        COUNT(CASE WHEN sentiment_score < 0 THEN 1 END) as negative,
        COUNT(CASE WHEN sentiment_score = 0 THEN 1 END) as neutral
      FROM news 
      WHERE is_duplicate = false
    `);
    return result.rows[0];
  }

  static async getRecentNews(limit = 10) {
    const result = await pool.query(
      `SELECT n.*, s.name as source_name
       FROM news n
       LEFT JOIN rss_sources s ON n.source_id = s.id
       WHERE n.is_duplicate = false
       ORDER BY n.publish_date DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = News;
