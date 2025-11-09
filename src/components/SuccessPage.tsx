import React, { useState } from 'react';
import type { ExchangeData } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import { Copy, Link as LinkIcon, Share2, Printer, Check } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
  const originalOrganizerLink = window.location.href.replace('?page=success', '');
  const [organizerLink, setOrganizerLink] = useState(originalOrganizerLink);
  const [isShortening, setIsShortening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const matches = data.matches.map(m => ({
    giver: data.p.find(p => p.id === m.g)!,
    receiver: data.p.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver);

  const handleShorten = async () => {
    trackEvent('click_shorten_link', { link_type: 'organizer_master' });
    if (organizerLink !== originalOrganizerLink) return; // Already shortened
    setIsShortening(true);
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalOrganizerLink)}`);
        if (response.ok) {
            const shortUrl = await response.text();
            setOrganizerLink(shortUrl);
        } else {
            throw new Error('Failed to shorten URL');
        }
    } catch (error) {
        console.error("Failed to shorten URL:", error);
        alert("Could not shorten the link. Please try again.");
    }
    setIsShortening(false);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(organizerLink);
    setIsCopied(true);
    trackEvent('copy_share_link', { link_type: 'organizer_master' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-16">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 font-serif">Success! Matches Generated.</h1>
            <p className="text-lg text-slate-600 mt-4">Your Secret Santa exchange is ready! Below is the master list for you, the organizer.</p>
          </div>
          
          <div className="my-8 p-6 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-amber-800 font-serif">Important: Save Your Organizer Link!</h2>
            <p className="text-amber-700 mt-2 max-w-2xl mx-auto">This is your unique link to get back to the results page. We don't save your data for privacy, so if you lose this link, you'll have to start over.</p>
            <div className="mt-4 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" readOnly value={organizerLink} className="flex-grow p-3 border border-amber-300 rounded-lg bg-white text-slate-700 text-sm truncate" />
                <button onClick={handleShorten} disabled={isShortening || organizerLink !== originalOrganizerLink} className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <LinkIcon size={18} /> {isShortening ? '...' : 'Shorten'}
                </button>
                <button onClick={handleCopy} className="flex-shrink-0 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="my-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 font-serif">Distribute Your Matches</h2>
             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg border flex flex-col items-center text-center">
                    <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4">
                        <Share2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Go Digital</h3>
                    <p className="text-slate-600 mt-2 flex-grow">Share private reveal links via text, email, or your favorite chat app. Perfect for remote groups!</p>
                    <a href={originalOrganizerLink} className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-colors">
                        Share Links Online
                    </a>
                </div>
                 <div className="bg-white p-8 rounded-2xl shadow-lg border flex flex-col items-center text-center">
                    <div className="bg-slate-100 text-slate-600 p-4 rounded-full mb-4">
                        <Printer size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Go Physical</h3>
                    <p className="text-slate-600 mt-2 flex-grow">Download and print beautifully styled cards to hand out in person. Great for parties!</p>
                    <a href={originalOrganizerLink} className="mt-6 inline-block bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full transition-colors">
                        View & Print Cards
                    </a>
                </div>
            </div>
          </div>
          
          <div className="my-8">
            <h2 className="text-3xl font-bold text-slate-800 font-serif text-center mb-6">Organizer's Master List</h2>
            <ResultsDisplay matches={matches} />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
};

export default SuccessPage;