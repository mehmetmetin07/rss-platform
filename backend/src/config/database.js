const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL bağlantısı başarılı');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL hatası:', err);
  process.exit(-1);
});

module.exports = pool;
