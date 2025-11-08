import React, { useState } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { Check, Copy, Link } from 'lucide-react';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [organizerShortLink, setOrganizerShortLink] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  
  const { p: participants, matches: matchIds } = data;

  const matches: Match[] = matchIds.map(m => ({
      giver: participants.find(p => p.id === m.g)!,
      receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver);

  const organizerUrl = new URL(window.location.href);
  organizerUrl.searchParams.set('page', 'results');
  organizerUrl.searchParams.delete('id');
  const organizerUrlString = organizerUrl.toString();

  const displayOrganizerUrl = organizerShortLink || organizerUrlString;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(displayOrganizerUrl).then(() => {
      setIsCopied(true);
      trackEvent('copy_link', { type: 'organizer_master_link_success_page' });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShortenOrganizerLink = async () => {
    if (organizerShortLink) {
        setOrganizerShortLink(null);
        return;
    }
    setIsShortening(true);
    trackEvent('shorten_organizer_link', { location: 'success_page' });
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(organizerUrlString)}`);
        if (response.ok) {
            setOrganizerShortLink(await response.text());
        }
    } catch (error) {
        console.error('TinyURL API error:', error);
    }
    setIsShortening(false);
  };


  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
          <section className="text-center py-10">
            <div className="inline-block bg-green-100 text-green-700 p-4 rounded-full mb-4 animate-fade-in">
              <svg xmlns="http://www.w.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Success! Matches Generated.</h1>
            <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
              Your Secret Santa exchange is ready! Below is the master list for you, the organizer.
            </p>
            
            <div className="mt-8 bg-yellow-100 border-2 border-dashed border-yellow-300 p-6 rounded-2xl max-w-3xl mx-auto text-left">
                <h2 className="text-xl font-bold text-yellow-900">Important: Save Your Organizer Link!</h2>
                <p className="text-sm text-yellow-800 mt-1 mb-3">This is your unique link to get back to the results page. We don't save your data for privacy, so if you lose this link, you'll have to start over.</p>
                <div className="flex items-center gap-2">
                    <input type="text" readOnly value={displayOrganizerUrl} className="w-full p-3 border border-yellow-400 rounded-lg bg-white text-sm truncate"/>
                    <button onClick={handleShortenOrganizerLink} disabled={isShortening} className="py-3 px-4 rounded-lg font-semibold text-sm transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700 flex-shrink-0 flex items-center gap-2">
                        <Link size={16}/>
                        {isShortening ? '...' : (organizerShortLink ? 'Full' : 'Shorten')}
                    </button>
                    <button onClick={handleCopyLink} className={`py-3 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 flex items-center gap-2 ${isCopied ? 'bg-green-600 text-white' : 'bg-yellow-800 hover:bg-yellow-900 text-white'}`}>
                        {isCopied ? <Check size={16}/> : <Copy size={16}/>}
                        {isCopied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
          </section>

          <section className="my-8">
             <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800 font-serif mb-6 text-center">Distribute Your Matches</h2>
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="text-center bg-slate-50 p-6 rounded-xl border">
                        <h3 className="text-xl font-bold text-slate-700">Go Digital</h3>
                        <p className="text-slate-500 mt-2 text-sm">Share private reveal links via text, email, or your favorite chat app. Perfect for remote groups!</p>
                        <button onClick={() => setShowShareModal(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition-colors transform hover:scale-105">
                            Share Links Online
                        </button>
                    </div>
                    <div className="text-center bg-slate-50 p-6 rounded-xl border">
                        <h3 className="text-xl font-bold text-slate-700">Go Physical</h3>
                        <p className="text-slate-500 mt-2 text-sm">Download and print beautifully styled cards to hand out in person. Great for parties!</p>
                        <button onClick={() => setShowShareModal(true)} className="mt-4 inline-block bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-full transition-colors transform hover:scale-105">
                            View & Print Cards
                        </button>
                    </div>
                </div>
            </div>
          </section>

          <section className="my-8">
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800 font-serif mb-6 text-center">Organizer's Master List</h2>
                <ResultsDisplay matches={matches} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
      {showShareModal && <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />}
    </>
  );
};

export default SuccessPage;