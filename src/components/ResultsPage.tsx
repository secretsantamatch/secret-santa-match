import React, { useState, useEffect, useMemo } from 'react';
import { decodeData } from '../services/urlService';
import type { Participant, Match, ExchangeData } from '../types';
import CountdownTimer from './CountdownTimer';
import ResultsDisplay from './ResultsDisplay';
import Footer from './Footer';
import ShareButtons from './ShareButtons';
import EmailPreviewModal from './EmailPreviewModal';

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

const ResultsPage: React.FC = () => {
    const [data, setData] = useState<{ participants: Participant[], matches: Match[], eventDetails: string, exchangeDate: Date } | null>(null);
    const [error, setError] = useState('');
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    
    // States for existing features
    const [emailTheme, setEmailTheme] = useState('default');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState('');
    const [sendError, setSendError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        try {
            const hash = window.location.hash.substring(1);
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            setParticipantId(id);

            if (hash) {
                const decoded = decodeData(hash);
                if (decoded) {
                    const { participants, matches } = ReconstructData(decoded);
                    setData({
                        participants,
                        matches,
                        eventDetails: decoded.e,
                        exchangeDate: new Date(decoded.d),
                    });
                } else {
                    setError('The link is invalid or corrupted. Please check the link or ask the organizer to send it again.');
                }
            } else {
                 setError('No results found in this link.');
            }
        } catch (e) {
            setError('There was an error reading the results from this link.');
        }
    }, []);
    
    const handleCopyLink = (id: string) => {
        const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${window.location.hash.substring(1)}?id=${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(id);
            setTimeout(() => setCopiedLink(null), 2000);
        });
    };

    const handleSendEmails = async () => {
        if (!data) return;
        setIsSending(true);
        setSendSuccess('');
        setSendError('');

        const participantsWithEmail = data.participants.filter(p => p.email && p.email.includes('@'));
        if (participantsWithEmail.length === 0) {
            setSendError("No valid emails were provided to send to.");
            setIsSending(false);
            return;
        }

        const matchesWithEmail = data.matches.filter(m => m.giver.email && m.giver.email.includes('@'));

        try {
            const response = await fetch('/.netlify/functions/send-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matches: matchesWithEmail, eventDetails: data.eventDetails, theme: emailTheme }),
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            setSendSuccess(`Successfully sent ${matchesWithEmail.length} emails!`);
        } catch (error) {
            console.error("Email sending failed:", error);
            setSendError('An error occurred while sending emails. Please try again.');
        } finally {
            setIsSending(false);
        }
    };
    
    const isRevealTime = data ? new Date() > data.exchangeDate : false;
    const currentMatch = useMemo(() => data?.matches.find(m => m.giver.id === participantId), [data, participantId]);
    
    if (error) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md"><h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1><p className="text-gray-700">{error}</p><a href="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Go Home</a></div></div>;
    }

    if (!data) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><svg className="animate-spin h-10 w-10 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>;
    }
    
    // Organizer's View
    if (!participantId) {
        return (
            <div className="bg-slate-50 min-h-screen">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
                    <header className="text-center py-6">
                        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--primary-text)] font-serif">Matches Generated!</h1>
                        <p className="text-lg text-gray-600 mt-2">Here are the results. Share the links with your group!</p>
                    </header>
                    <main className="space-y-8">
                        {/* Share via Links Card */}
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                           <div className="flex items-center gap-4 mb-4">
                             <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full h-12 w-12 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg></div>
                             <div>
                               <h2 className="text-2xl font-bold text-slate-800">1. Share via Links (Recommended)</h2>
                               <p className="text-gray-600">The most private way. No emails needed. Just copy and send each person their unique link.</p>
                             </div>
                           </div>
                           <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                                {data.participants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                                        <span className="font-semibold text-slate-700">{p.name}</span>
                                        <button onClick={() => handleCopyLink(p.id)} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm py-2 px-3 rounded-md transition-colors">
                                           {copiedLink === p.id ? <CheckIcon /> : <CopyIcon /> }
                                           {copiedLink === p.id ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                ))}
                           </div>
                        </div>
                        <ResultsDisplay matches={data.matches} />
                        
                        {/* Other Sharing Options */}
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                           <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Other Sharing Options</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Send via Email */}
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center text-center">
                                    <h3 className="text-xl font-bold text-blue-800 mb-2">2. Send via Email</h3>
                                    <p className="text-blue-700 mb-4 text-sm">Send results directly to each person's inbox using our festive email template.</p>
                                    <div className="w-full max-w-xs space-y-3">
                                      <div className="flex items-center gap-2">
                                        <label htmlFor="email-theme" className="text-sm font-semibold text-blue-800">Theme:</label>
                                        <select id="email-theme" value={emailTheme} onChange={e => setEmailTheme(e.target.value)} className="flex-grow p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400">
                                            <option value="default">Festive</option><option value="christmas">Christmas</option><option value="halloween">Halloween</option>
                                            <option value="valentines">Valentine's</option><option value="birthday">Birthday</option><option value="celebration">Celebration</option>
                                        </select>
                                        <button onClick={() => setShowPreview(true)} className="text-blue-600 hover:underline text-sm font-semibold">Preview</button>
                                      </div>
                                      <button onClick={handleSendEmails} disabled={isSending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400">
                                        {isSending ? 'Sending...' : `Send ${data.participants.filter(p => p.email).length} Emails`}
                                      </button>
                                    </div>
                                    {sendSuccess && <p className="text-green-700 text-sm mt-2">{sendSuccess}</p>}
                                    {sendError && <p className="text-red-700 text-sm mt-2">{sendError}</p>}
                                </div>
                                {/* Download Printables */}
                                <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center text-center">
                                     <h3 className="text-xl font-bold text-green-800 mb-2">3. Download Printables</h3>
                                     <p className="text-green-700 mb-4 text-sm">Download and print styled gift tags for each person or a master list for yourself.</p>
                                     <p className="text-xs text-green-600 italic">This feature is coming soon!</p>
                                     {/* Placeholder for PDF Download Button */}
                                </div>
                            </div>
                        </div>
                    </main>
                    <Footer theme="default" setTheme={() => {}} />
                </div>
                 {showPreview && <EmailPreviewModal theme={emailTheme} onClose={() => setShowPreview(false)} />}
            </div>
        );
    }
    
    // Participant's View
    if (!currentMatch) {
         return <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md"><h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1><p className="text-gray-700">We couldn't find your match in this group. Please make sure you are using your personal link.</p><a href="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Go Home</a></div></div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
                <header className="text-center py-6">
                   <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-16 w-16 mx-auto mb-4" />
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
                        {data.eventDetails && (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <h3 className="text-lg font-bold text-slate-700">Event Details</h3>
                                <p className="text-slate-600 mt-2">{data.eventDetails}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        {isRevealTime ? (
                            <div className="animate-fade-in-up">
                                <h2 className="text-2xl font-bold text-slate-800 text-center mb-4">Who Got Who? The Full List!</h2>
                                <ResultsDisplay matches={data.matches} />
                            </div>
                        ) : (
                            <CountdownTimer targetDate={data.exchangeDate} />
                        )}
                    </div>
                     <div className="mt-12 text-center">
                        <h3 className="text-xl font-bold text-slate-800">Share the Fun!</h3>
                        <p className="text-gray-600 mb-4">Enjoying this free tool? Share it with friends!</p>
                        <ShareButtons participantCount={data.participants.length} />
                    </div>
                </main>
                <Footer theme="default" setTheme={() => {}} />
            </div>
        </div>
    );
};

export default ResultsPage;
