import React, { useState, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { Share2, Download, Eye, Home } from 'lucide-react';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { p: participants, matches: matchIds, ...styleData } = data;
    const isOrganizerView = !currentParticipantId;

    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    const allMatches: Match[] = matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver);

    useEffect(() => {
        if (isOrganizerView) {
            setIsNameRevealed(true);
        } else {
            const match = allMatches.find(m => m.giver.id === currentParticipantId);
            setCurrentMatch(match || null);
        }
    }, [currentParticipantId, allMatches, isOrganizerView]);

    const handleReveal = () => {
        setIsNameRevealed(true);
        if (currentMatch) {
            trackEvent('reveal_name', { participant: currentMatch.giver.name });
        }
    };
    
    const handleStartOver = () => {
        trackEvent('click_start_over', { from: 'results_page' });
        window.location.href = '/generator.html';
    };

    const renderParticipantView = () => {
        if (!currentMatch) {
            return (
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border">
                    <h2 className="text-2xl font-bold text-red-600">Participant Not Found</h2>
                    <p className="text-slate-600 mt-2">We couldn't find a match for this link. Please check the URL or contact your organizer.</p>
                </div>
            );
        }
        return (
            <div className="max-w-md mx-auto">
                <PrintableCard
                    match={currentMatch}
                    eventDetails={styleData.eventDetails}
                    isNameRevealed={isNameRevealed}
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
                    onReveal={handleReveal}
                />
                {!isNameRevealed && (
                    <div className="text-center mt-6">
                        <button onClick={handleReveal} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                            Click to Reveal Your Person!
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderOrganizerView = () => (
        <>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-slate-800 font-serif">Organizer's Master List</h1>
                <p className="text-lg text-slate-600 mt-2">Here are all the generated matches. Keep this page safe!</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 mb-8 flex flex-col md:flex-row gap-4 justify-center items-center">
                <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md">
                    <Share2 size={20} /> Share Links & Download
                </button>
                <a href="#master-list" className="flex items-center gap-2 bg-white hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors border">
                    <Eye size={20} /> View All Matches
                </a>
            </div>
            <div id="master-list">
                <ResultsDisplay matches={allMatches} />
            </div>
        </>
    );

    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen py-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    {isOrganizerView ? renderOrganizerView() : renderParticipantView()}
                    <div className="text-center mt-12 pt-8 border-t border-slate-200">
                        <button onClick={handleStartOver} className="text-slate-500 hover:text-red-600 font-semibold flex items-center gap-2 mx-auto">
                            <Home size={18} /> Start a New Game
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
            {showShareModal && isOrganizerView && (
                <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />
            )}
        </>
    );
};

export default ResultsPage;
