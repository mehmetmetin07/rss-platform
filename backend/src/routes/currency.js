const express = require('express');
const currencyService = require('../services/currencyService');

const router = express.Router();

// Get current exchange rates
router.get('/rates', async (req, res) => {
    try {
        const rates = await currencyService.getExchangeRates();
        res.json({
            success: true,
            data: rates
        });
    } catch (error) {
        console.error('Currency rates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exchange rates'
        });
    }
});

// Convert USD to TRY
router.get('/convert/usd-to-try', async (req, res) => {
    try {
        const { amount } = req.query;
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount parameter required'
            });
        }

        const tryAmount = await currencyService.convertUSDToTRY(parseFloat(amount));
        const rates = await currencyService.getExchangeRates();

        res.json({
            success: true,
            data: {
                usd: parseFloat(amount),
                try: tryAmount,
                rate: rates.USD_TRY
            }
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({
            success: false,
            message: 'Conversion failed'
        });
    }
});

module.exports = router;
