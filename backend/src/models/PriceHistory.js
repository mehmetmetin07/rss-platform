const pool = require('../config/database');

class PriceHistory {
  static async findByStockId(stockId, options = {}) {
    const { limit = 100, fromDate, toDate } = options;
    
    let query = `
      SELECT * FROM price_history 
      WHERE stock_id = $1
    `;
    const params = [stockId];
    let paramIndex = 2;

    if (fromDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(toDate);
    }

    query += ' ORDER BY timestamp DESC';

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findBySymbol(symbol, options = {}) {
    const { limit = 100, fromDate, toDate } = options;
    
    let query = `
      SELECT ph.* FROM price_history ph
      JOIN stocks s ON s.id = ph.stock_id
      WHERE s.symbol = $1
    `;
    const params = [symbol];
    let paramIndex = 2;

    if (fromDate) {
      query += ` AND ph.timestamp >= $${paramIndex++}`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND ph.timestamp <= $${paramIndex++}`;
      params.push(toDate);
    }

    query += ' ORDER BY ph.timestamp DESC';

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async create(data) {
    const {
      stock_id,
      timestamp,
      open_price,
      high_price,
      low_price,
      close_price,
      volume
    } = data;

    const result = await pool.query(
      `INSERT INTO price_history (stock_id, timestamp, open_price, high_price, low_price, close_price, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (stock_id, timestamp) DO UPDATE
         SET open_price = EXCLUDED.open_price,
             high_price = EXCLUDED.high_price,
             low_price = EXCLUDED.low_price,
             close_price = EXCLUDED.close_price,
             volume = EXCLUDED.volume
       RETURNING *`,
      [stock_id, timestamp, open_price, high_price, low_price, close_price, volume]
    );
    return result.rows[0];
  }

  static async getLatestPrice(stockId) {
    const result = await pool.query(
      `SELECT * FROM price_history 
       WHERE stock_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [stockId]
    );
    return result.rows[0];
  }

  static async getLatestPrices() {
    const result = await pool.query(`
      SELECT DISTINCT ON (ph.stock_id) 
        ph.*,
        s.symbol,
        s.name,
        s.sector
      FROM price_history ph
      JOIN stocks s ON s.id = ph.stock_id
      WHERE s.is_active = true
      ORDER BY ph.stock_id, ph.timestamp DESC
    `);
    return result.rows;
  }

  static async deleteOlderThan(days) {
    const result = await pool.query(
      `DELETE FROM price_history 
       WHERE timestamp < NOW() - INTERVAL '${days} days'
       RETURNING *`,
      []
    );
    return result.rows.length;
  }
}

module.exports = PriceHistory;
