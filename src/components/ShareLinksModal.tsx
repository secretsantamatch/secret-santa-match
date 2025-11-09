import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import { Copy, Check, Download, PartyPopper, X, Link as LinkIcon, MessageCircle, Smartphone, QrCode, DownloadCloud } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';
import QRCode from "react-qr-code";
import PrintableCard from './PrintableCard';

interface ShareLinksModalProps {
    exchangeData: ExchangeData;
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ exchangeData, onClose }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [showFullLinks, setShowFullLinks] = useState(false);
    const [shortUrls, setShortUrls] = useState<Record<string, string>>({});
    const [organizerShortUrl, setOrganizerShortUrl] = useState<string | null>(null);
    const [isShortening, setIsShortening] = useState(false);
    const [expandedQrCodeId, setExpandedQrCodeId] = useState<string | null>(null);

    const originalOrganizerLink = useMemo(() => {
        const url = new URL(window.location.href);
        url.search = ''; // Remove query params like ?page=success
        return url.href;
    }, []);
    
    const matches: Match[] = useMemo(() => exchangeData.matches.map(m => ({
        giver: exchangeData.p.find(p => p.id === m.g)!,
        receiver: exchangeData.p.find(p => p.id === m.r)!,
    })).filter(m => m.giver && m.receiver), [exchangeData]);

    const participantLinks = useMemo(() => {
        const links: Record<string, string> = {};
        matches.forEach(({ giver }) => {
            const url = new URL(originalOrganizerLink);
            url.searchParams.set('id', giver.id);
            links[giver.id] = url.href;
        });
        return links;
    }, [matches, originalOrganizerLink]);

    useEffect(() => {
        const shortenAll = async () => {
            trackEvent('shorten_all_links');
            const promises = Object.entries(participantLinks).map(async ([id, url]) => {
                try {
                    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                    if (response.ok) {
                        const shortUrl = await response.text();
                        return { id, shortUrl };
                    }
                } catch (e) { console.error("Shorten failed for", id, e); }
                return { id, shortUrl: url }; // Fallback to long url
            });
            const results = await Promise.all(promises);
            const newShortUrls: Record<string, string> = {};
            results.forEach(result => {
                newShortUrls[result.id] = result.shortUrl;
            });
            setShortUrls(newShortUrls);
        };
        shortenAll();
    }, [participantLinks]);

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        trackEvent('copy_share_link', { link_type: id === 'organizer' ? 'organizer' : 'participant' });
    };

    const handleShortenOrganizer = async () => {
        if (organizerShortUrl) return;
        trackEvent('click_shorten_link', { link_type: 'organizer' });
        setIsShortening(true);
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalOrganizerLink)}`);
            if (response.ok) setOrganizerShortUrl(await response.text());
            else throw new Error('Failed to shorten');
        } catch (error) { alert("Could not shorten link."); }
        setIsShortening(false);
    };

    const handleDownload = async (pdfGenerator: (data: ExchangeData) => Promise<void> | void, type: string) => {
        trackEvent('download_pdf', { type });
        setIsPdfLoading(true);
        try {
            await Promise.resolve(pdfGenerator(exchangeData));
        } catch (error) {
            console.error(`Failed to generate ${type} PDF:`, error);
            alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
        }
        setIsPdfLoading(false);
    };

    const getLinkFor = (id: string) => showFullLinks ? participantLinks[id] : (shortUrls[id] || participantLinks[id]);

    const downloadQrCode = (id: string, name: string) => {
        const svg = document.getElementById(`qr-${id}`);
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_Code_for_${name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
        trackEvent('download_qr_code');
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 text-slate-200 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-white font-serif">Share &amp; Download</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-8">
                    {/* Organizer Link */}
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <h3 className="font-bold text-white">Your Organizer Master Link</h3>
                        <p className="text-sm text-slate-300 mb-3">Save this link to get back to your results page anytime. Don't lose it!</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" readOnly value={organizerShortUrl || originalOrganizerLink} className="flex-grow p-2 border border-slate-500 rounded-md bg-slate-900 text-slate-300 text-sm truncate" />
                            <button onClick={handleShortenOrganizer} disabled={isShortening || !!organizerShortUrl} className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <LinkIcon size={16} /> {isShortening ? '...' : 'Shorten'}
                            </button>
                            <button onClick={() => handleCopy('organizer', organizerShortUrl || originalOrganizerLink)} className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                {copiedId === 'organizer' ? <Check size={16}/> : <Copy size={16} />}
                                {copiedId === 'organizer' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Participant Links */}
                    <div>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
                             <div>
                                <h3 className="text-lg font-bold text-white">Participant Reveal Links</h3>
                                <p className="text-sm text-slate-300">Copy, Shorten, or share each link via Text/WhatsApp.</p>
                             </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="link-toggle" className="text-sm font-semibold text-slate-300">Show Full Links</label>
                                <button role="switch" id="link-toggle" aria-checked={showFullLinks} onClick={() => { setShowFullLinks(!showFullLinks); trackEvent('toggle_short_links', { enabled: !showFullLinks }); }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showFullLinks ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showFullLinks ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {matches.map(({ giver }) => (
                                <div key={giver.id} className="bg-slate-700/50 p-3 rounded-lg border border-slate-700 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-grow min-w-0">
                                            <button onClick={() => setExpandedQrCodeId(expandedQrCodeId === giver.id ? null : giver.id)} className="flex-shrink-0 bg-white p-1 rounded-md">
                                                 <QRCode value={shortUrls[giver.id] || participantLinks[giver.id]} size={32} />
                                            </button>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-white">{giver.name}'s Link</p>
                                                <input type="text" readOnly value={getLinkFor(giver.id)} className="w-full bg-transparent text-slate-400 text-xs truncate" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => handleCopy(giver.id, getLinkFor(giver.id))} className={`p-2 rounded-md transition-colors ${copiedId === giver.id ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`} title="Copy Link">
                                                 {copiedId === giver.id ? <Check size={18}/> : <Copy size={18} />}
                                            </button>
                                            <a href={`sms:?&body=Your Secret Santa link from ${exchangeData.eventDetails || 'your group'}: ${encodeURIComponent(getLinkFor(giver.id))}`} className="p-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md transition-colors" title="Send Text"><Smartphone size={18}/></a>
                                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Your Secret Santa link: ' + getLinkFor(giver.id))}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md transition-colors" title="Send WhatsApp"><MessageCircle size={18}/></a>
                                        </div>
                                    </div>
                                    {expandedQrCodeId === giver.id && (
                                        <div className="mt-4 p-4 bg-white rounded-lg text-center animate-fade-in">
                                             <h4 className="font-bold text-slate-800">Scan QR code for {giver.name}'s link</h4>
                                             <div className="mx-auto my-3" style={{ height: "auto", maxWidth: 128, width: "100%" }}>
                                                 <QRCode
                                                    id={`qr-${giver.id}`}
                                                    size={256}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    value={shortUrls[giver.id] || participantLinks[giver.id]}
                                                    viewBox={`0 0 256 256`}
                                                />
                                            </div>
                                            <button onClick={() => downloadQrCode(giver.id, giver.name)} className="flex items-center justify-center gap-2 text-sm w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-3 rounded-md transition-colors">
                                                <DownloadCloud size={16} /> Download QR Code
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Downloads & Bulk Actions */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-3 text-center">Downloads &amp; Bulk Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={() => handleCopy('all-links', matches.map(m => `${m.giver.name}: ${getLinkFor(m.giver.id)}`).join('\n'))} className="text-left bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors">
                                <p className="font-bold text-white flex items-center gap-2"><Copy size={18}/> Copy All Links</p>
                                <p className="text-xs text-slate-300 mt-1">Copy a plain text list of all names and links to your clipboard.</p>
                            </button>
                             <button onClick={() => handleDownload(generateAllCardsPdf, 'all_cards')} disabled={isPdfLoading} className="text-left bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors disabled:opacity-50">
                                <p className="font-bold text-white flex items-center gap-2"><Download size={18}/> Download All Cards</p>
                                <p className="text-xs text-slate-300 mt-1">A PDF with one styled, printable card for each person.</p>
                            </button>
                             <button onClick={() => handleDownload(generateMasterListPdf, 'master_list')} disabled={isPdfLoading} className="text-left bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors disabled:opacity-50">
                                <p className="font-bold text-white flex items-center gap-2"><Download size={18}/> Download Master List</p>
                                <p className="text-xs text-slate-300 mt-1">A simple PDF of all matches for your records.</p>
                            </button>
                            <button onClick={() => handleDownload(generatePartyPackPdf, 'party_pack')} disabled={isPdfLoading} className="text-left bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg transition-colors disabled:opacity-50">
                                <p className="font-bold text-white flex items-center gap-2"><PartyPopper size={18}/> Download Party Pack</p>
                                <p className="text-xs text-indigo-200 mt-1">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-slate-700 text-center">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">Done</button>
                </div>

                 {/* Hidden cards for PDF generation */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '600px', height: '800px' }}>
                    {matches.map(match => (
                         <div key={`pdf-${match.giver.id}`} id={`card-for-pdf-${match.giver.id}`} style={{ width: '600px', height: '800px' }}>
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
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ShareLinksModal;