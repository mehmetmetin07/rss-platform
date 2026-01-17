const pool = require('../config/database');

class Stock {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE is_active = true ORDER BY symbol'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findBySymbol(symbol) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE symbol = $1',
      [symbol]
    );
    return result.rows[0];
  }

  static async create({ symbol, name, sector, market_cap, description }) {
    const result = await pool.query(
      `INSERT INTO stocks (symbol, name, sector, market_cap, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (symbol) DO UPDATE
         SET name = EXCLUDED.name,
             sector = EXCLUDED.sector,
             market_cap = EXCLUDED.market_cap,
             description = EXCLUDED.description,
             updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [symbol, name, sector, market_cap, description]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, sector, market_cap, description, is_active } = data;
    const result = await pool.query(
      `UPDATE stocks 
       SET name = COALESCE($1, name),
           sector = COALESCE($2, sector),
           market_cap = COALESCE($3, market_cap),
           description = COALESCE($4, description),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, sector, market_cap, description, is_active, id]
    );
    return result.rows[0];
  }

  static async findBySector(sector) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE sector = $1 AND is_active = true ORDER BY symbol',
      [sector]
    );
    return result.rows;
  }
}

module.exports = Stock;
