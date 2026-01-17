const News = require('../models/News');
const GeminiAIService = require('../services/geminiAI');

class AIAnalysisJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Bekleyen haberleri analiz et
   */
  async analyzePendingNews() {
    if (this.isRunning) {
      console.log('⏸️ AI analizi zaten çalışıyor');
      return;
    }

    this.isRunning = true;
    console.log('🤖 AI analizi başlıyor...');

    try {
      // Analiz edilmemiş haberleri getir
      const pendingNews = await News.findAll({
        limit: 50
      });

      const pendingAnalysis = pendingNews.filter(
        n => !n.sentiment_score || n.sentiment_score === 0
      );

      if (pendingAnalysis.length === 0) {
        console.log('✅ Analiz edilecek haber yok');
        return;
      }

      console.log(`📊 ${pendingAnalysis.length} haber analiz ediliyor...`);
      const startTime = Date.now();

      const geminiAI = GeminiAIService.getInstance();
      let successCount = 0;
      let failCount = 0;

      for (const newsItem of pendingAnalysis) {
        try {
          // Haber analizi
          const analysis = await geminiAI.analyzeNews({
            title: newsItem.title,
            content: newsItem.content
          });

          // News modeli güncelle
          await News.create({
            id: newsItem.id,
            title: newsItem.title,
            content: newsItem.content,
            url: newsItem.url,
            source_id: newsItem.source_id,
            publish_date: newsItem.publish_date,
            sentiment_score: analysis.sentiment_score,
            sentiment_category: analysis.sentiment_category,
            summary: analysis.summary,
            key_phrases: analysis.key_phrases,
            related_stocks: analysis.related_stocks
          });

          successCount++;
          console.log(`✅ Analiz tamamlandı: ${newsItem.title.substring(0, 50)}...`);
          
          // Rate limiting için kısa bekleme
          await this.sleep(1000);
        } catch (error) {
          failCount++;
          console.error(`❌ Analiz hatası (${newsItem.id}):`, error.message);
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ AI analizi tamamlandı: ${successCount} başarılı, ${failCount} başarısız (${duration.toFixed(2)}s)`);
    } catch (error) {
      console.error('❌ AI analizi hatası:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Belirtilen haberi yeniden analiz et
   */
  async reanalyzeNews(newsId) {
    try {
      const newsItem = await News.findById(newsId);
      
      if (!newsItem) {
        throw new Error('Haber bulunamadı');
      }

      console.log(`🤖 Haber yeniden analiz ediliyor: ${newsId}`);

      const geminiAI = GeminiAIService.getInstance();
      const analysis = await geminiAI.analyzeNews({
        title: newsItem.title,
        content: newsItem.content
      });

      await News.create({
        id: newsItem.id,
        title: newsItem.title,
        content: newsItem.content,
        url: newsItem.url,
        source_id: newsItem.source_id,
        publish_date: newsItem.publish_date,
        sentiment_score: analysis.sentiment_score,
        sentiment_category: analysis.sentiment_category,
        summary: analysis.summary,
        key_phrases: analysis.key_phrases,
        related_stocks: analysis.related_stocks
      });

      console.log(`✅ Haber yeniden analiz edildi: ${newsId}`);
      
      return analysis;
    } catch (error) {
      console.error(`❌ Haber yeniden analiz hatası (${newsId}):`, error);
      throw error;
    }
  }

  /**
   * Piyasa trend analizi
   */
  async analyzeMarketTrend() {
    try {
      // Son haberleri getir
      const recentNews = await News.findAll({
        limit: 20
      });

      if (recentNews.length < 5) {
        console.log('⚠️ Trend analizi için yeterli haber yok');
        return null;
      }

      console.log('📈 Piyasa trend analizi başlıyor...');

      const geminiAI = GeminiAIService.getInstance();
      const trend = await geminiAI.analyzeMarketTrend(recentNews);

      console.log(`✅ Trend analizi: ${trend.trend} (güven: ${(trend.confidence * 100).toFixed(0)}%)`);
      
      return trend;
    } catch (error) {
      console.error('❌ Trend analizi hatası:', error);
      return null;
    }
  }

  /**
   * Yardımcı: Sleep fonksiyonu
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let aiAnalysisInstance = null;

module.exports = {
  start: () => {
    if (!aiAnalysisInstance) {
      aiAnalysisInstance = new AIAnalysisJob();
    }
    return aiAnalysisInstance;
  },

  getInstance: () => {
    if (!aiAnalysisInstance) {
      aiAnalysisInstance = new AIAnalysisJob();
    }
    return aiAnalysisInstance;
  }
};
