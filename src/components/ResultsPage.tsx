import React, { useState, useEffect, useRef } from 'react';
import type { ExchangeData, BackgroundOption } from '../types';
import Header from './Header';
import Footer from './Footer';
import BlogPromo from './BlogPromo';
import FaqSection from './FaqSection';
import ShareButtons from './ShareButtons';
import CountdownTimer from './CountdownTimer';
import ResultsDisplay from './ResultsDisplay';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2-2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const { p: participants, m: matches, d: eventDetails, t: exchangeDate, style } = data;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMasterList, setShowMasterList] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('ssm_theme') || 'default');
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
  
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const downloadModalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetch('/templates.json').then(res => res.json()).then(setBackgroundOptions);
  }, []);

  useEffect(() => {
    if (showDownloadOptionsModal) {
      const timer = setTimeout(() => setModalAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setModalAnimating(false);
    }
  }, [showDownloadOptionsModal]);

  const currentUserMatch = currentParticipantId ? matches.find(match => match.giver.id === currentParticipantId) : null;
  const isOrganizerView = !currentParticipantId;
  const isRevealTime = new Date(exchangeDate) < new Date();

  const handleCopy = (participantId: string) => {
    const url = new URL(window.location.href);
    const mainHash = url.hash.slice(1).split('?')[0];
    url.hash = `${mainHash}?id=${participantId}`;
    navigator.clipboard.writeText(url.href).then(() => {
      setCopiedId(participantId);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };
  
  const performPdfGeneration = async (generationFn: () => Promise<void>) => {
    let timer: number | null = window.setTimeout(() => setIsPdfLoading(true), 500);
    try { await generationFn(); } 
    catch (err) { console.error("PDF Generation failed:", err); } 
    finally { if (timer) clearTimeout(timer); setIsPdfLoading(false); }
  };

  const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      setShowDownloadOptionsModal(false);
      await performPdfGeneration(async () => {
        if (type === 'cards' || type === 'both') {
            await generateIndividualCardsPdf({ 
                matches, eventDetails, backgroundOptions,
                backgroundId: style.bgId, customBackground: style.bgImg, textColor: style.txtColor,
                useTextOutline: style.outline, outlineColor: style.outColor, outlineSize: style.outSize,
                fontSizeSetting: style.fontSize, fontTheme: style.font, lineSpacing: style.line,
                greetingText: style.greet, introText: style.intro, wishlistLabelText: style.wish
            });
        }
        if (type === 'list' || type === 'both') {
            generateMasterListPdf({ matches, eventDetails });
        }
      });
  };

  const renderOrganizerView = () => (
    <div className="space-y-8">
        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-3 font-serif">Your Event is Ready!</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">Copy each participant's unique link and share it with them privately.</p>
            <div className="space-y-3 max-w-lg mx-auto">
                {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                        <span className="font-semibold text-slate-700">{p.name}</span>
                        <button onClick={() => handleCopy(p.id)} className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full transition-colors ${copiedId === p.id ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}`}>
                            {copiedId === p.id ? <CheckIcon /> : <CopyIcon />}
                            {copiedId === p.id ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                ))}
            </div>
            <div className="text-center mt-8 pt-6 border-t"><button onClick={() => setShowMasterList(!showMasterList)} className="font-bold text-[var(--primary-text)] hover:underline">{showMasterList ? 'Hide Master List' : 'View Master List (For Organizer)'}</button></div>
        </div>
        
        {showMasterList && <ResultsDisplay matches={matches} />}

        <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                <h3 className="text-3xl font-bold font-serif mb-2">Printable Cards</h3>
                <p className="text-green-100 max-w-xs mb-6 text-lg">Download styled cards or a master list for offline sharing.</p>
                <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105">Download Now</button>
            </div>
            <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                <ShareButtons participantCount={participants.length} />
            </div>
        </div>
    </div>
  );

  const renderParticipantView = () => {
    if (!currentUserMatch) return <div className="p-8 bg-white rounded-2xl shadow-lg border text-center"><h2 className="text-2xl font-bold text-red-600">Link Error</h2><p className="text-slate-600 mt-2">We couldn't find a match for this link. It might be invalid or outdated.</p></div>;
    return (
      <div className="space-y-8">
        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border text-center">
            <h2 className="text-2xl font-bold text-slate-800">Hello, <span className="text-[var(--primary-text)]">{currentUserMatch.giver.name}</span>!</h2>
            <p className="text-slate-600 text-lg mt-2">You are the Secret Santa for...</p>
            <div className="my-6 p-6 bg-[var(--accent-lighter-bg)] border border-[var(--accent-border)] rounded-2xl inline-block"><p className="text-4xl md:text-5xl font-bold text-[var(--accent-dark-text)] font-serif">{currentUserMatch.receiver.name}</p></div>
            <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-lg border"><h3 className="font-bold text-slate-700">Their Gift Ideas & Notes:</h3><p className="text-slate-600 mt-1">{currentUserMatch.receiver.notes || <span className="italic">No notes provided.</span>}</p>{currentUserMatch.receiver.budget && <p className="mt-2"><strong>Suggested Budget:</strong> ${currentUserMatch.receiver.budget}</p>}</div>
            {eventDetails && <div className="mt-6 max-w-md mx-auto"><h3 className="font-bold text-slate-700">Event Details:</h3><p className="text-slate-600 mt-1">{eventDetails}</p></div>}
        </div>
        {isRevealTime ? <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border"><h2 className="text-2xl font-bold text-center text-slate-800 mb-4 font-serif">The Big Reveal!</h2><p className="text-gray-600 text-center mb-6">The gift exchange date has passed. Here's the full list of who had who:</p><ResultsDisplay matches={matches} /></div> : <CountdownTimer targetDate={exchangeDate} />}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <main className="mt-8 md:mt-12">{isOrganizerView ? renderOrganizerView() : renderParticipantView()}</main>
      </div>
      <FaqSection />
      <BlogPromo />
      <Footer theme={theme} setTheme={setTheme} />
      
      {isPdfLoading && <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"><div className="text-white text-center"><svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="text-xl font-semibold mt-4">Generating your PDF...</p></div></div>}
      {showDownloadOptionsModal && <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowDownloadOptionsModal(false)}><div ref={downloadModalRef} onClick={e => e.stopPropagation()} tabIndex={-1} className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full outline-none transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}><div className="text-center"><h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Choose Your Download</h2><p className="text-gray-600 mb-8">Select which documents you'd like to generate.</p></div><div className="space-y-4"><button onClick={() => handleDownload('both')} className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold p-4 rounded-xl shadow-lg transform hover:scale-105 transition-all text-left flex items-center gap-4"><div className="p-3 bg-white/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div><div><span className="text-xl">Download Both</span><span className="font-normal text-sm block opacity-90">(Cards & Master List)</span></div></button><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><button onClick={() => handleDownload('cards')} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold p-4 rounded-xl shadow-md transition-colors h-36 flex flex-col justify-between"><p className="text-lg">Individual Cards</p><p className="text-sm text-slate-200 font-normal">Styled cards for each participant.</p></button><button onClick={() => handleDownload('list')} className="w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold p-4 rounded-xl shadow-md transition-colors h-36 flex flex-col justify-between"><p className="text-lg">Master List</p><p className="text-sm text-slate-200 font-normal">A single page showing all matches.</p></button></div></div><div className="text-center"><button onClick={() => setShowDownloadOptionsModal(false)} className="mt-6 text-gray-500 hover:bg-gray-100 font-semibold py-2 px-4 rounded-full text-sm transition-colors">Cancel</button></div></div></div>}
    </div>
  );
};

export default ResultsPage;
