
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import type { ExchangeData } from './types';
import { compressData, decompressData } from './services/urlService';

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

const App: React.FC = () => {
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to fetch templates if missing
    const ensureTemplates = async (data: any) => {
        if (!data.backgroundOptions || data.backgroundOptions.length === 0) {
            try {
                const res = await fetch('/templates.json');
                if (res.ok) {
                    data.backgroundOptions = await res.json();
                } else {
                    // Fallback to minimal template if fetch fails
                    data.backgroundOptions = [{ id: "plain-white", name: "Plain White", imageUrl: "", defaultTextColor: "#333333" }];
                }
            } catch (e) {
                console.error("Template fetch failed", e);
                data.backgroundOptions = [{ id: "plain-white", name: "Plain White", imageUrl: "", defaultTextColor: "#333333" }];
            }
        }
        return data;
    };

    const loadDataFromHash = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        const hash = window.location.hash.slice(1);
        
        if (!hash) {
            setExchangeData(null);
            setParticipantId(null);
            setIsLoading(false);
            return;
        }

        const [compressedData, queryString] = hash.split('?');

        if (!compressedData) {
            setExchangeData(null);
            setParticipantId(null);
            setIsLoading(false);
            return;
        }

        try {
            let decompressed = decompressData(compressedData);
            if (!decompressed) {
                throw new Error("Could not read the gift exchange data. It might be corrupted.");
            }

            // FIX: Ensure ID exists
            if (!decompressed.id) {
                console.log("Data missing ID. Generating...");
                decompressed.id = crypto.randomUUID();
                const newCompressed = compressData(decompressed as ExchangeData);
                const newHash = queryString ? `${newCompressed}?${queryString}` : newCompressed;
                window.location.replace(`#${newHash}`);
                return;
            }

            // FIX: Ensure Templates exist
            // We treat 'decompressed' as 'any' briefly to attach backgroundOptions safely
            const fullData = await ensureTemplates(decompressed) as ExchangeData;
            
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
    }, []);

    useEffect(() => {
        window.addEventListener('hashchange', loadDataFromHash);
        loadDataFromHash(); 

        return () => {
            window.removeEventListener('hashchange', loadDataFromHash);
        };
    }, [loadDataFromHash]);

    const updateUrlHash = (data: Omit<ExchangeData, 'backgroundOptions'>) => {
        const compressed = compressData(data);
        const queryString = window.location.hash.split('?')[1];
        const newHash = queryString ? `${compressed}?${queryString}` : compressed;
        window.history.replaceState(null, '', `#${newHash}`);
    };

    const handleDataUpdate = (newMatches: { g: string; r: string }[]) => {
        if (!exchangeData) return;

        const newData: ExchangeData = {
            ...exchangeData,
            matches: newMatches
        };

        setExchangeData(newData);
        
        const { backgroundOptions, ...dataToCompress } = newData;
        updateUrlHash(dataToCompress);
    };
    
    const handleCreationComplete = async (newData: ExchangeData) => {
        // 1. Ensure ID
        if (!newData.id) {
            newData.id = crypto.randomUUID();
        }

        // 2. Ensure Templates (Crash Prevention)
        const finalData = await ensureTemplates(newData);

        // 3. Compress and Update URL
        const { backgroundOptions, ...dataToCompress } = finalData;
        const compressed = compressData(dataToCompress);
        
        if (compressed) {
            setExchangeData(finalData);
            window.location.hash = compressed;
        } else {
            setError("There was an error creating your gift exchange link.");
        }
    };

    if (isLoading) return <LoadingFallback />;
    if (error) return <ErrorDisplay message={error} />;

    if (exchangeData) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <ResultsPage 
                    data={exchangeData} 
                    currentParticipantId={participantId} 
                    onDataUpdated={handleDataUpdate}
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
