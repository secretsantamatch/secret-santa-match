import React, { useState } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import BlogPromo from './BlogPromo';
import FaqSection from './FaqSection';
import ShareButtons from './ShareButtons';
import CountdownTimer from './CountdownTimer';
import ResultsDisplay from './ResultsDisplay';

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const { p: participants, m: matches, d: eventDetails, t: exchangeDate } = data;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMasterList, setShowMasterList] = useState(false);
  
  const [theme, setTheme] = useState(localStorage.getItem('ssm_theme') || 'default');

  const currentUserMatch = currentParticipantId ? matches.find(match => match.giver.id === currentParticipantId) : null;
  const isOrganizerView = !currentParticipantId;
  const isRevealTime = new Date(exchangeDate) < new Date();

  const handleCopy = (participantId: string) => {
    const url = new URL(window.location.href);
    const hash = url.hash.split('?')[0];
    const linkToCopy = `${url.origin}${url.pathname}${hash}?id=${participantId}`;
    navigator.clipboard.writeText(linkToCopy).then(() => {
      setCopiedId(participantId);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const renderOrganizerView = () => (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-3 font-serif">Your Event is Ready!</h2>
      <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">Copy each participant's unique link and share it with them privately via text, WhatsApp, or any other messaging app.</p>
      
      <div className="space-y-3 max-w-lg mx-auto">
        {participants.filter(p => p.name.trim()).map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
            <span className="font-semibold text-slate-700">{p.name}</span>
            <button 
              onClick={() => handleCopy(p.id)}
              className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full transition-colors ${copiedId === p.id ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}`}
            >
              {copiedId === p.id ? <CheckIcon /> : <CopyIcon />}
              {copiedId === p.id ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 pt-6 border-t">
        <button
          onClick={() => setShowMasterList(!showMasterList)}
          className="font-bold text-[var(--primary-text)] hover:underline"
        >
          {showMasterList ? 'Hide Master List' : 'View Master List (For Organizer)'}
        </button>
        {showMasterList && (
          <div className="mt-6">
            <ResultsDisplay matches={matches} />
          </div>
        )}
      </div>
    </div>
  );

  const renderParticipantView = () => {
    if (!currentUserMatch) {
      return (
        <div className="p-8 bg-white rounded-2xl shadow-lg border text-center">
            <h2 className="text-2xl font-bold text-red-600">Link Error</h2>
            <p className="text-slate-600 mt-2">We couldn't find a match for this specific link. It might be invalid or outdated.</p>
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border text-center">
            <h2 className="text-2xl font-bold text-slate-800">Hello, <span className="text-[var(--primary-text)]">{currentUserMatch.giver.name}</span>!</h2>
            <p className="text-slate-600 text-lg mt-2">You are the Secret Santa for...</p>
            <div className="my-6 p-6 bg-[var(--accent-lighter-bg)] border border-[var(--accent-border)] rounded-2xl inline-block">
                <p className="text-4xl md:text-5xl font-bold text-[var(--accent-dark-text)] font-serif">{currentUserMatch.receiver.name}</p>
            </div>
            <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-bold text-slate-700">Their Gift Ideas & Notes:</h3>
                <p className="text-slate-600 mt-1">{currentUserMatch.receiver.notes || <span className="italic">No notes provided.</span>}</p>
                {currentUserMatch.receiver.budget && (
                    <p className="mt-2"><strong>Suggested Budget:</strong> ${currentUserMatch.receiver.budget}</p>
                )}
            </div>
            {eventDetails && (
                <div className="mt-6 max-w-md mx-auto">
                    <h3 className="font-bold text-slate-700">Event Details:</h3>
                    <p className="text-slate-600 mt-1">{eventDetails}</p>
                </div>
            )}
        </div>

        {isRevealTime ? (
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-4 font-serif">The Big Reveal!</h2>
            <p className="text-gray-600 text-center mb-6">The gift exchange date has passed. Here's the full list of who had who:</p>
            <ResultsDisplay matches={matches} />
          </div>
        ) : (
          <CountdownTimer targetDate={exchangeDate} />
        )}
      </div>
    );
  };


  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <main className="mt-8 md:mt-12">
            {isOrganizerView ? renderOrganizerView() : renderParticipantView()}
            
            <div className="mt-12 p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                </div>
                <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                <ShareButtons participantCount={participants.length} />
            </div>
        </main>
      </div>
      <FaqSection />
      <BlogPromo />
      <Footer theme={theme} setTheme={setTheme} />
    </div>
  );
};

export default ResultsPage;
