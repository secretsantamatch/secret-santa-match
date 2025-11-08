import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant, GiftPersona } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import { Gift, FileText, Download, Users, Share2, Sparkles, Shuffle, Heart, Search, ThumbsDown, Link as LinkIcon, ShoppingCart, Lightbulb, Check } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';
import PrintableCard from './PrintableCard';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const GiftInspirationSection: React.FC<{ giver: Participant, receiver: Participant, persona: GiftPersona }> = ({ giver, receiver, persona }) => {
    
    const allCategories = useMemo(() => persona.categories ? Object.entries(persona.categories) : [], [persona]);

    return (
        <section className="mt-12 animate-fade-in w-full">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 font-serif flex items-center justify-center gap-3">
                    <Heart className="text-red-500" size={28}/>
                    Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                </h2>
                <p className="text-slate-600 mt-2">Hey {giver.name}, here are some ideas to help you find the perfect gift!</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Wishlist */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Interests */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                         <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-4"><Lightbulb className="text-amber-500"/>Interests, Hobbies & Likes</h3>
                         <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas!</p>
                         <div className="flex flex-wrap gap-3">
                            {[...(receiver.interests || '').split(','), ...(receiver.likes || '').split(',')]
                                .map(i => i.trim()).filter(Boolean).map((idea, i) => (
                                <a 
                                    key={i}
                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(idea)}&tag=secretsanta0a-20`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-full transition-all transform hover:scale-105"
                                    onClick={() => trackEvent('click_gift_idea', { idea_name: idea, source: 'user_interest_tag' })}
                                >
                                    <ShoppingCart size={16} />
                                    <span>{idea}</span>
                                </a>
                            ))}
                         </div>
                    </div>

                    {/* Budget */}
                    {receiver.budget && (
                         <div className="bg-white p-6 rounded-2xl shadow-lg border">
                             <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-4">Interactive Budget Assistant</h3>
                             <div className="flex flex-wrap gap-3">
                                 <a href={`https://www.amazon.com/s?k=gifts&rh=p_36%3A-${parseFloat(receiver.budget) * 100}&tag=secretsanta0a-20`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-5 rounded-full transition-all transform hover:scale-105">
                                     <span>Find Gifts Under ${receiver.budget}</span>
                                 </a>
                                 <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=secretsanta0a-20`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-5 rounded-full transition-all transform hover:scale-105">
                                     <span>Funny Gifts Under $20</span>
                                 </a>
                             </div>
                        </div>
                    )}
                    
                    {/* Dislikes */}
                    {receiver.dislikes && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                            <h3 className="font-bold text-xl text-red-800 flex items-center gap-3 mb-2"><ThumbsDown className="text-red-500"/>Dislikes & No-Go's</h3>
                            <p className="text-red-900">{receiver.dislikes}</p>
                        </div>
                    )}

                    {/* Links */}
                    {receiver.links && (
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                             <h3 className="font-bold text-xl text-green-800 flex items-center gap-3 mb-4"><LinkIcon className="text-green-500"/>Specific Links</h3>
                             <div className="space-y-2">
                                {receiver.links.split('\n').map((link, index) => {
                                    const trimmed = link.trim();
                                    if(!trimmed) return null;
                                    return (
                                        <a href={trimmed} key={index} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 underline truncate">
                                            {trimmed}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Persona */}
                <div className="sticky top-8">
                    <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200">
                         <h3 className="font-bold text-xl text-indigo-800 flex items-center gap-3 mb-2">Gifter's Persona:</h3>
                         <h4 className="font-bold text-2xl text-indigo-600 font-serif">{persona.name}</h4>
                         <p className="text-indigo-900/80 text-sm mt-2 mb-4">{persona.description}</p>
                         {allCategories.map(([category, ideas], index) => (
                            <div key={index} className="mt-4">
                                <h5 className="font-bold text-indigo-800 text-sm mb-2">{category}:</h5>
                                <div className="flex flex-wrap gap-2">
                                     {(ideas as string[]).map((idea, i) => (
                                        <a 
                                            key={i}
                                            href={`https://www.amazon.com/s?k=${encodeURIComponent(idea)}&tag=secretsanta0a-20`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-2 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-semibold py-1 px-3 rounded-full text-xs transition-colors"
                                            onClick={() => trackEvent('click_gift_idea', { idea_name: idea, source: 'persona_tag' })}
                                        >
                                            <ShoppingCart size={12} />
                                            <span>{idea}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </section>
    );
};

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isNameRevealed, setIsNameRevealed] = useState(false);

    useEffect(() => {
        if (currentParticipantId) {
            trackEvent('view_reveal_page');
        } else {
            trackEvent('view_organizer_results');
        }
    }, [currentParticipantId]);

    const participantMap = useMemo(() => new Map(data.p.map(p => [p.id, p])), [data.p]);

    const matches = useMemo((): Match[] => {
        return data.matches.map(m => ({
            giver: participantMap.get(m.g)!,
            receiver: participantMap.get(m.r)!
        })).filter(m => m.giver && m.receiver);
    }, [data.matches, participantMap]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId);
    }, [currentParticipantId, matches]);

    const personaForCurrentMatch = useMemo(() => {
        if (currentMatch?.receiver) {
            return getGiftPersona(currentMatch.receiver);
        }
        return null;
    }, [currentMatch]);

    if (currentMatch) {
        // PARTICIPANT'S REVEAL VIEW
        return (
             <>
                <Header />
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl my-12 flex flex-col items-center">
                     <div className="w-full max-w-md">
                        <PrintableCard
                            match={currentMatch}
                            eventDetails={data.eventDetails}
                            isNameRevealed={isNameRevealed}
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
                            onReveal={() => {
                                if (!isNameRevealed) {
                                    setIsNameRevealed(true);
                                    trackEvent('reveal_name');
                                }
                            }}
                        />
                         {!isNameRevealed && (
                            <div className="text-center mt-6">
                                <button 
                                    onClick={() => {
                                        setIsNameRevealed(true);
                                        trackEvent('reveal_name');
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg animate-pulse"
                                >
                                    Click to Reveal Your Person!
                                </button>
                            </div>
                        )}
                    </div>

                    {isNameRevealed && personaForCurrentMatch && (
                        <GiftInspirationSection 
                            giver={currentMatch.giver} 
                            receiver={currentMatch.receiver}
                            persona={personaForCurrentMatch} 
                        />
                    )}

                    <div className="text-center mt-12">
                        <a href="/generator.html" className="text-indigo-600 hover:text-indigo-800 font-semibold">
                            Organize your own Secret Santa &rarr;
                        </a>
                    </div>
                </main>
                <Footer />
            </>
        );
    }
    
    // ORGANIZER VIEW
    return (
        <>
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl my-12">
                <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
                        <Check size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-serif">You're the Organizer!</h1>
                    <p className="text-lg text-indigo-200 mt-2 max-w-2xl mx-auto">
                        Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={() => setIsShareModalOpen(true)}
                            className="bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto sm:mx-0"
                        >
                            <Share2 /> Sharing & Downloads
                        </button>
                        <button 
                            onClick={() => window.location.href = '/generator.html'}
                            className="bg-white/30 hover:bg-white/40 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all flex items-center gap-2 mx-auto sm:mx-0"
                        >
                            <Shuffle size={16} /> Start New Game
                        </button>
                    </div>
                </section>
                
                <section className="mt-12">
                    <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8 flex items-center justify-center gap-3">
                        <Users className="h-8 w-8" /> Organizer's Master List
                    </h2>
                    <ResultsDisplay matches={matches} />
                </section>
            </main>
            <Footer />
            {isShareModalOpen && (
                <ShareLinksModal
                    matches={matches}
                    onClose={() => setIsShareModalOpen(false)}
                    exchangeData={data}
                />
            )}
        </>
    );
};
export default ResultsPage;