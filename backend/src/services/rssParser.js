const Parser = require('rss-parser');
const RssSource = require('../models/RssSource');
const News = require('../models/News');

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['pubDate', 'publish_date'],
      ['content:encoded', 'content'],
      ['description', 'description']
    ]
  }
});

class RSSParserService {
  /**
   * Tüm RSS kaynaklarından haber çeker
   */
  static async fetchAllSources() {
    const sources = await RssSource.findAll();
    const results = [];

    for (const source of sources) {
      try {
        const news = await this.fetchFromSource(source);
        results.push({
          source: source.name,
          count: news.length,
          status: 'success'
        });
        
        // Kaynak sağlık durumunu güncelle
        await RssSource.updateHealthStatus(source.id, 'healthy', 100);
      } catch (error) {
        console.error(`❌ RSS kaynağı hatası (${source.name}):`, error.message);
        results.push({
          source: source.name,
          count: 0,
          status: 'error',
          error: error.message
        });
        
        // Kaynak sağlık durumunu güncelle
        await RssSource.updateHealthStatus(source.id, 'unhealthy', 0);
      }
    }

    return results;
  }

  /**
   * Tek bir RSS kaynağından haber çeker
   */
  static async fetchFromSource(source) {
    const feed = await parser.parseURL(source.url);
    const newsItems = [];

    const maxNews = parseInt(process.env.MAX_NEWS_PER_SOURCE) || 50;

    for (const item of feed.items.slice(0, maxNews)) {
      try {
        const newsData = {
          title: item.title || '',
          content: item.content || item.description || '',
          url: item.link || item.guid || '',
          source_id: source.id,
          publish_date: new Date(item.pubDate || item.isoDate || Date.now())
        };

        // Aynı URL'den haber var mı kontrol et
        const existingNews = await News.findByUrl(newsData.url);
        
        if (!existingNews) {
          // Yeni haberi kaydet
          const savedNews = await News.create(newsData);
          newsItems.push(savedNews);
        } else {
          // Mevcut haberi güncelle
          await News.create(newsData);
        }
      } catch (error) {
        console.error(`❌ Haber işleme hatası:`, error.message);
      }
    }

    console.log(`✅ ${source.name}: ${newsItems.length} haber işlendi`);
    return newsItems;
  }

  /**
   * Manuel haber çekme (cron job için)
   */
  static async fetchNews() {
    console.log('🔄 RSS haber çekme başladı...');
    const startTime = Date.now();
    
    const results = await this.fetchAllSources();
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ RSS haber çekme tamamlandı (${duration.toFixed(2)}s)`);
    
    return results;
  }

  /**
   * Test amaçlı tek kaynak çekme
   */
  static async testSource(sourceUrl) {
    try {
      const feed = await parser.parseURL(sourceUrl);
      return {
        success: true,
        title: feed.title,
        itemCount: feed.items.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RSSParserService;
