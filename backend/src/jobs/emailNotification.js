const cron = require('node-cron');
const News = require('../models/News');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const AIAnalysisJob = require('./aiAnalysis');

class EmailNotificationJob {
  constructor() {
    this.isRunning = false;
    this.dailySummaryJob = null;
    this.marketTrendJob = null;
  }

  /**
   * Günlük haber özeti gönder
   */
  async sendDailySummary() {
    if (this.isRunning) {
      console.log('⏸️ E-posta bildirimi zaten çalışıyor');
      return;
    }

    this.isRunning = true;
    console.log('📧 Günlük haber özeti gönderiliyor...');

    try {
      // İstatistikleri al
      const stats = await News.getStats();
      
      // Son haberleri getir
      const recentNews = await News.findAll({ limit: 10 });

      // Email bildirimlerini aktif eden kullanıcıları getir
      const users = await this.getUsersWithNotificationEnabled('daily_summary');

      if (users.length === 0) {
        console.log('✅ Günlük özet bildirimini bekleyen kullanıcı yok');
        return;
      }

      const emailData = {
        totalNews: stats.total_news || 0,
        positive: stats.positive || 0,
        negative: stats.negative || 0,
        neutral: stats.neutral || 0,
        topNews: recentNews.slice(0, 5)
      };

      const emailService = EmailService.getInstance();
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          await emailService.sendNewsSummary(user.email, emailData);
          successCount++;
          console.log(`✅ Özet gönderildi: ${user.email}`);
          
          // Rate limiting için bekleme
          await this.sleep(1000);
        } catch (error) {
          failCount++;
          console.error(`❌ Özet gönderme hatası (${user.email}):`, error.message);
        }
      }

      console.log(`✅ Günlük özet tamamlandı: ${successCount} başarılı, ${failCount} başarısız`);
    } catch (error) {
      console.error('❌ Günlük özet hatası:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Piyasa trend bildirimi gönder
   */
  async sendMarketTrendNotification() {
    console.log('📈 Piyasa trend bildirimi kontrol ediliyor...');

    try {
      // Trend analizi yap
      const trend = await AIAnalysisJob.getInstance().analyzeMarketTrend();

      if (!trend || trend.trend === 'belirsiz' || trend.confidence < 0.7) {
        console.log('⚠️ Trend yeterince belirgin değil veya güven düşük');
        return;
      }

      // Email bildirimlerini aktif eden kullanıcıları getir
      const users = await this.getUsersWithNotificationEnabled('market_trend');

      if (users.length === 0) {
        console.log('✅ Piyasa trend bildirimini bekleyen kullanıcı yok');
        return;
      }

      const emailService = EmailService.getInstance();
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          await emailService.sendMarketTrendAlert(user.email, trend);
          successCount++;
          console.log(`✅ Trend bildirimi gönderildi: ${user.email}`);
          
          await this.sleep(1000);
        } catch (error) {
          failCount++;
          console.error(`❌ Trend bildirimi hatası (${user.email}):`, error.message);
        }
      }

      console.log(`✅ Piyasa trend bildirimi tamamlandı: ${successCount} başarılı, ${failCount} başarısız`);
    } catch (error) {
      console.error('❌ Piyasa trend bildirimi hatası:', error);
    }
  }

  /**
   * Fiyat bildirimi kontrolü (her saat)
   */
  async checkPriceAlerts() {
    console.log('💰 Fiyat bildirimleri kontrol ediliyor...');

    try {
      // Bu kısmı daha sonra price_alerts tablosu ile detaylandırabiliriz
      // Şimdilik basit bir yapı
      console.log('✅ Fiyat bildirimleri kontrol edildi');
    } catch (error) {
      console.error('❌ Fiyat bildirimi hatası:', error);
    }
  }

  /**
   * Bildirim izni olan kullanıcıları getir
   */
  async getUsersWithNotificationEnabled(notificationType) {
    // Not: Bu özellik için users tablosuna notification_preferences sütunu eklenmeli
    // Şimdilik tüm kullanıcıları döndürüyoruz
    try {
      const result = await User.findAll();
      // notification_preferences sütunu eklendiğinde burada filtreleme yapılacak
      return result;
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
      return [];
    }
  }

  /**
   * Yardımcı: Sleep fonksiyonu
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Job'ları başlat
   */
  start() {
    console.log('📧 E-posta bildirim sistemi başlatılıyor...');

    // Günlük özet - her gün 09:00'da
    this.dailySummaryJob = cron.schedule('0 9 * * *', () => {
      this.sendDailySummary();
    }, {
      timezone: 'Europe/Istanbul'
    });

    // Piyasa trend - her 3 saatte bir
    this.marketTrendJob = cron.schedule('0 */3 * * *', () => {
      this.sendMarketTrendNotification();
    }, {
      timezone: 'Europe/Istanbul'
    });

    // Fiyat bildirimi - her saat
    cron.schedule('0 * * * *', () => {
      this.checkPriceAlerts();
    }, {
      timezone: 'Europe/Istanbul'
    });

    console.log('✅ E-posta bildirimleri aktif');
    console.log('  - Günlük özet: 09:00 (Europe/Istanbul)');
    console.log('  - Piyasa trend: Her 3 saat');
    console.log('  - Fiyat bildirimi: Her saat');
  }

  /**
   * Job'ları durdur
   */
  stop() {
    if (this.dailySummaryJob) {
      this.dailySummaryJob.stop();
    }
    if (this.marketTrendJob) {
      this.marketTrendJob.stop();
    }
    console.log('🛑 E-posta bildirimleri durduruldu');
  }
}

// Singleton instance
let emailNotificationInstance = null;

module.exports = {
  start: () => {
    if (!emailNotificationInstance) {
      emailNotificationInstance = new EmailNotificationJob();
    }
    emailNotificationInstance.start();
    return emailNotificationInstance;
  },

  getInstance: () => {
    if (!emailNotificationInstance) {
      emailNotificationInstance = new EmailNotificationJob();
    }
    return emailNotificationInstance;
  }
};
