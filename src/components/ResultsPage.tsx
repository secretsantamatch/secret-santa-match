import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Participant, Match } from '../types';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';
import Footer from './Footer';

const CopyLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMasterList, setShowMasterList] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [theme, setTheme] = useState(data.th || 'christmas');
  const [isRevealTime, setIsRevealTime] = useState(!data.revealAt || data.revealAt <= Date.now());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const { participantMap, matches } = useMemo(() => {
    const participantMap = new Map<string, Participant>(data.p.map(p => [p.id, p]));
    const matches: Match[] = data.m.map(matchById => ({
      giver: participantMap.get(matchById.g)!,
      receiver: participantMap.get(matchById.r)!,
    })).filter(m => m.giver && m.receiver);
    return { participantMap, matches };
  }, [data]);
  
  const currentMatch = useMemo(() => {
    if (!currentParticipantId) return null;
    return matches.find(m => m.giver.id === currentParticipantId) || null;
  }, [matches, currentParticipantId]);

  useEffect(() => {
    if (currentMatch) {
      // Auto-reveal if there's no reveal button (i.e. no onReveal handler passed to card)
      // This is for direct link access where the user just sees their assignment.
      setIsRevealed(true);
    }
  }, [currentMatch]);

  
  const handleCopyLink = (participantId: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const hash = window.location.hash.split('?')[0];
    const url = `${baseUrl}${hash}?id=${participantId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLinkId(participantId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  };

  const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    window.location.hash = '';
    window.dispatchEvent(new Event('hashchange'));
  };

  const MasterListView = () => (
    <div className="max-w-4xl mx-auto overflow-x-auto">
      <div className="bg-white rounded-lg p-4 border shadow-md">
        <div className="grid grid-cols-3 gap-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-wider px-4 pb-2 border-b">
          <div className="col-span-1">Secret Santa (Giver)</div>
          <div className="col-span-1">Is Giving To (Receiver)</div>
          <div className="col-span-1">Receiver's Notes</div>
        </div>
        <div className="divide-y">
          {matches.map((match) => (
            <div key={match.giver.id} className="grid grid-cols-3 gap-4 items-center p-4">
              <div className="col-span-1 font-semibold text-slate-800">{match.giver.name}</div>
              <div className="col-span-1"><span className="font-semibold text-[var(--accent-dark-text)] bg-[var(--accent-lighter-bg)] py-1 px-3 rounded-full">{match.receiver.name}</span></div>
              <div className="col-span-1 text-sm text-gray-500">{match.receiver.notes || <span className="italic">No notes</span>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const OrganizerView = () => (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 font-serif">You're the Organizer!</h2>
        <p className="text-gray-600 mb-8 text-center">Copy and send each person their unique, private link.</p>
        <div className="space-y-3 max-w-2xl mx-auto">
            {matches.map(match => (
                <div key={match.giver.id} className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-3 rounded-lg border">
                    <div className="font-bold text-slate-700 mb-2 sm:mb-0">
                        {match.giver.name}'s Link
                    </div>
                    <button onClick={() => handleCopyLink(match.giver.id)} className={`flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-full transition-colors text-sm ${copiedLinkId === match.giver.id ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}`}>
                        <CopyLinkIcon />
                        {copiedLinkId === match.giver.id ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            ))}
        </div>
        
        {data.revealAt && (
             <div className="mt-8 text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-900"><strong className="font-semibold">Big Reveal Enabled:</strong> After the exchange time, everyone's link will update to show the full list of who had who. No need to send new links!</p>
            </div>
        )}

        <div className="text-center mt-8">
            <button onClick={() => setShowMasterList(s => !s)} className="text-sm font-semibold text-gray-600 hover:text-[var(--primary-color)]">
                {showMasterList ? 'Hide Master List' : 'Show Master List'}
            </button>
        </div>
        {showMasterList && <div className="mt-4"><MasterListView /></div>}
    </div>
  );
  
  const ParticipantView = () => {
    if (!currentMatch) {
      return (
        <div className="p-8 bg-white rounded-2xl shadow-lg border text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-gray-700 mt-2">Could not find your assignment. Please check the link or contact the organizer.</p>
        </div>
      );
    }
    
    // This is the participant's own view before the reveal time.
    if (!isRevealTime && data.revealAt) {
      return (
         <div className="text-center p-8">
          <PrintableCard 
              match={currentMatch}
              eventDetails={data.details}
              backgroundId={data.style.bgId}
              backgroundImageUrl={data.style.bgImg}
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
              isNameRevealed={isRevealed}
              onReveal={() => setIsRevealed(true)}
          />
           <div className="mt-8 text-center p-6 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl text-white">
               <h2 className="text-2xl font-bold font-serif mb-2">The Big Reveal is Coming!</h2>
               <p className="text-slate-300 max-w-md mx-auto mb-6">After the countdown, this page will update to show you who your Secret Santa was. Check back then!</p>
               <CountdownTimer targetDate={data.revealAt} onComplete={() => setIsRevealTime(true)} />
           </div>
         </div>
      );
    }
    
    // This is the view after the reveal time
    if (showMasterList) {
       return (
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 font-serif">The Big Reveal!</h2>
                <p className="text-gray-600 mb-8 text-center">Here's who had who for the gift exchange.</p>
                <MasterListView />
                <div className="text-center mt-8">
                    <button onClick={() => setShowMasterList(false)} className="text-sm font-semibold text-gray-600 hover:text-[var(--primary-color)]">
                        Back to My Assignment
                    </button>
                </div>
            </div>
       );
    }
    
    return (
        <div>
            <PrintableCard 
                match={currentMatch}
                eventDetails={data.details}
                backgroundId={data.style.bgId}
                backgroundImageUrl={data.style.bgImg}
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
                isNameRevealed={isRevealed}
                onReveal={() => setIsRevealed(true)}
            />
            {isRevealTime && (
                <div className="text-center mt-6">
                    <button onClick={() => setShowMasterList(true)} className="bg-white/80 backdrop-blur-sm text-slate-800 font-bold py-3 px-6 rounded-full shadow-md transform hover:scale-105 transition-transform">
                        See Who Had Who (Big Reveal)
                    </button>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <header className="text-center py-6">
            <a href="/" onClick={handleStartNewGame} className="inline-block" aria-label="Go to homepage">
                <div className="flex justify-center items-center gap-4 flex-col sm:flex-row">
                    <img src="/logo_64.png" alt="Santa hat logo" className="h-14 w-14" />
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Secret Santa Generator</h1>
                    </div>
                </div>
            </a>
        </header>

        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
            {currentParticipantId ? <ParticipantView /> : <OrganizerView />}

            <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                <ShareButtons participantCount={data.p.length} />
            </div>

            <div className="text-center">
                <a href="/" onClick={handleStartNewGame} className="inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                    Start a New Game
                </a>
            </div>
        </main>
      </div>
      <Footer theme={theme} setTheme={setTheme} />
    </div>
  );
};

export default ResultsPage;
