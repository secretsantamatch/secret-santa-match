import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Share, Eye, EyeOff, Sparkles, Gift, Users, Heart, ExternalLink, Printer } from 'lucide-react';
import type { ExchangeData, Match, Participant } from '../types';
import { generatePdfForCards, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import { getGiftPersona, GiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import BackToTopButton from './BackToTopButton';
import WhyChooseUs from './WhyChooseUs';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

// CRITICAL: This is your Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

const GiftIdeas: React.FC<{ persona: GiftPersona; receiverName: string }> = ({ persona, receiverName }) => {
  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 mt-8">
      <h3 className="text-2xl font-bold text-slate-700 font-serif mb-4 flex items-center gap-3">
        <Sparkles className="text-amber-500" />
        Gift Ideas for {receiverName}
      </h3>
      <div className="bg-slate-50 p-4 rounded-lg border">
        <p className="font-bold text-slate-800">{persona.name}</p>
        <p className="text-slate-600 text-sm mt-1">{persona.description}</p>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(persona.categories).map(([category, ideas]) => (
          <div key={category}>
            <h4 className="font-semibold text-slate-600 mb-2">{category}</h4>
            <ul className="space-y-1">
              {ideas.map(idea => (
                <li key={idea} className="text-sm">
                  <a
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(idea)}&tag=${affiliateTag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
                    onClick={() => trackEvent('click_gift_idea', { idea, category, persona: persona.name })}
                  >
                    {idea} <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-6 text-center">
        As an Amazon Associate, we earn from qualifying purchases.
      </p>
    </div>
  );
};

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isAllRevealed, setIsAllRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const participantMap = new Map(data.p.map(p => [p.id, p]));
        const reconstructedMatches = data.matches
            .map(match => {
                const giver = participantMap.get(match.g);
                const receiver = participantMap.get(match.r);
                if (giver && receiver) {
                    return { giver, receiver };
                }
                return null;
            })
            .filter((m): m is Match => m !== null);
        setMatches(reconstructedMatches);
        
        trackEvent('view_results_page', {
            participant_count: data.p.length,
            is_organizer: !currentParticipantId,
        });

    }, [data, currentParticipantId]);

    const currentMatch = useMemo(() =>
        currentParticipantId ? matches.find(m => m.giver.id === currentParticipantId) : null
    , [matches, currentParticipantId]);

    const giftPersona = useMemo(() =>
        currentMatch ? getGiftPersona(currentMatch.receiver) : null
    , [currentMatch]);

    const baseShareUrl = `${window.location.origin}${window.location.pathname}#${window.location.hash.slice(1).split('?')[0]}`;
    
    const handleDownloadAllCards = async () => {
        setIsDownloading('cards');
        trackEvent('download_pdf', { type: 'all_cards' });
        const elements = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
        await generatePdfForCards(elements, 'Secret_Santa_Cards');
        setIsDownloading(null);
    };

    const handleDownloadMasterList = async () => {
        setIsDownloading('masterlist');
        trackEvent('download_pdf', { type: 'master_list' });
        await generateMasterListPdf(matches, data.eventDetails, data.p);
        setIsDownloading(null);
    };
    
    const handleDownloadPartyPack = async () => {
        setIsDownloading('partypack');
        trackEvent('download_pdf', { type: 'party_pack' });
        await generatePartyPackPdf(data.p, data.eventDetails);
        setIsDownloading(null);
    };
    
    const cardStyleProps = {
        backgroundOptions: data.backgroundOptions,
        bgId: data.bgId,
        bgImg: data.customBackground,
        txtColor: data.textColor,
        outline: data.useTextOutline,
        outColor: data.outlineColor,
        outSize: data.outlineSize,
        fontSize: data.fontSizeSetting,
        font: data.fontTheme,
        line: data.lineSpacing,
        greet: data.greetingText,
        intro: data.introText,
        wish: data.wishlistLabelText,
    };

    if (currentParticipantId) {
        if (!currentMatch) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                        <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Oops!</h1>
                        <p className="text-slate-700 text-lg">We couldn't find your match. This link might be invalid or the game has been updated.</p>
                        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                            Start a New Game
                        </a>
                    </div>
                </div>
            );
        }

        return (
            <>
                <Header />
                <div className="bg-slate-50">
                    <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl">
                        <div className="text-center py-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-red-700 font-serif">Hello, {currentMatch.giver.name}!</h1>
                            <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">You are the Secret Santa for...</p>
                        </div>

                        <PrintableCard
                            match={currentMatch}
                            eventDetails={data.eventDetails}
                            isNameRevealed={isNameRevealed}
                            onReveal={() => setIsNameRevealed(true)}
                            {...cardStyleProps}
                        />

                        {isNameRevealed && (
                            <div className="animate-fade-in">
                                {giftPersona && <GiftIdeas persona={giftPersona} receiverName={currentMatch.receiver.name} />}
                            </div>
                        )}
                        
                        <div className="text-center mt-12">
                            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                Want to start your own Secret Santa game? Click here!
                            </a>
                        </div>
                    </main>
                    <Footer />
                </div>
                <BackToTopButton />
                 <style>{`
                    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                `}</style>
            </>
        );
    }

    // Organizer View
    return (
        <>
            <Header />
            <div className="bg-slate-50">
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <section className="text-center py-8">
                        <div className="inline-block bg-green-100 text-green-800 p-4 rounded-full mb-4">
                            <Heart className="h-12 w-12" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Success! Your Game is Ready.</h1>
                        <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                            Below is the master list of all matches. Use the buttons to share private links with each person or download printable cards.
                        </p>
                    </section>
                    
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-20 z-30 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <button onClick={() => setShowShareModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                                <Share size={24}/> Share Links
                            </button>
                            <button onClick={handleDownloadMasterList} disabled={!!isDownloading} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
                                <Download size={20}/> {isDownloading === 'masterlist' ? 'Working...' : 'Master List (PDF)'}
                            </button>
                             <button onClick={handleDownloadAllCards} disabled={!!isDownloading} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
                                <Printer size={20}/> {isDownloading === 'cards' ? 'Working...' : 'All Cards (PDF)'}
                            </button>
                            <button onClick={handleDownloadPartyPack} disabled={!!isDownloading} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
                                <Users size={20}/> {isDownloading === 'partypack' ? 'Working...' : 'Party Pack (PDF)'}
                            </button>
                        </div>
                    </div>

                    <ResultsDisplay matches={matches} />

                    <div className="mt-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif">Printable Cards</h2>
                            <button onClick={() => setIsAllRevealed(!isAllRevealed)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-2 rounded-md transition-colors">
                                {isAllRevealed ? <EyeOff size={16}/> : <Eye size={16}/>}
                                {isAllRevealed ? 'Hide All Names' : 'Reveal All Names'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {matches.map((match, index) => (
                                // FIX: The ref callback for a React component must return `void`. The original
                                // arrow function `el => cardRefs.current[index] = el` implicitly returned
                                // the assigned value, which violates the type contract. Encapsulating the
                                // assignment in curly braces `{}` creates a function body with no explicit
                                // return, resolving the TypeScript error.
                                <div key={match.giver.id} ref={el => { cardRefs.current[index] = el; }}>
                                    <PrintableCard
                                        match={match}
                                        eventDetails={data.eventDetails}
                                        isNameRevealed={isAllRevealed}
                                        {...cardStyleProps}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <WhyChooseUs />
                </main>
                <Footer />
                <BackToTopButton />
            </div>

            {showShareModal && (
                <ShareLinksModal
                    matches={matches}
                    eventDetails={data.eventDetails}
                    backgroundOptions={data.backgroundOptions}
                    onClose={() => setShowShareModal(false)}
                    baseShareUrl={baseShareUrl}
                    onDownloadMasterList={handleDownloadMasterList}
                    onDownloadAllCards={handleDownloadAllCards}
                    onDownloadPartyPack={handleDownloadPartyPack}
                />
            )}
        </>
    );
};

export default ResultsPage;
