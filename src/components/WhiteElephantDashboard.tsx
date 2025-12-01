import React, { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../services/analyticsService';
import { getGameState, updateGameState, sendReaction } from '../services/whiteElephantService';
import type { WEGame, WEReaction } from '../types';
import Header from './Header';
import Footer from './Footer';
import { generateWETurnNumbersPdf, generateWEGameLogPdf } from '../services/pdfService';
import { RefreshCw, Play, History, Gift, RotateCcw, Download, Share2, Users, CheckCircle, Volume2, VolumeX, Copy, Lock, Smartphone, BarChart3, X, Image as ImageIcon, AlertTriangle, Trophy, Flame } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { shouldTrackByDefault } from '../utils/privacy';

// --- AUDIO SYSTEM ---
const playAudio = (type: 'open' | 'steal' | 'turn' | 'win' | 'start') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        
        if (type === 'open') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);
            osc.frequency.setValueAtTime(1046.50, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.start(now);
            osc.stop(now + 1.5);
        } else if (type === 'steal') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'start') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(880, now + 0.5);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
        } else if (type === 'win') {
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((f) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'triangle';
                o.frequency.value = f;
                o.connect(g);
                g.connect(ctx.destination);
                g.gain.setValueAtTime(0.1, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 2);
                o.start(now);
                o.stop(now + 2);
            });
            return;
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    } catch (e) { console.error("Audio play failed", e); }
};

// --- SUB-COMPONENTS ---

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fade-in-up z-[10000]">
        <CheckCircle size={18} className="text-green-400" />
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={16} /></button>
    </div>
);

const FloatingEmojis = ({ reactions }: { reactions: { id: string, emoji: string, x: number }[] }) => (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
        {reactions.map(r => (
            <div key={r.id} className="absolute bottom-0 text-5xl float-up-animation" style={{ left: `${r.x}%` }}>
                {r.emoji}
            </div>
        ))}
    </div>
);

const EventBadge = ({ text }: { text: string }) => {
    const t = text.toLowerCase();
    if (t.includes('stole')) return <span className="inline-block bg-red-100 text-red-800 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold mr-2 border border-red-200">Steal</span>;
    if (t.includes('opened')) return <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold mr-2 border border-emerald-200">Open</span>;
    if (t.includes('turn') || t.includes('round')) return <span className="inline-block bg-blue-100 text-blue-800 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold mr-2 border border-blue-200">Turn</span>;
    if (t.includes('start')) return <span className="inline-block bg-purple-100 text-purple-800 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold mr-2 border border-purple-200">Start</span>;
    return <span className="inline-block bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold mr-2 border border-slate-200">Info</span>;
};

