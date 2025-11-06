import React, { useState, useEffect } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';

interface ShareLinksModalProps {
    participants: Participant[];
    onClose: () => void;
    onDownloadMasterList: () => void;
    onDownloadAllCards: () => void;
    useShortenedUrls: boolean;
    setUseShortenedUrls: (value: boolean) => void;
    shortenedUrlCache: Record<string, string>;
    isShortening: boolean;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ 
    participants, 
    onClose, 
    onDownloadMasterList,
    onDownloadAllCards,
    useShortenedUrls,
    setUseShortenedUrls,
    shortenedUrlCache,
    isShortening
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(true), 10);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const getShareableLink = (participantId: string): string => {
        const base = window.location.href.split('#')[0];
        const hash = window.location.hash;
        const longUrl = `${base}${hash}?id=${participantId}`;
        return useShortenedUrls ? (shortenedUrlCache[longUrl] || 'Shortening...') : longUrl;
    };

    const handleCopy = (participantId: string) => {
        const link = getShareableLink(participantId);
        navigator.clipboard.writeText(link).then(() => {
            setCopiedId(participantId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };
    
    const handleSms = (participantId: string) => {
        const link = getShareableLink(participantId);
        const message = `Hi! Here is your private link for our Secret Santa exchange: ${link}`;
        window.open(`sms:?&body=${encodeURIComponent(message)}`);
    };

    const handleCopyAll = () => {
        trackEvent('copy_all_links');
        const text = participants
            .map(p => `${p.name}: ${getShareableLink(p.id)}`)
            .join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('All links copied to clipboard!');
        });
    };

    const handleDownloadCsv = () => {
        trackEvent('download_csv');
        const header = 'Name,Link\n';
        const csv = participants
            .map(p => `${p.name},${getShareableLink(p.id)}`)
            .join('\n');
        const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'secret_santa_links.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-links-title"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-3xl w-full transition-all duration-300 flex flex-col ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif mb-2">Sharing & Download Options</h2>
                <p className="text-gray-600 mb-6">Use these options to share links one-by-one, or perform bulk actions for your whole group.</p>
                
                {/* Bulk Actions */}
                <div className="p-4 bg-slate-50 rounded-xl border mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Bulk Actions</h3>
                    <div className="flex flex-wrap gap-3">
                         <button onClick={handleCopyAll} className="flex-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Copy All Links</button>
                         <button onClick={handleDownloadCsv} className="flex-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Download as CSV</button>
                         <button onClick={onDownloadMasterList} className="flex-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Download Master List (PDF)</button>
                         <button onClick={onDownloadAllCards} className="flex-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Download All Cards (PDF)</button>
                    </div>
                </div>

                {/* Individual Sharing */}
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div className="relative flex-grow">
                        <input type="search" placeholder="Search for a participant..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border rounded-lg" />
                         <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">{isShortening ? 'Shortening...' : 'Shorten Links'}</label>
                        <button role="switch" aria-checked={useShortenedUrls} onClick={() => setUseShortenedUrls(!useShortenedUrls)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useShortenedUrls ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useShortenedUrls ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow max-h-[40vh] overflow-y-auto pr-2 space-y-3">
                    {filteredParticipants.map(p => (
                        <div key={p.id} className="bg-slate-50 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-3 border">
                            <span className="font-bold text-slate-800 flex-grow text-center sm:text-left">{p.name}</span>
                            <div className="flex-shrink-0 flex gap-2">
                                <button onClick={() => handleSms(p.id)} className="py-2 px-4 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors">SMS</button>
                                <button
                                    onClick={() => handleCopy(p.id)}
                                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors w-[80px] ${copiedId === p.id ? 'bg-green-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                                >
                                    {copiedId === p.id ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <button 
                        onClick={onClose} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareLinksModal;
