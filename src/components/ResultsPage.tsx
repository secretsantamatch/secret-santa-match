import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import ResultsDisplay from './ResultsDisplay';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import { trackEvent } from '../services/analyticsService';
import { generateMatches } from '../services/matchService';

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [currentData, setCurrentData] = useState(data);
    // FIX: Add state for URL shortening feature to pass to the ShareLinksModal.
    const [useShortenedUrls, setUseShortenedUrls] = useState(false);
    const [shortenedUrlCache, setShortenedUrlCache] = useState<Record<string, string>>({});
    const [isShortening, setIsShortening] = useState(false);

    const { matches, participants, cardStyleData, eventDetails } = useMemo(() => {
        const participantMap = new Map(currentData.p.map(p => [p.id, p]));
        const reconstructedMatches: Match[] = currentData.matches
            .map(m => ({
                giver: participantMap.get(m.g),
                receiver: participantMap.get(m.r),
            }))
            .filter(m => m.giver && m.receiver) as Match[];

        const cardStyles = {
            bgId: currentData.bgId,
            bgImg: currentData.customBackground,
            txtColor: currentData.textColor,
            outline: currentData.useTextOutline,
            outColor: currentData.outlineColor,
            outSize: currentData.outlineSize,
            fontSize: currentData.fontSizeSetting,
            font: currentData.fontTheme,
            line: currentData.lineSpacing,
            greet: currentData.greetingText,
            intro: currentData.introText,
            wish: currentData.wishlistLabelText,
            backgroundOptions: currentData.backgroundOptions,
            eventDetails: currentData.eventDetails,
        };

        return {
            matches: reconstructedMatches,
            participants: currentData.p,
            cardStyleData: cardStyles,
            eventDetails: currentData.eventDetails,
        };
    }, [currentData]);
    
    const isOrganizerView = !currentParticipantId;
    const currentMatch = useMemo(() => {
        if (isOrganizerView) return null;
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [matches, currentParticipantId, isOrganizerView]);

    useEffect(() => {
        if (currentMatch) {
            setIsNameRevealed(false);
        }
    }, [currentMatch]);

    // FIX: Add effect to handle URL shortening logic when enabled.
    useEffect(() => {
        if (useShortenedUrls && isOrganizerView) {
            const shortenUrls = async () => {
                const urlsToShorten = participants
                    .map(p => {
                        const longUrl = `${window.location.href.split('#')[0]}${window.location.hash}?id=${p.id}`;
                        return { longUrl, needsShortening: !shortenedUrlCache[longUrl] };
                    })
                    .filter(item => item.needsShortening)
                    .map(item => item.longUrl);

                if (urlsToShorten.length > 0) {
                    setIsShortening(true);
                    // This is a mock of a URL shortening service. In a real app, this would be an API call.
                    // We'll simulate a delay and generate fake short URLs.
                    setTimeout(() => {
                        const newCacheEntries = urlsToShorten.reduce((acc, longUrl) => {
                            const fakeShortId = Math.random().toString(36).substring(2, 8);
                            acc[longUrl] = `https://tinyurl.com/${fakeShortId}`;
                            return acc;
                        }, {} as Record<string, string>);

                        setShortenedUrlCache(prevCache => ({ ...prevCache, ...newCacheEntries }));
                        setIsShortening(false);
                    }, 500);
                }
            };
            shortenUrls();
        }
    }, [useShortenedUrls, participants, isOrganizerView, shortenedUrlCache]);

    const handleShuffleAgain = () => {
        if (!window.confirm("Are you sure you want to shuffle again? This will create a new set of matches.")) return;
        
        trackEvent('shuffle_again');
        const { p, exclusions, assignments } = currentData;
        const result = generateMatches(p, exclusions, assignments);
        if (result.matches) {
            const newMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
            const newData = { ...currentData, matches: newMatches };
            
            // This is a temporary client-side update. In a full backend implementation,
            // this would re-encode and update the URL.
            setCurrentData(newData); 
            
            alert("Matches have been shuffled! The page has been updated for your view. Note: The URL has not changed, so a refresh will revert to the original matches.");
        } else {
            alert(`Could not shuffle again: ${result.error}`);
        }
    };

    const handleDownloadAllCards = async () => {
        trackEvent('download_all_cards');
        await generateIndividualCardsPdf({ ...cardStyleData, matches });
    };

    const handleDownloadMasterList = () => {
        trackEvent('download_master_list');
        generateMasterListPdf({ matches, eventDetails });
    };

    const handleReveal = () => {
        trackEvent('reveal_match');
        setIsNameRevealed(true);
    };

    const renderOrganizerView = () => {
        return (
            <div className="space-y-10">
                <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-2xl text-center">
                     <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif">You're the Organizer!</h1>
                    <p className="text-lg text-indigo-200 mt-4 max-w-2xl mx-auto">
                        Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <button onClick={() => setShowShareModal(true)} className="bg-white hover:bg-slate-100 text-indigo-700 font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all">
                            Sharing &amp; Downloads
                        </button>
                        <button onClick={handleShuffleAgain} className="bg-white/20 hover:bg-white/30 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                             Shuffle Again
                        </button>
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-6">Master List</h2>
                    <ResultsDisplay matches={matches} />
                </div>
            </div>
        );
    };
    
    const renderParticipantView = () => {
        if (!currentMatch) {
            return (
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border">
                    <h2 className="text-2xl font-bold text-red-700">Oops!</h2>
                    <p className="text-slate-600 mt-2">We couldn't find your match. Please check the link or contact the organizer.</p>
                </div>
            );
        }

        const { receiver } = currentMatch;
        const interests = (receiver.interests || '').split(',').map(s => s.trim()).filter(Boolean);
        const likes = (receiver.likes || '').split(',').map(s => s.trim()).filter(Boolean);

        return (
            <div className="space-y-10">
                <div className="text-center">
                    <PrintableCard
                        match={currentMatch}
                        isNameRevealed={isNameRevealed}
                        onReveal={handleReveal}
                        {...cardStyleData}
                    />
                </div>
                
                {isNameRevealed && (
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
                            Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                        </h2>
                        <div className="space-y-6 max-w-2xl mx-auto">
                           {(interests.length > 0 || likes.length > 0) && (
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.125L5 18V4z" /></svg>Interests, Hobbies & Likes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[...interests, ...likes].map((item, i) => (
                                             <a key={i} href={`https://www.amazon.com/s?k=${encodeURIComponent(item + ' gifts')}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full transition-colors">
                                                {item}
                                             </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {receiver.dislikes && (
                                 <div>
                                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>Dislikes & No-Go's</h3>
                                    <p className="text-slate-600 bg-slate-50 p-3 rounded-md border text-sm">{receiver.dislikes}</p>
                                </div>
                            )}
                            
                             {receiver.links && (
                                <div>
                                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>Specific Links</h3>
                                     <div className="space-y-2">
                                        {receiver.links.split('\n').map((link, i) => {
                                           if (!link.trim()) return null;
                                           return (
                                            <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate bg-slate-50 p-3 rounded-md border text-sm">{link}</a>
                                           )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-6 px-4">As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Header />
            <div className="bg-slate-50">
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl my-10">
                    {isOrganizerView ? renderOrganizerView() : renderParticipantView()}
                </main>
                <Footer />
            </div>
            {showShareModal && isOrganizerView && (
                <ShareLinksModal
                    participants={participants}
                    onClose={() => setShowShareModal(false)}
                    onDownloadMasterList={handleDownloadMasterList}
                    onDownloadAllCards={handleDownloadAllCards}
                    // FIX: Pass required props for URL shortening feature.
                    useShortenedUrls={useShortenedUrls}
                    setUseShortenedUrls={setUseShortenedUrls}
                    shortenedUrlCache={shortenedUrlCache}
                    isShortening={isShortening}
                />
            )}
        </>
    );
};

export default ResultsPage;
