import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant, GiftPersona } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import { Gift, ShoppingCart, ThumbsDown, Link as LinkIcon, PiggyBank, Heart, User, Wallet } from 'lucide-react';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const GiftInspirationSection: React.FC<{ receiver: Participant, giver: Participant, persona: GiftPersona | null }> = ({ receiver, giver, persona }) => {
    const renderClickableKeywords = (keywords: string) => {
        if (!keywords) return null;
        return keywords.split(',').map((keyword, index) => {
            const trimmed = keyword.trim();
            if (!trimmed) return null;
            const amazonLink = `https://www.amazon.com/s?k=${encodeURIComponent(trimmed)}&tag=secretsantama-20`;
            return (
                <a 
                    href={amazonLink} 
                    key={index} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackEvent('click_gift_idea', { persona_name: persona?.name || 'Unknown', keyword: trimmed })}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-3 px-5 rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out"
                >
                    <ShoppingCart size={18} />
                    <span>{trimmed}</span>
                </a>
            );
        });
    };

    const renderLinks = (links: string) => {
        if (!links) return null;
        return links.split('\n').map((link, index) => {
            const trimmed = link.trim();
            if (trimmed) {
                try {
                    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
                    return (
                        <a href={url.href} key={index} target="_blank" rel="noopener noreferrer" 
                           onClick={() => trackEvent('click_specific_link')}
                           className="text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                            {url.href}
                        </a>
                    );
                } catch (e) { return <p key={index} className="break-all">{trimmed}</p>; }
            }
            return null;
        });
    };

    return (
        <section className="mt-12 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Gift Inspiration for <span className="text-red-600">{receiver.name}</span></h2>
                <p className="text-slate-600 mt-2">Hey {giver.name}, here are some ideas to help you find the perfect gift!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                        <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2 mb-3"><Heart size={20} className="text-red-500"/> Interests, Hobbies & Likes</h3>
                        <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas!</p>
                        <div className="flex flex-wrap gap-3">
                            {renderClickableKeywords(receiver.interests)}
                            {renderClickableKeywords(receiver.likes)}
                        </div>
                    </div>

                    {receiver.budget && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border">
                            <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2 mb-3"><PiggyBank size={20} className="text-green-500"/> Interactive Budget Assistant</h3>
                            <div className="flex flex-wrap gap-3">
                                <a href={`https://www.amazon.com/s?k=${encodeURIComponent(receiver.interests.split(',')[0] || 'gift')}&rh=p_36%3A-&tag=secretsantama-20`.replace('-', `${receiver.budget}00`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition-colors">
                                    Find Gifts Under ${receiver.budget}
                                </a>
                                <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=secretsantama-20`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-full transition-colors">
                                    Find *Funny* Gifts Under $20
                                </a>
                            </div>
                        </div>
                    )}
                    
                    {receiver.dislikes && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                            <h3 className="font-bold text-lg text-red-700 flex items-center gap-2 mb-3"><ThumbsDown size={20}/> Dislikes & No-Go's</h3>
                            <p className="text-slate-600">{receiver.dislikes}</p>
                        </div>
                    )}

                    {receiver.links && (
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                            <h3 className="font-bold text-lg text-emerald-700 flex items-center gap-2 mb-3"><LinkIcon size={20}/> Specific Links</h3>
                            <div className="space-y-2 text-sm">{renderLinks(receiver.links)}</div>
                        </div>
                    )}
                </div>

                {persona && (
                    <div className="bg-indigo-50 p-6 rounded-2xl shadow-lg border border-indigo-200 lg:sticky lg:top-8 self-start">
                        <h3 className="font-bold text-lg text-indigo-700 flex items-center gap-2 mb-3"><User size={20}/> {receiver.name}'s Gift Persona:</h3>
                        <h4 className="font-bold text-2xl text-indigo-800 font-serif">{persona.name}</h4>
                        <p className="text-sm text-indigo-600 mt-2 mb-4">{persona.description}</p>
                        {Object.entries(persona.categories).map(([category, keywords], index) => (
                             <div key={index} className="mt-4">
                                <h5 className="font-semibold text-sm text-indigo-700 mb-2">{category}:</h5>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((kw, i) => (
                                         <a href={`https://www.amazon.com/s?k=${encodeURIComponent(kw)}&tag=secretsantama-20`} key={i} target="_blank" rel="noopener noreferrer" className="bg-white text-indigo-800 text-xs font-semibold px-2 py-1 rounded-full border border-indigo-200 hover:bg-indigo-100">{kw}</a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <p className="text-xs text-slate-400 mt-8 text-center">
                As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
            </p>
        </section>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const { p: participants, matches: matchIds, ...styleData } = data;
  
  const matches: Match[] = useMemo(() => matchIds.map(m => ({
      giver: participants.find(p => p.id === m.g)!,
      receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const currentMatch = useMemo(() => currentParticipantId ? matches.find(m => m.giver.id === currentParticipantId) : null, [currentParticipantId, matches]);
  const isOrganizerView = !currentParticipantId;

  // Participant View State
  const [viewState, setViewState] = useState<'pre-reveal' | 'revealed'>('pre-reveal');
  const [persona, setPersona] = useState<GiftPersona | null>(null);
  
  // Organizer View State
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);

  useEffect(() => {
    if (viewState === 'revealed' && currentMatch && !persona) {
        trackEvent('reveal_match', { giver: currentMatch.giver.name, receiver: currentMatch.receiver.name });
        const generatedPersona = getGiftPersona(currentMatch.receiver);
        setPersona(generatedPersona);
    }
  }, [viewState, currentMatch, persona]);
  
  if (isOrganizerView) {
    return (
      <>
        <Header />
        <main className="bg-slate-50">
          <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
              <section className="py-8 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">You're the Organizer!</h1>
                  <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                      Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                     <button 
                        onClick={() => setShowShareModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
                    >
                        Sharing & Downloads
                    </button>
                    <button 
                        onClick={() => {
                            const newMatches = matches.map(({ giver, receiver }) => ({ giver, receiver }));
                            // A simple shuffle for demonstration
                            for (let i = newMatches.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [newMatches[i], newMatches[j]] = [newMatches[j], newMatches[i]];
                            }
                            alert('Matches have been shuffled! (This is a placeholder action)');
                            trackEvent('shuffle_matches');
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-6 py-4 rounded-full transition-colors flex items-center gap-2"
                    >
                        Shuffle Again
                    </button>
                  </div>
              </section>

              <section className="my-8">
                  <ResultsDisplay matches={matches} />
              </section>
          </div>
        </main>
        <Footer />
        {showShareModal && <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />}
      </>
    );
  }

  if (!currentMatch) { // Participant is not found
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
            <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1>
            <p className="text-slate-700 text-lg">We couldn't find your match data in this link. It might be for a different participant.</p>
            <a href="/generator.html" className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
              Start a New Game
            </a>
          </div>
        </div>
      );
  }

  // Participant View
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
          <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
              {viewState === 'pre-reveal' ? (
                  <div className="text-center py-20 animate-fade-in">
                      <h1 className="text-4xl font-bold text-slate-800 font-serif">Are you <span className="text-indigo-600">{currentMatch.giver.name}</span>?</h1>
                      <p className="text-lg text-slate-600 mt-4">Ready to find out who your Secret Santa pick is?</p>
                      <button 
                          onClick={() => setViewState('revealed')}
                          className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-5 rounded-full shadow-lg transform hover:scale-105 transition-all"
                      >
                          Reveal My Match!
                      </button>
                  </div>
              ) : (
                  <>
                      <section className="py-8">
                           <PrintableCard
                              match={currentMatch}
                              eventDetails={data.eventDetails}
                              isNameRevealed={true}
                              backgroundOptions={data.backgroundOptions}
                              bgId={data.bgId}
                              bgImg={data.customBackground}
                              txtColor={data.textColor}
                              outline={data.useTextOutline}
                              outColor={data.outlineColor}
                              outSize={data.outlineSize}
                              fontSize={data.fontSizeSetting}
                              font={data.fontTheme}
                              line={data.lineSpacing}
                              greet={data.greetingText}
                              intro={data.introText}
                              wish={data.wishlistLabelText}
                          />
                      </section>
                      <GiftInspirationSection receiver={currentMatch.receiver} giver={currentMatch.giver} persona={persona} />
                  </>
              )}
          </div>
      </main>
      <Footer />
    </>
  );
};

export default ResultsPage;
