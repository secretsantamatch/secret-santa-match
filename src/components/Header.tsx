import React, { useState } from 'react';
import { Gift } from 'lucide-react';

interface HeaderProps {
    onFindWishlistClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onFindWishlistClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <a href="/generator.html" className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-8 w-8" />
                        <span>SecretSantaMatch</span>
                    </a>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="/generator.html" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Generator</a>
                        <button onClick={onFindWishlistClick} className="font-semibold text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1">
                            <Gift size={16} /> Edit Wishlist
                        </button>
                        <a href="/" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Blog & Guides</a>
                        <a href="/holiday-budget-calculator.html" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Tools</a>
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
                        <a href="/generator.html" className="font-semibold text-slate-600 hover:text-red-600">Generator</a>
                        <button onClick={() => { onFindWishlistClick(); setIsMenuOpen(false); }} className="font-semibold text-slate-600 hover:text-red-600">Edit Wishlist</button>
                        <a href="/" className="font-semibold text-slate-600 hover:text-red-600">Blog & Guides</a>
                        <a href="/holiday-budget-calculator.html" className="font-semibold text-slate-600 hover:text-red-600">Tools</a>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;