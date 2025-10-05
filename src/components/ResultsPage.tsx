import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [modalAnimating, setModalAnimating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDownloadConfirmationModal, setShowDownloadConfirmationModal] = useState(false);
  
  const downloadModalRef = useRef<HTMLDivElement>(null);
  
  const {
    p: participants,
    matches: matchesById,
    eventDetails,
    exchangeDate,
    exchangeTime,
    bgId,
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
    bgId: bgId,
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
    bgId, customBackground, textColor, useTextOutline, outlineColor,
    outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText,
    introText, wishlistLabelText
  ]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    if (showDownloadOptionsModal) {
      const timer = setTimeout(() => setModalAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setModalAnimating(false);
    }
  }, [showDownloadOptionsModal]);

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

  const performPdfGeneration = async (generationFn: () => Promise<void>) => {
    let loadingTimer: number | null = null;
    try {
      loadingTimer = window.setTimeout(() => setIsPdfLoading(true), 300);
      await generationFn();
    } catch (err) {
      console.error("PDF Generation failed:", err);
    } finally {
      if (loadingTimer) clearTimeout(loadingTimer);
      setIsPdfLoading(false);
    }
  };

  const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      setShowDownloadOptionsModal(false);
      
      await performPdfGeneration(async () => {
        if (type === 'cards' || type === 'both') {
            await generateIndividualCardsPdf({ matches, eventDetails, ...cardStyle, backgroundOptions });
        }
        if (type === 'list' || type === 'both') {
            generateMasterListPdf({ matches, eventDetails, exchangeDate, exchangeTime });
        }
      });
      
      setShowDownloadConfirmationModal(true);
  };
  
  const getParticipantLink = (participantId: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const hash = window.location.hash.split('?')[0];
    return `${baseUrl}${hash}?id=${participantId}`;
  };

  if (!currentParticipantId) { // Organizer View
    if (isRevealTime) {
       return (
         <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12">
                    <ResultsDisplay matches={matches} />
                </main>
                <Footer />
            </div>
         </div>
      );
    }
    
    return (
        <>
            <div className="bg-slate-50 min-h-screen">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <Header />
                    <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                         <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                            <div className="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white font-serif">You're the Organizer!</h2>
                            <p className="text-purple-100 mt-2 mb-8 max-w-2xl mx-auto">Your matches are ready. Share the private links with each person so they can see who they're gifting to.</p>
                            
                            <button 
                              onClick={() => setShowShareModal(true)} 
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out"
                            >
                                Share Private Links
                            </button>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                              <div className="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h3 className="text-3xl font-bold font-serif mb-2">Printable Cards</h3>
                              <p className="text-green-100 max-w-xs mb-6 text-lg">Download styled cards or a master list for offline sharing.</p>
                              <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                  Download Now
                              </button>
                          </div>
                          <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                              <div className="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                              </div>
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
                    <Footer />
                </div>
            </div>
            
            {/* Modals */}
            {showShareModal && <ShareLinksModal participants={participants} getParticipantLink={getParticipantLink} onClose={() => setShowShareModal(false)} />}
            
            {isPdfLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
                  <div className="text-white text-center">
                    <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
                    <p className="text-sm opacity-80">This may take a moment.</p>
                  </div>
                </div>
            )}
            
            {showDownloadOptionsModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowDownloadOptionsModal(false)}>
                  <div ref={downloadModalRef} onClick={e => e.stopPropagation()} tabIndex={-1} className={`bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-w-xl w-full outline-none transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                      <div className="text-center">
                          <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Choose Your Download</h2>
                          <p className="text-gray-600 mb-8">Select which documents you'd like to generate.</p>
                      </div>
                      <div className="space-y-4">
                          <button onClick={() => handleDownload('both')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-4 rounded-xl shadow-lg transform hover:scale-[1.03] transition-all text-left flex items-center gap-5">
                              <div className="p-2 bg-white/20 rounded-lg">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </div>
                              <div className="flex-grow">
                                  <span className="text-xl">Download Both</span>
                                  <span className="font-normal text-sm block opacity-90">(Cards & Master List)</span>
                              </div>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleDownload('cards')} className="w-full bg-slate-700 hover:bg-slate-800 text-white p-6 rounded-xl shadow-md transition-colors text-left flex flex-col justify-between items-start min-h-[10rem]">
                                <div>
                                    <div className="p-2 bg-white/20 rounded-lg mb-3 inline-block">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h0z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-bold">Individual Cards Only</p>
                                </div>
                                <p className="text-sm text-slate-300 font-normal">Styled cards for each person.</p>
                            </button>
                            
                            <button onClick={() => handleDownload('list')} className="w-full bg-slate-700 hover:bg-slate-800 text-white p-6 rounded-xl shadow-md transition-colors text-left flex flex-col justify-between items-start min-h-[10rem]">
                               <div>
                                  <div className="p-2 bg-white/20 rounded-lg mb-3 inline-block">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                      </svg>
                                  </div>
                                  <p className="text-lg font-bold">Master List Only</p>
                               </div>
                               <p className="text-sm text-slate-300 font-normal">A single page showing all matches.</p>
                            </button>
                          </div>
                      </div>
                      <div className="text-center">
                          <button onClick={() => setShowDownloadOptionsModal(false)} className="mt-8 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors">
                              Cancel
                          </button>
                      </div>
                  </div>
                </div>
            )}
            
            {showDownloadConfirmationModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Success!</h2>
                    <p className="text-gray-600 mb-6">Your download will begin momentarily. Happy gifting!</p>
                     <button onClick={() => setShowDownloadConfirmationModal(false)} className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">
                        Close
                    </button>
                  </div>
                </div>
            )}
        </>
    );
  }

  // Participant View
  const participant = participants.find((p: Participant) => p.id === currentParticipantId);
  const match = participant ? matches.find(m => m.giver.id === participant.id) : null;

  if (isRevealTime) {
      return (
         <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12">
                    <ResultsDisplay matches={matches} />
                </main>
                <Footer />
            </div>
         </div>
      )
  }
  
  if (participant && match) {
      return (
        <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                 <main className="mt-8 md:mt-12 space-y-10">
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        <p className="text-xl text-slate-600">Hello, <span className="font-bold text-slate-800">{participant.name}!</span></p>
                        
                        <div className="my-6 max-w-sm mx-auto">
                           <PrintableCard 
                              match={match} 
                              eventDetails={eventDetails} 
                              isNameRevealed={isRevealed} 
                              onReveal={() => setIsRevealed(true)} 
                              backgroundOptions={backgroundOptions} 
                              {...cardStyle}
                           />
                        </div>
                    </div>
                     {targetTime > 0 && (
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                           <CountdownTimer targetTime={targetTime} onComplete={() => window.location.reload()} />
                        </div>
                    )}
                    <div className="text-center">
                      <a href="/" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                          Create Your Own Secret Santa
                      </a>
                    </div>
                 </main>
                 <Footer />
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
