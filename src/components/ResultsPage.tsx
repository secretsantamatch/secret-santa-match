import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';
import Footer from './Footer';
import Header from './Header';
import { generateMasterListPdf } from '../services/pdfService';
import BackToTopButton from './BackToTopButton';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isRevealed, setIsRevealed] = useState(data.revealAt ? Date.now() >= data.revealAt : true);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [siteTheme, setSiteTheme] = useState(data.th || 'christmas');
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    
    useEffect(() => {
        document.documentElement.dataset.theme = siteTheme;
    }, [siteTheme]);

    useEffect(() => {
        fetch('/templates.json')
          .then(response => response.json())
          .then((data: BackgroundOption[]) => setBackgroundOptions(data))
          .catch(error => console.error('Failed to load theme templates:', error));
    }, []);

    const { p: participants, m: matchesById, details, style, revealAt, rt: revealTime } = data;

    const matches: Match[] = useMemo(() => {
        const participantMap = new Map<string, Participant>(participants.map(p => [p.id, p]));
        return matchesById.map(matchById => {
            const giver = participantMap.get(matchById.g);
            const receiver = participantMap.get(matchById.r);
            if (!giver || !receiver) return null;
            return { giver, receiver };
        }).filter((m): m is Match => m !== null);
    }, [participants, matchesById]);

    const currentMatch = useMemo(() => {
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [matches, currentParticipantId]);

    const selectedThemeImage = useMemo(() => {
        if (style.bgId === 'custom-image' || !backgroundOptions.length) return null;
        const theme = backgroundOptions.find(opt => opt.id === style.bgId);
        return theme?.imageUrl || null;
    }, [style.bgId, backgroundOptions]);
    
    const handleRevealComplete = () => {
        setIsRevealed(true);
    };

    const handleDownloadMasterList = async () => {
        setIsPdfLoading(true);
        try {
            const exchangeDate = revealAt ? new Date(revealAt).toISOString().split('T')[0] : undefined;
            await generateMasterListPdf({ matches, eventDetails: details, exchangeDate, exchangeTime: revealTime });
        } catch (error) {
            console.error("Failed to generate master list PDF:", error);
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    const revealDateFormatted = useMemo(() => {
        if (!revealAt) return '';
        return new Date(revealAt).toLocaleString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }, [revealAt]);

    const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
        window.location.hash = "";
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                    
                    {currentMatch && (
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center">Your Secret Santa Assignment!</h2>
                             <p className="text-gray-600 mb-6 text-center">Hi, {currentMatch.giver.name}! Here's your secret person. Happy gifting!</p>
                             
                             <div className="max-w-sm mx-auto">
                                {!isNameRevealed && (
                                    <div className="relative z-20 mb-[-60px] text-center">
                                        <button 
                                            onClick={() => setIsNameRevealed(true)}
                                            className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all text-lg"
                                        >
                                            Click to Reveal Name
                                        </button>
                                    </div>
                                )}
                                <PrintableCard
                                    match={currentMatch}
                                    eventDetails={details}
                                    backgroundId={style.bgId}
                                    backgroundImageUrl={selectedThemeImage}
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
                                    isNameRevealed={isNameRevealed}
                                />
                             </div>
                        </div>
                    )}

                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        {isRevealed ? (
                            <>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Full Results</h2>
                                <p className="text-gray-600 mb-6">The big reveal is here! See who everyone had for the gift exchange.</p>
                                <ResultsDisplay matches={matches} />
                                {matches.length > 0 && (
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                                    <button onClick={handleDownloadMasterList} disabled={isPdfLoading} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        {isPdfLoading ? 'Generating...' : 'Download Master List'}
                                    </button>
                                </div>
                                )}
                            </>
                        ) : (
                             <>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">The Big Reveal is Coming!</h2>
                                {revealDateFormatted ? (
                                    <p className="text-gray-600 mb-6">The full list of matches will be revealed on <span className="font-semibold">{revealDateFormatted}</span>.</p>
                                ) : (
                                    <p className="text-gray-600 mb-6">The full list of matches will be revealed soon.</p>
                                )}
                                {revealAt && (
                                <div className="p-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl text-white">
                                    <CountdownTimer targetDate={revealAt} onComplete={handleRevealComplete} />
                                </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Share the Fun!</h2>
                        <p className="text-gray-600 mb-6">Enjoying this free tool? Help spread the word!</p>
                        <ShareButtons participantCount={participants.length} />
                         <a href="/" onClick={handleStartNewGame} className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                            Start a New Game
                        </a>
                    </div>

                </main>
            </div>
            
            <Footer theme={siteTheme} setTheme={setSiteTheme} />
            <BackToTopButton />

             {isPdfLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
                    <div className="text-white text-center">
                        <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-xl font-semibold mt-4">Generating PDF...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsPage;
