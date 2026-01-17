const axios = require('axios');

class CurrencyService {
    constructor() {
        this.rates = null;
        this.lastFetch = null;
        this.CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    async getExchangeRates() {
        const now = Date.now();

        // Return cached rates if still fresh
        if (this.rates && this.lastFetch && (now - this.lastFetch < this.CACHE_DURATION)) {
            return this.rates;
        }

        try {
            // Fetch from free exchange rate API
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');

            if (response.data && response.data.rates) {
                this.rates = {
                    USD_TRY: response.data.rates.TRY || 35.0, // Default fallback
                    timestamp: new Date().toISOString()
                };
                this.lastFetch = now;
                console.log(`✓ Exchange rates updated: 1 USD = ${this.rates.USD_TRY} TRY`);
                return this.rates;
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error.message);

            // Return cached rates if available, or fallback
            if (this.rates) {
                console.log('Using cached exchange rates');
                return this.rates;
            }

            // Fallback to approximate rate
            return {
                USD_TRY: 35.0,
                timestamp: new Date().toISOString(),
                fallback: true
            };
        }
    }

    async convertUSDToTRY(usdAmount) {
        const rates = await this.getExchangeRates();
        return usdAmount * rates.USD_TRY;
    }

    async convertTRYtoUSD(tryAmount) {
        const rates = await this.getExchangeRates();
        return tryAmount / rates.USD_TRY;
    }
}

module.exports = new CurrencyService();
