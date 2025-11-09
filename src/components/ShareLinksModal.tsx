import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import { trackEvent } from '../services/analyticsService';
import { X, Copy, Check, Link as LinkIcon, MessageSquare, Download, QrCode, Users, Star, FileText } from 'lucide-react';
import QRCode from 'react-qr-code';
import PrintableCard from './PrintableCard';

interface ShareLinksModalProps {
  exchangeData: ExchangeData;
  onClose: () => void;
  initialView?: string | null;
}

interface LinkState {
    full: string;
    short: string;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ exchangeData, onClose, initialView }) => {
  const [organizerLink, setOrganizerLink] = useState<LinkState>({ full: '', short: '' });
  const [participantLinks, setParticipantLinks] = useState<Record<string, LinkState>>({});
  const [useShortLinks, setUseShortLinks] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [activeQr, setActiveQr] = useState<string | null>(null);

  const { p: participants, matches: matchIds } = exchangeData;
  
  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  useEffect(() => {
    const shortenUrl = async (url: string): Promise<string> => {
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            if (!response.ok) return url;
            return await response.text();
        } catch (error) {
            console.error("TinyURL error:", error);
            return url;
        }
    };

    const setupLinks = async () => {
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        const encodedHash = window.location.hash.substring(1);

        const fullOrganizerUrl = `${baseUrl}#${encodedHash}`;
        const shortOrganizerUrl = await shortenUrl(fullOrganizerUrl);
        setOrganizerLink({ full: fullOrganizerUrl, short: shortOrganizerUrl });

        const newParticipantLinks: Record<string, LinkState> = {};
        for (const { giver } of matches) {
            const fullUrl = `${baseUrl}?page=results&id=${giver.id}#${encodedHash}`;
            const shortUrl = await shortenUrl(fullUrl);
            newParticipantLinks[giver.id] = { full: fullUrl, short: shortUrl };
        }
        setParticipantLinks(newParticipantLinks);
    };

    setupLinks();
  }, [exchangeData, matches]);

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
    trackEvent('copy_share_link', { link_type: id === 'organizer' ? 'organizer' : 'participant', short: useShortLinks });
  };
  
  const handleCopyAll = () => {
      const allLinksText = matches.map(({ giver }) => {
          const url = useShortLinks ? participantLinks[giver.id]?.short : participantLinks[giver.id]?.full;
          return `${giver.name}'s Link: ${url}`;
      }).join('\n');
      handleCopy('copy-all', allLinksText);
  };
  
  const handlePdfDownload = async (type: 'cards' | 'masterlist' | 'partypack') => {
      setIsPdfLoading(true);
      try {
          if (type === 'cards') {
              await generateAllCardsPdf(exchangeData);
              trackEvent('download_pdf', { type: 'cards' });
          } else if (type === 'masterlist') {
              await generateMasterListPdf(exchangeData);
              trackEvent('download_pdf', { type: 'masterlist' });
          } else if (type === 'partypack') {
              generatePartyPackPdf(exchangeData);
              trackEvent('download_pdf', { type: 'partypack' });
          }
      } catch (error) {
          console.error(`Error generating ${type} PDF:`, error);
          alert(`Error: ${error instanceof Error ? error.message : 'Could not generate the PDF.'} This may be a bug.`);
      }
      setIsPdfLoading(false);
  };
  
  const downloadQrCode = (giverId: string) => {
    const linkState = participantLinks[giverId];
    if (!linkState) return;
    const url = linkState.short || linkState.full;

    const svg = document.getElementById(`qr-${giverId}`);
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
        const giverName = matches.find(m => m.giver.id === giverId)?.giver.name || 'participant';
        downloadLink.download = `QR_Code_for_${giverName}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const getDisplayedUrl = (linkState?: LinkState) => (useShortLinks ? linkState?.short : linkState?.full) || linkState?.full || '';

  const renderDownloads = () => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-200">Downloads & Bulk Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handlePdfDownload('cards')} className="bg-slate-700/50 hover:bg-slate-600/50 p-4 rounded-xl text-left transition-colors flex items-start gap-4">
                <Download className="w-6 h-6 text-slate-300 mt-1 flex-shrink-0"/>
                <div>
                    <p className="font-bold text-white">Download All Cards</p>
                    <p className="text-sm text-slate-300">A PDF with one styled, printable card for each person.</p>
                </div>
            </button>
            <button onClick={() => handlePdfDownload('masterlist')} className="bg-slate-700/50 hover:bg-slate-600/50 p-4 rounded-xl text-left transition-colors flex items-start gap-4">
                <FileText className="w-6 h-6 text-slate-300 mt-1 flex-shrink-0"/>
                <div>
                    <p className="font-bold text-white">Download Master List</p>
                    <p className="text-sm text-slate-300">A simple PDF of all matches for your records.</p>
                </div>
            </button>
             <button onClick={handleCopyAll} className="bg-slate-700/50 hover:bg-slate-600/50 p-4 rounded-xl text-left transition-colors flex items-start gap-4 sm:col-span-2">
                <Copy className="w-6 h-6 text-slate-300 mt-1 flex-shrink-0"/>
                <div>
                    <p className="font-bold text-white">Copy All Links</p>
                    <p className="text-sm text-slate-300">Copy a plain text list of all names and links to your clipboard.</p>
                </div>
            </button>
            <button onClick={() => handlePdfDownload('partypack')} className="bg-purple-600 hover:bg-purple-500 p-4 rounded-xl text-left transition-colors flex items-start gap-4 sm:col-span-2">
                <Star className="w-6 h-6 text-purple-300 mt-1 flex-shrink-0"/>
                <div>
                    <p className="font-bold text-white">Download Party Pack</p>
                    <p className="text-sm text-purple-200">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                </div>
            </button>
        </div>
    </div>
  );

  const renderLinksSection = () => (
      <div className="space-y-4">
          <div className="bg-slate-700 p-4 rounded-xl">
            <h3 className="font-bold text-lg text-white mb-2">Your Organizer Master Link</h3>
            <p className="text-sm text-slate-300 mb-3">Save this link to get back to your results page anytime. Don't lose it!</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" readOnly value={getDisplayedUrl(organizerLink)} className="w-full p-2 border border-slate-500 bg-slate-800 text-slate-200 rounded-md text-sm truncate"/>
                <button onClick={() => handleCopy('organizer', getDisplayedUrl(organizerLink))} className={`w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${copiedStates['organizer'] ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                    {copiedStates['organizer'] ? <Check size={16}/> : <Copy size={16}/>}
                    {copiedStates['organizer'] ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>

        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
                <h3 className="font-bold text-lg text-slate-200">Participant Reveal Links</h3>
                <div className="flex items-center">
                    <label htmlFor="short-link-toggle" className="mr-2 block text-sm font-medium text-slate-300">Show Full Links</label>
                    <input
                        type="checkbox"
                        id="short-link-toggle"
                        checked={!useShortLinks}
                        onChange={() => { setUseShortLinks(!useShortLinks); trackEvent('toggle_short_links', { enabled: !useShortLinks }); }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">Copy, shorten, or share each link via Text/WhatsApp.</p>
            <div className="space-y-3">
                {matches.map(({ giver }) => (
                <div key={giver.id} className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-10 h-10 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-slate-300"/></div>
                        <div className="flex-grow min-w-0">
                            <p className="font-semibold text-white">{giver.name}'s Link</p>
                            <p className="text-xs text-slate-300 truncate">{getDisplayedUrl(participantLinks[giver.id])}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => handleCopy(giver.id, getDisplayedUrl(participantLinks[giver.id]))} className={`p-2 rounded-md ${copiedStates[giver.id] ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'}`}><span className="sr-only">Copy</span>{copiedStates[giver.id] ? <Check size={16} className="text-white"/> : <Copy size={16} className="text-slate-200"/>}</button>
                            <a href={`sms:?&body=Your Secret Santa link is: ${getDisplayedUrl(participantLinks[giver.id])}`} className="p-2 rounded-md bg-slate-600 hover:bg-slate-500"><span className="sr-only">Text</span><MessageSquare size={16} className="text-slate-200"/></a>
                            <button onClick={() => setActiveQr(activeQr === giver.id ? null : giver.id)} className="p-2 rounded-md bg-slate-600 hover:bg-slate-500"><span className="sr-only">QR Code</span><QrCode size={16} className="text-slate-200"/></button>
                        </div>
                    </div>
                    {activeQr === giver.id && (
                        <div className="mt-4 p-4 bg-white rounded-lg text-center animate-fade-in-fast">
                             <h4 className="font-bold text-slate-800">Scan QR code for {giver.name}'s link</h4>
                             <div className="my-4 max-w-[150px] mx-auto"><QRCode id={`qr-${giver.id}`} value={getDisplayedUrl(participantLinks[giver.id])} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} /></div>
                             <button onClick={() => downloadQrCode(giver.id)} className="text-sm text-indigo-600 hover:underline font-semibold">Download QR Code</button>
                        </div>
                    )}
                </div>
                ))}
            </div>
        </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 text-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-serif">Share & Download</h2>
            <p className="text-slate-300 text-sm mt-1">Send each person their unique reveal link.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700"><X size={20}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
            {initialView === 'print' ? (
                <>
                    {renderDownloads()}
                    <div className="border-t border-slate-700 pt-8 mt-8">{renderLinksSection()}</div>
                </>
            ) : (
                <>
                    {renderLinksSection()}
                    <div className="border-t border-slate-700 pt-8 mt-8">{renderDownloads()}</div>
                </>
            )}
            
            {/* Hidden cards for PDF generation */}
            {isPdfLoading && (
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                    {matches.map(match => (
                        <div key={`pdf-${match.giver.id}`} id={`card-${match.giver.id}`} style={{ width: '600px', height: '800px' }}>
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
            )}
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-right">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors">
            Done
          </button>
        </div>
      </div>
       <style>{`
            @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default ShareLinksModal;