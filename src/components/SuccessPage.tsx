import React, { useState } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { generateMasterListPdf, generatePartyPackPdf } from '../services/pdfService';
import { trackEvent } from '../services/analyticsService';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { p: participants, matches: matchIds } = data;

  const matches: Match[] = matchIds.map(m => ({
      giver: participants.find(p => p.id === m.g)!,
      receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver);

  const organizerUrl = new URL(window.location.href);
  organizerUrl.searchParams.set('page', 'results');
  organizerUrl.searchParams.delete('id');
  
  const handleDownloadMasterList = () => {
      trackEvent('download_results', { type: 'master_list' });
      generateMasterListPdf(data);
  };
  
  const handleDownloadPartyPack = () => {
      trackEvent('download_results', { type: 'party_pack' });
      generatePartyPackPdf(data);
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
          <section className="text-center py-10">
            <div className="inline-block bg-green-100 text-green-700 p-4 rounded-full mb-4 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Success! Matches Generated.</h1>
            <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
              Your Secret Santa exchange is ready! Below is the master list for you, the organizer.
            </p>
            <div className="mt-6 text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-lg max-w-2xl mx-auto">
                <p><strong className="text-yellow-800">Important:</strong> Save your unique organizer link below to access this page again. We don't save your data!</p>
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
                        <a href={`${organizerUrl.toString()}&view=cards`} className="mt-4 inline-block bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-full transition-colors transform hover:scale-105">
                            View & Print Cards
                        </a>
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
