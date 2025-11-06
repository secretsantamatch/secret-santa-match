import React, { useState } from 'react';
import type { Match } from '../types';
import { Copy, Check, Download, FileText } from 'lucide-react';

interface ShareLinksModalProps {
    matches: Match[];
    onClose: () => void;
    onDownloadMasterList: () => void;
    onDownloadAllCards: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, onClose, onDownloadMasterList, onDownloadAllCards }) => {
    const [isCopied, setIsCopied] = useState(false);

    const getShareableLink = (participantId: string): string => {
        const baseUrl = window.location.href.split('#')[0];
        const hash = window.location.hash;
        return `${baseUrl}${hash}?id=${participantId}`;
    };

    const handleCopyAll = () => {
        const allLinksText = matches.map(({ giver }) => `${giver.name}: ${getShareableLink(giver.id)}`).join('\n');
        navigator.clipboard.writeText(allLinksText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleDownloadCsv = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Link\n"
            + matches.map(({ giver }) => `${giver.name},${getShareableLink(giver.id)}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "secret_santa_links.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-links-title"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full"
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif">Sharing & Download Options</h2>
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-slate-600 mb-6">
                    Use these options for bulk sharing or printing. For individual sharing, use the main dashboard.
                </p>
                
                <div className="space-y-4">
                     <button
                        onClick={handleCopyAll}
                        className={`w-full flex items-center justify-center gap-2 text-lg font-semibold py-3 px-4 rounded-lg transition-colors ${
                            isCopied 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {isCopied ? <Check size={22} /> : <Copy size={20} />}
                        {isCopied ? 'All Links Copied!' : 'Copy All Links to Clipboard'}
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={handleDownloadCsv} className="w-full flex flex-col items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-2 rounded-lg transition-colors text-center text-sm">
                            <FileText size={24} />
                            <span>Download as CSV</span>
                        </button>
                         <button onClick={onDownloadMasterList} className="w-full flex flex-col items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-2 rounded-lg transition-colors text-center text-sm">
                            <Download size={24} />
                            <span>Download Master List (PDF)</span>
                        </button>
                        <button onClick={onDownloadAllCards} className="w-full flex flex-col items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-2 rounded-lg transition-colors text-center text-sm">
                           <Download size={24} />
                           <span>Download All Cards (PDF)</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={onClose} 
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareLinksModal;
