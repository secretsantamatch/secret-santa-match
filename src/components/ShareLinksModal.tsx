import React, { useState } from 'react';
import type { Participant } from '../types';
import { Info } from 'lucide-react';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CopyAllIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);


interface ShareLinksModalProps {
  participants: Participant[];
  getParticipantLink: (id: string) => string;
  onClose: () => void;
}

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
    <div className={`fixed inset-0 bg-slate-800 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-links-title">
      <div className={`bg-slate-50 rounded-2xl shadow-2xl max-w-lg w-full transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <div className="p-6 sm:p-8 text-center border-b border-slate-200">
            <div className="mx-auto bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <ShareIcon />
            </div>
            <h2 id="share-links-title" className="text-2xl font-bold text-slate-800 font-serif">Share The Secrets!</h2>
            <p className="text-slate-500 mt-2">Send each person their unique link. It's their secret to keep!</p>
        </div>
        
        <div className="p-6 sm:p-8 space-y-3 text-left max-h-[40vh] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm text-left mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Why are the links so long?</p>
              <p className="mt-1">For your privacy! All your group's information is stored securely <em>inside</em> the link itself, not on our servers. This means we never see or save any of your private data.</p>
              <p className="font-bold mt-3">Pro Tip: Sharing Your Links</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>For a cleaner look, use a free URL shortener like <a href="https://tinyurl.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline">TinyURL</a> before sending.</li>
                <li>In an email, you can hyperlink text. Write "Click here to see your match," highlight it, and add the long link.</li>
              </ul>
            </div>
          </div>
          {participants.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <UserIcon />
                <span className="font-semibold text-slate-700">{p.name}</span>
              </div>
              <button 
                onClick={() => copyLink(p.id)}
                className={`font-semibold py-2 px-4 text-sm rounded-lg transition-all flex items-center justify-center w-32 focus:outline-none focus:ring-2 focus:ring-offset-2 ${copiedLink === p.id 
                    ? 'bg-emerald-500 text-white ring-emerald-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white ring-slate-400'
                }`}
              >
                {copiedLink === p.id ? <CheckIcon /> : <CopyIcon />}
                <span className="ml-2">{copiedLink === p.id ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-100 rounded-b-2xl space-y-4">
          <button 
            onClick={handleCopyAllLinks} 
            className={`w-full border font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg ${copiedLink === 'all' 
              ? 'bg-emerald-500 border-emerald-600 text-white' 
              : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            {copiedLink === 'all' ? <CheckIcon /> : <CopyAllIcon />}
            {copiedLink === 'all' ? 'All Links Copied!' : 'Copy All Links to Clipboard'}
          </button>
          <button onClick={onClose} className="w-full text-center text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors py-2 rounded-full">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinksModal;
