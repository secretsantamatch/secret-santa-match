import React, { useState, useEffect, useMemo } from 'react';
// Fix: Corrected import paths for types and components.
import type { ExchangeData, Participant, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareButtons from './ShareButtons';
import CountdownTimer from './CountdownTimer';
import Footer from './Footer';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { p: participants, m: matchesById, details, style, th: pageTheme, revealAt, rt: revealTime } = data;
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isRevealed, setIsRevealed] = useState(revealAt ? Date.now() > revealAt : true);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);

    useEffect(() => {
      fetch('/templates.json')
        .then(res => res.json())
        .then(data => setBackgroundOptions(data as BackgroundOption[]))
        .catch(err => console.error("Failed to load templates", err));
    }, []);

    const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p])), [participants]);

    const myMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        const matchInfo = matchesById.find(m => m.g === currentParticipantId);
        if (!matchInfo) return null;
        const giver = participantMap.get(matchInfo.g);
        const receiver = participantMap.get(matchInfo.r);
        if (!giver || !receiver) return null;
        return { giver, receiver };
    }, [currentParticipantId, matchesById, participantMap]);

    const allMatches = useMemo(() => {
        return matchesById.map(matchInfo => {
            const giver = participantMap.get(matchInfo.g);
            const receiver = participantMap.get(matchInfo.r);
            return { giver, receiver };
        }).filter(m => m.giver && m.receiver) as { giver: Participant, receiver: Participant }[];
    }, [matchesById, participantMap]);

    useEffect(() => {
        document.documentElement.dataset.theme = pageTheme;
    }, [pageTheme]);
    
    const handleRevealComplete = () => {
        setIsRevealed(true);
    };

    const handleDownload = async (type: 'cards' | 'list') => {
        setIsPdfLoading(true);
        try {
            if (type === 'cards') {
                await generateIndividualCardsPdf({
                    matches: allMatches,
                    eventDetails: details,
                    backgroundOptions: backgroundOptions,
                    backgroundId: style.bgId,
                    customBackground: style.bgImg,
                    textColor: style.txtColor,
                    useTextOutline: style.useOutline,
                    outlineColor: style.outColor,
                    outlineSize: style.outSize,
                    fontSizeSetting: style.fontSize,
                    fontTheme: style.font,
                    lineSpacing: style.line,
                    greetingText: style.greet,
                    introText: style.intro,
                    wishlistLabelText: style.wish,
                });
            } else {
                const exchangeDate = revealAt ? new Date(revealAt).toISOString().split('T')[0] : undefined;
                await generateMasterListPdf({ matches: allMatches, eventDetails: details, exchangeDate, exchangeTime: revealTime });
            }
        } catch (error) {
            console.error("PDF generation failed", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    if (isPdfLoading) {
         return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
                <div className="text-white text-center">
                    <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
                </div>
            </div>
        );
    }
    
    // Individual view
    if (myMatch) {
        const theme = backgroundOptions.find(opt => opt.id === style.bgId);
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="w-full max-w-md mx-auto">
                         <div className="text-center mb-8">
                             <a href="/" className="inline-block" aria-label="Go to homepage"><img src="/logo_64.png" alt="Santa hat logo" className="h-14 w-14 mx-auto" /></a>
                             <h1 className="text-4xl font-bold text-slate-800 font-serif mt-2">Your Secret Santa!</h1>
                         </div>

                        <div 
                            className="w-full aspect-[4.25/5.5] rounded-2xl shadow-2xl overflow-hidden bg-slate-200 cursor-pointer"
                            onClick={() => setIsNameRevealed(true)}
                        >
                           <PrintableCard
                              match={myMatch}
                              isNameRevealed={isNameRevealed}
                              backgroundImageUrl={theme?.imageUrl || null}
                              customBackground={style.bgImg}
                              textColor={style.txtColor}
                              useTextOutline={style.useOutline}
                              outlineColor={style.outColor}
                              outlineSize={style.outSize}
                              fontSizeSetting={style.fontSize}
                              fontTheme={style.font}
                              lineSpacing={style.line}
                              greetingText={style.greet}
                              introText={style.intro}
                              wishlistLabelText={style.wish}
                           />
                        </div>
                        {details && <div className="mt-6 p-4 bg-white rounded-lg border text-center"><h3 className="font-bold text-slate-800">Event Details</h3><p className="text-slate-600">{details}</p></div>}
                    </div>
                </main>
                <Footer theme={pageTheme} setTheme={() => {}} />
            </div>
        );
    }
    
    // Master list / Countdown view
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <header className="text-center py-6">
                  <a href="/" className="inline-block" aria-label="Go to homepage">
                     <img src="/logo_64.png" alt="Santa hat logo" className="h-14 w-14 mx-auto" />
                     <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif mt-2">Secret Santa Results</h1>
                  </a>
                </header>
                 <main className="mt-8">
                    { !isRevealed && revealAt ? (
                        <div className="p-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                            <h2 className="text-3xl font-bold font-serif mb-4">The Big Reveal is Coming Soon!</h2>
                            <p className="text-lg opacity-90 mb-6">The full list of matches will be revealed in:</p>
                            <CountdownTimer targetDate={revealAt} onComplete={handleRevealComplete} />
                        </div>
                    ) : (
                         <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <h2 className="text-3xl font-bold text-slate-800 text-center mb-6">Master List</h2>
                             {details && <p className="text-center text-slate-600 mb-6">{details}</p>}
                             <ResultsDisplay matches={allMatches} />
                              <div className="mt-8 text-center space-x-4">
                                  <button onClick={() => handleDownload('list')} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Download Master List (PDF)</button>
                                  <button onClick={() => handleDownload('cards')} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Download All Cards (PDF)</button>
                              </div>
                         </div>
                    )}
                    <div className="mt-12 p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                        <h3 className="text-3xl font-bold font-serif mb-2">Enjoying the Tool?</h3>
                        <p className="text-orange-100 max-w-md mb-6 text-lg">This free generator is made with ❤️. Sharing it with friends helps us keep it running for everyone!</p>
                        <ShareButtons participantCount={participants.length} />
                    </div>
                </main>
            </div>
             <Footer theme={pageTheme} setTheme={() => {}} />
        </div>
    );
};

export default ResultsPage;
