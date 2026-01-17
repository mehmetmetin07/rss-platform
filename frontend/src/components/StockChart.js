import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatPriceShort } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

const StockChart = ({ symbol, currency = 'USD' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1M');
  const { language, exchangeRate } = useLanguage();

  // Helper for formatting currency
  const formatCurrency = (val) => {
    return formatPriceShort(val, currency, language, exchangeRate);
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, period]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token} ` } : {};

      // Fetch historical data from our backend
      const response = await fetch(`http://localhost:5000/api/stocks/${symbol}/chart?period=${period}`, { headers });
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Chart data error:', error);
    }
    setLoading(false);
  };

  const periods = [
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' }
  ];

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="spinner"></div>
        Loading chart...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        No chart data available. Try updating prices first.
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.low || d.close));
  const maxPrice = Math.max(...data.map(d => d.high || d.close));
  const priceChange = data.length > 1 ? data[data.length - 1].close - data[0].close : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="stock-chart-container">
      <div className="chart-header">
        <div className="chart-periods">
          {periods.map(p => (
            <button
              key={p.value}
              className={`period-btn ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => formatCurrency(value)}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [formatCurrency(value), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-stats">
        <div className="stat">
          <span className="label">Open</span>
          <span className="value">${data[0]?.open?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">High</span>
          <span className="value">${maxPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Low</span>
          <span className="value">${minPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Close</span>
          <span className="value">${data[data.length - 1]?.close?.toFixed(2) || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default StockChart;
