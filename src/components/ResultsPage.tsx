import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, BackgroundOption } from '../types';
import PrintableCard from './PrintableCard';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import CountdownTimer from './CountdownTimer';
import ShareButtons from './ShareButtons';

interface ResultsPageProps {
    data: ExchangeData;
    currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [isNameRevealed, setIsNameRevealed] = useState(false);
    const [isRevealedGlobally, setIsRevealedGlobally] = useState(data.revealAt ? Date.now() > data.revealAt : true);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);

    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(data => setBackgroundOptions(data))
            .catch(err => console.error("Could not load templates", err));
    }, []);

    const participantMap = useMemo(() => new Map(data.p.map(p => [p.id, p])), [data.p]);
    const matches: Match[] = useMemo(() => data.m.map(m => ({
        giver: participantMap.get(m.g)!,
        receiver: participantMap.get(m.r)!,
    })).filter(m => m.giver && m.receiver), [data.m, participantMap]);

    const currentMatch = useMemo(() => {
        if (!currentParticipantId) return null;
        return matches.find(m => m.giver.id === currentParticipantId) || null;
    }, [matches, currentParticipantId]);
    
    const selectedTheme = useMemo(() => {
        return backgroundOptions.find(opt => opt.id === data.style.bgId);
    }, [backgroundOptions, data.style.bgId]);

    const handleRevealComplete = () => {
        setIsRevealedGlobally(true);
    };
    
    const handleDownload = async (type: 'card' | 'list') => {
        setIsPdfLoading(true);
        try {
            if (type === 'card' && currentMatch) {
                await generateIndividualCardsPdf({
                    matches: [currentMatch],
                    eventDetails: data.details,
                    backgroundOptions: backgroundOptions,
                    backgroundId: data.style.bgId,
                    customBackground: data.style.bgImg,
                    textColor: data.style.txtColor,
                    useTextOutline: data.style.useOutline,
                    outlineColor: data.style.outColor,
                    outlineSize: data.style.outSize,
                    fontSizeSetting: data.style.fontSize,
                    fontTheme: data.style.font,
                    lineSpacing: data.style.line,
                    greetingText: data.style.greet,
                    introText: data.style.intro,
                    wishlistLabelText: data.style.wish,
                });
            } else if (type === 'list' && isRevealedGlobally) {
                generateMasterListPdf({ 
                    matches, 
                    eventDetails: data.details,
                    exchangeDate: data.revealAt ? new Date(data.revealAt).toISOString().split('T')[0] : undefined,
                    exchangeTime: data.rt
                });
            }
        } catch (err) {
            console.error("PDF generation failed:", err);
            // You might want to show an error to the user
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    useEffect(() => {
        document.documentElement.dataset.theme = data.th || 'christmas';
    }, [data.th]);

    const renderContent = () => {
        if (!isRevealedGlobally && data.revealAt) {
            return (
                <div className="text-center p-8 bg-slate-800/50 rounded-2xl backdrop-blur-md text-white">
                    <h2 className="text-2xl font-bold font-serif mb-2">The Big Reveal is Coming!</h2>
                    <p className="text-lg opacity-80 mb-6">The full list of who has who will be revealed in:</p>
                    <CountdownTimer targetDate={data.revealAt} onComplete={handleRevealComplete} />
                </div>
            );
        }

        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <h2 className="text-3xl font-bold text-slate-800 text-center font-serif mb-2">Secret Santa Master List</h2>
                    <p className="text-center text-gray-600 mb-6">The results are in! Here is the full list of matches.</p>
                </div>
                <div className="max-w-4xl mx-auto overflow-x-auto p-4 md:p-8 pt-0">
                    <div className="bg-slate-50 rounded-lg p-4 border">
                        <div className="grid grid-cols-3 gap-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-wider px-4 pb-2 border-b">
                            <div>Secret Santa (Giver)</div>
                            <div>Is Giving To (Receiver)</div>
                            <div>Receiver's Notes & Budget</div>
                        </div>
                        <div className="divide-y">
                            {matches.map((match) => (
                                <div key={match.giver.id} className="grid grid-cols-3 gap-4 items-center p-4">
                                    <div className={`font-semibold text-slate-800 ${currentParticipantId === match.giver.id ? 'text-[var(--accent-dark-text)]' : ''}`}>{match.giver.name}</div>
                                    <div><span className={`font-semibold py-1 px-3 rounded-full ${currentParticipantId === match.giver.id ? 'bg-[var(--accent-color)] text-white' : 'bg-slate-200 text-slate-700'}`}>{match.receiver.name}</span></div>
                                    <div className="text-sm text-gray-500">
                                        {match.receiver.notes || match.receiver.budget ? (
                                            <>
                                                {match.receiver.notes && <span>{match.receiver.notes}</span>}
                                                {match.receiver.notes && match.receiver.budget && <span className="mx-1">|</span>}
                                                {match.receiver.budget && <span>Budget: ${match.receiver.budget}</span>}
                                            </>
                                        ) : <span className="italic">No notes</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 md:p-8 text-center bg-slate-50 border-t">
                    <button onClick={() => handleDownload('list')} disabled={isPdfLoading} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50">
                        {isPdfLoading ? 'Generating...' : 'Download Master List (PDF)'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <header className="text-center mb-10">
                    <a href="/" className="inline-block" aria-label="Go to homepage">
                        <div className="flex justify-center items-center gap-4">
                            <img src="/logo_64.png" alt="Santa hat logo" className="h-12 w-12" />
                            <h1 className="text-4xl font-bold text-slate-800 font-serif">Secret Santa Exchange</h1>
                        </div>
                    </a>
                </header>

                <main className="space-y-10">
                    {currentMatch ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 text-center">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6">Your Secret Santa Assignment</h2>
                            <div className="aspect-[4.25/5.5] w-full max-w-[425px] mx-auto rounded-lg shadow-xl overflow-hidden" onClick={() => setIsNameRevealed(true)}>
                                <PrintableCard
                                    match={currentMatch}
                                    eventDetails={data.details}
                                    backgroundImageUrl={data.style.bgId !== 'custom' ? selectedTheme?.imageUrl || null : null}
                                    customBackground={data.style.bgImg}
                                    textColor={data.style.txtColor}
                                    useTextOutline={data.style.useOutline}
                                    outlineColor={data.style.outColor}
                                    outlineSize={data.style.outSize}
                                    fontSizeSetting={data.style.fontSize}
                                    fontTheme={data.style.font}
                                    lineSpacing={data.style.line}
                                    greetingText={data.style.greet}
                                    introText={data.style.intro}
                                    wishlistLabelText={data.style.wish}
                                    isPdfMode={false}
                                    isNameRevealed={isNameRevealed}
                                />
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => handleDownload('card')} disabled={isPdfLoading || backgroundOptions.length === 0} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50">
                                    {isPdfLoading ? 'Generating...' : 'Download Your Card (PDF)'}
                                </button>
                                {isRevealedGlobally && (
                                    <a href="#master-list" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors">View All Matches</a>
                                )}
                            </div>
                        </div>
                    ) : (
                        !isRevealedGlobally && <div className="text-center text-lg text-slate-600">You are viewing the main event page. Your private link will show your specific assignment.</div>
                    )}
                    
                    <div id="master-list">
                        {renderContent()}
                    </div>
                    
                    <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                        <h3 className="text-3xl font-bold font-serif mb-2">Enjoying the tool?</h3>
                        <p className="text-orange-100 max-w-xs mb-6 text-lg">Help spread the holiday cheer by sharing it with others!</p>
                        <ShareButtons participantCount={data.p.length} />
                    </div>
                    
                    <div className="text-center mt-10">
                        <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState("", document.title, window.location.pathname + window.location.search); window.location.reload(); }} className="bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors shadow-md">
                            Start a New Game
                        </a>
                    </div>
                </main>

                <footer className="text-center mt-12 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} SecretSantaMatch.com</p>
                </footer>
            </div>
            
            {isPdfLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
                    <div className="text-white text-center">
                        <div role="status">
                            <svg aria-hidden="true" className="inline w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsPage;
