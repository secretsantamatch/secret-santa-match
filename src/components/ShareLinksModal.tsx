import React, { useState, useMemo } from 'react';
import type { Match } from '../types';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';

interface ShareLinksModalProps {
    matches: Match[];
    onClose: () => void;
    onDownloadMasterList: () => void;
    onDownloadAllCards: () => void;
    onDownloadPartyPack: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, onClose, onDownloadMasterList, onDownloadAllCards, onDownloadPartyPack }) => {
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [isAnimating, setIsAnimating] = useState(false);

    React.useEffect(() => {
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

    const links = useMemo(() => {
        const baseUrl = window.location.href.split('#')[0];
        return matches.map(match => {
            const url = `${baseUrl}?id=${match.giver.id}${window.location.hash}`;
            return {
                id: match.giver.id,
                name: match.giver.name,
                url,
            };
        });
    }, [matches]);

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [id]: false }));
            }, 2000);
        });
    };
    
    const handleCopyAll = () => {
        const allLinksText = links.map(link => `${link.name}: ${link.url}`).join('\n');
        navigator.clipboard.writeText(allLinksText).then(() => {
            setCopiedStates({ all: true });
             setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, all: false }));
            }, 2000);
        });
    };

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
                className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif mb-2">Share & Download</h2>
                        <p className="text-gray-600 mb-6">Send each person their unique link, or download printable materials for your event.</p>
                    </div>
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold" aria-label="Close modal">&times;</button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {links.map(({ id, name, url }) => (
                        <div key={id} className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row items-center gap-4 border">
                             <div className="bg-white p-1 rounded-md hidden sm:block">
                                <QRCode value={url} size={48} />
                            </div>
                            <div className="flex-grow text-center sm:text-left">
                                <p className="font-semibold text-slate-800">{name}</p>
                                <p className="text-xs text-slate-500 truncate">{url}</p>
                            </div>
                            <button 
                                onClick={() => handleCopy(id, url)}
                                className={`flex-shrink-0 w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors ${copiedStates[id] ? 'bg-emerald-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            >
                                {copiedStates[id] ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t space-y-4">
                     <div>
                        <h3 className="text-lg font-bold text-slate-700 text-center mb-3">Downloads & Sharing</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={onDownloadAllCards} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"><Download size={16} /> Download All Cards</button>
                            <button onClick={onDownloadMasterList} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"><Download size={16} /> Download Master List</button>
                            <button onClick={onDownloadPartyPack} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"><Download size={16} /> Download Party Pack</button>
                            <button 
                                onClick={handleCopyAll}
                                className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${copiedStates.all ? 'bg-emerald-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                            >
                                {copiedStates.all ? 'All Links Copied!' : 'Copy All Links'}
                            </button>
                        </div>
                    </div>
                    <div className="text-center">
                        <button 
                            onClick={onClose} 
                            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareLinksModal;
