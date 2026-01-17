import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const LanguageContext = createContext();

export const translations = {
    en: {
        // Navigation
        home: 'Home',
        news: 'News',
        stocks: 'Stocks',
        sources: 'RSS Sources',
        login: 'Login',
        logout: 'Logout',

        // Common
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        test: 'Test',

        // Stock Page
        stocksTitle: 'Stocks',
        addStock: 'Add Stock',
        updatePrices: 'Update All Prices',
        price: 'Price',
        change: 'Change',
        sector: 'Sector',
        symbol: 'Symbol',
        noStocks: 'No stocks. Click "+ Add Stock" to get started!',

        // Stock Detail
        priceChart: 'Price Chart',
        priceHistory: 'Price History',
        high: 'High',
        low: 'Low',
        volume: 'Volume',

        // News Page
        newsTitle: 'News',
        noNews: 'No news available. Click "Fetch All News" on RSS Sources page.',
        readOriginal: 'Read Original',
        backToNews: 'Back to News',

        // RSS Sources
        rssSourcesTitle: 'RSS Sources',
        fetchAllNews: 'Fetch All News',
        addSource: 'Add RSS Source',
        sourceName: 'Source Name',
        sourceUrl: 'Source URL',
        category: 'Category',
        status: 'Status',
        lastFetched: 'Last Fetched',
        noSources: 'No RSS sources. Add one above!',

        // Time periods
        '1W': '1 Week',
        '1M': '1 Month',
        '3M': '3 Months',
        '6M': '6 Months',
        '1Y': '1 Year',

        // Auth
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Password',
        fullNamePlaceholder: 'Full Name',
        register: 'Register',
        loggingIn: 'Logging in...',
        registering: 'Registering...',
        passwordMinLength: 'Password (min 6 characters)',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        loginFailed: 'Login failed',
        registrationFailed: 'Registration failed',
        pleaseLogin: 'Please login first',
        pleaseLoginAddSource: 'Please login to add sources',
        pleaseLoginFetchNews: 'Please login to fetch news',
        sourceAdded: 'Source added!',
        fetchedNews: 'Fetched! {count} sources processed',
        deleteConfirm: 'Delete this source?',
        itemCount: 'Success! Found {count} items',
        failed: 'Failed: ',
        error: 'Error: ',

        // Home Page
        heroSubtitle: 'AI-powered news and stock analytics',
        browseNews: 'Browse News',
        viewStocks: 'View Stocks',
        totalNews: 'Total News',
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
        recentNews: 'Recent News',
        noRecentNews: 'No news yet. Add RSS sources and fetch news!',

        // Messages
        loginFirst: 'Please login first',
        updatingPrices: 'Updating prices...',
        pricesUpdated: 'Prices updated!',
        fetchingNews: 'Fetching news...',
        newsFetched: 'News fetched successfully!'
    },
    tr: {
        // Navigation
        home: 'Ana Sayfa',
        news: 'Haberler',
        stocks: 'Hisseler',
        sources: 'RSS Kaynakları',
        login: 'Giriş Yap',
        logout: 'Çıkış Yap',

        // Common
        loading: 'Yükleniyor...',
        save: 'Kaydet',
        cancel: 'İptal',
        delete: 'Sil',
        edit: 'Düzenle',
        add: 'Ekle',
        search: 'Ara',
        filter: 'Filtrele',
        test: 'Test Et',

        // Stock Page
        stocksTitle: 'Hisseler',
        addStock: 'Hisse Ekle',
        updatePrices: 'Tüm Fiyatları Güncelle',
        price: 'Fiyat',
        change: 'Değişim',
        sector: 'Sektör',
        symbol: 'Sembol',
        noStocks: 'Henüz hisse yok. "+ Hisse Ekle" butonuna tıklayarak başlayın!',

        // Stock Detail
        priceChart: 'Fiyat Grafiği',
        priceHistory: 'Fiyat Geçmişi',
        high: 'Yüksek',
        low: 'Düşük',
        volume: 'Hacim',

        // News Page
        newsTitle: 'Haberler',
        noNews: 'Haber bulunamadı. RSS Kaynakları sayfasından "Tüm Haberleri Çek" butonuna tıklayın.',
        readOriginal: 'Orjinali Oku',
        backToNews: 'Haberlere Dön',

        // RSS Sources
        rssSourcesTitle: 'RSS Kaynakları',
        fetchAllNews: 'Tüm Haberleri Çek',
        addSource: 'RSS Kaynağı Ekle',
        sourceName: 'Kaynak Adı',
        sourceUrl: 'Kaynak URL',
        category: 'Kategori',
        status: 'Durum',
        lastFetched: 'Son Çekilme',
        noSources: 'RSS kaynağı yok. Yukarıdan ekleyin!',

        // Time periods
        '1W': '1 Hafta',
        '1M': '1 Ay',
        '3M': '3 Ay',
        '6M': '6 Ay',
        '1Y': '1 Yıl',

        // Auth
        emailPlaceholder: 'E-posta',
        passwordPlaceholder: 'Şifre',
        fullNamePlaceholder: 'Ad Soyad',
        register: 'Kayıt Ol',
        loggingIn: 'Giriş yapılıyor...',
        registering: 'Kayıt olunuyor...',
        passwordMinLength: 'Şifre (en az 6 karakter)',
        alreadyHaveAccount: 'Hesabınız var mı?',
        dontHaveAccount: 'Hesabınız yok mu?',
        loginFailed: 'Giriş başarısız',
        registrationFailed: 'Kayıt başarısız',
        pleaseLogin: 'Lütfen önce giriş yapın',
        pleaseLoginAddSource: 'Kaynak eklemek için lütfen giriş yapın',
        pleaseLoginFetchNews: 'Haberleri çekmek için lütfen giriş yapın',
        sourceAdded: 'Kaynak eklendi!',
        fetchedNews: 'Çekildi! {count} kaynak işlendi',
        deleteConfirm: 'Bu kaynağı silmek istiyor musunuz?',
        itemCount: 'Başarılı! {count} öğe bulundu',
        failed: 'Başarısız: ',
        error: 'Hata: ',

        // Home Page
        heroSubtitle: 'Yapay zeka destekli haber ve hisse analizi',
        browseNews: 'Haberlere Göz At',
        viewStocks: 'Hisseleri Görüntüle',
        totalNews: 'Toplam Haber',
        positive: 'Pozitif',
        negative: 'Negatif',
        neutral: 'Nötr',
        recentNews: 'Son Haberler',
        noRecentNews: 'Henüz haber yok. RSS kaynakları ekleyin ve haberleri çekin!',

        // Messages
        loginFirst: 'Lütfen önce giriş yapın',
        updatingPrices: 'Fiyatlar güncelleniyor...',
        pricesUpdated: 'Fiyatlar güncellendi!',
        fetchingNews: 'Haberler çekiliyor...',
        newsFetched: 'Haberler başarıyla çekildi!'
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [exchangeRate, setExchangeRate] = useState(35.0);

    useEffect(() => {
        // Load saved language preference
        const savedLang = localStorage.getItem('language');
        if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
            setLanguage(savedLang);
        }

        // Fetch exchange rates
        fetchExchangeRates();

        // Refresh rates every hour
        const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchExchangeRates = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/currency/rates');
            const result = await response.json();
            if (result.success && result.data.USD_TRY) {
                setExchangeRate(result.data.USD_TRY);
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        }
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, exchangeRate, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
