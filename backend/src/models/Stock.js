const db = require('../config/database');

class Stock {
  static findAll() {
    return db.prepare('SELECT * FROM stocks WHERE is_active = 1 ORDER BY symbol').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM stocks WHERE id = ?').get(id);
  }

  static findBySymbol(symbol) {
    return db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol.toUpperCase());
  }

  static findBySector(sector) {
    return db.prepare('SELECT * FROM stocks WHERE sector = ? AND is_active = 1').all(sector);
  }

  static create({ symbol, name, sector, exchange, currency }) {
    const existing = this.findBySymbol(symbol);
    if (existing) return existing;

    const result = db.prepare(`
      INSERT INTO stocks (symbol, name, sector, exchange, currency) VALUES (?, ?, ?, ?, ?)
    `).run(symbol.toUpperCase(), name, sector || 'Unknown', exchange || 'NASDAQ', currency || 'USD');

    return this.findById(result.lastInsertRowid);
  }

  static updatePrice(id, price, changePercent, currency) {
    if (currency) {
      db.prepare(`
        UPDATE stocks SET current_price = ?, change_percent = ?, currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(price, changePercent, currency, id);
    } else {
      db.prepare(`
        UPDATE stocks SET current_price = ?, change_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(price, changePercent, id);
    }
  }
}

module.exports = Stock;
