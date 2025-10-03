import React, { useState, useEffect, useMemo } from 'react';
// Fix: Corrected import paths for types and components.
import type { ExchangeData, Participant, Match, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';
import Footer from './Footer';
import Header from './Header';

const findParticipant = (id: string, participants: Participant[]): Participant | undefined => {
  return participants.find(p => p.id === id);
};

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { p: participants, m: matchesById, details, style, th: pageTheme, revealAt } = data;
    
    const [isRevealTime, setIsRevealTime] = useState(revealAt ? new Date().getTime() > revealAt : true);
    const [isCardNameVisible, setIsCardNameVisible] = useState(false);
    const [siteTheme, setSiteTheme] = useState(pageTheme || 'christmas');
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);

    useEffect(() => {
        document.documentElement.dataset.theme = siteTheme;
    }, [siteTheme]);

    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(setBackgroundOptions)
            .catch(console.error);
    }, []);

    const selectedBackground = useMemo(() => {
        return backgroundOptions.find(opt => opt.id === style.bgId);
    }, [backgroundOptions, style.bgId]);
    
    const allMatches: Match[] = useMemo(() => {
        return matchesById.map(matchById => {
            const giver = findParticipant(matchById.g, participants);
            const receiver = findParticipant(matchById.r, participants);
            return { giver: giver!, receiver: receiver! };
        }).filter(match => match.giver && match.receiver);
    }, [matchesById, participants]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return allMatches.find(m => m.giver.id === currentParticipantId);
    }, [allMatches, currentParticipantId]);
    
    const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = '';
    };

    if (!currentParticipantId || !currentMatch) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl flex-grow">
                    <Header />
                    <div className="bg-white p-8 rounded-2xl shadow-lg mt-8 text-center">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4 font-serif">Who are you?</h2>
                        <p className="text-slate-600 mb-8 text-lg">Select your name to see your Secret Santa assignment!</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {participants.map(p => (
                                <a key={p.id} href={`#${window.location.hash.substring(1).split('?')[0]}?id=${p.id}`} className="block p-4 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-800 transition-colors text-lg">
                                    {p.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer theme={siteTheme} setTheme={setSiteTheme} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                    { !isRevealTime && revealAt && (
                        <div className="p-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl text-white text-center">
                             <h2 className="text-3xl font-bold font-serif mb-2">The Big Reveal is Coming Soon!</h2>
                             <p className="text-slate-300 max-w-lg mx-auto mb-6 text-lg">The full list of who got who will be revealed after the exchange. Until then, your assignment is below!</p>
                             <CountdownTimer targetDate={revealAt} onComplete={() => setIsRevealTime(true)} />
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="text-center md:text-left">
                            <p className="text-lg text-slate-600">Hello, <span className="font-bold text-slate-800">{currentMatch.giver.name}</span>!</p>
                            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 font-serif mt-2">You are the Secret Santa for...</h2>
                        </div>
                        <div onClick={() => setIsCardNameVisible(true)} className="cursor-pointer" title="Click to reveal name">
                             <PrintableCard 
                                match={currentMatch}
                                eventDetails={details}
                                backgroundId={style.bgId}
                                backgroundImageUrl={selectedBackground?.imageUrl || null}
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
                                isNameRevealed={isCardNameVisible}
                             />
                        </div>
                    </div>
                    
                    {isRevealTime && (
                         <div className="pt-8 text-center">
                            <h2 className="text-3xl font-bold text-slate-800 mb-6 font-serif">The Big Reveal!</h2>
                            <p className="text-slate-600 mb-6 text-lg">Here's the full list of who had who. Thanks for playing!</p>
                            <ResultsDisplay matches={allMatches} />
                         </div>
                    )}
                    
                     <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200 mt-12">
                        <h3 className="text-3xl font-bold font-serif mb-2 text-center">Share the Fun!</h3>
                        <p className="max-w-xs mb-6 text-lg text-center mx-auto text-slate-600">Enjoying this free tool? Help spread the holiday cheer!</p>
                        <ShareButtons participantCount={participants.length} />
                        <div className="text-center mt-8">
                             <a href="/" onClick={handleStartNewGame} className="inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                                Start a New Game
                             </a>
                        </div>
                     </div>
                </main>
            </div>
            <Footer theme={siteTheme} setTheme={setSiteTheme} />
        </div>
    );
};

export default ResultsPage;
