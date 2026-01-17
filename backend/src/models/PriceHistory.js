const db = require('../config/database');

class PriceHistory {
  static findByStockId(stockId, limit = 100) {
    return db.prepare(`
      SELECT * FROM price_history WHERE stock_id = ? ORDER BY recorded_at DESC LIMIT ?
    `).all(stockId, limit);
  }

  static findBySymbol(symbol, options = {}) {
    const limit = options.limit || 100;
    return db.prepare(`
      SELECT ph.*, s.symbol, s.name
      FROM price_history ph
      JOIN stocks s ON s.id = ph.stock_id
      WHERE s.symbol = ?
      ORDER BY ph.recorded_at DESC
      LIMIT ?
    `).all(symbol.toUpperCase(), limit);
  }

  static create(data) {
    const { stock_id, price, open_price, high_price, low_price, volume } = data;
    const result = db.prepare(`
      INSERT INTO price_history (stock_id, price, open_price, high_price, low_price, volume)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(stock_id, price, open_price, high_price, low_price, volume);
    return { id: result.lastInsertRowid };
  }

  static getLatestPrice(stockId) {
    return db.prepare(`
      SELECT * FROM price_history WHERE stock_id = ? ORDER BY recorded_at DESC LIMIT 1
    `).get(stockId);
  }

  static getLatestPrices() {
    return db.prepare(`
      SELECT ph.*, s.symbol, s.name, s.sector
      FROM price_history ph
      JOIN stocks s ON s.id = ph.stock_id
      WHERE ph.id IN (
        SELECT MAX(id) FROM price_history GROUP BY stock_id
      )
      ORDER BY s.symbol
    `).all();
  }
}

module.exports = PriceHistory;
