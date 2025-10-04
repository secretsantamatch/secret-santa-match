import React, { useState, useEffect, useMemo } from 'react';
// Fix: Corrected import paths for types and components.
import type { ExchangeData, Participant, Match, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import ShareButtons from './ShareButtons';
import CountdownTimer from './CountdownTimer';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

const getSeasonalTheme = (theme: string): string => {
    const validThemes = ['christmas', 'halloween', 'valentines', 'birthday', 'celebration'];
    if (validThemes.includes(theme)) {
        return theme;
    }
    const month = new Date().getMonth();
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentines';
    return 'christmas';
};

const ResultsPage: React.FC<{ data: ExchangeData, currentParticipantId: string | null }> = ({ data, currentParticipantId }) => {
    const { p: participants, m: matchesById, details, style, th: pageTheme, revealAt } = data;
    
    const [isRevealed, setIsRevealed] = useState(!revealAt || Date.now() > revealAt);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [siteTheme, setSiteTheme] = useState(() => getSeasonalTheme(pageTheme));
    
    useEffect(() => {
        document.documentElement.dataset.theme = siteTheme;
    }, [siteTheme]);
    
    const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p])), [participants]);
    
    const matches: Match[] = useMemo(() => matchesById.map(matchById => ({
        giver: participantMap.get(matchById.g)!,
        receiver: participantMap.get(matchById.r)!
    })).filter(m => m.giver && m.receiver), [matchesById, participantMap]);
    
    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [currentParticipantId, matches]);

    const handleRevealComplete = () => {
        setIsRevealed(true);
    };

    const performPdfGeneration = async (generationFn: () => Promise<void>) => {
        setIsPdfLoading(true);
        try {
            await generationFn();
        } catch (err) {
            console.error("PDF Generation failed:", err);
            alert("Sorry, something went wrong while generating the PDF. Please try again.");
        } finally {
            setIsPdfLoading(false);
        }
    };

    const handleDownloadCards = () => performPdfGeneration(async () => {
        const backgroundOptions: BackgroundOption[] = [{
            id: style.bgId,
            name: 'Custom',
            description: '',
            icon: '',
            imageUrl: style.bgImg || '',
            defaultTextColor: style.txtColor,
        }];

        await generateIndividualCardsPdf({
            matches,
            eventDetails: details,
            backgroundOptions,
            backgroundId: style.bgId,
            customBackground: style.bgImg,
            textColor: style.txtColor,
            useTextOutline: style.useOutline,
            outlineColor: style.outColor,
            outlineSize: style.outSize,
            fontSizeSetting: style.fontSize,
            fontTheme: style.font,
            lineSpacing: style.line,
            greetingText: style.greet,
            introText: style.intro,
            wishlistLabelText: style.wish,
        });
    });

    const handleDownloadList = () => performPdfGeneration(async () => {
        generateMasterListPdf({ 
            matches, 
            eventDetails: details,
            exchangeDate: revealAt ? new Date(revealAt).toISOString().split('T')[0] : undefined,
            exchangeTime: data.rt
        });
    });
    
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
    const handleCopyLink = (participantId: string) => {
        const url = `${window.location.origin}${window.location.pathname}#${window.location.hash.split('?')[0]}?id=${participantId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLinkId(participantId);
            setTimeout(() => setCopiedLinkId(null), 2000);
        });
    };

    const isOrganizer = !currentParticipantId;

    return (
        <div className="bg-slate-50 min-h-screen">
            <header className="text-center py-6">
                <a href="/" className="inline-block" aria-label="Go to homepage">
                    <div className="flex justify-center items-center gap-4 flex-col sm:flex-row">
                        <img src="/logo_64.png" alt="Santa hat logo" className="h-14 w-14" />
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Secret Santa Results</h1>
                        </div>
                    </div>
                </a>
            </header>
            
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl space-y-12">
                {currentMatch && (
                     <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Hello, {currentMatch.giver.name}!</h2>
                                <p className="text-gray-600 mt-2 text-lg">You are the Secret Santa for...</p>
                                <div className="my-4 p-4 bg-[var(--accent-lighter-bg)] rounded-lg text-center">
                                    <span className="text-4xl font-bold text-[var(--accent-dark-text)]">{currentMatch.receiver.name}</span>
                                </div>
                                {(currentMatch.receiver.notes || currentMatch.receiver.budget) && (
                                    <div className="text-left text-sm space-y-1 bg-slate-50 p-3 rounded-lg border">
                                        <p className="font-semibold text-gray-700">Their wishlist & notes:</p>
                                        {currentMatch.receiver.notes && <p className="text-gray-600">{currentMatch.receiver.notes}</p>}
                                        {currentMatch.receiver.budget && <p className="text-gray-600 font-medium">Suggested budget: ${currentMatch.receiver.budget}</p>}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-center font-semibold text-gray-700 mb-2">Card Preview</h3>
                                <PrintableCard
                                    match={currentMatch}
                                    eventDetails={details}
                                    backgroundId={style.bgId}
                                    backgroundImageUrl={style.bgImg}
                                    customBackground={style.bgImg}
                                    textColor={style.txtColor}
                                    useTextOutline={style.useOutline}
                                    outlineColor={style.outColor}
                                    outlineSize={style.outSize}
                                    fontSizeSetting={style.fontSize}
                                    fontTheme={style.font}
                                    lineSpacing={style.line}
                                    greetingText={style.greet}
                                    introText={style.intro}
                                    wishlistLabelText={style.wish}
                                    isNameRevealed={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {revealAt && !isRevealed && (
                    <div className="p-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl text-white text-center">
                        <h3 className="text-3xl font-bold font-serif mb-2">The Big Reveal!</h3>
                        <p className="text-slate-300 max-w-xl mx-auto mb-6 text-lg">The full list of who had who will be revealed after the exchange time. Come back to this page then to see all the matches!</p>
                        <CountdownTimer targetDate={revealAt} onComplete={handleRevealComplete} />
                    </div>
                )}
                
                {isRevealed && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-6 font-serif">Master List: Who Had Who?</h2>
                        <div className="max-w-4xl mx-auto overflow-x-auto">
                            <div className="grid grid-cols-2 gap-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-wider px-4 pb-2 border-b">
                                <div className="col-span-1">Secret Santa (Giver)</div>
                                <div className="col-span-1">Was Giving To (Receiver)</div>
                            </div>
                            <div className="divide-y">
                                {matches.map((match) => (
                                    <div key={match.giver.id} className="grid grid-cols-2 gap-4 items-center p-4">
                                        <div className="col-span-1 font-semibold text-slate-800">{match.giver.name}</div>
                                        <div className="col-span-1 font-semibold text-[var(--primary-text)]">{match.receiver.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {isOrganizer && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-6 font-serif">Organizer Hub</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-lg border">
                                <h3 className="font-bold text-lg text-slate-800 mb-3">Distribute Private Links</h3>
                                <p className="text-sm text-gray-600 mb-4">Copy and send each person their unique link. They will only see their own assignment until the reveal time (if set).</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {participants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                                            <span className="font-medium text-gray-700">{p.name}</span>
                                            <button onClick={() => handleCopyLink(p.id)} className={`text-sm font-semibold py-1 px-3 rounded-full transition-colors ${copiedLinkId === p.id ? 'bg-green-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
                                                {copiedLinkId === p.id ? 'Copied!' : 'Copy Link'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="bg-slate-50 p-6 rounded-lg border text-center">
                                <h3 className="font-bold text-lg text-slate-800 mb-3">Downloads & Sharing</h3>
                                <p className="text-sm text-gray-600 mb-4">You can also download printable cards for an in-person drawing or a master list for yourself.</p>
                                <div className="space-y-3">
                                    <button onClick={handleDownloadCards} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Individual Cards</button>
                                    <button onClick={handleDownloadList} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Master List</button>
                                </div>
                                <div className="mt-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Share this generator:</p>
                                    <ShareButtons participantCount={participants.length} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="text-center pt-4">
                    <a href="/" className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                        Start a New Game
                    </a>
                </div>
            </main>

            <FaqSection />
            <BlogPromo />
            <Footer theme={siteTheme} setTheme={setSiteTheme} />
            <BackToTopButton />
            
            {isPdfLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
                    <div className="text-white text-center">
                        <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsPage;
