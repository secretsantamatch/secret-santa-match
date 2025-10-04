import React, { useState, useEffect, useMemo } from 'react';
// Fix: Corrected import paths for types and components.
import type { ExchangeData, Participant, Match, BackgroundOption } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isRevealed, setIsRevealed] = useState(data.revealAt ? Date.now() > data.revealAt : true);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [siteTheme, setSiteTheme] = useState(data.th || 'christmas');
    const [isNameScratchRevealed, setIsNameScratchRevealed] = useState(false);
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);

    useEffect(() => {
        fetch('/templates.json')
            .then(response => response.json())
            .then(data => setBackgroundOptions(data));
    }, []);

    const { participants, matches, currentMatch, currentParticipant, isOrganizerView } = useMemo(() => {
        const participantMap = new Map(data.p.map(p => [p.id, p]));
        
        const resolvedMatches: Match[] = data.m.map(matchById => ({
            giver: participantMap.get(matchById.g)!,
            receiver: participantMap.get(matchById.r)!,
        })).filter(m => m.giver && m.receiver);

        const currentP = currentParticipantId ? participantMap.get(currentParticipantId) || null : null;
        const currentM = currentP ? resolvedMatches.find(m => m.giver.id === currentP.id) || null : null;

        return {
            participants: data.p,
            matches: resolvedMatches,
            currentMatch: currentM,
            currentParticipant: currentP,
            isOrganizerView: !currentParticipantId
        };
    }, [data, currentParticipantId]);
    
    useEffect(() => {
        document.documentElement.dataset.theme = siteTheme;
    }, [siteTheme]);

    const handleRevealComplete = () => setIsRevealed(true);

    const handleCopy = (participantId: string) => {
        const hashContent = window.location.hash.substring(1).split('?')[0];
        const url = `${window.location.origin}${window.location.pathname}?id=${participantId}#${hashContent}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(participantId);
            setTimeout(() => setCopiedLink(null), 2000);
        });
    };

    const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = "";
    };
    
    if (isOrganizerView) {
        return (
          <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <Header />
                <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                        <div className="mx-auto bg-[var(--accent-lighter-bg)] rounded-full h-16 w-16 flex items-center justify-center">
                            <svg className="h-10 w-10 text-[var(--accent-icon-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Success! Your Game is Ready!</h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Below are the unique, private links for each participant. Send each person their own link—they will only be able to see who they are assigned to.</p>
                        
                        <div className="max-w-xl mx-auto space-y-3 text-left">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                                    <span className="font-semibold text-slate-700">{p.name}</span>
                                    <button onClick={() => handleCopy(p.id)} className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-full text-sm transition-colors text-white ${copiedLink === p.id ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-700'}`}>
                                        {copiedLink === p.id ? <CheckIcon/> : <CopyIcon/>}
                                        {copiedLink === p.id ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
                             <h3 className="font-semibold text-amber-800 mb-3">Please consider sharing!</h3>
                             <ShareButtons participantCount={participants.length} />
                        </div>
                        <a href="/" onClick={handleStartNewGame} className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                            Start a New Game
                        </a>
                    </div>
                </main>
            </div>
            <FaqSection />
            <BlogPromo />
            <Footer theme={siteTheme} setTheme={setSiteTheme} />
          </div>
        );
    }
    
    if (!currentParticipant || !currentMatch) {
         return (
             <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                  <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Participant Not Found</h1>
                  <p className="text-slate-700 text-lg">We couldn't find this participant in the gift exchange. The link may be incorrect or the game may have been recreated.</p>
                  <a href="/" onClick={handleStartNewGame} className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                    Start a New Game
                  </a>
                </div>
              </div>
         );
    }

    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
            <Header />
            <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
                <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center">Hello, {currentParticipant.name}!</h2>
                    <p className="text-gray-600 mb-8 text-center">Here is your Secret Santa assignment. Shhh!</p>
                    <div className="max-w-sm mx-auto">
                        <div onClick={() => setIsNameScratchRevealed(true)} className="cursor-pointer">
                            <PrintableCard
                                match={currentMatch}
                                eventDetails={data.details}
                                backgroundId={data.style.bgId}
                                backgroundImageUrl={backgroundOptions.find(o => o.id === data.style.bgId)?.imageUrl || null}
                                customBackground={data.style.bgImg}
                                textColor={data.style.txtColor}
                                useTextOutline={data.style.useOutline}
                                outlineColor={data.style.outColor}
                                outlineSize={data.style.outSize}
                                fontSizeSetting={data.style.fontSize}
                                fontTheme={data.style.font}
                                lineSpacing={data.style.line}
                                greetingText={data.style.greet}
                                introText={data.style.intro}
                                wishlistLabelText={data.style.wish}
                                isNameRevealed={isNameScratchRevealed}
                            />
                        </div>
                        {!isNameScratchRevealed && <p className="text-center mt-4 text-gray-500 font-semibold animate-pulse">Click the card to reveal the name!</p>}
                    </div>
                </div>

                {isRevealed && (
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 animate-fade-in-up">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-center">The Big Reveal!</h2>
                        <p className="text-center text-gray-600 mb-8">The gift exchange is complete! Here's who had who:</p>
                        <ResultsDisplay matches={matches} />
                    </div>
                )}
                
                {!isRevealed && data.revealAt && (
                     <div className="p-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                        <h3 className="text-3xl font-bold font-serif mb-2">The Big Reveal is Coming!</h3>
                        <p className="text-slate-300 max-w-md mb-6 text-lg">After the exchange, check back here to see who your Secret Santa was! The full list will be revealed in:</p>
                        <CountdownTimer targetDate={data.revealAt} onComplete={handleRevealComplete} />
                    </div>
                )}
                
                 <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Share the Fun!</h3>
                    <p className="text-gray-600 mb-6">Enjoying this free tool? Help spread the holiday cheer!</p>
                    <ShareButtons participantCount={participants.length} />
                    <a href="/" onClick={handleStartNewGame} className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                        Start a New Game
                    </a>
                </div>

            </main>
        </div>
        <FaqSection />
        <BlogPromo />
        <Footer theme={siteTheme} setTheme={setSiteTheme} />
      </div>
    );
};

export default ResultsPage;
