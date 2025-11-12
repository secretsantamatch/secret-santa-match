import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { ExchangeData } from './types';

// CORRECTED PATHS: Removed './src/' and file extensions from imports to fix build errors.
const GeneratorPage = lazy(() => import('./components/GeneratorPage'));
const ResultsPage = lazy(() => import('./components/ResultsPage'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <img src="/logo_256.png" alt="Loading" className="w-24 h-24 mx-auto animate-pulse" />
            <p className="text-slate-500 mt-4">Loading your exchange...</p>
        </div>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border max-w-lg">
            <h2 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h2>
            <p className="text-slate-600 mt-2">{message}</p>
             <a href="/generator.html" className="mt-6 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                Start a New Game
            </a>
        </div>
    </div>
);

// PERMANENT FIX for Race Condition: A robust fetch function with exponential backoff.
// It retries a few times if it can't find the data immediately, giving the database time to catch up.
const fetchWithRetry = async (url: string, retries = 4, initialDelay = 300): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response; // Success!
            
            // Only retry on 404, which is the specific error for the race condition.
            if (response.status === 404 && i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i); // e.g., 300ms, 600ms, 1200ms
                console.warn(`Attempt ${i + 1}: Data not found, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                return response; // Return the failing response on the last try or for other errors (e.g., 500).
            }
        } catch (error) {
            if (i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Attempt ${i + 1}: Network error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Throw after the last attempt.
            }
        }
    }
    throw new Error('Failed to fetch after multiple retries.');
};


const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setError(null);
            const hash = window.location.hash.slice(1);
            
            // If there's no hash, we are on the generator page. Do nothing.
            if (!hash) {
                setExchangeData(null);
                setParticipantId(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // PERMANENT FIX for URL Parsing: Correctly parse both the exchangeId and participantId
                // from the URL hash (e.g., #exchangeId?id=participantId).
                const [exchangeId, queryString] = hash.split('?');
                
                if (!exchangeId) {
                    throw new Error("Invalid URL: No exchange ID found.");
                }

                // Use the robust retry mechanism to fetch data.
                const exchangeRes = await fetchWithRetry(`/.netlify/functions/get-exchange?id=${exchangeId}`);
                if (!exchangeRes.ok) {
                    throw new Error(`Could not find the gift exchange. Please check the link or contact your organizer.`);
                }
                const exchangePayload = await exchangeRes.json();
                
                // Merge in the client-side templates.
                const templatesRes = await fetch('/templates.json');
                if (!templatesRes.ok) throw new Error('Failed to load design templates.');
                const backgroundOptions = await templatesRes.json();

                const fullData: ExchangeData = { ...exchangePayload, backgroundOptions };
                setExchangeData(fullData);

                // Correctly parse participantId from the HASH's query string.
                const params = new URLSearchParams(queryString || '');
                setParticipantId(params.get('id'));

            } catch (err) {
                console.error("Error loading exchange data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setExchangeData(null); // Clear data on error to show the error screen.
            } finally {
                setIsLoading(false);
            }
        };

        // PERMANENT FIX for Transitions: This runs on initial load AND listens for hash changes,
        // allowing for seamless transitions from the generator to the results page without a page reload.
        loadData();
        window.addEventListener('hashchange', loadData);

        return () => {
            window.removeEventListener('hashchange', loadData);
        };
    }, []); // Empty dependency array is correct to set up the listener only once.

    if (isLoading) {
        return <LoadingFallback />;
    }
    
    if (error) {
        return <ErrorDisplay message={error} />;
    }

    // This is the core routing logic.
    if (exchangeData) {
        // If we successfully loaded data from a hash, show the results.
        return (
            <Suspense fallback={<LoadingFallback />}>
                <ResultsPage data={exchangeData} currentParticipantId={participantId} />
            </Suspense>
        );
    }

    // If there's no data and no error, show the generator page.
    return (
        <Suspense fallback={<LoadingFallback />}>
            <GeneratorPage />
        </Suspense>
    );
};

export default App;
