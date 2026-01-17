const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'rss-platform.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rss_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_fetched DATETIME,
    health_status TEXT DEFAULT 'unknown',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    url TEXT UNIQUE,
    image_url TEXT,
    source_id INTEGER,
    publish_date DATETIME,
    sentiment_score REAL DEFAULT 0,
    sentiment_category TEXT DEFAULT 'neutral',
    is_duplicate INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES rss_sources(id)
  );

  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    exchange TEXT DEFAULT 'NASDAQ',
    current_price REAL,
    change_percent REAL,
    currency TEXT DEFAULT 'USD',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_id INTEGER NOT NULL,
    price REAL NOT NULL,
    open_price REAL,
    high_price REAL,
    low_price REAL,
    volume INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
  );

  CREATE INDEX IF NOT EXISTS idx_news_source ON news(source_id);
  CREATE INDEX IF NOT EXISTS idx_news_date ON news(publish_date);
  CREATE INDEX IF NOT EXISTS idx_price_stock ON price_history(stock_id);
`);

// Auto-migration for currency column
try {
  const tableInfo = db.prepare("PRAGMA table_info(stocks)").all();
  const hasCurrency = tableInfo.some(col => col.name === 'currency');
  if (!hasCurrency) {
    db.prepare("ALTER TABLE stocks ADD COLUMN currency TEXT DEFAULT 'USD'").run();
    console.log('✅ Auto-migration: Added currency column to stocks table');
  }
} catch (error) {
  console.error('Migration check failed:', error.message);
}


const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@example.com'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)").run('admin@example.com', hash, 'Admin', 'admin');
  console.log('Default admin created: admin@example.com / admin123');
}

const stockCount = db.prepare("SELECT COUNT(*) as count FROM stocks").get().count;
if (stockCount === 0) {
  const defaultStocks = [
    // Technology
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (A)', sector: 'Technology' },
    { symbol: 'GOOG', name: 'Alphabet Inc. (C)', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Technology' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
    { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Technology' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corp.', sector: 'Technology' },
    { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
    { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology' },
    { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology' },
    { symbol: 'IBM', name: 'IBM', sector: 'Technology' },

    // Consumer Discretionary
    { symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer Discretionary' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary' },
    { symbol: 'MCD', name: 'McDonald\'s', sector: 'Consumer Discretionary' },
    { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'SBUX', name: 'Starbucks', sector: 'Consumer Discretionary' },
    { symbol: 'LOW', name: 'Lowe\'s', sector: 'Consumer Discretionary' },
    { symbol: 'BKNG', name: 'Booking Holdings', sector: 'Consumer Discretionary' },

    // Communication Services
    { symbol: 'NFLX', name: 'Netflix', sector: 'Communication Services' },
    { symbol: 'DIS', name: 'Walt Disney', sector: 'Communication Services' },
    { symbol: 'CMCSA', name: 'Comcast', sector: 'Communication Services' },
    { symbol: 'TMUS', name: 'T-Mobile US', sector: 'Communication Services' },
    { symbol: 'VZ', name: 'Verizon', sector: 'Communication Services' },
    { symbol: 'T', name: 'AT&T', sector: 'Communication Services' },

    // Financials
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
    { symbol: 'MA', name: 'Mastercard', sector: 'Financials' },
    { symbol: 'BAC', name: 'Bank of America', sector: 'Financials' },
    { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financials' },
    { symbol: 'C', name: 'Citigroup', sector: 'Financials' },
    { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
    { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials' },
    { symbol: 'BLK', name: 'BlackRock', sector: 'Financials' },
    { symbol: 'AXP', name: 'American Express', sector: 'Financials' },

    // Healthcare
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare' },
    { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare' },
    { symbol: 'ABBV', name: 'AbbVie', sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
    { symbol: 'TMO', name: 'Thermo Fisher', sector: 'Healthcare' },
    { symbol: 'ABT', name: 'Abbott Labs', sector: 'Healthcare' },
    { symbol: 'DHR', name: 'Danaher', sector: 'Healthcare' },
    { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare' },
    { symbol: 'AMGN', name: 'Amgen', sector: 'Healthcare' },
    { symbol: 'CVS', name: 'CVS Health', sector: 'Healthcare' },

    // Consumer Staples
    { symbol: 'WMT', name: 'Walmart', sector: 'Consumer Staples' },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
    { symbol: 'COST', name: 'Costco', sector: 'Consumer Staples' },
    { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples' },
    { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer Staples' },
    { symbol: 'PM', name: 'Philip Morris', sector: 'Consumer Staples' },
    { symbol: 'MDLZ', name: 'Mondelez', sector: 'Consumer Staples' },

    // Energy
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
    { symbol: 'CVX', name: 'Chevron', sector: 'Energy' },
    { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
    { symbol: 'SLB', name: 'Schlumberger', sector: 'Energy' },

    // Industrials
    { symbol: 'GE', name: 'General Electric', sector: 'Industrials' },
    { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrials' },
    { symbol: 'UNP', name: 'Union Pacific', sector: 'Industrials' },
    { symbol: 'HON', name: 'Honeywell', sector: 'Industrials' },
    { symbol: 'UPS', name: 'UPS', sector: 'Industrials' },
    { symbol: 'BA', name: 'Boeing', sector: 'Industrials' },
    { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Industrials' },
    { symbol: 'RTX', name: 'Raytheon Tech', sector: 'Industrials' }
  ];
  const stmt = db.prepare("INSERT INTO stocks (symbol, name, sector) VALUES (?, ?, ?)");
  defaultStocks.forEach(s => stmt.run(s.symbol, s.name, s.sector));
  console.log('Default stocks added: ' + defaultStocks.length + ' stocks');
}

const sourceCount = db.prepare("SELECT COUNT(*) as count FROM rss_sources").get().count;
if (sourceCount === 0) {
  const defaultSources = [
    { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'general' },
    { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss', category: 'general' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology' },
    { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/', category: 'business' }
  ];
  const stmt = db.prepare("INSERT INTO rss_sources (name, url, category) VALUES (?, ?, ?)");
  defaultSources.forEach(s => stmt.run(s.name, s.url, s.category));
  console.log('Default RSS sources added');
}

console.log('SQLite database ready:', dbPath);

module.exports = db;
