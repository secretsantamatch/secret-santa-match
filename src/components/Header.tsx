import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--primary-text)] font-serif tracking-tight">Secret Santa Generator</h1>
      <p className="text-xl md:text-2xl text-slate-700 font-semibold mt-2">The Easiest Way to Draw Names Online</p>
      <p className="text-md text-gray-600 mt-3 max-w-3xl mx-auto">
        The best free Secret Santa generator for your gift exchange! Instantly draw names, add exclusions, and download printable cards all with no email or sign-ups required. Perfect for office, family, and friends.
      </p>
    </header>
  );
};

export default Header;
