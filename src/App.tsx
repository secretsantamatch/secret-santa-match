import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import { decodeData } from './services/urlService';
import type { ExchangeData } from './types';

interface AppState {
  exchangeData: ExchangeData | null;
  participantId: string | null;
  error: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    exchangeData: null,
    participantId: null,
    error: null
  });

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashContent = hash.substring(1);
          const [encodedData, queryString] = hashContent.split('?');
          
          if (!encodedData) {
            setState({ exchangeData: null, participantId: null, error: null });
            return;
          }

          const data = decodeData(encodedData);
          
          let pId = null;
          if (queryString) {
            const params = new URLSearchParams(queryString);
            pId = params.get('id');
          }
          
          setState({ exchangeData: data, participantId: pId, error: null });
        } else {
          setState({ exchangeData: null, participantId: null, error: null });
        }
      } catch (e) {
        console.error("Error processing URL hash:", e);
        setState({ exchangeData: null, participantId: null, error: "The link seems to be invalid or corrupted. Please check the URL and try again." });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    setState({ exchangeData: null, participantId: null, error: null });
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
          <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1>
          <p className="text-slate-700 text-lg">{state.error}</p>
          <a href="/" onClick={handleStartNewGame} className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
            Start a New Game
          </a>
        </div>
      </div>
    );
  }

  if (state.exchangeData) {
    return <ResultsPage data={state.exchangeData} currentParticipantId={state.participantId} />;
  }

  return <GeneratorPage />;
};

export default App;
