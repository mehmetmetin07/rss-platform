const cron = require('node-cron');
const RSSParserService = require('../services/rssParser');
const DeduplicationService = require('../services/deduplication');

class RSSCronJob {
  constructor() {
    this.job = null;
  }

  /**
   * Cron job başlat
   */
  start() {
    // Her 5 dakikada bir çalıştır
    const interval = process.env.RSS_UPDATE_INTERVAL || 5;
    const cronPattern = `*/${interval} * * * *`;

    this.job = cron.schedule(cronPattern, async () => {
      await this.execute();
    }, {
      scheduled: true,
      timezone: 'Europe/Istanbul'
    });

    console.log(`⏰ RSS cron job başlatıldı (${interval} dakikada bir)`);
  }

  /**
   * Cron job durdur
   */
  stop() {
    if (this.job) {
      this.job.stop();
      console.log('⏸️ RSS cron job durduruldu');
    }
  }

  /**
   * RSS çekme ve tekilleştirme
   */
  async execute() {
    console.log('🔄 RSS cron job çalışıyor...');
    const startTime = Date.now();

    try {
      // 1. Haber çek
      const fetchResults = await RSSParserService.fetchNews();
      
      // 2. Tekilleştirme yap
      const dedupResults = await DeduplicationService.batchDeduplicate(100);

      const duration = (Date.now() - startTime) / 1000;
      
      console.log('✅ RSS cron job tamamlandı:', {
        duration: `${duration.toFixed(2)}s`,
        sources_processed: fetchResults.length,
        deduplication: dedupResults
      });
    } catch (error) {
      console.error('❌ RSS cron job hatası:', error);
    }
  }

  /**
   * Manuel çalıştırma (test için)
   */
  async runOnce() {
    console.log('🔄 Manuel RSS çalıştırılıyor...');
    await this.execute();
  }
}

// Singleton instance
let cronJobInstance = null;

module.exports = {
  start: () => {
    if (!cronJobInstance) {
      cronJobInstance = new RSSCronJob();
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
      cronJobInstance = new RSSCronJob();
    }
    return cronJobInstance;
  }
};
