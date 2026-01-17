const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const api = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  getNewsStats: () => request('/news/stats/summary'),
  getRecentNews: (limit = 10) => request(`/news/recent/all?limit=${limit}`),
  getNews: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/news?${params}`);
  },
  getNewsDetail: (id) => request(`/news/${id}`),
  fetchNews: () => request('/news/fetch', { method: 'POST' }),

  getSources: () => request('/news/sources/list'),
  addSource: (data) => request('/news/sources', { method: 'POST', body: JSON.stringify(data) }),
  deleteSource: (id) => request(`/news/sources/${id}`, { method: 'DELETE' }),
  testSource: (url) => request('/news/sources/test', { method: 'POST', body: JSON.stringify({ url }) }),

  getStocks: () => request('/stocks'),
  getStockDetail: (symbol) => request(`/stocks/${symbol}`),
  getStockHistory: (symbol, options = {}) => {
    const params = new URLSearchParams(options).toString();
    return request(`/stocks/${symbol}/history?${params}`);
  },
  updateAllPrices: () => request('/stocks/prices/update-all', { method: 'POST' }),
  addStock: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  fetchStock: (symbol) => request(`/stocks/${symbol}/fetch`, { method: 'POST' })
};

export default api;
