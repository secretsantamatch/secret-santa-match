// Fix: Replaced placeholder with a functional component.
import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Participant, Match } from '../types';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showFullList, setShowFullList] = useState(false);

  const { p: participants, m: matchesById, details: eventDetails, style, revealAt } = data;

  useEffect(() => {
      if (revealAt) {
        setShowFullList(new Date().getTime() > revealAt);
      } else {
        setShowFullList(true); // If no reveal date, always show
      }
  }, [revealAt]);

  const { currentParticipant, match, allMatches } = useMemo(() => {
    const participantMap = new Map<string, Participant>(participants.map(p => [p.id, p]));
    const allMatches: Match[] = matchesById.map(m => ({
      giver: participantMap.get(m.g)!,
      receiver: participantMap.get(m.r)!
    })).filter(m => m.giver && m.receiver);

    const currentMatch = allMatches.find(m => m.giver.id === currentParticipantId) || null;
    
    return {
      currentParticipant: participantMap.get(currentParticipantId || '') || null,
      match: currentMatch,
      allMatches
    };
  }, [participants, matchesById, currentParticipantId]);

  if (!currentParticipant || !match) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
          <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Oops!</h1>
          <p className="text-slate-700 text-lg">We couldn't find your name in this gift exchange. Please check the link or contact the organizer.</p>
           <a href="/" className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
            Start a New Game
          </a>
        </div>
      </div>
    );
  }

  const handleRevealComplete = () => {
    setShowFullList(true);
  };

  const backgroundImageUrl = document.querySelector(`[data-id="${style.bgId}"]`)?.getAttribute('data-url') || null;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl space-y-12">
        <header className="text-center">
             <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">
              Secret Santa Reveal!
            </h1>
            <p className="text-lg text-gray-600 mt-1">Here's your secret assignment.</p>
        </header>

        <section className="max-w-md mx-auto">
            <PrintableCard
                match={match}
                eventDetails={eventDetails}
                backgroundId={style.bgId}
                backgroundImageUrl={backgroundImageUrl}
                // Fix: Corrected property names to match the CardStyle type.
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
                isNameRevealed={isRevealed}
            />
            {!isRevealed && (
                <div className="text-center mt-6">
                    <button 
                        onClick={() => setIsRevealed(true)}
                        className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out"
                    >
                        Click to Reveal Your Person
                    </button>
                </div>
            )}
        </section>
        
        {revealAt && !showFullList ? (
             <section className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <CountdownTimer targetTimestamp={revealAt} onComplete={handleRevealComplete} />
             </section>
        ) : (
            <section className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 text-center">Full Match List</h2>
                <div className="max-w-xl mx-auto">
                    <ul className="space-y-2">
                        {allMatches.map(m => (
                            <li key={m.giver.id} className="flex items-center justify-center gap-4 text-lg p-2 bg-slate-50 rounded-md">
                                <span className="font-semibold text-slate-800 text-right w-2/5">{m.giver.name}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                <span className="font-semibold text-[var(--primary-text)] w-2/5">{m.receiver.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        )}
        <section className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Share the Fun!</h2>
            <p className="text-gray-600 mb-6">Enjoying this tool? Help spread the holiday cheer!</p>
            <ShareButtons participantCount={participants.length} />
            <div className="mt-8">
                <a href="/" className="text-sm font-semibold text-gray-500 hover:text-[var(--primary-color)]">
                    Want to start your own game? Click here!
                </a>
            </div>
        </section>
      </div>
       <FaqSection />
       <BlogPromo />
    </div>
  );
};

export default ResultsPage;
