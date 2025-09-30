import React, { useState, useEffect, useMemo } from 'react';
import { decodeData } from './services/urlService';
import { ExchangeData } from './types';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';

const LoadingSpinner: React.FC = () => (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[70]">
        <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-[var(--primary-color)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold text-slate-700 mt-4">Loading Your Event...</p>
        </div>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[70] p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
            <h2 className="text-2xl font-bold font-serif text-red-600 mb-3">Something Went Wrong</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <a href="/" className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-2 px-6 rounded-full">
                Start a New Game
            </a>
        </div>
    </div>
);

function App() {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleHashChange = () => {
            setIsLoading(true);
            setError(null);
            setExchangeData(null);

            const hash = window.location.hash.slice(1);
            if (hash) {
                try {
                    const [dataString, paramsString] = hash.split('?');
                    const decoded = decodeData(dataString);
                    setExchangeData(decoded);

                    if (paramsString) {
                        const params = new URLSearchParams(paramsString);
                        setParticipantId(params.get('id'));
                    } else {
                        setParticipantId(null);
                    }
                } catch (e) {
                    console.error("Failed to decode data from URL:", e);
                    setError("The event link is invalid or corrupted. Please check the link or create a new event.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false); // No hash, just show the generator
            }
        };

        handleHashChange(); // Initial load
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={error} />;
    }

    if (exchangeData) {
        return <ResultsPage data={exchangeData} currentParticipantId={participantId} />;
    }

    return <GeneratorPage />;
}

export default App;
