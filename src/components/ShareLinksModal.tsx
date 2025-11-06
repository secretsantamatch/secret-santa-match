import React, { useState } from 'react';
import type { Match } from '../types';

interface ShareLinksModalProps {
  matches: Match[];
  onClose: () => void;
  baseUrl: string;
}

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ matches, onClose, baseUrl }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (giverId: string) => {
    const link = `${baseUrl}?id=${giverId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(giverId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Share Private Reveal Links</h2>
          <p className="text-slate-600 mt-2">Send each person their unique link. Only they will be able to see who they're buying a gift for.</p>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <ul className="space-y-3">
            {matches.map(({ giver }) => (
              <li key={giver.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700">{giver.name}</span>
                <button 
                  onClick={() => handleCopy(giver.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-28 text-center ${
                    copiedId === giver.id 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {copiedId === giver.id ? 'Copied!' : 'Copy Link'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 border-t text-center">
          <button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-fast {
            animation: fade-in-fast 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShareLinksModal;
