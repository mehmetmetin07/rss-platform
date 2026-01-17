const express = require('express');
const Stock = require('../models/Stock');
const PriceHistory = require('../models/PriceHistory');
const StockService = require('../services/yahooFinance');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const sector = req.query.sector;
    const stocks = sector ? Stock.findBySector(sector) : Stock.findAll();
    res.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Stocks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a new stock by symbol
router.post('/', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    // Check if already exists
    let stock = Stock.findBySymbol(upperSymbol);
    if (stock) {
      return res.json({ success: true, message: 'Stock already exists', data: stock });
    }

    // Fetch from Yahoo Finance to validate and get info
    const data = await StockService.getPrice(upperSymbol);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Invalid stock symbol or unable to fetch data' });
    }

    // Create the stock
    stock = Stock.create({
      symbol: upperSymbol,
      name: data.name || upperSymbol,
      sector: 'Unknown',
      exchange: 'NASDAQ',
      currency: data.currency
    });

    // Update with current price
    Stock.updatePrice(stock.id, data.price, data.changePercent, data.currency);

    res.json({ success: true, message: 'Stock added successfully', data: stock });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/prices/latest', (req, res) => {
  try {
    const prices = PriceHistory.getLatestPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('Prices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/sectors/list', (req, res) => {
  try {
    const stocks = Stock.findAll();
    const sectors = [...new Set(stocks.map(s => s.sector).filter(Boolean))];
    res.json({ success: true, data: sectors });
  } catch (error) {
    console.error('Sectors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/prices/update-all', auth, async (req, res) => {
  try {
    const count = await StockService.updateAllPrices();
    res.json({ success: true, message: `${count} stocks updated`, data: { count } });
  } catch (error) {
    console.error('Update prices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = Stock.findBySymbol(symbol);

    if (!stock) {
      const data = await StockService.getPrice(symbol);
      if (data) {
        // Create the stock
        stock = Stock.create({
          symbol,
          name: data.name,
          sector: 'Unknown',
          exchange: 'NASDAQ',
          currency: data.currency
        });

        // Update with current price
        Stock.updatePrice(stock.id, data.price, data.changePercent, data.currency);
      }
    }

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    const latest = PriceHistory.getLatestPrice(stock.id);
    res.json({
      success: true,
      data: {
        ...stock,
        price: latest?.price || stock.current_price || 0,
        change_percent: stock.change_percent || 0
      }
    });
  } catch (error) {
    console.error('Stock detail error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chart data from Yahoo Finance
router.get('/:symbol/chart', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const period = req.query.period || '1M';

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1W': startDate.setDate(endDate.getDate() - 7); break;
      case '1M': startDate.setMonth(endDate.getMonth() - 1); break;
      case '3M': startDate.setMonth(endDate.getMonth() - 3); break;
      case '6M': startDate.setMonth(endDate.getMonth() - 6); break;
      case '1Y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setMonth(endDate.getMonth() - 1);
    }

    // Fetch chart data from Yahoo Finance using chart() method
    const yf = require('yahoo-finance2').default;
    const yfInstance = new yf();

    // Use query options for chart
    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: period === '1W' ? '1h' : '1d'
    };

    const result = await yfInstance.chart(symbol, queryOptions);

    // Format data for chart from chart() result structure
    // chart() returns { meta: {}, quotes: [] }
    const quotes = result.quotes || [];
    const chartData = quotes.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Chart error:', error.message);

    // Fallback to local price history if Yahoo fails
    const history = PriceHistory.findBySymbol(req.params.symbol.toUpperCase(), { limit: 30 });
    const chartData = history.reverse().map(h => ({
      date: new Date(h.recorded_at).toLocaleDateString(),
      open: h.open_price || h.price,
      high: h.high_price || h.price,
      low: h.low_price || h.price,
      close: h.price,
      volume: h.volume || 0
    }));

    res.json({ success: true, data: chartData, source: 'local' });
  }
});

router.get('/:symbol/history', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const limit = parseInt(req.query.limit) || 30;
    const history = PriceHistory.findBySymbol(symbol, { limit });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:symbol/fetch', auth, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = Stock.findBySymbol(symbol);

    const data = await StockService.getPrice(symbol);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Could not fetch stock data' });
    }

    if (!stock) {
      stock = Stock.create({ symbol, name: data.name, sector: 'Unknown' });
    }

    Stock.updatePrice(stock.id, data.price, data.changePercent);
    PriceHistory.create({
      stock_id: stock.id,
      price: data.price,
      open_price: data.open,
      high_price: data.high,
      low_price: data.low,
      volume: data.volume
    });

    res.json({ success: true, message: 'Stock data updated', data });
  } catch (error) {
    console.error('Fetch stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
