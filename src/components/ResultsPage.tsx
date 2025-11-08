import React, { useState, useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generateMatches } from '../services/matchService';
import { trackEvent } from '../services/analyticsService';
import { generateMasterListPdf, generateAllCardsPdf, generatePartyPackPdf } from '../services/pdfService';
import { Heart, Gift, Users, Check, ArrowRight } from 'lucide-react';
import ResultsDisplay from './ResultsDisplay';
import { encodeData } from '../services/urlService'; 

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
    
    const handleShuffle = () => {
        trackEvent('shuffle_again');
        const result = generateMatches(data.p, data.exclusions, data.assignments);
        if (result.matches) {
            const newExchangeData = { ...data, matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })) };
            
            const encoded = encodeData(newExchangeData);
            window.location.hash = encoded;

        } else {
            alert(`Shuffle failed: ${result.error}`);
        }
    };
    
    const viewGiftIdeas = () => {
        if (!currentMatch) return;
        trackEvent('view_gift_ideas_page');
        const baseUrl = window.location.href.split('#')[0].split('?')[0];
        window.location.href = `${baseUrl}?page=gift_ideas&id=${currentMatch.giver.id}${window.location.hash}`;
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
                        onReveal={() => {
                          if (!isNameRevealed) {
                            setIsNameRevealed(true);
                            trackEvent('reveal_match');
                          }
                        }}
                        eventDetails={data.eventDetails}
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

                    {isNameRevealed && (
                        <div className="p-6 bg-white rounded-2xl shadow-lg border text-center">
                            <h2 className="text-2xl font-bold text-slate-800 font-serif mb-4">
                                Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                            </h2>
                            <p className="text-slate-600 mb-6">
                                See a detailed wishlist, personalized gift ideas based on their interests, and budget-friendly suggestions.
                            </p>
                            <button 
                                onClick={viewGiftIdeas}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <Gift size={20} /> See Gift Ideas <ArrowRight size={20} />
                            </button>
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
                    onDownloadPartyPack={() => generatePartyPackPdf(data)}
                    trackEvent={trackEvent}
                />
            )}
        </div>
    );
};

export default ResultsPage;