import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import ShareLinksModal from './components/ShareLinksModal';
import { parseExchangeData } from './services/urlService';
import type { ExchangeData } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import CookieConsentBanner from './components/CookieConsentBanner';
import { trackEvent, initAnalytics } from './services/analyticsService';

const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [initialModalView, setInitialModalView] = useState<string | null>(null);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowCookieBanner(true);
        } else if (consent === 'true') {
            initAnalytics();
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
            trackEvent('pwa_install_prompt_shown');
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            const urlParams = new URLSearchParams(window.location.search);
            const participantId = urlParams.get('id');

            if (hash) {
                const dataString = hash.split('?')[0];
                const data = parseExchangeData(dataString);
                if (data) {
                    fetch('/templates.json')
                        .then(res => res.json())
                        .then(bgOptions => {
                            setExchangeData({ ...data, backgroundOptions: bgOptions });
                        });

                    if (urlParams.get('share') === 'true') {
                       setIsShareModalOpen(true);
                    }
                    if (urlParams.get('view') === 'print') {
                        setIsShareModalOpen(true);
                        setInitialModalView('print');
                    }

                } else if (!participantId) {
                     // Invalid hash, clear it
                    window.location.hash = '';
                    setExchangeData(null);
                }
            } else {
                setExchangeData(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial check

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);
    
    const handleAcceptCookies = () => {
        localStorage.setItem('cookie_consent', 'true');
        initAnalytics();
        setShowCookieBanner(false);
        trackEvent('accept_cookies');
    };

    const handleDeclineCookies = () => {
        localStorage.setItem('cookie_consent', 'false');
        setShowCookieBanner(false);
        trackEvent('decline_cookies');
    };

    const handleInstallClick = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    trackEvent('pwa_install_accepted');
                } else {
                    trackEvent('pwa_install_dismissed');
                }
                setDeferredInstallPrompt(null);
            });
        }
    };
    
    const openShareModal = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('share', 'true');
        window.history.pushState({}, '', url);
        setIsShareModalOpen(true);
    }
    
    const closeShareModal = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('share');
        url.searchParams.delete('view');
        window.history.pushState({}, '', url);
        setIsShareModalOpen(false);
        setInitialModalView(null);
    }

    const renderContent = () => {
        // Here you would add logic to handle individual participant view based on `?id=`
        // For now, we'll just show Organizer view
        if (exchangeData) {
            return <ResultsPage exchangeData={exchangeData} onShareClick={openShareModal} />;
        }
        return <GeneratorPage />;
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {renderContent()}
            </main>
            <Footer showInstallButton={!!deferredInstallPrompt} onInstallClick={handleInstallClick} />
            <BackToTopButton />
            {isShareModalOpen && exchangeData && (
                <ShareLinksModal exchangeData={exchangeData} onClose={closeShareModal} initialView={initialModalView} />
            )}
            {showCookieBanner && (
                <CookieConsentBanner onAccept={handleAcceptCookies} onDecline={handleDeclineCookies} />
            )}
        </div>
    );
};

export default App;
