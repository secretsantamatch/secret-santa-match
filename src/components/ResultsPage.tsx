import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant, Wishlist } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { Share2, Download, Eye, Home, Gift, Copy, Check, Link as LinkIcon, Loader2, RefreshCw } from 'lucide-react';
import { getGiftPersona } from '../services/personaService';
import { generateMatches } from '../services/matchService';
import { encodeData } from '../services/urlService';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const GiftInspirationSection: React.FC<{ receiver: Participant }> = ({ receiver }) => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!receiver.wishlistId) {
            // Fallback for old links without a wishlistId.
            // Or if the live wishlist feature is not yet fully rolled out.
            const fallbackWishlist = {
                interests: receiver.interests,
                likes: receiver.likes,
                dislikes: receiver.dislikes,
                links: receiver.links,
                budget: receiver.budget,
            };
            setWishlist(fallbackWishlist);
            setStatus('success');
            return;
        }

        const fetchWishlist = async () => {
            setStatus('loading');
            try {
                const response = await fetch(`/.netlify/functions/get-wishlist?id=${receiver.wishlistId}`);
                if (!response.ok) {
                    // If fetch fails, use the data embedded in the link as a fallback
                    throw new Error('Failed to fetch live wishlist.');
                }
                const data = await response.json();
                setWishlist(data);
                setStatus('success');
            } catch (e) {
                console.error(e);
                // On error, create a wishlist from the receiver data in the URL
                 const fallbackWishlist = {
                    interests: receiver.interests,
                    likes: receiver.likes,
                    dislikes: receiver.dislikes,
                    links: receiver.links,
                    budget: receiver.budget,
                };
                setWishlist(fallbackWishlist);
                setStatus('error'); // Keep status as error to show a message if needed
            }
        };
        fetchWishlist();
    }, [receiver]);

    if (status === 'loading') {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg mt-12">
                <Loader2 className="animate-spin h-8 w-8 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Loading latest wishlist...</p>
            </div>
        );
    }
    
    // Even on error, we proceed with the fallback wishlist.
    // The error status can be used to show a small, non-blocking notification if desired.
    if (!wishlist) {
        // This case should ideally not be reached due to fallbacks.
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error loading wishlist.</div>
    }

    const persona = getGiftPersona({ ...receiver, ...wishlist });
    const allInterests = [...(wishlist.interests?.split(',') || []), ...(wishlist.likes?.split(',') || [])]
        .map(i => i.trim()).filter(Boolean);

    return (
        <div className="mt-12 space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 font-serif">Gift Inspiration for {receiver.name}</h2>
                <p className="text-slate-600 mt-2">Here are some ideas to help you find the perfect gift!</p>
                 {status === 'error' && (
                    <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-center max-w-md mx-auto">
                        <p className="text-xs text-yellow-800">Could not load live updates. Showing original wishlist details.</p>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Interests */}
                    {allInterests.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-md border">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Gift size={20} className="text-red-500"/> Interests, Hobbies & Likes</h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4">Click a tag for instant gift ideas on Amazon!</p>
                            <div className="flex flex-wrap gap-2">
                                {allInterests.map((idea, index) => (
                                    <a key={index} href={`https://www.amazon.com/s?k=${encodeURIComponent(idea)}&tag=secretsanta-20`} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold px-3 py-1 rounded-full text-sm transition-colors">
                                        {idea}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    {wishlist.links && (
                         <div className="bg-white p-6 rounded-2xl shadow-md border">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><LinkIcon size={20} className="text-green-500"/> Specific Links</h3>
                            <div className="mt-2 space-y-2 text-sm">
                                {wishlist.links.split('\n').map((link, i) => link.trim() && (
                                    <a key={i} href={link.trim()} target="_blank" rel="noopener noreferrer" className="block text-indigo-600 hover:underline truncate">{link.trim()}</a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* Persona */}
                {persona && (
                    <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200 lg:sticky lg:top-8">
                        <h3 className="font-bold text-indigo-800 text-lg">{receiver.name}'s Gift Persona:</h3>
                        <h4 className="font-serif text-2xl font-bold text-indigo-600">{persona.name}</h4>
                        <p className="text-sm text-indigo-700 mt-2">{persona.description}</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { p: participants, matches: matchIds, ...styleData } = data;
    const isOrganizerView = !currentParticipantId;

    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [initialModalView, setInitialModalView] = useState<string | null>(null);
    const [view, setView] = useState<'pre-reveal' | 'reveal'>(isOrganizerView ? 'reveal' : 'pre-reveal');
    const [copiedWishlistLink, setCopiedWishlistLink] = useState(false);
    
    const allMatches: Match[] = useMemo(() => matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [matchIds, participants]);

    useEffect(() => {
        // Logic to auto-open the modal
        const params = new URLSearchParams(window.location.search);
        const autoOpen = params.get('autoOpen');
        if (autoOpen) {
            setShowShareModal(true);
            setInitialModalView(autoOpen);
            // Clean up the URL
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
        }

        if (isOrganizerView) {
            setIsNameRevealed(true); // Organizers see everything
        } else {
            const match = allMatches.find(m => m.giver.id === currentParticipantId);
            setCurrentMatch(match || null);
            if (match) {
                 trackEvent('view_pre_reveal_page', { participant: match.giver.name });
            }
        }
    }, [currentParticipantId, allMatches, isOrganizerView]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        if (currentMatch) {
            trackEvent('reveal_name', { participant: currentMatch.giver.name });
        }
    };
    
    const handleStartOver = () => {
        trackEvent('click_start_over', { from: isOrganizerView ? 'organizer_results' : 'participant_results' });
        window.location.href = '/generator.html';
    };
    
    const handleShuffle = () => {
        trackEvent('click_shuffle_again', { from: 'organizer_results' });
        const result = generateMatches(data.p, data.exclusions, data.assignments);
        if (result.error || !result.matches) {
            alert(result.error || "Failed to generate matches.");
            return;
        }
        const newExchangeData: ExchangeData = {
            ...data,
            matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
        };
        const encoded = encodeData(newExchangeData);
        if (encoded) {
            window.location.hash = encoded;
            window.location.reload();
        }
    };

    const handleConfirmPreReveal = () => {
        setView('reveal');
        if (currentMatch) {
            trackEvent('confirm_pre_reveal', { participant: currentMatch.giver.name });
        }
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
        if (!currentMatch) {
            return (
                <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border">
                    <h1 className="text-3xl font-bold text-red-600 font-serif">Link Error</h1>
                    <p className="text-lg text-slate-600 mt-4">We couldn't find your match. This link might be invalid or the participant list may have changed.</p>
                    <p className="text-sm text-slate-500 mt-2">Please contact your event organizer for a new link.</p>
                </div>
            );
        }

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
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold font-serif text-slate-800">You are a Secret Santa!</h1>
                    <p className="text-slate-600 mt-2">Click the card below to reveal who you're getting a gift for.</p>
                </div>
                <div className="max-w-md mx-auto">
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
                </div>
                 {!isNameRevealed && (
                    <div className="text-center mt-6 h-48">
                        {/* Placeholder for scratch-to-reveal component */}
                    </div>
                )}
                {isNameRevealed && (
                    <>
                        <GiftInspirationSection receiver={currentMatch.receiver} />
                        {currentMatch.giver.wishlistId && (
                            <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 text-center">
                                <h3 className="text-xl font-bold text-indigo-800">Your Personal Wishlist Link</h3>
                                <p className="text-indigo-700 mt-2 text-sm">Want to update your own wishlist for your Secret Santa? Save this secret link. You can add new ideas anytime, and your Secret Santa will see them automatically!</p>
                                <div className="mt-4 flex items-center gap-2 max-w-md mx-auto">
                                    <input type="text" readOnly value={`${window.location.origin}/wishlist-editor.html?id=${currentMatch.giver.wishlistId}`} className="w-full p-2 border border-indigo-200 rounded-md bg-white text-sm truncate" />
                                    <button onClick={copyWishlistLink} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                                        {copiedWishlistLink ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderOrganizerView = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800 font-serif">Organizer's Master List</h1>
                <p className="text-slate-600 mt-2">Here are all the Secret Santa matches. Keep this page safe!</p>
            </div>
            <div className="mt-8 text-center flex flex-wrap justify-center gap-4">
                <button onClick={() => { setShowShareModal(true); setInitialModalView('share'); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center gap-2">
                    <Share2 size={20}/> Share Links & Download Cards
                </button>
                 <button 
                    onClick={handleShuffle}
                    className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-full transition-colors text-sm"
                >
                    <RefreshCw size={16}/>
                    Shuffle Again
                </button>
            </div>
            <div className="mt-8">
                <ResultsDisplay matches={allMatches} />
            </div>
        </div>
    );

    return (
        <>
            <Header />
            <div className="bg-slate-50 min-h-screen">
                <main className="py-12 px-4">
                    <div className="container mx-auto max-w-4xl">
                        {isOrganizerView ? renderOrganizerView() : renderParticipantView()}
                        <div className="text-center mt-12 pt-8 border-t border-slate-200">
                            <button onClick={handleStartOver} className="text-slate-500 hover:text-red-600 font-semibold flex items-center gap-2 mx-auto">
                                <Home size={18} /> Start a New Game
                            </button>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
            {showShareModal && isOrganizerView && (
                <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} initialView={initialModalView} />
            )}
        </>
    );
};

export default ResultsPage;