import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';
import { decodeData } from './services/urlService';
import type { ExchangeData } from './types';

// Centralized theme logic
const getSeasonalTheme = (): string => {
    const month = new Date().getMonth(); // 0 = Jan, 1 = Feb, etc.
    if (month === 9) return 'halloween'; // October
    if (month === 1) return 'valentines'; // February
    if (month === 10 || month === 11) return 'christmas'; // Nov, Dec
    return 'default';
};

interface AppState {
  exchangeData: ExchangeData | null;
  participantId: string | null;
  error: string | null;
}

// This new component contains all the logic for the main generator app,
// ensuring hooks are called consistently.
const MainApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    exchangeData: null,
    participantId: null,
    error: null
  });

  // This effect runs once and ensures the theme is always set correctly.
  useEffect(() => {
    const applyTheme = (data: ExchangeData | null) => {
      const theme = data?.pageTheme || getSeasonalTheme();
      document.documentElement.dataset.theme = theme;
    };
    
    const handleHashChange = () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashContent = hash.substring(1);
          const [encodedData, queryString] = hashContent.split('?');
          
          if (!encodedData) {
            const newState = { exchangeData: null, participantId: null, error: null };
            setState(newState);
            applyTheme(null);
            return;
          }

          const data = decodeData(encodedData);
          
          let pId = null;
          if (queryString) {
            const params = new URLSearchParams(queryString);
            pId = params.get('id');
          }
          
          const newState = { exchangeData: data, participantId: pId, error: null };
          setState(newState);
          applyTheme(data);

        } else {
          const newState = { exchangeData: null, participantId: null, error: null };
          setState(newState);
          applyTheme(null);
        }
      } catch (e) {
        console.error("Error processing URL hash:", e);
        const newState = { exchangeData: null, participantId: null, error: "The link seems to be invalid or corrupted. Please check the URL and try again." };
        setState(newState);
        applyTheme(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    // Manually trigger the hash change logic to reset the state and theme
    window.dispatchEvent(new HashChangeEvent('hashchange'));
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

// The main App component now only renders the main application.
const App: React.FC = () => {
  return <MainApp />;
};

export default App;
