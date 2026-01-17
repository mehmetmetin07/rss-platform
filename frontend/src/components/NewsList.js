import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NewsList = ({ filters = {} }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getNews(filters);
        setNews(response.data || []);
      } catch (err) {
        console.error('News fetch error:', err);
        setError('Haberler yüklenemedi. Backend servisi çalışmıyor olabilir.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []); // Boş bağımlılık listesi - sadece bir kez çalışacak

  const getSentimentClass = (category) => {
    switch (category) {
      case 'very_positive': return 'sentiment-very-positive';
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      case 'very_negative': return 'sentiment-very-negative';
      default: return 'sentiment-neutral';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
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
      <div className="card p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-sm text-gray-500 mb-4">Backend servisi başlatıldı mı?</p>
        <button 
          onClick={() => {
            hasFetched.current = false;
            window.location.reload();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-500">Haber bulunamadı</p>
        <p className="text-sm text-gray-400 mt-2">RSS kaynaklarından haber çekilemedi</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {news.map((item) => (
        <div key={item.id} className="card">
          <div className="card-header flex justify-between items-center">
            <span className="text-sm text-gray-500">{item.source_name}</span>
            <span className={`text-sm font-bold ${getSentimentClass(item.sentiment_category)}`}>
              {item.sentiment_category}
            </span>
          </div>
          <div className="card-body">
            <Link to={`/news/${item.id}`}>
              <h3 className="text-lg font-bold mb-2 hover:text-blue-600 cursor-pointer">{item.title}</h3>
            </Link>
            {item.summary && (
              <p className="text-gray-500 text-sm mb-4">{item.summary}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {formatDate(item.publish_date)}
              </span>
              {item.related_stocks && item.related_stocks.length > 0 && (
                <div className="flex gap-2">
                  {item.related_stocks.map((stock, idx) => (
                    <span 
                      key={idx} 
                      className="bg-gray-100 px-2 py-1 rounded text-sm font-bold"
                    >
                      {stock}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsList;
