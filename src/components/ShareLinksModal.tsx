import React, { useState, useEffect, useMemo } from 'react';
import type { Match, Participant, BackgroundOption } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Copy, Check, MessageSquare, Download, FileText, Gift, CopyCheck } from 'lucide-react';

interface ShareLinksModalProps {
  matches: Match[];
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
  onClose: () => void;
  baseShareUrl: string;
  onDownloadMasterList: () => void;
  onDownloadAllCards: () => void;
  onDownloadPartyPack: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ 
    matches, onClose, baseShareUrl, onDownloadMasterList, onDownloadAllCards, onDownloadPartyPack
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [useShortenedUrls, setUseShortenedUrls] = useState(false);
  const [shortenedUrlCache, setShortenedUrlCache] = useState<Record<string, string>>({});
  const [isShortening, setIsShortening] = useState(false);

  const participantLinks = useMemo(() => {
    return matches.map(match => {
      const longUrl = `${baseShareUrl}?id=${match.giver.id}`;
      return {
        id: match.giver.id,
        name: match.giver.name,
        longUrl: longUrl,
        shortUrl: shortenedUrlCache[match.giver.id] || longUrl,
      };
    });
  }, [matches, baseShareUrl, shortenedUrlCache]);

  const filteredLinks = useMemo(() => {
    if (!searchTerm) return participantLinks;
    return participantLinks.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [participantLinks, searchTerm]);

  useEffect(() => {
    const shortenUrls = async () => {
      if (useShortenedUrls && Object.keys(shortenedUrlCache).length < matches.length) {
        setIsShortening(true);
        const newCache = { ...shortenedUrlCache };
        const promises = matches
          .filter(match => !newCache[match.giver.id])
          .map(async match => {
            try {
              const longUrl = `${baseShareUrl}?id=${match.giver.id}`;
              const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
              if (response.ok) {
                const shortUrl = await response.text();
                newCache[match.giver.id] = shortUrl;
              }
            } catch (error) {
              console.error('TinyURL API error:', error);
            }
          });
        await Promise.all(promises);
        setShortenedUrlCache(newCache);
        setIsShortening(false);
      }
    };
    shortenUrls();
  }, [useShortenedUrls, matches, baseShareUrl, shortenedUrlCache]);


  const handleCopy = (text: string, id: string) => {
    trackEvent('copy_link', { type: id === 'all' ? 'bulk' : 'individual' });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyAllLinks = () => {
    const allLinksText = participantLinks.map(p => `${p.name}'s Secret Santa Link: ${useShortenedUrls ? p.shortUrl : p.longUrl}`).join('\n');
    handleCopy(allLinksText, 'all');
  };
  
  const downloadAsCsv = () => {
    trackEvent('download_csv');
    let csvContent = "data:text/csv;charset=utf-s8,Name,Link\n";
    participantLinks.forEach(p => {
        csvContent += `${p.name},${useShortenedUrls ? p.shortUrl : p.longUrl}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "secret_santa_links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 sm:p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-t-2xl flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold font-serif">Sharing &amp; Download Options</h2>
                <p className="text-indigo-100 mt-1">Use these options to share links one-by-one, or perform bulk actions for your whole group.</p>
            </div>
            <button onClick={onClose} className="text-indigo-200 hover:text-white text-4xl font-light leading-none">&times;</button>
        </header>
        
        <div className="p-6 sm:p-8 overflow-y-auto flex-grow">
            {/* Bulk Actions */}
            <div className="p-4 bg-slate-50 rounded-xl border mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 11a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Group Actions &amp; Downloads
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={copyAllLinks} className="p-3 bg-white hover:bg-indigo-50 border rounded-lg text-slate-700 font-semibold text-sm transition-colors flex flex-col items-center gap-2 text-center hover:text-indigo-700 hover:border-indigo-200">
                        <CopyCheck size={24} className="text-indigo-500"/> Copy All Links
                    </button>
                    <button onClick={downloadAsCsv} className="p-3 bg-white hover:bg-indigo-50 border rounded-lg text-slate-700 font-semibold text-sm transition-colors flex flex-col items-center gap-2 text-center hover:text-indigo-700 hover:border-indigo-200">
                        <FileText size={24} className="text-indigo-500"/> Download as CSV
                    </button>
                    <button onClick={onDownloadMasterList} className="p-3 bg-white hover:bg-indigo-50 border rounded-lg text-slate-700 font-semibold text-sm transition-colors flex flex-col items-center gap-2 text-center hover:text-indigo-700 hover:border-indigo-200">
                        <Download size={24} className="text-indigo-500"/> Master List (PDF)
                    </button>
                    <button onClick={onDownloadAllCards} className="p-3 bg-white hover:bg-indigo-50 border rounded-lg text-slate-700 font-semibold text-sm transition-colors flex flex-col items-center gap-2 text-center hover:text-indigo-700 hover:border-indigo-200">
                        <Gift size={24} className="text-indigo-500"/> All Cards (PDF)
                    </button>
                </div>
            </div>

            {/* Individual Links */}
            <div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 005.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
                    Share Private Reveal Links
                </h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-grow">
                        <input
                        type="search"
                        placeholder="Search for a participant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-slate-300 rounded-lg"
                        />
                        <svg className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Shorten Links</label>
                        <button
                            role="switch"
                            aria-checked={useShortenedUrls}
                            id="shorten-toggle"
                            onClick={() => setUseShortenedUrls(!useShortenedUrls)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useShortenedUrls ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useShortenedUrls ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                {filteredLinks.map(({ id, name, longUrl, shortUrl }) => {
                    const urlToDisplay = useShortenedUrls ? shortUrl : longUrl;
                    const isShorteningThisLink = useShortenedUrls && urlToDisplay === longUrl;
                    return (
                    <div key={id} className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
                        <p className="font-semibold text-slate-800 flex-grow sm:w-1/4">{name}</p>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow">
                            <input type="text" readOnly value={isShorteningThisLink && isShortening ? 'Shortening...' : urlToDisplay} className="w-full text-sm p-2 bg-white border border-slate-300 rounded-md truncate"/>
                            <a href={`sms:?&body=Hey ${name}, here is your private Secret Santa link! ${urlToDisplay}`} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors">
                                <MessageSquare size={20} />
                            </a>
                            <button
                                onClick={() => handleCopy(urlToDisplay, id)}
                                className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors w-28 text-center ${
                                copiedId === id ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                                disabled={isShorteningThisLink && isShortening}
                            >
                                {copiedId === id ? <Check size={20} className="mx-auto"/> : 'Copy'}
                            </button>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-100 border-t rounded-b-2xl text-right">
            <button onClick={onClose} className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg">
                Close
            </button>
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
