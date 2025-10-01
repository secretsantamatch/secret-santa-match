import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-6 md:py-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-20 w-20" />
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--primary-text)] font-serif tracking-tight">
          Secret Santa Generator
        </h1>
        <p className="text-base sm:text-lg text-gray-700 font-semibold mt-1">
          The Easiest Way to Draw Names Online
        </p>
        <p className="max-w-2xl text-gray-600 mt-2">
          The best free Secret Santa generator for your gift exchange! Instantly draw names, add exclusions, download printable cards, and share private links with each participant—all with no sign-ups required. Perfect for office, family, and friends.
        </p>
      </div>
    </header>
  );
};

export default Header;
