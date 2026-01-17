import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NewsList from './components/NewsList';
import StockList from './components/StockList';
import TradingViewWidget from './components/TradingViewWidget';
import api from './services/api';

function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getNewsStats();
      setStats(data.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <nav className="bg-white shadow p-4">
          <div className="container flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-800 transition">
              RSS & Borsa Platformu
            </Link>
            <div className="flex gap-4 items-center">
              <Link to="/news" className="hover:text-blue-600 transition">
                Haberler
              </Link>
              <Link to="/stocks" className="hover:text-blue-600 transition">
                Borsa
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Giriş Yap
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container py-6">
          <Routes>
            {/* Home Page */}
            <Route path="/" element={
              <div>
                <div className="text-center py-12 mb-8">
                  <h1 className="text-3xl font-bold mb-4">
                    RSS & Borsa Platformuna Hoş Geldiniz
                  </h1>
                  <p className="text-gray-500 mb-8">
                    Yapay zeka destekli haber ve borsa analizi platformu
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/news" className="btn btn-primary">
                      Haberleri Görüntüle
                    </Link>
                    <Link to="/stocks" className="btn btn-secondary">
                      Borsa Verileri
                    </Link>
                  </div>
                </div>

                {stats && (
                  <div className="card mb-8">
                    <div className="card-header">
                      <h2 className="text-lg font-bold">İstatistikler</h2>
                    </div>
                    <div className="card-body">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Toplam Haber</div>
                          <div className="text-2xl font-bold">{stats.total_news || 0}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Pozitif</div>
                          <div className="text-2xl font-bold text-green-500">
                            {stats.positive || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Negatif</div>
                          <div className="text-2xl font-bold text-red-500">
                            {stats.negative || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Nötr</div>
                          <div className="text-2xl font-bold text-gray-500">
                            {stats.neutral || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent News */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Son Haberler</h2>
                  <NewsList limit={5} />
                </div>
              </div>
            } />

            {/* News Page */}
            <Route path="/news" element={
              <div>
                <h1 className="text-2xl font-bold mb-6">Haberler</h1>
                <NewsList />
              </div>
            } />

            {/* Stocks Page */}
            <Route path="/stocks" element={
              <div>
                <h1 className="text-2xl font-bold mb-6">Hisse Senetleri</h1>
                <StockList />
              </div>
            } />

            {/* Stock Detail Page */}
            <Route path="/stocks/:symbol" element={
              <div>
                <Link to="/stocks" className="btn btn-secondary mb-4 inline-block">
                  ← Geri Dön
                </Link>
                <h1 className="text-2xl font-bold mb-4">
                  Hisse Detayları
                </h1>
                <TradingViewWidget symbol={window.location.pathname.split('/').pop()} />
              </div>
            } />

            {/* Login Page */}
            <Route path="/login" element={
              <div className="max-w-md mx-auto">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-bold">Giriş Yap</h2>
                  </div>
                  <div className="card-body">
                    <form className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">E-posta</label>
                        <input 
                          type="email" 
                          className="input"
                          placeholder="ornek@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Şifre</label>
                        <input 
                          type="password" 
                          className="input"
                          placeholder="•••••••••"
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Giriş Yap
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            } />

            {/* Legal Page */}
            <Route path="/legal" element={
              <div className="card p-6">
                <h1 className="text-2xl font-bold mb-4">Yasal Uyarı</h1>
                <div className="flex flex-col gap-4 text-gray-600">
                  <p>
                    Bu platformda yer alan bilgiler sadece bilgilendirme amaçlıdır ve 
                    yatırım tavsiyesi niteliğinde değildir.
                  </p>
                  <p>
                    Hisse senedi, kripto para ve diğer yatırım araçlarının değerleri 
                    dalgalanabilir ve yatırımlarınızı kaybetme riski vardır.
                  </p>
                  <p>
                    Herhangi bir yatırım kararı vermeden önce kendi araştırmanızı yapmanızı 
                    ve gerekirse profesyonel bir finans danışmanına başvurmanızı öneririz.
                  </p>
                  <p>
                    Bu platformdaki bilgilerin doğruluğu veya güncelliği hakkında 
                    hiçbir garanti verilmemektedir.
                  </p>
                  <p className="font-bold">
                    Bu platform, kullanıcıların yatırım kayıplarından veya 
                    diğer finansal kayıplardan sorumlu değildir.
                  </p>
                </div>
              </div>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t p-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 RSS & Borsa Platformu. Tüm hakları saklıdır.
          </p>
          <Link to="/legal" className="text-blue-600 text-sm hover:underline">
            Yasal Uyarı
          </Link>
        </footer>
      </div>
    </Router>
  );
}

export default App;
