import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { ExchangeData, Match } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import Footer from './Footer';
import { trackEvent } from '../services/analyticsService';
import { ShoppingCart } from 'lucide-react';
import BackToTopButton from './BackToTopButton';
import { generateMatches } from '../services/matchService';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

// Your Amazon Associates Tracking ID is now correctly set.
const affiliateTag = 'secretsant09e-20';

// Helper to create clickable links from text
const linkify = (text: string) => {
    if (!text) return null;
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line.split(urlRegex).map((part, j) => 
                urlRegex.test(part) ? <a href={part} key={j} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{part}</a> : part
            )}
            {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
    ));
};

const ResultsPage: React.FC<ResultsPageProps> = ({ data: initialData, currentParticipantId }) => {
    const [data, setData] = useState<ExchangeData>(initialData);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    const reconstructedMatches: Match[] = useMemo(() => {
        try {
            return data.matches.map(match => {
                const giver = data.p.find(p => p.id === match.g);
                const receiver = data.p.find(p => p.id === match.r);
                if (!giver || !receiver) throw new Error("Participant not found for a match.");
                return { giver, receiver };
            }).filter(Boolean) as Match[];
        } catch (e) {
            console.error(e);
            return [];
        }
    }, [data.matches, data.p]);

    const handleShuffleAgain = () => {
        trackEvent('shuffle_again');
        const result = generateMatches(data.p, data.exclusions, data.assignments);
        if (result.matches) {
            const newMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
            setData(prevData => ({ ...prevData, matches: newMatches }));
        } else {
            // Handle error case if needed, e.g., show a notification
            console.error("Failed to shuffle again:", result.error);
            alert(`Could not generate new matches. ${result.error}`);
        }
    };
    
    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return reconstructedMatches.find(m => m.giver.id === currentParticipantId);
    }, [reconstructedMatches, currentParticipantId]);
    
    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_match');
    };

    // Organizer's View
    if (!currentParticipantId) {
        // FIX: Generate participant links and download handlers for the ShareLinksModal
        const participantLinks = useMemo(() => {
            const { origin, pathname, search, hash } = window.location;
            return reconstructedMatches.map(({ giver }) => {
                const params = new URLSearchParams(search);
                params.set('id', giver.id);
                const link = `${origin}${pathname}?${params.toString()}${hash}`;
                return {
                    id: giver.id,
                    name: giver.name,
                    link: link,
                };
            });
        }, [reconstructedMatches]);

        const handleDownloadAllCards = () => {
            trackEvent('download_all_cards_pdf');
            generateIndividualCardsPdf({
                matches: reconstructedMatches,
                eventDetails: data.eventDetails,
                backgroundOptions: data.backgroundOptions,
                bgId: data.bgId,
                bgImg: data.customBackground,
                txtColor: data.textColor,
                outline: data.useTextOutline,
                outColor: data.outlineColor,
                outSize: data.outlineSize,
                fontSize: data.fontSizeSetting,
                font: data.fontTheme,
                line: data.lineSpacing,
                greet: data.greetingText,
                intro: data.introText,
                wish: data.wishlistLabelText,
            });
        };

        const handleDownloadMasterList = () => {
            trackEvent('download_master_list_pdf');
            generateMasterListPdf({
                matches: reconstructedMatches,
                eventDetails: data.eventDetails,
                exchangeDate: data.exchangeDate,
                exchangeTime: data.exchangeTime,
            });
        };

        return (
            <>
                <div className="bg-slate-50 min-h-screen">
                    <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl text-center mb-8">
                             <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold font-serif">You're the Organizer!</h1>
                            <p className="text-lg text-purple-200 mt-4 max-w-3xl mx-auto">
                                Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                            </p>
                            <div className="mt-8 flex justify-center gap-4">
                                <button onClick={() => setShowShareModal(true)} className="bg-white hover:bg-slate-100 text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
                                    Sharing & Downloads
                                </button>
                                <button onClick={handleShuffleAgain} className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-full transition-colors border-2 border-white/50">
                                    Shuffle Again
                                </button>
                            </div>
                        </div>
                    </main>
                    <Footer />
                    <BackToTopButton />
                </div>
                {showShareModal && (
                    <ShareLinksModal
                        participantLinks={participantLinks}
                        onClose={() => setShowShareModal(false)}
                        onDownloadAllCards={handleDownloadAllCards}
                        onDownloadMasterList={handleDownloadMasterList}
                    />
                )}
            </>
        );
    }

    // Participant's View
    if (!currentMatch) {
         return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                    <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Oops!</h1>
                    <p className="text-slate-700 text-lg">We couldn't find your match. The participant ID in your link seems to be invalid. Please check the link or ask your organizer to resend it.</p>
                     <a href="/generator.html" className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                        Start a New Game
                    </a>
                </div>
            </div>
        );
    }
    
    const { giver, receiver } = currentMatch;
    const interestsAndLikes = [...(receiver.interests || '').split(','), ...(receiver.likes || '').split(',')].map(s => s.trim()).filter(Boolean);

    return (
        <>
            <div className="bg-slate-50 min-h-screen">
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <div className="text-center mb-8">
                        {!isNameRevealed && <p className="text-slate-600 text-lg">Hello, {giver.name}! Scratch the card to reveal your match!</p>}
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

                    {isNameRevealed && (
                        <div className="mt-8 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 animate-fade-in max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">
                                {giver.name}'s Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                            </h2>
                            
                            <div className="space-y-6">
                                {(interestsAndLikes.length > 0) && (
                                    <div className="bg-slate-50 p-6 rounded-xl border">
                                        <h3 className="font-bold text-slate-700 text-lg mb-1 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>
                                            Interests, Hobbies & Likes
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas on Amazon!</p>
                                        <div className="flex flex-wrap gap-3">
                                            {interestsAndLikes.map((item, index) => (
                                                <a 
                                                    key={index}
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(item + ' gifts')}&tag=${affiliateTag}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-3 px-5 rounded-lg transition-transform transform hover:scale-105"
                                                >
                                                    <ShoppingCart size={16} />
                                                    {item}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {receiver.dislikes && (
                                    <div className="bg-red-50 p-6 rounded-xl border">
                                         <h3 className="font-bold text-slate-700 text-lg mb-2 flex items-center gap-2">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                             Dislikes & No-Go's
                                        </h3>
                                        <p className="text-slate-600">{receiver.dislikes}</p>
                                    </div>
                                )}

                                {receiver.links && (
                                     <div className="bg-emerald-50 p-6 rounded-xl border">
                                        <h3 className="font-bold text-slate-700 text-lg mb-2 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
                                            Specific Links
                                        </h3>
                                        <div className="text-slate-600 break-words space-y-2">{linkify(receiver.links)}</div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-6 text-center italic">
                                As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                            </p>
                        </div>
                    )}
                     <div className="mt-12 text-center">
                        <a href="/generator.html" className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg transition-colors">
                            Organize your own Secret Santa &rarr;
                        </a>
                    </div>
                </main>
                <Footer />
                <BackToTopButton />
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
             `}</style>
        </>
    );
};

export default ResultsPage;
