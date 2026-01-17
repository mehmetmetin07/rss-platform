import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol }) => {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !symbol) return;

    // Temizle
    while (containerRef.current && containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    if (scriptRef.current) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // TradingView widget container oluştur
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = '100%';
    container.style.width = '100%';
    
    // Widget config object
    const widgetConfig = {
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Europe/Istanbul',
      theme: 'light',
      style: '1',
      locale: 'tr',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: container.id || 'tv-widget',
      watchlist: [symbol]
    };

    // TradingView script oluştur
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    scriptRef.current = script;

    // Widget'ı initialize et
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget(widgetConfig);
      }
    };

    // Script'i body'ye ekle
    document.body.appendChild(script);
    
    // Container'ı ref içine ekle
    containerRef.current.appendChild(container);

    return () => {
      // Cleanup
      while (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      if (scriptRef.current) {
        try {
          document.body.removeChild(scriptRef.current);
        } catch (e) {
        }
        scriptRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-wrapper">
      <div 
        ref={containerRef}
        style={{
          height: '600px',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f9fafb'
        }}
      />
    </div>
  );
};

export default TradingViewWidget;
