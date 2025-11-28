
import React, { useState } from 'react';
import type { Match, Participant } from '../types';
import { ArrowRight, ChevronDown, List, Users, Gift, RefreshCw } from 'lucide-react';
import LinkPreview from './LinkPreview';

interface ResultsDisplayProps {
    matches: Match[];
    exchangeId: string;
    liveWishlists: Record<string, Partial<Participant>>;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches, liveWishlists, onRefresh, isRefreshing }) => {
    const [activeTab, setActiveTab] = useState<'matches' | 'details'>('matches');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleToggleDetails = (receiverId: string) => {
        setExpandedId(prev => (prev === receiverId ? null : receiverId));
    };

    const renderWishlistItem = (label: string, value: string | undefined) => {
        if (!value || value.trim() === '') return null;
        return <p className="mb-1"><strong className="font-semibold text-slate-700">{label}:</strong> <span className="text-slate-600">{value}</span></p>;
    };

    // Extract unique participants from matches (using receivers ensures we get everyone once)
    const participants = matches.map(m => ({
        ...m.receiver,
        ...(liveWishlists[m.receiver.id] || {})
    }));

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 relative">
                <button 
                    onClick={() => setActiveTab('matches')}
                    className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'matches' ? 'bg-white text-slate-800 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                    <Users size={18} /> Gift Matches
                </button>
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'details' ? 'bg-white text-slate-800 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                    <List size={18} /> Master List (Details)
                </button>
                
                {onRefresh && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 border-l border-slate-200">
                        <button 
                            onClick={onRefresh} 
                            disabled={isRefreshing}
                            className={`p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh Wishlists"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8">
                {activeTab === 'matches' ? (
                    /* MATCHES VIEW */
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Who Got Whom</h2>
                        {matches.map(({ giver, receiver }) => {
                            const isExpanded = expandedId === receiver.id;
                            const details = { ...receiver, ...(liveWishlists[receiver.id] || {}) };
                            
                            return (
                                <div key={giver.id} className="bg-slate-50 rounded-lg border border-slate-200 transition-all">
                                    <div className="flex items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleToggleDetails(receiver.id)}>
                                        <div className="flex-1 flex items-center justify-center md:justify-start gap-2 min-w-0">
                                            <span className="font-bold text-slate-800 text-lg truncate">{giver.name}</span>
                                        </div>
                                        
                                        <div className="px-4 flex-shrink-0">
                                            <ArrowRight className="h-5 w-5 text-red-500" />
                                        </div>
                                        
                                        <div className="flex-1 flex items-center justify-center md:justify-end gap-2 min-w-0 text-right">
                                            <span className="font-bold text-slate-800 text-lg truncate">{receiver.name}</span>
                                        </div>

                                        <div className="ml-4 pl-4 border-l border-slate-300 hidden md:block">
                                            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 border-t border-slate-200 bg-white animate-fade-in">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-bold text-sm uppercase text-slate-400 mb-3 tracking-wider">Preferences</h4>
                                                    <div className="text-sm space-y-2">
                                                        {renderWishlistItem('Interests', details.interests) || <p className="text-slate-400 italic">No interests listed.</p>}
                                                        {renderWishlistItem('Likes', details.likes)}
                                                        {renderWishlistItem('Dislikes', details.dislikes)}
                                                        {renderWishlistItem('Budget', details.budget)}
                                                    </div>
                                                </div>
                                                {details.links && details.links.some(l => l && l.trim() !== '') && (
                                                    <div>
                                                        <h4 className="font-bold text-sm uppercase text-slate-400 mb-3 tracking-wider">Wishlist Links</h4>
                                                        <div className="space-y-2">
                                                            {details.links.map((link, index) => (
                                                                link && link.trim() ? <LinkPreview key={index} url={link} /> : null
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* DETAILS VIEW (MASTER LIST) */
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-700 text-center mb-2">Participant Details Master List</h2>
                        <p className="text-center text-slate-500 text-sm mb-6">A summary of what everyone has entered for their preferences.</p>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {participants.map((person) => {
                                const hasDetails = person.interests || person.likes || person.dislikes || person.budget || (person.links && person.links.some(l => l.trim()));
                                
                                return (
                                    <div key={person.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                {person.name.charAt(0).toUpperCase()}
                                            </div>
                                            <h3 className="font-bold text-xl text-slate-800">{person.name}</h3>
                                            {!hasDetails && <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">No Details Yet</span>}
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2 text-sm">
                                                {renderWishlistItem('Interests', person.interests)}
                                                {renderWishlistItem('Likes', person.likes)}
                                                {renderWishlistItem('Dislikes', person.dislikes)}
                                                {renderWishlistItem('Budget', person.budget)}
                                                {!hasDetails && <p className="text-slate-400 italic">This participant hasn't added any preferences yet.</p>}
                                            </div>
                                            
                                            {person.links && person.links.some(l => l.trim()) && (
                                                <div className="bg-slate-50 p-3 rounded-lg">
                                                    <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 flex items-center gap-1"><Gift size={12}/> Wishlist Links</h4>
                                                    <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                                                        {person.links.filter(l => l.trim()).map((link, i) => (
                                                            <li key={i} className="truncate">
                                                                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">{link}</a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsDisplay;
