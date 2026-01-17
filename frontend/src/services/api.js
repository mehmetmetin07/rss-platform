const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async login(data) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('token');
  }

  // News
  async getNews(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/news?${params}`);
  }

  async getNewsById(id) {
    return this.request(`/news/${id}`);
  }

  async getNewsStats() {
    return this.request('/news/stats/summary');
  }

  async getRecentNews(limit = 10) {
    return this.request(`/news/recent/all?limit=${limit}`);
  }

  // Stocks
  async getStocks() {
    return this.request('/stocks');
  }

  async getStock(symbol) {
    return this.request(`/stocks/${symbol}`);
  }

  async getStockHistory(symbol, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/stocks/${symbol}/history?${params}`);
  }

  async getLatestPrices() {
    return this.request('/stocks/prices/latest');
  }

  async getStocksBySector(sector) {
    return this.request(`/stocks?sector=${sector}`);
  }

  // RSS Sources
  async getSources() {
    return this.request('/news/sources/list');
  }

  // AI
  async analyzeNews() {
    return this.request('/news/ai/analyze', {
      method: 'POST'
    });
  }

  async getMarketTrend() {
    return this.request('/news/ai/trend');
  }
}

export default new APIService();
