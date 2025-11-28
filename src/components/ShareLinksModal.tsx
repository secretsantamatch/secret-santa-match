
import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generateMasterListPdf, generateAllCardsPdf, generatePartyPackPdf } from '../services/pdfService';
import { Copy, Check, X, Smartphone, Users, Download, FileText, PartyPopper, QrCode, Loader2, Link, MessageCircle, Search } from 'lucide-react';
import QRCode from 'react-qr-code';
import PrintableCard from './PrintableCard';
import { compressData } from '../services/urlService';

interface ShareLinksModalProps {
  exchangeData: ExchangeData;
  onClose: () => void;
  initialView?: string | null;
}

interface DownloadsSectionProps {
    handleDownload: (type: 'cards' | 'master' | 'party') => Promise<void>;
    loadingPdf: 'cards' | 'master' | 'party' | 'all-links' | null;
}

interface LinksSectionProps {
    matches: Match[];
    showFullLinks: boolean;
    loadingShortLinks: boolean;
    getLinkForParticipant: (participant: Participant) => string;
    organizerLink: string;
    handleCopy: (textToCopy: string, id: string) => void;
    copiedStates: Record<string, boolean>;
    sentLinks: Set<string>;
    handleAction: (participant: Participant, type: 'text' | 'whatsapp' | 'qr') => void;
    expandedQr: string | null;
    downloadQrCode: (participant: Participant) => void;
    loadingPdf: 'cards' | 'master' | 'party' | 'all-links' | null;
    setLoadingPdf: React.Dispatch<React.SetStateAction<'cards' | 'master' | 'party' | 'all-links' | null>>;
}


const preloadImages = (urls: string[]): Promise<void[]> => {
    const promises = urls.map(url => {
        return new Promise<void>((resolve) => {
            if (!url) { 
                resolve();
                return;
            }
            const img = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => {
                console.warn(`Could not preload image: ${url}`);
                resolve(); 
            };
        });
    });
    return Promise.all(promises);
};

const DownloadsSection: React.FC<DownloadsSectionProps> = ({ handleDownload, loadingPdf }) => (
    <section className="flex flex-col h-full">
        <h3 className="text-2xl font-bold text-slate-700 mb-6 text-center">Downloads & Bulk Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
            <button 
                onClick={() => handleDownload('cards')} 
                disabled={!!loadingPdf} 
                className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-100 hover:bg-emerald-200 rounded-2xl font-bold text-lg text-emerald-800 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md min-h-[170px]">
                {loadingPdf === 'cards' ? <Loader2 className="animate-spin h-8 w-8" /> : <Download className="h-8 w-8" />}
                <span>Download All Cards (PDF)</span>
                <span className="text-sm font-normal text-emerald-700/80 mt-1">For your guests. Download and print a card for each person.</span>
            </button>
            <button 
                onClick={() => handleDownload('master')} 
                disabled={!!loadingPdf} 
                className="flex flex-col items-center justify-center gap-2 p-6 bg-sky-100 hover:bg-sky-200 rounded-2xl font-bold text-lg text-sky-800 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md min-h-[170px]">
                {loadingPdf === 'master' ? <Loader2 className="animate-spin h-8 w-8" /> : <FileText className="h-8 w-8" />}
                <span>Download Master List (PDF)</span>
                <span className="text-sm font-normal text-sky-700/80 mt-1">For the organizer. A list of all matches & wishlists.</span>
            </button>
            <button 
                onClick={() => handleDownload('party')} 
                disabled={!!loadingPdf} 
                className="flex flex-col items-center justify-center gap-2 p-6 bg-violet-100 hover:bg-violet-200 rounded-2xl font-bold text-lg text-violet-800 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md min-h-[170px] md:col-span-2">
                {loadingPdf === 'party' ? <Loader2 className="animate-spin h-8 w-8" /> : <PartyPopper className="h-8 w-8" />}
                <span>Download Party Pack</span>
                <span className="text-sm font-normal text-violet-700/80 mt-1">Fun games and extras for your in-person party.</span>
            </button>
        </div>
    </section>
);

