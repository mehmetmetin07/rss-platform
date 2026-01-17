import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StockList = ({ sector = null }) => {
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (sector) {
        data = await api.getStocksBySector(sector);
      } else {
        data = await api.getStocks();
      }
      
      setStocks(data.data || []);
      
      // Latest prices'ı çek
      try {
        const pricesData = await api.getLatestPrices();
        const pricesMap = {};
        (pricesData.data || []).forEach(p => {
          pricesMap[p.symbol] = p;
        });
        setPrices(pricesMap);
      } catch (priceErr) {
        console.error('Prices fetch error:', priceErr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sector]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const formatNumber = (num) => {
    if (!num) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-500">Hisse senedi bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-bold">
          {sector ? `${sector} Sektörü` : 'Tüm Hisse Senetleri'}
        </h2>
      </div>
      <div className="card-body">
        <div className="flex flex-col gap-2">
          {stocks.map((stock) => (
            <Link 
              key={stock.id} 
              to={`/stocks/${stock.symbol}`}
              className="flex justify-between items-center p-4 bg-gray-100 rounded hover:bg-gray-200 transition cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">{stock.symbol}</div>
                <div className="text-sm text-gray-500">{stock.name}</div>
                <div className="text-sm text-gray-500">{stock.sector}</div>
              </div>
              <div className="text-right">
                {/* Fiyat bilgisi - API'den gelen latest price kullan */}
                {prices[stock.symbol] && (
                  <>
                    <div className="text-lg font-bold">
                      ${prices[stock.symbol].price?.toFixed(2) || 'N/A'}
                    </div>
                    <div className={`text-sm font-bold ${prices[stock.symbol].change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {prices[stock.symbol].change_percent >= 0 ? '+' : ''}{prices[stock.symbol].change_percent?.toFixed(2) || '0.00'}%
                    </div>
                  </>
                )}
                {!prices[stock.symbol] && (
                  <div className="text-sm text-gray-500">Yükleniyor...</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockList;
