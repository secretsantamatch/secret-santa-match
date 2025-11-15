import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import { ShareLinksModal } from './ShareLinksModal';
import WishlistEditorModal from './WishlistEditorModal';
import ConfirmationModal from './ConfirmationModal';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { generateMatches } from '../services/matchService';
import { Share2, Gift, Shuffle, Loader2, Copy, Check, Eye, EyeOff, MessageCircle, Bookmark } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import LinkPreview from './LinkPreview';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
    onDataUpdated: (newMatches: { g: string; r: string }[]) => void;
}

type LiveWishlists = Record<string, Partial<Omit<Participant, 'id' | 'name'>>>;


const AmazonLinker: React.FC<{ items: string, label: string }> = ({ items, label }) => {
    if (!items || items.trim() === '') return null;

    const affiliateTag = "secretsanmat-20"; // Your Amazon Affiliate Tag

    const createAmazonLink = (searchTerm: string) => {
        return `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&tag=${affiliateTag}`;
    };

    const linkedItems = items.split(',').map(item => item.trim()).filter(Boolean);

    return (
        <p><strong className="font-semibold text-slate-800">{label}:</strong>{' '}
            {linkedItems.map((item, index) => (
                <React.Fragment key={index}>
                    <a
                        href={createAmazonLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                    >
                        {item}
                    </a>
                    {index < linkedItems.length - 1 && ', '}
                </React.Fragment>
            ))}
        </p>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId, onDataUpdated }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
    const [shareModalInitialView, setShareModalInitialView] = useState<'links' | 'print' | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [shortOrganizerLink, setShortOrganizerLink] = useState('');
    const [organizerLinkCopied, setOrganizerLinkCopied] = useState(false);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [liveWishlists, setLiveWishlists] = useState<LiveWishlists>({});
    const [isWishlistLoading, setIsWishlistLoading] = useState(true);

    const isOrganizer = !currentParticipantId;

    const { p: participantsFromUrl, matches: matchIds, exclusions, assignments, id: exchangeId } = data;
    
    const fetchWishlists = useCallback(async () => {
        if (!exchangeId) {
            setIsWishlistLoading(false);
            return;
        };
        setIsWishlistLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/get-wishlist?exchangeId=${exchangeId}`);
            if (res.ok) {
                const wishlistData = await res.json();
                setLiveWishlists(wishlistData);
            }
        } catch (e) {
            console.error("Failed to fetch wishlists", e);
        } finally {
            setIsWishlistLoading(false);
        }
    }, [exchangeId]);

    useEffect(() => {
        fetchWishlists();
    }, [fetchWishlists]);
    
    const participants = useMemo(() => {
        return participantsFromUrl.map(p => ({
            ...p,
            ...(liveWishlists[p.id] || {})
        }));
    }, [participantsFromUrl, liveWishlists]);


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

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        } else if (consent === 'true') {
            trackEvent('view_results_page', { is_organizer: isOrganizer, participant_id: currentParticipantId });
        }

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
    }, [isOrganizer, currentParticipantId]);
    
    const handleCookieAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShowCookieBanner(false);
        trackEvent('cookie_consent_accept');
        trackEvent('view_results_page', { is_organizer: isOrganizer, participant_id: currentParticipantId });
    };

    const handleCookieDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setShowCookieBanner(false);
    };

    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_name');
        setTimeout(() => {
            setDetailsVisible(true);
        }, 2500); // Match animation duration from PrintableCard + buffer
    };
    
    const handleWishlistSaveSuccess = () => {
        fetchWishlists(); // Re-fetch the live data
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
    
    const hasLinks = currentMatch && Array.isArray(currentMatch.receiver.links) && currentMatch.receiver.links.some(link => link && link.trim() !== '');
    const hasDetails = currentMatch && (currentMatch.receiver.interests || currentMatch.receiver.likes || currentMatch.receiver.dislikes || currentMatch.receiver.budget);

    return (
        <div className="bg-slate-50 min-h-screen">
            {isShareModalOpen && <ShareLinksModal exchangeData={{ ...data, p: participants }} onClose={() => setIsShareModalOpen(false)} initialView={shareModalInitialView as string} />}
            {isWishlistModalOpen && currentParticipant && exchangeId && (
                <WishlistEditorModal 
                    participant={currentParticipant}
                    exchangeId={exchangeId}
                    onClose={() => setIsWishlistModalOpen(false)}
                    onSaveSuccess={handleWishlistSaveSuccess}
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
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl pb-16">
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
                        {exchangeId && <ResultsDisplay matches={matches} exchangeId={exchangeId} liveWishlists={liveWishlists} />}
                    </div>
                ) : (
                    currentMatch && (
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                            <div className="w-full max-w-sm mx-auto md:flex-shrink-0">
                                <PrintableCard 
                                    match={currentMatch} 
                                    eventDetails={data.eventDetails} 
                                    isNameRevealed={isNameRevealed} 
                                    backgroundOptions={data.backgroundOptions} 
                                    bgId={data.bgId} 
                                    bgImg={data.customBackground} 
                                    txtColor={data.textColor} 
                                    outline={data.useTextOutline} 
                                    outColor={data.outlineColor} 
                                    outSize={data.outlineSize} 
                                    fontSize={data.fontSizeSetting} 
                                    font={data.fontTheme} 
                                    line={data.lineSpacing} 
                                    greet={data.greetingText} 
                                    intro={data.introText} 
                                    wish={data.wishlistLabelText}
                                    showLinks={false}
                                />
                            </div>
                             <div className="text-center md:text-left h-fit w-full max-w-md">
                                {!isNameRevealed ? (
                                    <div className="p-6">
                                        <h1 className="text-3xl md:text-4xl font-bold text-green-700 font-serif">Hi, {currentMatch.giver.name}!</h1>
                                        <p className="text-lg text-slate-600 mt-2">
                                            Welcome to your private reveal page!
                                        </p>
                                        <p className="text-sm text-slate-600 mt-4">
                                            <strong>Is this your name?</strong> If not, please contact your organizer.
                                        </p>
                                        <p className="text-base text-slate-500 mt-6">
                                            Click the button below to see who you're the Secret Santa for and view their wishlist.
                                            You can update your own wishlist on the next page!
                                        </p>
                                        <button onClick={handleReveal} className="mt-8 w-full py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                                            Click to Continue
                                        </button>
                                        <div className="mt-8">
                                            <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-6">
                                        <p className="text-lg text-slate-600">
                                            <span className="font-bold text-green-700">{currentMatch.giver.name}</span>, you are the Secret Santa for...
                                        </p>
                                        
                                        <button onClick={() => setIsWishlistModalOpen(true)} className="w-full md:w-auto py-3 px-6 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors">
                                            Edit My Wishlist for My Santa
                                        </button>
                                        
                                        {detailsVisible && (
                                            <div className="bg-slate-100 rounded-2xl p-6 border text-left shadow-inner space-y-6">
                                                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg">
                                                    <div className="flex">
                                                        <div className="py-1"><Bookmark className="h-5 w-5 text-amber-500 mr-3" /></div>
                                                        <div>
                                                            <p className="font-bold">Save Your Link!</p>
                                                            <p className="text-sm">Bookmark this page to easily come back and check your person's wishlist.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-6 border text-left shadow-md space-y-4">
                                                    <div className="text-center border-b pb-4">
                                                        <h3 className="font-bold text-lg text-slate-700">Your Person is:</h3>
                                                        <p className="text-4xl font-bold text-red-600">{currentMatch.receiver.name}</p>
                                                    </div>

                                                    {hasDetails && (
                                                        <div>
                                                            <h4 className="font-bold text-slate-700 mb-2">Their Gift Ideas</h4>
                                                            <div className="space-y-1 text-slate-600 text-sm pl-2">
                                                                <AmazonLinker items={currentMatch.receiver.interests} label="Interests" />
                                                                <AmazonLinker items={currentMatch.receiver.likes} label="Likes" />
                                                                {currentMatch.receiver.dislikes && <p><strong className="font-semibold text-slate-800">Dislikes:</strong> {currentMatch.receiver.dislikes}</p>}
                                                                {currentMatch.receiver.budget && <p><strong className="font-semibold text-slate-800">Budget:</strong> {currentMatch.receiver.budget}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {hasLinks && (
                                                        <div>
                                                            <h4 className="font-bold text-slate-700 mb-3">Their Wishlist Links</h4>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {currentMatch.receiver.links.map((link, index) => (
                                                                    link.trim() ? <LinkPreview key={index} url={link} /> : null
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {data.eventDetails && (
                                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                                        <p className="text-sm text-amber-800 text-center">{data.eventDetails}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </main>
            <Footer />
            {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
        </div>
    );
};

export default ResultsPage;