import React, { useState } from 'react';
import type { Participant } from '../types';
import { Info, MessageSquare, Link2, Loader2 } from 'lucide-react';

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
  const [useShortLinks, setUseShortLinks] = useState(false);
  const [shortenedLinks, setShortenedLinks] = useState<Record<string, string>>({});
  const [isLoadingShortLinks, setIsLoadingShortLinks] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);


  React.useEffect(() => {
    const timer = setTimeout(() => setModalAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getShortenedLink = async (longUrl: string): Promise<string> => {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const shortUrl = await response.text();
      // Basic validation to see if the response is a URL
      if (shortUrl.startsWith('http')) {
        return shortUrl;
      }
      throw new Error('Invalid response from shortening service');
    } catch (error) {
      console.error('TinyURL API failed:', error);
      return longUrl; // Fallback to long URL
    }
  };

  const handleToggleShortLinks = async () => {
    const newState = !useShortLinks;
    setUseShortLinks(newState);
    if (newState && Object.keys(shortenedLinks).length < participants.length) {
      setIsLoadingShortLinks(true);
      setShortenError(null);
      const promises = participants.map(p => {
        if (shortenedLinks[p.id]) return Promise.resolve({ id: p.id, url: shortenedLinks[p.id] });
        const longUrl = getParticipantLink(p.id);
        return getShortenedLink(longUrl).then(url => ({ id: p.id, url }));
      });
      try {
        const results = await Promise.all(promises);
        const newShortenedLinks: Record<string, string> = {};
        let hadError = false;
        results.forEach(result => {
          newShortenedLinks[result.id] = result.url;
          if (result.url.startsWith('http')) {
            // It's a valid URL
          } else {
            // It's a fallback long URL, so an error occurred
            hadError = true;
          }
        });
        setShortenedLinks(newShortenedLinks);
        if (hadError) setShortenError("Could not shorten some links. Using original links instead.");
      } catch {
        setShortenError("Failed to shorten links. Please try again.");
      } finally {
        setIsLoadingShortLinks(false);
      }
    }
  };


  const getFinalLink = (participantId: string) => {
    if (useShortLinks) {
        // If still loading, show a placeholder. Otherwise use the short link or fallback to long.
        if (isLoadingShortLinks) return "Loading...";
        return shortenedLinks[participantId] || getParticipantLink(participantId);
    }
    return getParticipantLink(participantId);
  };

  const copyLink = (participantId: string) => {
    const urlToCopy = getFinalLink(participantId);
    if (urlToCopy === "Loading...") return;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopiedLink(participantId);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link.');
    });
  };

  const handleCopyAllLinks = () => {
    const allLinksText = participants.map(p => `${p.name}'s Link: ${getFinalLink(p.id)}`).join('\n\n');
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
              <p className="font-bold">Pro Tip: Sharing Your Links</p>
              <p className="mt-1">For your privacy, all data is stored in these long links. For cleaner sharing, toggle on "Shorten Links" below!</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
             <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-slate-700">Shorten Links</span>
            </div>
            <button
                type="button"
                onClick={handleToggleShortLinks}
                disabled={isLoadingShortLinks}
                className={`${useShortLinks ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
            >
                {isLoadingShortLinks && <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white"/>}
                <span className={`${useShortLinks ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
          </div>
          {shortenError && <p className="text-sm text-red-600 text-center -mt-2 mb-4">{shortenError}</p>}

          {participants.map(p => {
            const finalLink = getFinalLink(p.id);
            const smsBody = encodeURIComponent(`Hey ${p.name}, here is your private link for our Secret Santa exchange! 🎁 ${finalLink}`);
            return(
              <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm gap-2">
                <div className="flex items-center gap-3 flex-shrink min-w-0">
                  <UserIcon />
                  <span className="font-semibold text-slate-700 truncate">{p.name}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`sms:?&body=${smsBody}`} className="font-semibold p-2.5 text-sm rounded-lg transition-all bg-slate-200 hover:bg-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-slate-400">
                    <MessageSquare className="h-5 w-5"/>
                  </a>
                  <button 
                    onClick={() => copyLink(p.id)}
                    className={`font-semibold py-2 px-4 text-sm rounded-lg transition-all flex items-center justify-center w-32 focus:outline-none focus:ring-2 focus:ring-offset-2 ${copiedLink === p.id 
                        ? 'bg-emerald-500 text-white ring-emerald-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white ring-slate-400'
                    }`}
                  >
                    {copiedLink === p.id ? <CheckIcon /> : <CopyIcon />}
                    <span className="ml-2">{copiedLink === p.id ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )
          })}
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
