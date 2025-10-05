import React, { useState } from 'react';
import type { Participant } from '../types';

interface ShareLinksModalProps {
  participants: Participant[];
  getParticipantLink: (id: string) => string;
  onClose: () => void;
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H8V3a1 1 0 00-1-1zM5 6h10v10H5V6z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ participants, getParticipantLink, onClose }) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [modalAnimating, setModalAnimating] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setModalAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);


  const copyLink = (participantId: string) => {
    const urlToCopy = getParticipantLink(participantId);
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopiedLink(participantId);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link.');
    });
  };

  const handleCopyAllLinks = () => {
    const allLinksText = participants.map(p => `${p.name}'s Link: ${getParticipantLink(p.id)}`).join('\n\n');
    navigator.clipboard.writeText(`Here are the private Secret Santa links for everyone:\n\n${allLinksText}`).then(() => {
      setCopiedLink('all');
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(err => {
      alert('Failed to copy all links.');
    });
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-links-title">
      <div className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <div className="text-center">
            <h2 id="share-links-title" className="text-3xl font-bold text-slate-800 font-serif mb-2">Share Private Links</h2>
            <p className="text-gray-600 mb-8">Copy each participant's unique link and send it to them privately.</p>
        </div>
        
        <div className="space-y-3 text-left max-h-[40vh] overflow-y-auto pr-2">
          {participants.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">{p.name}'s Link</span>
              <button 
                onClick={() => copyLink(p.id)}
                className={`bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 text-sm rounded-lg transition-all flex items-center justify-center w-36 h-12 ${copiedLink === p.id ? 'bg-green-600' : ''}`}
              >
                {copiedLink === p.id ? <CheckIcon /> : <CopyIcon />}
                <span className="ml-1">{copiedLink === p.id ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <button 
            onClick={handleCopyAllLinks} 
            className={`w-full border font-bold py-3 px-4 rounded-lg transition-colors ${copiedLink === 'all' ? 'bg-green-600 border-green-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'}`}
          >
            {copiedLink === 'all' ? 'All Links Copied!' : 'Copy All Links'}
          </button>
        </div>

        <div className="text-center">
            <button onClick={onClose} className="mt-4 text-gray-500 hover:text-gray-800 font-semibold text-sm transition-colors py-2 px-4 rounded-full">
            Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinksModal;
