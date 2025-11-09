import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ExchangeData, Match, Participant, GiftPersona } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import { Gift, Sparkles, UserCheck, HelpCircle } from 'lucide-react';

const ScratchToReveal: React.FC<{ onReveal: () => void, isRevealed: boolean }> = ({ onReveal, isRevealed }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the scratch-off layer
        ctx.fillStyle = '#d1d5db'; // A nice gray color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

    }, []);

    const getScratchPercentage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;
        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;

        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparentPixels = 0;
        for (let i = 3; i < pixels.data.length; i += 4) {
            if (pixels.data[i] === 0) {
                transparentPixels++;
            }
        }
        return (transparentPixels / (canvas.width * canvas.height)) * 100;
    };
    
    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isScratching || isRevealed) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const startScratching = (e: React.MouseEvent | React.TouchEvent) => {
        if (isRevealed) return;
        setIsScratching(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
    };

    const stopScratching = () => {
        if (isRevealed) return;
        setIsScratching(false);
        if (getScratchPercentage() > 50) {
            onReveal();
        }
    };

    if (isRevealed) {
        return null; // Don't show the canvas if already revealed
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center text-white font-bold text-2xl z-0 select-none">
                Scratch to Reveal!
             </div>
             <canvas
                ref={canvasRef}
                width={280}
                height={80}
                className="absolute rounded-lg cursor-pointer z-10"
                onMouseDown={startScratching}
                onMouseUp={stopScratching}
                onMouseMove={handleScratch}
                onTouchStart={startScratching}
                onTouchEnd={stopScratching}
                onTouchMove={handleScratch}
            />
        </div>
    );
};


