const express = require('express');
const Stock = require('../models/Stock');
const PriceHistory = require('../models/PriceHistory');
const YahooFinanceService = require('../services/yahooFinance');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Tüm hisse senetlerini listele
router.get('/', async (req, res) => {
  try {
    const sector = req.query.sector;
    
    let stocks;
    if (sector) {
      stocks = await Stock.findBySector(sector);
    } else {
      stocks = await Stock.findAll();
    }

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Hisse detayları
router.get('/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findBySymbol(req.params.symbol);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Hisse bulunamadı'
      });
    }

    // En son fiyatı getir
    const latestPrice = await PriceHistory.getLatestPrice(stock.id);

    res.json({
      success: true,
      data: {
        ...stock,
        latestPrice
      }
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Hisse fiyat geçmişi
router.get('/:symbol/history', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const { limit, fromDate, toDate } = req.query;

    const history = await PriceHistory.findBySymbol(symbol, {
      limit: parseInt(limit) || 100,
      fromDate,
      toDate
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
 console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm hisse senedi fiyatları (canlı)
router.get('/prices/latest', async (req, res) => {
  try {
    const prices = await PriceHistory.getLatestPrices();

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Get latest prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Hisse senedi doğrulama
router.get('/:symbol/validate', async (req, res) => {
  try {
    const validation = await YahooFinanceService.validateSymbol(req.params.symbol);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate symbol error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Manuel fiyat güncelleme (protected)
router.post('/prices/update', auth, async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Semboller dizisi gerekli'
      });
    }

    let savedCount = 0;
    const results = [];

    for (const symbol of symbols) {
      try {
        await YahooFinanceService.savePriceData(symbol);
        savedCount++;
        results.push({ symbol, status: 'success' });
      } catch (error) {
        results.push({ 
          symbol, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `${savedCount}/${symbols.length} fiyat güncellendi`,
      data: results
    });
  } catch (error) {
    console.error('Update prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm hisseleri güncelle (protected)
router.post('/prices/update-all', auth, async (req, res) => {
  try {
    const count = await YahooFinanceService.updateAllStockPrices();

    res.json({
      success: true,
      message: `${count} hisse fiyatı güncellendi`,
      data: { count }
    });
  } catch (error) {
    console.error('Update all prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tarihsel veri çekme (protected)
router.post('/:symbol/historical', auth, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const { period1, period2, interval } = req.body;

    const savedCount = await YahooFinanceService.saveHistoricalData(symbol, {
      period1: period1 ? new Date(period1) : undefined,
      period2: period2 ? new Date(period2) : undefined,
      interval
    });

    res.json({
      success: true,
      message: `${savedCount} kayıt eklendi`,
      data: { count: savedCount }
    });
  } catch (error) {
    console.error('Save historical error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sunucu hatası'
    });
  }
});

// Sektör listesi
router.get('/sectors/list', async (req, res) => {
  try {
    const result = await Stock.findAll();
    const sectors = [...new Set(result.map(s => s.sector))].filter(Boolean);

    res.json({
      success: true,
      data: sectors
    });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
