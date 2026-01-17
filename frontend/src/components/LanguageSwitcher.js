import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
    ];

    const currentLang = languages.find(lang => lang.code === language) || languages[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (langCode) => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className="language-dropdown" ref={dropdownRef}>
            <button
                className="language-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select language"
            >
                <span className="language-flag">{currentLang.flag}</span>
                <span className="language-code">{currentLang.code.toUpperCase()}</span>
                <svg
                    className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                >
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {isOpen && (
                <div className="language-menu">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            className={`language-option ${language === lang.code ? 'active' : ''}`}
                            onClick={() => handleLanguageSelect(lang.code)}
                        >
                            <span className="option-flag">{lang.flag}</span>
                            <span className="option-name">{lang.name}</span>
                            {language === lang.code && (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="check-icon">
                                    <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LanguageSwitcher;
