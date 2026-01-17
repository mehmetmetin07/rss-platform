const yahooFinance = require('yahoo-finance2').default;
const Stock = require('../models/Stock');
const PriceHistory = require('../models/PriceHistory');

class YahooFinanceService {
  /**
   * Hisse senedi fiyatını getir
   */
  static async getStockPrice(symbol) {
    try {
      const result = await yahooFinance.quote(symbol);
      
      return {
        symbol: result.symbol,
        price: result.regularMarketPrice,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        open: result.regularMarketOpen,
        volume: result.regularMarketVolume,
        marketCap: result.marketCap,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Yahoo Finance hatası (${symbol}):`, error.message);
      throw error;
    }
  }

  /**
   * Tarihsel fiyat verilerini getir (OHLCV)
   */
  static async getHistoricalData(symbol, options = {}) {
    try {
      const {
        period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Son 30 gün
        period2 = new Date(),
        interval = '1d' // 1d, 1wk, 1mo
      } = options;

      const result = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval
      });

      return result.quotes.map(quote => ({
        symbol,
        timestamp: new Date(quote.date),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume
      }));
    } catch (error) {
      console.error(`❌ Tarihsel veri hatası (${symbol}):`, error.message);
      throw error;
    }
  }

  /**
   * Çoklu hisse fiyatı getir
   */
  static async getMultipleStockPrices(symbols) {
    try {
      const result = await yahooFinance.quote(symbols);
      
      return Array.isArray(result) 
        ? result.map(r => ({
            symbol: r.symbol,
            price: r.regularMarketPrice,
            change: r.regularMarketChange,
            changePercent: r.regularMarketChangePercent,
            high: r.regularMarketDayHigh,
            low: r.regularMarketDayLow,
            open: r.regularMarketOpen,
            volume: r.regularMarketVolume,
            timestamp: new Date()
          }))
        : [{
            symbol: result.symbol,
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            changePercent: result.regularMarketChangePercent,
            high: result.regularMarketDayHigh,
            low: result.regularMarketDayLow,
            open: result.regularMarketOpen,
            volume: result.regularMarketVolume,
            timestamp: new Date()
          }];
    } catch (error) {
      console.error('❌ Çoklu fiyat hatası:', error.message);
      throw error;
    }
  }

  /**
   * Hisse senedi bilgilerini getir
   */
  static async getStockInfo(symbol) {
    try {
      const result = await yahooFinance.quote(symbol);

      return {
        symbol: result.symbol,
        name: result.longName || result.shortName,
        sector: result.sector,
        marketCap: result.marketCap,
        previousClose: result.previousClose,
        dayHigh: result.regularMarketDayHigh,
        dayLow: result.regularMarketDayLow,
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow,
        trailingPE: result.trailingPE,
        forwardPE: result.forwardPE,
        dividendYield: result.dividendYield
      };
    } catch (error) {
      console.error(`❌ Hisse bilgisi hatası (${symbol}):`, error.message);
      throw error;
    }
  }

  /**
   * Fiyatı veritabanına kaydet
   */
  static async savePriceData(symbol) {
    try {
      // Hisse senedi bilgisini güncelle
      const stock = await Stock.findBySymbol(symbol);
      
      if (!stock) {
        const stockInfo = await this.getStockInfo(symbol);
        await Stock.create({
          symbol: stockInfo.symbol,
          name: stockInfo.name,
          sector: stockInfo.sector
        });
      }

      // Fiyat verisini çek
      const priceData = await this.getStockPrice(symbol);
      
      // Price history'ye kaydet
      await PriceHistory.create({
        stock_id: (await Stock.findBySymbol(symbol)).id,
        timestamp: priceData.timestamp,
        open_price: priceData.open,
        high_price: priceData.high,
        low_price: priceData.low,
        close_price: priceData.price,
        volume: priceData.volume
      });

      console.log(`✅ Fiyat kaydedildi: ${symbol} - ${priceData.price}`);
      
      return priceData;
    } catch (error) {
      console.error(`❌ Fiyat kaydetme hatası (${symbol}):`, error.message);
      throw error;
    }
  }

  /**
   * Tarihsel verileri veritabanına kaydet
   */
  static async saveHistoricalData(symbol, options = {}) {
    try {
      const stock = await Stock.findBySymbol(symbol);
      
      if (!stock) {
        throw new Error(`Hisse senedi bulunamadı: ${symbol}`);
      }

      const historicalData = await this.getHistoricalData(symbol, options);
      
      let savedCount = 0;
      for (const data of historicalData) {
        try {
          await PriceHistory.create({
            stock_id: stock.id,
            timestamp: data.timestamp,
            open_price: data.open,
            high_price: data.high,
            low_price: data.low,
            close_price: data.close,
            volume: data.volume
          });
          savedCount++;
        } catch (error) {
          // Duplicate data, ignore
          continue;
        }
      }

      console.log(`✅ Tarihsel veri kaydedildi: ${symbol} - ${savedCount} kayıt`);
      
      return savedCount;
    } catch (error) {
      console.error(`❌ Tarihsel veri kaydetme hatası (${symbol}):`, error.message);
      throw error;
    }
  }

  /**
   * Tüm aktif hisselerin fiyatlarını güncelle
   */
  static async updateAllStockPrices() {
    try {
      const stocks = await Stock.findAll();
      const symbols = stocks.map(s => s.symbol);

      console.log(`🔄 ${symbols.length} hisse fiyatı güncelleniyor...`);
      const startTime = Date.now();

      const prices = await this.getMultipleStockPrices(symbols);
      
      let savedCount = 0;
      for (const priceData of prices) {
        try {
          const stock = await Stock.findBySymbol(priceData.symbol);
          await PriceHistory.create({
            stock_id: stock.id,
            timestamp: priceData.timestamp,
            open_price: priceData.open,
            high_price: priceData.high,
            low_price: priceData.low,
            close_price: priceData.price,
            volume: priceData.volume
          });
          savedCount++;
        } catch (error) {
          console.error(`❌ ${priceData.symbol} kaydedilemedi:`, error.message);
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Fiyatlar güncellendi: ${savedCount}/${symbols.length} (${duration.toFixed(2)}s)`);
      
      return savedCount;
    } catch (error) {
      console.error('❌ Toplu fiyat güncelleme hatası:', error.message);
      throw error;
    }
  }

  /**
   * Sembol doğrulama
   */
  static async validateSymbol(symbol) {
    try {
      await this.getStockPrice(symbol);
      return { valid: true, symbol };
    } catch (error) {
      return { valid: false, symbol, error: error.message };
    }
  }
}

module.exports = YahooFinanceService;
