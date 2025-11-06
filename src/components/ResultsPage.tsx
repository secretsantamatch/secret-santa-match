import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import Header from './Header';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import { generateMasterListPdf, generateIndividualCardsPdf } from '../services/pdfService';
import { Check, Copy, MessageSquare, Shuffle, SlidersHorizontal, Download } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

const ResultsPage: React.FC<{ data: ExchangeData; currentParticipantId: string | null }> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(!currentParticipantId);
    const [showShareModal, setShowShareModal] = useState(false);
    const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sentStatus, setSentStatus] = useState<Set<string>>(new Set());
    const [useShortLinks, setUseShortLinks] = useState(false);
    const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const allMatches = useMemo((): Match[] => {
        const participantMap = new Map<string, Participant>(data.p.map(p => [p.id, p]));
        return data.matches
            .map(m => {
                const giver = participantMap.get(m.g);
                const receiver = participantMap.get(m.r);
                if (giver && receiver) {
                    return { giver, receiver };
                }
                return null;
            })
            .filter((m): m is Match => m !== null);
    }, [data.matches, data.p]);

    const participantGivers = useMemo(() => allMatches.map(m => m.giver), [allMatches]);

    useEffect(() => {
        setFilteredParticipants(
            participantGivers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, participantGivers]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return allMatches.find(m => m.giver.id === currentParticipantId);
    }, [allMatches, currentParticipantId]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_match');
    };

    const handleShuffle = () => {
        // This is a placeholder for a more complex shuffle implementation
        // For now, it reloads the generator page to start over
        window.location.href = window.location.pathname;
    };

    const toggleSentStatus = (id: string) => {
        setSentStatus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const getShareableLink = (participantId: string): string => {
        const baseUrl = window.location.href.split('#')[0];
        const hash = window.location.hash;
        return `${baseUrl}${hash}?id=${participantId}`;
    };

    const handleCopy = async (participantId: string) => {
        let linkToCopy = getShareableLink(participantId);
        if (useShortLinks) {
            if (shortLinks[participantId]) {
                linkToCopy = shortLinks[participantId];
            } else {
                // This part is simplified; a real implementation would show a loading state
                try {
                    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(linkToCopy)}`);
                    const shortUrl = await response.text();
                    if (response.ok) {
                        setShortLinks(prev => ({...prev, [participantId]: shortUrl}));
                        linkToCopy = shortUrl;
                    }
                } catch (e) {
                    console.error("Failed to shorten URL", e);
                }
            }
        }
        
        navigator.clipboard.writeText(linkToCopy).then(() => {
            setCopiedId(participantId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };
    
    const handleDownloadMasterList = () => {
        trackEvent('download_master_list');
        generateMasterListPdf({ matches: allMatches, eventDetails: data.eventDetails, exchangeDate: data.exchangeDate, exchangeTime: data.exchangeTime });
    };

    const handleDownloadAllCards = () => {
        trackEvent('download_all_cards');
        generateIndividualCardsPdf({ matches: allMatches, ...cardProps });
    };


    const cardProps = {
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
    };
    
    const handleStartNew = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = window.location.pathname;
    };

    if (currentParticipantId && !currentMatch) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                    <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Oops!</h1>
                    <p className="text-slate-700 text-lg">We couldn't find your match. This link might be incorrect or the game may have been updated.</p>
                    <a href="/" onClick={handleStartNew} className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                        Start a New Game
                    </a>
                </div>
            </div>
        );
    }
    
    const splitAndFilter = (text: string) => text.split(',').map(s => s.trim()).filter(Boolean);


    return (
        <div className="bg-slate-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
                {currentMatch ? (
                    // PARTICIPANT VIEW
                    <div className="space-y-12">
                         <div className="text-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">Your Secret Santa Match!</h1>
                             <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">
                                {isNameRevealed ? "Here's who you're getting a gift for. Shhh, it's a secret!" : "Scratch the card below to reveal your person!"}
                            </p>
                        </div>

                        <div className="max-w-sm mx-auto">
                           <PrintableCard
                                match={currentMatch}
                                isNameRevealed={isNameRevealed}
                                onReveal={handleReveal}
                                {...cardProps}
                            />
                        </div>
                        
                        {isNameRevealed && (
                             <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                                <h2 className="text-3xl font-bold text-slate-800 font-serif text-center mb-8">
                                    Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                                </h2>
                                <div className="space-y-6">
                                    {currentMatch.receiver.interests && (
                                        <div>
                                            <h3 className="font-bold text-slate-600 mb-2">Interests & Hobbies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {splitAndFilter(currentMatch.receiver.interests).map((interest, i) => (
                                                    <a key={i} href={`https://www.amazon.com/s?k=${encodeURIComponent(interest + ' gifts')}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
                                                        {interest}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {currentMatch.receiver.likes && (
                                         <div>
                                            <h3 className="font-bold text-slate-600 mb-2">Likes</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {splitAndFilter(currentMatch.receiver.likes).map((like, i) => (
                                                     <a key={i} href={`https://www.amazon.com/s?k=${encodeURIComponent(like)}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors">
                                                        {like}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                     {currentMatch.receiver.dislikes && (
                                        <div>
                                            <h3 className="font-bold text-slate-600 mb-2">Dislikes & No-Go's</h3>
                                            <p className="text-slate-700 bg-slate-50 p-3 rounded-md border text-sm">{currentMatch.receiver.dislikes}</p>
                                        </div>
                                    )}
                                    {currentMatch.receiver.links && (
                                        <div>
                                            <h3 className="font-bold text-slate-600 mb-2">Specific Links</h3>
                                            <div className="space-y-2 text-sm">
                                                {currentMatch.receiver.links.split('\n').map((link, i) => (
                                                    link.trim() && <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-indigo-600 hover:underline truncate">{link}</a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                 <p className="text-center text-xs text-slate-400 mt-8">
                                    As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                                </p>
                            </div>
                        )}
                        
                        <div className="text-center">
                            <a href="/" onClick={handleStartNew} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                Want to start your own game? Click here!
                            </a>
                        </div>

                    </div>
                ) : (
                    // ORGANIZER VIEW
                    <div className="space-y-8">
                        <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-xl text-center">
                            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                               <Check size={40} />
                            </div>
                            <h1 className="text-4xl font-bold font-serif">You're the Organizer!</h1>
                            <p className="mt-2 max-w-2xl mx-auto opacity-90">Your matches are ready. You can now share private links with each person, or download/print the cards for your party.</p>
                            <div className="mt-8 flex justify-center gap-4">
                                <button onClick={() => setShowShareModal(true)} className="bg-white text-indigo-700 font-bold py-3 px-6 rounded-full shadow-md transform hover:scale-105 transition-all">
                                    Sharing & Downloads
                                </button>
                                <button onClick={handleShuffle} className="bg-white/20 hover:bg-white/30 font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2">
                                    <Shuffle size={18} /> Shuffle Again
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 font-serif">Organizer's Dashboard</h2>
                                <div className="flex items-center gap-3">
                                    <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Shorten Links</label>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" id="shorten-toggle" checked={useShortLinks} onChange={() => setUseShortLinks(!useShortLinks)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                        <label htmlFor="shorten-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative mb-4">
                                <input
                                    type="search"
                                    placeholder="Search for a participant..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                                <svg className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            <p className="text-sm text-slate-500 mb-4">Managing links for {participantGivers.length} participants</p>

                            <div className="space-y-3">
                                {filteredParticipants.map(participant => (
                                    <div key={participant.id} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                                        <input type="checkbox" checked={sentStatus.has(participant.id)} onChange={() => toggleSentStatus(participant.id)} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                        <span className={`font-semibold flex-grow ${sentStatus.has(participant.id) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{participant.name}</span>
                                        <div className="flex gap-2 ml-auto">
                                            <a href={`sms:?&body=Hey ${participant.name}, here is your private Secret Santa link! ${encodeURIComponent(getShareableLink(participant.id))}`} className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold py-2 px-3 rounded-md transition-colors">
                                                <MessageSquare size={14} /> SMS
                                            </a>
                                            <button onClick={() => handleCopy(participant.id)} className={`flex items-center gap-1.5 w-28 justify-center text-sm font-semibold py-2 px-3 rounded-md transition-colors ${copiedId === participant.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-800 text-white'}`}>
                                                {copiedId === participant.id ? <Check size={16}/> : <Copy size={14}/>}
                                                {copiedId === participant.id ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <a href="/" onClick={handleStartNew} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                Start a New Game
                            </a>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
            <BackToTopButton />

            {showShareModal && (
                <ShareLinksModal
                    matches={allMatches}
                    onClose={() => setShowShareModal(false)}
                    onDownloadMasterList={handleDownloadMasterList}
                    onDownloadAllCards={handleDownloadAllCards}
                />
            )}
            <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
                .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
            `}</style>
        </div>
    );
};

export default ResultsPage;
