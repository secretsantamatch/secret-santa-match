
import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import ShareButtons from './ShareButtons';
import BackToTopButton from './BackToTopButton';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isOrganizerView, setIsOrganizerView] = useState(false);
    const [match, setMatch] = useState<Match | null>(null);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [error, setError] = useState<string>('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
    const [isMasterListVisible, setIsMasterListVisible] = useState(false);

    const reconstructedParticipants = useMemo((): Participant[] => {
        return data.p.map((participantData, index) => ({
            ...participantData,
            id: String(index),
        }));
    }, [data.p]);

    const reconstructedMatches = useMemo((): Match[] => {
        return data.m.map(matchData => {
            const giver = reconstructedParticipants[matchData.g];
            const receiver = reconstructedParticipants[matchData.r];
            return { giver, receiver };
        });
    }, [data.m, reconstructedParticipants]);

    useEffect(() => {
        document.documentElement.dataset.theme = data.th || 'default';
        fetch('/templates.json').then(res => res.json()).then(setBackgroundOptions);

        if (!currentParticipantId) {
            setIsOrganizerView(true);
            setAllMatches(reconstructedMatches);
            return;
        }
        
        const participantIndex = reconstructedParticipants.findIndex(p => p.id === currentParticipantId);

        if (participantIndex === -1) {
            setError("Invalid participant ID. This link may be corrupted.");
            return;
        }

        const currentMatch = reconstructedMatches.find(m => m.giver.id === currentParticipantId);
        
        if (!currentMatch) {
            setError("Could not find your match. The data in this link might be incomplete.");
            return;
        }
        setMatch(currentMatch);
    }, [data, currentParticipantId, reconstructedMatches, reconstructedParticipants]);

    const revealDateTime = useMemo(() => {
        if (!data.rd) return null;
        const time = data.rt || '00:00';
        return new Date(`${data.rd}T${time}:00Z`);
    }, [data.rd, data.rt]);

    useEffect(() => {
        if (!revealDateTime) {
            setIsRevealed(true);
            return;
        }
        const checkReveal = () => {
            if (new Date() >= revealDateTime) {
                setIsRevealed(true);
                setAllMatches(reconstructedMatches);
            }
        };
        checkReveal();
        const interval = setInterval(checkReveal, 1000);
        return () => clearInterval(interval);
    }, [revealDateTime, reconstructedMatches]);


    const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      if (!allMatches.length || !backgroundOptions.length) return;
      setShowDownloadModal(false);
      setIsPdfLoading(true);
      try {
        if (type === 'cards' || type === 'both') {
            await generateIndividualCardsPdf({ matches: allMatches, eventDetails: data.e || '', backgroundOptions, ...data.style });
        }
        if (type === 'list' || type === 'both') {
            generateMasterListPdf({ matches: allMatches, eventDetails: data.e || '', exchangeDate: data.rd, exchangeTime: data.rt });
        }
      } catch (err) {
          console.error("PDF generation failed:", err);
          setError("Failed to generate PDF. One of the card images may be offline. Try selecting a different theme.");
      } finally {
          setIsPdfLoading(false);
      }
    };
    
    const handleCopy = (name: string, index: number) => {
        const baseUrl = window.location.href.split('#')[0];
        const hash = window.location.hash.substring(1).split('?')[0];
        const link = `${baseUrl}#${hash}?id=${index}`;
        const message = `Here is the private Secret Santa link for ${name}. Send it to them so they can see who they got! \n\n${link}`;
        navigator.clipboard.writeText(message).then(() => {
            setCopySuccess(prev => ({ ...prev, [String(index)]: true }));
            setTimeout(() => setCopySuccess(prev => ({ ...prev, [String(index)]: false })), 2000);
        });
    };

    const handleCopyAll = () => {
        const baseUrl = window.location.href.split('#')[0];
        const hash = window.location.hash.substring(1).split('?')[0];
        const allLinks = data.p.map((participant, index) => {
            const link = `${baseUrl}#${hash}?id=${index}`;
            return `${participant.name}: ${link}`;
        }).join('\n');
        
        const message = `🎁 Secret Santa links are ready! 🎁\n\nPlease send each person their own private link below:\n\n${allLinks}`;
        navigator.clipboard.writeText(message).then(() => {
            const allCopied = data.p.reduce((acc, _, index) => ({...acc, [String(index)]: true}), {} as Record<string, boolean>);
            setCopySuccess(allCopied);
            setTimeout(() => setCopySuccess({}), 3000);
        });
    };

    if (error) {
         return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border"><h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1><p className="text-slate-700 text-lg">{error}</p><a href="/" className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">Start a New Game</a></div></div>;
    }

    if (isOrganizerView) {
        return (
            <div className="bg-slate-50 min-h-screen">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <Header />
                    <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                         <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Your Event is Ready!</h2>
                                <p className="text-gray-600 max-w-2xl mx-auto mb-6">This is the organizer's page. Your main task is to share the private links with each participant so they can discover their match.</p>
                                <button onClick={() => setShowShareModal(true)} className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                                    Share Links with Participants
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                             <button onClick={() => setIsMasterListVisible(!isMasterListVisible)} className="w-full p-6 md:p-8 flex justify-between items-center text-left" aria-expanded={isMasterListVisible}>
                                <h3 className="font-bold text-xl text-slate-800">View Master List</h3>
                                <svg className={`w-6 h-6 text-gray-500 transform transition-transform duration-300 ${isMasterListVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                             </button>
                             {isMasterListVisible && (
                                <div className="px-6 md:px-8 pb-8 animate-fade-in-down">
                                  {isRevealed && data.rd ? <ResultsDisplay matches={allMatches} /> : (revealDateTime && data.rd ? <CountdownTimer targetDate={data.rd} targetTime={data.rt} /> : <ResultsDisplay matches={allMatches} />)}
                                </div>
                             )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                                <h3 className="text-3xl font-bold font-serif mb-2">Printable Cards</h3>
                                <p className="text-green-100 max-w-xs mb-6 text-lg">Download styled cards or a master list for offline sharing.</p>
                                <button onClick={() => setShowDownloadModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 transition-all">Download Now</button>
                            </div>
                             <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                                <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                                <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                                <ShareButtons participantCount={data.p.length} />
                            </div>
                        </div>

                         <div className="text-center">
                            <a href="/" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                                Make Changes or Start a New Game
                            </a>
                        </div>
                    </main>
                    <Footer theme={data.th || 'default'} setTheme={(t) => document.documentElement.dataset.theme = t} />
                </div>
                {isPdfLoading && <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"><div className="text-white text-center"><svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg><p className="text-xl font-semibold mt-4">Generating your PDF...</p></div></div>}
                {showDownloadModal && <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}><div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full"><h2 className="text-3xl font-bold text-slate-800 font-serif mb-2 text-center">Choose Your Download</h2><div className="space-y-4 mt-6"><button onClick={() => handleDownload('both')} className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold p-4 rounded-xl text-left">Download Both (Cards & Master List)</button><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><button onClick={() => handleDownload('cards')} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold p-4 rounded-xl">Individual Cards</button><button onClick={() => handleDownload('list')} className="w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold p-4 rounded-xl">Master List Only</button></div></div><div className="text-center mt-6"><button onClick={() => setShowDownloadModal(false)} className="text-gray-500 font-semibold">Cancel</button></div></div></div>}
                {showShareModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                        <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                             <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2 text-center">Share Private Links</h2>
                             <p className="text-gray-600 text-center mb-6">Copy each participant's unique link and send it to them privately.</p>
                             <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                               {data.p.map((participant, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                                        <div className="font-bold text-slate-800">{participant.name}'s Link</div>
                                        <button onClick={() => handleCopy(participant.name, index)} className={`w-full sm:w-48 text-center font-semibold py-2 px-4 rounded-md transition-colors text-white flex items-center justify-center gap-2 ${copySuccess[String(index)] ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-800'}`}>
                                           {copySuccess[String(index)] ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                ))}
                             </div>
                             <div className="mt-4 pt-4 border-t">
                                <button onClick={handleCopyAll} className="w-full font-bold py-3 px-4 rounded-lg transition-colors bg-[var(--accent-light-bg)] text-[var(--accent-dark-text)] hover:bg-[var(--accent-lighter-bg)] border border-[var(--accent-border)]">Copy All Links for Group Chat</button>
                             </div>
                             <div className="text-center mt-6"><button onClick={() => setShowShareModal(false)} className="text-gray-500 font-semibold">Close</button></div>
                        </div>
                    </div>
                )}
                <BackToTopButton />
            </div>
        )
    }

    if (!match) {
        return <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[60]"><div className="text-center"><svg className="animate-spin h-12 w-12 text-[var(--primary-color)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg><p className="text-xl font-semibold mt-4 text-slate-700">Loading your match...</p></div></div>;
    }
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
            <Header />
            <main className="w-full max-w-md my-8">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border text-center">
                 <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Hello, <span className="text-[var(--primary-text)]">{match.giver.name}</span>!
                 </h2>
                 <p className="text-slate-600 mt-2 mb-6">You are the Secret Santa for...</p>
                 <PrintableCard 
                    match={match} eventDetails={data.e || ''} backgroundId={data.style.backgroundId} backgroundImageUrl={backgroundOptions.find(b => b.id === data.style.backgroundId)?.imageUrl || null}
                    customBackground={data.style.customBackground} textColor={data.style.textColor} useTextOutline={data.style.useTextOutline}
                    outlineColor={data.style.outlineColor} outlineSize={data.style.outlineSize} fontSizeSetting={data.style.fontSizeSetting}
                    fontTheme={data.style.fontTheme} lineSpacing={data.style.lineSpacing} greetingText={data.style.greetingText}
                    introText={data.style.introText} wishlistLabelText={data.style.wishlistLabelText} isNameRevealed={isNameRevealed} onReveal={() => setIsNameRevealed(true)}
                  />
              </div>

              <div className="mt-10 bg-white p-6 sm:p-8 rounded-2xl shadow-lg border text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-serif mb-4">The Big Reveal is Coming!</h2>
                {isRevealed && data.rd ? <ResultsDisplay matches={allMatches} /> : (revealDateTime && data.rd ? <CountdownTimer targetDate={data.rd} targetTime={data.rt} /> : <p>Come back after the event to see who everyone else got!</p>)}
              </div>
            </main>
            
            <footer className="text-center mt-8">
                <a href="/" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out inline-block">
                    Create Your Own Secret Santa
                </a>
            </footer>
        </div>
    );
};

export default ResultsPage;
