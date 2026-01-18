const express = require('express');
const router = express.Router();
const { getExchangeRate } = require('../services/currencyService');

router.get('/rates', async (req, res) => {
    try {
        const rate = await getExchangeRate();
        res.json({
            success: true,
            base: 'USD',
            rates: { TRY: rate }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
