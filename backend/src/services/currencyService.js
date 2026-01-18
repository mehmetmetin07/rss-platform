const axios = require('axios');

let rateCache = {
    rate: 34.50, // Default fall-back
    lastUpdated: 0
};

const CACHE_TTL = 3600 * 1000; // 1 Hour

async function getExchangeRate() {
    const now = Date.now();
    if (now - rateCache.lastUpdated < CACHE_TTL) {
        return rateCache.rate;
    }

    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.data && response.data.rates && response.data.rates.TRY) {
            rateCache = {
                rate: response.data.rates.TRY,
                lastUpdated: now
            };
            console.log('Updated Exchange Rate:', rateCache.rate);
        }
    } catch (error) {
        console.error('Failed to fetch exchange rate, using cached/default:', error.message);
    }

    return rateCache.rate;
}

module.exports = { getExchangeRate };
