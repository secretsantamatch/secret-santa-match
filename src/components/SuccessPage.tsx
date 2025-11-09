import React, { useState, useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import ShareLinksModal from './ShareLinksModal';
import { trackEvent } from '../services/analyticsService';
import { PartyPopper, Users, Link as LinkIcon, Download } from 'lucide-react';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalView, setShareModalView] = useState<string | null>(null);

  const { p: participants, matches: matchIds } = data;

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const handleViewOrganizerList = () => {
    trackEvent('view_organizer_list');
    const newUrl = window.location.href.replace('?page=success', '');
    window.location.href = newUrl;
  };
  
  const handleOpenShareModal = (view: string | null) => {
    setShareModalView(view);
    setShowShareModal(true);
    trackEvent('open_share_modal', { from: 'success_page', initial_view: view });
  };

  return (
    <>
      <Header />
      <div className="bg-slate-50 min-h-screen">
        <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center border border-gray-200">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <PartyPopper className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Success!</h1>
            <p className="text-lg text-slate-600 mt-4">
              Your Secret Santa matches have been generated for <strong>{participants.length} participants</strong>.
            </p>
            <p className="text-slate-500 mt-2">
              Your next step is to share the private reveal links with everyone.
            </p>

            <div className="mt-10 space-y-4 max-w-md mx-auto">
              <button
                onClick={() => handleOpenShareModal(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <LinkIcon size={24} />
                Share Links with Participants
              </button>
              
              <button
                onClick={() => handleOpenShareModal('print')}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-lg px-8 py-3 rounded-full shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Download size={20} />
                Download Printable Cards
              </button>

              <button
                onClick={handleViewOrganizerList}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-lg px-8 py-3 rounded-full transition-colors flex items-center justify-center gap-3"
              >
                <Users size={20} />
                View Organizer's Master List
              </button>
            </div>
            
            <div className="mt-12 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border">
                <strong>Important:</strong> Your event data is stored in the URL. Bookmark your organizer link to access your results later. We don't save your information on our servers for privacy.
            </div>
          </div>
        </main>
      </div>
      <Footer />
      {showShareModal && (
        <ShareLinksModal 
          exchangeData={data} 
          onClose={() => setShowShareModal(false)}
          initialView={shareModalView}
        />
      )}
    </>
  );
};

export default SuccessPage;
