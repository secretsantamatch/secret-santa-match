import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import type { ExchangeData } from './types';

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

const fetchWithRetry = async (url: string, retries = 4, initialDelay = 300): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            if (response.status === 404 && i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                return response; 
            }
        } catch (error) {
            if (i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Failed to fetch after multiple retries.');
};


const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This function is now memoized and depends on `exchangeData`
    // to prevent refetching data that's already in state.
    const loadDataFromHash = useCallback(async () => {
        const hash = window.location.hash.slice(1);
        const [exchangeId, queryString] = hash.split('?');

        // **THE FIX**: If the component already has data matching the hash, do not refetch.
        // This is crucial for the transition from the generator to the results page.
        if (exchangeData && exchangeId === exchangeData.id) {
            setIsLoading(false);
            return;
        }

        // If there's no hash, we are on the generator page.
        if (!exchangeId) {
            setExchangeData(null);
            setParticipantId(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
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
    }, [exchangeData]);

    useEffect(() => {
        // This effect sets up the hash-based routing on initial load and for any subsequent hash changes.
        window.addEventListener('hashchange', loadDataFromHash);
        loadDataFromHash(); // Initial load

        return () => {
            window.removeEventListener('hashchange', loadDataFromHash);
        };
    }, [loadDataFromHash]);

    // **THE FIX**: This callback receives the newly created data directly from the GeneratorPage,
    // completely avoiding the race condition by not needing to re-fetch the data.
    const handleExchangeCreated = (newData: ExchangeData) => {
        setIsLoading(true);
        setExchangeData(newData);
        setParticipantId(null); // The creator is always the organizer first.
        
        // Update the URL. This triggers the 'hashchange' listener, but `loadDataFromHash` will
        // see that the data is already in state and will skip the fetch.
        window.location.hash = newData.id!;
        
        // A small delay ensures a smooth visual transition.
        setTimeout(() => setIsLoading(false), 100);
    };

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

    // Pass the callback to GeneratorPage.
    return (
        <Suspense fallback={<LoadingFallback />}>
            <GeneratorPage onExchangeCreated={handleExchangeCreated} />
        </Suspense>
    );
};

export default App;
