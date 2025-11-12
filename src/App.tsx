import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import type { ExchangeData } from './types';

// Helper function to fetch data with retries, accounting for database replication lag.
const fetchWithRetry = async (url: string, retries = 3, delay = 750): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            // If response is OK, we're done
            if (response.ok) {
                return response;
            }
            // If it's a 404 (Not Found) and we have retries left, wait and try again.
            // This is the key to solving the race condition.
            if (response.status === 404 && i < retries - 1) {
                console.warn(`Attempt ${i + 1}: Exchange not found, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // For non-404 errors or the last retry attempt, return the failing response immediately.
                return response;
            }
        } catch (error) {
            // On a network error, retry as well.
            if (i < retries - 1) {
                console.warn(`Attempt ${i + 1}: Network error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // If it's the last attempt on a network error, throw it to be caught by the main logic.
                throw error;
            }
        }
    }
    // This should not be reached, but serves as a fallback.
    throw new Error('Failed to fetch after multiple retries.');
};

const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setExchangeData(null);
                setError(null);
                setIsLoading(true);

                const hash = window.location.hash.slice(1);
                if (hash) {
                    const exchangeId = hash.split('?')[0];
                    if (exchangeId) {
                        // Use the new fetchWithRetry function to be more resilient.
                        const exchangeRes = await fetchWithRetry(`/.netlify/functions/get-exchange?id=${exchangeId}`);

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
        
        loadData();
        window.addEventListener('hashchange', loadData);
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

    return <GeneratorPage />;
};

export default App;