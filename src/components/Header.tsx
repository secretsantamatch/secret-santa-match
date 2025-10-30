import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <a href="/generator.html" className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-8 w-8" />
                        <span>SecretSantaMatch</span>
                    </a>
                    <nav className="flex items-center gap-6">
                        <a href="/generator.html" className="font-semibold text-red-600 text-sm transition-colors hidden sm:block">
                            Generator
                        </a>
                        <a href="/blog.html" className="font-semibold text-slate-600 hover:text-red-600 text-sm transition-colors">
                            Holiday Blog
                        </a>
                         <a href="/holiday-budget-calculator.html" className="font-semibold text-slate-600 hover:text-red-600 text-sm transition-colors hidden md:block">
                            Budget Calculator
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
