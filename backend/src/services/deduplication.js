const similarity = require('similarity');
const News = require('../models/News');

const SIMILARITY_THRESHOLD = 0.85; // %85 benzerlik üstü aynı haber sayılır
const TIME_WINDOW_HOURS = 6; // Son 6 saat içindeki haberleri karşılaştır

class DeduplicationService {
  /**
   * Haberlerdeki HTML taglerini temizler
   */
  static cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // HTML taglerini kaldır
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluk yap
      .trim();
  }

  /**
   * İlk 200 karakterin hash'ini oluşturur
   */
  static createFingerprint(text) {
    const cleaned = this.cleanText(text);
    const firstChars = cleaned.substring(0, 200).toLowerCase();
    return this.hashString(firstChars);
  }

  /**
   * Basit hash fonksiyonu
   */
  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32-bit integer'a çevir
    }
    return Math.abs(hash).toString();
  }

  /**
   * İki metnin benzerliğini hesaplar
   */
  static calculateSimilarity(text1, text2) {
    const cleaned1 = this.cleanText(text1);
    const cleaned2 = this.cleanText(text2);

    // Başlık benzerliği
    const titleSimilarity = similarity(cleaned1, cleaned2);

    return titleSimilarity;
  }

  /**
   * Aynı zaman penceresindeki haberleri bulur
   */
  static async getRecentNews(timeWindowHours = TIME_WINDOW_HOURS) {
    const query = `
      SELECT * FROM news 
      WHERE is_duplicate = false
        AND created_at > NOW() - INTERVAL '${timeWindowHours} hours'
      ORDER BY created_at DESC
    `;
    
    const result = await News.findAll({
      limit: 1000 // Son 1000 haber
    });
    
    return result;
  }

  /**
   * Tekilleştirme işlemi
   */
  static async deduplicate(newsId) {
    const news = await News.findById(newsId);
    if (!news || news.is_duplicate) return;

    const recentNews = await this.getRecentNews();
    let foundDuplicate = false;
    let duplicateOfId = null;

    for (const existingNews of recentNews) {
      // Kendini atla
      if (existingNews.id === newsId) continue;

      // URL kontrolü
      if (existingNews.url === news.url) {
        duplicateOfId = existingNews.id;
        foundDuplicate = true;
        break;
      }

      // Başlık benzerliği kontrolü
      const similarity = this.calculateSimilarity(news.title, existingNews.title);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        // Daha eski haber duplicate_of olur
        duplicateOfId = existingNews.id;
        foundDuplicate = true;
        break;
      }

      // İçerik fingerprint kontrolü
      const fp1 = this.createFingerprint(news.content);
      const fp2 = this.createFingerprint(existingNews.content);
      
      if (fp1 === fp2) {
        duplicateOfId = existingNews.id;
        foundDuplicate = true;
        break;
      }
    }

    if (foundDuplicate && duplicateOfId) {
      await News.markAsDuplicate(newsId, duplicateOfId);
      console.log(`🔄 Haber tekrar edildi (ID: ${newsId} -> ${duplicateOfId})`);
      return { duplicate: true, originalId: duplicateOfId };
    }

    return { duplicate: false };
  }

  /**
   * Toplu tekilleştirme
   */
  static async batchDeduplicate(limit = 100) {
    const recentNews = await News.getRecentNews(limit);
    const results = {
      total: recentNews.length,
      duplicates: 0,
      originals: 0
    };

    for (const news of recentNews) {
      if (news.is_duplicate) continue;

      const result = await this.deduplicate(news.id);
      
      if (result.duplicate) {
        results.duplicates++;
      } else {
        results.originals++;
      }
    }

    console.log(`✅ Tekilleştirme tamamlandı: ${results.originals} orijinal, ${results.duplicates} kopya`);
    return results;
  }

  /**
   * İstatistiksel özet
   */
  static async getStats() {
    const stats = await News.getStats();
    return {
      ...stats,
      similarity_threshold: SIMILARITY_THRESHOLD * 100,
      time_window_hours: TIME_WINDOW_HOURS
    };
  }
}

module.exports = DeduplicationService;
