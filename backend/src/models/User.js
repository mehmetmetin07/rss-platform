const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static create({ email, password_hash, full_name, role = 'user' }) {
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)
    `).run(email, password_hash, full_name, role);
    return this.findById(result.lastInsertRowid);
  }

  static updateLastLogin(id) {
    db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
}

module.exports = User;