const LinksSection: React.FC<LinksSectionProps> = ({
    matches, showFullLinks, loadingShortLinks, getLinkForParticipant, organizerLink,
    handleCopy, copiedStates, sentLinks, handleAction, expandedQr, downloadQrCode,
    loadingPdf, setLoadingPdf
}) => {
    const [searchTerm, setSearchTerm] = useState('');
  
    const filteredMatches = useMemo(() => {
        if (!searchTerm) {
            return matches;
        }
        return matches.filter(({ giver }) => 
            giver.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [matches, searchTerm]);
      
    const handleCopyAllLinks = () => {
      setLoadingPdf('all-links');
      const allLinksText = filteredMatches.map(({ giver }) => `${giver.name}: ${getLinkForParticipant(giver)}`).join('\n');
      handleCopy(allLinksText, 'all-links');
      setTimeout(() => setLoadingPdf(null), 1000);
    };

    return (
    <>
        <section className="bg-emerald-50 p-4 rounded-xl border-2 border-dashed border-emerald-200">
            <h3 className="text-lg font-bold text-emerald-800 text-center">Your Organizer Master Link</h3>
            <p className="text-sm text-emerald-700 text-center mt-1 mb-3">Save this! It's the only way for you to get back to this page.</p>
            <div className="flex items-center gap-2">
                <input type="text" readOnly value={organizerLink} className="w-full p-2 border border-emerald-200 rounded-md bg-white text-sm" />
                <button onClick={() => handleCopy(organizerLink, 'organizer')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold p-2 rounded-md transition-colors flex-shrink-0">
                    {copiedStates['organizer'] ? <Check size={20} /> : <Copy size={20} />}
                </button>
            </div>
        </section>

        <section className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Users /> Participant Links</h3>
            </div>

            <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                 <input 
                    type="search"
                    placeholder="Search for a participant..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border border-slate-300 rounded-md"
                 />
            </div>
            
            <div className="hidden md:grid grid-cols-[auto,1fr,auto] items-center gap-x-4 px-4 pb-2 text-xs text-slate-500 font-semibold">
                <div />
                <div />
                <div className="flex items-center gap-1.5 ml-auto text-center">
                    <div className="w-8">Copy</div>
                    <div className="w-8">Text</div>
                    <div className="w-8">Chat</div>
                    <div className="w-8">QR</div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map(({ giver }) => {
                        const hasBeenSent = sentLinks.has(giver.id);
                        const statusColor = hasBeenSent ? 'emerald' : 'slate';
                        const statusText = hasBeenSent ? 'Sent' : 'Not yet sent';

                        return (
                            <div key={giver.id} className={`p-4 rounded-xl border transition-all bg-white`}>
                                <div className="grid grid-cols-[auto,1fr,auto] items-center gap-x-4 gap-y-2">
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-${statusColor}-100 text-${statusColor}-700`}>
                                        {hasBeenSent ? <Check size={18} /> : <Link size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{giver.name}'s Link</p>
                                        <p className={`text-xs font-semibold text-${statusColor}-600`}>
                                            Status: {statusText}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-1.5 ml-auto">
                                        <button title="Copy Link" onClick={() => handleCopy(getLinkForParticipant(giver), giver.id)} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600">
                                            {copiedStates[giver.id] ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                                        </button>
                                        <button title="Send via Text" onClick={() => handleAction(giver, 'text')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><Smartphone size={16}/></button>
                                        <button title="Send via WhatsApp" onClick={() => handleAction(giver, 'whatsapp')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><MessageCircle size={16}/></button>
                                        <button title="Show QR Code" onClick={() => handleAction(giver, 'qr')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><QrCode size={16}/></button>
                                    </div>
                                </div>
                                <div className="mt-2 pl-12">
                                    <input 
                                        type="text"
                                        readOnly
                                        value={loadingShortLinks ? "Generating short link..." : getLinkForParticipant(giver)}
                                        className="w-full p-1.5 border border-slate-300 rounded-md bg-slate-50 text-sm text-slate-600 truncate"
                                    />
                                </div>
                                {expandedQr === giver.id && (
                                    <div className="mt-4 p-4 bg-white rounded-lg text-center border">
                                        <h4 className="font-bold mb-2">QR Code for {giver.name}</h4>
                                        <div className="flex justify-center">
                                          <QRCode id={`qr-code-svg-${giver.id}`} value={getLinkForParticipant(giver)} size={128} />
                                        </div>
                                        <button onClick={() => downloadQrCode(giver)} className="mt-3 text-sm text-indigo-600 font-semibold hover:underline">Download QR Code</button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                     <p className="text-center text-slate-500 py-4">No participants found.</p>
                )}
            </div>
             <div className="mt-6">
                <button 
                    onClick={handleCopyAllLinks} 
                    disabled={!!loadingPdf || filteredMatches.length === 0} 
                    className="w-full flex items-center justify-center gap-2 p-4 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingPdf === 'all-links' ? <Check /> : <Copy />} {loadingPdf === 'all-links' ? 'Copied!' : 'Copy All Links to Clipboard'}
                </button>
            </div>
        </section>
    </>
    );
};

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ exchangeData, onClose, initialView }) => {
  const [activeTab, setActiveTab] = useState(initialView === 'print' ? 'downloads' : 'links');
  const [showFullLinks, setShowFullLinks] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
  const [loadingShortLinks, setLoadingShortLinks] = useState(true);
  const [sentLinks, setSentLinks] = useState<Set<string>>(new Set());
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<'cards' | 'master' | 'party' | 'all-links' | null>(null);
  
  const { p: participants, matches: matchIds } = exchangeData;
  
  // SANITIZE DATA FOR URL HASH
  // We strip out mutable fields (interests, likes, dislikes, links, budget)
  // so the URL hash remains stable even if the user updates their wishlist in the background.
  const compressedHash = useMemo(() => {
      const { backgroundOptions, ...baseData } = exchangeData;
      
      const stableData = {
          ...baseData,
          p: baseData.p.map(p => ({
              id: p.id,
              name: p.name,
              // Empty mutable fields to ensure stable URL generation
              interests: '',
              likes: '',
              dislikes: '',
              links: [],
              budget: ''
          }))
      };
      
      return compressData(stableData);
  }, [exchangeData]);

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);
  
  const imageUrlsToPreload = useMemo(() => {
    const urls = new Set<string>();
    const bgOption = exchangeData.backgroundOptions.find(opt => opt.id === exchangeData.bgId);
    
    if (exchangeData.bgId === 'custom' && exchangeData.customBackground) {
        urls.add(exchangeData.customBackground);
    } else if (bgOption?.imageUrl) {
        urls.add(bgOption.imageUrl);
    }
    return Array.from(urls);
  }, [exchangeData.bgId, exchangeData.customBackground, exchangeData.backgroundOptions]);


  const getFullLink = (participantId: string): string => `${window.location.origin}/generator.html#${compressedHash}?id=${participantId}`;
  const getFullOrganizerLink = (): string => `${window.location.origin}/generator.html#${compressedHash}`;

  useEffect(() => {
    const shortenUrl = async (url: string) => {
        try {
            const res = await fetch('/.netlify/functions/create-short-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullUrl: url })
            });
            if (res.ok) {
                const data = await res.json();
                return data.shortUrl || url;
            }
        } catch (e) { console.error("Shortener error:", e); }
        return url;
    };

    const fetchAllShortLinks = async () => {
        setLoadingShortLinks(true);
        const linksToShorten = matches.map(m => ({ id: m.giver.id, url: getFullLink(m.giver.id) }));
        linksToShorten.push({ id: 'organizer', url: getFullOrganizerLink() });
        const promises = linksToShorten.map(item => shortenUrl(item.url).then(shortUrl => ({ id: item.id, shortUrl })));
        const results = await Promise.all(promises);
        const newShortLinks: Record<string, string> = {};
        results.forEach(result => { newShortLinks[result.id] = result.shortUrl; });
        setShortLinks(newShortLinks);
        setLoadingShortLinks(false);
    };

    fetchAllShortLinks();
  }, [compressedHash]); // Only re-run if compressedHash changes (which is now stable)

  const getLinkForParticipant = (participant: Participant) => !showFullLinks ? (shortLinks[participant.id] || getFullLink(participant.id)) : getFullLink(participant.id);
  
  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      if (id !== 'organizer' && id !== 'all-links') setSentLinks(prev => new Set(prev).add(id));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
      trackEvent('copy_link', { link_type: id });
    });
  };

  const handleShortenToggle = (checked: boolean) => {
      setShowFullLinks(!checked);
      trackEvent('toggle_short_links', { enabled: checked });
  };
  
  const handleAction = (participant: Participant, type: 'text' | 'whatsapp' | 'qr') => {
      if (type === 'qr') {
          setExpandedQr(prev => (prev === participant.id ? null : participant.id));
          trackEvent('show_qr_code', { participant_name: participant.name });
          return;
      }
      const link = getLinkForParticipant(participant);
      const message = `Hi ${participant.name}, here is your private link to reveal who you are the Secret Santa for! 🤫\n${link}`;
      const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      
      window.open(type === 'text' ? smsUrl : whatsappUrl, '_blank');
      setSentLinks(prev => new Set(prev).add(participant.id));
      trackEvent('share_link', { type, participant_name: participant.name });
  };
  
  const downloadQrCode = (participant: Participant) => {
    const svg = document.getElementById(`qr-code-svg-${participant.id}`);
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx!.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `SecretSanta_QR_${participant.name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
        trackEvent('download_qr_code', { participant_name: participant.name });
    }
  };

  const handleDownload = async (type: 'cards' | 'master' | 'party') => {
    setLoadingPdf(type);
    try {
        if (type === 'cards') {
            await preloadImages(imageUrlsToPreload);
            await generateAllCardsPdf(exchangeData);
        }
        if (type === 'master') generateMasterListPdf(exchangeData);
        if (type === 'party') await generatePartyPackPdf();
        trackEvent('download_pdf', { type });
    } catch (error) {
        console.error(`Error generating ${type} PDF:`, error);
        alert(`Sorry, there was an error generating the cards PDF. Please try again.`);
    } finally {
        setTimeout(() => setLoadingPdf(null), 1000);
    }
  };
  
  const organizerLink = !showFullLinks ? (shortLinks['organizer'] || getFullOrganizerLink()) : getFullOrganizerLink();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border-4 border-white" onClick={e => e.stopPropagation()}>
        <header className="p-4 flex justify-between items-center border-b bg-white">
            <div className="relative bg-slate-200 p-1 rounded-full flex items-center w-64 h-12">
                <div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out"
                    style={{
                        transform: activeTab === 'downloads' ? 'translateX(calc(100% + 4px))' : 'translateX(4px)'
                    }}
                ></div>
                <button
                    onClick={() => setActiveTab('links')}
                    className={`relative z-10 flex h-full flex-1 items-center justify-center font-semibold text-base transition-colors ${
                        activeTab === 'links' ? 'text-emerald-800' : 'text-slate-500'
                    }`}
                >
                    Links
                </button>
                <button
                    onClick={() => setActiveTab('downloads')}
                    className={`relative z-10 flex h-full flex-1 items-center justify-center font-semibold text-base transition-colors ${
                        activeTab === 'downloads' ? 'text-sky-800' : 'text-slate-500'
                    }`}
                >
                    Downloads
                </button>
            </div>
             <div className="flex items-center gap-2">
                    <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Short Links</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="shorten-toggle" id="shorten-toggle" checked={!showFullLinks} onChange={(e) => handleShortenToggle(e.target.checked)} disabled={loadingShortLinks} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="shorten-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
        </header>
        <main className="p-6 overflow-y-auto min-h-[500px] flex flex-col gap-8">
            {activeTab === 'links' ? (
                <LinksSection
                    matches={matches}
                    showFullLinks={showFullLinks}
                    loadingShortLinks={loadingShortLinks}
                    getLinkForParticipant={getLinkForParticipant}
                    organizerLink={organizerLink}
                    handleCopy={handleCopy}
                    copiedStates={copiedStates}
                    sentLinks={sentLinks}
                    handleAction={handleAction}
                    expandedQr={expandedQr}
                    downloadQrCode={downloadQrCode}
                    loadingPdf={loadingPdf}
                    setLoadingPdf={setLoadingPdf}
                />
            ) : (
                <DownloadsSection
                    handleDownload={handleDownload}
                    loadingPdf={loadingPdf}
                />
            )}
        </main>
        <footer className="p-4 bg-white border-t text-right">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Done</button>
        </footer>
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
        {matches.map(match => (
            <div key={match.giver.id} id={`card-for-pdf-${match.giver.id}`} className="printable-card-container w-[500px]">
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
                    isForPdf={true}
                    showLinks={false}
                 />
            </div>
        ))}
      </div>
      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #c62828; }
        .toggle-checkbox:checked + .toggle-label { background-color: #c62828; }
      `}</style>
    </div>
  );
};
