const express = require('express');
const News = require('../models/News');
const RssSource = require('../models/RssSource');
const RSSService = require('../services/rssParser');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats/summary', (req, res) => {
  try {
    const stats = News.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/recent/all', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const news = News.getRecentNews(limit);
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Recent news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/sources/list', (req, res) => {
  try {
    const sources = RssSource.findAll();
    res.json({ success: true, data: sources });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', (req, res) => {
  try {
    const filters = {
      source_id: req.query.source_id,
      category: req.query.category,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };
    const news = News.findAll(filters);
    res.json({ success: true, data: news, count: news.length });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const news = News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('News detail error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/fetch', auth, async (req, res) => {
  try {
    const results = await RSSService.fetchAll();
    res.json({ success: true, message: 'Fetch completed', data: results });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/sources/test', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL required' });
    }
    const result = await RSSService.testUrl(url);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/sources', auth, (req, res) => {
  try {
    const { name, url, category } = req.body;
    if (!name || !url || !category) {
      return res.status(400).json({ success: false, message: 'Name, URL and category required' });
    }
    const source = RssSource.create({ name, url, category });
    res.status(201).json({ success: true, message: 'Source added', data: source });
  } catch (error) {
    console.error('Add source error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/sources/:id', auth, (req, res) => {
  try {
    const source = RssSource.delete(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Source not found' });
    }
    res.json({ success: true, message: 'Source deleted', data: source });
  } catch (error) {
    console.error('Delete source error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
