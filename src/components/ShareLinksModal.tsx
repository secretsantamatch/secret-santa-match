import React, { useState, useEffect, useCallback } from 'react';
import type { Match, ExchangeData } from '../types';
import { Copy, Check, X, Link as LinkIcon, MessageSquare, Download, Users, ClipboardList, Sparkles, QrCode } from 'lucide-react';
// FIX: Import the newly created PDF generation functions.
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import QRCode from "react-qr-code";
import { trackEvent } from '../services/analyticsService';
// FIX: Import PrintableCard to render hidden cards for PDF generation.
import PrintableCard from './PrintableCard';

interface ShareLinksModalProps {
    matches: Match[];
    exchangeData: ExchangeData;
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, exchangeData, onClose }) => {
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [useShortLinks, setUseShortLinks] = useState(false);
    const [shortenedLinks, setShortenedLinks] = useState<Record<string, string>>({});
    const [isShortening, setIsShortening] = useState(false);

    const getBaseUrl = () => window.location.href.split('#')[0].split('?')[0];
    const getHash = () => window.location.hash;

    const generateLink = useCallback((participantId: string): string => {
        const baseUrl = getBaseUrl();
        return `${baseUrl}?id=${participantId}${getHash()}`;
    }, []);

    useEffect(() => {
        const shortenAllLinks = async () => {
            if (useShortLinks) {
                setIsShortening(true);
                trackEvent('toggle_shorten_links', { enabled: true });
                const newShortenedLinks: Record<string, string> = {};
                const promises = matches.map(async ({ giver }) => {
                    const longUrl = generateLink(giver.id);
                    try {
                        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
                        if (response.ok) {
                            const shortUrl = await response.text();
                            newShortenedLinks[giver.id] = shortUrl;
                        } else {
                            newShortenedLinks[giver.id] = longUrl; // Fallback to long URL on error
                        }
                    } catch (error) {
                        console.error('TinyURL API error:', error);
                        newShortenedLinks[giver.id] = longUrl; // Fallback
                    }
                });
                await Promise.all(promises);
                setShortenedLinks(newShortenedLinks);
                setIsShortening(false);
            } else {
                 trackEvent('toggle_shorten_links', { enabled: false });
            }
        };
        shortenAllLinks();
    }, [useShortLinks, matches, generateLink]);

    const getLinkForUser = (participantId: string) => {
        return useShortLinks ? (shortenedLinks[participantId] || generateLink(participantId)) : generateLink(participantId);
    };

    const handleCopy = (id: string, textToCopy: string) => {
        trackEvent('copy_link', { link_type: id === 'master' ? 'master' : 'participant' });
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
        });
    };
    
    const handleCopyAll = () => {
        trackEvent('copy_all_links');
        const allLinksText = matches.map(({ giver }) => `${giver.name}: ${getLinkForUser(giver.id)}`).join('\n');
        handleCopy('copy-all', allLinksText);
    };

    const masterLink = `${getBaseUrl()}${getHash()}`;

    return (
        // FIX: Add a fragment and render hidden cards for PDF generation to work correctly.
        <>
            <div className="absolute -left-[9999px] top-0" aria-hidden="true">
                {matches.map(match => (
                    <div key={`pdf-card-${match.giver.id}`} style={{ width: '400px' }}>
                        <PrintableCard
                            match={match}
                            eventDetails={exchangeData.eventDetails}
                            isNameRevealed={true}
                            backgroundOptions={exchangeData.backgroundOptions}
                            bgId={exchangeData.bgId}
                            bgImg={exchangeData.customBackground}
                            txtColor={exchangeData.textColor}
                            outline={exchangeData.useTextOutline}
                            outColor={exchangeData.outlineColor}
                            outSize={exchangeData.outlineSize}
                            fontSize={exchangeData.fontSizeSetting}
                            font={exchangeData.fontTheme}
                            line={exchangeData.lineSpacing}
                            greet={exchangeData.greetingText}
                            intro={exchangeData.introText}
                            wish={exchangeData.wishlistLabelText}
                        />
                    </div>
                ))}
            </div>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-links-title"
            >
                <style>{`
                  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                  .toggle-switch { width: 44px; height: 24px; }
                  .toggle-switch-handle { width: 20px; height: 20px; top: 2px; left: 2px; transition: transform 0.2s ease-in-out; }
                  input:checked + .toggle-bg .toggle-switch-handle { transform: translateX(20px); }
                `}</style>
                <div 
                    onClick={e => e.stopPropagation()}
                    className="bg-slate-50 p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                        <h2 id="share-links-title" className="text-2xl font-bold font-serif text-slate-800">Share & Download</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-2 flex-grow mt-4">
                        {/* Master Link */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
                            <h3 className="font-bold text-indigo-800 text-base">Your Organizer Master Link</h3>
                            <p className="text-xs text-slate-500 mb-3">Save this link to get back to your results page anytime. Don't lose it!</p>
                            <div className="flex items-center gap-2">
                                <input type="text" readOnly value={masterLink} className="text-sm truncate w-full p-2 bg-slate-100 rounded-md border" />
                                <button onClick={() => handleCopy('master', masterLink)} className={`flex-shrink-0 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${copiedStates['master'] ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                    {copiedStates['master'] ? <Check size={16} /> : <Copy size={16} />}
                                    {copiedStates['master'] ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Participant Links */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-base">Participant Reveal Links</h3>
                            <div className="flex items-center gap-2">
                                 <span className="text-xs font-semibold text-slate-500">{isShortening ? 'Shortening...' : 'Use Short Links'}</span>
                                <label htmlFor="shorten-toggle" className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="shorten-toggle" className="sr-only" checked={useShortLinks} onChange={() => setUseShortLinks(!useShortLinks)} disabled={isShortening}/>
                                    <div className="toggle-bg bg-slate-200 rounded-full toggle-switch">
                                        <div className="toggle-switch-handle bg-white rounded-full shadow-md"></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {matches.map(({ giver }) => (
                                <div key={giver.id} className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-slate-700">{giver.name}'s Link</p>
                                            <input type="text" readOnly value={getLinkForUser(giver.id)} className="text-xs text-slate-500 truncate w-full bg-transparent p-0 border-0 focus:ring-0" />
                                        </div>
                                        <div className="bg-white p-1 rounded-md border">
                                          <QRCode value={getLinkForUser(giver.id)} size={64} />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                        <button onClick={() => handleCopy(giver.id, getLinkForUser(giver.id))} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${copiedStates[giver.id] ? 'bg-green-100 text-green-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                                            {copiedStates[giver.id] ? <Check size={14} /> : <Copy size={14} />}
                                            {copiedStates[giver.id] ? 'Copied' : 'Copy'}
                                        </button>
                                        <a href={`sms:?&body=Your Secret Santa match is ready! Click the link to see who you got: ${encodeURIComponent(getLinkForUser(giver.id))}`} onClick={() => trackEvent('share_link', { method: 'sms' })} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors">
                                            <MessageSquare size={14} /> Text
                                        </a>
                                        <a href={`https://api.whatsapp.com/send?text=Your Secret Santa match is ready! Click the link to see who you got: ${encodeURIComponent(getLinkForUser(giver.id))}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('share_link', { method: 'whatsapp' })} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors">
                                            <MessageSquare size={14} /> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Downloads & Bulk Actions */}
                        <div className="mt-8">
                            <h3 className="font-bold text-slate-800 text-base mb-4">Downloads & Bulk Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={handleCopyAll} className={`flex flex-col items-start text-left p-4 rounded-xl border transition-colors ${copiedStates['copy-all'] ? 'bg-green-100 border-green-300' : 'bg-white hover:bg-slate-100 border-slate-200'}`}>
                                    <div className="flex items-center gap-2 font-bold text-slate-800"><ClipboardList size={20} /> Copy All Links</div>
                                    <p className="text-xs text-slate-500 mt-1">Copy a plain text list of all names and links to your clipboard.</p>
                                </button>
                                <button onClick={() => { trackEvent('download_pdf', { type: 'all_cards' }); generateAllCardsPdf(exchangeData); }} className="flex flex-col items-start text-left p-4 rounded-xl border bg-white hover:bg-slate-100 border-slate-200 transition-colors">
                                    <div className="flex items-center gap-2 font-bold text-slate-800"><Download size={20} /> Download All Cards</div>
                                    <p className="text-xs text-slate-500 mt-1">A PDF with one styled, printable card for each person.</p>
                                </button>
                                <button onClick={() => { trackEvent('download_pdf', { type: 'master_list' }); generateMasterListPdf(exchangeData); }} className="flex flex-col items-start text-left p-4 rounded-xl border bg-white hover:bg-slate-100 border-slate-200 transition-colors">
                                    <div className="flex items-center gap-2 font-bold text-slate-800"><Users size={20} /> Download Master List</div>
                                    <p className="text-xs text-slate-500 mt-1">A simple PDF of all matches for your records.</p>
                                </button>
                                 <button onClick={() => { trackEvent('download_pdf', { type: 'party_pack' }); generatePartyPackPdf(exchangeData); }} className="flex flex-col items-start text-left p-4 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 transition-all">
                                    <div className="flex items-center gap-2 font-bold text-purple-800"><Sparkles size={20} /> Download Party Pack</div>
                                    <p className="text-xs text-purple-700 mt-1">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center border-t border-slate-200 pt-4">
                        <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShareLinksModal;