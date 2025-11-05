import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ExchangeData, Participant, Match, CardStyleData, Resource } from '../types';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import { generateMatches } from '../services/matchService';
import { encodeData } from '../services/urlService';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';
import Header from './Header';
import Footer from './Footer';
import ShareButtons from './ShareButtons';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import ResourceCard from './ResourceCard';
import { Check, Copy, MessageSquare, Printer, Search, User, Link, Tag, FileText } from 'lucide-react';


interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

// Allow TypeScript to recognize the gtag function on the window object
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Helper function to send events to Google Analytics
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDownloadConfirmationModal, setShowDownloadConfirmationModal] = useState(false);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [shuffleError, setShuffleError] = useState<string | null>(null);
  
  // New state for the Organizer Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [sentStatus, setSentStatus] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const downloadModalRef = useRef<HTMLDivElement>(null);
  
  const {
    p: participants,
    matches: matchesById,
    eventDetails,
    exclusions,
    assignments,
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
    // Fetch resources for gift suggestions on participant view
    if (currentParticipantId) {
        fetch('/resources.json')
            .then(res => res.json())
            .then(data => setAllResources(data))
            .catch(err => console.error("Failed to load resources for suggestions:", err));
    }
  }, [currentParticipantId]);
  
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
            // This case should ideally not happen if data is valid
            console.error(`Could not find participants for match: ${JSON.stringify(matchById)}`);
            return null;
        }
        return { giver, receiver };
    }).filter((m): m is Match => m !== null);
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

  const handleShuffleAgain = () => {
    setShuffleError(null);
    trackEvent('shuffle_again');
    const result = generateMatches(participants, exclusions, assignments);
    if (result.error) {
        setShuffleError(result.error);
        return;
    }
    if (result.matches) {
        const newExchangeData: ExchangeData = {
            ...data,
            matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
        };
        const encoded = encodeData(newExchangeData);
        window.location.hash = encoded;
    }
  };
  
  const handlePrintCards = async () => {
      setShowDownloadOptionsModal(false);
      trackEvent('download_pdf', { download_type: 'cards_shortcut' });
      await performPdfGeneration(async () => {
          await generateIndividualCardsPdf({ matches, eventDetails, ...cardStyle, backgroundOptions });
      });
      setShowDownloadConfirmationModal(true);
  };


  const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      setShowDownloadOptionsModal(false);
      trackEvent('download_pdf', { download_type: type });
      
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

  const handleOpenShareModal = () => {
    trackEvent('open_share_modal', {
        participant_count: participants.length
    });
    setShowShareModal(true);
  };
  
  const handleToggleSent = (participantId: string) => {
    setSentStatus(prev => {
        const newSet = new Set(prev);
        if (newSet.has(participantId)) {
            newSet.delete(participantId);
        } else {
            newSet.add(participantId);
        }
        return newSet;
    });
  };

  const handleCopyLink = (participantId: string) => {
    const urlToCopy = getParticipantLink(participantId);
    navigator.clipboard.writeText(urlToCopy).then(() => {
        setCopiedLink(participantId);
        setTimeout(() => setCopiedLink(null), 2000);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link.');
    });
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    return participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, participants]);


  // Participant view variables
  const participant = currentParticipantId ? participants.find((p: Participant) => p.id === currentParticipantId) : null;
  const match = participant ? matches.find(m => m.giver.id === participant.id) : null;
  const affiliateTag = 'secretsant09e-20'; // Your Amazon Associates Tag

  const suggestedPosts = useMemo((): Resource[] => {
    if (!isRevealed || !match || allResources.length === 0) {
        return [];
    }

    const interests = match.receiver.interests.toLowerCase();
    const budget = parseInt(match.receiver.budget) || 999;
    const suggestions: { resource: Resource; score: number }[] = [];

    allResources.forEach(resource => {
        let score = 0;
        const resourceKeywords = resource.keywords || [];

        resourceKeywords.forEach(keyword => {
            if (interests.includes(keyword)) {
                score += 1;
            }
        });

        if (resource.id === 'gifts-when-broke' && budget <= 25) {
            score += 5; // High priority boost for low budget
        }

        if (score > 0) {
            suggestions.push({ resource, score });
        }
    });

    suggestions.sort((a, b) => b.score - a.score);
    const topSuggestions = suggestions.slice(0, 2).map(s => s.resource);

    if (topSuggestions.length === 0) {
        const defaultSuggestion = allResources.find(r => r.id === 'questionnaire');
        if (defaultSuggestion) {
            return [defaultSuggestion];
        }
    }

    return topSuggestions;
  }, [isRevealed, match, allResources]);


  if (!currentParticipantId) { // Organizer View
    if (isRevealTime) {
       return (
         <div className="bg-slate-50 min-h-screen">
            <Header />
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
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
                <Header />
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                         <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                            <div className="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white font-serif">You're the Organizer!</h2>
                            <p className="text-purple-100 mt-2 mb-8 max-w-2xl mx-auto">Your matches are ready. Share the private links with each person so they can see who they're gifting to.</p>
                            
                            <div className="flex flex-wrap gap-4 justify-center">
                                <button 
                                  onClick={handleOpenShareModal} 
                                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out"
                                >
                                    Share Private Links
                                </button>
                                <button onClick={handleShuffleAgain} className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                                    Shuffle Again
                                </button>
                            </div>
                            {shuffleError && <p className="mt-4 text-sm bg-red-800/50 p-2 rounded-md">{shuffleError}</p>}
                        </div>
                        
                        <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">Organizer's Dashboard</h2>
                            
                            <div className="relative mb-6 max-w-md mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Search for a participant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 pl-12 border border-slate-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>

                            <div className="space-y-3">
                                {filteredParticipants.map(p => {
                                    const link = getParticipantLink(p.id);
                                    const smsBody = encodeURIComponent(`Hey ${p.name}, here is your private link for our Secret Santa exchange! 🎁 ${link}`);
                                    return (
                                        <div key={p.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex items-center">
                                                <input
                                                    id={`sent-${p.id}`}
                                                    type="checkbox"
                                                    checked={sentStatus.has(p.id)}
                                                    onChange={() => handleToggleSent(p.id)}
                                                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <label htmlFor={`sent-${p.id}`} className="sr-only">Mark {p.name} as sent</label>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <User className="w-6 h-6 text-slate-400 flex-shrink-0" />
                                                <span className={`font-semibold text-slate-700 truncate transition-colors ${sentStatus.has(p.id) ? 'line-through text-slate-400' : ''}`}>{p.name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`sms:?&body=${smsBody}`} className="p-2.5 rounded-lg transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-slate-400">
                                                    <MessageSquare className="h-5 w-5" />
                                                </a>
                                                <button
                                                    onClick={() => handleCopyLink(p.id)}
                                                    className={`font-semibold py-2 px-3 text-sm rounded-lg transition-all flex items-center justify-center w-28 focus:outline-none focus:ring-2 focus:ring-offset-2 ${copiedLink === p.id ? 'bg-emerald-500 text-white ring-emerald-300' : 'bg-slate-800 hover:bg-slate-700 text-white ring-slate-400'}`}
                                                >
                                                    {copiedLink === p.id ? <Check size={18} /> : <Copy size={16} />}
                                                    <span className="ml-2">{copiedLink === p.id ? 'Copied!' : 'Copy'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>


                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                              <div className="mb-4">
                                <Printer className="h-16 w-16 opacity-80" />
                              </div>
                              <h3 className="text-3xl font-bold font-serif mb-2">Printables</h3>
                              <p className="text-green-100 max-w-xs mb-6 text-lg">Download styled cards or a master list for offline sharing.</p>
                              <div className="flex flex-wrap gap-3 justify-center">
                                <button onClick={handlePrintCards} className="bg-white text-green-700 font-bold py-3 px-6 text-lg rounded-full shadow-md transform hover:scale-105 transition-all flex items-center gap-2">Print All Cards</button>
                                <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 text-lg rounded-full shadow-md transform hover:scale-105 transition-all">More Options</button>
                              </div>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  if (isRevealTime) {
      return (
         <div className="bg-slate-50 min-h-screen">
            <Header />
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
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
            <Header />
                 <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-8 md:mt-12 space-y-10">
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

                    {isRevealed && match.receiver && (
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">
                                Gift Inspiration for <span className="text-red-600">{match.receiver.name}</span>
                            </h2>
                            <div className="space-y-6 max-w-2xl mx-auto">
                                {match.receiver.budget && (
                                    <div className="text-center">
                                        <p className="text-lg text-slate-500">Suggested Budget: <span className="font-bold text-xl text-emerald-600">${match.receiver.budget}</span></p>
                                    </div>
                                )}
                                {match.receiver.interests && (
                                    <div>
                                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-500" /> Interests & Hobbies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {match.receiver.interests.split(',').map(interest => interest.trim()).filter(Boolean).map(interest => (
                                                <a
                                                    key={interest}
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(interest + ' gifts')}&tag=${affiliateTag}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold px-4 py-2 rounded-full text-sm transition-colors"
                                                >
                                                    {interest}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {match.receiver.likesDislikes && (
                                     <div>
                                        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Likes, Dislikes & Notes</h3>
                                        <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border">{match.receiver.likesDislikes}</p>
                                    </div>
                                )}
                                {match.receiver.links && (
                                    <div>
                                        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Link className="w-5 h-5 text-rose-500" /> Specific Links</h3>
                                        <div className="space-y-2">
                                            {match.receiver.links.split('\n').map(link => link.trim()).filter(Boolean).map((link, index) => (
                                                 <a
                                                    key={index}
                                                    href={link.startsWith('http') ? link : `//${link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium p-3 rounded-lg border border-rose-200 truncate transition-colors"
                                                >
                                                    {link}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="text-center mt-6 pt-6 border-t border-slate-200">
                                    <p className="text-xs text-slate-400 italic max-w-lg mx-auto">
                                        As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isRevealed && suggestedPosts.length > 0 && (
                      <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-2 text-center">
                          Helpful Guides
                        </h2>
                        <p className="text-slate-600 mb-8 text-center max-w-xl mx-auto">
                          Based on <strong>{match.receiver.name}'s</strong> details, these guides might help you find the perfect gift!
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                          {suggestedPosts.map(post => (
                            <ResourceCard key={post.id} resource={post} />
                          ))}
                        </div>
                      </div>
                    )}

                     {targetTime > 0 && (
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                           <CountdownTimer targetTime={targetTime} onComplete={() => window.location.reload()} />
                        </div>
                    )}
                    <div className="text-center">
                      <a href="/generator.html" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                          Create Your Own Secret Santa
                      </a>
                    </div>
                 </main>
                 <Footer />
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
