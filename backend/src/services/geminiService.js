const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateAnalysis(symbol, stockData, newsList, language, apiKey) {
    if (!apiKey) {
        throw new Error('Gemini API Key is required');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const isTurkish = language === 'tr';

    // Construct News Context
    let newsContext = "No recent news available.";
    if (newsList && newsList.length > 0) {
        newsContext = newsList.map((n, i) =>
            `${i + 1}. [${n.source_name}] ${n.title} - ${n.summary || n.content?.substring(0, 200)}...`
        ).join('\n');
    }

    const systemPrompt = isTurkish
        ? `Rol: Finansal Analist Asistanı (Tarafsız ve Temkinli)
           Görev: Aşağıdaki haber bağlamına dayanarak ${stockData.name} ({symbol}) için piyasa duyarlılığını analiz et.
           
           Kurallar:
           1. KESİNLİKLE yatırım tavsiyesi verme.
           2. SADECE sağlanan haberleri kaynak olarak kullan. Haberlerde yoksa uydurma.
           3. "Haberlere göre...", "Piyasa verileri şunu gösteriyor..." gibi ifadeler kullan.
           4. Yorumun kısa, öz ve Markdown formatında olsun.
           5. Haber kaynağı belirt (örn: "Reuters'ın haberine göre...").
           
           Piyasa Verisi: Fiyat: ${stockData.price} ${stockData.currency}, Değişim: %${stockData.change_percent}`

        : `Role: Financial Analyst Assistant (Neutral & Cautious)
           Task: Analyze market sentiment for ${stockData.name} ({symbol}) based ONLY on the news context below.
           
           Constraints:
           1. Do NOT provide financial advice.
           2. Use ONLY the provided news as sources. Do not hallucinate.
           3. Use phrases like "According to reports...", "Market sentiment suggests...".
           4. Keep it concise and in Markdown format.
           5. Cite sources (e.g., "As reported by Reuters...").
           
           Market Data: Price: ${stockData.price} ${stockData.currency}, Change: ${stockData.change_percent}%`;

    const userMessage = `
    News Context:
    ${newsContext}
    
    Please provide your analysis.`;

    try {
        const result = await model.generateContent([systemPrompt, userMessage]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate analysis. Please check your API Key.');
    }
}

module.exports = { generateAnalysis };
