
import React, { useState, useEffect } from 'react';
import type { KudosBoard } from '../types';
import { X, ChevronLeft, ChevronRight, Maximize, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KudosPresentationProps {
    board: KudosBoard;
    onClose: () => void;
}

const KudosPresentation: React.FC<KudosPresentationProps> = ({ board, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const cards = board.cards;
    const currentCard = cards[currentIndex];

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    // Confetti effect on card change
    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#f59e0b']
        });
    }, [currentIndex]);

    const nextCard = () => {
        if (currentIndex < cards.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevCard = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    if (!currentCard) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col text-white">
            {/* Toolbar */}
            <div className="p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur">
                <h2 className="font-bold text-lg opacity-80">{board.title} Presentation</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-mono opacity-60">{currentIndex + 1} / {cards.length}</span>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                </div>
            </div>

            {/* Stage */}
            <div className="flex-grow flex items-center justify-center p-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px]"></div>

                <div className="relative z-10 w-full max-w-4xl aspect-video bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden text-slate-800 animate-fade-in-up">
                    {/* Left Panel: From/To */}
                    <div className="md:w-1/3 bg-slate-50 border-r border-slate-200 p-10 flex flex-col justify-center items-center text-center">
                         <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-6">
                            {currentCard.from.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                        <h3 className="text-2xl font-black text-slate-900 mb-6">{currentCard.from}</h3>
                        
                        <div className="w-8 h-1 bg-slate-200 rounded-full mb-6"></div>

                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">To</p>
                        <h3 className="text-3xl font-black text-indigo-600">{currentCard.to}</h3>
                    </div>

                    {/* Right Panel: Message */}
                    <div className="md:w-2/3 p-10 md:p-16 flex flex-col justify-center">
                        <div className="text-2xl md:text-4xl font-serif font-medium leading-tight text-slate-800">
                            "{currentCard.message}"
                        </div>
                        {currentCard.giftLink && (
                            <div className="mt-8 inline-flex items-center gap-3 bg-amber-50 text-amber-800 px-6 py-3 rounded-xl border border-amber-200 font-bold self-start">
                                <Gift className="animate-bounce" /> A gift is attached!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 flex justify-center gap-6">
                <button 
                    onClick={prevCard} 
                    disabled={currentIndex === 0}
                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={32} />
                </button>
                <button 
                    onClick={nextCard} 
                    disabled={currentIndex === cards.length - 1}
                    className="p-4 rounded-full bg-white text-indigo-900 hover:scale-110 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-xl"
                >
                    <ChevronRight size={32} />
                </button>
            </div>
             <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default KudosPresentation;
