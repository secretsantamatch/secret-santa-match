import React from 'react';
import ReactDOM from 'react-dom/client';
import BabyPoolGenerator from './components/BabyPoolGenerator';
import BabyPoolDashboard from './components/BabyPoolDashboard';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const renderApp = () => {
    // Simple hash-based routing
    const hash = window.location.hash;
    // If URL contains poolId, show the dashboard
    if (hash.includes('poolId=')) {
        return <BabyPoolDashboard />;
    }
    // Otherwise show the generator
    return <BabyPoolGenerator />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {renderApp()}
  </React.StrictMode>
);

// Re-render on hash change (navigation between create -> dashboard)
window.addEventListener('hashchange', () => {
    root.render(
      <React.StrictMode>
        {renderApp()}
      </React.StrictMode>
    );
});