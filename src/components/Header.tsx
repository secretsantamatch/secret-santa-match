import React from 'react';

const LogoIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#D1FAE5"/>
        <path d="M27 19H32C32.5523 19 33 19.4477 33 20V24C33 24.5523 32.5523 25 32 25H27C26.4477 25 26 24.5523 26 24V20C26 19.4477 26.4477 19 27 19Z" fill="#34D399"/>
        <path d="M28.5 15H30.5V19H28.5V15Z" fill="#10B981"/>
        <path d="M26 21.5H33V22.5H26V21.5Z" fill="#10B981"/>
        <path d="M16 25H21C21.5523 25 22 25.4477 22 26V30C22 30.5523 21.5523 31 21 31H16C15.4477 31 15 30.5523 15 30V26C15 25.4477 15.4477 25 16 25Z" fill="#34D399"/>
        <path d="M17.5 21H19.5V25H17.5V21Z" fill="#10B981"/>
        <path d="M15 27.5H22V28.5H15V27.5Z" fill="#10B981"/>
    </svg>
);


const Header: React.FC = () => {
    return (
        <header className="text-center py-4">
            <div className="inline-block mb-4">
                <LogoIcon />
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
