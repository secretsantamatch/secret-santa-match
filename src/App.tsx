import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import type { ExchangeData } from './types';

// Lazy load components for better initial page load
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

/**
 * DEFINITIVE FIX: A robust, multi-layered resiliency strategy. This client-side fetcher
 * works in tandem with server-side retries to create a "defense-in-depth" against
 * both database replication delays (404s) and serverless cold starts (5xx errors).
 */
const fetchWithRetry = async (url: string, retries = 5, initialDelay = 400, backoff = 2): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            // If response is OK (200-299), we're done.
            if (response.ok) return response;

            // If it's a server error (5xx) or a not found error (404), we should retry.
            if ((response.status >= 500 || response.status === 404) && i < retries - 1) {
                const delay = initialDelay * Math.pow(backoff, i);
                console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Go to the next iteration
            }
            
            // For any other non-ok status, or if we've run out of retries, return the failed response.
            return response;

        } catch (error) {
            // This catches network errors (e.g., DNS, no connection)
            if (i < retries - 1) {
                const delay = initialDelay * Math.pow(backoff, i);
                console.warn(`Attempt ${i + 1} failed with a network error. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('Failed to fetch after multiple retries due to network error.');
                throw error; // Re-throw the error after the last attempt
            }
        }
    }
    // This line should be unreachable, but as a fallback, throw an error.
    throw new Error('Failed to fetch after multiple retries.');
};


const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // DEFINITIVE FIX: Use a ref to hold a stable reference to the latest data.
    // This solves the "stale closure" problem in the hashchange event listener.
    const dataRef = useRef(exchangeData);
    useEffect(() => {
        dataRef.current = exchangeData;
    }, [exchangeData]);

    // The loadDataFromHash function no longer needs to depend on `exchangeData`
    // because it will read from the stable `dataRef`. This makes the function stable.
    const loadDataFromHash = useCallback(async () => {
        const hash = window.location.hash.slice(1);
        const [exchangeId, queryString] = hash.split('?');
        
        // Read from the ref to get the *current* state, not the state at the time the listener was created.
        if (dataRef.current && exchangeId === dataRef.current.id) {
            setIsLoading(false);
            return;
        }

        if (!exchangeId) {
             // Only reset state if there's truly no hash and we previously had data.
            if (dataRef.current) {
                setExchangeData(null);
                setParticipantId(null);
            }
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
    }, []); // Empty dependency array makes this function stable.

    // This effect for adding the listener now only runs once on mount, which is more efficient.
    useEffect(() => {
        window.addEventListener('hashchange', loadDataFromHash);
        loadDataFromHash(); // Initial load

        return () => {
            window.removeEventListener('hashchange', loadDataFromHash);
        };
    }, [loadDataFromHash]); // loadDataFromHash is now stable.

    // This useEffect synchronizes the state to the URL.
    // It runs *after* the state has been updated, preventing the race condition.
    useEffect(() => {
        if (exchangeData && exchangeData.id && !window.location.hash.includes(exchangeData.id)) {
            // This will trigger the 'hashchange' listener, but because the `dataRef`
            // is up to date, `loadDataFromHash` will hit its guard clause and exit early,
            // completely avoiding the problematic network request.
            window.location.hash = exchangeData.id;
        }
    }, [exchangeData]);

    // `handleCreationComplete` now only sets the state.
    // The new useEffect above is responsible for updating the URL hash.
    // This completely eliminates the race condition.
    const handleCreationComplete = (newData: ExchangeData) => {
        setIsLoading(true);
        setExchangeData(newData);
        setParticipantId(null); // The creator is always the organizer first.
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
                <ResultsPage 
                    data={exchangeData} 
                    currentParticipantId={participantId} 
                    onDataUpdated={setExchangeData}
                />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <GeneratorPage onComplete={handleCreationComplete} />
        </Suspense>
    );
};

export default App;