import React, { useState, useEffect } from 'react';
import type { ExchangeData } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import { encodeData } from '../services/urlService';
import { trackEvent } from '../services/analyticsService';
import { Copy, Check, Link as LinkIcon, Users, Printer, Shuffle, ExternalLink, Share2, Globe } from 'lucide-react';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
  const [organizerUrl, setOrganizerUrl] = useState('');
  const [shortOrganizerUrl, setShortOrganizerUrl] = useState('');
  const [useShortLink, setUseShortLink] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isShortening, setIsShortening] = useState(true);

  useEffect(() => {
    const encodedData = encodeData(data);
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const fullUrl = `${baseUrl}#${encodedData}`;
    setOrganizerUrl(fullUrl);

    // Fetch short URL
    setIsShortening(true);
    fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`)
        .then(response => response.ok ? response.text() : Promise.reject('Failed to shorten URL'))
        .then(shortUrl => setShortOrganizerUrl(shortUrl))
        .catch(error => {
            console.error("TinyURL error:", error);
            setShortOrganizerUrl(''); // Fallback
        })
        .finally(() => setIsShortening(false));
  }, [data]);

  const displayedUrl = useShortLink && shortOrganizerUrl ? shortOrganizerUrl : organizerUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedUrl).then(() => {
      setIsCopied(true);
      trackEvent('copy_organizer_link', { location: 'success_page', short: useShortLink });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleShuffle = () => {
      trackEvent('click_shuffle_again', { page: 'success' });
      // Navigate back to the generator page by removing hash and query params
      window.location.href = '/generator.html';
  };

  const handleNavigation = (view: 'digital' | 'physical') => {
      const url = new URL(organizerUrl);
      if (view === 'physical') {
          url.searchParams.set('view', 'print');
      }
      window.location.href = url.toString();
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12 text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <Check className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Success! Matches Generated.</h1>
            <p className="text-lg text-slate-600 mt-4">Your Secret Santa exchange is ready! Below is the master list for you, the organizer.</p>
          </section>

          <section className="mt-8 bg-green-50 p-6 rounded-2xl border-2 border-dashed border-green-200 animate-fade-in">
            <h2 className="text-2xl font-bold text-green-800 text-center font-serif mb-2">Important: Save Your Organizer Link!</h2>
            <p className="text-center text-green-700 mb-4">This is your unique link to get back to the results page. We don't save your data for privacy, so if you lose this link, you'll have to start over.</p>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-end gap-4 mb-3">
                    <div className="flex items-center">
                        <label htmlFor="short-link-toggle-organizer" className="mr-2 block text-sm font-medium text-gray-700">Show Full Link</label>
                        <input
                            type="checkbox"
                            id="short-link-toggle-organizer"
                            checked={!useShortLink}
                            onChange={() => setUseShortLink(!useShortLink)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        readOnly
                        value={isShortening && useShortLink ? "Generating short link..." : displayedUrl}
                        className="w-full p-3 border rounded-md bg-slate-100 text-slate-600 text-sm truncate"
                    />
                    <button onClick={handleCopy} className={`flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold py-3 px-5 rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                        {isCopied ? <Check size={18} /> : <Copy size={18} />}
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
          </section>
          
          <section className="mt-12 text-center animate-fade-in">
             <h2 className="text-3xl font-bold text-slate-800 font-serif mb-8">Distribute Your Matches</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-lg border text-center transition-transform transform hover:-translate-y-1 flex flex-col">
                    <div className="flex justify-center mb-4"><div className="bg-indigo-100 p-4 rounded-full"><Globe className="w-8 h-8 text-indigo-600"/></div></div>
                    <h3 className="text-2xl font-bold font-serif text-slate-800">Go Digital</h3>
                    <p className="text-slate-500 mt-2 mb-6 flex-grow">Share private reveal links via text, email, or your favorite chat app. Perfect for remote groups!</p>
                    <button onClick={() => handleNavigation('digital')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors">Share Links Online</button>
                </div>
                 <div className="bg-white rounded-2xl p-8 shadow-lg border text-center transition-transform transform hover:-translate-y-1 flex flex-col">
                    <div className="flex justify-center mb-4"><div className="bg-slate-100 p-4 rounded-full"><Printer className="w-8 h-8 text-slate-600"/></div></div>
                    <h3 className="text-2xl font-bold font-serif text-slate-800">Go Physical</h3>
                    <p className="text-slate-500 mt-2 mb-6 flex-grow">Download and print beautifully styled cards to hand out in person. Great for parties!</p>
                    <button onClick={() => handleNavigation('physical')} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">View & Print Cards</button>
                </div>
             </div>
             <div className="mt-8">
                 <button onClick={handleShuffle} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold mx-auto transition-colors">
                     <Shuffle size={16} />
                     Start Over or Shuffle Again
                 </button>
             </div>
          </section>

          <section className="mt-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">Organizer's Master List</h2>
            <ResultsDisplay matches={data.matches.map(m => ({ giver: data.p.find(p => p.id === m.g)!, receiver: data.p.find(p => p.id === m.r)!}))} />
          </section>

        </div>
      </main>
      <Footer />
       <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
    </>
  );
};

export default SuccessPage;