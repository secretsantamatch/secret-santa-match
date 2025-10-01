import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import { decodeData } from './services/urlService';
import type { ExchangeData } from './types';

const App: React.FC = () => {
    const [page, setPage] = useState<'generator' | 'results' | 'loading' | 'error'>('loading');
    const [data, setData] = useState<ExchangeData | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const loadPage = () => {
            const hash = window.location.hash.slice(1).split('?')[0]; // Ignore query params in hash for decoding
            if (hash) {
                try {
                    const decoded = decodeData(hash);
                    if (!decoded || !decoded.p || !decoded.m || !decoded.style) {
                        throw new Error('Invalid or corrupted data in the URL.');
                    }
                    setData(decoded);
                    setPage('results');
                } catch (e) {
                    console.error(e);
                    setErrorMsg('This Secret Santa link is invalid, corrupted, or has expired.');
                    setPage('error');
                }
            } else {
                setPage('generator');
            }
        };

        window.addEventListener('hashchange', loadPage);
        loadPage(); // Initial load

        return () => window.removeEventListener('hashchange', loadPage);
    }, []);

    if (page === 'loading') {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[60]">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-[var(--primary-color)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-semibold mt-4 text-slate-700">Loading your exchange...</p>
              </div>
            </div>
        );
    }

    if (page === 'error') {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Link Error</h1>
              <p className="text-slate-700">{errorMsg}</p>
              <a href="/" className="mt-6 inline-block bg-[var(--primary-color)] text-white font-bold py-2 px-6 rounded-lg">
                Start a New Game
              </a>
            </div>
          </div>
        );
    }
    
    if (page === 'results' && data) {
        const params = new URLSearchParams(window.location.search);
        const participantId = params.get('id');
        return <ResultsPage data={data} currentParticipantId={participantId} />;
    }

    return <GeneratorPage />;
};

export default App;
