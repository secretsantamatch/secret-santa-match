import React, { useState, useEffect, useMemo } from 'react';
import type { Participant, Match, ExchangeData, BackgroundOption } from '../types';
import CountdownTimer from './CountdownTimer';
import ResultsDisplay from './ResultsDisplay';
import Footer from './Footer';
import ShareButtons from './ShareButtons';
import EmailPreviewModal from './EmailPreviewModal';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const ReconstructData = (data: ExchangeData): { participants: Participant[], matches: Match[] } => {
    const participants: Participant[] = data.p.map((p, index) => ({
        id: `p-${index}`,
        ...p,
    }));
    const matches: Match[] = data.m.map(m => ({
        giver: participants[m.g],
        receiver: participants[m.r],
    }));
    return { participants, matches };
};

interface ResultsPageProps {
    data: ExchangeData;
    participantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data: initialData, participantId }) => {
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    
    // States for existing features
    const [emailTheme, setEmailTheme] = useState('default');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState('');
    const [sendError, setSendError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(setBackgroundOptions)
            .catch(err => console.error("Failed to load templates for PDF generation", err));
    }, []);

    const { participants, matches } = useMemo(() => ReconstructData(initialData), [initialData]);
    const exchangeDate = useMemo(() => new Date(initialData.d), [initialData.d]);
    const eventDetails = initialData.e;
    
    const handleCopyLink = (index: number) => {
        const url = `${window.location.origin}${window.location.pathname}?id=${index}#${window.location.hash.substring(1)}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(`p-${index}`);
            setTimeout(() => setCopiedLink(null), 2000);
        });
    };

    const handleSendEmails = async () => {
        setIsSending(true);
        setSendSuccess('');
        setSendError('');
        const participantsWithEmail = participants.filter(p => p.email && p.email.includes('@'));
        if (participantsWithEmail.length === 0) {
            setSendError("No valid emails were provided to send to.");
            setIsSending(false);
            return;
        }
        const matchesWithEmail = matches.filter(m => m.giver.email && m.giver.email.includes('@'));

        try {
            const response = await fetch('/.netlify/functions/send-emails', {
                method: 'POST',
                body: JSON.stringify({ matches: matchesWithEmail, eventDetails, theme: emailTheme }),
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            setSendSuccess(`Successfully sent ${matchesWithEmail.length} emails!`);
        } catch (error) {
            setSendError('An error occurred. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadPdf = async (type: 'cards' | 'list') => {
        setIsPdfLoading(true);
        try {
            if (type === 'cards' && initialData.pdf) {
                await generateIndividualCardsPdf({
                    matches, eventDetails, backgroundOptions,
                    backgroundId: initialData.pdf.bgId,
                    customBackground: initialData.pdf.bgCustom,
                    textColor: initialData.pdf.textColor,
                    useTextOutline: initialData.pdf.useOutline,
                    outlineColor: initialData.pdf.outlineColor,
                    outlineSize: initialData.pdf.outlineSize,
                    fontSizeSetting: initialData.pdf.fontSize,
                    fontTheme: initialData.pdf.font,
                    lineSpacing: initialData.pdf.lineSpacing,
                    greetingText: initialData.pdf.greeting,
                    introText: initialData.pdf.intro,
                    wishlistLabelText: initialData.pdf.wishlist,
                });
            } else if (type === 'list') {
                await generateMasterListPdf({ matches, eventDetails });
            }
        } catch(err) {
            console.error("PDF generation failed:", err);
            alert("Sorry, there was an error creating the PDF.");
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    const isRevealTime = new Date() > exchangeDate;
    const currentMatch = useMemo(() => matches.find(m => m.giver.id === participantId), [matches, participantId]);
    
    // Organizer's View
    if (!participantId) {
        return (
            <>
                <header className="text-center py-6">
                    <h1 className="text-4xl sm:text-5xl font-bold text-[var(--primary-text)] font-serif">Matches Generated!</h1>
                    <p className="text-lg text-gray-600 mt-2">Here are your three options for sharing the results.</p>
                </header>
                <main className="space-y-8">
                    {/* Share via Links Card */}
                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                       <div className="flex items-center gap-4 mb-4">
                         <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full h-12 w-12 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg></div>
                         <div>
                           <h2 className="text-2xl font-bold text-slate-800">1. Share via Links (Recommended)</h2>
                           <p className="text-gray-600">100% private. No emails needed. Just copy and send each person their unique link.</p>
                         </div>
                       </div>
                       <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                            {participants.map((p, index) => (
                                <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                                    <span className="font-semibold text-slate-700">{p.name}</span>
                                    <button onClick={() => handleCopyLink(index)} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm py-2 px-3 rounded-md transition-colors">
                                       {copiedLink === p.id ? <CheckIcon /> : <CopyIcon /> }
                                       {copiedLink === p.id ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            ))}
                       </div>
                    </div>
                    <ResultsDisplay matches={matches} />
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Send via Email */}
                        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center text-center">
                            <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">2. Send via Email</h3>
                            <p className="text-gray-600 mb-4 text-sm flex-grow">Send results directly to each person's inbox using a festive email template.</p>
                            <div className="w-full max-w-xs space-y-3">
                              <div className="flex items-center gap-2">
                                <label htmlFor="email-theme" className="text-sm font-semibold text-slate-700">Theme:</label>
                                <select id="email-theme" value={emailTheme} onChange={e => setEmailTheme(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400">
                                    <option value="default">Festive</option><option value="christmas">Christmas</option><option value="halloween">Halloween</option>
                                    <option value="valentines">Valentine's</option><option value="birthday">Birthday</option><option value="celebration">Celebration</option>
                                </select>
                                <button onClick={() => setShowPreview(true)} className="text-blue-600 hover:underline text-sm font-semibold">Preview</button>
                              </div>
                              <button onClick={handleSendEmails} disabled={isSending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400">
                                {isSending ? 'Sending...' : `Send ${participants.filter(p => p.email).length} Emails`}
                              </button>
                            </div>
                            {sendSuccess && <p className="text-green-700 text-sm mt-2">{sendSuccess}</p>}
                            {sendError && <p className="text-red-700 text-sm mt-2">{sendError}</p>}
                        </div>
                        {/* Download Printables */}
                        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center text-center">
                            <div className="flex-shrink-0 bg-green-100 text-green-600 rounded-full h-12 w-12 flex items-center justify-center mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                             <h3 className="text-xl font-bold text-slate-800 mb-2">3. Download Printables</h3>
                             <p className="text-gray-600 mb-4 text-sm flex-grow">Download and print styled gift tags for each person or a master list for yourself.</p>
                             <div className="flex gap-3">
                                <button onClick={() => handleDownloadPdf('cards')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Gift Tags</button>
                                <button onClick={() => handleDownloadPdf('list')} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Master List</button>
                             </div>
                        </div>
                    </div>
                </main>
                <Footer theme="default" setTheme={() => {}} />
                {showPreview && <EmailPreviewModal theme={emailTheme} onClose={() => setShowPreview(false)} />}
                {isPdfLoading && <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"><div className="text-white text-center"><p className="text-xl font-semibold mt-4">Generating PDF...</p></div></div>}
            </>
        );
    }
    
    // Participant's View
    if (!currentMatch) {
         return <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md"><h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1><p className="text-gray-700">We couldn't find your match in this group. Please make sure you are using your personal link.</p><a href="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Go Home</a></div></div>;
    }

    return (
        <>
            <header className="text-center py-6">
               <a href="/"><img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-16 w-16 mx-auto mb-4" /></a>
               <h1 className="text-3xl font-bold text-slate-800">Hello, {currentMatch.giver.name}!</h1>
               <p className="text-lg text-gray-600 mt-2">The results are in! You are the Secret Santa for...</p>
            </header>
            <main>
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
                    <div className="text-4xl sm:text-5xl font-bold font-serif text-[var(--accent-color)]">{currentMatch.receiver.name}</div>
                    
                    {(currentMatch.receiver.notes || currentMatch.receiver.budget) && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="text-lg font-bold text-slate-700">Their Gift Ideas & Notes</h3>
                            {currentMatch.receiver.notes && <p className="text-slate-600 mt-2">{currentMatch.receiver.notes}</p>}
                            {currentMatch.receiver.budget && <p className="text-slate-600 mt-2 font-semibold">Suggested Budget: <span className="text-slate-800">${currentMatch.receiver.budget}</span></p>}
                        </div>
                    )}
                    {eventDetails && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="text-lg font-bold text-slate-700">Event Details</h3>
                            <p className="text-slate-600 mt-2">{eventDetails}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {isRevealTime ? (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-slate-800 text-center mb-4">Who Got Who? The Full List!</h2>
                            <ResultsDisplay matches={matches} />
                        </div>
                    ) : (
                        <CountdownTimer targetDate={exchangeDate} />
                    )}
                </div>
                 <div className="mt-12 text-center">
                    <h3 className="text-xl font-bold text-slate-800">Share the Fun!</h3>
                    <p className="text-gray-600 mb-4">Enjoying this free tool? Share it with friends!</p>
                    <ShareButtons participantCount={participants.length} />
                </div>
            </main>
            <Footer theme="default" setTheme={() => {}} />
        </>
    );
};

export default ResultsPage;
