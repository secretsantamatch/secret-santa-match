import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ShareLinksModal from './ShareLinksModal';
import { generateMatches } from '../services/matchService';
import { Shuffle, ExternalLink, MessageCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Analytics helper
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};

// TODO: Replace this placeholder with your actual Amazon Associates Tracking ID.
const affiliateTag = 'secretsant09e-20';

const ResultsPage: React.FC<{ data: ExchangeData; currentParticipantId: string | null; }> = ({ data, currentParticipantId }) => {
  const [exchangeData, setExchangeData] = useState(data);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isNameRevealed, setIsNameRevealed] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentStatus, setSentStatus] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useShortUrls, setUseShortUrls] = useState(false);
  const [shortUrlCache, setShortUrlCache] = useState<Record<string, string>>({});
  const [isShortening, setIsShortening] = useState(false);

  const matches: Match[] = useMemo(() => {
    const participantMap = new Map<string, Participant>(exchangeData.p.map(p => [p.id, p]));
    return exchangeData.matches
      .map(m => ({
        giver: participantMap.get(m.g),
        receiver: participantMap.get(m.r),
      }))
      .filter(m => m.giver && m.receiver) as Match[];
  }, [exchangeData]);

  const currentMatch = useMemo(() => {
    if (!currentParticipantId) return null;
    return matches.find(m => m.giver.id === currentParticipantId) || null;
  }, [matches, currentParticipantId]);

  const handleShuffle = () => {
    setIsShuffling(true);
    trackEvent('shuffle_again');
    const result = generateMatches(exchangeData.p, exchangeData.exclusions, exchangeData.assignments);
    if (result.matches) {
      const newMatchesData = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
      const updatedData = { ...exchangeData, matches: newMatchesData };
      // This part is tricky without a full routing solution. We'll update state and let parent handle hash.
      // For now, we update local state. A better solution would involve a state management library or context.
      setExchangeData(updatedData);
      // Ideally, we'd also update the URL hash here if we had a function passed down from App.tsx
    } else {
      alert(result.error || "Failed to shuffle matches.");
    }
    setTimeout(() => setIsShuffling(false), 500);
  };
  
  const handleReveal = () => {
    setIsNameRevealed(true);
    trackEvent('reveal_match');
  }

  const toggleSentStatus = (participantId: string) => {
    setSentStatus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const filteredParticipants = useMemo(() =>
    exchangeData.p.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [exchangeData.p, searchTerm]
  );
  
  const getBaseUrl = () => {
    const hash = window.location.hash.slice(1).split('?')[0];
    return `${window.location.origin}${window.location.pathname}#${hash}`;
  };

  const getShortUrl = async (longUrl: string): Promise<string> => {
    if (shortUrlCache[longUrl]) {
      return shortUrlCache[longUrl];
    }
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const shortUrl = await response.text();
      setShortUrlCache(prev => ({ ...prev, [longUrl]: shortUrl }));
      return shortUrl;
    } catch (error) {
      console.error('Failed to shorten URL:', error);
      return longUrl; // Fallback to long URL
    }
  };

  const handleCopy = async (giverId: string) => {
    const baseUrl = getBaseUrl();
    const longUrl = `${baseUrl}?id=${giverId}`;
    let urlToCopy = longUrl;
    if (useShortUrls) {
      setIsShortening(true);
      urlToCopy = await getShortUrl(longUrl);
      setIsShortening(false);
    }
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopiedId(giverId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  
  const OrganizerView: React.FC = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl text-center">
         <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
            <Check className="w-8 h-8"/>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-serif mt-4">You're the Organizer!</h1>
        <p className="text-lg text-indigo-200 mt-2 max-w-2xl mx-auto">
          Your matches are ready. Share the private links with each person so they can see who they're gifting to.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={() => setShowShareModal(true)} className="bg-white/90 hover:bg-white text-indigo-700 font-bold py-3 px-6 rounded-full transition-colors shadow-md transform hover:scale-105">
            Bulk Share Options
          </button>
          <button onClick={handleShuffle} disabled={isShuffling} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold py-3 px-6 rounded-full transition-colors backdrop-blur-sm transform hover:scale-105 disabled:opacity-50">
            <div className="flex items-center gap-2">
              <Shuffle size={20} className={isShuffling ? 'animate-spin' : ''} />
              {isShuffling ? 'Shuffling...' : 'Shuffle Again'}
            </div>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold text-slate-800 font-serif">Organizer's Dashboard</h2>
            <div className="flex items-center gap-2">
                <label htmlFor="shorten-toggle" className="text-sm font-semibold text-slate-600">Shorten Links</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" id="shorten-toggle" checked={useShortUrls} onChange={() => setUseShortUrls(!useShortUrls)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                    <label htmlFor="shorten-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                </div>
            </div>
        </div>
        
         <div className="relative mb-4">
            <input 
                type="search"
                placeholder="Search for a participant..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
         <p className="text-sm text-slate-500 mb-4 font-semibold">Managing links for {filteredParticipants.length} participant{filteredParticipants.length !== 1 && 's'}</p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {filteredParticipants.map(({ id, name }) => (
            <div key={id} className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={sentStatus.has(id)} onChange={() => toggleSentStatus(id)} className="h-5 w-5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                <span className={`font-semibold text-slate-700 ${sentStatus.has(id) ? 'line-through text-slate-400' : ''}`}>{name}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <a href={`sms:?&body=Hey ${name}, here's your private Secret Santa link! ${encodeURIComponent(useShortUrls && shortUrlCache[`${getBaseUrl()}?id=${id}`] ? shortUrlCache[`${getBaseUrl()}?id=${id}`] : `${getBaseUrl()}?id=${id}`)}`} className="px-3 py-2 text-sm font-semibold rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-2">
                  <MessageCircle size={16} /> <span className="hidden sm:inline">SMS</span>
                </a>
                <button 
                  onClick={() => handleCopy(id)}
                  disabled={isShortening}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-28 text-center flex items-center justify-center ${
                    copiedId === id 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {copiedId === id ? <Check size={16}/> : <Copy size={16} />}
                  <span className="ml-2">{copiedId === id ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const ParticipantView: React.FC = () => {
    if (!currentMatch) { /* ... error handling ... */ }
    
    const { giver, receiver } = currentMatch!;
    const amazonSearchUrl = (query: string) => `https://www.amazon.com/s?k=${encodeURIComponent(query + ' gifts')}&tag=${affiliateTag}`;
    
    const renderKeywords = (keywords: string, title: string) => {
        const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
        if (keywordList.length === 0) return null;
        return (
            <div>
                <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">{title}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {keywordList.map((keyword, i) => (
                        <a href={amazonSearchUrl(keyword)} key={i} target="_blank" rel="noopener noreferrer" className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-indigo-200 hover:text-indigo-900 transition-colors flex items-center gap-1">
                            {keyword} <ExternalLink size={12}/>
                        </a>
                    ))}
                </div>
            </div>
        );
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
            <PrintableCard
                match={currentMatch!}
                eventDetails={exchangeData.eventDetails}
                isNameRevealed={isNameRevealed}
                onReveal={handleReveal}
                backgroundOptions={exchangeData.backgroundOptions}
                bgId={exchangeData.bgId}
                bgImg={exchangeData.customBackground}
                txtColor={exchangeData.textColor}
                outline={exchangeData.useTextOutline}
                outColor={exchangeData.outlineColor}
                outSize={exchangeData.outlineSize}
                fontSize={exchangeData.fontSizeSetting}
                font={exchangeData.fontTheme}
                line={exchangeData.lineSpacing}
                greet={exchangeData.greetingText}
                intro={exchangeData.introText}
                wish={exchangeData.wishlistLabelText}
            />
        </div>
        
        {isNameRevealed && (
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
                 <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">
                    Gift Inspiration for <span className="text-red-600">{receiver.name}</span>
                </h2>
                <div className="space-y-6">
                    {renderKeywords(receiver.interests, "Interests & Hobbies")}
                    {renderKeywords(receiver.likes, "Likes")}

                    {receiver.dislikes && (
                        <div>
                            <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Dislikes & No-Go's</h4>
                            <p className="text-slate-700 mt-2 p-3 bg-slate-50 rounded-md border text-sm">{receiver.dislikes}</p>
                        </div>
                    )}
                    
                    {receiver.links && (
                        <div>
                            <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Specific Links</h4>
                            <div className="mt-2 space-y-2 text-sm">
                                {receiver.links.split('\n').map((link, i) => link.trim() && (
                                    <a href={link.trim()} key={i} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-md border hover:bg-slate-100 truncate text-indigo-600 font-semibold">
                                        {link.trim()}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                 <p className="text-xs text-slate-400 mt-6 text-center italic">
                    As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!
                </p>
            </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50 py-12 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
          {currentParticipantId ? <ParticipantView /> : <OrganizerView />}
        </div>
      </main>
      <Footer />
      {showShareModal && (
        <ShareLinksModal
          matches={matches}
          onClose={() => setShowShareModal(false)}
          baseUrl={getBaseUrl()}
          useShortUrls={useShortUrls}
          onShortenUrl={getShortUrl}
        />
      )}
      <style>{`
          .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
          .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </>
  );
};

export default ResultsPage;
