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
    const [view, setView] = useState<'loading' | 'error' | 'generator' | 'results' | 'edit'>('loading');
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleHashChange = async () => {
            const hash = window.location.hash.slice(1);
            if (!hash) {
                setView('generator');
                setExchangeData(null);
                setParticipantId(null);
                return;
            }

            setView('loading');
            setError(null);
            
            const [exchangeId, queryString] = hash.split('?');

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
                setView('results');

            } catch (err) {
                console.error("Error loading exchange data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setView('error');
                setExchangeData(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial load

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const handleComplete = (newData: ExchangeData) => {
        setExchangeData(newData);
        setParticipantId(null); 
        
        // If the view is 'edit', we just switch back to results. 
        // If it's 'generator', we set the hash to trigger the results view.
        if (view === 'edit') {
            setView('results');
        } else {
            window.location.hash = newData.id!;
        }
    };
    
    const renderCurrentView = () => {
        switch (view) {
            case 'loading':
                return <LoadingFallback />;
            case 'error':
                return <ErrorDisplay message={error!} />;
            case 'results':
                if (!exchangeData) return <LoadingFallback />;
                return (
                    <ResultsPage 
                        data={exchangeData} 
                        currentParticipantId={participantId} 
                        onEditRequest={() => setView('edit')}
                        onDataUpdated={setExchangeData}
                    />
                );
            case 'edit':
                if (!exchangeData) return <ErrorDisplay message="No exchange data to edit." />;
                return <GeneratorPage onComplete={handleComplete} initialData={exchangeData} />;
            case 'generator':
            default:
                return <GeneratorPage onComplete={handleComplete} />;
        }
    };

    return (
        <Suspense fallback={<LoadingFallback />}>
            {renderCurrentView()}
        </Suspense>
    );
};

export default App;