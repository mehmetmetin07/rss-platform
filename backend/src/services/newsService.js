const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
});

class NewsService {
    /**
     * Fetch live news from Google News RSS for a specific stock
     * @param {string} symbol - Stock symbol (e.g. 'AAPL', 'THYAO.IS')
     * @param {string} stockName - Stock name (e.g. 'Apple Inc.', 'Türk Hava Yolları')
     * @param {number} limit - Maximum number of news items to return
     * @returns {Promise<Array>} Array of news items
     */
    static async fetchLiveNews(symbol, stockName, limit = 15) {
        try {
            // Clean symbol (remove .IS suffix for Turkish stocks)
            const cleanSymbol = symbol.replace('.IS', '');

            // Determine locale and suffix based on stock origin
            const isTurkishStock = symbol.toUpperCase().endsWith('.IS');
            const searchSuffix = isTurkishStock ? 'hisse' : 'stock';

            // Build search query
            const query = `${stockName} ${cleanSymbol} ${searchSuffix}`;
            const encodedQuery = encodeURIComponent(query);

            // Dynamic Google News RSS URL
            const hl = isTurkishStock ? 'tr' : 'en-US';
            const gl = isTurkishStock ? 'TR' : 'US';
            const ceid = isTurkishStock ? 'TR:tr' : 'US:en';

            const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

            console.log(`[NewsService] Fetching live news for: ${query} (Locale: ${hl}-${gl})`);

            // Parse RSS feed
            const feed = await parser.parseURL(rssUrl);

            if (!feed.items || feed.items.length === 0) {
                console.log('[NewsService] No news found');
                return [];
            }

            // Filter and transform news items
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const newsItems = feed.items
                .filter(item => {
                    // Filter: last 30 days only
                    const pubDate = new Date(item.pubDate || item.isoDate);
                    return pubDate > thirtyDaysAgo;
                })
                .slice(0, limit)
                .map((item, index) => ({
                    id: index + 1,
                    title: item.title,
                    content: item.contentSnippet || item.content || '',
                    url: item.link,
                    source_name: item.source?.title || 'Google News',
                    publish_date: item.isoDate || item.pubDate || new Date().toISOString()
                }));

            console.log(`[NewsService] Found ${newsItems.length} recent news items`);
            return newsItems;

        } catch (error) {
            console.error('[NewsService] Error fetching live news:', error.message);
            return [];
        }
    }
}

module.exports = NewsService;
