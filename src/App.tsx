import React from 'react';
import GeneratorPage from './components/GeneratorPage';

const App: React.FC = () => {
    // This is the root component for the generator application.
    // It renders the main GeneratorPage, which handles all its own state and logic.
    return (
        <GeneratorPage />
    );
};

export default App;
