import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import type { GiftPersona } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Gift, Heart, ShoppingCart, ThumbsDown, Link as LinkIcon, Wallet, RefreshCw, Home } from 'lucide-react';
import { generateMatches } from '../services/matchService';
import { encodeData } from '../services/urlService';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [persona, setPersona] = useState<GiftPersona | null>(null);
  const [error, setError] = useState<string | null>(null);


  const { p: participants, matches: matchIds, ...styleData } = data;

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const currentMatch = useMemo(() => {
    if (!currentParticipantId) return null;
    return matches.find(m => m.giver.id === currentParticipantId);
  }, [matches, currentParticipantId]);
  
  useEffect(() => {
    if (currentMatch?.receiver) {
        setPersona(getGiftPersona(currentMatch.receiver));
    }
  }, [currentMatch]);

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      trackEvent('reveal_match');
    }
  };
  
  const createAmazonLink = (keyword: string) => {
    const affiliateTag = 'secretsantamat-20';
    return `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&tag=${affiliateTag}`;
  };

  const handleShuffle = () => {
    setError(null);
    trackEvent('click_shuffle_again', { from: 'results_page' });
    const result = generateMatches(data.p, data.exclusions, data.assignments);
    
    if (result.error) {
      setError(result.error);
      trackEvent('generation_error', { error_message: result.error, from: 'shuffle' });
      return;
    }

    if (!result.matches) {
        setError("An unexpected error occurred during shuffling.");
        trackEvent('generation_error', { error_message: 'Unexpected null matches on shuffle', from: 'shuffle' });
        return;
    }

    const newExchangeData: ExchangeData = {
        ...data,
        matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
    };

    const encoded = encodeData(newExchangeData);
    if (encoded) {
        // Just update the hash. The App component's listener will handle the refresh.
        window.location.hash = encoded;
        window.location.reload(); // Force reload to ensure all components get new data.
    } else {
        setError("There was an error creating your new shareable link.");
    }
  };

  const handleStartOver = () => {
    trackEvent('click_start_over', { from: 'results_page' });
    window.location.href = '/generator.html';
  };

  const renderParticipantView = () => {
    if (!currentMatch) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600">Participant Not Found</h2>
          <p className="text-slate-600 mt-2">The link you used might be incorrect. Please check the link or contact the organizer.</p>
        </div>
      );
    }
    
    const { receiver } = currentMatch;
    const interests = (receiver.interests || '').split(',').map(s => s.trim()).filter(Boolean);
    const likes = (receiver.likes || '').split(',').map(s => s.trim()).filter(Boolean);
    
    return (
      <>
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">You are a Secret Santa!</h1>
            <p className="text-lg text-slate-600 mt-2">Click the card below to reveal who you're getting a gift for.</p>
        </div>
        <PrintableCard
          match={currentMatch}
          eventDetails={styleData.eventDetails}
          isNameRevealed={isRevealed}
          onReveal={handleReveal}
          backgroundOptions={styleData.backgroundOptions}
          bgId={styleData.bgId}
          bgImg={styleData.customBackground}
          txtColor={styleData.textColor}
          outline={styleData.useTextOutline}
          outColor={styleData.outlineColor}
          outSize={styleData.outlineSize}
          fontSize={styleData.fontSizeSetting}
          font={styleData.fontTheme}
          line={styleData.lineSpacing}
          greet={styleData.greetingText}
          intro={styleData.introText}
          wish={styleData.wishlistLabelText}
        />
        {isRevealed && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-slate-800 font-serif mb-6 flex items-center justify-center gap-3">
              <Gift className="w-7 h-7 text-indigo-500"/>
              Gift Inspiration for {receiver.name}
            </h2>

            {persona && (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 text-center mb-8">
                  <p className="font-semibold text-indigo-800">Based on their interests, we think {receiver.name} is...</p>
                  <h3 className="text-3xl font-bold text-indigo-600 my-2">{persona.name}</h3>
                  <p className="text-indigo-700 text-sm max-w-lg mx-auto">{persona.description}</p>
                </div>
            )}
            
            <div className="space-y-6">
                {interests.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3"><Heart className="w-5 h-5 text-rose-500"/> Interests & Hobbies</h3>
                        <div className="flex flex-wrap gap-2">
                            {interests.map((interest, index) => (
                                <a key={index} href={createAmazonLink(interest)} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold py-2 px-4 rounded-full text-sm transition-colors" onClick={() => trackEvent('click_gift_idea', { keyword: interest, type: 'interest' })}>
                                    {interest}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                 {likes.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3"><ShoppingCart className="w-5 h-5 text-emerald-500"/> Specific Likes</h3>
                        <div className="flex flex-wrap gap-2">
                            {likes.map((like, index) => (
                                <a key={index} href={createAmazonLink(like)} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold py-2 px-4 rounded-full text-sm transition-colors" onClick={() => trackEvent('click_gift_idea', { keyword: like, type: 'like' })}>
                                    {like}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                {receiver.dislikes && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><ThumbsDown className="w-5 h-5"/> Dislikes & No-Go's</h3>
                        <p className="text-red-800 text-sm">{receiver.dislikes}</p>
                    </div>
                )}
                 {receiver.links && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2"><LinkIcon className="w-5 h-5"/> Specific Links</h3>
                        <div className="space-y-2">
                            {receiver.links.split('\n').map((link, index) => {
                                const trimmed = link.trim();
                                if (!trimmed) return null;
                                return <a key={index} href={trimmed} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm truncate" onClick={() => trackEvent('click_gift_idea', { type: 'specific_link' })}>{trimmed}</a>
                            })}
                        </div>
                    </div>
                )}
                {receiver.budget && (
                     <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h3 className="font-bold text-amber-700 flex items-center gap-2 mb-2"><Wallet className="w-5 h-5"/> Suggested Budget</h3>
                        <p className="text-amber-800 text-lg font-semibold">${receiver.budget}</p>
                    </div>
                )}
            </div>
            
             <p className="text-xs text-slate-400 text-center mt-6">As an Amazon Associate, we earn from qualifying purchases. This helps keep our tool 100% free!</p>
          </div>
        )}
      </>
    );
  };

  const renderOrganizerView = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Organizer's Master List</h1>
        <p className="text-lg text-slate-600 mt-4">Here are all the Secret Santa matches. Keep this page safe!</p>
        
        {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 p-3 my-6 rounded-md text-sm text-left max-w-lg mx-auto" role="alert">
                <p className="font-bold">Shuffle Error</p>
                <p>{error}</p>
            </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
            <button onClick={() => setShowShareModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors">
                Share Links & Download Cards
            </button>
            <button 
                onClick={handleShuffle}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-full transition-colors text-sm"
            >
                <RefreshCw size={16}/>
                Shuffle Again
            </button>
        </div>
      </div>
      <ResultsDisplay matches={matches} />
       <div className="mt-8 text-center">
            <button
                onClick={handleStartOver}
                className="text-sm text-slate-500 hover:text-red-600 font-semibold flex items-center gap-2 mx-auto"
            >
                <Home size={16}/>
                Start a New Game
            </button>
        </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="bg-slate-50 min-h-screen">
        <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl py-12">
          {currentParticipantId ? renderParticipantView() : renderOrganizerView()}
        </main>
      </div>
      <Footer />
      {showShareModal && (
        <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
};

export default ResultsPage;