import React, { useState, useEffect } from 'react';
import GeneratorPage from './components/GeneratorPage';
import ResultsPage from './components/ResultsPage';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // A simple check to see if the hash contains our compressed data.
  // A long hash is indicative of shared results.
  if (hash.length > 20) { 
    return <ResultsPage />;
  }

  return <GeneratorPage />;
}

export default App;
