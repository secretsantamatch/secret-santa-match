import React, { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../services/analyticsService';
import { Clipboard, Check, Download, FileText, List, Link, MessageSquare, Search } from 'lucide-react';

interface ShareLinksModalProps {
    participantLinks: { id: string, name: string; link: string }[];
    onClose: () => void;
    onDownloadAllCards: () => void;
    onDownloadMasterList: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ participantLinks, onClose, onDownloadAllCards, onDownloadMasterList }) => {
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [useShortenedUrls, setUseShortenedUrls] = useState(false);
    const [shortenedUrlCache, setShortenedUrlCache] = useState<Record<string, string>>({});
    const [isShortening, setIsShortening] = useState(false);
    
    const handleCopy = (id: string, textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            trackEvent('copy_link', { type: 'individual' });
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
        });
    };
    
    const handleCopyAll = () => {
        const textToCopy = participantLinks.map(({ name, link }) => `${name}: ${useShortenedUrls ? (shortenedUrlCache[link] || link) : link}`).join('\n');
        handleCopy('all-links', textToCopy);
        trackEvent('copy_all_links');
    };

    const handleDownloadCsv = () => {
        trackEvent('download_csv');
        let csvContent = "data:text/csv;charset=utf-8,Name,Link\n";
        participantLinks.forEach(({ name, link }) => {
            const finalLink = useShortenedUrls ? (shortenedUrlCache[link] || link) : link;
            csvContent += `${name.replace(/,/g, '')},${finalLink}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "secret_santa_links.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const shortenUrl = useCallback(async (longUrl: string) => {
        if (shortenedUrlCache[longUrl]) {
            return shortenedUrlCache[longUrl];
        }
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            if (response.ok) {
                const shortUrl = await response.text();
                setShortenedUrlCache(prev => ({ ...prev, [longUrl]: shortUrl }));
                return shortUrl;
            }
        } catch (error) {
            console.error('TinyURL API error:', error);
        }
        return longUrl; // Fallback to long URL on error
    }, [shortenedUrlCache]);

    useEffect(() => {
        if (useShortenedUrls) {
            setIsShortening(true);
            const shortenAll = async () => {
                const promises = participantLinks.map(p => shortenUrl(p.link));
                await Promise.all(promises);
                setIsShortening(false);
            };
            shortenAll();
        }
    }, [useShortenedUrls, participantLinks, shortenUrl]);

    const filteredLinks = participantLinks.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getLink = (link: string) => useShortenedUrls ? (shortenedUrlCache[link] || link) : link;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -m-8 mb-6 p-8 rounded-t-2xl text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold font-serif">Sharing & Download Options</h2>
                         <button onClick={onClose} className="text-purple-200 hover:text-white font-bold text-3xl">&times;</button>
                    </div>
                    <p className="opacity-90 mt-2">
                        Use these options to share links one-by-one, or perform bulk actions for your whole group.
                    </p>
                </div>

                <div className="mb-6 p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><List size={16}/>Bulk Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         <button onClick={handleCopyAll} className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg text-sm transition-colors">
                            {copiedStates['all-links'] ? <Check size={16} className="text-green-600"/> : <Clipboard size={16}/>}
                            {copiedStates['all-links'] ? 'Copied!' : 'Copy All'}
                         </button>
                         <button onClick={handleDownloadCsv} className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg text-sm transition-colors">
                            <FileText size={16}/> Download as CSV
                         </button>
                         <button onClick={onDownloadMasterList} className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg text-sm transition-colors">
                             <Download size={16}/> Master List (PDF)
                         </button>
                         <button onClick={onDownloadAllCards} className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg text-sm transition-colors">
                             <Download size={16}/> All Cards (PDF)
                         </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col min-h-0">
                    <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Link size={16}/>Share Private Reveal Links</h3>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-grow">
                             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                             <input 
                                type="search"
                                placeholder="Search for a participant..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-slate-100 p-2 rounded-lg">
                            <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-700">Shorten Links</label>
                            <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="shorten-toggle" checked={useShortenedUrls} onChange={() => setUseShortenedUrls(!useShortenedUrls)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label htmlFor="shorten-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-2 flex-grow">
                        <div className="space-y-3">
                            {filteredLinks.map(({ id, name, link }) => (
                                <div key={id} className="p-3 bg-slate-50 rounded-lg grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                                    <span className="font-semibold text-slate-800 truncate">{name}</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getLink(link)} 
                                            className={`flex-grow p-2 border border-slate-300 rounded-md text-sm bg-white text-slate-500 transition-opacity ${isShortening ? 'opacity-50' : 'opacity-100'}`}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <a href={`sms:?&body=Hey ${name}, here's your Secret Santa link! ${getLink(link)}`} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md text-slate-600 transition-colors">
                                            <MessageSquare size={20}/>
                                        </a>
                                        <button 
                                            onClick={() => handleCopy(id, getLink(link))}
                                            className={`py-2 px-3 rounded-md font-semibold text-sm transition-colors w-24 text-center ${
                                                copiedStates[id] 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            {copiedStates[id] ? <Check size={20} className="mx-auto"/> : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onClose} 
                        className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
             <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
                .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default ShareLinksModal;
