import React, { useState, useEffect, useMemo } from 'react';
import { produce } from 'immer';
import type { ExchangeData, Match, Participant } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import WishlistEditorModal from './WishlistEditorModal'; // New component
import { trackEvent } from '../services/analyticsService';
import { Share2, Download, Eye, Home, Edit } from 'lucide-react';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [exchangeData, setExchangeData] = useState<ExchangeData>(data);
    const { p: participants, matches: matchIds, ...styleData } = exchangeData;
    const isOrganizerView = !currentParticipantId;

    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isWishlistEditorOpen, setIsWishlistEditorOpen] = useState(false);

    const allMatches: Match[] = useMemo(() => matchIds.map(m => ({
        giver: participants.find(p => p.id === m.g)!,
        receiver: participants.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [matchIds, participants]);

    const loggedInParticipant = useMemo(() => {
        return participants.find(p => p.id === currentParticipantId);
    }, [currentParticipantId, participants]);

    useEffect(() => {
        if (isOrganizerView) {
            setIsNameRevealed(true);
        } else {
            const match = allMatches.find(m => m.giver.id === currentParticipantId);
            setCurrentMatch(match || null);
        }
    }, [currentParticipantId, allMatches, isOrganizerView]);
    
     useEffect(() => {
        // This effect ensures that if the data prop changes (e.g., from an external refresh),
        // the component's internal state is updated.
        setExchangeData(data);
    }, [data]);

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

    const handleSaveWishlist = (updatedParticipant: Participant) => {
        // Optimistically update the UI for a snappy user experience
        const nextState = produce(exchangeData, draft => {
            const pIndex = draft.p.findIndex(p => p.id === updatedParticipant.id);
            if (pIndex !== -1) {
                draft.p[pIndex] = updatedParticipant;
            }
        });
        setExchangeData(nextState);
        trackEvent('wishlist_updated');
    };

    const renderParticipantView = () => {
        if (!currentMatch || !loggedInParticipant) {
            return (
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border">
                    <h2 className="text-2xl font-bold text-red-600">Participant Not Found</h2>
                    <p className="text-slate-600 mt-2">We couldn't find a match for this link. Please check the URL or contact your organizer.</p>
                </div>
            );
        }
        return (
            <div className="space-y-8">
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
                    />
                    {!isNameRevealed && (
                        <div className="text-center mt-6">
                            <button onClick={handleReveal} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                                Click to Reveal Your Person!
                            </button>
                        </div>
                    )}
                </div>
                
                {isNameRevealed && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 text-center mb-4">My Wishlist</h3>
                        <p className="text-center text-slate-500 text-sm mb-4">Your Secret Santa will see this information. You can update it anytime!</p>
                        <div className="text-left text-sm space-y-2 bg-slate-50 p-4 rounded-lg">
                           <p><strong>Interests:</strong> {loggedInParticipant.interests || 'N/A'}</p>
                           <p><strong>Likes:</strong> {loggedInParticipant.likes || 'N/A'}</p>
                           <p><strong>Dislikes:</strong> {loggedInParticipant.dislikes || 'N/A'}</p>
                           <p><strong>Links:</strong> {loggedInParticipant.links || 'N/A'}</p>
                           <p><strong>Budget:</strong> {loggedInParticipant.budget || 'N/A'}</p>
                        </div>
                        <div className="text-center mt-4">
                            <button onClick={() => setIsWishlistEditorOpen(true)} className="flex items-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                                <Edit size={16} /> Edit My Wishlist
                            </button>
                        </div>
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
            {showShareModal && isOrganizerView && (
                <ShareLinksModal exchangeData={exchangeData} onClose={() => setShowShareModal(false)} />
            )}
            {isWishlistEditorOpen && loggedInParticipant && exchangeData.id && (
                <WishlistEditorModal
                    participant={loggedInParticipant}
                    exchangeId={exchangeData.id}
                    onClose={() => setIsWishlistEditorOpen(false)}
                    onSave={handleSaveWishlist}
                />
            )}
        </>
    );
};

export default ResultsPage;