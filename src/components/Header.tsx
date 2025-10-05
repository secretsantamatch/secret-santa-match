import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center py-4">
            <div className="inline-block bg-green-100 p-3 rounded-2xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500 font-serif">Secret Santa Generator</h1>
            <h2 className="text-xl md:text-2xl font-bold text-slate-700 mt-2">The Easiest Way to Draw Names Online</h2>
            <p className="text-base text-gray-600 mt-4 max-w-3xl mx-auto">
                The best free Secret Santa generator for your gift exchange! Instantly draw names,
                add exclusions, download printable cards, and share private links with each
                participant—all with no sign-ups required. Perfect for office, family, and friends.
            </p>
        </header>
    );
};

export default Header;
