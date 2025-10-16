import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import { decodeData } from './services/urlService';
import type { ExchangeData } from './types';

const loadTrackingScripts = () => {
  if ((window as any).trackingScriptsLoaded) {
    return;
  }
  (window as any).trackingScriptsLoaded = true;

  // Pinterest
  const pScript = document.createElement('script');
  pScript.type = 'text/javascript';
  pScript.innerHTML = `
    !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(
    Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src="https://s.pinimg.com/ct/core.js";var
    r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', '2612962984250');
    pintrk('page');
    pintrk('track', 'pagevisit');
  `;
  document.head.appendChild(pScript);

  const pNoscript = document.createElement('noscript');
  const pImg = document.createElement('img');
  pImg.height = 1;
  pImg.width = 1;
  pImg.style.display = 'none';
  pImg.alt = '';
  pImg.src = "https://ct.pinterest.com/v3/?tid=2612962984250&noscript=1";
  pNoscript.appendChild(pImg);
  document.body.insertBefore(pNoscript, document.body.firstChild);

  // Google AdSense
  const adScript = document.createElement('script');
  adScript.async = true;
  adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3037944530219260";
  adScript.crossOrigin = "anonymous";
  document.head.appendChild(adScript);

  // Google Analytics (GA4)
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-HG140X6CQ6";
  document.head.appendChild(gaScript);

  const gaConfigScript = document.createElement('script');
  gaConfigScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-HG140X6CQ6');
  `;
  document.head.appendChild(gaConfigScript);
};


const App: React.FC = () => {
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted') {
      loadTrackingScripts();
    } else if (!consent) {
      setShowCookieBanner(true);
    }

    const handleHashChange = () => {
      try {
        setError(null);
        const hash = window.location.hash.slice(1);
        const searchParams = new URLSearchParams(window.location.search);
        
        if (hash) {
          const mainHash = hash.split('?')[0];
          const decoded = decodeData(mainHash);
          setExchangeData(decoded);
          
          // Set theme based on data from URL
          if (decoded.pageTheme) {
            document.documentElement.dataset.theme = decoded.pageTheme;
          } else {
            document.documentElement.dataset.theme = 'default';
          }

          // Check for participant ID in either hash or query string
          const hashParams = new URLSearchParams(hash.split('?')[1] || '');
          const id = searchParams.get('id') || hashParams.get('id');
          setParticipantId(id);
          
        } else {
          setExchangeData(null);
          setParticipantId(null);
          document.documentElement.dataset.theme = 'default'; // Reset to default theme
        }
      } catch (e) {
        console.error(e);
        setError("The link you followed seems to be broken or corrupted. Please check the link and try again.");
        setExchangeData(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowCookieBanner(false);
    loadTrackingScripts();
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShowCookieBanner(false);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
          <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1>
          <p className="text-slate-700 text-lg">{error}</p>
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
            Start a New Game
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {exchangeData ? (
        <ResultsPage data={exchangeData} currentParticipantId={participantId} />
      ) : (
        <GeneratorPage />
      )}
      {showCookieBanner && (
        <CookieConsentBanner
          onAccept={handleAcceptCookies}
          onDecline={handleDeclineCookies}
        />
      )}
    </>
  );
};

export default App;
