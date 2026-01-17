import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TradingViewWidget from './components/TradingViewWidget';

function App() {
  const [selectedStock, setSelectedStock] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <nav className="bg-white shadow p-4">
          <div className="container flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              RSS & Borsa Platformu
            </Link>
            <div className="flex gap-4">
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
              <div className="text-center py-12">
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
            } />

            {/* Stock Page with TradingView */}
            <Route path="/stocks/:symbol" element={
              <div>
                {selectedStock ? (
                  <div>
                    <button 
                      onClick={() => setSelectedStock(null)}
                      className="btn btn-secondary mb-4"
                    >
                      ← Geri Dön
                    </button>
                    <h2 className="text-2xl font-bold mb-4">
                      {selectedStock.symbol} - {selectedStock.name}
                    </h2>
                    <TradingViewWidget symbol={selectedStock.symbol} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <button 
                      onClick={() => setSelectedStock({ symbol: 'THYAO', name: 'Türk Hava Yolları' })}
                      className="btn btn-primary"
                    >
                      THYAO Örneği Göster
                    </button>
                  </div>
                )}
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
