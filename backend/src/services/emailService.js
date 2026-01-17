const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email konfigürasyonu eksik, e-posta sistemi çalışmayacak');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * E-posta gönder
   */
  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      console.warn('⚠️ E-posta servisi konfigüre edilmemiş');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html,
        text: text
      });

      console.log(`✅ E-posta gönderildi: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ E-posta gönderme hatası:', error);
      return false;
    }
  }

  /**
   * Haber özeti e-postası
   */
  async sendNewsSummary(email, newsData) {
    const { totalNews, positive, negative, neutral, topNews } = newsData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
          .stat { background: white; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 12px; color: #666; }
          .news-item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #ddd; }
          .news-title { font-weight: bold; margin-bottom: 5px; }
          .news-summary { font-size: 14px; color: #666; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
          .positive { border-left-color: #22c55e; }
          .negative { border-left-color: #ef4444; }
          .neutral { border-left-color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📰 Günlük Haber Özeti</h1>
            <p>Yeni haberler ve analizler</p>
          </div>
          <div class="content">
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${totalNews}</div>
                <div class="stat-label">Toplam Haber</div>
              </div>
              <div class="stat">
                <div class="stat-value" style="color: #22c55e;">${positive}</div>
                <div class="stat-label">Pozitif</div>
              </div>
              <div class="stat">
                <div class="stat-value" style="color: #ef4444;">${negative}</div>
                <div class="stat-label">Negatif</div>
              </div>
            </div>

            <h2>🔴 Öne Çıkan Haberler</h2>
            ${topNews.map(news => `
              <div class="news-item ${news.sentiment_category === 'positive' ? 'positive' : news.sentiment_category === 'negative' ? 'negative' : 'neutral'}">
                <div class="news-title">${news.title}</div>
                ${news.summary ? `<div class="news-summary">${news.summary}</div>` : ''}
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                  ${new Date(news.publish_date).toLocaleDateString('tr-TR')}
                </div>
              </div>
            `).join('')}

            <div class="footer">
              <p>Bu e-posta RSS & Borsa Platformu tarafından otomatik olarak gönderilmiştir.</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Platforma Git</a>
              </p>
              <p style="margin-top: 20px;">
                Bu e-postaları almak istemiyorsanız, lütfen ayarlarınızı güncelleyin.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Günlük Haber Özeti
      ================

      İstatistikler:
      - Toplam Haber: ${totalNews}
      - Pozitif: ${positive}
      - Negatif: ${negative}
      - Nötr: ${neutral}

      Öne Çıkan Haberler:
      ${topNews.map(news => `- ${news.title}`).join('\n')}

      ---
      RSS & Borsa Platformu
      ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    `;

    return this.sendEmail(email, '📰 Günlük Haber Özeti', html, text);
  }

  /**
   * Piyasa trend bildirimi
   */
  async sendMarketTrendAlert(email, trendData) {
    const { trend, confidence, key_factors, recommendation } = trendData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${trend === 'yukarı' ? '#22c55e' : trend === 'aşağı' ? '#ef4444' : '#6b7280'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .trend-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .up { background: #22c55e; color: white; }
          .down { background: #ef4444; color: white; }
          .neutral { background: #6b7280; color: white; }
          .factors { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Piyasa Trend Bildirimi</h1>
            <p>Haber bazlı piyasa analizi</p>
          </div>
          <div class="content">
            <div class="trend-badge ${trend === 'yukarı' ? 'up' : trend === 'aşağı' ? 'down' : 'neutral'}">
              Trend: ${trend.toUpperCase()} (Güven: ${(confidence * 100).toFixed(0)}%)
            </div>

            <h3>🔍 Ana Faktörler</h3>
            <div class="factors">
              <ul>
                ${key_factors.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>

            <div class="recommendation">
              <strong>💡 Öneri:</strong> ${recommendation === 'al' ? 'AL' : recommendation === 'sat' ? 'SAT' : 'BEKLE'}
            </div>

            <div class="footer">
              <p>Bu bildirim RSS & Borsa Platformu AI analiz sisteminden otomatik olarak oluşturulmuştur.</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/stocks">Hisse Detayları</a>
              </p>
              <p style="margin-top: 20px; font-size: 11px;">
                ⚠️ Bu bir yatırım tavsiyesi değildir. Karar vermeden önce kendi araştırmanızı yapın.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Piyasa Trend Bildirimi
      =====================

      Trend: ${trend.toUpperCase()}
      Güven: ${(confidence * 100).toFixed(0)}%

      Ana Faktörler:
      ${key_factors.map(f => `- ${f}`).join('\n')}

      Öneri: ${recommendation === 'al' ? 'AL' : recommendation === 'sat' ? 'SAT' : 'BEKLE'}

      ---
      ⚠️ Bu bir yatırım tavsiyesi değildir.
      ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    `;

    return this.sendEmail(email, `📈 Piyasa Trend: ${trend.toUpperCase()}`, html, text);
  }

  /**
   * Hisse senedi fiyat bildirimi
   */
  async sendPriceAlert(email, stockData) {
    const { symbol, name, current_price, change_percent, target_price } = stockData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .stock-info { background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 15px 0; }
          .stock-symbol { font-size: 24px; font-weight: bold; }
          .stock-name { font-size: 14px; color: #666; }
          .price { font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0; }
          .change { font-size: 18px; font-weight: bold; }
          .change.positive { color: #22c55e; }
          .change.negative { color: #ef4444; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Fiyat Bildirimi</h1>
          </div>
          <div class="content">
            <div class="stock-info">
              <div class="stock-symbol">${symbol}</div>
              <div class="stock-name">${name}</div>
              <div class="price">₺${current_price.toFixed(2)}</div>
              <div class="change ${change_percent >= 0 ? 'positive' : 'negative'}">
                ${change_percent >= 0 ? '+' : ''}${change_percent.toFixed(2)}%
              </div>
            </div>

            <div class="footer">
              <p>Hedef fiyat: ₺${target_price.toFixed(2)}</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/stocks/${symbol}">Detaylı İncele</a>
              </p>
              <p style="margin-top: 20px;">
                Bu bildirim RSS & Borsa Platformu tarafından gönderilmiştir.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Fiyat Bildirimi
      ==============

      ${symbol} - ${name}
      Fiyat: ₺${current_price.toFixed(2)}
      Değişim: ${change_percent >= 0 ? '+' : ''}${change_percent.toFixed(2)}%
      Hedef: ₺${target_price.toFixed(2)}

      ---
      ${process.env.FRONTEND_URL || 'http://localhost:3000'}/stocks/${symbol}
    `;

    return this.sendEmail(email, `💰 ${symbol} Fiyat Bildirimi`, html, text);
  }
}

// Singleton instance
let emailInstance = null;

module.exports = {
  getInstance: () => {
    if (!emailInstance) {
      emailInstance = new EmailService();
    }
    return emailInstance;
  }
};
