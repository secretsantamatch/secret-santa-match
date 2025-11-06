
import React, { useState } from 'react';

interface ShareLinksModalProps {
    participantLinks: { name: string; link: string }[];
    onClose: () => void;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ participantLinks, onClose }) => {
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    const handleCopy = (link: string) => {
        navigator.clipboard.writeText(link).then(() => {
            setCopiedLinkId(link);
            setTimeout(() => setCopiedLinkId(null), 2000); // Reset after 2 seconds
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Share Private Links</h2>
                     <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold text-2xl">&times;</button>
                </div>
                <p className="text-slate-600 mb-6">
                    Copy each person's unique link and send it to them via text, email, or your favorite messaging app.
                </p>
                <div className="overflow-y-auto pr-2 flex-grow">
                    <div className="space-y-3">
                        {participantLinks.map(({ name, link }) => (
                            <div key={link} className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <span className="font-semibold text-slate-800">{name}'s Link</span>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={link} 
                                        className="flex-grow p-2 border border-slate-300 rounded-md text-sm bg-white text-slate-500" 
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button 
                                        onClick={() => handleCopy(link)}
                                        className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors w-28 text-center ${
                                            copiedLinkId === link 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {copiedLinkId === link ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button 
                        onClick={onClose} 
                        className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareLinksModal;
