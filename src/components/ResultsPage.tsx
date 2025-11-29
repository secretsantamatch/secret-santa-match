
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { Share2, Gift, Shuffle, Loader2, Copy, Check, ChevronDown, RefreshCw, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import LinkPreview from './LinkPreview';
import { shouldTrackByDefault, isEuVisitor } from '../utils/privacy';
import { getBestPromo } from '../services/promoEngine';
import { SmartAd } from './AdWidgets';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
    onDataUpdated: (newMatches: { g: string; r: string }[]) => void;
}

type LiveWishlists = Record<string, Partial<Omit<Participant, 'id' | 'name'>>>;

// --- PERSONAL NUDGE COMPONENT ---
// Shows a helpful context message based on the date
const PersonalNudge: React.FC<{ giverName: string }> = ({ giverName }) => {
    const today = new Date();
    // Only show before Dec 26th
    if (today.getMonth() === 11 && today.getDate() > 25) return null; 
    
    const dateStr = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(today);
    
    return (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in">
           <div className="flex items-start gap-3">
               <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-0.5">
                   <Clock size={18} />
               </div>
               <div>
                   <p className="text-indigo-900 text-sm font-medium">
                      <strong>Hi {giverName}, it's {dateStr}.</strong>
                   </p>
                   <p className="text-indigo-800 text-sm mt-1">
                      Are you all set for your gift exchange? Based on your match, we found a few ideas below.
                   </p>
               </div>
           </div>
        </div>
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
    
    const detailsRef = useRef<HTMLDivElement>(null);
    const lastFetchedUrlRef = useRef<string>('');

    const isOrganizer = !currentParticipantId;
    const pagePath = isOrganizer ? '/secret-santa/organizer-dashboard' : '/secret-santa/reveal';

    const { p: participantsFromUrl, matches: matchIds, exclusions, assignments, id: exchangeId } = data;
    
    const fetchWishlists = useCallback(async (isBackground = false) => {
        if (!exchangeId) {
            setIsWishlistLoading(false);
            return;
        };
        if (!isBackground) setIsWishlistLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/get-wishlist?exchangeId=${exchangeId}&t=${Date.now()}`, {
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const wishlistData = await res.json();
                setLiveWishlists(wishlistData);
            }
        } catch (e) {
            console.error("Failed to fetch wishlists", e);
        } finally {
            if (!isBackground) setIsWishlistLoading(false);
        }
    }, [exchangeId]);

    useEffect(() => {
        fetchWishlists(); 
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchWishlists(true); 
            }
        }, 15000);
        return () => clearInterval(intervalId);
    }, [fetchWishlists]);
    
    const participants = useMemo(() => {
        return participantsFromUrl.map(p => ({
            ...p,
            ...(liveWishlists[p.id] || {})
        }));
    }, [participantsFromUrl, liveWishlists]);

    const handleWishlistSaveSuccess = (newWishlist: any) => {
        if (currentParticipantId) {
            setLiveWishlists(prev => ({
                ...prev,
                [currentParticipantId]: newWishlist
            }));
        }
    };

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

    // --- SMART AD ENGINE INTEGRATION ---
    
    // 1. Pre-Reveal Deal: Broad appeal (usually GiftCards.com or Seasonal)
    const PreRevealPromo = useMemo(() => {
        // Passing 'gift cards' hints the engine to look for general deals if no dates override it
        const match = getBestPromo('gift cards'); 
        return match ? <SmartAd partner={match.partner} creative={match.creative} placement="pre-reveal" /> : null;
    }, []);

    // 2. Post-Reveal Deal: Contextually matched to the receiver's interests
    const ContextualPromoData = useMemo(() => {
        if (!currentMatch) return null;
        const combinedText = `${currentMatch.receiver.interests || ''} ${currentMatch.receiver.likes || ''}`;
        // If empty, the engine will return the high-converting fallback (Personalized Visa)
        return getBestPromo(combinedText);
    }, [currentMatch]);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        }
        
        if (shouldTrackByDefault()) {
             trackEvent('view_results_page', { is_organizer: isOrganizer, participant_id: currentParticipantId, page_path: pagePath });
             trackEvent('page_view', {
                page_title: isOrganizer ? 'Secret Santa Organizer Dashboard' : 'Secret Santa Reveal Page',
                page_location: window.location.href,
                page_path: pagePath
             });
             if (isOrganizer) {
                 trackEvent('organizer_dashboard_loaded', {
                     participant_count: matches.length,
                     has_budget: matches.some(m => m.receiver.budget),
                     page_path: pagePath
                 });
             }
        }

        if (isOrganizer) {
            const getFullOrganizerLink = (): string => window.location.href.split('?')[0];
            const fetchShortLink = async () => {
                const fullLink = getFullOrganizerLink();
                if (fullLink === lastFetchedUrlRef.current) return;

                try {
                    const res = await fetch('/.netlify/functions/create-short-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            fullUrl: fullLink,
                            uniqueKey: `organizer_${exchangeId}`
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setShortOrganizerLink(data.shortUrl);
                        lastFetchedUrlRef.current = fullLink; 
                        try {
                            localStorage.setItem(`short_${exchangeId}_organizer`, data.shortUrl);
                        } catch(e) {}
                    } else { setShortOrganizerLink(fullLink); }
                } catch (e) { setShortOrganizerLink(fullLink); }
            };
            
            const cached = localStorage.getItem(`short_${exchangeId}_organizer`);
            if (cached) setShortOrganizerLink(cached);
            
            fetchShortLink();
        }
    }, [isOrganizer, currentParticipantId, matches.length, exchangeId]);
    
    const handleCookieAccept = () => { localStorage.setItem('cookie_consent', 'true'); setShowCookieBanner(false); trackEvent('cookie_consent_accept'); };
    const handleCookieDecline = () => { localStorage.setItem('cookie_consent', 'false'); setShowCookieBanner(false); };
    const handleReveal = () => { setIsNameRevealed(true); trackEvent('reveal_name', { page_path: pagePath }); setTimeout(() => { setDetailsVisible(true); trackEvent('reveal_complete', { page_path: pagePath }); if (detailsRef.current) detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 4500); };
    const scrollToDetails = () => { if (detailsRef.current) detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const openShareModal = (view: 'links' | 'print') => { setShareModalInitialView(view); setIsShareModalOpen(true); trackEvent('open_share_modal', { initial_view: view, page_path: pagePath }); };
    const openWishlistModal = () => { setIsWishlistModalOpen(true); trackEvent('open_wishlist_editor', { page_path: pagePath }); };
    const executeShuffle = async () => { if (!isOrganizer) return; setIsShuffling(true); trackEvent('shuffle_again_confirmed', { page_path: pagePath }); try { await new Promise(resolve => setTimeout(resolve, 300)); const result = generateMatches(participants, exclusions || [], assignments || []); if (!result.matches) throw new Error(result.error || "Failed to generate new matches."); const newRawMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })); onDataUpdated(newRawMatches); trackEvent('shuffle_again_success', { page_path: pagePath }); } catch (error) { console.error("Shuffle Error:", error); alert(`Could not shuffle matches: ${error instanceof Error ? error.message : 'Unknown error'}`); trackEvent('shuffle_again_fail', { error: error instanceof Error ? error.message : 'unknown', page_path: pagePath }); } finally { setIsShuffling(false); } };
    const handleCopyOrganizerLink = () => { if (!shortOrganizerLink) return; navigator.clipboard.writeText(shortOrganizerLink).then(() => { setOrganizerLinkCopied(true); setTimeout(() => setOrganizerLinkCopied(false), 2500); trackEvent('copy_link', { link_type: 'organizer_master_link', page_path: pagePath }); }); };
    const handleManualRefresh = () => { fetchWishlists(false); };
    
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

    // Dynamic Header Text for the Ad
    let promoHeader = "🏆 Trending Gift Idea";
    if (ContextualPromoData && !ContextualPromoData.isFallback && currentMatch) {
        // High-end personalized text
        promoHeader = `💎 A Curated Find for ${currentMatch.receiver.name}`;
    } else if (ContextualPromoData && ContextualPromoData.isFallback) {
        promoHeader = "💳 Most Popular Choice";
    }

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
                                <button onClick={() => { trackEvent('shuffle_again_click', { page_path: pagePath }); setIsShuffleModalOpen(true); }} disabled={isShuffling} className="py-3 px-6 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait">
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
                        {exchangeId && <ResultsDisplay matches={matches} exchangeId={exchangeId} liveWishlists={liveWishlists} onRefresh={handleManualRefresh} isRefreshing={isWishlistLoading} />}
                    </div>
                ) : (
                    currentMatch && (
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                            <div className="w-full max-w-sm mx-auto md:flex-shrink-0">
                                <PrintableCard 
                                    match={currentMatch} 
                                    eventDetails={data.eventDetails} 
                                    isNameRevealed={isNameRevealed} 
                                    backgroundOptions={data.backgroundOptions || []} 
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
                                        
                                        {/* Dynamic Ad: Pre-Reveal with Trusted Partner Wrapper */}
                                        {PreRevealPromo && (
                                            <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                                                <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="text-green-600" size={18} />
                                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Trusted Partner</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">Sponsored</span>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                            <Gift size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="font-bold text-slate-800 text-sm leading-tight">GiftCards.com</h4>
                                                            <p className="text-xs text-slate-500">The safe, instant way to send gifts from 350+ top brands.</p>
                                                        </div>
                                                    </div>
                                                    {PreRevealPromo}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-8">
                                            <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="3456789012" data-ad-format="auto" data-full-width-responsive="true" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-6">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                            <p className="text-lg text-slate-600">
                                                <span className="font-bold text-green-700">{currentMatch.giver.name}</span>, you are the Secret Santa for...
                                            </p>
                                            <p className="text-2xl font-bold text-red-600 mt-2 min-h-[2rem]">
                                                {detailsVisible ? currentMatch.receiver.name : <span className="animate-bounce inline-block text-3xl">...</span>}
                                            </p>
                                        </div>
                                        
                                        {detailsVisible && (
                                            <>
                                                <button 
                                                    onClick={scrollToDetails}
                                                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                                >
                                                    <Gift size={24} /> View {currentMatch.receiver.name}'s Wishlist
                                                </button>

                                                <button onClick={openWishlistModal} className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md">
                                                    Edit My Own Wishlist
                                                </button>
                                            </>
                                        )}
                                        
                                        {!detailsVisible && (
                                            <div className="w-full py-4 text-center text-slate-400 font-semibold animate-pulse">
                                                Drumroll please... 🥁
                                            </div>
                                        )}
                                        
                                        {detailsVisible && (
                                            <div ref={detailsRef} className="bg-slate-100 rounded-2xl p-6 border text-left shadow-inner space-y-6 animate-fade-in scroll-mt-24">
                                                
                                                <div className="bg-white rounded-lg p-6 border text-left shadow-md space-y-4 relative">
                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1">
                                                        <ChevronDown size={14}/> {currentMatch.receiver.name}'s Wishlist <ChevronDown size={14}/>
                                                    </div>

                                                    <div className="absolute top-2 right-2">
                                                        <button 
                                                            onClick={handleManualRefresh}
                                                            className={`p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${isWishlistLoading ? 'animate-spin text-blue-500' : ''}`}
                                                            title="Refresh Wishlist"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    </div>

                                                    {isWishlistLoading ? (
                                                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                                            <p className="text-sm text-slate-500 font-medium">Syncing latest wishlist...</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <PersonalNudge giverName={currentMatch.giver.name} />

                                                            {hasDetails ? (
                                                                <div>
                                                                    <h4 className="font-bold text-slate-700 mb-3 mt-2">Their Gift Ideas</h4>
                                                                    <div className="space-y-2 text-slate-600 text-sm pl-2 break-all">
                                                                        {currentMatch.receiver.interests && (
                                                                            <p><strong className="font-semibold text-slate-800">Interests:</strong> {currentMatch.receiver.interests}</p>
                                                                        )}
                                                                        {currentMatch.receiver.likes && (
                                                                            <p><strong className="font-semibold text-slate-800">Likes:</strong> {currentMatch.receiver.likes}</p>
                                                                        )}
                                                                        {currentMatch.receiver.dislikes && (
                                                                            <p><strong className="font-semibold text-slate-800">Dislikes:</strong> {currentMatch.receiver.dislikes}</p>
                                                                        )}
                                                                        {currentMatch.receiver.budget && <p><strong className="font-semibold text-slate-800">Budget:</strong> {currentMatch.receiver.budget}</p>}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                                                    <p className="text-slate-500 italic mb-2">No specific gift ideas added yet.</p>
                                                                    <p className="text-xs text-slate-400">Check back later! {currentMatch.receiver.name} might update this soon.</p>
                                                                </div>
                                                            )}

                                                            {/* Dynamic Ad: Contextual Match */}
                                                            {ContextualPromoData && (
                                                                <div className="mt-8 mb-6 animate-fade-in">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-center">
                                                                            {promoHeader}
                                                                        </span>
                                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                                    </div>
                                                                    <SmartAd partner={ContextualPromoData.partner} creative={ContextualPromoData.creative} placement="reveal-context" />
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
                                                        </>
                                                    )}
                                                    
                                                    <p className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200 mt-4">
                                                        Affiliate Disclosure: We may earn a commission from qualifying purchases or actions made through links on this page.
                                                    </p>
                                                </div>
                                                
                                                {data.eventDetails && data.eventDetails !== 'Gift exchange on Dec 25th!' && data.eventDetails.trim() !== '' && (
                                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Event Details</p>
                                                        <p className="text-sm text-slate-700">{data.eventDetails}</p>
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

export default ResultsPage;
