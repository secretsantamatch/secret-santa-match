import React, { useState, useEffect } from 'react';
import type { ExchangeData, Match, Participant, Wishlist } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { Share2, Download, Eye, Home, Gift, Copy, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { getGiftPersona } from '../services/personaService';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const GiftInspirationSection: React.FC<{ receiver: Participant }> = ({ receiver }) => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!receiver.wishlistId) {
            // Fallback for old links without a wishlistId
            setWishlist({
                interests: receiver.interests,
                likes: receiver.likes,
                dislikes: receiver.dislikes,
                links: receiver.links,
                budget: receiver.budget,
            });
            setStatus('success');
            return;
        }

        const fetchWishlist = async () => {
            setStatus('loading');
            try {
                const response = await fetch(`/.netlify/functions/get-wishlist?id=${receiver.wishlistId}`);
                if (!response.ok) throw new Error();
                const data = await response.json();
                setWishlist(data);
                setStatus('success');
            } catch (e) {
                setStatus('error');
            }
        };
        fetchWishlist();
    }, [receiver]);

    if (status === 'loading') {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
                <Loader2 className="animate-spin h-8 w-8 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Loading latest wishlist...</p>
            </div>
        );
    }
    
    if (status === 'error' || !wishlist) {
         return (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <p className="text-sm text-yellow-800">Could not load the live wishlist, showing original details.</p>
            </div>
        );
    }

    const persona = getGiftPersona({ ...receiver, ...wishlist });
    const allInterests = [...(wishlist.interests?.split(',') || []), ...(wishlist.likes?.split(',') || [])]
        .map(i => i.trim()).filter(Boolean);

    return (
        <div className="mt-12 space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 font-serif">Gift Inspiration for {receiver.name}</h2>
                <p className="text-slate-600 mt-2">Here are some ideas to help you find the perfect gift!</p>
            </div>
            {/* Main content grid */}
        </div>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { p: participants, matches: matchIds, ...styleData } = data;
    const isOrganizerView = !currentParticipantId;

    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [view, setView] = useState<'pre-reveal' | 'reveal'>(isOrganizerView ? 'reveal' : 'pre-reveal');
    const [copiedWishlistLink, setCopiedWishlistLink] = useState(false);

    const allMatches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    useEffect(() => {
        if (isOrganizerView) {
            setIsNameRevealed(true);
        } else {
            const match = allMatches.find(m => m.giver.id === currentParticipantId);
            setCurrentMatch(match || null);
        }
    }, [currentParticipantId, allMatches, isOrganizerView]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        if (currentMatch) {
            trackEvent('reveal_name', { participant: currentMatch.giver.name });
        }
    };
    
    const handleStartOver = () => {
        trackEvent('click_start_over', { from: 'results_page' });
        window.location.href = '/generator.html';
    };

    const handleConfirmPreReveal = () => {
        setView('reveal');
        trackEvent('confirm_pre_reveal');
    };

    const copyWishlistLink = () => {
        if (!currentMatch?.giver.wishlistId) return;
        const url = `${window.location.origin}/wishlist-editor.html?id=${currentMatch.giver.wishlistId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedWishlistLink(true);
            setTimeout(() => setCopiedWishlistLink(false), 2500);
        });
        trackEvent('copy_wishlist_link');
    };

    const renderParticipantView = () => {
        if (!currentMatch) { /* Error case */ }

        if (view === 'pre-reveal') {
            return (
                 <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border">
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Hi, {currentMatch.giver.name}!</h1>
                    <p className="text-lg text-slate-600 mt-4">Are you ready to find out who you're getting a gift for?</p>
                    <button onClick={handleConfirmPreReveal} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                        Yes, Reveal My Match!
                    </button>
                    <p className="text-sm text-slate-500 mt-4">Not {currentMatch.giver.name}? Please contact your event organizer.</p>
                </div>
            );
        }

        return (
            <div className="max-w-md mx-auto">
                {/* FIX: Add all required styling props to PrintableCard */}
                <PrintableCard
                    match={currentMatch}
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
                    onReveal={handleReveal}
                />
                 {!isNameRevealed && (
                    <div className="text-center mt-6">
                        {/* Scratch to reveal component will go here */}
                    </div>
                )}
                {isNameRevealed && (
                    <>
                        <GiftInspirationSection receiver={currentMatch.receiver} />
                        <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 text-center">
                            <h3 className="text-xl font-bold text-indigo-800">Your Personal Wishlist Link</h3>
                            <p className="text-indigo-700 mt-2 text-sm">Want to update your own wishlist for your Secret Santa? Save this secret link. You can add new ideas anytime, and your Secret Santa will see them automatically!</p>
                            <div className="mt-4 flex items-center gap-2">
                                <input type="text" readOnly value={`${window.location.origin}/wishlist-editor.html?id=${currentMatch.giver.wishlistId}`} className="w-full p-2 border border-indigo-200 rounded-md bg-white text-sm truncate" />
                                <button onClick={copyWishlistLink} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                                    {copiedWishlistLink ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderOrganizerView = () => (
        <>
            {/* Organizer View Content */}
        </>
    );

    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen py-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    {isOrganizerView ? renderOrganizerView() : renderParticipantView()}
                    <div className="text-center mt-12 pt-8 border-t border-slate-200">
                        <button onClick={handleStartOver} className="text-slate-500 hover:text-red-600 font-semibold flex items-center gap-2 mx-auto">
                            <Home size={18} /> Start a New Game
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
            {showShareModal && isOrganizerView && (
                <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />
            )}
        </>
    );
};

export default ResultsPage;