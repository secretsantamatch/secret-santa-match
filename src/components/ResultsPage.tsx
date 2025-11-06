import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import Header from './Header';
import Footer from './Footer';
import { trackEvent } from '../services/analyticsService';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const fullMatches = useMemo((): Match[] => {
        const participantMap = new Map(data.p.map(p => [p.id, p]));
        return data.matches.map(m => {
            const giver = participantMap.get(m.g);
            const receiver = participantMap.get(m.r);
            if (!giver || !receiver) return null;
            return { giver, receiver };
        }).filter((m): m is Match => m !== null);
    }, [data.matches, data.p]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return fullMatches.find(m => m.giver.id === currentParticipantId) || null;
    }, [fullMatches, currentParticipantId]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        trackEvent('reveal_match', { theme: data.bgId });
    };

    const handleDownloadAllCards = () => {
        trackEvent('download_all_cards');
        generateIndividualCardsPdf({
            matches: fullMatches,
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
        trackEvent('download_master_list');
        generateMasterListPdf({
            matches: fullMatches,
            eventDetails: data.eventDetails,
            exchangeDate: data.exchangeDate,
            exchangeTime: data.exchangeTime
        });
    };

    const splitKeywords = (text: string) => {
        return text.split(',').map(s => s.trim()).filter(Boolean);
    };

    const createAmazonLink = (keyword: string) => {
        return `https://www.amazon.com/s?k=${encodeURIComponent(keyword + ' gifts')}&tag=${affiliateTag}`;
    };
    
    // Participant's view
    if (currentMatch) {
        const { giver, receiver } = currentMatch;
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                 <div className="w-full max-w-sm">
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
                        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 w-full max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold font-serif text-slate-800 text-center mb-6">
                                {giver.name}'s Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="text-indigo-500"></span>Interests, Hobbies & Likes</h3>
                                    <p className="text-xs text-slate-500 mb-2">Click a tag for instant gift ideas on Amazon!</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[...splitKeywords(receiver.interests), ...splitKeywords(receiver.likes)].map(keyword => (
                                            <a key={keyword} href={createAmazonLink(keyword)} target="_blank" rel="noopener noreferrer" className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors">
                                                {keyword}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                {receiver.dislikes && (
                                     <div>
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="text-red-500"></span>Dislikes & No-Go's</h3>
                                        <div className="bg-slate-50 p-3 rounded-lg mt-2 text-slate-600 text-sm">{receiver.dislikes}</div>
                                    </div>
                                )}
                                {receiver.links && (
                                    <div>
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="text-green-500"></span>Specific Links</h3>
                                        <div className="bg-slate-50 p-3 rounded-lg mt-2 text-slate-600 text-sm space-y-2">
                                            {receiver.links.split('\n').map((link, i) => (
                                                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">{link}</a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-6 text-center italic">
                                As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                            </p>
                        </div>
                    )}
                    <div className="text-center mt-6">
                        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = window.location.pathname; }} className="text-slate-600 hover:text-slate-800 font-semibold text-sm">
                            Organize your own Secret Santa &rarr;
                        </a>
                    </div>
                </div>
            </div>
        );
    }
    
    // Organizer's view
    return (
        <>
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-2xl text-center">
                    <div className="inline-block bg-white/20 p-3 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif">You're the Organizer!</h1>
                    <p className="text-lg opacity-90 mt-4 max-w-3xl mx-auto">
                        Your matches are ready. You can now share private links with each person, or download/print the cards for your party.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button 
                            onClick={() => setShowShareModal(true)}
                            className="bg-white hover:bg-slate-200 text-indigo-700 font-bold py-3 px-8 rounded-full text-lg transition-colors shadow-lg"
                        >
                            Sharing & Downloads
                        </button>
                         <button 
                            onClick={() => { /* Implement Shuffle Logic */ window.location.reload(); }}
                            className="bg-white/30 hover:bg-white/40 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
                        >
                           <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707-1.707A1 1 0 00.879 11.293l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 00-1.414-1.414L7.95 9.879L6.243 11.586V8a4 4 0 118 0v3.586l-1.707-1.707A1 1 0 0011.121 11.293l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 00-1.414-1.414L16.243 11.586V8a6 6 0 00-6-6z" /></svg>
                                Shuffle Again
                           </span>
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
            {showShareModal && (
                <ShareLinksModal
                    participantLinks={fullMatches.map(m => ({
                        id: m.giver.id,
                        name: m.giver.name,
                        link: `${window.location.href.split('#')[0]}#${window.location.hash.slice(1).split('?')[0]}?id=${m.giver.id}`
                    }))}
                    onClose={() => setShowShareModal(false)}
                    onDownloadAllCards={handleDownloadAllCards}
                    onDownloadMasterList={handleDownloadMasterList}
                />
            )}
        </>
    );
};

export default ResultsPage;
