const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { generateAnalysis } = require('../services/aiService');

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(authenticate);

router.post('/analyze', async (req, res) => {
    const { symbol, language } = req.body;

    try {
        // 1. Get User's GLM API Key
        const user = db.prepare('SELECT gemini_api_key FROM users WHERE id = ?').get(req.user.id);

        if (!user || !user.gemini_api_key) {
            return res.status(400).json({
                error: 'GLM API Key is required. Please add it in Settings.'
            });
        }

        const apiKey = user.gemini_api_key;

        // 2. Get Enhanced Stock Data with Fundamentals & Technicals
        const StockService = require('../services/yahooFinance');
        const enhancedStock = await StockService.getEnhancedQuote(symbol);

        if (!enhancedStock) {
            return res.status(404).json({ error: 'Stock data not available' });
        }

        // 3. Fetch Live News from Google News (last 24 hours)
        const NewsService = require('../services/newsService');
        const liveNews = await NewsService.fetchLiveNews(symbol, enhancedStock.name, 15);

        console.log('[AI Route] ==================');
        console.log('[AI Route] Symbol:', symbol);
        console.log('[AI Route] Live news count:', liveNews.length);
        console.log('[AI Route] Language:', language);
        console.log('[AI Route] ==================');

        // 4. Generate Analysis with GLM-4.7
        const analysis = await generateAnalysis(
            symbol,
            enhancedStock,
            liveNews,
            language,
            apiKey
        );

        // 5. Return Analysis + Referenced News
        res.json({
            analysis,
            referencedNews: liveNews.map(news => ({
                title: news.title,
                url: news.url,
                source: news.source_name,
                date: new Date(news.publish_date).toLocaleDateString()
            }))
        });

    } catch (error) {
        console.error('[AI Route] Error message:', error.message);
        console.error('[AI Route] Error stack:', error.stack);
        console.error('[AI Route] ============================');
        res.status(500).json({ error: error.message || 'Analysis failed' });
    }
});

module.exports = router;
