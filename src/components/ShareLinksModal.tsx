import React, { useState, useEffect, useMemo } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { generateMasterListPdf, generateAllCardsPdf, generatePartyPackPdf } from '../services/pdfService';
import { Copy, Check, X, Smartphone, Users, Download, FileText, PartyPopper, QrCode, Loader2, Eye, EyeOff } from 'lucide-react';
import QRCode from 'react-qr-code';
import PrintableCard from './PrintableCard';

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
  const [loadingPdf, setLoadingPdf] = useState<'cards' | 'master' | 'party' | 'all-links' | null>(null);

  const { p: participants, matches: matchIds, id: exchangeId, views } = exchangeData;

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const getFullLink = (participantId: string): string => `${window.location.origin}/generator.html#${exchangeId}?id=${participantId}`;
  const getFullOrganizerLink = (): string => `${window.location.origin}/generator.html#${exchangeId}`;

  useEffect(() => {
    // ... link shortening logic remains the same ...
  }, [matches, exchangeId]);


  const getLinkForParticipant = (participant: Participant) => !showFullLinks ? (shortLinks[participant.id] || getFullLink(participant.id)) : getFullLink(participant.id);
  
  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      if (id !== 'organizer' && id !== 'all-links') setSentLinks(prev => new Set(prev).add(id));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
      trackEvent('copy_link', { link_type: id });
    });
  };

  const handleCopyAllLinks = () => { /* ... */ };
  const handleShortenToggle = (checked: boolean) => { /* ... */ };
  const handleAction = (participant: Participant, type: 'text' | 'whatsapp' | 'qr') => { /* ... */ };
  const downloadQrCode = (participant: Participant) => { /* ... */ };
  const handleDownload = async (type: 'cards' | 'master' | 'party') => { /* ... */ };
  
  const organizerLink = !showFullLinks ? (shortLinks['organizer'] || getFullOrganizerLink()) : getFullOrganizerLink();

  const DownloadsSection = () => (
    <section>
        <h3 className="text-xl font-bold text-slate-700 mb-4">Downloads & Bulk Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{/* ... download buttons ... */}</div>
    </section>
  );

  const LinksSection = () => (
    <>
        <section className="bg-red-50 p-4 rounded-xl border-2 border-dashed border-red-200">{/* ... organizer link ... */}</section>
        <section>
        <div className="flex justify-between items-center mb-4">{/* ... section header and toggle ... */}</div>
        
        <div className="space-y-3">
            {matches.map(({ giver }) => {
                const isViewed = !!views?.[giver.id];
                const hasBeenSent = sentLinks.has(giver.id);
                const statusColor = isViewed ? 'emerald' : (hasBeenSent ? 'sky' : 'yellow');

                return (
                    <div key={giver.id} className={`p-4 rounded-xl border transition-all bg-${statusColor}-50 border-${statusColor}-200`}>
                        <div className="flex items-center gap-4">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-${statusColor}-200 text-${statusColor}-700`}>
                                {isViewed ? <Eye size={20} /> : <EyeOff size={20} />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-slate-800">{giver.name}'s Link</p>
                                <p className={`text-sm font-semibold text-${statusColor}-600`}>
                                    Status: {isViewed ? 'Viewed' : (hasBeenSent ? 'Sent' : 'Pending')}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1.5">
                                <button onClick={() => handleCopy(getLinkForParticipant(giver), giver.id)} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><Copy size={16}/></button>
                                <button onClick={() => handleAction(giver, 'text')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><Smartphone size={16}/></button>
                                <button onClick={() => handleAction(giver, 'qr')} className="p-2 bg-white hover:bg-slate-100 rounded-md border text-slate-600"><QrCode size={16}/></button>
                            </div>
                        </div>
                        {expandedQr === giver.id && (
                            <div className="mt-4 p-4 bg-white rounded-lg text-center border">{/* ... QR Code display ... */}</div>
                        )}
                    </div>
                );
            })}
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
        <main className="p-6 overflow-y-auto space-y-8">{/* ... content ... */}</main>
        <footer className="p-4 bg-slate-50 border-t text-right">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Done</button>
        </footer>
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>{/* ... hidden printable cards ... */}</div>
    </div>
  );
};

export default ShareLinksModal;