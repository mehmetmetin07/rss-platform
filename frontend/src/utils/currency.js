/**
 * Format price with currency based on language preference
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (USD, TRY, EUR, etc.)
 * @param {string} language - Language code ('en' or 'tr')
 * @param {number} exchangeRate - USD to TRY exchange rate
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency, language, exchangeRate) {
    if (!price || isNaN(price)) return 'N/A';

    // Special handling for TRY - always show with TL suffix
    if (currency === 'TRY') {
        const formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
        return `${formatted} TL`;
    }

    // English mode: Show only in original currency
    if (language === 'en') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    // Turkish mode: Convert USD to TL and show only TL
    if (language === 'tr') {
        const tryAmount = price * exchangeRate;

        const tryFormatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(tryAmount);

        return `${tryFormatted} TL`;
    }

    // Fallback
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(price);
}

/**
 * Format price for chart axis (shorter format)
 */
export function formatPriceShort(price, currency, language, exchangeRate) {
    if (!price || isNaN(price)) return '';

    // Special handling for TRY
    if (currency === 'TRY') {
        const formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
        return `${formatted} TL`;
    }

    if (language === 'tr') {
        const tryAmount = price * exchangeRate;
        const formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(tryAmount);
        return `${formatted} TL`;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}