const GiftInspirationSection: React.FC<{ receiver: Participant, persona: GiftPersona | null, giverName: string }> = ({ receiver, persona, giverName }) => {
    return (
      <div className="mt-12 animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 font-serif">Gift Inspiration for <span className="text-red-600">{receiver.name}</span></h2>
            <p className="text-slate-600 mt-2">Hey {giverName}, here are some ideas to help you find the perfect gift!</p>
        </div>
  
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Interests */}
            {(receiver.interests || receiver.likes) && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border">
                    <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2 mb-3">
                        <Sparkles size={20} className="text-amber-500" />
                        Interests, Hobbies & Likes
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas on Amazon!</p>
                    <div className="flex flex-wrap gap-3">
                        {[...(receiver.interests || '').split(','), ...(receiver.likes || '').split(',')].map((interest, i) => {
                            const trimmed = interest.trim();
                            if (!trimmed) return null;
                            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(trimmed)}&tag=secretsan-20`;
                            return (
                                <a key={i} href={amazonUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('click_gift_idea', { keyword: trimmed, persona: persona?.name })} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-4 py-2 rounded-full text-sm transition-colors">
                                    {trimmed}
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
  
            {/* Other Details */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <h3 className="font-bold text-lg text-slate-700 mb-4">Wishlist & Details</h3>
              <div className="space-y-3 text-sm text-slate-600">
                {receiver.budget && <p><strong>Suggested Budget:</strong> ${receiver.budget}</p>}
                {receiver.dislikes && <p><strong>Dislikes & No-Go's:</strong> {receiver.dislikes}</p>}
                {receiver.links && (
                  <div>
                    <strong>Specific Links:</strong>
                    {receiver.links.split('\n').map((link, i) => {
                        const trimmed = link.trim();
                        if (!trimmed) return null;
                        return <a key={i} href={trimmed} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">{trimmed}</a>
                    })}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-center text-slate-400 px-4">
                As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
            </p>
          </div>
  
          {/* Persona */}
          {persona && (
            <div className="sticky top-8 bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200">
              <h3 className="font-bold text-lg text-indigo-800 text-center">{receiver.name}'s Gift Persona</h3>
              <p className="text-2xl font-bold font-serif text-indigo-600 text-center mt-2">{persona.name}</p>
              <p className="text-sm text-indigo-700 mt-2 text-center">{persona.description}</p>
            </div>
          )}
        </div>
      </div>
    );
};
  

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [view, setView] = useState<'pre-reveal' | 'reveal' | 'organizer'>('organizer');
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalInitialView, setShareModalInitialView] = useState<string | null>(null);

    const { p: participants, matches: matchIds, ...styleData } = data;

    const matches: Match[] = useMemo(() => matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [matchIds, participants]);
    
    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [currentParticipantId, matches]);

    const persona = useMemo(() => {
        if (!currentMatch?.receiver) return null;
        return getGiftPersona(currentMatch.receiver);
    }, [currentMatch]);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (currentMatch) {
            setView('pre-reveal');
            trackEvent('view_pre_reveal_page', { giver: currentMatch.giver.name });
        } else {
            setView('organizer');
            if (action === 'share' || action === 'print') {
                setShowShareModal(true);
                setShareModalInitialView(action);
            }
        }
    }, [currentMatch]);

    const handleConfirmAndReveal = () => {
        setView('reveal');
        trackEvent('confirm_pre_reveal', { giver: currentMatch?.giver.name });
    };

    const handleScratchReveal = () => {
        if (!isNameRevealed) {
            setIsNameRevealed(true);
            trackEvent('reveal_name_scratch', { giver: currentMatch?.giver.name });
        }
    };
    
    const handleOpenShareModal = (initialView?: string) => {
      setShowShareModal(true);
      setShareModalInitialView(initialView || null);
      trackEvent('open_share_modal', { initial_view: initialView || 'default' });
    }

    // Organizer View
    if (view === 'organizer') {
        return (
            <>
                <Header />
                <main className="bg-slate-50">
                    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl py-12">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">You're the Organizer!</h1>
                            <p className="text-lg text-slate-600 mt-4">Your matches are ready. You can now share private links with each person, or download/print the cards for your party.</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <button onClick={() => handleOpenShareModal('share')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 flex items-center gap-2 text-lg">
                                Sharing & Downloads
                            </button>
                             <button onClick={() => { window.location.href = '/generator.html'; }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 px-8 rounded-full transition-all">
                                Start Over
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-700 font-serif mb-4 text-center">Organizer's Master List</h2>
                        <ResultsDisplay matches={matches} />
                    </div>
                </main>
                <Footer />
                {showShareModal && (
                    <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} initialView={shareModalInitialView} />
                )}
            </>
        );
    }
    
    // Participant Pre-Reveal View
    if (view === 'pre-reveal') {
        return (
            <>
                <Header />
                <main className="bg-slate-50">
                    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-xl py-12 flex items-center justify-center min-h-[60vh]">
                        <div className="bg-white p-8 rounded-2xl shadow-lg text-center border w-full">
                            <UserCheck size={48} className="mx-auto text-green-500 mb-4" />
                            <h1 className="text-3xl font-bold text-slate-800 font-serif">Hi, {currentMatch?.giver.name}!</h1>
                            <p className="text-lg text-slate-600 mt-2">Ready to find out who you're getting a gift for?</p>
                            <button onClick={handleConfirmAndReveal} className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                                Yes, Reveal My Match!
                            </button>
                            <p className="text-xs text-slate-400 mt-4">
                                Not {currentMatch?.giver.name}?{' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); trackEvent('deny_pre_reveal'); alert('Please contact your event organizer to get your correct link.'); }} className="underline hover:text-red-600">
                                    Click here.
                                </a>
                            </p>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Participant Reveal View
    return (
        <>
            <Header />
            <main className="bg-slate-50">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl py-12">
                    <div className="text-center mb-8">
                         <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">You are a Secret Santa!</h1>
                         <p className="text-lg text-slate-600 mt-4">
                            Scratch the card below to reveal who you're getting a gift for.
                         </p>
                    </div>
                    
                    <div className="relative">
                        <PrintableCard
                            match={currentMatch!}
                            eventDetails={styleData.eventDetails}
                            isNameRevealed={isNameRevealed}
                            backgroundOptions={styleData.backgroundOptions}
                            bgId={styleData.bgId}
                            bgImg={styleData.customBackground}
                            txtColor={styleData.textColor}
                            outline={styleData.useTextOutline}
                            outColor={styleData.outlineColor}
                            outSize={styleData.outlineSize}
                            fontSize={styleData.fontSizeSetting}
                            font={styleData.fontTheme}
                            line={styleData.lineSpacing}
                            greet={styleData.greetingText}
                            intro={styleData.introText}
                            wish={styleData.wishlistLabelText}
                        />
                         <div 
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ 
                                top: '40%', 
                                height: '20%',
                                pointerEvents: isNameRevealed ? 'none' : 'auto'
                            }}
                        >
                            <ScratchToReveal onReveal={handleScratchReveal} isRevealed={isNameRevealed} />
                        </div>
                    </div>
                    
                    {isNameRevealed && (
                        <GiftInspirationSection receiver={currentMatch!.receiver} persona={persona} giverName={currentMatch!.giver.name} />
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default ResultsPage;
