import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import WishlistEditorModal from './WishlistEditorModal';
import ConfirmationModal from './ConfirmationModal';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { generateMatches } from '../services/matchService';
import { Download, Share2, Edit, Gift, Users, Shuffle, Loader2, Copy, Check } from 'lucide-react';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
    const [exchangeData, setExchangeData] = useState(data);
    const [shareModalInitialView, setShareModalInitialView] = useState<'links' | 'print' | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [shortOrganizerLink, setShortOrganizerLink] = useState('');
    const [organizerLinkCopied, setOrganizerLinkCopied] = useState(false);


    const isOrganizer = !currentParticipantId;

    useEffect(() => {
        trackEvent('view_results_page', {
            is_organizer: isOrganizer,
            participant_id: currentParticipantId
        });

        if (!isOrganizer) return;
        
        const getFullOrganizerLink = (): string => {
            const baseUrl = window.location.origin + '/generator.html';
            return `${baseUrl}#${exchangeData.id}`;
        }
        
        const fetchShortLink = async () => {
            try {
                const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(getFullOrganizerLink())}`);
                if (res.ok) {
                    const shortUrl = await res.text();
                    if (shortUrl && !shortUrl.toLowerCase().includes('error')) {
                        setShortOrganizerLink(shortUrl);
                    } else {
                        setShortOrganizerLink(getFullOrganizerLink());
                    }
                } else {
                    setShortOrganizerLink(getFullOrganizerLink());
                }
            } catch (e) {
                console.error("TinyURL error for organizer link", e);
                setShortOrganizerLink(getFullOrganizerLink());
            }
        };
        fetchShortLink();

    }, [isOrganizer, exchangeData.id, currentParticipantId]);

    const { p: participants, matches: matchIds, exclusions, assignments } = exchangeData;

    const matches: Match[] = useMemo(() => matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [matchIds, participants]);
    
    const currentParticipant = useMemo(() =>
        currentParticipantId ? participants.find(p => p.id === currentParticipantId) : null,
    [participants, currentParticipantId]);
    
    const currentMatch = useMemo(() =>
        currentParticipant ? matches.find(m => m.giver.id === currentParticipant.id) : null,
    [matches, currentParticipant]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_name');
    };
    
    const handleSaveWishlist = (updatedParticipant: Participant) => {
        setExchangeData(prevData => ({
            ...prevData,
            p: prevData.p.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
        }));
        trackEvent('wishlist_save_success');
    };

    const openShareModal = (view: 'links' | 'print') => {
        setShareModalInitialView(view);
        setIsShareModalOpen(true);
        trackEvent('open_share_modal', { initial_view: view });
    };

    const executeShuffle = async () => {
        if (!isOrganizer) return;
        
        setIsShuffling(true);
        trackEvent('shuffle_again_confirmed');

        try {
            const result = generateMatches(participants, exclusions || [], assignments || []);
            if (!result.matches) {
                throw new Error(result.error || "Failed to generate new matches.");
            }
            
            const newRawMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));

            const response = await fetch('/.netlify/functions/update-matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exchangeId: exchangeData.id,
                    matches: newRawMatches,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save new matches.');
            }

            setExchangeData(prev => ({ ...prev, matches: newRawMatches }));
            trackEvent('shuffle_again_success');
            
        } catch (error) {
            console.error("Shuffle Error:", error);
            alert(`Could not shuffle matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
            trackEvent('shuffle_again_fail', { error: error instanceof Error ? error.message : 'unknown' });
        } finally {
            setIsShuffling(false);
        }
    };
    
    const handleCopyOrganizerLink = () => {
        if (!shortOrganizerLink) return;
        navigator.clipboard.writeText(shortOrganizerLink).then(() => {
            setOrganizerLinkCopied(true);
            setTimeout(() => setOrganizerLinkCopied(false), 2500);
            trackEvent('copy_link', { link_type: 'organizer_master_link' });
        });
    };

    if (!isOrganizer && !currentMatch) {
         return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border max-w-lg">
                    <h2 className="text-2xl font-bold text-red-600">Invalid Link</h2>
                    <p className="text-slate-600 mt-2">We couldn't find your match. Please check the link or contact your organizer.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-50 min-h-screen">
            {isShareModalOpen && <ShareLinksModal exchangeData={exchangeData} onClose={() => setIsShareModalOpen(false)} initialView={shareModalInitialView as string} />}
            {isWishlistModalOpen && currentParticipant && (
                <WishlistEditorModal 
                    participant={currentParticipant} 
                    exchangeId={exchangeData.id!}
                    onClose={() => setIsWishlistModalOpen(false)}
                    onSave={handleSaveWishlist}
                />
            )}
             <ConfirmationModal
                isOpen={isShuffleModalOpen}
                onClose={() => setIsShuffleModalOpen(false)}
                onConfirm={executeShuffle}
                title="Are you sure you want to shuffle again?"
                message="This will generate a new set of matches for everyone. Any links you've already shared will show the new results."
                confirmText="Yes, Shuffle Again"
                cancelText="Cancel"
            />
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {isOrganizer ? (
                    // Organizer View
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 text-center">
                             <Gift className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Success! Your Game is Ready!</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
                                All names have been drawn. Use the buttons below to share the private links with each participant or download printable cards for your event.
                            </p>
                             <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => openShareModal('links')} className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                                    <Share2 size={20} /> Share & Download Hub
                                </button>
                                <button 
                                    onClick={() => {
                                        trackEvent('shuffle_again_click');
                                        setIsShuffleModalOpen(true);
                                    }}
                                    disabled={isShuffling}
                                    className="py-3 px-6 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                                    {isShuffling ? <Loader2 size={20} className="animate-spin" /> : <Shuffle size={20} />}
                                    {isShuffling ? 'Shuffling...' : 'Shuffle Again'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center">
                            <h2 className="text-xl font-bold text-amber-900">Your Organizer Master Link</h2>
                            <p className="text-amber-800 mt-1 mb-4 text-sm">
                                <strong>Important:</strong> Save this link! It's the only way to get back to this page to see matches and share links.
                            </p>
                            <div className="max-w-md mx-auto flex items-center gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={shortOrganizerLink || 'Generating link...'} 
                                    className="w-full p-2 border border-amber-300 rounded-md bg-white text-sm truncate" 
                                />
                                <button 
                                    onClick={handleCopyOrganizerLink}
                                    disabled={!shortOrganizerLink}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0 disabled:opacity-50"
                                >
                                    {organizerLinkCopied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <AdBanner
                            data-ad-client="ca-pub-3037944530219260"
                            data-ad-slot="YOUR_AD_SLOT_ID_3"
                            data-ad-format="auto"
                            data-full-width-responsive="true"
                        />

                        <ResultsDisplay matches={matches} />
                    </div>
                ) : (
                    // Participant View
                    currentMatch && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="w-full max-w-sm mx-auto">
                                    <PrintableCard
                                        match={currentMatch}
                                        eventDetails={exchangeData.eventDetails}
                                        isNameRevealed={isNameRevealed}
                                        backgroundOptions={exchangeData.backgroundOptions}
                                        bgId={exchangeData.bgId}
                                        bgImg={exchangeData.customBackground}
                                        txtColor={exchangeData.textColor}
                                        outline={exchangeData.useTextOutline}
                                        outColor={exchangeData.outlineColor}
                                        outSize={exchangeData.outlineSize}
                                        fontSize={exchangeData.fontSizeSetting}
                                        font={exchangeData.fontTheme}
                                        line={exchangeData.lineSpacing}
                                        greet={exchangeData.greetingText}
                                        intro={exchangeData.introText}
                                        wish={exchangeData.wishlistLabelText}
                                    />
                                </div>
                                <div className="text-center md:text-left">
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Hi, {currentMatch.giver.name}!</h1>
                                    <p className="text-lg text-slate-600 mt-2">You're a Secret Santa! Here is your private card with your match's details.</p>
                                    
                                    {!isNameRevealed && (
                                        <button onClick={handleReveal} className="mt-8 w-full md:w-auto py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                                            Click to Reveal Your Person!
                                        </button>
                                    )}
                                    {isNameRevealed && (
                                        <div className="mt-8 space-y-4">
                                            <div className="bg-white rounded-lg p-6 border text-left">
                                                <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2"><Users size={20}/>Your Person:</h3>
                                                <p className="text-2xl font-bold text-red-600">{currentMatch.receiver.name}</p>
                                            </div>
                                            <button onClick={() => setIsWishlistModalOpen(true)} className="w-full md:w-auto py-3 px-6 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                                                <Edit size={18} /> Edit My Wishlist for My Santa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="mt-8">
                                <AdBanner
                                    data-ad-client="ca-pub-3037944530219260"
                                    data-ad-slot="YOUR_AD_SLOT_ID_3"
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"
                                />
                            </div>
                        </>
                    )
                )}
            </main>
            <Footer />
        </div>
    );
};

export default ResultsPage;