-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RSS Sources Table
CREATE TABLE IF NOT EXISTS rss_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP,
    health_status VARCHAR(50) DEFAULT 'unknown',
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(1000) NOT NULL,
    content TEXT,
    summary TEXT,
    url VARCHAR(1000) UNIQUE NOT NULL,
    source_id INTEGER REFERENCES rss_sources(id),
    publish_date TIMESTAMP NOT NULL,
    sentiment_score DECIMAL(5,2),
    sentiment_category VARCHAR(50),
    key_phrases TEXT[],
    related_stocks TEXT[],
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of INTEGER REFERENCES news(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stocks Table
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    market_cap DECIMAL(18,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id),
    timestamp TIMESTAMP NOT NULL,
    open_price DECIMAL(12,4),
    high_price DECIMAL(12,4),
    low_price DECIMAL(12,4),
    close_price DECIMAL(12,4),
    volume BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, timestamp)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_publish_date ON news(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news(source_id);
CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_news_stocks ON news USING GIN(related_stocks);
CREATE INDEX IF NOT EXISTS idx_price_history_stock ON price_history(stock_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);

-- Insert default RSS sources
INSERT INTO rss_sources (name, url, category) VALUES
('Bloomberg HT', 'https://www.bloomberght.com/rss', 'Genel Ekonomi'),
('Investing.com TR', 'https://tr.investing.com/rss/news.rss', 'Global & Türkiye'),
('Para Analiz', 'https://www.paraanaliz.com/feed/', 'Finans'),
('Dünya Gazetesi', 'https://www.dunya.com/rss', 'Ekonomi'),
('Borsa Gündem', 'https://www.borsagundem.com/feed', 'Borsa'),
('Hisse Senet', 'https://www.hissesenet.com/feed/', 'Hisse Haberleri'),
('Mynet Finans', 'https://finans.mynet.com/rss/haber', 'Finans'),
('Ekonomim', 'https://www.ekonomim.com/rss', 'Ekonomi'),
('BigPara', 'https://bigpara.hurriyet.com.tr/rss/', 'Finans'),
('Hürriyet Ekonomi', 'https://www.hurriyet.com.tr/rss/ekonomi', 'Ekonomi'),
('KAP API', 'https://www.kap.org.tr/tr/api', 'Resmi Açıklamalar'),
('Foreks', 'https://www.foreks.com/rss', 'Borsa Verileri')
ON CONFLICT DO NOTHING;

-- Insert some default stocks
INSERT INTO stocks (symbol, name, sector) VALUES
('THYAO', 'Türk Hava Yolları', 'Ulaşım'),
('GARAN', 'Garanti BBVA', 'Bankacılık'),
('ISCTR', 'İş Bankası', 'Bankacılık'),
('AKBNK', 'Akbank', 'Bankacılık'),
('SASA', 'Sasa Polyester', 'Kimya'),
('EREGL', 'Ereğli Demir Çelik', 'Sanayi'),
('TUPRS', 'Tüpraş', 'Enerji'),
('KCHOL', 'Koç Holding', 'Holding'),
('ASELS', 'Aselsan', 'Teknoloji'),
('TCELL', 'Türkcell', 'Telekomünikasyon')
ON CONFLICT DO NOTHING;
