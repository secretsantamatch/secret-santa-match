import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generatePdfForCards, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import { trackEvent } from '../services/analyticsService';
import { getGiftPersona, GiftPersona } from '../services/personaService';
import { generateMatches } from '../services/matchService';
import { encodeData } from '../services/urlService';
import { ShoppingCart, Ban, Link as LinkIcon, AlertTriangle } from 'lucide-react';


interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isNameRevealed, setIsNameRevealed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // New state for confirmation

  const { matches } = useMemo(() => {
    const participantsById = new Map<string, Participant>(data.p.map(p => [p.id, p]));
    const resolvedMatches: Match[] = data.matches
      .map(m => {
        const giver = participantsById.get(m.g);
        const receiver = participantsById.get(m.r);
        if (giver && receiver) {
          return { giver, receiver };
        }
        return null;
      })
      .filter((m): m is Match => m !== null);
    return { matches: resolvedMatches };
  }, [data]);

  const currentMatch = useMemo(() => {
    if (!currentParticipantId) return null;
    return matches.find(m => m.giver.id === currentParticipantId) || null;
  }, [matches, currentParticipantId]);

  const giftPersona = useMemo(() => {
    if (currentMatch) {
      return getGiftPersona(currentMatch.receiver);
    }
    return null;
  }, [currentMatch]);


  const isOrganizerView = !currentParticipantId;

  const handleReveal = () => {
    setIsNameRevealed(true);
    trackEvent('reveal_match', { theme: data.bgId });
  };
  
  const handleShuffle = () => {
    trackEvent('shuffle_again');
    const result = generateMatches(data.p, data.exclusions, data.assignments);
    if(result.matches) {
        const newExchangeData: ExchangeData = {
            ...data,
            matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
        };
        const encoded = encodeData(newExchangeData);
        window.location.hash = encoded;
    } else {
        alert(`Could not shuffle again: ${result.error}`);
    }
  };

  const createAmazonLink = (searchTerm: string) => {
    return `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&tag=${affiliateTag}`;
  };

  if (!data) return null;

  // Render Loading state or error if data is somehow invalid
  if (isOrganizerView && matches.length === 0) {
      return <div>Loading matches...</div>;
  }
  if (!isOrganizerView && !currentMatch) {
      return <div>Error: Could not find your match. Please check the link.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
        {isOrganizerView ? (
          // Organizer's View
          <>
            <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl shadow-2xl text-center mb-8">
                <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-serif">You're the Organizer!</h1>
                <p className="text-lg text-indigo-100 mt-4 max-w-2xl mx-auto">
                    Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <button
                    onClick={() => {
                        trackEvent('open_share_modal');
                        setShowShareModal(true);
                    }}
                    className="bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-transform transform hover:scale-105"
                    >
                    Sharing & Downloads
                    </button>
                    <button
                    onClick={handleShuffle}
                    className="bg-white/20 hover:bg-white/30 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Shuffle Again
                    </button>
                </div>
            </div>
          </>
        ) : currentMatch && !isConfirmed ? (
            // Participant Confirmation View
            <div className="p-8 md:p-12 bg-white rounded-3xl shadow-xl text-center my-8 border animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Hello there!</h1>
                <p className="text-2xl text-slate-600 mt-4">Are you <strong className="text-red-600">{currentMatch.giver.name}</strong>?</p>
                <button
                    onClick={() => {
                        trackEvent('confirm_participant');
                        setIsConfirmed(true);
                    }}
                    className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all"
                >
                    Yes, show me my match!
                </button>
                 <p className="text-sm text-slate-400 mt-6">If you are not {currentMatch.giver.name}, please contact your event organizer.</p>
            </div>

        ) : (
          // Participant's Main View
          currentMatch && (
            <div className="animate-fade-in">
              <div className="flex justify-center my-8">
                <PrintableCard
                  match={currentMatch}
                  eventDetails={data.eventDetails}
                  isNameRevealed={isNameRevealed}
                  onReveal={handleReveal}
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

              {isNameRevealed && (
                <div className="my-10 bg-white rounded-2xl shadow-lg border p-6 md:p-8 space-y-8 animate-fade-in">
                    {/* Gift Persona Section */}
                    {giftPersona && (
                        <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-2xl p-6 text-center">
                            <h2 className="text-2xl font-bold font-serif">{giftPersona.name}</h2>
                            <p className="text-slate-300 mt-2 italic">{giftPersona.description}</p>
                        </div>
                    )}
                  
                  {/* Gift Inspiration */}
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold font-serif text-slate-800 text-center">
                        {currentMatch.giver.name}'s Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                    </h2>

                    {/* Interactive Budget Assistant */}
                    {currentMatch.receiver.budget && (
                        <div className="p-4 bg-slate-50 rounded-xl border">
                             <h3 className="font-bold text-slate-700 text-center mb-3">Find a Gift Within Your Budget: ${currentMatch.receiver.budget}</h3>
                             <div className="flex flex-wrap justify-center gap-3">
                                <a href={createAmazonLink(`gifts under ${currentMatch.receiver.budget}`)} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full text-sm transition-colors">Find Gifts Under ${currentMatch.receiver.budget}</a>
                                <a href={createAmazonLink(`funny gifts under ${currentMatch.receiver.budget}`)} target="_blank" rel="noopener noreferrer" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-full text-sm transition-colors">Find *Funny* Gifts Under ${currentMatch.receiver.budget}</a>
                             </div>
                        </div>
                    )}

                    {/* Interests, Hobbies & Likes */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>
                            Interests, Hobbies & Likes
                        </h3>
                         <p className="text-sm text-slate-500 mb-3">Click a tag for instant gift ideas on Amazon!</p>
                        <div className="flex flex-wrap gap-3">
                            {[...(currentMatch.receiver.interests || '').split(','), ...(currentMatch.receiver.likes || '').split(',')].map(item => item.trim()).filter(Boolean).map((item, index) => (
                                <a 
                                    key={index}
                                    href={createAmazonLink(`${item} gifts`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-indigo-100 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 font-semibold py-3 px-5 rounded-lg transition-all transform hover:scale-105"
                                >
                                    <ShoppingCart size={16} />
                                    <span>{item}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Dislikes */}
                    {currentMatch.receiver.dislikes && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Ban size={18} className="text-red-500"/>
                                Dislikes & No-Go's
                            </h3>
                            <div className="mt-2 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100">
                                {currentMatch.receiver.dislikes}
                            </div>
                        </div>
                    )}

                     {/* Specific Links */}
                    {currentMatch.receiver.links && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <LinkIcon size={18} className="text-green-600"/>
                                Specific Links
                            </h3>
                            <div className="mt-2 space-y-2">
                                {currentMatch.receiver.links.split('\n').filter(Boolean).map((link, index) => (
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="block p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 hover:bg-green-100 truncate font-semibold transition-colors">
                                        {link}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <p className="text-xs text-slate-400 text-center pt-4 border-t">
                        As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        <div className="text-center mt-12">
            <a href="/generator.html" className="text-slate-600 hover:text-red-700 font-semibold transition-colors text-lg">
              Organize your own Secret Santa &rarr;
            </a>
        </div>
      </main>
      <Footer />
      <BackToTopButton />

      {showShareModal && isOrganizerView && (
        <ShareLinksModal
          matches={matches}
          eventDetails={data.eventDetails}
          backgroundOptions={data.backgroundOptions}
          onClose={() => setShowShareModal(false)}
          baseShareUrl={window.location.href.split('#')[0] + '#' + data.matches.map(m => m.g+m.r).join('')}
          onDownloadMasterList={() => {
              trackEvent('download_master_list');
              generateMasterListPdf(matches, data.eventDetails, data.p);
          }}
          onDownloadAllCards={() => {
              trackEvent('download_all_cards');
              // This needs a way to render all cards, let's add that.
          }}
           onDownloadPartyPack={() => {
              trackEvent('download_party_pack');
              generatePartyPackPdf(data.p, data.eventDetails);
           }}
        />
      )}
    </div>
  );
};

export default ResultsPage;
