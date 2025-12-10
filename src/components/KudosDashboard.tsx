
import React, { useState, useEffect, useMemo } from 'react';
import { getKudosBoard, reactToCard } from '../services/kudosService';
import type { KudosBoard } from '../types';
import { Loader2, Plus, Share2, Play, Copy, Check, Gift, Lock, MessageCircle, Mail, Trash2, Smartphone, Download, Activity, Heart, Clock, Utensils } from 'lucide-react';
import KudosEditor from './KudosEditor';
import KudosPresentation from './KudosPresentation';
import { trackEvent } from '../services/analyticsService';
import AdBanner from './AdBanner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface KudosDashboardProps {
    publicId: string;
    adminKey: string | null;
}

const THEME_STYLES: Record<string, string> = {
    corporate: 'bg-slate-100',
    celebration: 'bg-gradient-to-br from-pink-50 via-white to-yellow-50',
    zen: 'bg-[#f0fdf4]',
    farewell: 'bg-sky-50',
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

// Simple word cloud generator
const WordCloud: React.FC<{ cards: any[] }> = ({ cards }) => {
    const words = useMemo(() => {
        const text = cards.map(c => c.message).join(' ').toLowerCase();
        const stopWords = new Set(['the', 'and', 'a', 'to', 'for', 'is', 'in', 'of', 'you', 'your', 'with', 'that', 'it', 'on', 'are', 'so', 'this', 'always', 'how', 'really']);
        const counts: Record<string, number> = {};
        
        text.replace(/[^\w\s]/g, '').split(/\s+/).forEach(word => {
            if (word.length > 3 && !stopWords.has(word)) {
                counts[word] = (counts[word] || 0) + 1;
            }
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    }, [cards]);

    if (words.length === 0) return null;

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6 text-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Top Themes</h4>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {words.map(([word, count]) => {
                    const size = Math.min(1 + (count * 0.2), 2.5); // Scale font size
                    return (
                        <span key={word} style={{ fontSize: `${size}em` }} className="font-bold text-indigo-600/80">
                            {word}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

const KudosDashboard: React.FC<KudosDashboardProps> = ({ publicId, adminKey }) => {
    const [board, setBoard] = useState<KudosBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showPresentation, setShowPresentation] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Copy States
    const [copyState, setCopyState] = useState<string | null>(null);

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
        if (adminKey) setHasEntered(true);
        fetchBoard();
        const interval = setInterval(fetchBoard, 5000); 
        return () => clearInterval(interval);
    }, [publicId, adminKey]);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopyState(type);
        setTimeout(() => setCopyState(null), 2000);
        trackEvent('kudos_copy', { type });
    };

    const handleReaction = async (cardId: string, emoji: string) => {
        if (!board) return;
        // Optimistic update
        const updatedCards = board.cards.map(c => {
            if (c.id === cardId) {
                const newReactions = { ...c.reactions };
                newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                return { ...c, reactions: newReactions };
            }
            return c;
        });
        setBoard({ ...board, cards: updatedCards });
        await reactToCard(publicId, cardId, emoji);
    };

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        const element = document.getElementById('kudos-grid');
        if (element) {
            try {
                const canvas = await html2canvas(element, { scale: 1 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${board?.title.replace(/\s+/g, '_')}_Keepsake.pdf`);
                trackEvent('kudos_pdf_download');
            } catch (e) {
                alert("Failed to generate PDF.");
            }
        }
        setIsGeneratingPdf(false);
    };

    const handleShare = (type: 'email' | 'whatsapp') => {
        if (!board) return;
        const url = window.location.href.split('#')[0] + `#id=${publicId}`;
        const msg = `Join our Kudos Board: ${board.title}! Write a note here: ${url}`;
        if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        if (type === 'email') window.open(`mailto:?subject=${encodeURIComponent("Join Kudos Board: " + board.title)}&body=${encodeURIComponent(msg)}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;
    if (!board) return <div className="min-h-screen flex items-center justify-center text-slate-500">Board not found.</div>;

    const bgClass = THEME_STYLES[board.theme] || 'bg-slate-50';
    const shareLink = window.location.href.split('#')[0] + `#id=${publicId}`;
    const organizerLink = window.location.href;

    // Check Schedule
    const isLocked = board.scheduledReveal && new Date() < new Date(board.scheduledReveal) && !adminKey;
    const revealTime = board.scheduledReveal ? new Date(board.scheduledReveal) : null;

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
                    <button onClick={() => setHasEntered(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                         Enter Board
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-20 ${bgClass} transition-colors duration-500`}>
            {showPresentation && <KudosPresentation board={board} onClose={() => setShowPresentation(false)} />}
            {showEditor && <KudosEditor boardId={publicId} onClose={() => { setShowEditor(false); fetchBoard(); }} theme={board.theme} />}

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black font-serif text-slate-900">{board.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{board.cards.length} Kudos</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {adminKey && (
                            <>
                                <button onClick={handleDownloadPdf} className="p-2 rounded-lg border bg-white text-slate-600 hover:bg-slate-50" title="Export PDF">
                                    {isGeneratingPdf ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />}
                                </button>
                                <a href="https://www.ubereats.com/gift-cards" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border bg-white text-emerald-600 hover:bg-emerald-50" title="Buy Team Lunch">
                                    <Utensils size={20} />
                                </a>
                            </>
                        )}
                        <button onClick={() => setShowPresentation(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm transition-colors shadow-md">
                            <Play size={16} fill="currentColor" /> Slideshow
                        </button>
                        <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                            <Plus size={18} /> Add Kudos
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Admin Dashboard */}
                {adminKey && (
                    <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 justify-between">
                        <div className="flex-1 text-center md:text-left">
                             <div className="flex items-center justify-center md:justify-start gap-2 mb-1 text-amber-800 font-bold text-lg"><Lock size={20} /> Admin Controls</div>
                             <p className="text-amber-700/80 text-sm">Nudge the team: <button onClick={() => handleCopy("Hey team, we have " + board.cards.length + " kudos so far! Let's get those numbers up!", 'nudge')} className="underline font-bold">Copy Reminder Text</button></p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleCopy(organizerLink, 'org')} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-bold flex items-center gap-1">{copyState === 'org' ? <Check size={14}/> : <Copy size={14}/>} Admin Link</button>
                             <div className="flex items-center gap-1 bg-white p-1 rounded border border-amber-200">
                                 <button onClick={() => handleShare('whatsapp')} className="p-1.5 hover:bg-slate-100 rounded text-green-600"><MessageCircle size={16}/></button>
                                 <button onClick={() => handleShare('email')} className="p-1.5 hover:bg-slate-100 rounded text-red-600"><Mail size={16}/></button>
                                 <button onClick={() => handleCopy(shareLink, 'share')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Copy size={16}/></button>
                             </div>
                        </div>
                    </div>
                )}

                {/* Locked View for Guests */}
                {isLocked ? (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300">
                        <Lock size={48} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-600">The Board is Locked</h3>
                        <p className="text-slate-500 mt-2">Revealing on {revealTime?.toLocaleDateString()} at {revealTime?.toLocaleTimeString()}</p>
                        <p className="text-sm text-slate-400 mt-4">You can still add cards!</p>
                    </div>
                ) : (
                    <>
                        <WordCloud cards={board.cards} />
                        
                        {/* THE GRID */}
                        <div id="kudos-grid" className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                            {board.cards.map((card, index) => {
                                const colorClass = CARD_COLORS[index % CARD_COLORS.length];
                                return (
                                    <div key={card.id} className={`break-inside-avoid rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow relative overflow-hidden group ${colorClass}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">To: <span className="text-slate-800 text-sm">{card.to}</span></p>
                                        </div>
                                        
                                        <div className="text-slate-800 text-lg leading-relaxed mb-4 whitespace-pre-wrap font-medium font-serif">"{card.message}"</div>
                                        
                                        {card.gifUrl && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                                                <img src={card.gifUrl} alt="GIF" className="w-full h-auto" />
                                            </div>
                                        )}

                                        {card.giftLink && (
                                            <div className="mb-4 p-3 bg-white/80 backdrop-blur rounded-xl border border-indigo-100 flex items-center gap-3 cursor-pointer hover:bg-indigo-50 transition-all" onClick={() => window.open(card.giftLink, '_blank')}>
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><Gift size={16} /></div>
                                                <span className="text-xs font-bold text-indigo-700">Gift Attached!</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-end border-t pt-4 border-black/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">{card.from.charAt(0).toUpperCase()}</div>
                                                <div><span className="text-xs text-slate-400 block uppercase tracking-wider font-bold">From</span><span className="text-sm font-bold text-slate-700">{card.from}</span></div>
                                            </div>
                                            {/* Reactions */}
                                            <div className="flex gap-1">
                                                {['❤️','👏','🔥'].map(emoji => (
                                                    <button key={emoji} onClick={() => handleReaction(card.id, emoji)} className="text-sm hover:scale-125 transition-transform bg-white/50 hover:bg-white rounded-full px-2 py-1 border border-transparent hover:border-slate-200">
                                                        {emoji} <span className="text-xs text-slate-400 font-bold ml-0.5">{card.reactions?.[emoji] || 0}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                
                <div className="mt-12"><AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" /></div>
            </div>
        </div>
    );
};

export default KudosDashboard;