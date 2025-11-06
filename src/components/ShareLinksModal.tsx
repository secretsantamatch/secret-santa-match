import React, { useState, useEffect } from 'react';
import type { Participant } from '../types';

interface ShareLinksModalProps {
    participants: Participant[];
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ participants, onClose }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

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
        // Construct the URL without query params from the base href, then add the hash and new query param.
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        const hash = window.location.hash;
        return `${baseUrl}${hash}?id=${participantId}`;
    };

    const handleCopy = (participantId: string) => {
        const link = getShareableLink(participantId);
        navigator.clipboard.writeText(link).then(() => {
            setCopiedId(participantId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };
    
    const handleShare = async (participantName: string, participantId: string) => {
        const link = getShareableLink(participantId);
        const shareData = {
            title: 'Your Secret Santa Match is Ready!',
            text: `Hi ${participantName}, here is your private link to find out who you're a Secret Santa for:`,
            url: link,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback for desktop or browsers that don't support Web Share API
            handleCopy(participantId);
            alert('Link copied to clipboard!');
        }
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
                className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif mb-2">Share Private Reveal Links</h2>
                <p className="text-gray-600 mb-6">Send each participant their unique link. They are the only one who can see their match.</p>
                
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                    {participants.map(p => (
                        <div key={p.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 border">
                            <span className="font-bold text-slate-800 flex-grow text-center sm:text-left">{p.name}</span>
                            <div className="flex-shrink-0 flex gap-2">
                                <button
                                    onClick={() => handleCopy(p.id)}
                                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${copiedId === p.id ? 'bg-green-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                                >
                                    {copiedId === p.id ? 'Copied!' : 'Copy Link'}
                                </button>
                                {navigator.share && (
                                     <button
                                        onClick={() => handleShare(p.name, p.id)}
                                        className="py-2 px-4 rounded-lg font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                    >
                                        Share...
                                    </button>
                                )}
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