const BigAnimationOverlay = ({ overlayMessage, onClose }: { overlayMessage: any, onClose: () => void }) => {
    if (!overlayMessage) return null;
    
    let icon = '🎁';
    let colorClass = 'border-emerald-500 text-emerald-600';
    
    if (overlayMessage.type === 'steal') {
        icon = '😈';
        colorClass = 'border-red-500 text-red-600';
    } else if (overlayMessage.type === 'start') {
        icon = '🚀';
        colorClass = 'border-blue-500 text-blue-600';
    }

    return (
        <div onClick={onClose} className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"></div>
            <div className={`relative bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 text-center transform transition-all scale-100 animate-bounce-in ${colorClass}`}>
                <div className="text-6xl md:text-8xl mb-4">{icon}</div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2 drop-shadow-sm">{overlayMessage.title}</h1>
                <p className="text-xl md:text-3xl font-bold text-slate-700">{overlayMessage.subtitle}</p>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const gameRef = useRef<WEGame | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
    const [organizerKey, setOrganizerKey] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    // UI State
    const [shortPlayerLink, setShortPlayerLink] = useState<string>('');
    const [shortOrganizerLink, setShortOrganizerLink] = useState<string>('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [overlayMessage, setOverlayMessage] = useState<{ title: string, subtitle: string, type: 'open' | 'steal' | 'start' } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [visibleReactions, setVisibleReactions] = useState<{ id: string, emoji: string, x: number }[]>([]);
    
    // Action Modals
    const [showStealModal, setShowStealModal] = useState(false);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    
    // Action Data
    const [openGiftDescription, setOpenGiftDescription] = useState('');
    const [stealTargetId, setStealTargetId] = useState<string>('');
    const [stealGift, setStealGift] = useState('');

    // Refs for polling and diffing
    const lastReactionCount = useRef(0);
    const lastReactionTime = useRef(0);
    const lastHistoryLen = useRef(0);
    const overlayTimeoutRef = useRef<number | null>(null);
    const hasCelebratedRef = useRef(false);
    const hasStartedRef = useRef(false);
    const pollInterval = useRef<number | null>(null);
    const lastManualUpdate = useRef<number>(0);
    const isUpdatingRef = useRef(false);

    const prevIsStartedRef = useRef<boolean | null>(null);
    const lastSeenHistoryLenRef = useRef<number>(0);
    const popupDebounceRef = useRef<number>(0);

    // Sync game state to ref
    useEffect(() => {
        gameRef.current = game;
    }, [game]);

    // --- INITIALIZATION ---
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const gId = params.get('gameId');
        const oKey = params.get('organizerKey');
        setGameId(gId);
        setOrganizerKey(oKey);

        if (gId) {
            fetchGame(gId);
            pollInterval.current = window.setInterval(() => fetchGame(gId), 1500);
            
            const currentBaseUrl = window.location.href.split('#')[0];
            const longPlayerLink = `${currentBaseUrl}#gameId=${gId}`;
            
            fetch('/.netlify/functions/create-short-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullUrl: longPlayerLink, uniqueKey: `we_player_${gId}` })
            }).then(res => res.json())
              .then(data => setShortPlayerLink(data.shortUrl || longPlayerLink))
              .catch(() => setShortPlayerLink(longPlayerLink));

            if (oKey) {
                const longOrgLink = `${currentBaseUrl}#gameId=${gId}&organizerKey=${oKey}`;
                fetch('/.netlify/functions/create-short-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullUrl: longOrgLink, uniqueKey: `we_org_${gId}` })
                }).then(res => res.json())
                  .then(data => { if (data.shortUrl) setShortOrganizerLink(data.shortUrl); })
                  .catch(err => console.error(err));
            }
            if (shouldTrackByDefault()) trackEvent('page_view', { page_title: 'White Elephant Dashboard' });
        } else {
            setError("No game ID found in URL.");
            setLoading(false);
        }
        return () => { if (pollInterval.current) window.clearInterval(pollInterval.current); };
    }, []);

    // --- GAME STATE MONITORING ---
    useEffect(() => {
        if (!game) return;

        if (game.isStarted && prevIsStartedRef.current === false) {
            showOverlay('start', "LET'S PLAY!", `${game.turnOrder[0]?.name || 'Player 1'} goes first!`);
        }
        prevIsStartedRef.current = game.isStarted;

        if (game.history.length > lastSeenHistoryLenRef.current) {
            const isFirstLoad = lastSeenHistoryLenRef.current === 0;
            const newEvents = game.history.slice(lastSeenHistoryLenRef.current);
            lastSeenHistoryLenRef.current = game.history.length;
            
            if (!isFirstLoad) {
                const now = Date.now();
                if (now - popupDebounceRef.current > 500) {
                    let eventToShow: string | null = null;
                    let eventType: 'open' | 'steal' | null = null;
                    
                    for (const event of newEvents) {
                        const lower = event.toLowerCase();
                        if (lower.includes('opened')) {
                            eventToShow = event;
                            eventType = 'open';
                            break;
                        } else if (lower.includes('stole') || lower.includes('swap')) {
                            eventToShow = event;
                            eventType = 'steal';
                            break;
                        }
                    }
                    
                    if (eventToShow && eventType) {
                        popupDebounceRef.current = now;
                        
                        if (eventType === 'open') {
                            if (soundEnabled) playAudio('open');
                            const match = eventToShow.match(/^(.*) opened \[(.*)\]!$/);
                            showOverlay('open', 'GIFT OPENED!', match ? `${match[1]} opened ${match[2]}` : eventToShow);
                        } else if (eventType === 'steal') {
                            if (soundEnabled) playAudio('steal');
                            const match = eventToShow.match(/^(.*) stole \[(.*)\] from (.*)!$/);
                            showOverlay('steal', 'STOLEN!', match ? `${match[1]} stole ${match[2]} from ${match[3]}` : eventToShow);
                        }
                    } else if (soundEnabled) {
                        playAudio('turn');
                    }
                }
            }
        }

        if (game.isFinished && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true;
            if (soundEnabled) playAudio('win');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } }), 500);
            setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } }), 500);
        }

        const reactions = game.reactions || [];
        if (reactions.length > lastReactionCount.current) {
            if (lastReactionCount.current !== 0) {
                const newReactions = reactions.slice(lastReactionCount.current);
                const newVisible = newReactions.map(r => ({ 
                    id: r.id || crypto.randomUUID(), 
                    emoji: r.emoji, 
                    x: Math.random() * 80 + 10 
                }));
                setVisibleReactions(prev => [...prev, ...newVisible]);
                setTimeout(() => setVisibleReactions(prev => 
                    prev.filter(p => !newVisible.find(n => n.id === p.id))
                ), 3000);
            }
            lastReactionCount.current = reactions.length;
        }
    }, [game, soundEnabled]);

    const showOverlay = (type: 'open' | 'steal' | 'start', title: string, subtitle: string) => {
        setOverlayMessage({ title, subtitle, type });
        if (soundEnabled) {
            if (type === 'start') playAudio('start');
        }
        
        if (overlayTimeoutRef.current) window.clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = window.setTimeout(() => { 
            setOverlayMessage(null); 
            overlayTimeoutRef.current = null; 
        }, 4000);
    };

    const fetchGame = async (id: string) => {
        if (Date.now() - lastManualUpdate.current < 2000 || isUpdatingRef.current) return;
        try {
            const data = await getGameState(id);
            if (data) {
                const prevGame = gameRef.current;
                if (!prevGame && data.isStarted) {
                    hasStartedRef.current = true;
                }
                setGame(data);
            }
            setLoading(false);
        } catch (err) { console.error("Failed to fetch game:", err); }
    };

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'log_open' | 'log_keep' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey) return;
        setIsActionLoading(true);
        isUpdatingRef.current = true;
        lastManualUpdate.current = Date.now();
        
        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            if (updatedGame) {
                const latestEvent = updatedGame.history[updatedGame.history.length - 1] || '';
                if (latestEvent && action !== 'start_game' && action !== 'end_game' && action !== 'undo' && action !== 'next_player') {
                    popupDebounceRef.current = Date.now();
                    
                    if (latestEvent.toLowerCase().includes('opened')) {
                        if (soundEnabled) playAudio('open');
                        const match = latestEvent.match(/^(.*) opened \[(.*)\]!$/);
                        showOverlay('open', 'GIFT OPENED!', match ? `${match[1]} opened ${match[2]}` : latestEvent);
                    } else if (latestEvent.toLowerCase().includes('stole') || latestEvent.toLowerCase().includes('swap')) {
                        if (soundEnabled) playAudio('steal');
                        const match = latestEvent.match(/^(.*) stole \[(.*)\] from (.*)!$/);
                        showOverlay('steal', 'STOLEN!', match ? `${match[1]} stole ${match[2]} from ${match[3]}` : latestEvent);
                    }
                }
                
                lastSeenHistoryLenRef.current = updatedGame.history.length;
                setGame(updatedGame);
                trackEvent(`we_action_${action}`);
            }
        } catch (err) { 
            showToast("Failed to update game. Check connection."); 
        } finally {
            setIsActionLoading(false);
            isUpdatingRef.current = false;
            setShowStealModal(false);
            setShowOpenModal(false);
            setShowEndGameModal(false);
            setOpenGiftDescription('');
            setStealGift('');
            setStealTargetId('');
        }
    };

    const handleReaction = (emoji: string) => {
        if (!gameId || Date.now() - lastReactionTime.current < 2000) return; 
        lastReactionTime.current = Date.now();
        
        const id = crypto.randomUUID();
        setVisibleReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
        setTimeout(() => setVisibleReactions(prev => prev.filter(r => r.id !== id)), 3000);
        
        sendReaction(gameId, emoji);
    };

    // --- SHAREABLE IMAGE GENERATOR ---
    const handleDownloadRecap = async () => {
        setIsGeneratingImage(true);
        // Use the dedicated hidden element that is formatted perfectly for social media
        const element = document.getElementById('social-recap-capture');
        
        if (element) {
            try {
                // Temporarily make it visible for capture, but keep it hidden from user view via z-index
                element.style.display = 'block';
                
                const canvas = await html2canvas(element, { 
                    scale: 2, // High res
                    useCORS: true, 
                    backgroundColor: null,
                    logging: false
                });
                
                // Hide it again
                element.style.display = 'none';

                const link = document.createElement('a');
                link.download = `White_Elephant_Recap.png`;
                link.href = canvas.toDataURL();
                link.click();
                trackEvent('we_download_recap');
            } catch (e) { 
                console.error("Image gen error:", e);
                showToast("Could not generate image"); 
            }
        }
        setIsGeneratingImage(false);
    };

    const showToast = (msg: string) => { 
        setToastMessage(msg); 
        setTimeout(() => setToastMessage(null), 3000); 
    };
    
    const copyToClipboard = (text: string) => { 
        navigator.clipboard.writeText(text).then(() => showToast("Link copied!")); 
    };

    const isOrganizer = !!organizerKey;
    const displacedPlayer = game?.displacedPlayerId 
        ? game.participants.find(p => p.id === game.displacedPlayerId) 
        : null;
    const currentTurnPlayer = game?.turnOrder[game.currentPlayerIndex];
    const activePlayer = displacedPlayer || currentTurnPlayer;
    
    const availableVictims = game ? game.participants.filter(p => {
        if (p.id === activePlayer?.id) return false;
        if (!game.giftState[p.id]) return false;
        
        if (game.finalRound) return true;

        const giftDesc = game.giftState[p.id];
        const steals = game.giftStealCounts?.[giftDesc] || 0;
        
        if (game.rules?.stealLimit && game.rules.stealLimit > 0 && steals >= game.rules.stealLimit) {
            return false;
        }

        if (game.displacedPlayerId && game.lastThiefId === p.id) {
            return false;
        }

        return true;
    }) : [];

    const canSteal = availableVictims.length > 0;

    // --- CALCULATE STATS FOR RECAP ---
    // Find the "Most Stolen Gift"
    const getMostStolenGift = () => {
        if (!game?.giftStealCounts) return null;
        let maxSteals = 0;
        let topGift = null;
        Object.entries(game.giftStealCounts).forEach(([giftName, count]) => {
            if (count > maxSteals) {
                maxSteals = count;
                topGift = giftName;
            }
        });
        return topGift ? { name: topGift, count: maxSteals } : null;
    };
    const mostStolen = getMostStolenGift();
    const totalSteals = game ? Object.values(game.giftStealCounts || {}).reduce((a, b) => a + b, 0) : 0;

    const handleLogOpen = () => {
        if (!activePlayer) return;
        const giftName = openGiftDescription || 'a Mystery Gift';
        trackEvent('we_gift_revealed', { gift_name: giftName });
        handleUpdate('log_open', { 
            entry: `${activePlayer.name} opened [${giftName}]!`, 
            actorId: activePlayer.id, 
            gift: giftName 
        });
    };

    const handleLogSteal = () => {
        if (!stealTargetId || !stealGift) return;
        const thief = activePlayer;
        const victim = game?.participants.find(p => p.id === stealTargetId);
        if (!thief || !victim) return;
        
        handleUpdate('log_steal', { 
            entry: `${thief.name} stole [${stealGift}] from ${victim.name}!`, 
            thiefId: thief.id, 
            victimId: victim.id, 
            gift: stealGift 
        });
    };

    const handleLogKeep = () => {
        handleUpdate('log_keep');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold animate-pulse">Loading Game...</div>;
    if (!game) return <div className="min-h-screen flex items-center justify-center text-slate-500">Game not found.</div>;

    const fullOrganizerLink = `${window.location.href.split('#')[0]}#gameId=${gameId}&organizerKey=${organizerKey}`;
    const displayOrganizerLink = shortOrganizerLink || fullOrganizerLink;
    const displayPlayerLink = shortPlayerLink || `${window.location.href.split('#')[0]}#gameId=${gameId}`;

    return (
        <div className="bg-slate-50 min-h-screen pb-28">
            {/* STYLES */}
            <style>{`
                @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 10% { opacity: 1; transform: translateY(-20px) scale(1.2); } 100% { transform: translateY(-400px) scale(1); opacity: 0; } }
                .float-up-animation { animation: floatUp 3s ease-out forwards; position: absolute; pointer-events: none; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
                .animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}</style>

            {/* --- HIDDEN RECAP IMAGE TEMPLATE (FOR GENERATION ONLY) --- */}
            <div id="social-recap-capture" style={{ display: 'none', position: 'absolute', top: 0, left: '-9999px', width: '600px', zIndex: -1 }}>
                <div className="w-[600px] bg-gradient-to-br from-red-900 via-slate-900 to-slate-800 p-8 text-white font-sans min-h-[800px] flex flex-col border-[12px] border-yellow-500/80 relative">
                    {/* Header */}
                    <div className="text-center border-b border-white/20 pb-6 mb-6">
                        <h2 className="text-2xl font-bold text-yellow-400 tracking-widest uppercase mb-2">Official Recap</h2>
                        <h1 className="text-5xl font-serif font-bold text-white mb-2 leading-tight">{game.groupName || 'White Elephant Party'}</h1>
                        <p className="text-slate-300 text-lg">{new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/10 p-4 rounded-xl text-center border border-white/10">
                            <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Total Steals</p>
                            <p className="text-4xl font-black text-white">{totalSteals}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-xl text-center border border-white/10">
                            <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Most Stolen Gift</p>
                            <p className="text-xl font-bold text-white truncate px-2 leading-tight mt-1">
                                {mostStolen ? mostStolen.name : 'None'}
                            </p>
                            {mostStolen && <p className="text-xs text-slate-400 mt-1">Stolen {mostStolen.count} times!</p>}
                        </div>
                    </div>

                    {/* The Grid - DYNAMIC HEIGHT AND TEXT WRAPPING */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 flex-grow">
                        <h3 className="text-center text-xl font-bold mb-6 flex items-center justify-center gap-2">
                            <Gift size={24} className="text-red-400" /> Final Results
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            {game.turnOrder.map((p, i) => (
                                <div key={p.id} className="flex items-start gap-3 border-b border-white/5 pb-3">
                                    <span className="w-6 h-6 bg-yellow-500 text-slate-900 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-slate-200 leading-snug break-words">{p.name}</p>
                                        <p className="text-xs text-emerald-400 mt-0.5 leading-snug break-words">{game.giftState[p.id] || 'No Gift'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 text-center">
                        <p className="text-slate-400 text-sm font-medium">Create your own for free at</p>
                        <p className="text-2xl font-bold text-white">SecretSantaMatch.com</p>
                    </div>
                </div>
            </div>
            {/* --- END HIDDEN TEMPLATE --- */}

            {/* OVERLAYS */}
            <BigAnimationOverlay overlayMessage={overlayMessage} onClose={() => setOverlayMessage(null)} />
            <FloatingEmojis reactions={visibleReactions} />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            
            <Header />
            
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                
                {/* ORGANIZER CONTROL PANEL */}
                {isOrganizer && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                        <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
                                    <Lock size={18} /> Organizer Master Key
                                </div>
                                <p className="text-amber-700 text-sm mb-4">
                                    Private control panel. <span className="font-extrabold underline">Do not share</span>.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-amber-200">
                                <input type="text" readOnly value={displayOrganizerLink} className="flex-1 text-xs text-slate-500 truncate outline-none" />
                                <button onClick={() => copyToClipboard(displayOrganizerLink)} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-xs font-bold flex items-center gap-1">
                                    <Copy size={14}/> Copy
                                </button>
                            </div>
                        </div>
                        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 font-bold text-lg text-indigo-100">
                                    <Smartphone size={22} /> Player Dashboard Link
                                </div>
                                <p className="text-indigo-100 text-sm mb-4 opacity-90">
                                    Share screen or send this link to participants.
                                </p>
                                <div className="flex items-center gap-2 bg-indigo-800/50 p-2 rounded border border-indigo-400/30">
                                    <input type="text" readOnly value={displayPlayerLink} className="flex-1 text-xs text-indigo-200 bg-transparent truncate outline-none font-mono" />
                                    <button onClick={() => copyToClipboard(displayPlayerLink)} className="p-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Share2 size={14}/> Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DASHBOARD HEADER */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 font-serif">
                                {game.groupName || 'White Elephant Party'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${game.isFinished ? 'bg-red-100 text-red-700' : game.isStarted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    <span className={`w-2 h-2 rounded-full ${game.isFinished ? 'bg-red-500' : game.isStarted ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
                                    {game.isFinished ? 'Game Over' : game.isStarted ? 'Live Game' : 'Waiting...'}
                                </span>
                                <button 
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${soundEnabled ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    {soundEnabled ? 'Sound On' : 'Sound'}
                                </button>
                            </div>
                        </div>
                        {isOrganizer && (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => generateWETurnNumbersPdf(game.participants.length)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border font-semibold text-sm flex items-center gap-2">
                                    <Download size={16} /> Turn #s
                                </button>
                                <button onClick={() => generateWEGameLogPdf(game.history, game.participants, game.giftState, game.groupName, game.eventDetails)} className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg border font-semibold text-sm flex items-center gap-2">
                                    <BarChart3 size={16} /> Summary
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT: Turn Order */}
                    <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[500px]">
                            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <Users className="text-slate-400" size={18} /> Turn Order
                                </h3>
                                <span className="text-xs font-bold text-slate-400 uppercase">{game.participants.length} Players</span>
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                {game.turnOrder.map((p, i) => {
                                    const isCurrent = p.id === activePlayer?.id && !game.isFinished && game.isStarted;
                                    const hasGone = i < game.currentPlayerIndex || game.isFinished;
                                    const gift = game.giftState[p.id];
                                    const isDisplaced = p.id === game.displacedPlayerId;
                                    
                                    return (
                                        <div key={p.id} className={`relative p-3 rounded-xl border transition-all duration-300 ${isCurrent ? 'bg-blue-50 border-blue-400 shadow-md scale-[1.02]' : 'bg-white border-slate-100'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isCurrent ? 'bg-blue-600 text-white' : hasGone ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`font-bold truncate ${isCurrent ? 'text-blue-800 text-lg' : 'text-slate-700'}`}>
                                                            {p.name}
                                                        </p>
                                                        {hasGone && !isDisplaced && <CheckCircle size={16} className="text-emerald-500 ml-2 flex-shrink-0" />}
                                                        {isDisplaced && <AlertTriangle size={16} className="text-amber-500 ml-2 flex-shrink-0" />}
                                                    </div>
                                                    {gift && (
                                                        <div className="mt-1 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold w-fit">
                                                            <Gift size={12} /> {gift}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isCurrent && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-full"></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Active Game Area */}
                    <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
                        
                        {/* Big Active Card */}
                        <div className="bg-white rounded-3xl shadow-xl border-2 border-indigo-100 overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-full h-2 ${game.finalRound ? 'bg-purple-500' : game.isFinished ? 'bg-slate-400' : game.displacedPlayerId ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}></div>
                            
                            <div className="p-8 md:p-12 text-center relative">
                                
                                <div className="inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                                    {game.isFinished ? 'Game Summary' : game.finalRound ? 'FINAL ROUND' : game.displacedPlayerId ? 'Steal in Progress!' : `Turn ${game.currentPlayerIndex + 1}`}
                                </div>
                                
                                <h2 className="text-slate-400 text-lg md:text-xl font-medium mb-2">
                                    {game.isFinished ? 'The game has ended!' : game.isStarted ? 'It is currently' : 'Waiting for organizer...'}
                                </h2>
                                
                                <div className={`text-5xl md:text-7xl font-black font-serif mb-4 tracking-tight ${game.finalRound ? 'text-purple-600' : game.displacedPlayerId ? 'text-amber-600' : 'text-indigo-600'}`}>
                                    {game.isFinished ? 'All Done!' : game.isStarted ? `${activePlayer?.name}'s Turn!` : 'Not Started'}
                                </div>

                                {/* Final Round Decision Box - Visible to ALL users */}
                                {game.finalRound && !game.isFinished && (
                                     <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 mx-auto max-w-lg animate-fade-in-up">
                                        <div className="flex items-center justify-center gap-2 text-purple-800 font-bold text-lg mb-2">
                                            <Trophy size={20} /> The Final Decision
                                        </div>
                                        <p className="text-purple-700 text-sm mb-4">
                                            {activePlayer?.name} has the advantage! They must choose:
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex flex-col items-center justify-center">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Option 1</span>
                                                <span className="font-bold text-slate-700">Keep Gift</span>
                                                <span className="text-xs text-slate-500">Game Ends Immediately</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex flex-col items-center justify-center">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Option 2</span>
                                                <span className="font-bold text-slate-700">Swap Gift</span>
                                                <span className="text-xs text-slate-500">Trade with anyone</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Displaced Player Alert */}
                                {game.displacedPlayerId && !game.finalRound && !game.isFinished && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-full text-amber-800 font-bold text-sm mb-6 animate-pulse">
                                        <AlertTriangle size={16} />
                                        {activePlayer?.name} was stolen from and must act!
                                    </div>
                                )}

                                {/* Action Buttons (Organizer Only) */}
                                {isOrganizer && !game.isFinished && (
                                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                                        {!game.isStarted ? (
                                            <button 
                                                onClick={() => handleUpdate('start_game')}
                                                disabled={isActionLoading}
                                                className="py-4 px-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg text-xl flex items-center gap-3 transition-all transform hover:-translate-y-1"
                                            >
                                                Start The Game <Play fill="currentColor" />
                                            </button>
                                        ) : game.finalRound ? (
                                            // Final Round: Keep or Swap
                                            <>
                                                <button 
                                                    onClick={handleLogKeep}
                                                    disabled={isActionLoading}
                                                    className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                                                >
                                                    <Trophy size={20} /> Keep Gift
                                                </button>
                                                <button 
                                                    onClick={() => { setStealGift(''); setStealTargetId(''); setShowStealModal(true); }}
                                                    disabled={isActionLoading || !canSteal}
                                                    className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <RefreshCw size={20} /> Swap Gift
                                                </button>
                                            </>
                                        ) : (
                                            // Regular Round: Steal or Open
                                            <>
                                                <button 
                                                    onClick={() => { setStealGift(''); setStealTargetId(''); setShowStealModal(true); }}
                                                    disabled={isActionLoading || !canSteal}
                                                    className="py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <RefreshCw size={20} /> Steal Gift
                                                </button>
                                                <button 
                                                    onClick={() => { setOpenGiftDescription(''); setShowOpenModal(true); }}
                                                    disabled={isActionLoading}
                                                    className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                                                >
                                                    <Gift size={20} /> Open New Gift
                                                </button>
                                                
                                                {/* Show why Steal is disabled */}
                                                {!canSteal && game.displacedPlayerId && (
                                                    <p className="w-full text-center text-sm text-amber-600 mt-2">
                                                        No valid steal targets — {activePlayer?.name} must open a new gift.
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Final Results Card (Game Over) */}
                        {game.isFinished && (
                            <div className="space-y-4">
                                <div id="final-results-card" className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden text-white shadow-2xl">
                                    <div className="p-6 text-center border-b border-slate-700 relative overflow-hidden">
                                        {/* Header bg accent */}
                                        <div className="absolute inset-0 bg-white/5"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-2xl font-bold font-serif text-yellow-400 flex items-center justify-center gap-2">
                                                <Gift size={24} /> Final Gift Distribution
                                            </h2>
                                            <p className="text-slate-400 text-sm mt-1">{game.groupName || 'White Elephant Party'}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {game.participants.map((p, i) => (
                                            <div key={p.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
                                                <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0">{i + 1}</span>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-white block truncate">{p.name}</span>
                                                    <span className="text-emerald-400 text-sm font-medium truncate block">
                                                        {game.giftState[p.id] || <span className="text-slate-500 italic">No Gift</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-slate-950 text-center text-xs text-slate-500 border-t border-slate-800">
                                        Generated by SecretSantaMatch.com
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button onClick={handleDownloadRecap} disabled={isGeneratingImage} className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg disabled:opacity-50 transform hover:scale-105 transition-all">
                                        {isGeneratingImage ? <RefreshCw className="animate-spin" size={20} /> : <ImageIcon size={20} />} Download Beautiful Recap
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live Ticker */}
                        <div className="bg-white rounded-2xl shadow-sm border flex flex-col h-[400px]">
                            <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                                <History className="text-purple-500" /> 
                                <h3 className="font-bold text-slate-700">Live Ticker</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col-reverse">
                                {game.history.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 italic">
                                        Game events will appear here...
                                    </div>
                                )}
                                {game.history.map((entry, i) => (
                                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 animate-fade-in shadow-sm text-sm flex items-start gap-2">
                                        <EventBadge text={entry} />
                                        <span className="leading-snug py-0.5">{entry}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {isOrganizer && (
                            <div className="text-right">
                                <button onClick={() => setShowEndGameModal(true)} className="text-red-500 text-xs font-bold hover:underline opacity-60 hover:opacity-100">
                                    Force End Game
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* REACTION BAR */}
            {!game.isFinished && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200 rounded-full px-6 py-3 flex gap-4 items-center z-[500]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">React:</span>
                    {['😂', '🔥', '😱', '👏', '💀', '❤️'].map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => handleReaction(emoji)} 
                            className="text-2xl hover:scale-125 transition-transform active:scale-95 cursor-pointer leading-none"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Viewer Footer Promo */}
            {!isOrganizer && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-center z-[400]">
                    <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        🎁 Powered by <span className="font-bold">SecretSantaMatch.com</span> — Free gift exchange tools
                    </a>
                </div>
            )}

            <Footer />
            
            {/* --- MODALS --- */}
            
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4 text-emerald-600">
                            <Gift size={28} />
                            <h3 className="text-2xl font-bold font-serif">What did they open?</h3>
                        </div>
                        <p className="text-slate-500 text-sm mb-1">Player: <strong className="text-slate-800">{activePlayer?.name}</strong></p>
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder="e.g. Blue Bluetooth Speaker" 
                            value={openGiftDescription} 
                            onChange={e => setOpenGiftDescription(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleLogOpen()} 
                            className="w-full p-4 border-2 border-emerald-100 focus:border-emerald-500 rounded-xl text-lg mb-6 outline-none transition-colors bg-emerald-50/30"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowOpenModal(false)} className="px-5 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100">Cancel</button>
                            <button onClick={handleLogOpen} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg">Log Gift</button>
                        </div>
                    </div>
                </div>
            )}

            {showStealModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6 text-amber-600">
                            <RefreshCw size={28} />
                            <h3 className="text-2xl font-bold font-serif">{game.finalRound ? 'Final Swap' : 'Log a Steal'}</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Who is stealing?</label>
                                <div className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700">
                                    {activePlayer?.name}
                                </div>
                            </div>
                            <div className="flex justify-center text-slate-300"><div className="border-l-2 border-dashed h-6"></div></div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stealing FROM whom?</label>
                                <select 
                                    value={stealTargetId} 
                                    onChange={e => { setStealTargetId(e.target.value); setStealGift(game.giftState[e.target.value] || ''); }} 
                                    className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="">-- Select Victim --</option>
                                    {availableVictims.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Has: {game.giftState[p.id]})
                                            {(game.giftStealCounts?.[game.giftState[p.id]] || 0) > 0 && ` [Stolen ${game.giftStealCounts[game.giftState[p.id]]}x]`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {stealGift && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                                <span className="text-xs text-amber-600 font-bold uppercase">The Gift Being Stolen</span>
                                <div className="text-lg font-bold text-amber-900 mt-1">{stealGift}</div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowStealModal(false)} className="px-5 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100">Cancel</button>
                            <button onClick={handleLogSteal} disabled={!stealTargetId} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                                Confirm {game.finalRound ? 'Swap' : 'Steal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={showEndGameModal} 
                onClose={() => setShowEndGameModal(false)} 
                onConfirm={() => handleUpdate('end_game')} 
                title="End Game?" 
                message="This will mark the game as finished. You can't undo this." 
                confirmText="End Game" 
            />
        </div>
    );
};

export default WhiteElephantDashboard;