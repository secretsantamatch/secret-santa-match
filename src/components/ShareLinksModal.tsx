import React, { useState, useEffect, useCallback } from 'react';
import type { Match, ExchangeData } from '../types';
import { Copy, Check, Link, MessageCircle, FileText, Download, Users, Gift, QrCode } from 'lucide-react';
import { generateAllCardsPdf, generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import QRCode from "react-qr-code";

interface ShareLinksModalProps {
  matches: Match[];
  exchangeData: ExchangeData;
  onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, exchangeData, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useShortLinks, setUseShortLinks] = useState(false);
  const [shortLinks, setShortLinks] = useState<Record<string, string>>({});
  const [isShortening, setIsShortening] = useState(false);
  const [masterLink, setMasterLink] = useState('');
  
  useEffect(() => {
    // The master link is just the current URL, which points to the organizer's view.
    setMasterLink(window.location.href);
  }, []);

  const generateLongLink = useCallback((participantId: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const hash = window.location.hash;
    // Ensure the ID is a query param for participant links
    return `${baseUrl}?id=${participantId}${hash}`;
  }, []);

  useEffect(() => {
    const shortenAllLinks = async () => {
      if (useShortLinks && Object.keys(shortLinks).length < matches.length) {
        setIsShortening(true);
        const newShortLinks: Record<string, string> = {};
        for (const match of matches) {
          const longLink = generateLongLink(match.giver.id);
          try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longLink)}`);
            if (response.ok) {
              newShortLinks[match.giver.id] = await response.text();
            } else {
              newShortLinks[match.giver.id] = longLink; // Fallback to long link
            }
          } catch (error) {
            console.error('TinyURL error:', error);
            newShortLinks[match.giver.id] = longLink; // Fallback
          }
        }
        setShortLinks(newShortLinks);
        setIsShortening(false);
      }
    };
    shortenAllLinks();
  }, [useShortLinks, matches, generateLongLink, shortLinks]);


  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  
  const handleCopyAll = () => {
    const allLinksText = matches.map(m => `${m.giver.name}: ${getLink(m.giver.id)}`).join('\n');
    handleCopy(allLinksText, 'copy-all-links');
  };

  const getLink = (id: string) => (useShortLinks ? (shortLinks[id] || 'Generating...') : generateLongLink(id));
  
  const handleDownload = async (type: 'cards' | 'masterlist' | 'partypack') => {
    switch (type) {
      case 'cards':
        await generateAllCardsPdf(exchangeData);
        break;
      case 'masterlist':
        await generateMasterListPdf(exchangeData);
        break;
      case 'partypack':
         await generatePartyPackPdf(exchangeData);
         break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-50 p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-3xl font-bold font-serif text-slate-800">Share & Download</h2>
                <p className="text-slate-600 mt-1">Send each person their unique reveal link. They'll find a link to gift ideas after they reveal their match.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-4xl font-bold">&times;</button>
        </div>
        
        <div className="overflow-y-auto space-y-6 pr-2 flex-grow">
          {/* Master Link */}
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-purple-300">
            <h3 className="font-bold text-lg text-purple-800">Your Organizer Master Link</h3>
            <p className="text-sm text-slate-600 mb-2">Save this link to get back to your results page anytime. Don't lose it!</p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={masterLink} className="w-full p-2 border border-slate-300 rounded-md bg-slate-100 text-slate-600 text-sm" />
              <button onClick={() => handleCopy(masterLink, 'master-link')} className="flex-shrink-0 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm flex items-center gap-2">
                {copiedId === 'master-link' ? <Check size={16} /> : <Copy size={16} />}
                {copiedId === 'master-link' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Participant Links */}
          <div>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-700">Participant Reveal Links</h3>
               <div className="flex items-center gap-2">
                  <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Use Short Links</label>
                  <button role="switch" aria-checked={useShortLinks} onClick={() => setUseShortLinks(!useShortLinks)} id="shorten-toggle" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useShortLinks ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useShortLinks ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
               </div>
            </div>

            <div className="space-y-4">
                {matches.map(({ giver }) => {
                    const link = getLink(giver.id);
                    const isCopied = copiedId === giver.id;
                    return (
                        <div key={giver.id} className="bg-white p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="md:col-span-2">
                                <label className="block text-base font-semibold text-slate-800 mb-1">{giver.name}'s Link</label>
                                <p className="text-sm text-slate-500 break-all">{link}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button onClick={() => handleCopy(link, giver.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${isCopied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                                      {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? 'Copied!' : 'Copy'}
                                    </button>
                                     <a href={`sms:?&body=Your Secret Santa link is ready! 🎁 ${encodeURIComponent(link)}`} className="px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800"><Link size={14} /> Text</a>
                                     <a href={`https://api.whatsapp.com/send?text=Your Secret Santa link is ready! 🎁 ${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800"><MessageCircle size={14} /> WhatsApp</a>
                                </div>
                            </div>
                            <div className="hidden md:flex justify-center items-center bg-white p-1 border rounded-md">
                                <QRCode value={link} size={80} />
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div>
              <h3 className="font-bold text-lg text-slate-700 mb-4 mt-6">Downloads & Bulk Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Copy All Links */}
                <button onClick={handleCopyAll} className="bg-white p-4 rounded-xl border hover:bg-slate-100/50 text-left flex items-start gap-4">
                  <div className="bg-slate-100 text-slate-600 p-3 rounded-lg"><FileText /></div>
                  <div>
                    <p className="font-bold text-slate-800">Copy All Links</p>
                    <p className="text-sm text-slate-500">Copy a plain text list of all names and links to your clipboard.</p>
                  </div>
                </button>
                {/* Download All Cards */}
                <button onClick={() => handleDownload('cards')} className="bg-white p-4 rounded-xl border hover:bg-slate-100/50 text-left flex items-start gap-4">
                  <div className="bg-slate-100 text-slate-600 p-3 rounded-lg"><Download /></div>
                  <div>
                    <p className="font-bold text-slate-800">Download All Cards</p>
                    <p className="text-sm text-slate-500">A PDF with one styled, printable card for each person.</p>
                  </div>
                </button>
                 {/* Download Master List */}
                <button onClick={() => handleDownload('masterlist')} className="bg-white p-4 rounded-xl border hover:bg-slate-100/50 text-left flex items-start gap-4">
                  <div className="bg-slate-100 text-slate-600 p-3 rounded-lg"><Users /></div>
                  <div>
                    <p className="font-bold text-slate-800">Download Master List</p>
                    <p className="text-sm text-slate-500">A simple PDF of all matches for your records.</p>
                  </div>
                </button>
                 {/* Download Party Pack */}
                <button onClick={() => handleDownload('partypack')} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-xl hover:opacity-90 text-left flex items-start gap-4">
                  <div className="bg-white/20 text-white p-3 rounded-lg"><Gift /></div>
                  <div>
                    <p className="font-bold">Download Party Pack</p>
                    <p className="text-sm text-indigo-200">Fun extras for your event, including Secret Santa Bingo and party awards!</p>
                  </div>
                </button>
              </div>
          </div>
        </div>

        <div className="mt-6 text-center">
            <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-8 rounded-lg transition-colors">Done</button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ShareLinksModal;
