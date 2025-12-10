
import React, { useState, useEffect, useMemo } from 'react';
import { getKudosBoard, reactToCard } from '../services/kudosService';
import type { KudosBoard } from '../types';
import { Loader2, Plus, Play, Copy, Check, Gift, Lock, MessageCircle, Mail, Download, Heart, Utensils, X, Shield, Users } from 'lucide-react';
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

// Smarter word cloud generator
const WordCloud: React.FC<{ cards: any[] }> = ({ cards }) => {
    const words = useMemo(() => {
        const text = cards.map(c => c.message).join(' ').toLowerCase();
        
        // Expanded stop words list
        const stopWords = new Set([
            'the', 'and', 'a', 'to', 'for', 'is', 'in', 'of', 'you', 'your', 'with', 'that', 'it', 'on', 'are', 'so', 'this', 'always', 'how', 'really', 'very', 'much', 'great', 'good', 'thanks', 'thank', 'team', 'work', 'working', 'help', 'helping', 'from', 'been', 'have', 'has', 'will', 'what', 'when', 'where', 'who', 'about', 'just', 'more', 'some', 'like', 'time', 'make', 'made', 'thing', 'things', 'think', 'know', 'want', 'being', 'best', 'doing', 'does', 'also', 'into', 'them', 'they', 'their', 'there', 'here', 'were', 'would', 'could', 'should'
        ]);

        const counts: Record<string, number> = {};
        
        // Split by non-word characters
        const rawWords = text.replace(/[^\w\s]/g, '').split(/\s+/);
        
        rawWords.forEach(word => {
            // Filter out short words, stop words, and junk (repeating chars like "asdf" or "aaaa")
            if (
                word.length > 3 && 
                !stopWords.has(word) && 
                !/(.)\1{2,}/.test(word) && // Removes 'aaaaa'
                !/^[b-df-hj-np-tv-z]+$/.test(word) // Removes 'asdf' (consonant strings mostly)
            ) {
                counts[word] = (counts[word] || 0) + 1;
            }
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    }, [cards]);

    if (words.length === 0) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200 mb-8 text-center animate-fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Trending Topics</h4>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 items-baseline">
                {words.map(([word, count]) => {
                    const size = Math.min(1 + (count * 0.3), 3); // Scale font size
                    const opacity = Math.min(0.5 + (count * 0.1), 1);
                    return (
                        <span key={word} style={{ fontSize: `${size}em`, opacity }} className="font-bold text-indigo-600 transition-all hover:scale-110 cursor-default">
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
    const [showAdminModal, setShowAdminModal] = useState(false);
    
    // Track user reactions locally to prevent spam
    const [userReactions, setUserReactions] = useState<Record<string, string[]>>({}); // { cardId: ['❤️', '🔥'] }
    
    // Copy States
    const [copyState, setCopyState] = useState<string | null>(null);

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
        if (adminKey) {
            setHasEntered(true);
            // Show admin modal on first load if not seen this session
            if (!sessionStorage.getItem(`kudos_admin_seen_${publicId}`)) {
                setShowAdminModal(true);
                sessionStorage.setItem(`kudos_admin_seen_${publicId}`, 'true');
            }
        }
        
        // Load local reactions history
        const storedReactions = localStorage.getItem(`kudos_reactions_${publicId}`);
        if (storedReactions) {
            try {
                setUserReactions(JSON.parse(storedReactions));
            } catch (e) {}
        }

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

        // Check limits
        const cardReactions = userReactions[cardId] || [];
        if (cardReactions.includes(emoji)) return; // Already reacted with this emoji

        // Optimistic update UI
        const updatedCards = board.cards.map(c => {
            if (c.id === cardId) {
                const newReactions = { ...c.reactions };
                newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                return { ...c, reactions: newReactions };
            }
            return c;
        });
        setBoard({ ...board, cards: updatedCards });

        // Update local storage
        const newUserReactions = { ...userReactions, [cardId]: [...cardReactions, emoji] };
        setUserReactions(newUserReactions);
        localStorage.setItem(`kudos_reactions_${publicId}`, JSON.stringify(newUserReactions));

        // Send to backend
        await reactToCard(publicId, cardId, emoji);
        trackEvent('kudos_react', { emoji });
    };

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        const element = document.getElementById('kudos-grid');
        if (element) {
            try {
                const canvas = await html2canvas(element, { scale: 1, backgroundColor: '#ffffff' });
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
    const organizerLink = window.location.href; // Admin view has key in URL
    const nudgeText = `Hey team, we have ${board.cards.length} kudos so far! Let's keep the appreciation going! Link: ${shareLink}`;

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
            
            {/* ADMIN WELCOME MODAL */}
            {showAdminModal && adminKey && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={() => setShowAdminModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center">
                            <h2 className="text-2xl font-black font-serif">Organizer Kit</h2>
                            <p className="text-indigo-200 text-sm mt-1">Everything you need to run this board.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Admin Key */}
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <label className="flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-wide mb-2">
                                    <Lock size={14} /> Admin Master Key
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={organizerLink} className="flex-1 p-2 bg-white border border-amber-200 rounded text-xs text-slate-500 truncate font-mono" />
                                    <button onClick={() => handleCopy(organizerLink, 'modal_org')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow-sm transition-colors">
                                        {copyState === 'modal_org' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-xs text-amber-700 mt-2"><strong>Save this!</strong> It's the only way to manage the board later.</p>
                            </div>

                            {/* Invite Link */}
                            <div>
                                <label className="flex items-center gap-2 text-indigo-800 font-bold text-sm uppercase tracking-wide mb-2">
                                    <Users size={14} /> Invite Link (Public)
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={shareLink} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 truncate font-mono" />
                                    <button onClick={() => handleCopy(shareLink, 'modal_share')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-sm transition-colors">
                                        {copyState === 'modal_share' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Reminder Text */}
                            <div>
                                <label className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-wide mb-2">
                                    <MessageCircle size={14} /> Copy & Paste Invite
                                </label>
                                <div className="relative">
                                    <textarea readOnly value={nudgeText} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 h-24 resize-none focus:outline-none" />
                                    <button onClick={() => handleCopy(nudgeText, 'modal_nudge')} className="absolute bottom-2 right-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors">
                                        {copyState === 'modal_nudge' ? 'Copied' : 'Copy Text'}
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setShowAdminModal(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                                Got it, let's go!
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <button onClick={() => setShowAdminModal(true)} className="p-2 rounded-lg border bg-amber-50 text-amber-600 hover:bg-amber-100" title="Admin Tools">
                                    <Lock size={20} />
                                </button>
                                <button onClick={handleDownloadPdf} className="p-2 rounded-lg border bg-white text-slate-600 hover:bg-slate-50" title="Export PDF">
                                    {isGeneratingPdf ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />}
                                </button>
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
                                const hasReacted = userReactions[card.id]?.length > 0;
                                
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
                                                {['❤️','👏','🔥'].map(emoji => {
                                                    const alreadyClicked = userReactions[card.id]?.includes(emoji);
                                                    return (
                                                        <button 
                                                            key={emoji} 
                                                            onClick={() => handleReaction(card.id, emoji)} 
                                                            className={`text-sm transition-transform rounded-full px-2 py-1 border ${alreadyClicked ? 'bg-indigo-100 border-indigo-200 cursor-default' : 'bg-white/50 hover:bg-white border-transparent hover:border-slate-200 hover:scale-125'}`}
                                                            disabled={alreadyClicked}
                                                        >
                                                            {emoji} <span className="text-xs text-slate-500 font-bold ml-0.5">{card.reactions?.[emoji] || 0}</span>
                                                        </button>
                                                    );
                                                })}
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
