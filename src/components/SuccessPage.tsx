import React from 'react';
import type { ExchangeData } from '../types';
import { PartyPopper, Users, FileDown } from 'lucide-react';

interface SuccessPageProps {
  data: ExchangeData;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ data }) => {
    
    const handleViewResults = () => {
        // Navigate to the organizer's results page
        const baseUrl = window.location.href.split('#')[0].split('?')[0];
        window.location.href = `${baseUrl}${window.location.hash}`;
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-xl w-full text-center p-8 bg-white rounded-2xl shadow-lg border">
                <PartyPopper className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-4xl font-bold font-serif text-slate-800">Success!</h1>
                <p className="text-lg text-slate-600 mt-4">
                    We've successfully generated matches for your <strong>{data.p.length} participants</strong>.
                </p>

                <div className="mt-8 bg-slate-50 p-6 rounded-xl border space-y-4 text-left">
                     <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">View Master List & Get Links</h3>
                            <p className="text-slate-600 text-sm">See all the matches and get unique, private links to share with each person.</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
                            <FileDown size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Download Printable Cards</h3>
                            <p className="text-slate-600 text-sm">Download beautifully styled cards for your in-person party.</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleViewResults}
                    className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 rounded-full shadow-lg transform hover:scale-105 transition-all"
                >
                    Continue to Results &rarr;
                </button>
            </div>
        </div>
    );
};

export default SuccessPage;