const Stock = require('../models/Stock');
const PriceHistory = require('../models/PriceHistory');

let yfInstance = null;

async function getYahooFinance() {
  if (!yfInstance) {
    const yf = require('yahoo-finance2').default;
    // Fix: yf is the class constructor, so we must call new yf()
    yfInstance = new yf();
  }
  return yfInstance;
}

class StockService {
  static async getPrice(symbol) {
    try {
      const yf = await getYahooFinance();
      let result = null;

      try {
        result = await yf.quote(symbol);
      } catch (e) {
        // If direct quote fails, try searching
        console.log(`Quote failed for ${symbol}, trying search...`);
      }

      // If no result or no price, try smart search
      if (!result || !result.regularMarketPrice) {
        const searchResult = await yf.search(symbol);
        if (searchResult.quotes && searchResult.quotes.length > 0) {
          const distinctSymbol = searchResult.quotes[0].symbol;
          console.log(`Found alternative symbol: ${distinctSymbol}`);
          result = await yf.quote(distinctSymbol);
        }
      }

      if (!result || !result.regularMarketPrice) {
        console.log(`No data for ${symbol}`);
        return null;
      }

      // Fix: Borsa Istanbul stocks (.IS) should always be in TRY
      const currency = symbol.toUpperCase().endsWith('.IS') ? 'TRY' : (result.currency || 'USD');

      return {
        symbol: result.symbol,
        price: result.regularMarketPrice || 0,
        change: result.regularMarketChange || 0,
        changePercent: result.regularMarketChangePercent || 0,
        high: result.regularMarketDayHigh || 0,
        low: result.regularMarketDayLow || 0,
        open: result.regularMarketOpen || 0,
        volume: result.regularMarketVolume || 0,
        currency: currency,
        name: result.longName || result.shortName || result.symbol
      };
    } catch (error) {
      console.error(`Stock error (${symbol}): ${error.message}`);
      return null;
    }
  }

  static async getQuotes(symbols) {
    try {
      const yf = await getYahooFinance();
      const results = await yf.quote(symbols);
      // Ensure results is an array even for single symbol
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      console.error(`Bulk fetch error: ${error.message}`);
      return [];
    }
  }

  static async updateAllPrices() {
    const stocks = Stock.findAll();
    console.log(`Found ${stocks.length} stocks to update`);

    // Batch size of 30 to respect API limits but be faster
    const BATCH_SIZE = 30;
    let updated = 0;

    for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
      const batch = stocks.slice(i, i + BATCH_SIZE);
      const symbols = batch.map(s => s.symbol);

      console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(stocks.length / BATCH_SIZE)}: ${symbols.join(', ')}`);

      try {
        const quotes = await this.getQuotes(symbols);

        for (const quote of quotes) {
          if (!quote || !quote.regularMarketPrice) continue;

          const stock = batch.find(s => s.symbol === quote.symbol);
          if (stock) {
            Stock.updatePrice(stock.id, quote.regularMarketPrice, quote.regularMarketChangePercent, quote.currency);

            // Only add history record if price changed or it's been > 5 mins (optimization)
            // For now, we'll just add it to ensure history density
            PriceHistory.create({
              stock_id: stock.id,
              price: quote.regularMarketPrice,
              open_price: quote.regularMarketOpen,
              high_price: quote.regularMarketDayHigh,
              low_price: quote.regularMarketDayLow,
              volume: quote.regularMarketVolume
            });
            updated++;
          }
        }
      } catch (e) {
        console.error(`Batch error: ${e.message}`);
      }

      // Small delay between batches
      await new Promise(r => setTimeout(r, 2000));
    }

    return updated;
  }

  static async validateSymbol(symbol) {
    try {
      const data = await this.getPrice(symbol);
      return { valid: !!data, data };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Get enhanced quote with fundamental and technical metrics
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Enhanced stock data
   */
  static async getEnhancedQuote(symbol) {
    try {
      const yf = await getYahooFinance();
      const quote = await yf.quote(symbol);

      if (!quote || !quote.regularMarketPrice) {
        return null;
      }

      // Fix: Borsa Istanbul stocks (.IS) should always be in TRY
      const currency = symbol.toUpperCase().endsWith('.IS') ? 'TRY' : (quote.currency || 'USD');

      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        change_percent: quote.regularMarketChangePercent || 0,
        currency: currency,

        // Company information
        businessSummary: quote.longBusinessSummary || null,
        industry: quote.industry || null,
        sector: quote.sector || null,
        website: quote.website || null,
        fullTimeEmployees: quote.fullTimeEmployees || null,

        // Fundamental metrics
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        marketCap: quote.marketCap || null,

        // Technical indicators
        fiftyDayAverage: quote.fiftyDayAverage || null,
        twoHundredDayAverage: quote.twoHundredDayAverage || null,

        // Volume metrics
        volume: quote.regularMarketVolume || 0,
        averageVolume: quote.averageVolume || quote.averageDailyVolume10Day || null,

        // Day range
        dayHigh: quote.regularMarketDayHigh || 0,
        dayLow: quote.regularMarketDayLow || 0,
        dayOpen: quote.regularMarketOpen || 0
      };
    } catch (error) {
      console.error(`Enhanced quote error (${symbol}): ${error.message}`);
      return null;
    }
  }
}

module.exports = StockService;
