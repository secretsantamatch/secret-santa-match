import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import { generatePdf } from '../services/pdfService';
import { getGiftPersona } from '../services/personaService';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { ArrowLeft, Gift, Share2, Download, Search, Sparkles } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';


interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const GiftIdeas: React.FC<{ participant: Participant, budget: string }> = ({ participant, budget }) => {
    const [giftIdeas, setGiftIdeas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const persona = useMemo(() => getGiftPersona(participant), [participant]);

    const generateGiftIdeas = async () => {
        setIsLoading(true);
        setError(null);
        trackEvent('generate_gift_ideas', { persona: persona.name });
        try {
            // FIX: Initialize GoogleGenAI with API key from environment variables.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Generate 5 creative and thoughtful gift ideas for a Secret Santa exchange.
                The recipient is described as: "${persona.name} - ${persona.description}".
                Their specific interests are: ${participant.interests || 'none specified'}.
                They like: ${participant.likes || 'none specified'}.
                They dislike: ${participant.dislikes || 'none specified'}.
                The suggested budget is around $${budget || '25'}.

                List only the gift ideas, one per line, without any extra formatting or numbering. Be specific.
                For example:
                A gourmet coffee tasting set from a local roaster
                A subscription to a popular book club box
                A high-quality, plush throw blanket
            `;
            // FIX: Use ai.models.generateContent to generate content from the model.
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            // FIX: Extract text directly from the response object.
            const ideas = response.text.trim().split('\n').filter(idea => idea.trim() !== '');
            setGiftIdeas(ideas);
        } catch (e) {
            console.error("Error generating gift ideas:", e);
            setError("Could not generate AI gift ideas. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 bg-slate-50 p-6 rounded-2xl border">
            <h3 className="text-xl font-bold text-slate-700 text-center mb-2">Need Gift Inspiration?</h3>
            <p className="text-center text-slate-500 mb-4 text-sm">Based on their interests, they seem to be a <strong>{persona.name}</strong>. Here are some AI-powered ideas to get you started!</p>
            
            {giftIdeas.length > 0 && (
                 <ul className="space-y-3 list-disc list-inside text-slate-700 bg-white p-4 rounded-lg border">
                    {giftIdeas.map((idea, index) => (
                        <li key={index}>{idea}</li>
                    ))}
                </ul>
            )}

            {error && <p className="text-center text-red-600 mt-4">{error}</p>}
            
            <div className="text-center mt-6">
                <button
                    onClick={generateGiftIdeas}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                       <> <Sparkles size={20} /> Generate AI Gift Ideas</>
                    )}
                </button>
            </div>
        </div>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const { matches: matchIds, p: participants } = data;
    const [showShareModal, setShowShareModal] = useState(false);
    const [pdfProgress, setPdfProgress] = useState<number | null>(null);

    // Reconstruct full match objects from IDs
    const matches: Match[] = useMemo(() => {
        return matchIds.map(m => ({
            giver: participants.find(p => p.id === m.g)!,
            receiver: participants.find(p => p.id === m.r)!,
        })).filter(m => m.giver && m.receiver);
    }, [matchIds, participants]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [matches, currentParticipantId]);

    const [isNameRevealed, setIsNameRevealed] = useState(!currentMatch); // Revealed for organizer, not for participant initially

    useEffect(() => {
        if (currentMatch) {
            trackEvent('view_participant_card');
        } else {
            trackEvent('view_organizer_results');
        }
    }, [currentMatch]);

    const handleReveal = () => {
        if (!isNameRevealed) {
            setIsNameRevealed(true);
            trackEvent('reveal_name');
        }
    };
    
    const handleGeneratePdf = async () => {
        setPdfProgress(0);
        trackEvent('click_download_pdf');
        await generatePdf(matches, setPdfProgress);
        setTimeout(() => setPdfProgress(null), 2000); // Hide progress bar after a delay
    };

    const isOrganizer = !currentParticipantId;

    if (!isOrganizer && !currentMatch) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                    <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Error</h1>
                    <p className="text-slate-700 text-lg">We couldn't find your match. Please check the link or contact the organizer.</p>
                    <a href="/generator.html" className="mt-8 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                        Start a New Game
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen py-12 px-4">
                <div className="container mx-auto max-w-5xl">
                    {isOrganizer ? (
                        // Organizer View
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                            <a href="/generator.html" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold mb-6">
                                <ArrowLeft size={16} /> Back to Generator
                            </a>
                            <div className="text-center mb-8">
                                <Gift className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                <h1 className="text-4xl font-bold font-serif text-slate-800">Your Exchange is Ready!</h1>
                                <p className="text-lg text-slate-600 mt-2">Here is the master list of all matches. Share the private links with each person.</p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-4 mb-10">
                                <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors">
                                    <Share2 size={20} /> Share Links
                                </button>
                                <button onClick={handleGeneratePdf} disabled={pdfProgress !== null} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50">
                                    <Download size={20} /> Download Cards
                                </button>
                            </div>

                            {pdfProgress !== null && (
                                <div className="mb-8">
                                    <p className="text-center font-semibold text-emerald-700 mb-2">Generating PDF...</p>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${pdfProgress * 100}%`, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>
                            )}
                            
                            <ResultsDisplay matches={matches} />
                            
                            {/* Hidden cards for PDF generation */}
                            <div className="absolute -left-[9999px] top-0">
                                {matches.map(match => (
                                    <div key={match.giver.id} style={{ width: '400px' }}>
                                         <PrintableCard
                                            match={match}
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Participant View
                        <div>
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold font-serif text-slate-800">Your Secret Santa Match!</h1>
                                {!isNameRevealed && <p className="text-lg text-slate-600 mt-2">Click on the card below to reveal who you're buying for.</p>}
                            </div>
                            <PrintableCard
                                match={currentMatch!}
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
                                onReveal={handleReveal}
                            />
                            {isNameRevealed && (
                                <>
                                    <GiftIdeas participant={currentMatch!.receiver} budget={currentMatch!.receiver.budget || data.eventDetails.match(/\$?(\d+)/)?.[1] || '25'} />
                                    <div className="mt-8 text-center">
                                        <a href={`https://www.amazon.com/s?k=${encodeURIComponent('gifts for ' + currentMatch!.receiver.interests.split(',')[0])}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-6 rounded-full transition-colors">
                                            <Search size={20} /> Search for Gifts on Amazon
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            {showShareModal && isOrganizer && (
                <ShareLinksModal
                    matches={matches}
                    exchangeData={data}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
    );
};

export default ResultsPage;
