const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-3-pro' // Gemini 3 Pro
    });
  }

  /**
   * Metin duygu analizi
   */
  async analyzeSentiment(text) {
    try {
      const prompt = `
        Analiz et ve sadece JSON formatında döndür:
        {
          "sentiment": "positive|negative|neutral|very_positive|very_negative",
          "score": 0 ile 1 arası ondalık sayı,
          "confidence": 0 ile 1 arası ondalık sayı,
          "key_topics": ["topic1", "topic2"],
          "related_stocks": ["SYMBOL1", "SYMBOL2"],
          "summary": "1-2 cümlelik özet"
        }

        Metin: ${text}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // JSON parse et
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        sentiment: 'neutral',
        score: 0.5,
        confidence: 0.5,
        key_topics: [],
        related_stocks: [],
        summary: text.substring(0, 200) + '...'
      };
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error);
      throw error;
    }
  }

  /**
   * Haber özeti oluştur
   */
  async summarizeNews(title, content) {
    try {
      const prompt = `
        Bu haber için Türkçe olarak 2-3 cümlelik özet oluştur:
        
        Başlık: ${title}
        İçerik: ${content}
        
        Özet:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Gemini summarization error:', error);
      throw error;
    }
  }

  /**
   * Haber başlığından hisse sembollerini çıkar
   */
  async extractStockSymbols(text) {
    try {
      const prompt = `
        Bu metinden BIST (Borsa İstanbul) hisse senedi sembollerini çıkar.
        Sadece sembol listesi döndür (örnek: THYAO, GARAN, AKBNK).
        
        Metin: ${text}
        
        Semboller:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Sembolleri parse et
      const symbols = textResponse
        .toUpperCase()
        .match(/[A-Z]{4,6}/g) || [];
      
      return [...new Set(symbols)]; // Duplicate'ları kaldır
    } catch (error) {
      console.error('Gemini stock extraction error:', error);
      return [];
    }
  }

  /**
   * Haber kategorisi belirle
   */
  async categorizeNews(title, content) {
    try {
      const prompt = `
        Bu haberi tek bir kategoriye ata:
        - Ekonomi
        - Teknoloji
        - Finans
        - Enerji
        - Sağlık
        - Sanayi
        - Uluslararası
        - Diğer
        
        Başlık: ${title}
        İçerik: ${content.substring(0, 500)}
        
        Kategori (sadece kategori adı):
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Gemini categorization error:', error);
      return 'Diğer';
    }
  }

  /**
   * Toplu haber analizi
   */
  async analyzeNews(newsItem) {
    try {
      const [sentiment, summary, stocks, category] = await Promise.all([
        this.analyzeSentiment(newsItem.title),
        this.summarizeNews(newsItem.title, newsItem.content),
        this.extractStockSymbols(newsItem.title + ' ' + newsItem.content),
        this.categorizeNews(newsItem.title, newsItem.content)
      ]);

      return {
        sentiment_score: sentiment.score,
        sentiment_category: sentiment.sentiment,
        summary: summary,
        key_phrases: sentiment.key_topics,
        related_stocks: stocks,
        category: category
      };
    } catch (error) {
      console.error('Gemini batch analysis error:', error);
      throw error;
    }
  }

  /**
   * Borsa trend analizi
   */
  async analyzeMarketTrend(newsList) {
    try {
      const newsText = newsList
        .map(n => `- ${n.title}`)
        .join('\n');

      const prompt = `
        Bu haberlere dayanarak BIST trend analizini Türkçe olarak yap:
        ${newsText}
        
        Analiz formatı:
        {
          "trend": "yukarı|aşağı|yatay|belirsiz",
          "confidence": 0 ile 1 arası,
          "key_factors": ["faktör1", "faktör2"],
          "recommendation": "al|sat|bekle"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        trend: 'belirsiz',
        confidence: 0.5,
        key_factors: [],
        recommendation: 'bekle'
      };
    } catch (error) {
      console.error('Gemini market trend error:', error);
      throw error;
    }
  }
}

// Singleton instance
let geminiInstance = null;

module.exports = {
  getInstance: () => {
    if (!geminiInstance) {
      geminiInstance = new GeminiAIService();
    }
    return geminiInstance;
  }
};
