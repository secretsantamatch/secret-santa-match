import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant, GiftPersona } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import { Share2, Shuffle, Gift, Lightbulb, Heart, ShoppingCart, ThumbsDown, Link as LinkIcon, Wallet } from 'lucide-react';
import QRCode from "react-qr-code";


interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const findMatchForGiver = (data: ExchangeData, giverId: string): Match | null => {
    const matchData = data.matches.find(m => m.g === giverId);
    if (!matchData) return null;

    const giver = data.p.find(p => p.id === matchData.g);
    const receiver = data.p.find(p => p.id === matchData.r);

    if (!giver || !receiver) return null;
    return { giver, receiver };
};

const reconstructAllMatches = (data: ExchangeData): Match[] => {
    return data.matches.map(m => {
        const giver = data.p.find(p => p.id === m.g) as Participant;
        const receiver = data.p.find(p => p.id === m.r) as Participant;
        return { giver, receiver };
    }).filter(m => m.giver && m.receiver);
};

// The new, combined Gift Inspiration section
// FIX: Added `name` to the props to be passed down from the parent component.
const GiftInspirationSection: React.FC<{ receiver: Participant; name: string; }> = ({ receiver, name }) => {
    // FIX: Corrected a typo from `of =>` to `() =>` to properly define the memoized function.
    // This resolves the type of `persona` to `GiftPersona`, fixing subsequent property access errors.
    const persona = useMemo(() => getGiftPersona(receiver), [receiver]);
    const interests = useMemo(() => [...(receiver.interests?.split(',') || []), ...(receiver.likes?.split(',') || [])].map(i => i.trim()).filter(Boolean), [receiver]);
    const dislikes = useMemo(() => (receiver.dislikes?.split(',') || []).map(i => i.trim()).filter(Boolean), [receiver]);
    const links = useMemo(() => (receiver.links?.split('\n') || []).map(l => l.trim()).filter(Boolean), [receiver]);

    return (
        <div className="mt-12 animate-fade-in" id="gift-inspiration">
             <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif flex items-center justify-center gap-3">
                    <Heart className="text-red-500" size={32} />
                    Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                </h2>
                {/* FIX: The `name` variable was not defined in this component's scope. It is now passed in as a prop. */}
                <p className="text-slate-600 mt-2">Hey {name}, here are some ideas to help you find the perfect gift!</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Interests */}
                    {interests.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border">
                            <h3 className="font-bold text-xl text-slate-700 mb-4 flex items-center gap-3"><ShoppingCart className="text-blue-500" />Interests, Hobbies & Likes</h3>
                            <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas!</p>
                            <div className="flex flex-wrap gap-3">
                                {interests.map(interest => (
                                    <a
                                        key={interest}
                                        href={`https://www.amazon.com/s?k=${encodeURIComponent(interest)}&tag=secretsantama-20`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => trackEvent('click_gift_idea', { keyword: interest, persona: persona.name })}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-full text-base transition-transform transform hover:scale-105 shadow-md flex items-center gap-2"
                                    >
                                        <Gift size={16} /> {interest}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Budget */}
                    {receiver.budget && (
                         <div className="bg-white p-6 rounded-2xl shadow-lg border">
                            <h3 className="font-bold text-xl text-slate-700 mb-4 flex items-center gap-3"><Wallet className="text-green-500" />Interactive Budget Assistant</h3>
                             <div className="flex flex-wrap gap-3">
                                <a href={`https://www.amazon.com/s?k=gifts&rh=p_36%3A-${parseInt(receiver.budget) * 100}&tag=secretsantama-20`} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-full text-base transition-transform transform hover:scale-105 shadow-md">
                                    Find Gifts Under ${receiver.budget}
                                </a>
                                 <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=secretsantama-20`} target="_blank" rel="noopener noreferrer" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-5 rounded-full text-base transition-transform transform hover:scale-105 shadow-sm">
                                    Find *Funny* Gifts Under $20
                                </a>
                            </div>
                        </div>
                    )}
                    
                    {/* Dislikes */}
                    {dislikes.length > 0 && (
                         <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                            <h3 className="font-bold text-xl text-red-700 mb-4 flex items-center gap-3"><ThumbsDown className="text-red-500" />Dislikes & No-Go's</h3>
                             <div className="flex flex-wrap gap-3">
                                {dislikes.map((dislike, i) => <span key={i} className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">{dislike}</span>)}
                            </div>
                        </div>
                    )}
                    
                    {/* Links */}
                    {links.length > 0 && (
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                            <h3 className="font-bold text-xl text-emerald-700 mb-4 flex items-center gap-3"><LinkIcon className="text-emerald-500" />Specific Links</h3>
                            <div className="space-y-2">
                                {links.map((link, i) => <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">{link}</a>)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Persona Sidebar */}
                <div className="lg:sticky lg:top-8">
                     <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200">
                        <h3 className="font-bold text-xl text-indigo-700 mb-4 flex items-center gap-3">
                            <Lightbulb className="text-indigo-500" />Gifter's Persona:
                        </h3>
                         <div className="text-center">
                            <h4 className="font-bold text-2xl text-indigo-800 font-serif">{persona.name}</h4>
                            <p className="text-indigo-900/80 text-sm mt-2">{persona.description}</p>
                        </div>
                         <div className="mt-6 space-y-4">
                            {Object.entries(persona.categories).map(([category, ideas]) => (
                                <div key={category}>
                                    <h5 className="font-semibold text-slate-800 mb-2">{category}</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {ideas.map(idea => (
                                            <a
                                                key={idea}
                                                href={`https://www.amazon.com/s?k=${encodeURIComponent(idea)}&tag=secretsantama-20`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackEvent('click_gift_idea', { keyword: idea, persona: persona.name })}
                                                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                                            >
                                                {idea}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPreReveal, setShowPreReveal] = useState(true);

    const allMatches = useMemo(() => reconstructAllMatches(data), [data]);
    const currentMatch = useMemo(() => currentParticipantId ? findMatchForGiver(data, currentParticipantId) : null, [data, currentParticipantId]);

    const handleReveal = () => {
        if (!isNameRevealed) {
            setIsNameRevealed(true);
            trackEvent('reveal_name');
            // Scroll to the gift ideas section for a smooth transition
            setTimeout(() => {
                document.getElementById('gift-inspiration')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };
    
    const handleConfirmIdentity = () => {
        setShowPreReveal(false);
        trackEvent('confirm_identity');
    };

    const handleShuffle = () => {
        // Simple way to reshuffle is to navigate back to the generator
        // A more advanced way could re-run the logic, but this is safest.
        window.location.href = '/generator.html';
    };


    const OrganizerView = () => (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 rounded-3xl shadow-2xl text-center">
                <div className="inline-block bg-white/20 p-3 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-serif">You're the Organizer!</h1>
                <p className="text-lg text-indigo-200 mt-4 max-w-2xl mx-auto">Your matches are ready. You can now share private links with each person, or download/print the cards for your party.</p>
                 <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <button onClick={() => setShowShareModal(true)} className="bg-white hover:bg-slate-100 text-indigo-600 font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3">
                        <Share2 size={24} /> Sharing & Downloads
                    </button>
                    <button onClick={handleShuffle} className="bg-white/20 hover:bg-white/30 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-md transform hover:scale-105 transition-all flex items-center gap-2">
                        <Shuffle size={20} /> Shuffle Again
                    </button>
                </div>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 font-serif flex items-center gap-3 pt-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>Master List</h2>
            <ResultsDisplay matches={allMatches} />

        </div>
    );

    const ParticipantView = () => {
        if (!currentMatch) {
            return (
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                    <h1 className="text-3xl font-bold text-red-600">Oops!</h1>
                    <p className="text-slate-700 mt-2">We couldn't find your match. Please check the link or contact your event organizer.</p>
                </div>
            );
        }

        if (showPreReveal) {
             return (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-lg mx-auto animate-fade-in">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Are you <span className="text-red-600">{currentMatch.giver.name}</span>?</h1>
                        <p className="text-lg text-slate-600 mt-4">Your secret match is waiting for you. Ready to see who you're getting a gift for?</p>
                        <button 
                            onClick={handleConfirmIdentity}
                            className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all"
                        >
                            Reveal My Match!
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="animate-fade-in">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">You're a Secret Santa!</h1>
                        <p className="text-lg text-slate-600 mt-2">
                            {isNameRevealed ? "Here's some inspiration to help you find the perfect gift." : "Click the card below to reveal who you're getting a gift for."}
                        </p>
                    </div>

                    <PrintableCard
                        match={currentMatch}
                        eventDetails={data.eventDetails}
                        isNameRevealed={isNameRevealed}
                        onReveal={handleReveal}
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
                </div>
                
                {isNameRevealed && <GiftInspirationSection receiver={currentMatch.receiver} name={currentMatch.giver.name} />}
            </div>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {currentParticipantId ? <ParticipantView /> : <OrganizerView />}
            </main>
            <Footer />
            {showShareModal && (
                <ShareLinksModal
                    matches={allMatches}
                    exchangeData={data}
                    onClose={() => setShowShareModal(false)}
                />
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ResultsPage;