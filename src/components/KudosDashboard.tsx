
import React, { useState, useEffect, useMemo } from 'react';
import { getKudosBoard } from '../services/kudosService';
import type { KudosBoard } from '../types';
import { Loader2, Plus, Share2, Play, Copy, Check, Gift } from 'lucide-react';
import KudosEditor from './KudosEditor';
import KudosPresentation from './KudosPresentation';
import { trackEvent } from '../services/analyticsService';
import AdBanner from './AdBanner';

interface KudosDashboardProps {
    publicId: string;
    adminKey: string | null;
}

const THEME_STYLES: Record<string, string> = {
    corporate: 'bg-slate-50',
    celebration: 'bg-gradient-to-br from-pink-50 via-white to-yellow-50',
    zen: 'bg-[#f0fdf4]',
};

const KudosDashboard: React.FC<KudosDashboardProps> = ({ publicId, adminKey }) => {
    const [board, setBoard] = useState<KudosBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showPresentation, setShowPresentation] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const fetchBoard = async () => {
        try {
            const data = await getKudosBoard(publicId);
            setBoard(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
        const interval = setInterval(fetchBoard, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [publicId]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href.split('#')[0] + `#id=${publicId}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        trackEvent('kudos_share_link');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;
    if (!board) return <div className="min-h-screen flex items-center justify-center text-slate-500">Board not found.</div>;

    const bgClass = THEME_STYLES[board.theme] || 'bg-slate-50';

    return (
        <div className={`min-h-screen pb-20 ${bgClass}`}>
            
            {showPresentation && <KudosPresentation board={board} onClose={() => setShowPresentation(false)} />}
            {showEditor && <KudosEditor boardId={publicId} onClose={() => { setShowEditor(false); fetchBoard(); }} theme={board.theme} />}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black font-serif text-slate-900">{board.title}</h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{board.cards.length} Notes of Appreciation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowPresentation(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors"
                        >
                            <Play size={16} fill="currentColor" /> Slideshow
                        </button>
                        <button 
                            onClick={handleCopyLink}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isCopied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                            {isCopied ? 'Copied!' : 'Invite Team'}
                        </button>
                        <button 
                            onClick={() => setShowEditor(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} /> Add Kudos
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {board.cards.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">The board is empty!</h3>
                        <p className="text-slate-400 mb-6">Be the first to share some appreciation.</p>
                        <button onClick={() => setShowEditor(true)} className="text-indigo-600 font-bold hover:underline">Add a Note</button>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {board.cards.map(card => (
                            <div key={card.id} className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                                {card.style === 'celebration' && <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full -mr-10 -mt-10 opacity-50"></div>}
                                {card.style === 'heart' && <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10 opacity-50"></div>}

                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    To: <span className="text-slate-700">{card.to}</span>
                                </p>
                                
                                <div className="text-slate-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap font-medium">
                                    {card.message}
                                </div>

                                {card.giftLink && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center gap-4 group/gift cursor-pointer hover:shadow-sm transition-all" onClick={() => window.open(card.giftLink, '_blank')}>
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-500 group-hover/gift:scale-110 transition-transform">
                                            <Gift size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-indigo-900 text-sm">A Gift For You!</p>
                                            <p className="text-xs text-indigo-600 font-medium">Click to reveal & redeem</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-end border-t pt-4 border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {card.from.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">{card.from}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12">
                     <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
                </div>
            </div>
        </div>
    );
};

export default KudosDashboard;
