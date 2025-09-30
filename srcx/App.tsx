import React, { useState, useEffect, useMemo } from 'react';
import { decodeData, encodeData } from './services/urlService';
import type { Participant, Match, ExchangeData } from './types';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';

const App: React.FC = () => {
    const [view, setView] = useState<'generator' | 'results'>('generator');
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleStateFromUrl = () => {
            try {
                const hash = window.location.hash.substring(1);
                // The search part is used for participant IDs (?id=...)
                const urlParams = new URLSearchParams(window.location.search);
                const idParam = urlParams.get('id');

                if (hash && hash.length > 20) { // Basic check for our encoded data
                    const decoded = decodeData(hash);
                    if (decoded) {
                        setExchangeData(decoded);
                        // The id is an index now, which is more robust for URL state
                        const participantIndex = idParam ? parseInt(idParam, 10) : null;
                        setParticipantId(participantIndex !== null && !isNaN(participantIndex) ? `p-${participantIndex}` : null);
                        setView('results');
                        setError('');
                    } else {
                        setError('The link is invalid or corrupted. Please check the link or ask the organizer to send it again.');
                        setView('generator'); // Fallback to generator on bad link
                    }
                } else {
                    // If there's no hash, ensure we are on the generator page.
                    setView('generator');
                    setExchangeData(null);
                }
            } catch (e) {
                console.error("Error processing URL state:", e);
                setError('There was an error reading the results from this link.');
                setView('generator');
            }
        };

        handleStateFromUrl(); // Run on initial load

        // Listen for hash changes to allow navigation between results and home.
        window.addEventListener('hashchange', handleStateFromUrl);
        return () => {
            window.removeEventListener('hashchange', handleStateFromUrl);
        };
    }, []);

    const handleGenerate = (data: ExchangeData) => {
        const encoded = encodeData(data);
        if (encoded) {
            // Set the search to empty for the organizer's view
            window.history.pushState(null, '', window.location.pathname);
            window.location.hash = encoded;
        } else {
            alert("Error: Could not generate a shareable link. Please try again.");
        }
    };
    
    // This is the main layout wrapper that was missing.
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
             <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {view === 'results' && exchangeData ? (
                    <ResultsPage data={exchangeData} participantId={participantId} />
                ) : (
                    <GeneratorPage onGenerate={handleGenerate} error={error} />
                )}
            </div>
        </div>
    );
};

export default App;
