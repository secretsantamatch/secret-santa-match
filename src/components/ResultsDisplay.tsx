import React, { useState } from 'react';
import type { Match, Participant } from '../types';
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import LinkPreview from './LinkPreview';

interface ResultsDisplayProps {
    matches: Match[];
    exchangeId: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches, exchangeId }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [liveDetails, setLiveDetails] = useState<Record<string, Partial<Participant>>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggleDetails = async (receiverId: string) => {
        const newExpandedId = expandedId === receiverId ? null : receiverId;
        setExpandedId(newExpandedId);

        if (newExpandedId && !liveDetails[newExpandedId]) {
            setLoadingId(newExpandedId);
            try {
                const res = await fetch(`/.netlify/functions/get-wishlist?exchangeId=${exchangeId}&participantId=${receiverId}`);
                if (res.ok) {
                    const wishlistData = await res.json();
                    setLiveDetails(prev => ({ ...prev, [receiverId]: wishlistData }));
                }
            } catch (e) {
                console.error("Failed to fetch wishlist", e);
            } finally {
                setLoadingId(null);
            }
        }
    };

    const renderWishlistItem = (label: string, value: string | undefined) => {
        if (!value || value.trim() === '') return null;
        return <p><strong className="font-semibold text-slate-600">{label}:</strong> {value}</p>;
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">All Matches</h2>
            <div className="space-y-4">
                {matches.map(({ giver, receiver }) => {
                    const isExpanded = expandedId === receiver.id;
                    const details = { ...receiver, ...(liveDetails[receiver.id] || {}) };
                    const isLoading = loadingId === receiver.id;

                    return (
                        <div key={giver.id} className="bg-slate-50 rounded-lg border border-slate-200 transition-all">
                            <div className="flex items-center p-4">
                                <span className="font-bold text-slate-800 text-lg text-center w-2/5 truncate">{giver.name}</span>
                                <ArrowRight className="h-6 w-6 text-red-500 mx-4 flex-shrink-0" />
                                <span className="font-bold text-slate-800 text-lg text-center w-2/5 truncate">{receiver.name}</span>
                                <button onClick={() => handleToggleDetails(receiver.id)} className="ml-auto p-2 text-slate-500 hover:bg-slate-200 rounded-full">
                                    {isLoading ? <Loader2 className="animate-spin"/> : <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <h4 className="font-bold text-slate-800 mb-2">{receiver.name}'s Details</h4>
                                    <div className="text-sm text-slate-700 space-y-1 mb-4">
                                        {renderWishlistItem('Interests', details.interests)}
                                        {renderWishlistItem('Likes', details.likes)}
                                        {renderWishlistItem('Dislikes', details.dislikes)}
                                        {renderWishlistItem('Budget', details.budget)}
                                    </div>
                                    {details.links && details.links.some(l => l.trim() !== '') && (
                                        <div>
                                            <h5 className="font-bold text-slate-800 mb-2">Wishlist Links</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {details.links.map((link, index) => (
                                                    link.trim() ? <LinkPreview key={index} url={link} /> : null
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResultsDisplay;