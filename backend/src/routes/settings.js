const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

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

// Save or Update API Key
router.post('/key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

    try {
        console.log('Saving API Key for user:', req.user.id);
        db.prepare('UPDATE users SET gemini_api_key = ? WHERE id = ?')
            .run(apiKey, req.user.id);
        res.json({ success: true, message: 'API Key saved successfully' });
    } catch (err) {
        console.error('Settings POST /key error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check if Key Exists
router.get('/status', (req, res) => {
    try {
        const row = db.prepare('SELECT gemini_api_key FROM users WHERE id = ?').get(req.user.id);
        res.json({
            hasKey: !!(row && row.gemini_api_key),
            maskedKey: row && row.gemini_api_key ? `...${row.gemini_api_key.slice(-4)}` : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove API Key
router.delete('/key', (req, res) => {
    try {
        db.prepare('UPDATE users SET gemini_api_key = NULL WHERE id = ?')
            .run(req.user.id);
        res.json({ success: true, message: 'API Key removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
