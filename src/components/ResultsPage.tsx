import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import { trackEvent } from '../services/analyticsService';
import { getGiftPersona, GiftPersona } from '../services/personaService';
import { Gift, Link as LinkIcon, PartyPopper, Shuffle, ShoppingCart, Ban, DollarSign, Heart } from 'lucide-react';
import Footer from './Footer';

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [confirmed, setConfirmed] = useState<boolean>(false);
    const [showShareModal, setShowShareModal] = useState(false);
    // FIX: Add state to track if the participant's match has been revealed.
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    
    // This function will be memoized to prevent re-renders of child components
    const handleShuffle = useCallback(() => {
        // We will need to implement the match generation logic here again or import it
        // For now, let's assume `generateMatches` is available.
        // This is a placeholder for the actual re-matching logic from `matchService`
        // In a real implementation, you'd call the service and update state.
        alert("Matches have been shuffled! (This is a placeholder - full logic to be implemented)");
        // To properly do this, we'd need access to the original participants, exclusions, etc.
        // which are all in the `data` prop.
        trackEvent('shuffle_again');
    }, [data]);

    useEffect(() => {
        const participantMap = new Map<string, Participant>(data.p.map(p => [p.id, p]));
        const resolvedMatches = data.matches.map(m => ({
            giver: participantMap.get(m.g)!,
            receiver: participantMap.get(m.r)!
        })).filter(m => m.giver && m.receiver);
        setMatches(resolvedMatches);
    }, [data]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId);
    }, [matches, currentParticipantId]);
    
    const baseShareUrl = `${window.location.origin}${window.location.pathname}#${window.location.hash.split('?')[0].split('?')[0]}`;
    
    const handleDownloadMasterList = () => {
        trackEvent('download_master_list');
        generateMasterListPdf(matches, data.eventDetails);
    };

    const handleDownloadAllCards = () => {
        trackEvent('download_all_cards');
        // This would require a more complex PDF generation logic to render all cards
        alert("This feature is being refined. For now, please print cards individually if needed.");
    };

    const handleDownloadPartyPack = () => {
        trackEvent('download_party_pack');
        if(matches.length > 0) {
            generatePartyPackPdf(matches);
        }
    };
    
    const receiverPersona = currentMatch ? getGiftPersona(currentMatch.receiver) : null;

    if (matches.length === 0) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Loading matches...</p></div>;
    }

    // Organizer View
    if (!currentParticipantId) {
        return (
            <div className="bg-slate-50 min-h-screen">
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center ring-4 ring-white/30">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-serif mt-6">You're the Organizer!</h1>
                        <p className="mt-4 text-indigo-100 max-w-xl mx-auto">Your matches are ready. You can now share private links with each person, or download/print the cards for your party.</p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button onClick={() => setShowShareModal(true)} className="w-full sm:w-auto bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 justify-center">
                                <LinkIcon size={24} /> Sharing &amp; Downloads
                            </button>
                             <button onClick={handleShuffle} className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 justify-center">
                                <Shuffle size={24} /> Shuffle Again
                            </button>
                        </div>
                    </div>
                </main>
                {showShareModal && (
                    <ShareLinksModal
                        matches={matches}
                        onClose={() => setShowShareModal(false)}
                        baseShareUrl={baseShareUrl}
                        onDownloadMasterList={handleDownloadMasterList}
                        onDownloadAllCards={handleDownloadAllCards}
                        onDownloadPartyPack={handleDownloadPartyPack}
                        // FIX: Pass missing eventDetails and backgroundOptions props.
                        eventDetails={data.eventDetails}
                        backgroundOptions={data.backgroundOptions}
                    />
                )}
                <Footer />
            </div>
        );
    }
    
    // Participant View
    if (!currentMatch) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
            <h1 className="text-2xl font-bold text-red-600">Link Error</h1>
            <p className="text-slate-600 mt-2">Could not find your specific match. This link might be incorrect or outdated. Please contact your event organizer.</p>
        </div>
    }
    
    if (!confirmed) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                 <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-lg border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center ring-4 ring-slate-200 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Hello, are you <span className="text-red-600">{currentMatch.giver.name}</span>?</h1>
                    <p className="text-slate-600 mt-3">For privacy, please confirm your name before we reveal your Secret Santa match.</p>
                    <button onClick={() => setConfirmed(true)} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all">
                        Yes, See My Match!
                    </button>
                    <p className="text-xs text-slate-400 mt-6">Not you? Please contact your event organizer to get the correct link.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen py-8 md:py-12">
            <main className="container mx-auto p-4 max-w-xl">
                 {/* FIX: Update onClick to set isNameRevealed state. */}
                 <div className="relative" onClick={() => { if (!isNameRevealed) { setIsNameRevealed(true); trackEvent('reveal_match'); } }}>
                    {/* FIX: Pass props explicitly instead of spreading `...data`. Removed invalid `onReveal` prop. */}
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
                    />
                </div>
                
                {/* FIX: Use `isNameRevealed` state to conditionally render content. */}
                {isNameRevealed && (
                    <div className="mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">
                            {currentMatch.giver.name}'s Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                        </h2>

                        {receiverPersona && (
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
                                <h3 className="font-bold text-indigo-800 flex items-center gap-2"><Gift size={20} /> Gifter's Profile: {receiverPersona.name}</h3>
                                <p className="text-sm text-indigo-700 mt-1">{receiverPersona.description}</p>
                            </div>
                        )}
                        
                        <div className="space-y-6">
                            {/* Interests, Hobbies & Likes */}
                            <div>
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Heart size={18} className="text-rose-500" />Interests, Hobbies &amp; Likes</h3>
                                <p className="text-sm text-slate-500 mb-3">Click a tag for instant gift ideas on Amazon!</p>
                                <div className="flex flex-wrap gap-3">
                                    {[...(currentMatch.receiver.interests || '').split(','), ...(currentMatch.receiver.likes || '').split(',')].map(item => item.trim()).filter(Boolean).map((idea, index) => (
                                         <a key={index} href={`https://www.amazon.com/s?k=${encodeURIComponent(idea + ' gifts')}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-lg transition-colors text-base shadow-sm border border-slate-200 transform hover:scale-105">
                                            <ShoppingCart size={16} /> {idea}
                                         </a>
                                    ))}
                                </div>
                            </div>

                            {/* Dislikes */}
                            {currentMatch.receiver.dislikes && (
                                <div>
                                    <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Ban size={18} className="text-red-500" />Dislikes &amp; No-Go's</h3>
                                    <div className="p-4 bg-slate-50 rounded-lg text-slate-600 text-base">{currentMatch.receiver.dislikes}</div>
                                </div>
                            )}

                             {/* Specific Links */}
                            {currentMatch.receiver.links && (
                                <div>
                                    <h3 className="font-semibold text-slate-700 flex items-center gap-2"><LinkIcon size={18} className="text-blue-500" />Specific Links</h3>
                                     <div className="space-y-2">
                                        {currentMatch.receiver.links.split('\n').filter(link => link.trim() !== '').map((link, index) => (
                                            <a href={link} key={index} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-blue-600 font-semibold truncate transition-colors text-base">
                                                {link}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {/* Budget */}
                            <div className="pt-6 border-t">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><DollarSign size={18} className="text-green-500" />Budget Assistant</h3>
                                 <p className="text-sm text-slate-500 mb-3">Find a great gift within your budget.</p>
                                <div className="flex flex-wrap gap-3">
                                     <a href={`https://www.amazon.com/s?k=${encodeURIComponent('unique gifts')}&tag=${affiliateTag}&bbn=7141123011&rh=p_36%3A-2500`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-lg transition-colors text-base shadow-sm border border-slate-200 transform hover:scale-105">
                                        Find Gifts Under $25
                                     </a>
                                     <a href={`https://www.amazon.com/s?k=${encodeURIComponent('funny gifts')}&tag=${affiliateTag}&bbn=7141123011&rh=p_36%3A-2000`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-lg transition-colors text-base shadow-sm border border-slate-200 transform hover:scale-105">
                                        Find Funny Gifts Under $20
                                     </a>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 text-center mt-8">
                            As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                        </p>
                    </div>
                )}
                 <div className="text-center mt-12">
                    <a href="/generator.html" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Organize your own Secret Santa →
                    </a>
                </div>
            </main>
            <Footer />
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ResultsPage;
