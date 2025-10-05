import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Participant, Match, CardStyleData } from '../types';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';
import Header from './Header';
import Footer from './Footer';
import ShareButtons from './ShareButtons';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const {
    participants,
    matches: matchesById,
    eventDetails,
    exchangeDate,
    exchangeTime,
    pageTheme,
    backgroundId,
    customBackground,
    textColor,
    useTextOutline,
    outlineColor,
    outlineSize,
    fontSizeSetting,
    fontTheme,
    lineSpacing,
    greetingText,
    introText,
    wishlistLabelText,
    backgroundOptions,
  } = data;

  const cardStyle: CardStyleData = useMemo(() => ({
    bgId: backgroundId,
    bgImg: customBackground,
    txtColor: textColor,
    outline: useTextOutline,
    outColor: outlineColor,
    outSize: outlineSize,
    fontSize: fontSizeSetting,
    font: fontTheme,
    line: lineSpacing,
    greet: greetingText,
    intro: introText,
    wish: wishlistLabelText,
  }), [
    backgroundId, customBackground, textColor, useTextOutline, outlineColor,
    outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText,
    introText, wishlistLabelText
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const matches: Match[] = useMemo(() => {
    return matchesById.map((matchById: { g: string; r: string; }) => {
        const giver = participants.find((p: Participant) => p.id === matchById.g);
        const receiver = participants.find((p: Participant) => p.id === matchById.r);
        if (!giver || !receiver) {
            throw new Error(`Could not find participants for match: ${JSON.stringify(matchById)}`);
        }
        return { giver, receiver };
    });
  }, [matchesById, participants]);
  
  const targetTime = useMemo(() => {
    if (!exchangeDate) return 0;
    const dateStr = exchangeTime ? `${exchangeDate}T${exchangeTime}` : `${exchangeDate}T00:00:00`;
    return new Date(dateStr).getTime();
  }, [exchangeDate, exchangeTime]);
  
  const isRevealTime = targetTime > 0 && new Date().getTime() >= targetTime;

  const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      setShowDownloadOptionsModal(false);
      if (type === 'cards' || type === 'both') {
          await generateIndividualCardsPdf({ matches, eventDetails, style: cardStyle, backgroundOptions });
      }
      if (type === 'list' || type === 'both') {
          generateMasterListPdf({ matches, eventDetails, exchangeDate, exchangeTime });
      }
  };
  
  const getParticipantLink = (participantId: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const hash = window.location.hash.split('?')[0];
    return `${baseUrl}${hash}?id=${participantId}`;
  };

  if (!currentParticipantId) { // Organizer View
    if (isRevealTime) {
       return (
         <div className={`theme-${pageTheme || 'default'} bg-slate-50 min-h-screen`}>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12">
                    <ResultsDisplay matches={matches} />
                </main>
                <Footer theme={pageTheme || 'default'} setTheme={() => {}} />
            </div>
         </div>
      );
    }
    
    return (
        <div className={`theme-${pageTheme || 'default'} bg-slate-50 min-h-screen`}>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">You're the Organizer!</h2>
                        <p className="text-gray-600 mt-2 mb-8 max-w-xl mx-auto">Your matches are ready. Share the private links with each person so they can see who they're gifting to.</p>
                        
                        <button 
                          onClick={() => setShowShareModal(true)} 
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out"
                        >
                            Share Private Links
                        </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                          <h3 className="text-3xl font-bold font-serif mb-2">Printable Cards</h3>
                          <p className="text-green-100 max-w-xs mb-6 text-lg">Download styled cards or a master list for offline sharing.</p>
                          <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105">
                              Download Now
                          </button>
                      </div>
                      <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                          <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                          <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                          <ShareButtons />
                      </div>
                    </div>
                     <div className="text-center">
                        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="inline-block bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-full text-lg transition-colors">
                            Make Changes or Start a New Game
                        </a>
                    </div>
                </main>
                <Footer theme={pageTheme || 'default'} setTheme={() => {}} />
            </div>
            {showShareModal && <ShareLinksModal participants={participants} getParticipantLink={getParticipantLink} onClose={() => setShowShareModal(false)} />}
        </div>
    );
  }

  // Participant View
  const participant = participants.find((p: Participant) => p.id === currentParticipantId);
  const match = participant ? matches.find(m => m.giver.id === participant.id) : null;

  if (isRevealTime) {
      return (
         <div className={`theme-${pageTheme || 'default'} bg-slate-50 min-h-screen`}>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12">
                    <ResultsDisplay matches={matches} />
                </main>
                <Footer theme={pageTheme || 'default'} setTheme={() => {}} />
            </div>
         </div>
      )
  }
  
  if (participant && match) {
      return (
        <div className={`theme-${pageTheme || 'default'} bg-slate-50 min-h-screen`}>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                 <main className="mt-8 md:mt-12 space-y-10">
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        <p className="text-xl text-slate-600">Hello, <span className="font-bold text-slate-800">{participant.name}!</span></p>
                        
                        <div className="my-6 max-w-sm mx-auto">
                           <PrintableCard match={match} eventDetails={eventDetails} style={cardStyle} isNameRevealed={isRevealed} onReveal={() => setIsRevealed(true)} backgroundOptions={backgroundOptions} />
                        </div>
                    </div>
                     {targetTime > 0 && (
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                           <CountdownTimer targetTime={targetTime} onComplete={() => window.location.reload()} />
                        </div>
                    )}
                    <div className="text-center">
                      <a href="/" className="inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                          Create Your Own Secret Santa
                      </a>
                    </div>
                 </main>
                 <Footer theme={pageTheme || 'default'} setTheme={() => {}} />
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
        <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1>
        <p className="text-slate-700 text-lg">Invalid participant ID. This link may be corrupted or incorrect.</p>
        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
          Start a New Game
        </a>
      </div>
    </div>
  );
};

export default ResultsPage;
