import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import { parseExchangeData } from './services/urlService';
import type { ExchangeData } from './types';

const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const hash = window.location.hash.slice(1);
            if (hash) {
                const parsedData = parseExchangeData(hash);
                if (parsedData) {
                    // Fetch background options separately as they are not serialized in the URL
                    fetch('/templates.json')
                        .then(res => res.json())
                        .then(backgroundOptions => {
                            const fullData: ExchangeData = { ...parsedData, backgroundOptions };
                            setExchangeData(fullData);

                            const params = new URLSearchParams(window.location.search);
                            const id = params.get('id');
                            setParticipantId(id);
                        })
                        .catch(err => {
                             console.error("Failed to load background options", err);
                             // Fallback to generator page if templates are missing
                             setExchangeData(null);
                        });
                }
            }
        } catch (error) {
            console.error("Error parsing data from URL", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <img src="/logo_256.png" alt="Loading" className="w-24 h-24 mx-auto animate-pulse" />
                    <p className="text-slate-500 mt-4">Loading your exchange...</p>
                </div>
            </div>
        );
    }

    if (exchangeData) {
        return <ResultsPage data={exchangeData} currentParticipantId={participantId} />;
    }

    // Default to GeneratorPage if no valid hash data
    return <GeneratorPage />;
};

export default App;
