const axios = require('axios');

async function generateAnalysis(symbol, stockData, newsList, language, apiKey) {
    if (!apiKey) {
        throw new Error('GLM API Key is required');
    }

    try {
        const isTurkish = language === 'tr';

        // Prepare News Context
        let newsContext = isTurkish
            ? "Son 30 gün içinde bu hisse ile ilgili haber bulunamadı."
            : "No recent news available in the last 30 days.";

        if (newsList && newsList.length > 0) {
            newsContext = newsList.map((news, idx) =>
                `[${idx + 1}] ${news.source_name || 'News'} (${new Date(news.publish_date).toLocaleDateString()}): ${news.title}`
            ).join('\n');
        }

        // Build technical analysis summary
        let technicalSummary = '';
        if (stockData.fiftyDayAverage && stockData.twoHundredDayAverage) {
            const trend = stockData.price > stockData.fiftyDayAverage ?
                (isTurkish ? 'yükseliş trendinde' : 'in an uptrend') :
                (isTurkish ? 'düşüş trendinde' : 'in a downtrend');
            technicalSummary = isTurkish
                ? `\n\nTeknik Göstergeler:\n- 50 günlük ortalama: ${stockData.fiftyDayAverage} ${stockData.currency}\n- 200 günlük ortalama: ${stockData.twoHundredDayAverage} ${stockData.currency}\n- Fiyat ${trend}`
                : `\n\nTechnical Indicators:\n- 50-day MA: ${stockData.fiftyDayAverage} ${stockData.currency}\n- 200-day MA: ${stockData.twoHundredDayAverage} ${stockData.currency}\n- Price ${trend}`;
        }

        // Build fundamental summary
        let fundamentalSummary = '';
        if (stockData.trailingPE || stockData.marketCap) {
            fundamentalSummary = isTurkish ? '\n\nTemel Göstergeler:\n' : '\n\nFundamental Metrics:\n';
            if (stockData.trailingPE) {
                fundamentalSummary += isTurkish
                    ? `- F/K Oranı: ${stockData.trailingPE.toFixed(2)}\n`
                    : `- P/E Ratio: ${stockData.trailingPE.toFixed(2)}\n`;
            }
            if (stockData.marketCap) {
                const marketCapB = (stockData.marketCap / 1000000000).toFixed(2);
                fundamentalSummary += isTurkish
                    ? `- Piyasa Değeri: ${marketCapB}B ${stockData.currency}\n`
                    : `- Market Cap: ${marketCapB}B ${stockData.currency}\n`;
            }
        }

        // Build company info section
        let companyInfo = '';
        if (stockData.businessSummary) {
            companyInfo = isTurkish
                ? `\n\n## Şirket Hakkında\n${stockData.businessSummary}\n`
                : `\n\n## About the Company\n${stockData.businessSummary}\n`;

            if (stockData.industry || stockData.fullTimeEmployees) {
                companyInfo += isTurkish ? '\n**Detaylar:**\n' : '\n**Details:**\n';
                if (stockData.industry) companyInfo += `- ${isTurkish ? 'Sektör' : 'Industry'}: ${stockData.industry}\n`;
                if (stockData.fullTimeEmployees) companyInfo += `- ${isTurkish ? 'Çalışan Sayısı' : 'Employees'}: ${stockData.fullTimeEmployees.toLocaleString()}\n`;
            }
        }

        // Construct Prompt
        const promptText = isTurkish
            ? `Sen bir finansal analiz uzmanısın. ${stockData.name} (${symbol}) hissesi için aşağıdaki verilere dayanarak kapsamlı bir analiz yap.
${companyInfo}
## Piyasa Verileri
- Güncel Fiyat: ${stockData.price} ${stockData.currency}
- Değişim: ${stockData.change_percent > 0 ? '+' : ''}${stockData.change_percent}%
- Gün Aralığı: ${stockData.dayLow} - ${stockData.dayHigh} ${stockData.currency}
- Hacim: ${stockData.volume.toLocaleString()}${technicalSummary}${fundamentalSummary}

## Son Haberler (30 gün)
${newsContext}

## Görevin
1. **Temel Analiz:** F/K oranı ve piyasa değerine bakarak değerleme yap
2. **Teknik Analiz:** Trend, destek/direnç seviyeleri, hareketli ortalamalar
3. **Haber Analizi:** Haberlerin hisse üzerindeki etkisini değerlendir
4. **Risk Değerlendirmesi:** Potansiyel riskler neler?

**Önemli:** Haber referanslarını [1], [2] formatında göster. Kesinlikle AL/SAT tavsiyesi verme!

Markdown formatında yaz. Sonunda ekle: "Bu analiz yatırım tavsiyesi değildir."`
            : `You are a financial analysis expert. Provide a comprehensive analysis of ${stockData.name} (${symbol}) based on the data below.
${companyInfo}
## Market Data
- Current Price: ${stockData.price} ${stockData.currency}
- Change: ${stockData.change_percent > 0 ? '+' : ''}${stockData.change_percent}%
- Day Range: ${stockData.dayLow} - ${stockData.dayHigh} ${stockData.currency}
- Volume: ${stockData.volume.toLocaleString()}${technicalSummary}${fundamentalSummary}

## Recent News (Last 30 days)
${newsContext}

## Your Task
1. **Fundamental Analysis:** Evaluate valuation using P/E ratio and market cap
2. **Technical Analysis:** Assess trend, support/resistance, moving averages
3. **News Impact:** How do recent news affect sentiment?
4. **Risk Assessment:** What are potential risks?

**Important:** Reference news as [1], [2]. Do NOT provide buy/sell recommendations!

Write in Markdown format. End with: "This is not financial advice."`;

        // GLM-4.7 API Call
        console.log('[AI Service] Using GLM-4.7 for analysis');
        const response = await axios.post(
            'https://api.z.ai/api/coding/paas/v4/chat/completions',
            {
                model: 'glm-4.7',
                messages: [{
                    role: 'user',
                    content: promptText
                }],
                thinking: {
                    type: 'enabled'
                },
                temperature: 0.6,
                max_tokens: 4096
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const analysisText = response.data?.choices?.[0]?.message?.content;

        if (!analysisText) {
            throw new Error('No analysis text received from GLM-4.7 API');
        }

        return analysisText;

    } catch (error) {
        const fs = require('fs');
        const errorLog = {
            timestamp: new Date().toISOString(),
            errorType: error.constructor?.name,
            message: error.message,
            responseStatus: error.response?.status,
            responseData: error.response?.data,
            stack: error.stack
        };

        // Write to file for debugging
        fs.writeFileSync(
            require('path').join(__dirname, '../../ai-error.log'),
            JSON.stringify(errorLog, null, 2)
        );

        console.error('=== AI API Error Details ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error('Full error written to ai-error.log');
        console.error('================================');

        // Better error messages
        if (error.response?.status === 404) {
            throw new Error('AI model not found. Please verify API access.');
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error('Invalid API Key. Please verify in Settings.');
        }
        if (error.response?.status === 400) {
            throw new Error('Bad request to AI API. Please contact support.');
        }

        throw new Error(`AI analysis failed: ${error.message}`);
    }
}

module.exports = { generateAnalysis };
