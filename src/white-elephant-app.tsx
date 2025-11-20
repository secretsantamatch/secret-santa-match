
import React from 'react';
import ReactDOM from 'react-dom/client';
import WhiteElephantGeneratorPage from './components/WhiteElephantGeneratorPage';
import WhiteElephantDashboard from './components/WhiteElephantDashboard';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const renderApp = () => {
    const hash = window.location.hash.slice(1);
    if (hash.includes('gameId=')) {
        return <WhiteElephantDashboard />;
    }
    return <WhiteElephantGeneratorPage />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {renderApp()}
  </React.StrictMode>
);

// Listen for hash changes to re-render the correct component
window.addEventListener('hashchange', () => {
    root.render(
      <React.StrictMode>
        {renderApp()}
      </React.StrictMode>
    );
});
