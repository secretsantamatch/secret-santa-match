import React, { useState } from 'react';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <a href="/" className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-8 w-8" />
                        <span>SecretSantaMatch</span>
                    </a>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="/generator.html" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Generator</a>
                         <a href="/white-elephant-generator.html" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">White Elephant</a>
                         <a href="/free-printables.html" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Free Printables</a>
                        <a href="/" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Blog</a>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-slate-900">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200">
                    <nav className="flex flex-col items-center gap-4 py-4">
                        <a href="/generator.html" className="font-semibold text-slate-600 hover:text-red-600">Secret Santa Generator</a>
                        <a href="/white-elephant-generator.html" className="font-semibold text-slate-600 hover:text-red-600">White Elephant</a>
                        <a href="/free-printables.html" className="font-semibold text-slate-600 hover:text-red-600">Free Printables</a>
                        <a href="/" className="font-semibold text-slate-600 hover:text-red-600">Blog & Guides</a>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;