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

// Save or Update GLM API Key
router.post('/key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

    try {
        db.prepare('UPDATE users SET gemini_api_key = ? WHERE id = ?')
            .run(apiKey, req.user.id);
        res.json({ success: true, message: 'GLM API Key saved successfully' });
    } catch (err) {
        console.error('Settings POST /key error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Save or Update HF API Key
router.post('/hf-key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

    try {
        db.prepare('UPDATE users SET hf_api_key = ? WHERE id = ?')
            .run(apiKey, req.user.id);
        res.json({ success: true, message: 'Hugging Face API Key saved successfully' });
    } catch (err) {
        console.error('Settings POST /hf-key error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check if Keys Exist
router.get('/status', (req, res) => {
    try {
        const row = db.prepare('SELECT gemini_api_key, hf_api_key FROM users WHERE id = ?').get(req.user.id);
        res.json({
            hasGLMKey: !!(row && row.gemini_api_key),
            hasHFKey: !!(row && row.hf_api_key),
            maskedGLMKey: row && row.gemini_api_key ? `...${row.gemini_api_key.slice(-4)}` : null,
            maskedHFKey: row && row.hf_api_key ? `...${row.hf_api_key.slice(-4)}` : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove GLM API Key
router.delete('/key', (req, res) => {
    try {
        db.prepare('UPDATE users SET gemini_api_key = NULL WHERE id = ?')
            .run(req.user.id);
        res.json({ success: true, message: 'GLM API Key removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove HF API Key
router.delete('/hf-key', (req, res) => {
    try {
        db.prepare('UPDATE users SET hf_api_key = NULL WHERE id = ?')
            .run(req.user.id);
        res.json({ success: true, message: 'HF API Key removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
