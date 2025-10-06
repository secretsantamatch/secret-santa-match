import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center py-4">
            <div className="inline-block mb-4">
                <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16" />
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
