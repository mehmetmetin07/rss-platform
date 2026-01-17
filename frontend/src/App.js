import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import api from './services/api';
import StockChart from './components/StockChart';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLanguage } from './contexts/LanguageContext';
import { formatPrice } from './utils/currency';
import './index.css';

function App() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchStats();
    checkAuth();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getNewsStats();
      setStats(data.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="nav">
          <div className="container nav-content">
            <Link to="/" className="nav-brand">RSS & Stock Platform</Link>
            <div className="nav-links">
              <Link to="/news" className="nav-link">{t('news')}</Link>
              <Link to="/stocks" className="nav-link">{t('stocks')}</Link>
              <Link to="/sources" className="nav-link">{t('sources')}</Link>
              {user ? (
                <button onClick={handleLogout} className="btn-secondary">{t('logout')}</button>
              ) : (
                <Link to="/login" className="btn-primary">{t('login')}</Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </nav>

        <main className="container main-content">
          <Routes>
            <Route path="/" element={<HomePage stats={stats} />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/stocks/:symbol" element={<StockDetailPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2026 RSS & Stock Platform. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

function HomePage({ stats }) {
  const [news, setNews] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    api.getRecentNews(5).then(r => setNews(r.data || [])).catch(console.error);
  }, []);

  return (
    <div className="home-page">
      <div className="hero">
        <h1>RSS & Stock Platform</h1>
        <p>{t('heroSubtitle')}</p>
        <div className="hero-actions">
          <Link to="/news" className="btn btn-primary btn-lg">{t('browseNews')}</Link>
          <Link to="/stocks" className="btn btn-secondary btn-lg">{t('viewStocks')}</Link>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_news || 0}</div>
            <div className="stat-label">{t('totalNews')}</div>
          </div>
          <div className="stat-card positive">
            <div className="stat-value">{stats.positive || 0}</div>
            <div className="stat-label">{t('positive')}</div>
          </div>
          <div className="stat-card negative">
            <div className="stat-value">{stats.negative || 0}</div>
            <div className="stat-label">{t('negative')}</div>
          </div>
          <div className="stat-card neutral">
            <div className="stat-value">{stats.neutral || 0}</div>
            <div className="stat-label">{t('neutral')}</div>
          </div>
        </div>
      )}

      <section className="section">
        <h2>{t('recentNews')}</h2>
        <div className="news-list">
          {news.map(item => (
            <Link key={item.id} to={`/news/${item.id}`} className="news-item">
              <h3>{item.title}</h3>
              <p className="news-excerpt">{(item.content || item.summary || '').substring(0, 200)}{(item.content || '').length > 200 ? '...' : ''}</p>
              <div className="news-meta">
                <span className="badge">{item.source_name || 'Unknown'}</span>
                <span>{new Date(item.publish_date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {news.length === 0 && <p className="empty-state">{t('noRecentNews')}</p>}
        </div>
      </section>
    </div>
  );
}

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.getNews({ limit: 50 }).then(r => {
      setNews(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <h1>{t('newsTitle')}</h1>
      <div className="news-list">
        {news.map(item => (
          <Link key={item.id} to={`/news/${item.id}`} className={`news-item-card ${item.image_url ? 'has-image' : ''}`}>
            {item.image_url && (
              <div className="news-image">
                <img src={item.image_url} alt="" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
            <div className="news-content-wrapper">
              <h3>{item.title}</h3>
              <p className="news-excerpt">{(item.content || '').replace(/<[^>]*>?/gm, '').substring(0, 2000)}{item.content?.length > 2000 ? '...' : ''}</p>
              <div className="news-meta">
                <span className="badge">{item.source_name || 'Unknown'}</span>
                <span>{new Date(item.publish_date).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
        {news.length === 0 && <p className="empty-state">No news available. Click "Fetch All News" on RSS Sources page.</p>}
      </div>
    </div>
  );
}

function NewsDetailPage() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.getNewsDetail(id).then(r => {
      setNews(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!news) return <p>News not found</p>;

  return (
    <div className="page">
      <Link to="/news" className="back-link">← {t('backToNews')}</Link>
      <article className="news-detail">
        <h1>{news.title}</h1>
        {news.image_url && (
          <div className="detail-image">
            <img src={news.image_url} alt={news.title} onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}
        <div className="news-meta">
          <span className="badge">{news.source_name}</span>
          <span>{new Date(news.publish_date).toLocaleString()}</span>
          <a href={news.url} target="_blank" rel="noopener noreferrer" className="original-link">{t('readOriginal')}</a>
        </div>

        {/* Render HTML content safely to show inline images and formatting */}
        <div className="news-content" dangerouslySetInnerHTML={{ __html: news.content }} />
      </article>
    </div>
  );
}

function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language, exchangeRate } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [message, setMessage] = useState('');

  const fetchStocks = () => {
    api.getStocks().then(r => {
      setStocks(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchStocks(); }, []);

  const fetchPrices = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('pleaseLogin'));
      return;
    }
    try {
      setMessage(t('updatingPrices'));
      await api.updateAllPrices();
      setMessage(t('pricesUpdated'));
      fetchStocks();
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage(t('pleaseLogin'));
      return;
    }
    try {
      setMessage(t('addStock') + '...');
      await api.addStock({ symbol: newSymbol.toUpperCase() });
      setMessage(`${newSymbol.toUpperCase()} added!`);
      setNewSymbol('');
      setShowForm(false);
      fetchStocks();
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('stocksTitle')}</h1>
        <div className="header-actions">
          <button onClick={fetchPrices} className="btn btn-secondary">{t('updatePrices')}</button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? t('cancel') : t('addStock')}
          </button>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      {showForm && (
        <form onSubmit={handleAddStock} className="add-form">
          <input
            type="text"
            className="input"
            placeholder="Stock Symbol (e.g., AAPL, GOOGL, TSLA)"
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Add Stock</button>
        </form>
      )}

      <div className="stocks-grid">
        {stocks.map(stock => (
          <Link key={stock.id} to={`/stocks/${stock.symbol}`} className="stock-card">
            <div className="stock-symbol">{stock.symbol}</div>
            <div className="stock-name">{stock.name}</div>
            <div className="stock-price">
              {formatPrice(stock.current_price || 0, stock.currency || 'USD', language, exchangeRate)}
              <span className={stock.change_percent >= 0 ? 'positive' : 'negative'}>
                {stock.change_percent >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
              </span>
            </div>
            <div className="stock-sector">{stock.sector}</div>
          </Link>
        ))}
        {stocks.length === 0 && <p className="empty-state">{t('noStocks')}</p>}
      </div>
    </div>
  );
}

function StockDetailPage() {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language, exchangeRate } = useLanguage();

  useEffect(() => {
    Promise.all([
      api.getStockDetail(symbol),
      api.getStockHistory(symbol, { limit: 30 })
    ]).then(([stockRes, historyRes]) => {
      setStock(stockRes.data);
      setHistory(historyRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!stock) return <p>Stock not found</p>;

  return (
    <div className="page">
      <Link to="/stocks" className="back-link">← Back to Stocks</Link>
      <div className="stock-detail">
        <div className="stock-header">
          <h1>{stock.symbol}</h1>
          <p className="stock-name">{stock.name}</p>
        </div>
        <div className="stock-info-grid">
          <div className="info-card">
            <span className="label">{t('price')}</span>
            <span className="value">
              {formatPrice(stock.price || 0, stock.currency || 'USD', language, exchangeRate)}
            </span>
          </div>
          <div className="info-card">
            <span className="label">{t('change')}</span>
            <span className={`value ${stock.change_percent >= 0 ? 'positive' : 'negative'}`}>
              {stock.change_percent >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
            </span>
          </div>
          <div className="info-card">
            <span className="label">{t('sector')}</span>
            <span className="value">{stock.sector || 'N/A'}</span>
          </div>
        </div>
        <div className="chart-section">
          <h2>{t('priceChart')}</h2>
          <StockChart symbol={stock.symbol} currency={stock.currency || 'USD'} />
        </div>
        <div className="history-section">
          <h2>Price History</h2>
          {history.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>High</th>
                  <th>Low</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.recorded_at).toLocaleDateString()}</td>
                    <td>${(h.price || 0).toFixed(2)}</td>
                    <td>${(h.high_price || 0).toFixed(2)}</td>
                    <td>${(h.low_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No price history yet. Click "Update Prices" on the Stocks page.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', category: 'general' });
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  const fetchSources = () => {
    api.getSources().then(r => {
      setSources(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchSources(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage(t('pleaseLoginAddSource'));
      return;
    }
    try {
      await api.addSource(form);
      setMessage(t('sourceAdded'));
      setForm({ name: '', url: '', category: 'general' });
      setShowForm(false);
      fetchSources();
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await api.deleteSource(id);
      fetchSources();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleFetch = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('pleaseLoginFetchNews'));
      return;
    }
    try {
      setMessage(t('fetchingNews'));
      const result = await api.fetchNews();
      setMessage(t('fetchedNews').replace('{count}', result.data?.length || 0));
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  const handleTest = async (url) => {
    try {
      const result = await api.testSource(url);
      if (result.data?.success) {
        alert(t('itemCount').replace('{count}', result.data.itemCount));
      } else {
        alert(t('failed') + (result.data?.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('rssSourcesTitle')}</h1>
        <div className="header-actions">
          <button onClick={handleFetch} className="btn btn-secondary">{t('fetchAllNews')}</button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? t('cancel') : `+ ${t('addSource')}`}
          </button>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="add-form">
          <input
            type="text"
            className="input"
            placeholder={t('sourceName')}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="url"
            className="input"
            placeholder={t('sourceUrl')}
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
            required
          />
          <select
            className="input"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            <option value="general">General</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
            <option value="finance">Finance</option>
          </select>
          <button type="submit" className="btn btn-primary">{t('add')}</button>
        </form>
      )}

      <div className="sources-list">
        {sources.map(source => (
          <div key={source.id} className="source-item">
            <div className="source-info">
              <h3>{source.name}</h3>
              <p className="source-url">{source.url}</p>
              <div className="source-meta">
                <span className="badge">{source.category}</span>
                <span className={`status ${source.health_status}`}>{source.health_status || 'unknown'}</span>
              </div>
            </div>
            <div className="source-actions">
              <button onClick={() => handleTest(source.url)} className="btn btn-secondary btn-sm">{t('test')}</button>
              <button onClick={() => handleDelete(source.id)} className="btn btn-danger btn-sm">{t('delete')}</button>
            </div>
          </div>
        ))}
        {sources.length === 0 && <p className="empty-state">{t('noSources')}</p>}
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.login(form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{t('login')}</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          className="input"
          placeholder={t('emailPlaceholder')}
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          className="input"
          placeholder={t('passwordPlaceholder')}
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('loggingIn') : t('login')}
        </button>
        <p className="auth-switch">
          {t('dontHaveAccount')} <Link to="/register">{t('register')}</Link>
        </p>
      </form>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.register(form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{t('register')}</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          className="input"
          placeholder={t('fullNamePlaceholder')}
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          type="email"
          className="input"
          placeholder={t('emailPlaceholder')}
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          className="input"
          placeholder={t('passwordMinLength')}
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('registering') : t('register')}
        </button>
        <p className="auth-switch">
          {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
        </p>
      </form>
    </div>
  );
}

export default App;
