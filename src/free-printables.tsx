import React from 'react';
import ReactDOM from 'react-dom/client';
import FreePrintablesPage from './components/FreePrintablesPage';
import './index.css';

console.log('Free Printables script loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
try {
    root.render(
      <React.StrictMode>
        <FreePrintablesPage />
      </React.StrictMode>
    );
    console.log('Free Printables mounted successfully');
} catch (error) {
    console.error('Error mounting Free Printables:', error);
}