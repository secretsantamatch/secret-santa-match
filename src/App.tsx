import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { ExchangeData } from './src/types';

// Lazy load components for better initial page load
const GeneratorPage = lazy(() => import('./src/components/GeneratorPage'));
const ResultsPage = lazy(() => import('./src/components/ResultsPage'));

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

// Helper function to fetch data with retries, accounting for database replication lag.
const fetchWithRetry = async (url: string, retries = 4, initialDelay = 500): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response; // Success!
            
            // If it's a 404 and we have retries left, wait and try again.
            if (response.status === 404 && i < retries - 1) {
                const delay = initialDelay * (i + 1); // Increasing delay
                console.warn(`Attempt ${i + 1}: Not found, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                return response; // Return the failing response on last attempt or other error
            }
        } catch (error) {
            if (i < retries - 1) {
                const delay = initialDelay * (i + 1);
                console.warn(`Attempt ${i + 1}: Network error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Throw error on last attempt
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
            
            // If there's no hash, we're on the generator page.
            // Reset state and don't show a loading indicator.
            if (!hash) {
                setExchangeData(null);
                setIsLoading(false);
                return;
            }

            // If there is a hash, it means we should be on a results page.
            // Now we show the loading indicator while we fetch.
            setIsLoading(true);
            try {
                const exchangeId = hash.split('?')[0];
                
                const exchangeRes = await fetchWithRetry(`/.netlify/functions/get-exchange?id=${exchangeId}`);
                if (!exchangeRes.ok) {
                    throw new Error(`Could not find the gift exchange. Please check the link or contact your organizer.`);
                }
                const exchangePayload = await exchangeRes.json();
                
                // Fetch templates separately and merge them in
                const templatesRes = await fetch('/templates.json');
                if (!templatesRes.ok) throw new Error('Failed to load design templates.');
                const backgroundOptions = await templatesRes.json();

                const fullData: ExchangeData = { ...exchangePayload, backgroundOptions };
                setExchangeData(fullData);

                // Check for participant ID in the query string
                const params = new URLSearchParams(window.location.search);
                setParticipantId(params.get('id'));

            } catch (err) {
                console.error("Error loading exchange data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setExchangeData(null); // Clear any stale data on error
            } finally {
                setIsLoading(false);
            }
        };

        loadData(); // Run on initial page load
        window.addEventListener('hashchange', loadData); // Run whenever the hash changes

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('hashchange', loadData);
        };
    }, []); // Empty dependency array is correct: this effect should run only once to set up listeners.

    if (isLoading) {
        return <LoadingFallback />;
    }
    
    if (error) {
        return <ErrorDisplay message={error} />;
    }

    // If exchange data was successfully loaded, show the results page.
    if (exchangeData) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <ResultsPage data={exchangeData} currentParticipantId={participantId} />
            </Suspense>
        );
    }

    // Otherwise, show the main generator page.
    return (
        <Suspense fallback={<LoadingFallback />}>
            <GeneratorPage />
        </Suspense>
    );
};

export default App;