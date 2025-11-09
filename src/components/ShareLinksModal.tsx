import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generateMasterListPdf, generateAllCardsPdf, generatePartyPackPdf } from '../services/pdfService';
import { Copy, Check, X, Link as LinkIcon, MessageSquare, Users, Download, FileText, PartyPopper, QrCode, Smartphone, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ShareLinksModalProps {
  exchangeData: ExchangeData;
  onClose: () => void;
  initialView?: string | null;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ exchangeData, onClose, initialView }) => {
  const [showFullLinks, setShowFullLinks] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
  const [loadingShortLinks, setLoadingShortLinks] = useState(true);
  const [sentLinks, setSentLinks] = useState<Set<string>>(new Set());
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<'cards' | 'master' | 'party' | null>(null);

  const { p: participants, matches: matchIds } = exchangeData;

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const getFullLink = (participantId: string): string => {
    const baseUrl = window.location.href.split(/[?#]/)[0];
    const encodedData = window.location.hash.slice(1);
    return `${baseUrl}?id=${participantId}#${encodedData}`;
  };
  
  const getFullOrganizerLink = (): string => {
      const baseUrl = window.location.href.split(/[?#]/)[0];
      const encodedData = window.location.hash.slice(1);
      return `${baseUrl}#${encodedData}`;
  }

  useEffect(() => {
    const fetchShortLinks = async () => {
      setLoadingShortLinks(true);
      try {
        const linksToShorten = [
            { id: 'organizer', url: getFullOrganizerLink() },
            ...matches.map(m => ({ id: m.giver.id, url: getFullLink(m.giver.id) }))
        ];

        const promises = linksToShorten.map(item => 
          fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(item.url)}`)
            .then(res => res.text())
            .then(shortUrl => ({ id: item.id, shortUrl }))
        );
        const results = await Promise.all(promises);
        const newShortLinks: Record<string, string> = {};
        results.forEach(res => {
          if (res.shortUrl && !res.shortUrl.toLowerCase().includes('error')) {
            newShortLinks[res.id] = res.shortUrl;
          }
        });
        setShortLinks(newShortLinks);
      } catch (e) {
        console.error("TinyURL error", e);
      } finally {
        setLoadingShortLinks(false);
      }
    };
    fetchShortLinks();
  }, [matches]);


  const getLinkForParticipant = (participant: Participant) => {
    return showFullLinks ? getFullLink(participant.id) : (shortLinks[participant.id] || getFullLink(participant.id));
  };
  
  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      if (id !== 'organizer') {
        setSentLinks(prev => new Set(prev).add(id));
      }
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
      trackEvent('copy_link', { link_type: id === 'organizer' ? 'organizer' : 'participant' });
    });
  };
  
  const handleShortenToggle = (checked: boolean) => {
    setShowFullLinks(checked);
    trackEvent('toggle_full_links', { enabled: checked });
  };

  const handleAction = (participant: Participant, type: 'text' | 'whatsapp' | 'qr') => {
    if (type === 'qr') {
        setExpandedQr(expandedQr === participant.id ? null : participant.id);
        trackEvent('view_qr_code');
        return;
    }

    const link = getLinkForParticipant(participant);
    const text = `Hey ${participant.name}, here's your private link for our Secret Santa exchange! 🤫🎁`;
    let url = '';

    if (type === 'text') {
      url = `sms:?&body=${encodeURIComponent(text + '\n\n' + link)}`;
    } else { // whatsapp
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + link)}`;
    }
    window.open(url, '_blank');
    setSentLinks(prev => new Set(prev).add(participant.id));
    trackEvent('share_link', { method: type });
  };
  
  const downloadQrCode = (participant: Participant) => {
    const svg = document.getElementById(`qr-${participant.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Code_for_${participant.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
    trackEvent('download_qr_code');
  };

  const handleDownload = async (type: 'cards' | 'master' | 'party') => {
    setLoadingPdf(type);
    trackEvent('click_download_pdf', { type });
    try {
      if (type === 'cards') await generateAllCardsPdf(exchangeData);
      else if (type === 'master') generateMasterListPdf(exchangeData);
      else generatePartyPackPdf(exchangeData);
    } catch (e) {
      console.error(e);
      alert(`Error: Could not find the printable card for ${e}. Please try again.`);
    } finally {
      setLoadingPdf(null);
    }
  };
  
  const organizerLink = showFullLinks ? getFullOrganizerLink() : (shortLinks['organizer'] || getFullOrganizerLink());

  const DownloadsSection = () => (
    <section>
        <h3 className="text-xl font-bold text-slate-700 mb-4">Downloads & Bulk Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleDownload('cards')} disabled={!!loadingPdf} className="group text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-xl border transition-colors flex items-start gap-4 disabled:opacity-50">
                <Download size={24} className="text-slate-500 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-slate-800">Download All Cards</h4>
                    <p className="text-sm text-slate-500">A PDF with one styled, printable card for each person.</p>
                    {loadingPdf === 'cards' && <p className="text-sm font-semibold text-indigo-600 mt-2 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Processing...</p>}
                </div>
            </button>
             <button onClick={() => handleDownload('master')} disabled={!!loadingPdf} className="group text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-xl border transition-colors flex items-start gap-4 disabled:opacity-50">
                <FileText size={24} className="text-slate-500 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-slate-800">Download Master List</h4>
                    <p className="text-sm text-slate-500">A detailed PDF of all matches for your records.</p>
                    {loadingPdf === 'master' && <p className="text-sm font-semibold text-indigo-600 mt-2 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Processing...</p>}
                </div>
            </button>
        </div>
        <div className="mt-4">
             <button onClick={() => handleDownload('party')} disabled={!!loadingPdf} className="group text-left p-4 bg-purple-100 hover:bg-purple-200 rounded-xl border border-purple-200 w-full transition-colors flex items-start gap-4 disabled:opacity-50">
                <PartyPopper size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-purple-800">Download Party Pack</h4>
                    <p className="text-sm text-purple-700">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                    {loadingPdf === 'party' && <p className="text-sm font-semibold text-purple-600 mt-2 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Processing...</p>}
                </div>
            </button>
        </div>
    </section>
  );

  const LinksSection = () => (
    <>
        {/* Organizer Link */}
        <section className="bg-red-50 p-4 rounded-xl border-2 border-dashed border-red-200">
        <h3 className="font-bold text-lg text-red-800">Your Organizer Master Link</h3>
        <p className="text-sm text-red-700 mt-1 mb-3">Save this link to get back to your results page anytime. Don't lose it!</p>
        <div className="flex items-center gap-2">
            <input type="text" readOnly value={organizerLink} className="w-full p-2 border border-red-200 rounded-md bg-white text-sm truncate" />
            <button onClick={() => handleCopy(organizerLink, 'organizer')} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex-shrink-0">
            {copiedStates['organizer'] ? <Check size={20} /> : <Copy size={20} />}
            </button>
        </div>
        </section>

        {/* Participant Links */}
        <section>
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-xl font-bold text-slate-700">Participant Reveal Links</h3>
                <p className="text-sm text-slate-500">Copy and share each link via Email/Text/WhatsApp or your favorite app.</p>
            </div>
            <div className="flex items-center gap-2">
            <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Show Full Links</label>
            <input type="checkbox" id="shorten-toggle" checked={showFullLinks} onChange={(e) => handleShortenToggle(e.target.checked)} className="toggle-checkbox" />
            </div>
        </div>
        
        <div className="space-y-3">
            {matches.map(({ giver }) => (
            <div key={giver.id} className={`p-4 rounded-xl border transition-all ${sentLinks.has(giver.id) ? 'bg-emerald-50 border-emerald-200 opacity-70' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${sentLinks.has(giver.id) ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {sentLinks.has(giver.id) ? <Check size={24} /> : <Users size={24} />}
                </div>
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800">{giver.name}'s Link</p>
                    <p className="text-sm text-slate-500 truncate">{getLinkForParticipant(giver)}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                    <button onClick={() => handleCopy(getLinkForParticipant(giver), giver.id)} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><Copy size={16}/></button>
                    <button onClick={() => handleAction(giver, 'text')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><Smartphone size={16}/></button>
                    <button onClick={() => handleAction(giver, 'qr')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><QrCode size={16}/></button>
                </div>
                </div>
                {expandedQr === giver.id && (
                    <div className="mt-4 p-4 bg-white rounded-lg text-center border">
                    <h4 className="font-semibold text-slate-700">Scan QR code for {giver.name}'s link</h4>
                    <div className="p-2 bg-white inline-block mt-2">
                        <QRCode id={`qr-${giver.id}`} value={getLinkForParticipant(giver)} size={128} />
                    </div>
                    <button onClick={() => downloadQrCode(giver)} className="mt-3 text-sm text-indigo-600 hover:underline font-semibold">Download QR Code</button>
                    </div>
                )}
            </div>
            ))}
        </div>
        </section>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-6 flex justify-between items-center border-b">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Share & Download</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
        </header>

        <main className="p-6 overflow-y-auto space-y-8">
            {initialView === 'print' ? (
                <>
                    <DownloadsSection />
                    <LinksSection />
                </>
            ) : (
                 <>
                    <LinksSection />
                    <DownloadsSection />
                </>
            )}
        </main>
        <footer className="p-4 bg-slate-50 border-t text-right">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Done</button>
        </footer>
      </div>
       <style>{`
        .toggle-checkbox {
          -webkit-appearance: none;
          appearance: none;
          width: 40px;
          height: 24px;
          background-color: #cbd5e1;
          border-radius: 9999px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
        }
        .toggle-checkbox::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 9999px;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease-in-out;
        }
        .toggle-checkbox:checked {
          background-color: #4f46e5;
        }
        .toggle-checkbox:checked::before {
          transform: translateX(16px);
        }
      `}</style>
    </div>
  );
};

export default ShareLinksModal;
