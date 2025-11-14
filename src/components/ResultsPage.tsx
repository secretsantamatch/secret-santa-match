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
import { Share2, Gift, Shuffle, Loader2, Copy, Check } from 'lucide-react';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
    onDataUpdated: (newMatches: { g: string; r: string }[]) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId, onDataUpdated }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
    const [shareModalInitialView, setShareModalInitialView] = useState<'links' | 'print' | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [shortOrganizerLink, setShortOrganizerLink] = useState('');
    const [organizerLinkCopied, setOrganizerLinkCopied] = useState(false);
    const [liveReceiver, setLiveReceiver] = useState<Participant | null>(null);


    const isOrganizer = !currentParticipantId;

    const { p: participants, matches: matchIds, exclusions, assignments } = data;

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

    // This effect fetches the most up-to-date wishlist for the receiver.
    useEffect(() => {
        if (currentMatch?.receiver) {
            // Set initial state from URL data
            setLiveReceiver(currentMatch.receiver);

            // Fetch latest version from blob store
            fetch(`/.netlify/functions/get-wishlist?exchangeId=${data.id}&participantId=${currentMatch.receiver.id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    return null;
                })
                .then(wishlistData => {
                    if (wishlistData) {
                        setLiveReceiver(prev => prev ? { ...prev, ...wishlistData } : null);
                    }
                })
                .catch(err => console.error("Failed to fetch live wishlist", err));
        }
    }, [currentMatch, data.id]);


    useEffect(() => {
        trackEvent('view_results_page', { is_organizer: isOrganizer, participant_id: currentParticipantId });

        if (isOrganizer) {
            const getFullOrganizerLink = (): string => window.location.href.split('?')[0];
            const fetchShortLink = async () => {
                const fullLink = getFullOrganizerLink();
                try {
                    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullLink)}`);
                    if (res.ok) {
                        const shortUrl = await res.text();
                        setShortOrganizerLink(shortUrl && !shortUrl.toLowerCase().includes('error') ? shortUrl : fullLink);
                    } else { setShortOrganizerLink(fullLink); }
                } catch (e) { setShortOrganizerLink(fullLink); }
            };
            fetchShortLink();
        }
    }, [isOrganizer, data]);

    const handleReveal = () => { setIsNameRevealed(true); trackEvent('reveal_name'); };
    
    // This is now an optimistic update. The real save happens in the modal via fetch.
    const handleWishlistUpdate = (updatedParticipant: Participant) => {
        // This is tricky because we can't directly update the parent's full state here.
        // For now, we'll update the liveReceiver state for an immediate UI change.
        if (liveReceiver && liveReceiver.id === updatedParticipant.id) {
            setLiveReceiver(updatedParticipant);
        } else if (currentParticipant && currentParticipant.id === updatedParticipant.id) {
            // If the user is editing their OWN wishlist for their Santa
            // there's no UI to update on this screen, but the data is saved.
        }
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
            await new Promise(resolve => setTimeout(resolve, 300));
            const result = generateMatches(participants, exclusions || [], assignments || []);
            if (!result.matches) throw new Error(result.error || "Failed to generate new matches.");
            
            const newRawMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
            onDataUpdated(newRawMatches);
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
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Error</h2>
                <p className="text-slate-600">Could not find your match in this gift exchange.</p>
            </div>
        );
    }
    
    // Create a new match object with the potentially updated receiver data for rendering
    const displayMatch = currentMatch && liveReceiver ? { ...currentMatch, receiver: liveReceiver } : currentMatch;

    return (
        <div className="bg-slate-50 min-h-screen">
            {isShareModalOpen && <ShareLinksModal exchangeData={data} onClose={() => setIsShareModalOpen(false)} initialView={shareModalInitialView as string} />}
            {isWishlistModalOpen && currentParticipant && data.id && (
                <WishlistEditorModal 
                    participant={currentParticipant}
                    exchangeId={data.id} 
                    onClose={() => setIsWishlistModalOpen(false)}
                    onSave={handleWishlistUpdate}
                />
            )}
             <ConfirmationModal
                isOpen={isShuffleModalOpen}
                onClose={() => setIsShuffleModalOpen(false)}
                onConfirm={executeShuffle}
                title="Are you sure you want to shuffle?"
                message="This will generate a new set of matches for everyone. Any links you've already shared will show the new results."
                confirmText="Yes, Shuffle"
                cancelText="Cancel"
            />
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {isOrganizer ? (
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 text-center">
                            <Gift className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Success! Your Game is Ready!</h1>
                            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">All names have been drawn. Use the buttons below to manage your event.</p>
                            <div className="mt-8 flex flex-wrap gap-4 justify-center">
                                <button onClick={() => openShareModal('links')} className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                                    <Share2 size={20} /> Share & Download Hub
                                </button>
                                <button onClick={() => { trackEvent('shuffle_again_click'); setIsShuffleModalOpen(true); }} disabled={isShuffling} className="py-3 px-6 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                                    {isShuffling ? <Loader2 size={20} className="animate-spin" /> : <Shuffle size={20} />}
                                    {isShuffling ? 'Shuffling...' : 'Shuffle'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center">
                             <h2 className="text-2xl font-bold text-amber-900">Your Organizer Master Link</h2>
                            <p className="text-amber-800 mt-2 mb-4 text-base">
                                <strong className="text-red-700 font-extrabold">Important:</strong> Save this link! It's the only way to get back to this page. If you lose it, you will have to start over.
                            </p>
                            <div className="max-w-md mx-auto flex items-center gap-2">
                                <input type="text" readOnly value={shortOrganizerLink || 'Generating link...'} className="w-full p-2 border border-amber-300 rounded-md bg-white text-sm truncate" />
                                <button onClick={handleCopyOrganizerLink} disabled={!shortOrganizerLink} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0 disabled:opacity-50">
                                    {organizerLinkCopied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" />
                        {/* FIX: Pass the required `exchangeId` prop to ResultsDisplay. */}
                        <ResultsDisplay matches={matches} exchangeId={data.id!} />
                    </div>
                ) : (
                    displayMatch && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="w-full max-w-sm mx-auto">
                                    <PrintableCard match={displayMatch} eventDetails={data.eventDetails} isNameRevealed={isNameRevealed} backgroundOptions={data.backgroundOptions} bgId={data.bgId} bgImg={data.customBackground} txtColor={data.textColor} outline={data.useTextOutline} outColor={data.outlineColor} outSize={data.outlineSize} fontSize={data.fontSizeSetting} font={data.fontTheme} line={data.lineSpacing} greet={data.greetingText} intro={data.introText} wish={data.wishlistLabelText}/>
                                </div>
                                <div className="text-center md:text-left">
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Hi, {displayMatch.giver.name}!</h1>
                                    <p className="text-lg text-slate-600 mt-2">You're a Secret Santa! Here is your private card with your match's details.</p>
                                    
                                    {!isNameRevealed && (
                                        <button onClick={handleReveal} className="mt-8 w-full md:w-auto py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                                            Click to Reveal Your Person!
                                        </button>
                                    )}
                                    {isNameRevealed && (
                                        <div className="mt-8 space-y-4">
                                            <div className="bg-white rounded-lg p-6 border text-left"><h3 className="font-bold text-lg text-slate-700">Your Person:</h3><p className="text-2xl font-bold text-red-600">{displayMatch.receiver.name}</p></div>
                                            <button onClick={() => setIsWishlistModalOpen(true)} className="w-full md:w-auto py-3 px-6 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors">
                                                Edit My Wishlist for My Santa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8"><AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" /></div>
                        </>
                    )
                )}
            </main>
            <Footer />
        </div>
    );
};

export default ResultsPage;