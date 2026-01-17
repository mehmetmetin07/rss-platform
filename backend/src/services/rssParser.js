const Parser = require('rss-parser');
const RssSource = require('../models/RssSource');
const News = require('../models/News');

// Custom fields to extract images and more content
const parser = new Parser({
  timeout: 20000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded']
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9'
  },
  requestOptions: {
    rejectUnauthorized: false
  }
});

class RSSService {
  // Extract image URL from RSS item
  static extractImage(item) {
    // Try media:content
    if (item.mediaContent && item.mediaContent.length > 0) {
      const media = item.mediaContent[0];
      if (media.$ && media.$.url) return media.$.url;
    }

    // Try media:thumbnail
    if (item.mediaThumbnail && item.mediaThumbnail.$) {
      return item.mediaThumbnail.$.url;
    }

    // Try enclosure
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }

    // Try to find image in content
    const content = item.contentEncoded || item.content || item.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];

    return null;
  }

  // Extract full content
  static extractContent(item) {
    // Prefer content:encoded for full HTML content
    let content = item.contentEncoded || item.content || item.contentSnippet || item.description || '';

    // Strip HTML tags for clean text
    content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return content;
  }

  static async fetchFromSource(source) {
    console.log(`Fetching: ${source.name}`);

    try {
      const feed = await parser.parseURL(source.url);
      const items = [];

      for (const item of (feed.items || []).slice(0, 50)) {
        if (!item.title || !item.link) continue;

        try {
          const newsData = {
            title: item.title.trim(),
            content: this.extractContent(item),
            url: item.link.trim(),
            source_id: source.id,
            publish_date: item.isoDate || item.pubDate || new Date().toISOString(),
            image_url: this.extractImage(item)
          };

          const saved = News.create(newsData);
          if (saved) items.push(saved);
        } catch (e) {
          console.error(`Error saving item: ${e.message}`);
        }
      }

      RssSource.updateLastFetched(source.id, 'healthy');
      console.log(`✓ ${source.name}: ${items.length} items`);
      return { source: source.name, count: items.length, status: 'success' };
    } catch (error) {
      console.error(`✗ ${source.name}: ${error.message}`);
      RssSource.updateLastFetched(source.id, 'error');
      return { source: source.name, count: 0, status: 'error', error: error.message };
    }
  }

  static async fetchAll() {
    const sources = RssSource.findAll();
    const results = [];

    for (const source of sources) {
      const result = await this.fetchFromSource(source);
      results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    }

    return results;
  }

  static async testUrl(url) {
    try {
      const feed = await parser.parseURL(url);
      return {
        success: true,
        title: feed.title,
        itemCount: feed.items?.length || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = RSSService;
