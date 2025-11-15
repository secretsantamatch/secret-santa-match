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

        const loadDataFromHash = useCallback(async () => {
            setIsLoading(true);
            setError(null);
            
            const hash = window.location.hash.slice(1);
            const [compressedData, queryString] = hash.split('?');

            if (!compressedData) {
                setExchangeData(null);
                setParticipantId(null);
                setIsLoading(false);
                return;
            }

            try {
                const decompressed = decompressData(compressedData);
                if (!decompressed) {
                    throw new Error("Could not read the gift exchange data from the link. It might be corrupted or incomplete.");
                }

                // Load templates and merge them into the data
                const templatesRes = await fetch('/templates.json');
                if (!templatesRes.ok) throw new Error('Failed to load design templates.');
                const backgroundOptions = await templatesRes.json();
                
                const fullData: ExchangeData = { ...decompressed, backgroundOptions };
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

        const handleFullDataUpdate = (newData: ExchangeData) => {
            setExchangeData(newData); // Update the state optimistically
            const { backgroundOptions, ...dataToCompress } = newData;
            updateUrlHash(dataToCompress);
        };
        
        const handleCreationComplete = (newData: ExchangeData) => {
            const { backgroundOptions, ...dataToCompress } = newData;
            const compressed = compressData(dataToCompress);
            if (compressed) {
                setExchangeData(newData);
                window.location.hash = compressed;
            } else {
                setError("There was an error creating your gift exchange link.");
            }
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
                        onDataUpdated={handleDataUpdate}
                        onFullDataUpdate={handleFullDataUpdate}
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