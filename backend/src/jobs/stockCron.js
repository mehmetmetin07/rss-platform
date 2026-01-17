const cron = require('node-cron');
const YahooFinanceService = require('../services/yahooFinance');

class StockCronJob {
    constructor() {
        this.job = null;
    }

    /**
     * Cron job başlat
     */
    start() {
        // Run every 2 minutes as requested
        const cronPattern = '*/2 * * * *';

        this.job = cron.schedule(cronPattern, async () => {
            await this.execute();
        }, {
            scheduled: true,
            timezone: 'Europe/Istanbul'
        });

        console.log('⏰ Stock cron job başlatıldı (Hafta içi 09:00-18:00, 15dk ara ile)');
    }

    /**
     * Cron job durdur
     */
    stop() {
        if (this.job) {
            this.job.stop();
            console.log('⏸️ Stock cron job durduruldu');
        }
    }

    /**
     * Hisse fiyatlarını güncelle
     */
    async execute() {
        console.log('refreshing stock prices...');
        try {
            await YahooFinanceService.updateAllStockPrices();
        } catch (error) {
            console.error('❌ Stock cron job hatası:', error);
        }
    }
}

// Singleton instance
let cronJobInstance = null;

module.exports = {
    start: () => {
        if (!cronJobInstance) {
            cronJobInstance = new StockCronJob();
            cronJobInstance.start();
        }
        return cronJobInstance;
    },

    stop: () => {
        if (cronJobInstance) {
            cronJobInstance.stop();
        }
    },

    getInstance: () => {
        if (!cronJobInstance) {
            cronJobInstance = new StockCronJob();
        }
        return cronJobInstance;
    }
};
