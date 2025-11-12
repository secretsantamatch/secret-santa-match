import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { ExchangeData } from './types';

// CORRECTED PATHS: Removed './src/' and file extensions to fix build errors
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

// DEFINITIVE FIX: Robust fetch function to handle the database race condition.
const fetchWithRetry = async (url: string, retries = 4, initialDelay = 500): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response; // Success!
            
            // Only retry on 404, which is the expected error during the race condition
            if (response.status === 404 && i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i); // Exponential backoff
                console.warn(`Attempt ${i + 1}: Not found, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Return the failing response on the last attempt or for other errors (e.g., 500)
                return response;
            }
        } catch (error) {
            if (i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Attempt ${i + 1}: Network error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Throw the error on the last attempt
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
            
            if (!hash) {
                setExchangeData(null);
                setParticipantId(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // DEFINITIVE FIX: Correctly parse exchangeId and participantId from the URL hash.
                const [exchangeId, queryString] = hash.split('?');
                
                if (!exchangeId) {
                    throw new Error("Invalid URL: No exchange ID found.");
                }

                const exchangeRes = await fetchWithRetry(`/.netlify/functions/get-exchange?id=${exchangeId}`);
                if (!exchangeRes.ok) {
                    throw new Error(`Could not find the gift exchange. Please check the link or contact your organizer.`);
                }
                const exchangePayload = await exchangeRes.json();
                
                const templatesRes = await fetch('/templates.json');
                if (!templatesRes.ok) throw new Error('Failed to load design templates.');
                const backgroundOptions = await templatesRes.json();

                const fullData: ExchangeData = { ...exchangePayload, backgroundOptions };
                setExchangeData(fullData);

                const params = new URLSearchParams(queryString || '');
                setParticipantId(params.get('id'));

            } catch (err) {
                console.error("Error loading exchange data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setExchangeData(null);
            } finally {
                setIsLoading(false);
            }
        };

        // DEFINITIVE FIX: Load data on initial page visit AND listen for changes.
        loadData();
        window.addEventListener('hashchange', loadData);

        // Cleanup the event listener when the component unmounts.
        return () => {
            window.removeEventListener('hashchange', loadData);
        };
    }, []); // Empty array ensures this setup runs only once.

    if (isLoading) {
        return <LoadingFallback />;
    }
    
    if (error) {
        return <ErrorDisplay message={error} />;
    }

    if (exchangeData) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <ResultsPage data={exchangeData} currentParticipantId={participantId} />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <GeneratorPage />
        </Suspense>
    );
};

export default App;
