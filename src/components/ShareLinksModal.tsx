import React, { useState } from 'react';
import type { Match, ExchangeData } from '../types';
import { Copy, Check, X, Link, Mail, MessageSquare, Download, FileText, Sparkles, Gift, Users } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';
import QRCode from 'react-qr-code';
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';

interface ShareLinksModalProps {
    matches: Match[];
    onClose: () => void;
    exchangeData: ExchangeData;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, onClose, exchangeData }) => {
    const [copiedStates, setCopiedStates] = useState<Record<string, { text: string, type: 'copy' | 'shorten' | 'all' } | null>>({});
    const [shortenedUrls, setShortenedUrls] = useState<Record<string, string>>({});
    const [isShortening, setIsShortening] = useState<Record<string, boolean>>({});

    const getRevealUrl = (giverId: string) => {
        const baseUrl = window.location.href.split('#')[0].split('?')[0];
        const hash = window.location.hash;
        return `${baseUrl}?id=${giverId}${hash}`;
    };
    
    const showCopiedState = (id: string, text: string, type: 'copy' | 'shorten' | 'all') => {
        setCopiedStates(prev => ({ ...prev, [id]: { text, type } }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: null })), 2000);
    };

    const handleCopy = (id: string, url: string, type: 'copy' | 'shorten' | 'all' = 'copy') => {
        navigator.clipboard.writeText(url).then(() => {
            showCopiedState(id, type === 'shorten' ? 'Short Link Copied!' : 'Copied!', type);
            if (type === 'all') {
                trackEvent('copy_all_links');
            } else {
                trackEvent('copy_link', { type: 'reveal_link' });
            }
        });
    };

    const handleShorten = async (id: string, longUrl: string) => {
        if (shortenedUrls[id]) {
            handleCopy(id, shortenedUrls[id], 'shorten');
            return;
        }
        setIsShortening(prev => ({ ...prev, [id]: true }));
        trackEvent('shorten_link');
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            if (response.ok) {
                const shortUrl = await response.text();
                setShortenedUrls(prev => ({ ...prev, [id]: shortUrl }));
                handleCopy(id, shortUrl, 'shorten');
            } else {
                throw new Error('TinyURL API failed');
            }
        } catch (error) {
            console.error('Failed to shorten URL:', error);
            handleCopy(id, longUrl, 'copy'); // Fallback to copying long URL
        } finally {
            setIsShortening(prev => ({ ...prev, [id]: false }));
        }
    };

    const masterLink = window.location.href.split('?')[0] + window.location.hash;

    const allLinksText = matches.map(({ giver }) => `${giver.name}: ${getRevealUrl(giver.id)}`).join('\n');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Share & Download</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800"><X size={28} /></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-6">
                    {/* Organizer Master Link */}
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-indigo-200">
                        <h3 className="font-bold text-indigo-800 mb-2">Your Organizer Master Link</h3>
                        <p className="text-sm text-indigo-700 mb-3">Save this link to get back to your results page anytime. Don't lose it!</p>
                        <div className="flex gap-2">
                             <input type="text" readOnly value={masterLink} className="w-full text-sm text-slate-500 bg-slate-100 border rounded p-2 truncate" onFocus={(e) => e.target.select()} />
                             <button onClick={() => handleCopy('master', masterLink)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">
                                {copiedStates['master'] ? <Check size={16} /> : <Copy size={16} />}
                                {copiedStates['master'] ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Participant Links */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Participant Reveal Links</h3>
                        <p className="text-sm text-slate-600 mb-4">Send each person their unique link below.</p>
                        <div className="space-y-4">
                            {matches.map(({ giver }) => {
                                const revealUrl = getRevealUrl(giver.id);
                                return (
                                    <div key={giver.id} className="bg-white p-4 rounded-xl border">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800 text-lg">{giver.name}'s Link</p>
                                            <div className="bg-white border rounded-lg p-1 shadow-sm"><QRCode value={revealUrl} size={64} /></div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button onClick={() => handleCopy(giver.id, revealUrl, 'copy')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${copiedStates[giver.id]?.type === 'copy' ? 'bg-green-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-700'}`}>
                                                {copiedStates[giver.id]?.type === 'copy' ? <Check size={16} /> : <Copy size={16} />}
                                                {copiedStates[giver.id]?.type === 'copy' ? copiedStates[giver.id]?.text : 'Copy'}
                                            </button>
                                            <button onClick={() => handleShorten(giver.id, revealUrl)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${copiedStates[giver.id]?.type === 'shorten' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`} disabled={isShortening[giver.id]}>
                                                {copiedStates[giver.id]?.type === 'shorten' ? <Check size={16} /> : <Link size={16} />}
                                                {isShortening[giver.id] ? '...' : (copiedStates[giver.id]?.type === 'shorten' ? copiedStates[giver.id]?.text : (shortenedUrls[giver.id] ? 'Copy Short' : 'Shorten'))}
                                            </button>
                                            <a href={`sms:?&body=Your Secret Santa link: ${encodeURIComponent(shortenedUrls[giver.id] || revealUrl)}`} className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-300"><MessageSquare size={16} /> Text</a>
                                            <a href={`https://wa.me/?text=Your Secret Santa link: ${encodeURIComponent(shortenedUrls[giver.id] || revealUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-300"><Mail size={16} /> WhatsApp</a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Downloads Section */}
                    <div className="pt-6 border-t">
                        <h3 className="font-bold text-slate-800 mb-4 text-center">Downloads & Bulk Actions</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleCopy('all-links', allLinksText, 'all')} className={`bg-white p-4 rounded-xl border text-left hover:border-slate-400 transition-colors ${copiedStates['all-links'] ? 'border-green-500' : ''}`}>
                                <div className="flex items-center gap-2">
                                  {copiedStates['all-links'] ? <Check className="text-green-500 mb-2" /> : <FileText className="text-slate-500 mb-2" />}
                                  <h4 className="font-bold text-slate-800">{copiedStates['all-links'] ? 'Copied to Clipboard!' : 'Copy All Links'}</h4>
                                </div>
                                <p className="text-sm text-slate-500">Copy a plain text list of all names and links to your clipboard.</p>
                            </button>
                            <button onClick={() => generateAllCardsPdf(matches, exchangeData)} className="bg-white p-4 rounded-xl border text-left hover:border-slate-400">
                                <Download className="text-slate-500 mb-2" />
                                <h4 className="font-bold text-slate-800">Download All Cards</h4>
                                <p className="text-sm text-slate-500">A PDF with one styled, printable card for each person.</p>
                            </button>
                             <button onClick={() => generateMasterListPdf(matches, exchangeData)} className="bg-white p-4 rounded-xl border text-left hover:border-slate-400">
                                <Users className="text-slate-500 mb-2" />
                                <h4 className="font-bold text-slate-800">Download Master List</h4>
                                <p className="text-sm text-slate-500">A simple PDF of all matches for your records.</p>
                            </button>
                             <button onClick={() => generatePartyPackPdf(exchangeData)} className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-xl border text-left hover:opacity-90">
                                <Sparkles className="text-yellow-300 mb-2" />
                                <h4 className="font-bold">Download Party Pack</h4>
                                <p className="text-sm text-purple-200">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-6 rounded-lg">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ShareLinksModal;