const axios = require('axios');

async function generateAnalysis(symbol, stockData, newsList, language, apiKey) {
    if (!apiKey) {
        throw new Error('Gemini API Key is missing');
    }

    try {
        const isTurkish = language === 'tr';

        // Prepare News Context
        let newsContext = "No recent news available.";
        if (newsList && newsList.length > 0) {
            newsContext = newsList.map((news, idx) =>
                `[${idx + 1}] ${news.source_name || 'News'}: ${news.title} - ${news.summary || news.content?.substring(0, 200)}...`
            ).join('\n\n');
        }

        // Construct Prompt
        const promptText = isTurkish
            ? `Sen bir finansal analiz asistanısın. Görevin, sadece sağlanan haberlere dayanarak ${stockData.name} (${symbol}) hissesi için piyasa duyarlılığını analiz etmektir.

Piyasa Verileri:
- Fiyat: ${stockData.price} ${stockData.currency}
- Değişim: ${stockData.change_percent}%

Haber Bağlamı:
${newsContext}

Kurallar:
1. SADECE yukarıdaki haberleri kaynak olarak kullan.
2. Haber numaralarını referans göster (örn: [1], [2]).
3. Kesinlikle yatırım tavsiyesi verme.
4. Kısa ve öz, Markdown formatında yaz.
5. "Piyasa verileri...", "Haberlere göre..." gibi ifadeler kullan.

Sonunda şunu ekle: "Bu analiz yatırım tavsiyesi değildir."`
            : `You are a financial analysis assistant. Your task is to analyze market sentiment for ${stockData.name} (${symbol}) based ONLY on the provided news context.

Market Data:
- Price: ${stockData.price} ${stockData.currency}
- Change: ${stockData.change_percent}%

News Context:
${newsContext}

Rules:
1. Use ONLY the news above as sources.
2. Reference news items by number (e.g., [1], [2]).
3. Do NOT provide investment advice.
4. Keep it concise and in Markdown format.
5. Use phrases like "According to reports...", "Market data suggests...".

End with: "This is not financial advice."`;

        // Z.AI GLM-4.7 API (Coding endpoint for GLM Coding Plan)
        const response = await axios.post(
            'https://api.z.ai/api/coding/paas/v4/chat/completions',
            {
                model: 'glm-4.7',
                messages: [{
                    role: 'user',
                    content: promptText
                }],
                thinking: {
                    type: 'enabled'  // Enable GLM-4.7's thinking mode
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

        // Extract text from OpenAI-compatible response
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

        console.error('=== Gemini API Error Details ===');
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
