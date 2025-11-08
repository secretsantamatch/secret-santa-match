import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import QRCode from "react-qr-code";
import { Link, Copy, Check, Smartphone, Users, Download, Star, QrCode, MessageCircle } from 'lucide-react';
import PrintableCard from './PrintableCard';

interface ShareLinksModalProps {
    exchangeData: ExchangeData;
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ exchangeData, onClose }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [useShortLinks, setUseShortLinks] = useState(false);
    const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
    const [isLoadingShortLinks, setIsLoadingShortLinks] = useState(false);
    const [expandedQr, setExpandedQr] = useState<string | null>(null);
    
    const [organizerShortLink, setOrganizerShortLink] = useState<string | null>(null);
    const [isShorteningOrganizer, setIsShorteningOrganizer] = useState(false);

    const [qrShortLinks, setQrShortLinks] = useState<Record<string, string>>({});
    const [isGeneratingQr, setIsGeneratingQr] = useState<string | null>(null);

    const baseOrganizerUrl = useMemo(() => {
        const url = new URL(window.location.href);
        url.hash = window.location.hash.split('?')[0];
        url.searchParams.set('page', 'results');
        url.searchParams.delete('id');
        return url.toString();
    }, []);

    const fullLinks = useMemo(() => {
        const links: Record<string, string> = {};
        const url = new URL(window.location.href);
        url.hash = window.location.hash.split('?')[0];
        url.searchParams.set('page', 'results');
        
        exchangeData.p.forEach(p => {
            url.searchParams.set('id', p.id);
            links[p.id] = url.toString();
        });
        return links;
    }, [exchangeData.p]);

    const matches: Match[] = useMemo(() => exchangeData.matches.map(m => ({
        giver: exchangeData.p.find(p => p.id === m.g)!,
        receiver: exchangeData.p.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [exchangeData]);
    
    useEffect(() => {
        if (useShortLinks && Object.keys(shortLinks).length !== exchangeData.p.length) {
            const fetchShortLinks = async () => {
                setIsLoadingShortLinks(true);
                trackEvent('use_shorten_toggle', { toggled_on: true });
                const newShortLinks: Record<string, string> = {};
                for (const p of exchangeData.p) {
                    try {
                        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullLinks[p.id])}`);
                        if (response.ok) {
                            newShortLinks[p.id] = await response.text();
                        } else {
                            newShortLinks[p.id] = fullLinks[p.id];
                        }
                    } catch (error) {
                        console.error('TinyURL API error:', error);
                        newShortLinks[p.id] = fullLinks[p.id];
                    }
                }
                setShortLinks(newShortLinks);
                setIsLoadingShortLinks(false);
            };
            fetchShortLinks();
        } else if (!useShortLinks) {
            trackEvent('use_shorten_toggle', { toggled_on: false });
        }
    }, [useShortLinks, fullLinks, exchangeData.p, shortLinks]);
    
    const handleShortenOrganizerLink = async () => {
        if (organizerShortLink) {
            setOrganizerShortLink(null);
            return;
        }
        setIsShorteningOrganizer(true);
        trackEvent('shorten_organizer_link');
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(baseOrganizerUrl)}`);
            if (response.ok) {
                setOrganizerShortLink(await response.text());
            }
        } catch (error) {
            console.error('TinyURL API error:', error);
        }
        setIsShorteningOrganizer(false);
    };

    const getLink = (participantId: string) => {
        if (useShortLinks) {
            return isLoadingShortLinks ? 'Shortening...' : (shortLinks[participantId] || 'Error');
        }
        return fullLinks[participantId];
    };

    const handleCopy = (text: string, id: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            trackEvent('copy_link', { type });
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const copyAllLinks = () => {
        const text = exchangeData.p.map(p => `${p.name}: ${getLink(p.id)}`).join('\n');
        handleCopy(text, 'all-links', 'all_participants');
    };
    
    const handleDownload = async (type: 'all_cards' | 'master_list' | 'party_pack') => {
        trackEvent('download_results', { type });
        try {
            if (type === 'all_cards') await generateAllCardsPdf(exchangeData);
            else if (type === 'master_list') generateMasterListPdf(exchangeData);
            else if (type === 'party_pack') generatePartyPackPdf(exchangeData);
        } catch (error) {
            alert((error as Error).message || "An unknown error occurred during PDF generation.");
        }
    };
    
    const handleQrCodeClick = async (participantId: string) => {
        if (expandedQr === participantId) {
            setExpandedQr(null);
            return;
        }

        setExpandedQr(participantId);
        trackEvent('view_qr_code', { participant_id: participantId });
        if (qrShortLinks[participantId] || shortLinks[participantId]) return;

        setIsGeneratingQr(participantId);
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullLinks[participantId])}`);
            if (response.ok) {
                const shortUrl = await response.text();
                setQrShortLinks(prev => ({ ...prev, [participantId]: shortUrl }));
            }
        } catch (error) { console.error('QR TinyURL error:', error); }
        setIsGeneratingQr(null);
    };

    const getQrLink = (participantId: string) => {
        return shortLinks[participantId] || qrShortLinks[participantId] || fullLinks[participantId];
    }
    
    const downloadQrCode = (participantId: string, participantName: string) => {
        trackEvent('download_qr_code', { participant_name: participantName });
        const qrContainer = document.getElementById(`qr-container-${participantId}`);
        if (!qrContainer) return;
        
        const svg = qrContainer.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = document.createElement("img");
        img.onload = () => {
            const padding = 20;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2;
            
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, padding, padding);

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_Code_for_${participantName}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    const displayOrganizerUrl = organizerShortLink || baseOrganizerUrl;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 text-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col transform transition-all duration-300 animate-slide-up" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-slate-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-serif">Share & Download</h2>
                        <p className="text-slate-400 text-sm mt-1">Send each person their unique reveal link.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl">&times;</button>
                </header>
                
                <main className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-xl">
                        <label htmlFor="master-link" className="block text-sm font-bold text-indigo-300 mb-2">Your Organizer Master Link</label>
                        <p className="text-xs text-slate-400 mb-2">Save this link to get back to your results page anytime. Don't lose it!</p>
                        <div className="flex items-center gap-2">
                            <input id="master-link" type="text" readOnly value={displayOrganizerUrl} className="w-full p-2 border border-slate-500 rounded-md bg-slate-800 text-slate-300 text-sm truncate"/>
                            <button onClick={handleShortenOrganizerLink} disabled={isShorteningOrganizer} className="py-2 px-3 rounded-lg font-semibold text-sm transition-colors bg-slate-600 hover:bg-slate-500 text-white flex-shrink-0">
                                {isShorteningOrganizer ? '...' : (organizerShortLink ? 'Full' : 'Shorten')}
                            </button>
                            <button onClick={() => handleCopy(displayOrganizerUrl, 'master-link', 'organizer_master_link')} className={`py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${copiedId === 'master-link' ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                {copiedId === 'master-link' ? <Check size={16}/> : <Copy size={16}/>}
                            </button>
                        </div>
                    </div>
                    
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-white">Participant Reveal Links</h3>
                                <p className="text-xs text-slate-400">Copy, shorten, or share each link via Text/WhatsApp.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-300">Use Short Links</span>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={useShortLinks} onChange={() => setUseShortLinks(!useShortLinks)} className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            {exchangeData.p.map(p => (
                                <div key={p.id} className="bg-slate-700 p-4 rounded-xl border border-slate-600">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="bg-slate-600 p-2 rounded-lg cursor-pointer flex-shrink-0" onClick={() => handleQrCodeClick(p.id)}>
                                                 <QrCode className="text-slate-300"/>
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-white">{p.name}'s Link</p>
                                                <p className="text-xs text-slate-400 truncate">{getLink(p.id)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                                            <button onClick={() => handleCopy(getLink(p.id), p.id, 'single_participant')} className={`p-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5 ${copiedId === p.id ? 'bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}>
                                                {copiedId === p.id ? <Check size={14}/> : <Copy size={14}/>}
                                            </button>
                                            <a href={`sms:?&body=Your Secret Santa match is ready! 🎁 Here is your private link: ${getLink(p.id)}`} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg hidden sm:inline-block"><Smartphone size={14}/></a>
                                            <a href={`https://api.whatsapp.com/send?text=Your Secret Santa match is ready! 🎁 Here is your private link: ${encodeURIComponent(getLink(p.id))}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg hidden sm:inline-block"><MessageCircle size={14}/></a>
                                        </div>
                                    </div>
                                    {expandedQr === p.id && (
                                        <div className="mt-4 p-4 bg-slate-800 rounded-lg text-center">
                                            <p className="text-sm font-semibold mb-2 text-slate-300">Scan QR code for {p.name}'s link</p>
                                            {isGeneratingQr === p.id ? (
                                                <div className="flex justify-center items-center h-40"><p className="text-slate-400">Generating short link...</p></div>
                                            ) : (
                                                <>
                                                    <div id={`qr-container-${p.id}`} className="bg-white p-2 inline-block rounded-lg">
                                                        <QRCode value={getQrLink(p.id)} size={128} bgColor="#FFFFFF" fgColor="#1e293b" />
                                                    </div>
                                                    <button 
                                                        onClick={() => downloadQrCode(p.id, p.name)}
                                                        className="mt-4 flex items-center justify-center gap-2 w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                                    >
                                                        <Download size={16} />
                                                        Download QR Code
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                     <div>
                        <h3 className="text-lg font-bold text-white mb-4 mt-6">Downloads & Bulk Actions</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={copyAllLinks} className="bg-slate-700 p-4 rounded-xl border border-slate-600 text-left hover:bg-slate-600 transition-colors">
                                <div className="flex items-start gap-3">
                                    <Copy className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold text-white">Copy All Links</p>
                                        <p className="text-xs text-slate-400">Copy a plain text list of all names and links to your clipboard.</p>
                                    </div>
                                </div>
                            </button>
                             <button onClick={() => handleDownload('all_cards')} className="bg-slate-700 p-4 rounded-xl border border-slate-600 text-left hover:bg-slate-600 transition-colors">
                                <div className="flex items-start gap-3">
                                    <Download className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold text-white">Download All Cards</p>
                                        <p className="text-xs text-slate-400">A PDF with one styled, printable card for each person.</p>
                                    </div>
                                </div>
                            </button>
                             <button onClick={() => handleDownload('master_list')} className="bg-slate-700 p-4 rounded-xl border border-slate-600 text-left hover:bg-slate-600 transition-colors">
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold text-white">Download Master List</p>
                                        <p className="text-xs text-slate-400">A simple PDF of all matches for your records.</p>
                                    </div>
                                </div>
                            </button>
                             <button onClick={() => handleDownload('party_pack')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl border border-purple-500 text-left hover:opacity-90 transition-opacity">
                                <div className="flex items-start gap-3">
                                    <Star className="w-5 h-5 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold">Download Party Pack</p>
                                        <p className="text-xs opacity-90">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </main>
                
                <footer className="p-6 bg-slate-900/50 border-t border-slate-700 text-right">
                    <button onClick={onClose} className="py-2 px-6 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg">
                        Done
                    </button>
                </footer>
            </div>

            <div className="absolute -left-[9999px] top-0">
                {matches.map(match => (
                    <PrintableCard
                        key={match.giver.id}
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
                ))}
            </div>

            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ShareLinksModal;