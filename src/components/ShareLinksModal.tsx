import React, { useState } from 'react';
import type { Match } from '../types';
import { Copy, Check } from 'lucide-react';

interface ShareLinksModalProps {
    matches: Match[];
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, onClose }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const getShareableLink = (participantId: string): string => {
        const baseUrl = window.location.href.split('#')[0];
        const hash = window.location.hash;
        // The main hash contains all data. We append the participant ID as a query param to it.
        return `${baseUrl}${hash}?id=${participantId}`;
    };

    const handleCopy = (participantId: string) => {
        const link = getShareableLink(participantId);
        navigator.clipboard.writeText(link).then(() => {
            setCopiedId(participantId);
            setTimeout(() => setCopiedId(null), 2000);
        });
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
                className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif">Share Private Links</h2>
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-slate-600 mb-6">
                    Copy each person's unique link and send it to them privately. They will be the only one who can see who they've been matched with.
                </p>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {matches.map(({ giver }) => (
                        <div key={giver.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border">
                            <span className="font-semibold text-slate-800 flex-grow">{giver.name}'s Link</span>
                            <button
                                onClick={() => handleCopy(giver.id)}
                                className={`flex items-center justify-center gap-2 w-32 text-sm font-semibold py-2 px-4 rounded-md transition-colors ${
                                    copiedId === giver.id 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {copiedId === giver.id ? (
                                    <>
                                        <Check size={16} /> Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} /> Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
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
