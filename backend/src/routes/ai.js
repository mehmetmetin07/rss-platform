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
        // 1. Get User's API Key
        const user = db.prepare('SELECT gemini_api_key FROM users WHERE id = ?').get(req.user.id);
        if (!user || !user.gemini_api_key) {
            return res.status(400).json({ error: 'API Key not found. Please add it in Settings.' });
        }
        const apiKey = user.gemini_api_key;

        // 2. Get Stock Data
        const stock = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
        if (!stock) return res.status(404).json({ error: 'Stock not found' });

        // 3. Get Last 15 News Items (improved search)
        // Handle Turkish stock symbols by removing .IS suffix
        const cleanSymbol = stock.symbol.replace('.IS', '');
        const searchSymbol = `%${cleanSymbol}%`;
        const searchName = `%${stock.name}%`;

        // Get news from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateFilter = thirtyDaysAgo.toISOString();

        const newsList = db.prepare(`
            SELECT * FROM news 
            WHERE (
                title LIKE ? OR 
                content LIKE ? OR 
                title LIKE ? OR 
                content LIKE ?
            )
            AND datetime(publish_date) >= datetime(?)
            ORDER BY publish_date DESC 
            LIMIT 15
        `).all(searchSymbol, searchSymbol, searchName, searchName, dateFilter);

        // 4. Generate Analysis
        console.log('[AI Route] Calling generateAnalysis for symbol:', symbol);
        console.log('[AI Route] API Key (first 10 chars):', apiKey?.substring(0, 10));
        console.log('[AI Route] Language:', language);
        console.log('[AI Route] News count:', newsList.length);

        const analysis = await generateAnalysis(
            symbol,
            { name: stock.name, price: stock.current_price, currency: stock.currency, change_percent: stock.change_percent },
            newsList,
            language,
            apiKey
        );

        console.log('[AI Route] Analysis received, length:', analysis?.length);

        res.json({
            success: true,
            analysis,
            referenced_news: newsList
        });

    } catch (error) {
        console.error('[AI Route] ========== ERROR ==========');
        console.error('[AI Route] Error type:', error.constructor?.name);
        console.error('[AI Route] Error message:', error.message);
        console.error('[AI Route] Error stack:', error.stack);
        console.error('[AI Route] ============================');
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
