const express = require('express');
const News = require('../models/News');
const RssSource = require('../models/RssSource');
const RSSParserService = require('../services/rssParser');
const DeduplicationService = require('../services/deduplication');
const AIAnalysisJob = require('../jobs/aiAnalysis');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Haberleri listele (public endpoint)
router.get('/', async (req, res) => {
  try {
    const filters = {
      source_id: req.query.source_id,
      category: req.query.category,
      sentiment_category: req.query.sentiment,
      stock: req.query.stock,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const news = await News.findAll(filters);

    res.json({
      success: true,
      data: news,
      count: news.length
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Haber detayı
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Haber bulunamadı'
      });
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get news detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Haber istatistikleri (public endpoint)
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await News.getStats();
    const dedupStats = await DeduplicationService.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        deduplication: dedupStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Son haberler
router.get('/recent/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const news = await News.getRecentNews(limit);

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get recent news error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// RSS kaynaklarını listele
router.get('/sources/list', async (req, res) => {
  try {
    const sources = await RssSource.findAll();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Manuel haber çekme (protected endpoint)
router.post('/fetch', auth, async (req, res) => {
  try {
    const results = await RSSParserService.fetchNews();

    res.json({
      success: true,
      message: 'Haberler çekildi',
      data: results
    });
  } catch (error) {
    console.error('Fetch news error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Manuel tekilleştirme (protected endpoint)
router.post('/deduplicate', auth, async (req, res) => {
  try {
    const limit = req.body.limit || 100;
    const results = await DeduplicationService.batchDeduplicate(limit);

    res.json({
      success: true,
      message: 'Tekilleştirme tamamlandı',
      data: results
    });
  } catch (error) {
    console.error('Deduplicate error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// RSS kaynağı test et
router.post('/sources/test', auth, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL gerekli'
      });
    }

    const result = await RSSParserService.testSource(url);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Test source error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// RSS kaynağı ekle (protected endpoint)
router.post('/sources', auth, async (req, res) => {
  try {
    const { name, url, category } = req.body;

    if (!name || !url || !category) {
      return res.status(400).json({
        success: false,
        message: 'İsim, URL ve kategori gerekli'
      });
    }

    const source = await RssSource.create({ name, url, category });

    res.status(201).json({
      success: true,
      message: 'RSS kaynağı eklendi',
      data: source
    });
  } catch (error) {
    console.error('Add source error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// RSS kaynağı güncelle (protected endpoint)
router.put('/sources/:id', auth, async (req, res) => {
  try {
    const source = await RssSource.update(req.params.id, req.body);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'RSS kaynağı güncellendi',
      data: source
    });
  } catch (error) {
    console.error('Update source error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// RSS kaynağı sil (protected endpoint)
router.delete('/sources/:id', auth, async (req, res) => {
  try {
    const source = await RssSource.delete(req.params.id);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'RSS kaynağı silindi',
      data: source
    });
  } catch (error) {
    console.error('Delete source error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// AI analizi başlat (protected endpoint)
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const aiJob = AIAnalysisJob.getInstance();
    await aiJob.analyzePendingNews();

    res.json({
      success: true,
      message: 'AI analizi başlatıldı'
    });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Haberi yeniden analiz et (protected endpoint)
router.post('/:id/ai/reanalyze', auth, async (req, res) => {
  try {
    const analysis = await AIAnalysisJob.getInstance().reanalyzeNews(req.params.id);

    res.json({
      success: true,
      message: 'Haber yeniden analiz edildi',
      data: analysis
    });
  } catch (error) {
    console.error('AI reanalyze error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sunucu hatası'
    });
  }
});

// Piyasa trend analizi (protected endpoint)
router.get('/ai/trend', async (req, res) => {
  try {
    const trend = await AIAnalysisJob.getInstance().analyzeMarketTrend();

    if (!trend) {
      return res.json({
        success: true,
        message: 'Trend analizi için yeterli veri yok',
        data: null
      });
    }

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('AI trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
