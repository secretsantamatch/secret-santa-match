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

// ... [KEEP INTERFACES AND HELPER COMPONENTS UNCHANGED] ...
// (DownloadsSection, LinksSection, preloadImages - Omitted for brevity)

// Placeholder declarations to make the code compile in the response
interface DownloadsSectionProps { handleDownload: any; loadingPdf: any; }
const DownloadsSection: React.FC<DownloadsSectionProps> = () => null; 
interface LinksSectionProps { matches: any; showFullLinks: any; loadingShortLinks: any; getLinkForParticipant: any; organizerLink: any; handleCopy: any; copiedStates: any; sentLinks: any; handleAction: any; expandedQr: any; downloadQrCode: any; loadingPdf: any; setLoadingPdf: any; }
const LinksSection: React.FC<LinksSectionProps> = ({ matches, showFullLinks, loadingShortLinks, getLinkForParticipant, organizerLink, handleCopy, copiedStates, sentLinks, handleAction, expandedQr, downloadQrCode, loadingPdf, setLoadingPdf }) => {
    // ... [KEEP EXISTING IMPLEMENTATION OF LinksSection - Omitted for brevity but crucial to keep] ...
    // Assuming the user will retain the existing LinksSection code.
    return (<div>Placeholder for LinksSection</div>);
};
// Helper to satisfy TypeScript in this snippet
const preloadImages = (urls: string[]) => Promise.resolve([]);


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
  const compressedHash = useMemo(() => {
      const { backgroundOptions, ...baseData } = exchangeData;
      
      const stableData = {
          ...baseData,
          p: baseData.p.map(p => ({
              id: p.id,
              name: p.name,
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
    const shortenUrl = async (url: string, uniqueKey: string) => {
        try {
            // UPDATE: Pass uniqueKey for stable link generation
            const res = await fetch('/.netlify/functions/create-short-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fullUrl: url,
                    uniqueKey: uniqueKey // STABLE KEY
                })
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
        
        // Map participants to their shortening promises with UNIQUE KEYS
        const linksToShorten = matches.map(m => ({ 
            id: m.giver.id, 
            url: getFullLink(m.giver.id),
            uniqueKey: `participant_${exchangeData.id}_${m.giver.id}`
        }));
        
        // Add organizer link
        linksToShorten.push({ 
            id: 'organizer', 
            url: getFullOrganizerLink(),
            uniqueKey: `organizer_${exchangeData.id}`
        });

        const promises = linksToShorten.map(item => 
            shortenUrl(item.url, item.uniqueKey).then(shortUrl => ({ id: item.id, shortUrl }))
        );
        
        const results = await Promise.all(promises);
        const newShortLinks: Record<string, string> = {};
        results.forEach(result => { newShortLinks[result.id] = result.shortUrl; });
        setShortLinks(newShortLinks);
        setLoadingShortLinks(false);
    };

    fetchAllShortLinks();
  }, [compressedHash, exchangeData.id]); // Re-run if hash or exchange ID changes

  // ... [KEEP REMAINING HANDLERS UNCHANGED] ...
  const getLinkForParticipant = (participant: Participant) => !showFullLinks ? (shortLinks[participant.id] || getFullLink(participant.id)) : getFullLink(participant.id);
  const handleCopy = (textToCopy: string, id: string) => { navigator.clipboard.writeText(textToCopy).then(() => { setCopiedStates(prev => ({ ...prev, [id]: true })); if (id !== 'organizer' && id !== 'all-links') setSentLinks(prev => new Set(prev).add(id)); setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000); trackEvent('copy_link', { link_type: id }); }); };
  const handleShortenToggle = (checked: boolean) => { setShowFullLinks(!checked); trackEvent('toggle_short_links', { enabled: checked }); };
  const handleAction = (participant: Participant, type: 'text' | 'whatsapp' | 'qr') => { if (type === 'qr') { setExpandedQr(prev => (prev === participant.id ? null : participant.id)); trackEvent('show_qr_code', { participant_name: participant.name }); return; } const link = getLinkForParticipant(participant); const message = `Hi ${participant.name}, here is your private link to reveal who you are the Secret Santa for! 🤫\n${link}`; const smsUrl = `sms:?&body=${encodeURIComponent(message)}`; const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`; window.open(type === 'text' ? smsUrl : whatsappUrl, '_blank'); setSentLinks(prev => new Set(prev).add(participant.id)); trackEvent('share_link', { type, participant_name: participant.name }); };
  const downloadQrCode = (participant: Participant) => { const svg = document.getElementById(`qr-code-svg-${participant.id}`); if (svg) { const svgData = new XMLSerializer().serializeToString(svg); const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d"); const img = new Image(); img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx!.drawImage(img, 0, 0); const pngFile = canvas.toDataURL("image/png"); const downloadLink = document.createElement("a"); downloadLink.download = `SecretSanta_QR_${participant.name}.png`; downloadLink.href = pngFile; downloadLink.click(); }; img.src = "data:image/svg+xml;base64," + btoa(svgData); trackEvent('download_qr_code', { participant_name: participant.name }); } };
  const handleDownload = async (type: 'cards' | 'master' | 'party') => { setLoadingPdf(type); try { if (type === 'cards') { await preloadImages(imageUrlsToPreload); await generateAllCardsPdf(exchangeData); } if (type === 'master') generateMasterListPdf(exchangeData); if (type === 'party') await generatePartyPackPdf(); trackEvent('download_pdf', { type }); } catch (error) { console.error(`Error generating ${type} PDF:`, error); alert(`Sorry, there was an error generating the cards PDF. Please try again.`); } finally { setTimeout(() => setLoadingPdf(null), 1000); } };
  
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
                // This refers to the LinksSection component defined above (which I omitted for brevity in the response but should exist)
                // In a real file, you would import or define LinksSection fully.
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