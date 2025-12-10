
import React, { useState, useEffect, useMemo } from 'react';
import { getKudosBoard } from '../services/kudosService';
import type { KudosBoard } from '../types';
import { Loader2, Plus, Share2, Play, Copy, Check, Gift, Lock, List, Grid, Trash2, Users, Activity } from 'lucide-react';
import KudosEditor from './KudosEditor';
import KudosPresentation from './KudosPresentation';
import { trackEvent } from '../services/analyticsService';
import AdBanner from './AdBanner';

interface KudosDashboardProps {
    publicId: string;
    adminKey: string | null;
}

const THEME_STYLES: Record<string, string> = {
    corporate: 'bg-slate-100',
    celebration: 'bg-gradient-to-br from-pink-50 via-white to-yellow-50',
    zen: 'bg-[#f0fdf4]',
};

// Pastel card colors for visual variety
const CARD_COLORS = [
    'bg-white border-slate-200',
    'bg-blue-50 border-blue-100',
    'bg-purple-50 border-purple-100',
    'bg-rose-50 border-rose-100',
    'bg-emerald-50 border-emerald-100',
    'bg-amber-50 border-amber-100',
];

const KudosDashboard: React.FC<KudosDashboardProps> = ({ publicId, adminKey }) => {
    const [board, setBoard] = useState<KudosBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showPresentation, setShowPresentation] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isOrgLinkCopied, setIsOrgLinkCopied] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showActivityLog, setShowActivityLog] = useState(false);

    // Derived state for the Admin Activity Log
    const participationStats = useMemo(() => {
        if (!board) return { senders: [], receivers: [] };
        
        const senders = new Map<string, number>();
        const receivers = new Map<string, number>();

        board.cards.forEach(card => {
            const sName = card.from.trim();
            const rName = card.to.trim();
            senders.set(sName, (senders.get(sName) || 0) + 1);
            receivers.set(rName, (receivers.get(rName) || 0) + 1);
        });

        return {
            senders: Array.from(senders.entries()).sort((a, b) => b[1] - a[1]),
            receivers: Array.from(receivers.entries()).sort((a, b) => b[1] - a[1]),
        };
    }, [board]);

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
        // If Admin, auto-enter
        if (adminKey) setHasEntered(true);
        
        fetchBoard();
        const interval = setInterval(fetchBoard, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [publicId, adminKey]);

    const handleCopyLink = (text: string, isOrg: boolean) => {
        navigator.clipboard.writeText(text);
        if (isOrg) {
            setIsOrgLinkCopied(true);
            setTimeout(() => setIsOrgLinkCopied(false), 2000);
        } else {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
        trackEvent('kudos_share_link', { type: isOrg ? 'organizer' : 'public' });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;
    if (!board) return <div className="min-h-screen flex items-center justify-center text-slate-500">Board not found.</div>;

    const bgClass = THEME_STYLES[board.theme] || 'bg-slate-50';
    const shareLink = window.location.href.split('#')[0] + `#id=${publicId}`;
    const organizerLink = window.location.href; // Current URL has the admin key if present

    // --- WELCOME GATE ---
    if (!hasEntered) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-white/50">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-indigo-600">
                        <Gift size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 font-serif mb-2">{board.title}</h1>
                    <p className="text-slate-500 mb-8">You've been invited to share appreciation!</p>
                    
                    <button 
                        onClick={() => setHasEntered(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                         Enter Board
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-20 ${bgClass}`}>
            
            {showPresentation && <KudosPresentation board={board} onClose={() => setShowPresentation(false)} />}
            {showEditor && <KudosEditor boardId={publicId} onClose={() => { setShowEditor(false); fetchBoard(); }} theme={board.theme} />}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black font-serif text-slate-900">{board.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{board.cards.length} Kudos</span>
                            {adminKey && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1"><Lock size={10}/> Admin Mode</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {adminKey && (
                            <button 
                                onClick={() => setShowActivityLog(!showActivityLog)}
                                className={`p-2 rounded-lg border transition-colors ${showActivityLog ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                title="Participation Tracker"
                            >
                                <Activity size={20} />
                            </button>
                        )}
                        <button 
                            onClick={() => setShowPresentation(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm transition-colors shadow-md"
                        >
                            <Play size={16} fill="currentColor" /> Slideshow
                        </button>
                        <button 
                            onClick={() => handleCopyLink(shareLink, false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${isCopied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                        >
                            {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                            {isCopied ? 'Copied!' : 'Invite'}
                        </button>
                        <button 
                            onClick={() => setShowEditor(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} /> Add Kudos
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                
                {/* ADMIN DASHBOARD */}
                {adminKey && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 justify-between">
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1 text-amber-800 font-bold text-lg">
                                    <Lock size={20} /> Organizer Master Key
                                </div>
                                <p className="text-amber-700/80 text-sm font-medium">
                                    Save this link to manage the board. <span className="font-bold underline">Do not share with the team.</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto bg-white p-2 rounded-lg border border-amber-200 shadow-sm">
                                <input type="text" readOnly value={organizerLink} className="flex-1 text-xs text-slate-500 font-mono bg-transparent truncate outline-none w-full md:w-64 pl-2" />
                                <button onClick={() => handleCopyLink(organizerLink, true)} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap transition-colors">
                                    {isOrgLinkCopied ? <Check size={14}/> : <Copy size={14}/>} {isOrgLinkCopied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* ACTIVITY LOG */}
                        {showActivityLog && (
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} /> Participation Tracker</h3>
                                    <span className="text-xs text-slate-500">Based on names entered in cards</span>
                                </div>
                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    <div className="p-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Top Receivers</h4>
                                        <ul className="space-y-2 text-sm">
                                            {participationStats.receivers.length === 0 && <li className="text-slate-400 italic">No data yet</li>}
                                            {participationStats.receivers.map(([name, count]) => (
                                                <li key={name} className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-700">{name}</span>
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Top Senders</h4>
                                        <ul className="space-y-2 text-sm">
                                            {participationStats.senders.length === 0 && <li className="text-slate-400 italic">No data yet</li>}
                                            {participationStats.senders.map(([name, count]) => (
                                                <li key={name} className="flex justify-between items-center">
                                                    <span className="text-slate-600">{name}</span>
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* CARDS GRID */}
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
                        {board.cards.map((card, index) => {
                            const colorClass = CARD_COLORS[index % CARD_COLORS.length];
                            
                            return (
                                <div key={card.id} className={`break-inside-avoid rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow relative overflow-hidden group ${colorClass}`}>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            To: <span className="text-slate-800 text-sm">{card.to}</span>
                                        </p>
                                        {/* Admin Delete Button (Only functionality, no edit for now to keep simple) */}
                                        {adminKey && (
                                            <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="text-slate-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap font-medium font-serif">
                                        "{card.message}"
                                    </div>

                                    {card.giftLink && (
                                        <div className="mb-6 p-4 bg-white/80 backdrop-blur rounded-xl border border-indigo-100 flex items-center gap-4 group/gift cursor-pointer hover:shadow-sm transition-all" onClick={() => window.open(card.giftLink, '_blank')}>
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-sm group-hover/gift:scale-110 transition-transform">
                                                <Gift size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-indigo-900 text-xs uppercase tracking-wide">Gift Attached</p>
                                                <p className="text-xs text-indigo-600 font-bold underline">Click to Reveal</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end border-t pt-4 border-black/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                                                {card.from.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block uppercase tracking-wider font-bold">From</span>
                                                <span className="text-sm font-bold text-slate-700">{card.from}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
