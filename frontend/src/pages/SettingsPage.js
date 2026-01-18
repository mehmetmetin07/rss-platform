import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

function SettingsPage() {
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        checkKeyStatus();
    }, []);

    const checkKeyStatus = async () => {
        try {
            const res = await api.getApiKeyStatus();
            setSavedKey(res.maskedGLMKey);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.saveApiKey(apiKey);
            setMessage(t('keySaved'));
            setApiKey('');
            checkKeyStatus();
        } catch (error) {
            setMessage(t('error') + error.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('deleteConfirm'))) return;
        try {
            await api.removeApiKey();
            setSavedKey(null);
            setMessage(t('keyRemoved'));
        } catch (error) {
            setMessage(t('error') + error.message);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <h1>{t('settings')}</h1>

            <div className="settings-card">
                <h2>{t('aiSettings')}</h2>
                <p className="settings-desc">{t('aiSettingsDesc')}</p>

                <div className="key-status">
                    <span className="label">{t('currentKey')}: </span>
                    {savedKey ? (
                        <span className="key-badge success">
                            {savedKey}
                            <button onClick={handleDelete} className="btn-icon" title={t('delete')}>
                                ✕
                            </button>
                        </span>
                    ) : (
                        <span className="key-badge warning">{t('noKeyFound')}</span>
                    )}
                </div>

                <form onSubmit={handleSave} className="settings-form">
                    <div className="input-group">
                        <input
                            type={showKey ? "text" : "password"}
                            className="input"
                            placeholder="Z.AI GLM-4.7 API Key..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="btn-toggle"
                            onClick={() => setShowKey(!showKey)}
                        >
                            {showKey ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary">{t('saveKey')}</button>
                </form>
            </div>

            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default SettingsPage;
