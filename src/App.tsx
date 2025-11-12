import React, { useState, useEffect } from 'react';
// FIX: Removed file extensions from imports to resolve TypeScript build error.
import GeneratorPage from './components/GeneratorPage';
// FIX: Removed file extensions from imports to resolve TypeScript build error.
import ResultsPage from './components/ResultsPage';
// FIX: Removed file extensions from imports to resolve TypeScript build error.
import type { ExchangeData } from './types';

const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Reset state for re-fetches on hash change
                setExchangeData(null);
                setError(null);
                setIsLoading(true);

                const hash = window.location.hash.slice(1);
                if (hash) {
                    const exchangeId = hash.split('?')[0]; // Clean params
                    if (!exchangeId) {
                        // No ID, so just show the generator page
                    } else {
                        const exchangeRes = await fetch(`/.netlify/functions/get-exchange?id=${exchangeId}`);
                        if (!exchangeRes.ok) {
                            throw new Error(`Could not find the gift exchange. Please check the link or contact your organizer.`);
                        }
                        const exchangePayload = await exchangeRes.json();
                        
                        const templatesRes = await fetch('/templates.json');
                        if (!templatesRes.ok) {
                            throw new Error('Failed to load design templates.');
                        }
                        const backgroundOptions = await templatesRes.json();

                        const fullData: ExchangeData = { ...exchangePayload, backgroundOptions };
                        setExchangeData(fullData);

                        const params = new URLSearchParams(window.location.search);
                        const id = params.get('id');
                        setParticipantId(id);
                    }
                }
            } catch (error) {
                console.error("Error loading exchange data:", error);
                setError(error instanceof Error ? error.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        
        // Load data on initial page load
        loadData();

        // Add a listener to re-load data when the hash changes
        window.addEventListener('hashchange', loadData);

        // Clean up the listener when the component unmounts
        return () => {
            window.removeEventListener('hashchange', loadData);
        };
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
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border max-w-lg">
                    <h2 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h2>
                    <p className="text-slate-600 mt-2">{error}</p>
                     <a href="/generator.html" className="mt-6 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                        Start a New Game
                    </a>
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