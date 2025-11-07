import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generateMatches } from '../services/matchService';
import { trackEvent } from '../services/analyticsService';
import { getGiftPersona } from '../services/personaService';
import type { GiftPersona } from '../services/personaService';
// FIX: Import missing PDF generation functions.
import { generateMasterListPdf, generateAllCardsPdf, generatePartyPackPdf } from '../services/pdfService';
// FIX: Import missing icons and components.
import { Heart, ShoppingCart, ThumbsDown, Link as LinkIcon, Wallet, Gift, Users, Check } from 'lucide-react';
import ResultsDisplay from './ResultsDisplay';

// THIS IS YOUR AMAZON ASSOCIATES ID. IT WILL NOT BE REMOVED AGAIN.
const affiliateTag = 'secretsant09e-20';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [confirmedParticipant, setConfirmedParticipant] = useState(false);

    const { matches, currentMatch } = useMemo(() => {
        const participantMap = new Map(data.p.map(p => [p.id, p]));
        const reconstructedMatches: Match[] = data.matches.map(m => ({
            giver: participantMap.get(m.g)!,
            receiver: participantMap.get(m.r)!,
        })).filter(m => m.giver && m.receiver);

        const current = currentParticipantId
            ? reconstructedMatches.find(m => m.giver.id === currentParticipantId) || null
            : null;

        return { matches: reconstructedMatches, currentMatch: current };
    }, [data, currentParticipantId]);
    
    const giftPersona = useMemo(() => {
        if (currentMatch?.receiver) {
            return getGiftPersona(currentMatch.receiver);
        }
        return null;
    }, [currentMatch]);

    const handleShuffle = () => {
        trackEvent('shuffle_again');
        const result = generateMatches(data.p, data.exclusions, data.assignments);
        if (result.matches) {
            const newExchangeData = { ...data, matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })) };
            
            // This is a simplified re-encoding. A full implementation would use the urlService.
            const pako = (window as any).pako;
            const encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(pako.deflate(JSON.stringify(newExchangeData)))));
            window.location.hash = encoded;
        } else {
            alert(`Shuffle failed: ${result.error}`);
        }
    };
    
    if (currentParticipantId) {
        if (!currentMatch) {
            return <div className="text-center p-8">Error: Could not find your match. Please check the link.</div>;
        }
        
        if (!confirmedParticipant) {
             return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12 px-4">
                    <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-lg border">
                        <Heart className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <h1 className="text-3xl font-bold font-serif text-slate-800">Hello there!</h1>
                        <p className="text-lg text-slate-600 mt-4">Are you <span className="font-bold text-red-600">{currentMatch.giver.name}</span>?</p>
                        <button 
                            onClick={() => setConfirmedParticipant(true)}
                            className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 rounded-full shadow-lg transform hover:scale-105 transition-all"
                        >
                            Yes, See My Match!
                        </button>
                         <p className="text-xs text-slate-400 mt-4">Not you? Please contact your event organizer.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-100 py-12 px-4">
                <div className="max-w-md mx-auto space-y-8">
                    <PrintableCard
                        match={currentMatch}
                        isNameRevealed={isNameRevealed}
                        // FIX: Add onReveal prop to handle click-to-reveal functionality.
                        onReveal={() => {
                          if (!isNameRevealed) {
                            setIsNameRevealed(true);
                            trackEvent('reveal_match');
                          }
                        }}
                        {...data}
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

                    {isNameRevealed && (
                        <div className="space-y-8">
                            {giftPersona && (
                                <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                    <h2 className="text-2xl font-bold text-center text-slate-800 font-serif mb-4">
                                        {currentMatch.giver.name}'s Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                                    </h2>
                                    
                                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                                        <h3 className="font-semibold text-indigo-800">Your Target's Persona:</h3>
                                        <p className="text-2xl font-bold text-indigo-600 font-serif my-1">{giftPersona.name}</p>
                                        <p className="text-sm text-indigo-700">{giftPersona.description}</p>
                                    </div>

                                    {Object.entries(giftPersona.categories).map(([category, keywords]) => (
                                        <div key={category} className="mt-4">
                                            <h4 className="font-bold text-slate-600">{category}:</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {keywords.map(keyword => (
                                                    <a
                                                        key={keyword}
                                                        href={`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&tag=${affiliateTag}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-full text-sm transition-colors"
                                                    >
                                                        <ShoppingCart size={14} /> {keyword}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                             <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                <h3 className="text-xl font-bold text-center text-slate-800 font-serif mb-4">Detailed Wishlist</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border">
                                        <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Gift size={18} className="text-green-600" /> Interests, Hobbies & Likes</h4>
                                        <p className="text-sm text-slate-500 mb-2">Click a tag for instant gift ideas on Amazon!</p>
                                        <div className="flex flex-wrap gap-3">
                                            {[...(currentMatch.receiver.interests || '').split(','), ...(currentMatch.receiver.likes || '').split(',')].map(tag => tag.trim()).filter(Boolean).map(tag => (
                                                 <a
                                                    key={tag}
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(tag + ' gifts')}&tag=${affiliateTag}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm"
                                                >
                                                    <ShoppingCart size={16} /> {tag}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    
                                     {currentMatch.receiver.dislikes && (
                                        <div className="p-4 bg-slate-50 rounded-xl border">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2"><ThumbsDown size={18} className="text-red-600" /> Dislikes & No-Go's</h4>
                                            <p className="text-slate-600 mt-1">{currentMatch.receiver.dislikes}</p>
                                        </div>
                                    )}

                                    {currentMatch.receiver.links && (
                                        <div className="p-4 bg-slate-50 rounded-xl border">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2"><LinkIcon size={18} className="text-blue-600" /> Specific Links</h4>
                                            <div className="text-blue-600 hover:text-blue-800 underline mt-1 break-words">
                                                {currentMatch.receiver.links.split('\n').map((link, i) => <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block">{link}</a>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 text-center mt-4">As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!</p>
                             </div>

                            {currentMatch.receiver.budget && (
                                <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                    <h3 className="text-xl font-bold text-center text-slate-800 font-serif mb-4 flex items-center justify-center gap-2"><Wallet size={20} /> Interactive Budget Assistant</h3>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <a href={`https://www.amazon.com/s?k=gifts&rh=p_36%3A-2500&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm">Find Gifts Under ${currentMatch.receiver.budget}</a>
                                        <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm">Find *Funny* Gifts Under $20</a>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                    
                    <div className="text-center mt-12">
                        <a href="/generator.html" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Organize your own Secret Santa →</a>
                    </div>
                </div>
            </div>
        );
    }
    
     // Organizer View
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
                 <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Check size={32} />
                    </div>
                    <h1 className="text-4xl font-bold font-serif">You're the Organizer!</h1>
                    <p className="mt-2 text-indigo-200 max-w-2xl mx-auto">Your matches are ready. You can now share private links with each person, or download/print the cards for your party.</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <button onClick={() => setShowShareModal(true)} className="bg-white hover:bg-slate-100 text-indigo-700 font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105">
                           Sharing & Downloads
                        </button>
                        <button onClick={handleShuffle} className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1 1v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                            Shuffle Again
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3"><Users size={24}/> Master List</h2>
                    <ResultsDisplay matches={matches} />
                </div>
            </main>
             {showShareModal && (
                <ShareLinksModal
                    matches={matches}
                    onClose={() => setShowShareModal(false)}
                    onDownloadMasterList={() => generateMasterListPdf(matches, data)}
                    onDownloadAllCards={() => generateAllCardsPdf(matches, data)}
                    // FIX: The generatePartyPackPdf function expects the full ExchangeData object, not an array of strings.
                    // Pass the complete 'data' object to ensure the function receives all necessary information.
                    onDownloadPartyPack={() => generatePartyPackPdf(data)}
                />
            )}
        </div>
    );
};

export default ResultsPage;
